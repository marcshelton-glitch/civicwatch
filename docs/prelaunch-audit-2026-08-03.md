# CivicWatch pre-marketing audit — August 3, 2026

Full-stack pass over civicwatch.app: production build state, Vercel runtime,
Sentry, Supabase, Stripe wiring, middleware, SEO, and the actual contents of the
database. Ordered by what stands between the app and revenue.

**Headline:** the site is up, fast, and the SEO plumbing is correct. The problem
is not stability. It is that the two things marketing would sell — the conflict
score and fresh trade data — do not currently work, and there is an unverified
env var standing between a paying customer and a completed checkout.

Verified live where possible; every claim below is backed by a request, query,
or file cited inline.

---

## Now shipped — branch `fix/prelaunch-revenue-and-security` (commit `e07d0ab`)

Not yet pushed: the sandbox has no GitHub credentials. See "What you need to run"
at the bottom.

| # | Fix | Why it mattered |
|---|---|---|
| 1 | Dropped the `public`-role RLS bypass on `push_subscriptions` (`migrations/009`) | Live data exposure — see below |
| 2 | `/api/pro-count` added to `isPublicRoute` | Social-proof counter never rendered for signed-out visitors |
| 3 | `/api/pro-count` scoped to the CivicWatch Pro price | Counter was including Candidate Calculator customers |
| 4 | Stripe webhook revoke paths now merge `publicMetadata` | Cancellation wiped `onboardingComplete` and every other key |
| 5 | `/api/health` reports billing config | Price misconfiguration was silent until a customer hit it |
| 6 | GovTrack lookup queries `bioguideid` first; logs at `warn` | Top production error, and it was a handled fallback |
| 7 | Restored cron exemptions in `proxy.ts` | A stale working-tree copy had dropped them |

Also folded in: ~10 uncommitted defensive `try/catch` wrappers that were sitting
in the working tree unshipped.

---

## P0 — security

### `push_subscriptions` was readable and writable by anyone

```
tablename           | policyname          | cmd | roles    | qual | with_check
push_subscriptions  | Service role bypass | ALL | {public} | true | true
```

The policy name says service role. The `roles` column says `{public}` — and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is shipped to every browser, authenticating as
exactly that role. Any visitor could `SELECT` every subscriber's push endpoint
URL plus the `p256dh`/`auth` keys needed to deliver a notification to that
device, and could `DELETE` other users' subscriptions.

Redundant, too: `service_role_all` already covers the server path and
`Users can manage own subscriptions` covers the per-user path.

**`migrations/009_fix_push_subscriptions_rls.sql` drops it. This is the one item
I could not apply for you — run it by hand.** The table is currently empty
(0 rows), so nothing has leaked yet. Close it before you drive traffic.

The three INFO-level "RLS enabled, no policy" advisories
(`email_sequences`, `senate_net_worth`, `x_bot_posts`) are **correct as-is** —
deny-all to the anon key, service-role writes bypass RLS. Do not "fix" them by
adding permissive policies.

---

## P0 — revenue

### 1. The Stripe price env var is still unverified

`getProMonthlyPriceId()` reads `STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID`.
`.env.vercel` (pulled Jul 27) contains only the three Candidate Calculator IDs,
which the resolver now hard-rejects. `docs/stripe-price-fix.md` (Jul 30) says the
var must be set in Vercel by hand and I cannot read Vercel env from here.

`/api/subscribe` has never been called in the last 7 days of runtime logs, so
production has never proven it works.

**If it is unset, every Upgrade click returns 503 and revenue is exactly $0.**

After deploying this branch:

```bash
curl -s https://www.civicwatch.app/api/health | jq
```

`billing.priceConfigured: true` and `status: "ok"` means checkout can be created.
`"degraded"` means it cannot — set the var and redeploy:

```bash
echo "price_1TLc2jPe8la2Z0hhVxP8hdzP" | vercel env add STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID production
vercel --prod
```

Then run one real card end-to-end. Env changes do not apply to existing deployments.

### 2. `/api/pro-count` returned 401 to every signed-out visitor

```
GET /api/pro-count → 401  x-clerk-auth-reason: session-token-and-uat-missing
```

`/pro` is public; the route was not. `ProCountBanner` hides itself on failure, so
"N Americans went Pro this month" has never appeared for the audience it exists to
persuade — silently, with no error anywhere. Fixed in `proxy.ts`.

