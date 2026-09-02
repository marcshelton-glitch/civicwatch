# Decisions Pending — CivicWatch

Everything here is blocked on Marc. Agents may open, research, and recommend.
**Agents may never fill in `Decision:`.** Resolved entries move to
`00-governance/decision-log.md` with their rationale intact.

---

## D-003 · Four Pro-tier features have no server-side Pro gate — enforce it, or keep them free?
- **Status:** open
- **Raised:** 2026-09-01 by claude, while rewriting `/pro`
- **Blocks:** billing/marketing integrity — right now the copy and the code disagree about what $9.99/mo actually buys
- **Cost of delay:** low technically (nothing is broken), but every day this
  sits open is a day free users are quietly getting paid-tier value, which
  understates Pro's differentiation and is the kind of thing that erodes
  trust once a paying subscriber notices a free account can do the same
  thing.
- **Context:** while rewriting `/pro` around what's actually true today, I
  checked every route behind each advertised Pro feature for a server-side
  `isPro`/`requirePro` check (not just a client-side blur/lock overlay,
  which is trivially bypassed by calling the API directly):
  - `app/api/track/route.js` (watchlist) — **no Pro check.** Any signed-in
    user can track representatives.
  - `app/api/push/subscribe/route.js`, `app/api/push-subscribe/route.js`,
    `app/api/send-alerts/route.js` (Track My Rep™ Alerts) — **no Pro check.**
    The alerts cron sends to every user with a tracked rep and a push
    subscription, Pro or not.
  - `app/api/civic/route.js` (state & local rep lookup by address) — checks
    only that the caller is signed in, not Pro.
  - `app/api/conflict-score/route.js` (Trade Conflict Analysis) — **fully
    public, no auth check at all**, and explicitly cached
    `Cache-Control: public, s-maxage=3600` — anyone, signed in or not, can
    call `/api/conflict-score?bioguideId=X` and get the full flagged-trades
    output.
  - By contrast, `app/api/networth/route.js` (Wealth Trajectory) and
    `app/api/analyze-rep/route.js` in `mode=full` (Full AI Accountability
    Reports) **do** correctly gate on server-side
    `currentUser().publicMetadata.isPro`, matching `/pro`'s claims.
  - I moved tracking, alerts, and the address lookup into `/pro`'s **Free**
    column and promoted Trade Conflict Analysis to a live Pro feature in the
    copy (see `docs/bioguide-backfill-2026-08-26.md` — coverage is now
    96.3%, backfill applied 2026-09-01) — but that copy fix doesn't close the
    `/api/conflict-score` hole. It's the one still marketed as Pro-exclusive
    with zero enforcement.
- **Options:**
  - **A — Add server-side `requirePro()`/`getProStatus()` gates to match the
    marketing.** Straightforward: `conflict-score` and the three
    track/alert/civic routes get the same treatment `networth` and
    `analyze-rep` already have. Makes the $9.99/mo price actually mean
    something for all four features, but is a real (if small) product
    change — some free users lose something they currently have.
  - **B — Leave tracking, alerts, and the address lookup free permanently**
    (matches what `/pro` now says) **but gate `conflict-score`** since it's
    the one feature still positioned as paid. Smaller blast radius.
  - **C — Leave everything as-is technically; `/pro` copy is now honest
    about what's actually gated vs. not, so there's no user-facing lie even
    though enforcement is inconsistent.** Cheapest, but leaves the
    `conflict-score` public-cache gap sitting there indefinitely, and it's
    the kind of thing a curious free user or a competitor finds by opening
    dev tools.
- **Recommendation:** **B.** Tracking/alerts/address-lookup being free is a
  reasonable product choice (it's what drives sign-ups and repeat visits)
  and matching copy to that reality was the right call for this pass. But
  `conflict-score` is the flagship differentiator marketing sells — it
  should not be the one feature callable by anyone with the URL.
- **Decision:** _(awaiting Marc)_

---

## D-002 · Move the loose business documents into the standard structure?
- **Status:** open
- **Raised:** 2026-08-11 by claude
- **Blocks:** nothing technically; blocks the repo being uniform with other projects
- **Cost of delay:** low, but it compounds — every week adds more loose files
- **Context:** the retrofit added the `00-` through `70-` structure alongside
  ~20 existing documents that are still at the repo root or in ad-hoc folders
  (`Media campaign/`, `Civicwatch Markdown files/`, `CivicWatch Downloaded Files/`).
  Several are `.docx`, which the standard treats as exports rather than sources.
  There are also **39 uncommitted changes** in the working tree right now, so a
  large move would tangle with whatever is in flight.
- **Options:**
  - **A — Commit what's in flight first, then move in one labelled commit.**
    Clean history, easy to review, easy to revert. Requires you to look at the
    39 changes first.
  - **B — Move now, on top of the uncommitted changes.** Faster, but the
    restructuring commit and your in-flight work become one indistinguishable
    blob.
  - **C — Leave existing docs where they are; use the new structure only for
    new work.** Zero risk now, permanent split-brain later — the thing this
    whole exercise exists to prevent.
- **Recommendation:** **A.** The 39 uncommitted changes need triage regardless,
  and doing it first makes the move reviewable in isolation.
- **Decision:** _(awaiting Marc)_

---

## D-001 · Which migration directory is authoritative — `migrations/` or `supabase/migrations/`?
- **Status:** open
- **Raised:** 2026-08-11 by claude
- **Blocks:** 12-factor XII; any future schema change
- **Cost of delay:** low day-to-day, **high the moment someone applies the wrong
  set to production** — and that risk is silent until it fires
- **Context:** both directories exist. `migrations/` holds ten numbered SQL
  files (`001_financial_disclosures.sql` … `010_…`). `supabase/migrations/`
  also exists. Nothing in the repo states which one the deployed database was
  actually built from. I could not determine this from the filesystem alone —
  it needs someone who knows the deploy history, or a diff against the live
  schema.
- **Options:**
  - **A — `migrations/` is canonical.** Delete or archive the Supabase copy,
    note it in the decision log.
  - **B — `supabase/migrations/` is canonical.** Standard Supabase CLI layout;
    better tooling support going forward.
  - **C — Diff both against the live schema first,** then decide with evidence.
- **Recommendation:** **C first, then B.** Guessing here risks the database.
  Once you know which matches production, consolidating on the Supabase CLI
  convention gives you `supabase db diff` and `supabase db push` for free.
- **Decision:** _(awaiting Marc)_
