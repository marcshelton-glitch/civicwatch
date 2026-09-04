## ⚡ 2026-09-03 — Conversion tracking, webhook routing, and data cleanup

**Shipped this session:**
- **Recent votes display** — Fixed AI Analysis tab reading stale votes/trades. Commit 094af52, Vercel deploy in progress.
- **Pro page rewrite** — Repositioned 6 features (Trade Conflict Analysis promoted; Track My Rep, State/Local Lookup moved to Free; Peer Standing stays Coming Soon). Applied bioguide backfill raising fd_trades coverage from 93.4% → 96.3% (5,034/5,230). Filed decision D-003 on /api/conflict-score auth gate. Commit 37c2de1 (local, ready to push).
- **Clerk webhook routing** — Root cause identified: domain 307-redirect blocking Svix delivery. Endpoint URL in Clerk dashboard registered as `civicwatch.app` but domain redirects to `www.civicwatch.app` (where Vercel serves). Svix doesn't follow POST redirects. Fix: Update endpoint URL to www version in Clerk → Configure → Webhooks, then verify CLERK_WEBHOOK_SECRET is actually set in Vercel (it's missing from both .env.local and the .env.vercel snapshot).
- **Ingest date parser** — Fixed UTC timezone bug in `parseDate()` that was shifting dates back a day on servers west of UTC. Added round-trip validation rejecting auto-corrected invalid dates (e.g. 2/30/2024).
- **Senate ingest workflow** — Updated `.github/workflows/ingest-senate.yml` to use Playwright headless browser (efdsearch.senate.gov blocks raw fetch via WAF). Workflow file requires GitHub web edit + manual trigger (GitHub App lacks Workflows permission). Timeout bumped 60 → 120 min for ~1,500 live pages.
- **Conversion pixels (Meta + TikTok)** — Both Purchase/CompletePayment events firing end-to-end in production. Fixed 3 blocking issues: (1) CSP header didn't allowlist `connect.facebook.net` / `analytics.tiktok.com`, (2) Purchase tracking code was uncommitted, (3) `/api/funnel-event` middleware was 401'ing signed-out users. Deployed & verified live (3 commits). Meta/TikTok server-side event matching needs manual verification in their Events Manager dashboards.
- **Lazy-init (Stripe)** — PR #1 already resolved on main via commit 7d1c8b9. Vercel deploy failure was from unrelated cron job (now removed from vercel.json). Closed PR #1 with explanatory note.
- **Future-dated trades purge** — Removed 27 garbage rows from `fd_trades`. Root cause: parser was grabbing bond maturity dates instead of transaction dates. 25 rows had no recoverable date (reset source filings to unprocessed for re-parse with fixed logic), 2 rows (Keating, DelBene) had dates embedded in garbled text (repaired in place: 2024-09-11, 2022-01-03). fd_trades now 0 future-dated.
- **Gantt chart housekeeping** — Updated task numbering display, checked off completed work. Progress 22/35 (63%).

**Open/blockers:**
- Push notifications testing (Chrome + Safari) — still pending, task #6.
- Clerk webhook still needs endpoint URL update + CLERK_WEBHOOK_SECRET verification in Vercel.
- Senate ingest workflow needs GitHub web file edit + workflow dispatch to run.
- Meta/TikTok pixel server-side event matching needs Events Manager verification.

**Next priority:** Push the /pro rewrite (commit 37c2de1), fix Clerk endpoint URL, deploy and test Senate ingest, verify conversion pixel events in Meta/TikTok dashboards.

---

## ⚡ Recent Work — 2026-09-02

### Data & API Updates
- **Bioguide backfill — 96.2% coverage achieved** — Monthly maintenance completed. Coverage is now 4,884/5,076 (96.2%), up from 47.5% on Aug 13. Identified and validated 31 high-confidence name/state pairs covering 145 of 192 remaining unresolved trades via Congress.gov roster matching. Two family/seat-succession edge cases (Linda T. Sánchez vs. Loretta Sanchez in CA; Robert C. "Bobby" Scott vs. William Lloyd Scott in VA) verified as non-conflicts. **Full proposed list documented in `docs/bioguide-backfill-2026-08-26.md`, ready to apply.** No Supabase writes executed (safety hold — awaiting approval).