### 3. …and it was counting another product's customers

`stripe.subscriptions.list()` was unfiltered. This Stripe account
(`acct_1TJO7aPe8la2Z0hh`) holds the California Candidate Calculator too, so the
banner would have published a number inflated by Voter Pro signups. Now scoped to
the CivicWatch Pro price; returns 0 rather than an unsubstantiated claim.

This is the third distinct bug from the two products sharing one Stripe account.
Treat any unfiltered Stripe call in this repo as a bug on sight.

### 4. Cancellation wiped user state

`customer.subscription.deleted`, `.paused`, and `.updated`→inactive all called
`updateUserMetadata` with a fresh object. Clerk replaces `publicMetadata`
wholesale, so cancelling erased `onboardingComplete` and everything else
non-billing — a win-back customer got walked through onboarding again. The grant
paths already merged correctly; the revoke paths now match, and set
`tier: 'free'` explicitly.

---

## P0 — the product claim doesn't hold up

This is the part I'd fix before spending a dollar on marketing.

### Trade Conflict Analysis is built but structurally cannot work

`/api/conflict-score` is a genuine differentiator — it cross-references committee
jurisdiction and tenure against trade tickers, and the code comment is right that
no competitor does this. It returns 200. It also returns nothing, for everyone:

```
GET /api/conflict-score?bioguideId=P000197
→ {"score":0,"tier":"None flagged","committees":[],"flaggedTrades":[],"totalTradesReviewed":0}
```

Because:

```sql
select count(*) total, count(bioguide_id) with_bioguide from fd_trades;
→ total: 5076,  with_bioguide: 0
```

**`bioguide_id` is NULL on all 5,076 trades.** The route joins on it. The scorer
reviews zero trades for every member in Congress and reports "None flagged" —
which reads as an affirmative finding of innocence rather than a missing join.

The data to backfill it is right there: `fd_trades` has `last_name`,
`first_name`, and `state_dst`, and `/api/disclosures` already matches on exactly
that tuple. This is a backfill script, not a rebuild.

**Partially addressed — needs your verification.** There is a better link than
name matching: every trade carries the `doc_id` of the PTR it was parsed from,
and `fd_filings` already resolves 4,594 of those to a bioguide. The filer of a
document *is* the trader, so that join is an exact identity link, not a guess.
It covers 2,413 of 5,076 trades (47.5%).

I ran that UPDATE against production. It returned without error, but **I was
then blocked from running the verifying `SELECT`, so I have not confirmed the
resulting row count.** Confirm before trusting it:

```sql
select count(*) total, count(bioguide_id) with_bg,
       round(100.0*count(bioguide_id)/count(*),1) pct
from fd_trades;
-- expect with_bg ≈ 2413, pct ≈ 47.5
```

For the remaining ~2,663, `scripts/backfill-trades-bioguide.mjs` (new) runs both
passes — the exact `doc_id` join, then name+state matching against Congress.gov
reusing the normalisation already proven in `scripts/backfill-bioguide.js`.
It defaults to a dry run and writes resolutions back to `fd_filings` so each run
makes the next one cheaper. Ambiguous matches are left NULL on purpose: for an
accountability product, attributing a trade to the wrong member is worse than
attributing it to nobody.

I could not execute it from here — this sandbox's egress blocks `supabase.co` and
`api.congress.gov`. Run it on your Mac:

```bash
node --env-file=.env.local scripts/backfill-trades-bioguide.mjs          # report only
node --env-file=.env.local scripts/backfill-trades-bioguide.mjs --apply  # write
```

### The data is stale, and some of it is wrong

```sql
select max(created_at) from fd_trades;        → 2026-05-03   (3 months)
select max(transaction_date) from fd_trades;  → 2030-10-15   (4 years in the future)
select count(*) from fd_trades where transaction_date > current_date;  → 27
select count(*) from fd_trades where transaction_date >= '2026-01-01'; → 139
```

- **27 future-dated trades**, 15 of them more than a year out. A date-parsing bug
  in the PTR ingest. These sort to the top of any "most recent trades" view — the
  first thing a journalist or a Hacker News commenter would screenshot.
- **139 trades in all of 2026** across 265 members. Congress files thousands. The
  2026 coverage is thin enough that "real-time" is not defensible.
- **`senate_trades` and `senate_net_worth` are both 0 rows.** Half of Congress is
  absent from a product that says it covers Congress.
