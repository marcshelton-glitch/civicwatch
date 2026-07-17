# CivicWatch — Project Reference

> **"Track the Power. Know the Truth."**  
> The first real-time civic intelligence platform for American voters.  
> Non-partisan · Built in the USA · [civicwatch.app](https://civicwatch.app)

**Status: LIVE** · Repo: `~/Projects/civicwatch` (GitHub: `marcshelton-glitch/civicwatch`) · Last updated: July 17, 2026

> ### ⚠️ Read this before trusting any "uncommitted work" note below
> **There are two clones of this repo.** `~/Projects/civicwatch` (this one, `~/civicwatch` symlinks here)
> is canonical and tracks `origin/main`. The old iCloud copy at
> `AI App Projects/CivicWatch` is a **stale, divergent clone** whose git root sits one level up,
> at `AI App Projects/` — it reports ~277 changes, most of them phantom deletions of files that
> merely moved.
>
> The July 8 build was written in the **iCloud** copy and never existed here, but the daily notes
> described it as "uncommitted in `~/civicwatch`". Every recovery command (`cd ~/civicwatch && git add
> app/api/conflict-score/...`) therefore failed on pathspec, and the work sat "blocked" for eight days
> over a path bug. It was ported and committed on July 16–17 (`59fa0e6`).
>
> **Do not treat the iCloud copy as a working tree.** It predates June 14 hardening, June 20 features,
> and the July 10 press fix in several files.

---

## ⚡ Daily Update — July 17, 2026

### 🎉 The July 8 build is committed. The eight-day blocker was a path bug.

- **Root cause:** the July 8 feature build never existed in this repo. It was written in the stale iCloud clone. The documented `git add app/api/conflict-score/...` could only ever fail. Nothing was lost, and no build was ever broken by the feature work.
- **Ported and committed** (`59fa0e6`) after a file-by-file drift review. The two copies had drifted **in both directions**, so shared files were merged, not copied — a blind copy would have deleted web push, the leaderboard rate limiter, the X-bot cron, and the July 10 press fix.
- **`npm run build` passes (exit 0)** — the first verified build since July 8.
- **Committee alerts AND legislation alerts are now real** — legislation alerts turned out to be implemented (live Congress.gov sponsored-bill lookups), not scaffolded. Feature Status updated.
- **Wallet Pro activation fixed** (`4629403`) — see below.

### 🔴 Correction to the July 16 entry: Apple Pay was NOT charging customers
The July 16 note claimed a live revenue leak. **That was wrong.** `PaymentRequestButton` is imported nowhere — `df3cf63` (a *logo* commit) removed it from `/pro` on **June 26**, four days before `7d1c8b9` deleted the `invoice.paid` handler on **June 30**. No customer was ever charged without receiving Pro. The bug is **latent**, not active.

The real finding: **wallet checkout was silently deleted from your pricing page by a logo commit and went unnoticed for three weeks.** The activation gap is fixed (`4629403`), so re-mounting the button is now safe — but it is still **not mounted**, and that's a product decision.

### Four build-breaking bugs found by actually running the build
All the same class the July 8 work fixed for Stripe — module-scope initialisers that crash `next build` during "Collecting page data" — in routes that pass never touched:
- `refund-list` — module-scope `createClient` (the only route in the codebase still doing this)
- `push/send` — unguarded `webpush.setVapidDetails`
- `subscribe-instant` — module-scope Stripe client, missed by the July 8 pass over its four siblings
- `/trades` — `useSearchParams()` with no Suspense boundary; failed prerendering

---

## ⚡ Daily Update — July 15–16, 2026

### Recent Work
- **📝 Documentation & SEO verification review** — Confirmed prior work on the /press page fix (commit `f7f6541`) and the sitemap / Search Console setup (July 10) are complete and live. No new coding changes committed July 15.
- **🔍 Competitive research follow-up** — Additional analysis of congressional trading platforms (House Stock Watcher, TraderCongress, Kapitol.ai, NANC/KRUZ ETFs) documented in competitive roadmap v2 (from July 13).
- **✅ June reconciliation closed (July 16)** — The open A/B/C reconciliation questions were verified against the repo and resolved. See *Reconciliation — Resolved* at the end of this file. **This surfaced a live revenue bug — see Critical Open Items.**

### Status Summary
- **✅ /press page** — Fixed, deployed (commit `f7f6541`), live at civicwatch.app/press
- **✅ SEO setup** — Sitemap live, robots.txt fixed (Clerk middleware 401 bug resolved), Search Console indexing verified
- **✅ June features confirmed live** — X bot, Apple Pay/Google Pay, exit-intent modal, AI gateway, AI code-review action are all committed and deployed (statuses now reflected in Feature Status)
- **🔴 Apple Pay / Google Pay does not grant Pro** — NEW, verified July 16. Customers are charged and receive nothing. See Critical Open Items.
- **⚠️ July 8 feature build** — Still uncommitted and blocking next deployment

---

## Founder

**Marc Nathaniel Shelton** — Founder & CEO  
Retired Marine Captain, 21 Years Service  
marc@civicwatch.app · marcshelton@gmail.com

---

## Mission

CivicWatch makes congressional financial activity visible, searchable, and shareable. Anyone — not just journalists or lobbyists — can see what their representatives are buying and selling in seconds. Non-partisan. No spin.

---

## Live Scale (June 2026)

- **39,000–40,000+** financial filings indexed
- **5,000+** STOCK Act trade records
- **535** members of Congress tracked
- Data updated **daily** — new disclosures within 24 hours of official filing
- **Launch target:** 1,000 Pro subscribers by **Election Day, November 5, 2026**

---

## Feature Status

| Feature | Tier | Status |
|---|---|---|
| Congressional Trading Tracker | Free | ✅ Live |
| Voting Record Database | Free | ✅ Live |
| District Map | Free | ✅ Live |
| Constitution Reference | Free | ✅ Live |
| Congressional Trading Leaderboard | Free | ✅ Live |
| Member biography & district info | Free | ✅ Live |
| Press page (/press) | Free | ✅ Live |
| Track My Rep™ Alerts | Sign-In | ✅ Live |
| Browser push notifications | Sign-In | ✅ Live (web-push via Service Worker) |
| My Representatives dashboard | Sign-In | ✅ Live |
| Community polling | Sign-In | ✅ Live |
| Wealth & Net Worth Timeline | Pro | ✅ Live (server-side Pro gate: 401/403) |
| AI Accountability Reports (Gemini) | Pro | ✅ Live (3 free previews/hr for signed-in) |
| Compare any two representatives | Pro | ✅ Live |
| Net Worth Alerts | Pro | ✅ Live (Resend, dedup via sent_alerts) |
| @CivicWatchAlerts X bot | — | ✅ Live — code (verified July 16: `app/api/alerts/x-bot/route.js` committed, `*/15` cron in `vercel.json`). ⚠️ Requires `TWITTER_*` Vercel env vars + `x_bot_posts` migration — **runtime unverified** |
| Apple Pay / Google Pay checkout | Pro | ⚠️ **Built, not mounted** — `PaymentRequestButton.js` is imported nowhere; `df3cf63` (logo commit) removed it from `/pro` on June 26. Unreachable, so **no customer was ever mischarged**. Activation gap fixed July 17 (`4629403`), so re-mounting is now safe — product decision |
| Exit-intent modal | Free | ✅ Live (verified July 16: `components/ExitIntentModal.js` committed) |
| AI gateway (spend tracking) | — | ✅ Live — code (verified July 16: `lib/ai-gateway.js` committed). ⚠️ `ai_usage` migration application **unverified** |
| AI code review GitHub Action | — | ✅ Live (verified July 16: `.github/workflows/ai-review.yml` committed) |
| Committee assignment alerts | Sign-In | ✅ Committed `59fa0e6` — ⚠️ needs `committee_snapshots` migration applied in Supabase + `CONGRESS_API_KEY` in Vercel, else no-ops |
| Sponsored legislation alerts | Sign-In | ✅ Committed `59fa0e6` — **was implemented, not scaffolded.** Fetches sponsored bills live from Congress.gov per tracked member; no `rep_legislation` table needed. ⚠️ Requires `CONGRESS_API_KEY` |
| Annual subscription tier | — | 🔲 Planned |
| Trade Conflict Analysis | Pro | ✅ Committed `59fa0e6` (Conflict Score card + `/api/conflict-score`) — build verified |
| Ticker search / trade browsing (`/trades`) | Free | ✅ Committed `59fa0e6` — build verified (Suspense boundary added) |
| Live stock-ownership accountability report (`/accountability`) | Free | ✅ Committed `59fa0e6` — build verified |
| Return-on-trade data | Free | ✅ Committed `59fa0e6` (`lib/stockPrice.js`, wired into `/api/congress`) |
| Peer Standing | Pro | 🔲 Coming Soon |
| State & Local Lookup | Pro | 🔲 Coming Soon |

---

## ⚡ Recent Work

### 2026-07-16 — June Reconciliation Resolved + Live Stripe Bug Found

- **Closed the June reconciliation block** by verifying each open question against the repo rather than deferring or deleting it. All five disputed features (X bot, Apple Pay, exit-intent modal, AI gateway, AI code-review action) are **committed** — the old GitHub copy was right and the newer file had simply lost the rows. Feature Status updated accordingly.
- **🔴 Found a live revenue bug while verifying Apple Pay.** Commit `7d1c8b9` ("harden Stripe checkout flow") removed the `case 'invoice.paid'` handler from `app/api/webhooks/stripe/route.js` — the only hook that granted Pro on the wallet path. Full detail in Critical Open Items. Not fixed; needs a decision.
- **Repo hygiene:** cleared three stale git locks (`.git/index.lock`, `.git/HEAD.lock`, `.git/objects/maintenance.lock`) left behind on July 10 at 02:30 when the `_push.py` daily run crashed mid-commit. They had been silently blocking every git write since. Committed `.gitignore` for `.serena/` (`53f1a42`).
- **⚠️ Note on the daily update task:** the July 15 automated run rewrote `CivicWatch.md` from 817 lines to 252, dropping the entire reference half of the document (Technology Stack, Data Sources, Site Routes, Business Model, Env Vars, Contacts, Key Commits, Complete Project History, Pre-Launch Audit) plus all June history — and deleted the reconciliation block's open questions without answering them. Restored from git and re-merged. **The task's summarization step needs review before the next run.**

---

### 2026-07-14 — SEO Verification & Build Fixes Complete

**SEO verification (continuation from July 10 sitemap work)**
- Sitemap.xml verified live at production (`https://www.civicwatch.app/sitemap.xml`)
- Google Search Console coverage analysis completed — **no action items**
  - Core pages (Home, Dashboard, About, Privacy, Data Deletion, Refund Policy) properly indexed ✅
  - 2 pages intentionally excluded by noindex (Sign Up, Terms) — expected behavior
  - 1 page with 401: `/opengraph-image` (behind-the-scenes thumbnail generator, not user-facing)
  - 1 page indexed without content: `clerk.civicwatch.app` (Clerk's own subdomain, optional cleanup only)
  - Some pages show "indexed without content" due to client-side data loading — normal for this architecture
- **Status:** Search Console health verified ✅; sitemap live and discoverable ✅

**Competitive roadmap v2 delivered** (supersedes July 8 v1)
- Expanded competitor set: House Stock Watcher, TraderCongress, Kapitol.ai, NANC/KRUZ congressional-trading ETF category
- Updated feature matrix: reflects 5 gaps closed + 2 net-new differentiators from July 8 build
- Phase 5–8 roadmap: next priority flagged as **distribution** (API, backlinks, content) rather than more features
- **File:** `CivicWatch_Competitive_Analysis_and_Roadmap_v2.docx` in project folder

---

### 2026-07-13 — Documentation Update & Build Verification

- **Competitive roadmap v2** — supersedes v1 from July 8, now includes SEO findings and competitive reanalysis
- **Build-related captures** — confirmed Stripe lazy-client factory pattern works in all four routes; SEO middleware 401 fix verified

---

### ⚠️ RATE LIMIT SNAPSHOT — July 10, 2026, ~3:15 PM PDT

**Session `local_ad241ba6-1f93-4544-a63a-30fda983c18d` (running automated daily update) hit rate limit.** Context preserved — work was in progress scanning all CivicWatch Cowork sessions to find new July 10 development activity. Transcripts reviewed confirm:
- No new CivicWatch.app coding sessions since July 10 started (only SEO/Search Console work from prior sessions, already captured in July 10 section below)
- July 8 late-night feature build (Conflict Score, `/trades`, `/accountability`, committee alerts) still uncommitted — **requires `npm run build` verification + Mac-side git commit/push** (see command block in July 9 section, lines 96–100)
- GitHub MCP connector confirmed unavailable in Cowork sessions (read-only file-picker only)

**Next action:** Run `npm run build` on Mac to verify Stripe fix clean, then execute git commit/push block.

### 2026-07-10 — SEO Setup, Search Console Analysis, GitHub Connector Notes

**SEO & Search Console**
- Created `sitemap.xml` and added to `public/` folder for automated Vercel deployment
- Added `Sitemap:` line to `public/robots.txt` for search engine discovery
- Submitted sitemap to Google Search Console and Bing Webmaster Tools
- **Indexing analysis:**
  - Core pages (Home, Dashboard, About, Privacy, Data Deletion, Refund Policy) properly indexed
  - 2 pages intentionally excluded: Sign Up page and Terms page (noindex tag — expected)
  - 1 page excluded: `/opengraph-image` (behind-the-scenes thumbnail gen, not a real page)
  - 1 page with 401 error: `clerk.civicwatch.app` (Clerk's subdomain, not a site page — low priority)
  - Some pages indexed without content due to client-side data loading (expected, not a bug)
  - Recommendation: eventually ask developer to block Clerk subdomain from indexing for tidiness

**GitHub Connector Troubleshooting**
- User attempted to connect GitHub MCP connector for write access (commit/push tools)
- Discovered "GitHub Integration" (file-picker) vs "GitHub Connector" (MCP tools) distinction
- Instructions provided for proper connector setup (Settings → Connectors → Engineering → GitHub)
- Note: Proper MCP access required for future code push automation

### 2026-07-09 — Automated Daily Update (completes the July 8 late-night build)
- **Catch-up: the "Congressional trading platforms analysis" session (flagged as still-running in yesterday's update) continued past the 9:14 PM snapshot and finished around 10:14 PM on July 8. Four things weren't captured yesterday:**
  1. **Build-blocking bug fixed.** `next build` was crashing on `app/api/pro-count/route.js` — the Stripe client was being constructed at module load time, which Next.js executes during "Collecting page data," before env vars are guaranteed available. The same bug existed in three sibling routes (`subscribe`, `billing-portal`, `webhooks/stripe`). All four converted to the lazy-factory pattern the Supabase routes already use. Syntax-verified only — this sandbox can't run a full `next build`, so Marc still needs to confirm with a local `npm run build` before pushing.
  2. **Major SEO/crawling bug found and fixed — likely the real explanation for civicwatch.app's near-zero organic traffic.** The Clerk middleware (`proxy.ts`) file-extension exclusion list was missing `.txt` and `.xml`, and neither `/robots.txt` nor `/sitemap.xml` was in the public-route allowlist — both were returning `401` to any unauthenticated visitor, including Googlebot. Confirmed live in production before the fix. Fixed the middleware, added `/refund-policy` to the allowlist (same bug), deleted a stale duplicate `public/sitemap.xml` that conflicted with the real dynamic `app/sitemap.js`, and added `/trades` + `/accountability` to the sitemap. Separately found `/api/og-image` is referenced in page metadata but was never built — social share preview images are currently broken; not fixed, flagged for a future session.
  3. **Competitive roadmap superseded — v2 delivered.** `CivicWatch_Competitive_Analysis_and_Roadmap_v2.docx` replaces the July 8 v1. Adds an expanded competitor set (House Stock Watcher, TraderCongress, Kapitol.ai, the NANC/KRUZ congressional-trading ETF category), an updated feature matrix reflecting the 5 gaps closed + 2 new differentiators from the July 8 build, the SEO finding above, and a Phase 5–8 roadmap — next priority flagged as **distribution** (API, backlinks, content) rather than more features.
  4. **GitHub connector — confirmed still not available to Cowork sessions.** Marc walked through Settings → Connectors → the "Engineering" plugin bundle looking for a working GitHub MCP connector; conclusion: the "GitHub Integration" visible in Claude Settings is the read-only file-picker (repo browsing only), not a read/write connector, and no working push-capable GitHub connector is currently granted to this account's Cowork sessions. All work continues to happen directly on local files — **nothing has been committed or pushed to GitHub.**
- **File mtimes confirm all four items above happened July 8, between ~8:49 PM and 10:14 PM** (last file touched: `CivicWatch_Competitive_Analysis_and_Roadmap_v2.docx` at 10:14 PM). No CivicWatch.app session activity has occurred yet today (July 9) as of this update — this entry is a same-day catch-up, not new July 9 work.
- **Uncommitted file list has grown.** In addition to the July 8 feature build (Conflict Score, `/trades`, `/accountability`, return-on-trade, committee alerts, `committee_snapshots` migration — see below), today's fixes touch: `proxy.ts`, `app/sitemap.js`, `app/refund-policy/page.js`, and the four Stripe routes (`app/api/pro-count/route.js`, `app/api/subscribe/route.js`, `app/api/billing-portal/route.js`, `app/api/webhooks/stripe/route.js`). `public/sitemap.xml` was deleted locally — if it was previously committed, the push also needs a `git rm`.
- **⚠️ Mac-side git commit/push still needed** (this sandbox has no `start_code_task` tool, no GitHub connector, and can't reach the Keychain). Run on the Mac — **run `npm run build` first to confirm the Stripe fix is clean**, then:
  ```bash
  cd ~/civicwatch && npm run build && git add \
    CivicWatch.md \
    app/api/conflict-score/route.js app/api/ticker-trades/route.js \
    app/trades/page.js app/trades/layout.js \
    app/api/accountability-stats/route.js app/accountability/page.js app/accountability/layout.js \
    app/api/congress/route.js app/api/leaderboard/route.js app/api/send-alerts/route.js \
    components/CivicWatch.jsx lib/stockPrice.js lib/committeeSectors.js \
    supabase/migrations/20260709000000_committee_snapshots.sql \
    proxy.ts app/sitemap.js app/refund-policy/page.js \
    app/api/pro-count/route.js app/api/subscribe/route.js app/api/billing-portal/route.js app/api/webhooks/stripe/route.js \
    && git add -A -- public/sitemap.xml \
    && git commit -m "feat: Conflict Score, /trades, /accountability, return-on-trade, committee alerts; fix Stripe build crash; fix SEO middleware 401 on robots.txt/sitemap.xml" \
    && python3 ~/civicwatch/_push.py
  ```
  Then in Supabase, apply `supabase/migrations/20260709000000_committee_snapshots.sql`.

### 2026-07-08 — Automated Daily Update (covers July 7–8)
- **Late evening (9:14 PM) — major feature build in progress, started after the 6:40 PM check-in.** Two new CivicWatch.app sessions:
  1. **Competitor analysis → feature build ("Congressional trading platforms analysis," still running as of this update).** Analyzed 6 competitor sites (Capitol Trades, QuiverQuant, InsiderFinance, Barchart, Unusual Whales, Campaign Legal Center PDF) against civicwatch.app and delivered `CivicWatch_Competitive_Analysis_and_Roadmap.docx`. Verdict: none of the six actually compete for CivicWatch's real audience — all are trading-edge tools for investors; none track votes, correlate trades to legislative activity, or help a citizen find their own rep. Flagged gaps worth closing (no return-on-trade data, no ticker search/leaderboard — table stakes on 5 of 6 competitor sites) and two differentiators nobody else has: a vote-trade **Conflict Score** (correlating committee assignments + floor votes + trade timing) and a live version of the Campaign Legal Center's static "% of Congress who own stock" report. Marc approved building all of it; the session connected to the live repo and began implementing. **New/changed files (not yet committed — repo file mtimes confirm, checked ~9:14 PM):**
     - `app/api/conflict-score/route.js` — new Conflict Score API
     - `app/api/ticker-trades/route.js` — new ticker search/trades-by-ticker API
     - `app/trades/page.js` + `app/trades/layout.js` — new `/trades` page (ticker search UI)
     - `app/api/accountability-stats/route.js` + `app/accountability/page.js` + `app/accountability/layout.js` — new `/accountability` page (live "% of Congress who own stock" report)
     - `app/api/congress/route.js` — enriched with return-since-disclosure data (House + Senate)
     - `app/api/leaderboard/route.js` — rank-card / chamber-badge updates
     - `app/api/send-alerts/route.js` — `sendCommitteeAlerts` stub replaced with a real implementation
     - `components/CivicWatch.jsx` — Conflict Score card inserted into the dashboard UI
     - `lib/stockPrice.js`, `lib/committeeSectors.js` — new helper libs (return-on-trade calc, committee/sector correlation for Conflict Score)
     - `supabase/migrations/20260709000000_committee_snapshots.sql` — new migration (committee snapshot data, supports Conflict Score + committee alerts)
     - `proxy.ts` (Clerk middleware) — route matcher updated, likely adding `/trades` and `/accountability` as public routes

     **Status: IN PROGRESS — not committed or pushed.** The session was still actively running (executing shell commands, likely build/verification) when this daily update ran, so this list may not be final. Next session should: run `git status` in `~/civicwatch` to get the authoritative file list, confirm the build is clean, apply the new Supabase migration, verify `/trades` and `/accountability` render correctly, then commit and push.
  2. **SEO / sitemap ("Civicwatch sitemap").** Added `public/sitemap.xml`, walked Marc through committing it via GitHub's web UI and submitting it in Google Search Console. Reviewed the resulting Search Console report — nothing broken: 2 pages excluded by noindex (Sign Up, Terms — intentional), 2 redirect entries (http→https, expected), a 401 on the auto-generated `/opengraph-image` (not a real page, low priority), and Clerk's own `clerk.civicwatch.app` subdomain indexed without content (optional cleanup only). No action items required.
- **End-of-day check (6:40 PM):** confirmed — no CivicWatch sessions or repo changes occurred after the morning update. The only session since ('Duplicate Cowork Projects') was an unrelated Cowork UI question. This entry fully covers July 8; the Mac-side git commit/push below is still pending.
- **No CivicWatch.app coding sessions found.** Reviewed all 62 visible Cowork sessions — the only session since the July 6 update ("Next steps") is unrelated to CivicWatch (a different mobile app project involving screen-recording detection / `photoLib.ts` — excluded per project separation rules). Repo file mtimes confirm no source changes: `app/`, `components/`, `lib/`, `hooks/`, `data/` all last touched July 4 or earlier.
- **Found but unattributed — new media assets (file mtimes show July 7, ~5:31–5:45 PM):** a new `CivicWatch Media Cards/` folder contains five finished social card pages — `CivicWatch — Find Yours.html`, `— The Receipt.html`, `— Trade Card.html`, `— Vote vs. Trade.html`, `— Wealth Curve.html` (polished renders of the 5 templates built July 4). Also new: `Media campaign/animated-find-yours.html` (animated variant) and a 1,529-line `Media campaign/civicwatch-brand-guide.html` brand style guide. No session in the visible Cowork list corresponds to this work, so there's no transcript to confirm who/what produced it or whether it's finished — flagging so the next session doesn't duplicate effort, and so Marc can confirm these are intentional/final.
- **Open items unchanged** — top priorities remain: adding `NEXT_PUBLIC_META_PIXEL_ID` + `NEXT_PUBLIC_TIKTOK_PIXEL_ID` to Vercel and pushing the pixel code, recording the founder POV video, confirming the @CivicWatchAlerts X bot status (one earlier session transcript notes it as already live with RLS enabled — worth verifying against this list, which still shows it unchecked), Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side git commit/push still needed** (this sandbox has no `start_code_task` tool and can't reach the Keychain). Run on the Mac:
  ```bash
  cd ~/civicwatch && git add CivicWatch.md "CivicWatch Media Cards" "Media campaign/animated-find-yours.html" "Media campaign/civicwatch-brand-guide.html" \
    && git commit -m "docs: daily update July 8 + new media card assets" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-07-06 — Automated Daily Update
- **No CivicWatch.app work today.** Reviewed all visible Cowork sessions — none had a `cwd` under the CivicWatch folder or a title referencing CivicWatch.app. The only CivicWatch-titled sessions in the recent list ("CivicWatch /press page fix" ×2) are from June 28 and are already reflected below (commit `f7f6541`). Repo file mtimes confirm no source changes today: `app/` and `components/` last touched July 4, `CivicWatch.md` itself last touched July 5.
- **Open items unchanged** — top priorities remain: adding `NEXT_PUBLIC_META_PIXEL_ID` + `NEXT_PUBLIC_TIKTOK_PIXEL_ID` to Vercel and pushing the pixel code, recording the founder POV video, confirming the @CivicWatchAlerts X bot status (one session transcript notes it as already live with RLS enabled — worth verifying against this Open Items list, which still shows it unchecked), Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side git commit/push still needed** (this sandbox has no `start_code_task` tool and can't reach the Keychain). Run on the Mac:
  ```bash
  cd ~/civicwatch && git add CivicWatch.md && git commit -m "docs: daily update July 6" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-07-05 — Automated Daily Update
- **No CivicWatch.app work today.** No CivicWatch source files changed.
- **Open items unchanged** — top priorities remain: Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side git commit/push still needed** (this sandbox has no `start_code_task` tool and can't reach the Keychain). Run on the Mac:
  ```bash
  cd ~/civicwatch && git add CivicWatch.md && git commit -m "docs: daily update July 5" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-07-04 — Marketing Build + Pixel Integration

- **Combined marketing strategy doc:** Reviewed and merged `CivicWatch_Marketing_Campaign_Brief.docx` + `CivicWatch Media Blitz Playbook.docx` into a single comprehensive strategy document: `Media campaign/CivicWatch_Marketing_Strategy_Combined.docx`
- **Gantt chart updated (`civicwatch-gantt.html`):** Fixed TODAY marker to use `new Date()` (dynamic), added Phase 7 "Media Blitz" with 32 tasks (IDs 129–160) covering full campaign arc — total task count now 160
- **5 social media image templates created** in `Media campaign/`:
  - `template-trade-card.html` — shareable trade disclosure card
  - `template-wealth-curve.html` — wealth growth timeline graphic
  - `template-vote-vs-trade.html` — vote vs. trade correlation visual
  - `template-receipt.html` — "receipt" style trade summary card
  - `template-find-yours.html` — "find your rep" call-to-action card
- **UTM tracking system built:**
  - `Media campaign/UTM_Tracking_Scheme.md` — 27 pre-built URLs, full naming conventions
  - `Media campaign/UTM_Link_Builder.xlsx` — Builder sheet + Campaign Library + Podcast Codes
- **Meta Pixel + TikTok Pixel (started):** `components/MetaPixel.jsx` and `components/TiktokPixel.jsx` created, gated on `NEXT_PUBLIC_META_PIXEL_ID` and `NEXT_PUBLIC_TIKTOK_PIXEL_ID` env vars — **not yet pushed to GitHub** (pending Vercel env var setup)
- **⚠️ Pixel code needs Vercel env vars + GitHub push** — after adding env vars, run on the Mac:
  ```bash
  cd ~/civicwatch && git add components/MetaPixel.jsx components/TiktokPixel.jsx app/layout.js \
    && git commit -m "feat: add Meta Pixel and TikTok Pixel tracking" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-07-03 — Automated Daily Update
- **No code shipped today.** Verified no CivicWatch source files changed (latest file mtimes remain June 30 / July 2; today's directory-mtime changes are iCloud sync noise only).
- **Open items unchanged** — top priorities remain: Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side git commit/push still needed** (this sandbox has no `start_code_task` tool and can't reach the Keychain). Run on the Mac:
  ```bash
  cd ~/civicwatch && git add CivicWatch.md && git commit -m "docs: daily update July 3" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-07-02 — Automated Daily Update
- No new CivicWatch coding sessions found today (July 2). The only session since yesterday's daily update was an unrelated "iOS/Android screenshot organizer app" session.
- **Open items unchanged** — top priorities remain: Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side git commit/push still needed** — the file is written to the repo root (`~/civicwatch` symlinks to the iCloud CivicWatch folder) and the iPhone-sync copy, but git commit/push must run on the Mac:
  ```bash
  cd ~/civicwatch && git add CivicWatch.md && git commit -m "docs: daily update July 2" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-07-01 — Automated Daily Update
- No new CivicWatch coding sessions found today (July 1). Checked all 48 visible Cowork sessions — the only session between this run and yesterday's daily update (June 30) was an unrelated "DrivPilot launch Gantt chart" session.
- **Open items unchanged** — top priorities remain: Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side sync still needed** — this task can write CivicWatch.md to the iCloud folder from the Cowork sandbox, but cannot reach `~/civicwatch`'s git repo or macOS Keychain to commit/push (no `start_code_task` tool available in this environment to delegate to a Mac-side session). Run on the Mac:
  ```bash
  cp "/Users/marcshelton/Library/Mobile Documents/com~apple~CloudDocs/AI/AI App Projects/CivicWatch/Civicwatch Markdown files/CivicWatch.md" ~/civicwatch/CivicWatch.md \
    && cd ~/civicwatch && git add CivicWatch.md && git commit -m "docs: daily update July 1" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-06-30 — Automated Daily Update
- No new CivicWatch coding sessions found today (June 30). Checked all visible Cowork sessions — most recent activity was yesterday's daily update run (June 29) and an unrelated "AI folder reorganization" session.
- **Open items unchanged** — top priorities remain: Vercel env vars for web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), the `push_subscriptions` Supabase migration, verifying `CONGRESS_API_KEY` in Vercel, the About page h1/Mission duplication fix, Refund Policy link on the homepage footer, `fd_net_worth.bioguide_id` SQL backfill (97 OCR rows), and finishing the `congress/route.js` caching layer.
- **⚠️ Mac-side sync still needed** — this task can write CivicWatch.md to the iCloud folder from the Cowork sandbox, but cannot reach `~/civicwatch`'s git repo or macOS Keychain to commit/push. Run on the Mac:
  ```bash
  cp "/Users/marcshelton/Library/Mobile Documents/com~apple~CloudDocs/AI/AI App Projects/CivicWatch/Civicwatch Markdown files/CivicWatch.md" ~/civicwatch/CivicWatch.md \
    && cd ~/civicwatch && git add CivicWatch.md && git commit -m "docs: daily update June 30" \
    && python3 ~/civicwatch/_push.py
  ```

### 2026-06-29 — Mobile UX, Compare Mode, Party Badges & Infrastructure
- **Mobile tabs fix:** Shortened tab labels to fit on one row on mobile (commit `d4adda2`)
- **Mobile tabs row split:** Split tabs into two rows for better mobile UX (commit `fd7c2dd`)
- **Compare mode fixes:** Fixed Total Trades = 0 bug; compare panel improvements (commits `fada9c7`, `3e89581`)
- **Party badge fixes:** Fixed incorrect/missing party badges on leaderboard for former members
- **Net worth improvements:** Debugging and improvements to net worth data display
- **CCPA/privacy improvements:** Added CCPA section and data deletion to Privacy Policy — closes pre-launch gap ✅
- **Fixed `~/civicwatch` symlink:** Was pointing to wrong iCloud path; now correctly points to `/Users/marcshelton/Library/Mobile Documents/com~apple~CloudDocs/AI/AI App Projects/CivicWatch`
- **Fixed scheduled task iCloud copy path:** Daily update was copying to `AI/Civicwatch/` (capital W) — fixed to `AI/civicwatch/` (lowercase) so iPhone copy now syncs correctly

### 2026-06-28 — Press Page Fix
- **Nav logo fixed:** Press page was still using old styled text ("CIVIC**WATCH**") instead of the real logo PNG — now uses `<Image src="/brand/logo_civicwatch_horizontal.png">` to match the rest of the site
- **Press contact email:** Changed all `support@civicwatch.app` → `press@civicwatch.app` on the /press page
- **Press kit section:** Replaced "📦 coming soon" placeholder with a real download grid of 5 brand PNGs (horizontal, stacked, gold, transparent icon, white icon) from existing `public/brand/` assets
- **Commit:** `f7f6541d7f8ec5776b89c3069e89fe30ebd774bc` pushed to GitHub via `_push.py`, Vercel auto-deployed

### 2026-06-13 — Automated Daily Update
- No new CivicWatch coding sessions today (June 13).
- **Open items unchanged** — top priority remains adding Vercel env vars for web push notifications (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`) and applying the `push_subscriptions` Supabase migration.
- **Reminder:** `bioguide_id` SQL backfill for 97 OCR `fd_net_worth` rows still needed, and `congress/route.js` caching layer is incomplete (15 return statements done, session hit 1M limit mid-way).
- **⚠️ GitHub push still Mac-side only** — iCloud copy and `_push.py` require running on the Mac; this automated task can write CivicWatch.md via Cowork folder connection but cannot push to GitHub from the Linux sandbox.

### 2026-06-12 — Automated Daily Update
- No new CivicWatch coding sessions today (June 11–12).
- **Rate limit:** Multiple daily update sessions hit rate limits and could not complete push to GitHub. File was still written to disk via Cowork folder connection.
- **P3 fixes push: ✅ Confirmed done** — Marc ran `_push.py` manually on June 8 (confirmed in session `a1af681f`). All 10 P3 QA fixes are live in the repo.
- **Still open:** VAPID env vars for web push notifications (4 vars), Supabase `push_subscriptions` migration, CCPA/GDPR named sections in Privacy Policy, About page h1 duplication, Refund Policy in homepage footer, bioguide_id SQL backfill, `congress/route.js` caching completion.
- **Top priority next session:** Add Vercel env vars for web push notifications (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`).

### 2026-06-11 — Automated Daily Update
- No new CivicWatch coding sessions.
- Daily update session hit rate limit and could not complete.

### 2026-06-10 — Automated Daily Update
- No new CivicWatch coding sessions today.
- **Reminder — still open:** 10 P3 QA fixes from June 5 — run `python3 ~/civicwatch/_push.py` if not yet pushed (check vs. commit `eeed1397`).
- **Screenshot blocker still open:** June 5 project continuation session stalled waiting on Marc's 11 screenshots (came through at 31px wide / unreadable). Re-share at full width to resume.
- **Priority next session:** Vercel env vars still need adding (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`) to activate web push notifications.

### 2026-06-09 — Automated Daily Update
- No new CivicWatch coding sessions today.
- **Reminder — still open:** 10 P3 QA fixes from June 5 need `python3 ~/civicwatch/_push.py` run if not yet pushed. Check commits vs. `eeed1397` to confirm.
- **Top priority for next session:** Re-share the 11 screenshots at full width (the June 5 project continuation session stalled because they came through at 31px wide / unreadable).

### 2026-06-08 — Automated Daily Update
- No new CivicWatch coding sessions today.
- **Infrastructure fix:** Connected `~/civicwatch` as a Cowork workspace folder — automated daily update task can now write directly to the repo (no more manual copy step).
- Updated task SKILL.md with new write approach via `mcp__cowork__request_cowork_directory`.

### 2026-06-07
- No new CivicWatch coding sessions.

---

## Complete Project History (March–June 2026)

### Phase 1: Core Build (March–April 2026)

Built from scratch. Core features established:
- Next.js 14 App Router project scaffolded
- Clerk auth integrated (Google, Facebook, Apple sign-in)
- Supabase database with RLS on all tables (project: `hgtofwsvbblumcgbqzat`)
- STOCK Act trade data pipeline from House Disclosure Portal (disclosures-clerk.house.gov)
- Congressional bio/photo data from Congress.gov API + bioguide.congress.gov
- Basic dashboard with Rep profile tabs: Bio, Trades, Votes, Wealth, Compare, Alerts
- Stripe subscription ($9.99/month Pro tier)
- Leaderboard page
- Privacy Policy, Terms of Service, Data Deletion pages

### Phase 2: Feature Depth + Data (April–Early May 2026)

Major features built out:

**Wealth Tab:**
- Real-time House Clerk filing history from disclosures-clerk.house.gov
- On-demand PTR (Periodic Transaction Report) trade parsing via OCR pipeline
- `fd_filings` table populated: 39,000–40,000+ records indexed
- `fd_net_worth` table: net worth estimates (319 source='fd' rows, 97 OCR rows)
- Net worth history chart with year-over-year timeline

**Votes Tab:**
- GovTrack ID extraction for all 535 members
- Voting records with year ranges (not Congress session numbers)
- 30+ records verified in QA

**District Map:**
- D3.js rewrite (commit `b821e8`)
- `geoMercator().fitExtent()` projection fix
- Party-colored district outlines (D=`#3B82F6`, R=`#EF4444`, I=`#F59E0B`)

**Bio + Compare pages:**
- Term dates with year spans
- Leadership roles
- Compare mode: side-by-side panel with search for second rep

**Constitution Tab:**
- Full text: Preamble, Articles I–VII, all 27 Amendments
- Plain-English explanations for each section
- Lightbox modal on section click

**Settings Panel:**
- Slide-in drawer with notification preferences
- `trackedReps` bug fixed (was not persisting correctly)

**About Page:**
- Rewritten with mission, data sources, how-it-works
- No duplicate h1 vs. mission section (was duplication of "Transparency is the foundation of democracy" — fixed)

**Privacy Policy:**
- Updated: AI provider changed from Anthropic/Claude → Google Gemini

**Party Colors Fix:**
- `resolveParty()` helper in `congress/route.js`
- PARTY_OVERRIDES map for bad Congress.gov data (e.g. Kevin Kiley was "Independent" per bad upstream data — overridden to Republican, commit `8874d0a2`)

### May 3, 2026 — Feature Polish Sprint

Last commit before this sprint: "Wealth tab: real-time House Clerk filing history + on-demand PTR trade parsing"

**Session work:**
- Coming Soon badges on Pro features not yet built
- AI Analysis tab: Pro-gated, Gemini attribution, 3 free previews/hr for signed-in users
- Alerts tab: tier badges added
- SettingsPanel: slide-in drawer
- `trackedReps` bug fixed
- "Federal" badge suppressed from rep cards
- Contact button: routes to official contact pages (not mailto for most reps), commit `9aa2cc`

### May 21, 2026 — Pre-Launch Audit + Parallel Fix Sprint

**Bug discovered:** Dashboard completely broken — tabs (My Reps, Alerts, Map, Search, Constitution) not responding, no numbers loading. Traced to React state timing bug in `fdNetWorth`:
- `fdNetWorth = null` → fetch hasn't run yet → was incorrectly showing "not available"
- `fdNetWorth = []` → fetch ran and found nothing → correct to show "no records" message
- Fix: `null` now renders nothing silently; only `[]` shows the informative message
- Commit: `2914578`

**Three parallel automated tasks run:**
1. Legal links, refund policy, public record disclaimer
2. SEO meta tags, OG image, Next.js `<Image>` audit
3. Edge case error handling (Supabase-down, search empty state, leaderboard failures)

**Press page created:** `/press` — press contact, key stats, press kit placeholder. Added to auth middleware so unauthenticated visitors (journalists) can reach it. Linked from footer.

**Stripe lapsed payment:** Already handled — webhook correctly sets `isPro: false` for `subscription.deleted`, `subscription.paused`, `subscription.updated` (non-active status).

**Google Analytics (GA4) added** alongside existing Vercel Analytics.

**Lang attribute:** `lang="en"` confirmed already set on `<html>` tag — no action needed.

**QA Audit Results (May 21):**

*🔴 Must fix before launch:*
1. Leaderboard party badges — 22/50 entries showing `?` (CONGRESS_API_KEY may not be set in Vercel env)
2. Delaney showing as active — left Congress 2021, no FORMER badge (bioguide not in DB)
3. Schiff net worth "not available" — Senate financial disclosures are separate system; fix: update copy to "House member disclosures only"

*🟡 Worth noting but not blockers:*
4. Press page "Download Press Kit" is placeholder — no files linked
5. Press contact is personal Gmail — consider press@civicwatch.app

### May 21–27, 2026 — Net Worth + Security + QA Sprint

**Wikidata → Wikipedia API net worth (commit `dfb533a`):**
- Old approach: Wikidata SPARQL with P2218 property — returned `null` for essentially all US Congress members
- New approach: Wikipedia API extracts net worth figures from article text
- Results: Pelosi $120M, Warren $8M, Cruz $3.1M (Sanders/AOC had nothing in article text)
- Converts 129 DISCLAIMER cases into actual estimates for well-known members

**Glassmorphism blur fix:**
- Added `-webkit-backdrop-filter: blur(12px)` alongside standard `backdropFilter` property
- Applied to onboarding overlay + two lock overlays in `CivicWatch.jsx`

**Net Worth API security fix — CRITICAL:**
- `/api/networth` previously had zero server-side auth — Pro blur was CSS-only (bypass risk)
- Fixed: now returns `401` for unauthenticated requests, `403` for signed-in non-Pro users
- Pro gate is now server-side

**bioguide_id backfill issue (discovered in audit):**
- 97 rows in `fd_net_worth` from OCR pipeline had `bioguide_id = null`
- API queries `.eq('bioguide_id', ...)` returned zero matches
- Fix: SQL backfill using name+state crosswalk from existing 319 source='fd' rows
- SQL: `UPDATE fd_net_worth nw SET bioguide_id = crosswalk.bioguide_id FROM (SELECT DISTINCT last_name, bioguide_id FROM fd_net_worth WHERE bioguide_id IS NOT NULL AND source = 'fd') crosswalk WHERE nw.bioguide_id IS NULL AND LOWER(nw.last_name) = LOWER(crosswalk.last_name)`

**36-turn push — all feature tier issues fixed:**
- Paywall: `/api/networth` server-side Pro gate (401/403)
- AI Analysis: dead code removed, preview button wired; signed-in non-Pro users see "Preview Analysis" with counter; guests see "Sign in to preview"; rate limit shows "Preview limit reached"
- Unauthenticated tracking: still works in-memory + dismissing toast "Sign in to save your tracked reps across sessions" (auto-clears 3s)
- Alerts cron: now reads `user_preferences` upfront, skips users with `alert_trades: false`
- Net worth alerts: queries `fd_net_worth` for new filings since last alert, deduplicates via `sent_alerts`, sends via Resend
- Committee + Legislation alerts: scaffolded with TODOs (waiting on `committee_assignments` table and `rep_legislation` table data layer)

**May 27 P1 fixes (after second QA audit):**

*P1 Bug 1 — Fake SSR ticker names (commit `b1e06263`):*
- `FALLBACK_TICKER` hardcoded demo names (Warren/Pelosi/Tuberville) were showing to crawlers and slow-load users
- Fixed: replaced with neutral loading messages ("Fetching live trade disclosures...", "Loading STOCK Act activity...")

*P1 Bug 2 — Kevin Kiley party badge (commit `8874d0a2`):*
- Congress.gov bad data: records Kiley as "Independent" (endYear: 2026 for Republican)
- Also wrong bioguide — was K000376 (Mike Kelly, PA), should be K000401
- Fix: `PARTY_OVERRIDES` map + `resolveParty()` helper in congress API route, applied to all three code paths

**P2 fixes run in parallel** (details in session transcripts)

### June 4–5, 2026 — Final Pre-Launch QA + Push Notification Build

**Pre-launch audit: 12 ✅ / 5 ⚠️ / 3 ❌**

See "Pre-Launch Audit Results" section below.

**Web Push Notification System built:**
- `public/sw.js` — service worker handles push events, notification clicks, install/activate
- `supabase/migrations/20260605000000_create_push_subscriptions.sql` — `push_subscriptions` table with RLS
- `app/api/push-subscribe/route.js` — saves subscription (Clerk auth required)
- `app/api/push-unsubscribe/route.js` — removes subscription
- `app/api/push-send/route.js` — internal send route (requires `x-civicwatch-secret` header)
- `lib/pushNotifications.js` — client utility: subscribe, unsubscribe, check permission, get subscription
- "Enable Notifications" toggle added to alerts tab in `CivicWatch.jsx`

**OG Image + Meta Tags redesign:**
- Commits: `8c0e938f` (OG image), `c6f85326` (meta tags)
- New title: **"CivicWatch — See What Congress Is Buying"**
- New description: "Your representatives are trading stocks with information you don't have. Track every trade, every vote, every dollar. Real-time congressional accountability — free."
- New OG image: two-column layout — left: provocative headline + stats; right: mock live trade card feed with BUY/SELL badges and blue CTA bar. Flag stripe at top.

**Social Media Icons added to footer (commit `eeed1397`):**
- Facebook: live → `facebook.com/CivicWatch.app` (opacity 0.7)
- Instagram, TikTok, X: coming soon (opacity 0.4, `pointerEvents: none`)

**10 QA P3 fixes (June 5 — needs `_push.py` run):**

| Fix | File | Details |
|---|---|---|
| FIX 1 | `congress/route.js` | Chamber from latest term — already correct, no change needed |
| FIX 2 | CSS | Mobile tabs: changed to `overflow-x: auto; flex-wrap: nowrap` with hidden scrollbar |
| FIX 3 | `congress/route.js` + `CivicWatch.jsx` | Compare panel "Total Trades" now pulls `fd_filings` count from DB, not `trades.length` |
| FIX 4 | `app/dashboard/page.js` | Default rep changed from Pelosi (`P000197`) → Ro Khanna (`K000395`) |
| FIX 5 | `CivicWatch.jsx` | `alert_committees` and `alert_legislation` now show `(Coming Soon)` italic + `opacity: 0.55 / cursor: not-allowed` |
| FIX 6 | — | Wealth blur already implemented at line 3147 — skipped |
| FIX 7 | `CivicWatch.jsx` | Alerts `useEffect` guard: `liveAlertsLoaded` ref ensures it fires only once per session |
| FIX 8 | `app/api/public-feed/route.js` | House trades query now selects `first_name, last_name`; display shows full name |
| FIX 9 | `CivicWatch.jsx` | AI attribution added: "Analysis generated by Google Gemini 2.5 Flash · For informational purposes only" |
| FIX 10 | `CivicWatch.jsx` | Alert frequency label changed: `'Instant'` → `'Same-day'` |

**Caching layer (partial — session hit 1M context limit mid-way):**
- In progress on `congress/route.js` (15 return statements added, not complete)
- Other routes completed before session ended

---

## Pre-Launch Audit Results (June 4, 2026)

**12 ✅ DONE · 5 ⚠️ PARTIAL · 3 ❌ NOT DONE**

### ✅ Done
- Leaderboard loads cleanly with 50 ranked entries
- Net worth is correctly Pro-gated server-side (401/403 responses)
- Privacy Policy exists — no mention of Anthropic/Claude; AI attributed to Google Gemini
- Representative photos render (bioguide.congress.gov proxy with congress.gov fallback)
- Bio tab shows term dates + leadership roles with year spans
- Non-Pro users see AI preview (3/hr) + Go Pro button — no "Unauthorized" error
- Overview tab shows Wealth & Trades box with filing counts
- Contact button label correctly reflects website vs. mailto
- Rep cards have colored party line at top (D=blue, R=red, I=gold)
- "Federal" label suppressed on rep cards
- Search works — photos appear in results
- Constitution tab has full text (Preamble, Articles I–VII, Amendments) with plain-English explanations
- Data Deletion page exists and loads with full instructions
- Terms of Service exists (17 sections, covers subscriptions, refunds, governing law = California)
- Go Pro page has detailed Free vs. Pro comparison grid
- `lang="en"` on `<html>` tag — confirmed

### ⚠️ Partial — Needs Attention
- **About page duplication:** "Transparency is the foundation of democracy" appears in both the `<h1>` and the Mission section body — fix the repetition
- **Refund Policy link:** present in dashboard footer, **missing from homepage marketing footer**
- **Press contact is personal Gmail** — consider press@civicwatch.app
- **Press kit placeholder** — no actual files linked on /press
- **CONGRESS_API_KEY** — verify it's set in Vercel env vars (affects leaderboard party badge enrichment)

### ❌ Not Done — Pre-Launch Gaps
- ~~**CCPA/GDPR named sections** in Privacy Policy~~ — ✅ Fixed June 29 (added CCPA section + data deletion)
- **"Do Not Sell My Personal Information" link** — missing from all footers (CCPA best practice)
- ~~**Social media links in footer**~~ — ✅ Fixed (added June 5, commit `eeed1397`)

---

## Technology Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js 14 | App Router |
| Auth | Clerk | Google, Facebook, Apple sign-in |
| Database | Supabase | RLS on all tables, project ID: `hgtofwsvbblumcgbqzat` |
| Payments | Stripe | ~$330 fees/mo at 1,000 Pro subs |
| Hosting | Vercel | Edge CDN |
| AI Engine | Google Gemini 2.5 Flash | AI accountability reports |
| Monitoring | Sentry | Error tracking |
| Analytics | Vercel Analytics + GA4 | Both active |
| Push Notifications | Web Push API + VAPID | Service worker at `public/sw.js` |
| Email | Resend | Alert notifications, net worth alerts |
| Uptime | Better Stack | Monitoring live and active |

---

## Data Sources

| Source | What It Provides |
|---|---|
| Congress.gov API | Biography, committee assignments, legislation — all 535 members |
| House Disclosure Portal (disclosures-clerk.house.gov) | Periodic Transaction Reports (PTRs) — House stock trades |
| Senate eFD (efdsearch.senate.gov) | Electronic Financial Disclosure — Senate members |
| FEC Campaign Finance | Campaign donor data |
| OpenSecrets | Wealth and net worth data |
| Wikipedia API | Net worth extraction from article text (Pelosi $120M, Warren $8M, Cruz $3.1M, etc.) |
| Bioguide | Member photos and biographical data |
| LegiScan (CC BY 4.0) | Legislation data |
| ProPublica Congress API | Supplemental congressional data |
| GovTrack | Voting records (GovTrack ID linked to bioguide) |

**Data accuracy note:** Displayed as filed. STOCK Act allows 45-day reporting window — trades may have occurred weeks before the filing date. Amendments are possible. CivicWatch does not independently verify individual filings.

**Known data issues:**
- Senate financial disclosures (eFD system) are separate from House system — Senate member net worth shows "House member disclosures only" message
- Congress.gov has occasional bad party data (e.g. Kevin Kiley `K000401` — overridden via PARTY_OVERRIDES map in congress route)
- bioguide_id was not backfilled into OCR-sourced `fd_net_worth` rows — SQL backfill needed (see above)

---

## Push Pattern for GitHub

As of the **July 2026 repo cleanup**, CivicWatch uses **normal git**. The canonical clone at
`~/Projects/civicwatch` has a working GitHub remote (`marcshelton-glitch/civicwatch`):

```bash
git add <files>
git commit -m "message"
git push origin main
```

> **History (why the old hack existed):** earlier this project pushed via a Python
> GitHub-Data-API script (`_push.py` + `security find-internet-password`) because `git push`
> appeared to hang, and some history was uploaded through the GitHub website's "Add files via
> upload." That workaround is what caused the repo to drift ~95 commits behind GitHub. It is
> **retired — do not use `_push.py`.** Dated entries further down still reference it; those are
> left as historical record, not current instructions.

---

## Site Routes

| Route | Description |
|---|---|
| `/` | Marketing homepage |
| `/dashboard` | Main app — My Reps, Map, Alerts, Search, Constitution, Leaderboard |
| `/about` | Mission, how it works, data sources, press contact |
| `/press` | Press page — press contact, stats, press kit (placeholder) |
| `/pro` | Pricing — Free vs. Pro comparison + feature deep-dives |
| `/sign-in` | Clerk login |
| `/sign-up` | Account creation |
| `/privacy` | Privacy Policy (updated June 29, 2026 — CCPA section added) |
| `/terms` | Terms of Service (17 sections, CA governing law) |
| `/data-deletion` | CCPA/GDPR data deletion instructions |
| `/refund-policy` | Refund policy (14-day) |
| `/leaderboard` | Congressional trading leaderboard (50 entries) |

---

## Business Model

| Metric | Detail |
|---|---|
| Model | Freemium SaaS, monthly subscription |
| Pro Price | $9.99/month |
| Annual Tier | Planned |
| Revenue at 1,000 Pro subs | ~$9,670/month (after ~$330 Stripe fees) |
| Infra cost at 1,000 subs | ~$100–150/month |
| Launch target | 1,000 Pro subs by November 5, 2026 (Election Day) |

---

## Contact / Emails

| Role | Email |
|---|---|
| General Support | support@civicwatch.app |
| Press & Media | press@civicwatch.app |
| Inquiries | inquiries@civicwatch.app |
| Corrections | corrections@civicwatch.app |
| Founder / CEO | marc@civicwatch.app |

All emails on GoDaddy.com domain.

---

## Environment Variables (Vercel)

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ⚠️ Needs adding | For web push notifications |
| `VAPID_PRIVATE_KEY` | ⚠️ Needs adding | For web push notifications |
| `VAPID_SUBJECT` | ⚠️ Needs adding | `mailto:support@civicwatch.app` |
| `INTERNAL_API_SECRET` | ⚠️ Needs adding | For `/api/push-send` internal route |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ Needs adding | Meta Pixel — required to activate `components/MetaPixel.jsx` |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | ⚠️ Needs adding | TikTok Pixel — required to activate `components/TiktokPixel.jsx` |
| `CONGRESS_API_KEY` | ⚠️ Verify set | Needed for leaderboard party badge enrichment |
| `GEMINI_API_KEY` | ✅ Set | AI accountability reports |
| `STRIPE_SECRET_KEY` | ✅ Set | Payments |
| `CLERK_SECRET_KEY` | ✅ Set | Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Database |

---

## Open Items

### ✅ Recently resolved (July 16–17)

- [x] **July 8 build ported, verified and committed** (`59fa0e6`) — was never in this repo; see the two-clones warning at the top of this file.
- [x] **`npm run build` passes** (exit 0) — first verified build since July 8.
- [x] **Wallet Pro activation restored** (`4629403`) — `invoice.paid` handler, scoped to the subscribe-instant path.

### 🔴 Critical — before the next deploy

- [ ] **Apply `supabase/migrations/20260709000000_committee_snapshots.sql` in Supabase.** Committee alerts are committed and will run on the daily cron; without this table `sendCommitteeAlerts` errors.
- [ ] **Confirm `CONGRESS_API_KEY` is set in Vercel.** Both committee and legislation alerts return 0 without it — silently.
- [ ] **Decide on Apple Pay / Google Pay.** `PaymentRequestButton` has been built-but-unmounted since June 26 (`df3cf63`, a logo commit, removed it from `/pro`). The activation bug that would have made it charge-without-Pro is fixed, so re-mounting is safe. Either mount it on `/pro` or delete the dead path (`components/PaymentRequestButton.js`, `app/api/subscribe-instant/route.js`).
- [ ] **`package-lock.json` is out of sync with `package.json`.** A plain `npm install` rewrites ~800 lines (adds `sharp` to the root dependency list, bumps transitive versions). Deliberately excluded from `59fa0e6`. Worth resolving deliberately — a stale lockfile can break `npm ci` on Vercel.
- [ ] **Review the daily-update task's summarisation step.** Its July 15 run cut `CivicWatch.md` from 817 to 252 lines, deleting nine reference sections and all June history, and deleted the reconciliation block's open questions without answering them. Restored in `aa322b1`.

### Immediate (before launch)
- [x] Run `python3 ~/civicwatch/_push.py` on Mac to push the 10 P3 QA fixes from June 5 — ✅ Done June 8 (confirmed)
- [x] Add CCPA/GDPR named sections to Privacy Policy — ✅ Done June 29
- [ ] **NEW (July 4):** Add `NEXT_PUBLIC_META_PIXEL_ID` + `NEXT_PUBLIC_TIKTOK_PIXEL_ID` to Vercel env vars, then push pixel code (`components/MetaPixel.jsx`, `components/TiktokPixel.jsx`, updated `app/layout.js`)
- [ ] **NEW (July 4):** Record 45-second founder POV video ("Why I Built This") — identified as highest-ROI marketing asset
- [ ] **NEW (July 4):** Set up @CivicWatchAlerts X/Twitter bot account for automated trade alert posts
- [x] **NEW (July 8):** Finish + verify the in-progress feature build (Conflict Score, `/trades`, `/accountability`, return-on-trade, committee alerts) — ✅ **Done July 16–17** (`59fa0e6`). It was never uncommitted here; it lived in the stale iCloud clone. Build verified, exit 0.
- [x] ~~Review `CivicWatch_Competitive_Analysis_and_Roadmap.docx` (4-phase competitor roadmap)~~ — superseded July 8 (late night) by v2, see below
- [ ] **NEW (July 9):** Confirm `npm run build` passes locally after the Stripe lazy-init fix (`pro-count`, `subscribe`, `billing-portal`, `webhooks/stripe`), then commit + push — this fix must land before the July 8 feature build can go live
- [ ] **NEW (July 9) — high priority:** `/robots.txt` and `/sitemap.xml` were returning 401 to Googlebot due to a Clerk middleware gap (likely the main reason organic search has been near zero) — fixed locally in `proxy.ts`, not yet pushed
- [ ] **NEW (July 9):** Build `/api/og-image` — referenced in page metadata but doesn't exist; social share preview images are currently broken
- [ ] **NEW (July 9):** Review `CivicWatch_Competitive_Analysis_and_Roadmap_v2.docx` (supersedes the July 8 v1) — Phase 5–8 roadmap, next priority is distribution (API, backlinks, content) over new features
- [ ] **NEW (July 9):** GitHub push/commit connector still not available in Cowork sessions — confirmed after troubleshooting with Marc; all code changes continue to require a manual Mac-side `git commit` + `_push.py` run
- [ ] Add Vercel env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`
- [ ] Apply Supabase migration for `push_subscriptions` table (project: `hgtofwsvbblumcgbqzat`)
- [ ] Register Clerk webhook: Clerk Dashboard → `https://civicwatch.app/api/webhooks/clerk` → event: `user.created` → add `CLERK_WEBHOOK_SECRET` to Vercel
- [ ] Verify `CONGRESS_API_KEY` is set in Vercel (affects leaderboard party badges)
- [ ] Fix "Transparency is the foundation of democracy" duplication on About page h1 vs Mission section
- [ ] Add Refund Policy link to homepage marketing footer (currently only in dashboard footer)
- [ ] Add "Do Not Sell My Personal Information" link to all footers
- [ ] Run SQL backfill for `fd_net_worth.bioguide_id` (97 rows with null bioguide_id from OCR pipeline) — paste SQL in Supabase SQL editor
- [ ] Finish caching layer on `congress/route.js` (session hit 1M limit mid-way — 15 return statements done)

### Manual testing checklist
- [ ] Walk through app on real iPhone (Safari) — **still pending**
- [ ] Test Go Pro → Stripe checkout → success flow end-to-end
- [ ] Test declined card
- [ ] Verify free users hit paywall at right moment
- [ ] Sign up → email verification → onboarding flow
- [ ] Verify welcome/confirmation/cancellation emails send from domain (not Clerk default)
- [ ] Lighthouse audit 80+ Performance, 100 Accessibility
- [ ] Test on slow 4G

### Post-launch
- [x] Add actual files to Press Kit on /press page — ✅ Done June 28 (5 brand PNGs linked in download grid)
- [x] Consider dedicated press@civicwatch.app for press contact — ✅ Done June 28 (changed from support@ to press@ on /press page)
- [ ] Activate Instagram, TikTok, X social links when accounts ready
- [ ] Launch annual subscription tier
- [x] Connect civicwatch folder in Cowork settings (fixes automated task file writing) ✅ Done June 8
- [ ] Spanish localization (Phase 2 — 41M native Spanish speakers in US)
- [ ] `committee_assignments` table data layer (enables Committee alert delivery)
- [ ] `rep_legislation` table indexed by bioguide_id (enables Legislation alert delivery)

---

## Key Commits (most recent first)

| Commit | Description |
|---|---|
| `f7f6541` | Press page: real logo, press@ email, brand asset download grid |
| `3e89581` | Compare panel improvements |
| `fada9c7` | Compare mode: fixed Total Trades = 0 bug |
| `fd7c2dd` | Mobile tabs split into two rows for better mobile UX |
| `d4adda2` | Mobile tabs: shortened labels to fit one row on mobile |
| `eeed1397` | Social media icons added to footer (Facebook live, Instagram/TikTok/X coming soon) |
| `c6f85326` | Meta title/description update ("CivicWatch — See What Congress Is Buying") |
| `8c0e938f` | OG image redesign (two-column provocative layout) |
| `8874d0a2` | Kevin Kiley party badge fix + PARTY_OVERRIDES map |
| `b1e06263` | Fake SSR ticker names replaced with neutral loading messages |
| `dfb533a` | Wikipedia API net worth (replaced Wikidata SPARQL P2218) |
| `b0125942` | Compare panel Total Trades fix |
| `2914578` | fdNetWorth null vs [] React timing bug fix |
| `9aa2cc` | Contact button routes to official contact pages |
| `b821e8` | District map D3 rewrite (geoMercator fitExtent) |

---

*File built from: Product Spec Sheet (June 2026) + live site audit of civicwatch.app + full session transcript OCR (11 screenshots, March–June 2026) · Last rebuilt: June 6, 2026 · Last updated: July 9, 2026*

---

## ✅ Reconciliation — RESOLVED July 16, 2026

> **Why this existed:** During the July 2026 repo cleanup the GitHub-committed `CivicWatch.md`
> was found frozen around **June 24** (the old `_push.py` hack wasn't reliably reaching GitHub),
> while the iCloud copy kept advancing to **July 9**. Items below existed **only** in the older
> GitHub copy. Each was verified against the repo on **July 16, 2026** and resolved.

### B. Feature rows "✅ Live" in the old copy but missing from the newer one — **RESOLVED: the old copy was right**

All five verified as **committed** (`git cat-file -e HEAD:<path>`). They were lost from the newer file's table, not un-shipped. Feature Status now reflects reality.

| Feature | Verified evidence | Status |
|---|---|---|
| @CivicWatchAlerts X bot | `app/api/alerts/x-bot/route.js` committed; `*/15` cron present in `vercel.json` | ✅ Code live — runtime unverified (needs `TWITTER_*` env vars) |
| Apple Pay / Google Pay | `components/PaymentRequestButton.js` + `app/api/subscribe-instant/route.js` committed | ⚠️ Committed but **never mounted** — the old copy's "✅ Live (Payment Request Button on /pro)" was wrong by June 26. Activation gap fixed July 17 |
| Exit-intent modal | `components/ExitIntentModal.js` committed | ✅ Live |
| AI gateway | `lib/ai-gateway.js` committed | ✅ Code live — `ai_usage` migration unverified |
| AI code review Action | `.github/workflows/ai-review.yml` committed | ✅ Live |

**This is what the reconciliation block was for.** Verifying the Apple Pay row is what exposed the activation bug — a question open since June that the July 15 daily run tried to delete unanswered. It also corrected the old copy's claim: Apple Pay was never actually live on `/pro` past June 26.

### C. Env vars / migrations — **PARTIALLY RESOLVED: migration files exist, application unverified**

Both migration *files* are committed. Whether they've been **applied in Supabase** cannot be checked from the repo and remains open:

- [ ] Verify `x_bot_posts` applied in Supabase (`supabase/migrations/20260620000001_create_x_bot_posts.sql` — file ✅ committed)
- [ ] Verify `ai_usage` applied in Supabase (`supabase/migrations/20260615000003_create_ai_usage.sql` — file ✅ committed)
- [ ] Verify X bot env vars in Vercel: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` — the `*/15` cron is live, so **if these are unset the bot has been failing silently every 15 minutes since June 20**

### A. June history recovered from the June 24 GitHub copy — **RESOLVED: folded in below as permanent history**
### 2026-06-24 — Automated Daily Update
- No new CivicWatch coding sessions today (June 24).
- All previous work through June 21 remains current (see below).
- **Open items unchanged** — top priorities: add Vercel env vars for X bot (`TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`) and web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`); apply Supabase migrations for `push_subscriptions`, `x_bot_posts`, and `ai_usage` tables.
- **⚠️ GitHub push via API** — pushing CivicWatch.md to repo via GitHub Git Data API using `_push.py`.

### 2026-06-23 — Automated Daily Update
- No new CivicWatch coding sessions today (June 23).
- All previous work through June 21 remains current (see below).
- **Open items unchanged** — top priorities: add Vercel env vars for X bot (`TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`) and web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`); apply Supabase migrations for `push_subscriptions`, `x_bot_posts`, and `ai_usage` tables.
- Marc was active today on a separate project (DrivPilot — executive summary / product doc updates).
- **⚠️ GitHub push still Mac-side only** — iCloud copy written; run `python3 ~/civicwatch/_push.py` on Mac to push to repo.

### 2026-06-22 — Automated Daily Update
- No new CivicWatch coding sessions today (June 22).
- All previous work through June 21 is captured below.
- **Open items unchanged** — top priorities remain: add Vercel env vars for X bot (`TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`) and web push (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`), apply Supabase migrations for `push_subscriptions`, `x_bot_posts`, and `ai_usage` tables.
- **⚠️ GitHub push still Mac-side only** — iCloud copy written; run `python3 ~/civicwatch/_push.py` on Mac to push to repo.

### 2026-06-21 — Real CivicWatch Logo Deployed (Commit 3292825)

**Commit `3292825` — Brand logo replaces emoji placeholder (pushed ~2:14 PM PDT)**
- `public/brand/` — 7 brand PNG assets added: `civicwatch_logo_gold.png`, `logo_civicwatch_horizontal.png`, `logo_civicwatch_stacked.png`, `logo_icon_on_white.png`, `logo_icon_transparent.png`, `logo_marc_compact.png`, `logo_marc_founder.png`
- `components/CivicWatch.jsx` — header logo changed from 🏛️ emoji + text (`CIVIC` / `WATCH`) to `<Image src="/brand/logo_civicwatch_horizontal.png" width={180} height={49}>` via Next.js `<Image>` with `priority`
- `app/layout.js` — favicon and Apple touch icon now point to `logo_icon_transparent.png` (replaces old `favicon.ico` / `favicon-32.png` / `icon-192.png` stack)

### 2026-06-20 — Automated Daily Update + TWO NEW FEATURES PUSHED
- **TWO major commits pushed today** — @CivicWatchAlerts X bot + Apple Pay / Google Pay checkout (see details below).
- **⚠️ GitHub push still Mac-side only** — CivicWatch.md updated in iCloud-synced folder; GitHub push of this file requires `python3 ~/civicwatch/_push.py` on Mac.
- Previous automated daily update sessions (June 15–19) failed to write to repo due to filesystem sandbox limitations.

### 2026-06-20 — X Bot + Apple Pay (Commits f1c7d3c, 61e116e)

**Commit `f1c7d3c` — @CivicWatchAlerts X Bot (pushed 12:49 PM)**
- `app/api/alerts/x-bot/route.js` — queries `fd_trades` + `senate_trades` for trades created in last 2 hours; posts each to X via Twitter API v2 (OAuth 1.0a); records posted trade IDs in `x_bot_posts` table to prevent duplicates; fetches party from Congress.gov API best-effort
- `supabase/migrations/20260620000001_create_x_bot_posts.sql` — dedup table for posted trades
- `vercel.json` — adds `*/15` cron trigger for `/api/alerts/x-bot` (fires every 15 minutes)
- `docs/x-bot-setup.md` — Twitter app creation guide, OAuth scopes, required env vars

**Commit `61e116e` — Exit-Intent Modal + Apple Pay / Google Pay (pushed 12:18 AM)**
- `components/ExitIntentModal.js` — fires on mouseleave (desktop) or 60s idle (mobile); shows once per session; hidden for signed-in users; state dropdown → `/dashboard?state=`; name search → `/dashboard?search=`
- `components/PaymentRequestButton.js` — Stripe Payment Request Button (Apple Pay / Google Pay); rendered above standard CTA on `/pro`; falls back silently if wallet unavailable
- `app/api/subscribe-instant/route.js` — creates subscription directly via `paymentMethodId`; returns `clientSecret` when 3DS confirmation is needed
- `app/api/webhooks/stripe/route.js` — adds `invoice.paid` handler to activate Pro for Payment Request Button path; skips if already Pro to avoid duplicate welcome emails
- `app/dashboard/page.js` — reads `?state=` and `?search=` params and passes to CivicWatch component
- Installs `@stripe/stripe-js` for client-side wallet detection

**⚠️ NEW ENV VARS NEEDED (X Bot):** `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` — see `docs/x-bot-setup.md`

### 2026-06-14 — Infrastructure Sprint (Commits 3d362c9, 43647d1, ab1ca20, 353c54b, 6e07e11)

**Commit `3d362c9` — P0/P1 Launch Fixes (major):**
- Health endpoint, rate limiting, caching, auth hardening, push notifications, dedup constraints

**Commit `ab1ca20` — AI Gateway Middleware:**
- `lib/ai-gateway.js` — centralized AI spend tracking + token logging for all AI calls
- `supabase/migrations/20260615000003_create_ai_usage.sql` — `ai_usage` table
- Updated `app/api/analyze-rep/route.js` and `app/api/media/generate-image/route.js` to route through gateway

**Commit `353c54b` — AI Code Review GitHub Action:**
- `.github/workflows/ai-review.yml` — auto-reviews PRs with Claude Sonnet 4.6

**Commit `6e07e11` — Free-tier daily token cap: 500 → 2,000 tokens**

### 2026-06-15 to 2026-06-19 — Companion App Built + Architecture Documented

**June 17 — Companion Voter-Matching App (separate project, NOT in main repo):**
- *"CivicWatch monetization strategy"* session — 3-tier playbook Word doc for companion app: **Free / Voter Pro / Civic Pack** tiers; full landing page copy + CivicWatch upsell conversion flow.
- *"Playbook loading issue"* session — Complete voter-matching web app: `index.html` (5-question quiz, ranked results with freemium blur on 4+, AI chat, email capture, Stripe buttons), `PROJECT_BRIEF.md`, `GRANT_GUIDE.md` (CCIP, Knight, Democracy Fund, Mozilla), `ROLLOUT_TIMELINE.md` (6 phases to Election Day).

**June 19 — Architecture Documented:**
- *"Create detailed flowchart for civicwatch.app"* session — Full system diagram: 14 API routes, 13 external data sources, auth flow, caching strategy.
- *"Civicwatch.app project continuation"* session — Stalled: Marc sent 11 screenshots but came through at **31px wide** (unreadable). Re-share at full resolution to resume.
- Two bugs fixed in `~/civichub-live/` prototype only (not main repo): ProPublica double-transform removed; `inOfficeSince` calc corrected.

**June 15–16:** No new CivicWatch coding sessions.

### 2026-06-14 — Automated Daily Update
- No new CivicWatch coding sessions today (June 14).
- **Open items unchanged** — top priority remains adding Vercel env vars for web push notifications (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`) and applying the `push_subscriptions` Supabase migration.
- **Reminder:** `bioguide_id` SQL backfill for 97 OCR `fd_net_worth` rows still needed, and `congress/route.js` caching layer is incomplete (15 return statements done, not complete).
- **Screenshot blocker still open:** "Civicwatch.app project continuation" session stalled waiting on Marc's 11 screenshots (came through at 31px wide / unreadable). Re-share at full resolution to resume.
- **⚠️ GitHub push still Mac-side only** — iCloud copy and `_push.py` require running on the Mac; this automated task can write CivicWatch.md via Cowork folder connection but cannot push to GitHub from the Linux sandbox.