- **Senate ingest workflow fixed** — Updated `.github/workflows/ingest-senate.yml` to use Playwright headless browser for scraping `efdsearch.senate.gov`. Root cause: site's WAF was blocking raw fetch() 100% of the time, but real browser requests worked cleanly every test. Added `playwright install --with-deps chromium` and `poppler-utils` (for PDF parsing) to workflow dependencies. Added `--skip-existing` flag to net-worth script for resumable runs on interruption. Workflow is now ready to trigger manually via GitHub Actions. **Task 27 marked done** (2026-08-30). Progress: 21/35 (60%).

### Monetization & Tracking
- **Fire Purchase events pixels — DEPLOYED LIVE** — Fixed subscription completion tracking for Meta and TikTok. Root causes identified and resolved: (1) CSP headers blocked pixel scripts entirely, (2) Purchase/CompletePayment tracking code was uncommitted draft, (3) middleware was 401'ing anonymous funnel-event logging. Fixed with 3 commits deployed to production:
  - CSP now allowlists `connect.facebook.net`, `analytics.tiktok.com` and their event endpoints
  - Shipped `trackPurchase()` tracking helper firing `fbq('track', 'Purchase')` and `ttq.track('CompletePayment')`
  - Fixed middleware to allow anonymous `/api/funnel-event` logging
  - **Verified live:** real network calls to both platforms succeeded through app code path (captured `facebook.com/tr?...ev=Purchase&cd[value]=9.99` and TikTok's `analytics.tiktok.com/api/v2/pixel`)
  - One test row cleaned from database
  - **Task 30 marked done** (2026-08-30). Progress: 19/35 (54%)
  - **Next:** Manual verification in Meta Events Manager → Test Events and TikTok Ads Manager to confirm server-side event matching

- **Google Analytics setup — COMPLETE** — Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4KLY81XR45` in `.env.local` and Vercel (Production + Preview). GA measurement phase now fires automatically via existing `<GoogleAnalytics>` component in `layout.js`. **Task 29 marked done** (2026-08-30). Progress: 22/35 (63%).

### Feature & Messaging Updates
- **Rewrite /pro messaging to match reality** — Audited actual `/api/` endpoints and live deployment against `/pro` page copy. Found 3 categories of mismatch:
  - **Trade Conflict Analysis:** Promoted off "Coming Soon" — it's a genuinely differentiated feature (committee-jurisdiction × trade-timing overlap analysis that no competitor does), coverage is now high, API already returns real data
  - **Track My Rep™ Alerts, Track Any Representative, State/Local Rep Lookup:** Moved to Free tier — verified all 4 routes (`/api/track`, `/api/push/subscribe`, `/api/send-alerts`, `/api/civic`) have zero server-side Pro checks; all free for signed-in users (local lookup doesn't even require sign-in)
  - **Peer Standing Breakdown:** Kept as Coming Soon — correctly, this feature isn't built yet
  - Added FAQ entry on trade-data coverage accuracy; trimmed hero copy to match reality
  - **Filed decision D-003:** `/api/conflict-score` has zero auth gating but is marketed as Pro-exclusive. Needs decision: gate it to match copy, or drop the copy claim and leave it open
  - Committed locally (commit 37c2de1); awaiting push from Mac

- **State & Local Lookup deployment verification** — Verified `/api/civic` endpoint live and returning real results. Tested with DC address; returned DC councilmembers correctly. Vercel logs show correct behavior (401 for signed-out, Clerk auth working as designed). **Caveat:** env var in Vercel is scoped to **Production** only; needs to be extended to **Preview** so PR/preview deploys get state legislator data. **Task 31 nearly closed** — awaiting Preview env var update.

### Open Items & Blockers
- **Senate workflow trigger** — Workflow is fixed and ready; needs manual trigger via GitHub Actions → "Ingest Senate Disclosures" → "Run workflow" to backfill `senate_trades` and `senate_net_worth` tables (currently 0 rows)
- **Purchase pixel verification** — Need manual check in Meta Events Manager → Test Events and TikTok Ads Manager to confirm events reaching both platforms server-side before turning on spend
- **Preview environment state/legislator data** — Extend OpenStates API key to Vercel Preview environment (currently Production-only)
- **Conflict-score API auth decision (D-003)** — `/api/conflict-score` currently unauthed but marketed as Pro feature; decide whether to gate or drop claim
- **/pro page copy change** — Changes committed locally (37c2de1); needs Mac push to GitHub

---

## ⚡ Recent Work — 2026-08-30

### Data & API Updates
- **Senate ingest fix** — Fixed broken Senate congressional ingest scripts (`senate-efd-browser.mjs`, `ingest-senate-trades.mjs`, `ingest-senate-networth.mjs`). Root cause: scripts were reading from dead `data.json` endpoint and PDF pipeline. Rewrote both scripts to scrape actual current page structure (5-column search rows, `/search/view/` paths) using new `scrapeReportTables()` helper. 4 commits pushed to main. Needs manual GitHub Actions trigger to verify data actually lands in Supabase for `senate_trades` and `senate_net_worth` tables.

- **Local Mac ingest automation fix** — Found and fixed Senate workflow probe bug. The `bash -e` flaw was swallowing diagnostic output before it could report why probe failed. Fixed locally in `.github/workflows/ingest-senate.yml` (wrapped substitution in `set +e`/`set -e`). Needs Marc to push this one file, then trigger Senate workflow again to see real diagnostic output.

- **Ingest date parser bug fix** — Fixed timezone bug in `scripts/ingest-disclosures.mjs` parseDate function. Root: `new Date("2000-01-01")` parses as UTC midnight, but year/future-date checks were reading it back with local-time getters — on servers west of UTC, every date silently shifted back a day (e.g., 01/01/2000 became Dec 31 1999) and was wrongly rejected by `year < 2000` guard. Rewrote to be entirely UTC-based and added round-trip validation that rejects invalid dates (e.g., `2/30/2024`) instead of letting JS auto-correct. All test cases pass.

- **Bioguide backfill progress** — Monthly backfill run completed. Coverage now **96.2%** (4,884/5,076 trades), up from 47.5% on Aug 13. Identified 31 high-confidence name/state pairs covering 145 of remaining 192 unresolved trades via Congress.gov roster matching. Full proposed list documented in `docs/bioguide-backfill-2026-08-26.md`, **no Supabase writes applied** — design is proposal-only pending human confirmation. Ready for follow-up session to apply UPDATEs.

### Monetization & Tracking
- **Purchase event pixels — DEPLOYED LIVE** — Fixed pixel tracking for Meta and TikTok on subscription completion. Root causes: (1) CSP headers blocked pixel scripts entirely, (2) Purchase/CompletePayment tracking code existed only as uncommitted draft, (3) middleware was 401'ing anonymous funnel-event logging. Fixed all three with 3 commits deployed to production:
  - CSP now allowlists `connect.facebook.net`, `analytics.tiktok.com` and their event endpoints
  - Shipped `trackPurchase()` tracking helper that fires `fbq('track', 'Purchase')` and `ttq.track('CompletePayment')`
  - Fixed middleware to allow anonymous `/api/funnel-event` logging
  - Verified live: real network calls to `facebook.com/tr?...ev=Purchase&cd[value]=9.99` and TikTok's `analytics.tiktok.com/api/v2/pixel` both succeeded through app code path
  - One test row cleaned up from database
  - **Next:** Manual verification in Meta Events Manager → Test Events and TikTok Ads Manager to confirm server-side event matching before turning on spend

- **Google Analytics setup** — Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4KLY81XR45` in `.env.local` and Vercel (Production + Preview). Triggered redeploy, now queued behind other builds. Once deployed, GA will fire automatically via existing `<GoogleAnalytics>` component in `layout.js`.

- **Resend API key setup** — Added RESEND_API key to `.env.local` for welcome/dunning/recovery emails.

### Infrastructure & Authentication
- **Stripe verification** — Confirmed CivicWatch Pro product is clean: exactly one price ($9.99 USD/month, default), zero duplicates or archived entries.

- **VAPID env vars to Vercel** — Confirmed "Add VAPID env vars to Vercel" completed (gantt task #36, done 2026-08-25). Progress: 16/35 (46%).

### Open Items & Blockers
- **Senate workflow diagnostic output** — Fix pushed locally; needs Marc to `git push` and then manually trigger "Ingest Senate Disclosures" workflow to confirm probe now reports real diagnostic info.
- **Purchase pixel verification** — Need manual check in Meta Events Manager and TikTok Ads Manager to confirm events are reaching both platforms server-side.
- **Push testing end-to-end (Chrome + Safari)** — Started but not completed; `push_subscriptions` table still at 0 rows. Critical Phase 2 blocker.
- **Bioguide backfill write** — 31 resolutions ready to UPDATE into Supabase, pending human approval to apply.

---

## ⚡ Recent Work — 2026-08-28

### Data & API Updates
- **Senate ingest investigation** (in progress) — investigating `efdsearch.senate.gov` integration; confirmed endpoint is live and working end-to-end via browser test
- **Bioguide backfill progress** — `fd_trades.bioguide_id` coverage improved to **96.2%** (4,884/5,076 trades) from 47.5% on Aug 13. Resolved 31 new name/state pairs covering 145 trades via Congress.gov roster matching. Proposed resolutions documented in `docs/bioguide-backfill-2026-08-26.md`, pending human approval for Supabase write.
- **Ingest date parser bug fix** — fixed timezone bug in `scripts/ingest-disclosures.mjs` where `new Date("2000-01-01")` was parsing as UTC but comparisons read local time, shifting dates back a day on servers west of UTC. Added UTC-only parsing and invalid-date round-trip validation. All test cases pass.

### Monetization & Tracking
- **Purchase event pixels** — implemented purchase event tracking for Meta and TikTok pixels on subscription completion:
  - New `trackPurchase()` helper in `lib/funnel-track.js` fires `fbq('track', 'Purchase')` and `ttq.track('CompletePayment')`
  - Integrated with `UpgradeBanner` on `/dashboard?upgrade=success` redirect (both Stripe Checkout and Apple Pay/Google Pay flows)
  - Client-pixel only (no server-side Conversions API); note: ad blockers will undercount
  - SessionStorage guard prevents double-fire on refresh
  - Ready to deploy; needs manual verification in Meta/TikTok Events Manager during real checkout

### Infrastructure & Authentication
- **Stripe verification** — confirmed CivicWatch Pro has exactly one price ($9.99 USD/month, default), no duplicates or archived entries. Account clean on both Stripe and Vercel.
- **Clerk webhook verification** (complete) — end-to-end test with real signed payload passed: HTTP 200, `{"received":true}`. Vercel's `CLERK_WEBHOOK_SECRET` matches Clerk exactly. Endpoint subscribed to `user.created`, `user.updated`, `user.deleted`. Welcome email send still untested (pending first real signup).
- **VAPID env vars** — deployed to Vercel. Gantt task #36 marked done.
- **API health endpoint** — verified live. Gantt task #19 marked done.

### Open Items
- **Push notifications end-to-end test** (Chrome + Safari) — still pending; `push_subscriptions` table is empty (0 subscribers). Needs real browser test to confirm push flow works before launch. High priority.
- **Bioguide backfill write** — 31 resolved trades ready to UPDATE into Supabase, pending confirmation.
- **Senate ingest** — investigation ongoing; diagnosis recap in progress session.

### 📊 Progress Snapshot
- **Gantt chart**: 18/35 tasks done (51%) as of last update
- **Launch target**: 1,000 Pro subscribers by Election Day (Nov 5, 2026)
- **Key blockers**: Push testing, Senate ingest resolution

---

# ⚡ Recent Work — August 27, 2026

## Bioguide Backfill (Monthly Maintenance) — Progress Report
**Status:** Coverage improved to 96.2%; 31 new name/state resolutions proposed; safety hold in place (no DB writes)  
**Coverage:** `fd_trades.bioguide_id` is now 4,884/5,076 (96.2%) — up from 47.5% on Aug 13; real progress landed between runs.

### Completed this run (proposal only)
✅ **31 name/state pairs resolved** — covering 145 of the 192 remaining unresolved trades; all high confidence — matched against Congress.gov's member roster by last name + state + district/term overlap.
✅ **Family/seat-succession conflicts verified** — checked Linda T. Sánchez vs. Loretta Sanchez (CA) and Robert C. "Bobby" Scott vs. William Lloyd Scott (VA); neither was a real match conflict.
✅ **Full resolution list documented** — all 31 bioguideIds ready in `docs/bioguide-backfill-2026-08-26.md` for manual paste into UPDATE statements.

### Not yet resolved
🟡 Long tail (1–2 trade stragglers, ~16 trades in top-40 view) plus names beyond this run's top-40 query — flagged for next month's run.

### Safety hold
🔒 **Nothing was written to Supabase** — unattended prod writes require human confirmation per prior safety rules. Applying the 31 proposed resolutions requires a follow-up approval turn or permission-settings change.

### Process improvement discovered
Congress.gov fetches for large states (CA especially) get token-limited by the fetch tool, but raw response is saved to disk and can be parsed locally via bash/python without needing network access again — useful pattern for future runs.

---

### Still pending (from Aug 26)
⏳ **Test push end-to-end on Chrome + Safari** — Critical Phase 2 blocker. `push_subscriptions` table still has 0 rows (no real test subscribers). User priority: "Let's get this done" — scheduled for next session.

---

# ⚡ Recent Work — August 26, 2026

## Deployment Verification & Push Testing Ready
**Status:** Pre-launch infrastructure verified; push testing (Phase 2 blocker) flagged as next priority  
**Progress:** Gantt 16/35 (46%) — continuing sprint momentum

### Completed Today
✅ **Stripe price configuration verified** — One product (CivicWatch Pro), one price ($9.99 USD/month), no duplicates. Account clean on both Stripe and Vercel.

✅ **VAPID env vars deployed to Vercel** — Public/private key pair added; prerequisite for Web Push API production launch confirmed.

### Pending (Flagged as Next Priority)
⏳ **Test push end-to-end on Chrome + Safari** — Critical Phase 2 blocker. Current `push_subscriptions` table has 0 rows (no real test subscribers yet). Needs manual subscription flow testing once subscriber DB has data. **User priority: "Let's get this done"** → scheduled for next session.

### In Progress (Blocked Temporarily)
🔄 **Bioguide_id backfill check** — Monthly maintenance scheduled task attempted to run (check-only, no DB writes). Safety classifier temporarily unavailable; will retry once classifier restored. Task designed to propose resolutions without applying them, allowing human confirmation before actual UPDATE.

---

# ⚡ Recent Work — August 25, 2026

## Push Notifications — VAPID Environment Variables
**Status:** VAPID public/private key pair added to Vercel environment variables  
**Progress:** Gantt 16/35 (46%) — 4 items completed this sprint

✅ **VAPID env vars to Vercel — COMPLETED**
- Added Voluntary Application Server Identification (VAPID) public/private key pair to Vercel environment variables
- Prerequisite for Web Push API to work in production
- Current `push_subscriptions` table has 0 rows — no users have subscribed yet

⏳ **Test push end-to-end on Chrome + Safari — PENDING (next priority)**
- Blocked by lack of real test subscribers
- Need to verify push delivery works on both browsers before Phase 2
- Will require manual subscription flow testing once subscriber DB is populated

---

# ⚡ Recent Work — August 24, 2026

## Accessibility Audit (WCAG 2.1 AA Deep Dive)
**Status:** Comprehensive audit completed; 8 critical gaps documented with remediation guidance  
**Risk:** ADA Title III web liability exposure; similar issues routinely trigger demand letters

### What's already in place
- `<html lang="en">`, semantic landmarks (`main`, `nav`, `header`, `footer`)
- Alt text on images (26 instances, 3 correctly empty for decorative)
- All raw `<img>` migrated to Next Image
- `ExitIntentModal` has `aria-modal` + `aria-labelledby`

### Critical gaps (WCAG 2.1 AA failures)
1. **Form labels unassociated** — Zero `htmlFor` in entire app; labels sit as siblings → screen reader says "edit text, blank" (refund form, search, settings). WCAG 1.3.1 / 3.3.2 / 4.1.2.
2. **Almost no ARIA** — 13 aria attributes across 104 buttons + ~1,180 divs. 71 emoji buttons unlabeled.
3. **No focus styling** — Not a single `:focus` or `:focus-visible` rule; `outline: none` in modal. Dark theme leaves keyboard users with default or no visible focus.
4. **Modal keyboard trap risk** — No Escape handler, no focus trap or restore. WCAG 2.1.2.
5. **No skip-to-content link, no tabIndex management, no aria-live** → filter/search updates silent
6. **Data as divs, not tables** — One `<table>` in admin; for a congressional trading platform, that's a functional barrier. WCAG 1.3.1.
7. **No prefers-reduced-motion** — Three.js Capitol scene + scroll animations ignore motion preferences
8. **No accessibility statement page** — privacy, terms, and refund-policy exist; a11y statement missing

### CI/tooling gaps
- No a11y CI gate beyond jsx-a11y rules in eslint-config-next
- `civicwatch-launch-checklist.md` still has "Lighthouse — 100 Accessibility" unchecked

### Recommended next step
High-impact fixes (label associations, focus styles, skip link, modal keyboard handling) would be a few hours of work and clear most of what automated scanners flag. **This is a launch-gate decision** — either fix it before ship or accept the legal risk and document that choice.

## Checkout Flow Verification
**Status:** End-to-end flow tested; HMR timing artifact identified (dev-only, not production)  
**Next:** Hard-refresh `/plan` tab and rerun full checkout + undo-send countdown test

### What was tested
- User flow: address/birthday entry → generate plan → select stops → "Get this plan — $7" button → redirect to `/plan/customize/[token]`

### Issue found (dev-only, not a code bug)
HMR client reconnect race condition: when dev server restarts (for `--env-file` fix from prior session), a lingering old `/plan` tab's HMR websocket connection triggers a full reload, which wins a race against the in-flight navigation to `/plan/customize/[token]`. Browser snaps back to `/plan` instead.

**Fix:** Hard-refresh (Cmd+Shift+R) the `/plan` tab once, then rerun checkout. Checkout logic itself is correct; this is dev-server-restart artifact, would never happen in production or a fresh tab.

### Still to verify
Once on customize page: full personalize → Save and send flow, plus undo-send countdown. (Earlier "Sent!" instant-delivery was the pre-Redis-fix bug; countdown should work now.)

---

# ⚡ Recent Work — August 22, 2026

**No sessions recorded.** No CivicWatch feature work today.

---

# ⚡ Recent Work — August 20, 2026

**No CivicWatch feature work today.** CivicWatch was audited as part of a cross-project status dashboard creation. Portfolio audit shows CivicWatch at **43% complete (35 of 81 tasks)**, with all August 19 blockers still pending:

- Photo field verification on Mac browser (automation limitation — images `loading="lazy"` don't paint in background tabs)
- Self-hosting founding documents
- CSP headers in production  
- Committee ingest run on Mac (5 commits awaiting push)
- ADA remediation decision

No changes to feature status, tech stack, or open items. All remain as logged August 19.

---

# ⚡ Recent Work — August 19, 2026

## Committee Memberships & Conflict Scoring (`committee_memberships` table)
**Status:** Migration applied to production; 5 unpushed commits awaiting ingest run  
**Branch:** Working on conflict-score routes

- Applied `migrations/010_committee_memberships.sql` to production (table + indexes + read-only RLS)
- Created `scripts/ingest-committees.mjs` to join HSAG (full committees) and HSAG22 (subcommittees) YAML snapshots; dry-run by default
- Extracted `lib/congressSession.js` for Congress arithmetic logic — both ingest and conflict-score routes depend on it; a drifting copy would silently return zero committees
- Rewired broken routes (`/api/conflict-score?bioguideId=...`) to read the table instead of falling through
- **Verified before shipping:** YAML shapes against live files, `currentCongress` across Jan-3 boundary (e.g., 2025-01-02 = 118th), `buildRows` against fixtures
- **Tenure & scoring note:** Upstream files are current snapshot only, so scoring is scoped to 119th Congress with response disclosing that. `totalTradesReviewed` now counts only *eligible* trades; `totalTradesOnFile` reports all; older trades shown but not scored (only 2025–26 can be flagged)
- **Sector coverage:** 27 of 43 committees map; unmapped correctly (Ethics, Rules, Budget). **Gaps:** Appropriations, Environment & Public Workforce, Education & Workforce. Ingest prints coverage on every run.
- **Blocker:** Sandbox egress blocks `raw.githubusercontent.com`; ingest script must run on Mac with `.env.local`:
  ```bash
  npm install
  node --env-file=.env.local scripts/ingest-committees.mjs       # read coverage report
  node --env-file=.env.local scripts/ingest-committees.mjs --apply
  ```
- Commits waiting push (will push after ingest runs).

## Accessibility Audit (WCAG 2.1 AA gaps)
**Status:** Comprehensive audit completed; critical gaps identified; high-impact fixes outlined  
**Risk:** ADA Title III web liability; similar issues routinely trigger demand letters

### In place
- `<html lang="en">`, semantic landmarks, alt text on images (26 instances, 3 empty for decorative), Next Image migration complete
- `ExitIntentModal` has `aria-modal` + `aria-labelledby`

### Critical gaps
- **Form labels unassociated:** Zero `htmlFor` across app. Labels sit as siblings → screen reader says "edit text, blank" (affects refund form, search, settings). WCAG 1.3.1 / 3.3.2 / 4.1.2.
- **Almost no ARIA:** 13 aria attributes across 104 buttons + ~1,180 divs. 71 emoji buttons unlabeled.
- **No focus styling:** No `:focus` or `:focus-visible` rules; `outline: none` in modal. Keyboard users get default rings (dark theme) or none.
- **Modal keyboard trap risk:** No Escape handler, no focus trap/restore. WCAG 2.1.2.
- **No skip-to-content link, no tabIndex management, no aria-live** → filter/search updates silent
- **Data as divs, not tables:** One `<table>` in admin; for a trading platform, that's a functional barrier
- **No prefers-reduced-motion** despite three.js Capitol scene + scroll animations
- **No accessibility statement** (privacy, terms, refund-policy exist)
- **No a11y CI gate** beyond jsx-a11y in eslint-config-next; launch checklist still has Lighthouse a11y unchecked

### Recommended fixes (few hours)
Label associations, focus styles, skip link, modal keyboard handling would clear most of what automated scanners flag. Not a legal blocker yet, but treating it as launch-gate decision.

## Production Verification (Photo data + CSP follow-up)
**Status:** Photo field confirmed live; image fetch verified; visual confirmation needed from Mac browser

### Confirmed working
- `/api/congress?type=members&state=CA` returns `photo: "/api/rep-photo/G000607"` (was missing entirely)
- Map sidebar renders **6 `<Image>` elements** (was falling through to initials)
- Photo API returns `200 image/webp`, 13KB, in 51ms
- Logo, Declaration tab, single-row header all visual ✓

### Unverified (automation limitation)
- Actual photo paint: automation tab is `hidden`/unfocused; `loading="lazy"` images don't fetch in background tabs. User browser confirmation needed: open `civicwatch.app/dashboard`, look at California panel. Should see faces, not GJ/KK/TM initials.

### Still outstanding
- Self-hosting the two founding-document scans (currently third-party CDN)
- CSP headers missing in production

---

# 📋 Open Items

## Blocking launch
- [ ] Photo field verification on Mac browser (user-facing visual check needed)
- [ ] Self-hosting founding documents (scan files + serve from /public or CDN)
- [ ] CSP headers in production (security headers for X-Frame-Options, etc.)
- [ ] Committee ingest run on Mac (5 commits waiting push after ingest runs)
- [ ] ADA remediation decision (fix high-impact gaps or accept risk)
- [ ] Push testing end-to-end on Chrome + Safari (Phase 2 critical path blocker)

## Post-launch
- [ ] Full accessibility overhaul if proceeding (forms, ARIA, focus mgmt, skip link, tables)
- [ ] Sector mapping for Appropriations, Environment, Education committees
- [ ] a11y CI gate + testing
- [ ] Bioguide_id backfill: apply proposed resolutions (pending human confirmation)

---

# 🚀 Feature Status

- **Committee Memberships:** 🟡 In production (migration + routes live; ingest pending)
- **Conflict Score:** 🟡 Routes rewired to read `committee_memberships` table
- **Rep Photos:** 🟡 API field live; image fetches confirmed; paint pending user verification
- **Push Notifications:** 🟡 VAPID env vars deployed; testing pending
- **ADA Compliance:** 🔴 Not in scope; critical gaps documented

---

# Tech Stack / Data Sources

**No changes to stack.** Still:
- Next.js 14, Clerk auth, Supabase, Stripe, Vercel, Google Gemini
- Congressional data: ProPublica (votes), Senate (ledger), House (photo service), HSAG YAMLs (committees)

---

⚠️ **Note:** This file auto-updates daily via scheduled task analyzing session activity. Manual updates (decisions, decisions log, new findings) should be added directly by the project owner.