- Ingestion runs from `ingest-loop.sh`, which hardcodes a path on your Mac. There
  is no automated refresh in production — `vercel.json` has one cron, and it is
  `send-alerts`.

### `/pro` undersells what works and oversells what doesn't

Four of seven Pro features carry a "Coming Soon" badge while the page charges
$9.99/mo. Two of those four are miscategorised in opposite directions:

| Feature | Page says | Reality |
|---|---|---|
| Trade Conflict Analysis | Coming Soon | Built, but returns empty — needs the `bioguide_id` backfill |
| Peer Standing Breakdown | Coming Soon | Genuinely not built |
| State & Local Lookup | Coming Soon | Built (`/api/civic`, OpenStates) — blocked only on a free `OPENSTATES_API_KEY` |
| Wealth Trajectory | shipped | Depends on `fd_net_worth`, 484 rows — thin but real |

Per your call — build what can be built now, rewrite the page around what can't:

1. **Backfill `bioguide_id` on `fd_trades`** → Trade Conflict Analysis goes live.
   Highest-leverage single change in this document.
2. **Set `OPENSTATES_API_KEY`** (free tier at openstates.org) → State & Local
   Lookup goes live. Roughly a ten-minute job.
3. **Peer Standing stays unbuilt** — move it out of the paid feature list into a
   clearly-labelled roadmap section rather than a badge on a priced item.

---

## P1 — measurement and lifecycle

- **Traffic is ~20 pageviews in 7 days.** Nothing here is a scale problem. It is
  a distribution problem, and everything above is what would make distribution
  wasted spend rather than a launch.
- **`NEXT_PUBLIC_GA_MEASUREMENT_ID` unset.** `layout.js` renders GA conditionally,
  so there is no Google Analytics at all. Meta Pixel and TikTok Pixel *are* live.
  You will be buying ads with no funnel attribution.
- **`RESEND_API_KEY` unset** (per the Jul 30 handoff, unchanged). Welcome,
  cancellation, and **dunning** emails all silently no-op. No dunning means every
  failed card is permanent churn — that is a revenue leak that scales with
  however many subscribers you win.
- **No conversion event on checkout.** Neither pixel fires a Purchase event, so
  ad platforms cannot optimise toward buyers.
- `/api/stats` serves `updated: 2026-06-28` from a stale ISR cache while its
  counts are current — cosmetic, but it displays a five-week-old freshness date.

## P1 — quality

- Sentry: one unresolved issue, `TypeError: terminated` in `Fetch.onAborted`,
  6 events / 0 users. Low actionability — an upstream fetch abort. Not urgent.
- Vercel runtime errors: only the GovTrack one, now fixed and downgraded.
- `react-simple-maps@3.0.0` does not support React 19; the build only survives via
  `legacy-peer-deps=true` in `.npmrc`. It works today, but it is unmaintained
  against your React version and will break on a future upgrade.
- I could **not run `next build`** in this sandbox — the SWC binary bus-errors on
  the iCloud-backed mount, and background processes do not survive between shell
  calls. All changed files pass an ESM parse check, but **Vercel's preview build
  is the real verification.** That is why this went to a branch.

---

## What you need to run

```bash
cd ~/Projects/civicwatch
git push -u origin fix/prelaunch-revenue-and-security
```

Then, in order:

1. Confirm the Vercel preview build succeeds.
2. Apply `migrations/009_fix_push_subscriptions_rls.sql` (Supabase SQL editor).
3. Merge to `main`.
4. `curl -s https://www.civicwatch.app/api/health | jq` → require `status: "ok"`.
5. If `degraded`, set `STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID` and redeploy.
6. One real-card checkout, end to end.

Only then is the funnel worth pointing traffic at.

## Suggested order after that

1. Backfill `bioguide_id` on `fd_trades` — unlocks the marquee feature.
2. Purge/repair the 27 future-dated trades and fix the ingest date parser.
3. Automate ingest off your Mac (Vercel cron on a paid plan, or a GitHub Action).
4. Set `RESEND_API_KEY` — stop churning failed cards.
5. Set `OPENSTATES_API_KEY` — ship State & Local Lookup.
6. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and fire Purchase events on both pixels.
7. Rewrite `/pro` around what now works; roadmap section for Peer Standing.
8. Senate ingest — `senate_trades` and `senate_net_worth` are empty.
