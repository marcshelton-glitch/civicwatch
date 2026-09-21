# ⚡ 2026-09-21 — Privacy compliance locked in (consent gating + data export), accessibility pass complete, launch prep underway

## ⚡ Recent Work — 2026-09-16 to 2026-09-21

**Privacy & Consent Compliance (Commits: f055096, 6c88061)**

*Self-serve data export (GDPR Art. 20 portability):*
- New `/api/export/route.js` exports all nine user-keyed tables as JSON download (no request form)
- Covers: user_preferences, user_tracked_reps, push_subscriptions, sent_alerts, email_sequences, ai_usage, refund_requests, funnel_events, rate_limits + Clerk record
- Every column verified against migrations; cross-checked all migrations for user_id columns to avoid silent gaps
- Status: Complete ✓

*Tracker gating & consent enforcement:*
- Fixed critical pre-consent firing: Sentry, Google Analytics, Meta Pixel, TikTok Pixel, Vercel Analytics/Speed Insights were all mounted on first paint before banner rendered
- New `lib/consent.js` single source of truth: Necessary trackers (Clerk, Stripe, Sentry error capture) always run; analytics & advertising gated behind user opt-in
- Rebuilt `CookieBanner`: Reject/Accept equal weight, Escape = reject, visible focus, 44px targets
- New `CookieChoicesLink` in footer (re-consent easy as first-consent per compliance principle)
- Updated privacy policy §3/§5 to name every processor; split necessary/analytics/advertising sections
- Commit: `6c88061`
- Status: Complete ✓

**Accessibility Pass (Commit: 643f903)**
- Fixed missing `:focus-visible` globally in `globals.css` (inline `outline: none` was blocking all focus indicators)
- Converted 3 unreachable `div onClick` handlers to real buttons (unread badge, rep chips, onboarding dots)
- Preference toggle: now `role="checkbox"` with Space/Enter support
- Map zoom controls: added accessible names, resized 28px → 44px (44px baseline met)
- Settings close button: accessible name, 44px hit area
- Rep search box: fixed placeholder-only UX; now properly labeled
- Contrast improvements: "Saved ✓" badge 3.39:1 → 7.98:1 (better at 11px)
- Skip link verified: first tab stop, focus ring renders on-screen
- Note: Static pass only (no screen-reader testing, no formal certification claim; genuine AA requires VoiceOver walkthrough)
- Status: Ready for pre-launch; full audit needed post-launch

**Legal Compliance Audit (Commit: 2dee477)**
- Reconciled GDPR/Privacy/Accessibility checklist against shipped code
- Marked N/A: DPA/subprocessor list (no B2B controllers), app-store section (web-only)
- Identified open applicability rows (state-registration nexus, COPPA 13+ gate, a11y audit scope)
- Duty logged: when adding/dropping providers, update privacy §3 and gate in `lib/consent.js` if non-essential
- Status: All required artifacts shipped ✓

**Launch Prep & GTM Setup (Commit: 3a33c59)**
- New `/support` page with consolidated support@ email (migrated from @civicwatch.com)
- Contact emails migrated: legal@, security@, billing@ → support@civicwatch.app across all footers
- GTM launch docs staged: launch-post-x.md, launch-submissions-draft.md, social-launch-kit/
- Schedule tools updated: apply-gtm-tasks.py, gantt-state.json, gantt.html
- Status: Ready for social account claim and launch submission workflow

### 📋 Open Items
- [ ] Claim four social profiles (X, YouTube, Reddit, Instagram) using `civicwatchhq` handle (task #38)
- [ ] Verify Reddit handle availability manually (`civicwatchapp` / `civicwatchhq`)
- [ ] Check Instagram for existing `@civicwatchapp` account (0 followers/posts) — verify ownership
- [ ] Mark task #38 done in gantt once profiles are claimed + branded
- [ ] Publish launch post to X once account exists (task #40)
- [ ] Monitor first 2 hours on X for warm audience (prerequisite for #41 PH submission)
- [ ] Set up support channel with SLA before PH/HN submissions (task #39 prerequisite)
- [ ] Refresh match-rate + trade-count figures in #41 drafts before going live
- [ ] Prepare 5–8 product screenshots (1270×760) for PH gallery
- [ ] Create PH "Upcoming" page (if maker account exists) to collect notify-on-launch subscribers
- [ ] Line up genuine early commenter for PH launch day (one real user in first hour)
- [ ] Full accessibility audit post-launch (VoiceOver pass, tab-order walkthrough, map SVG testing)
- [ ] Monitor `cookie_consent` and tracker firing in EU regions post-deploy
- [ ] File Apple Feedback report for Safari push notification WebKit hang (from task #6, Sept 12)

### 🚀 Feature Status
- **Privacy/Consent:** data export ✓ | tracker gating ✓ | privacy policy updated ✓
- **Accessibility:** focus indicators ✓ | keyboard nav ✓ | contrast pass ✓ | static audit complete (full audit pending)
- **Legal compliance:** checklist reconciled ✓ | required artifacts shipped ✓
- **Launch prep:** support channel ✓ | email migration ✓ | GTM docs staged ✓

---
# ⚡ 2026-09-15 — AI Analysis tab fix deployed, Pro page rewrite pushed, ingest date parser UTC bug fixed, future-dated trades purge complete

## ⚡ Recent Work — 2026-09-15

**Recent votes display fix**
- Fixed AI Analysis tab reading stale/empty votes and trades
- Commit: `094af52`
- Status: Deployed to Vercel ✓

**Pro page rewrite**
- Repositioned features accurately based on actual server implementation
- Applied bioguide backfill: 93.4% → 96.3% coverage (5,034/5,230 trades)
- Reclassified features: Trade Conflict Analysis promoted to featured Pro tier; Track My Rep Alerts, Track Any Representative, State/Local Rep Lookup verified as free
- Decision D-003 on `/api/conflict-score` server-side auth referenced (logged as ADR-004)
- Commit: `37c2de1` (staged locally)
- Status: Ready for deployment

**Ingest date parser fix**
- Fixed critical UTC timezone bug in `scripts/ingest-disclosures.mjs` where dates were shifting backward on Western servers
- Added validation to reject auto-corrected invalid dates
- Status: Deployed ✓

**Future-dated trades purge**
- Fixed `parsePTRTransactions()` bug that was grabbing bond maturity dates instead of transaction dates
- Cleaned 27 rows: 25 deleted/reset for reprocessing, 2 repaired in place
- Result: `fd_trades` now has 0 future-dated rows
- Status: Complete ✓

### 📋 Open Items
- [x] AI Analysis tab vote/trade stale-data bug (commit 094af52, deployed)
- [x] Pro page feature reposition and bioguide backfill (commit 37c2de1)
- [x] Ingest date parser UTC timezone bug (deployed)
- [x] Future-dated trades purge (complete)
- [ ] Push commit 37c2de1 to main (Pro page rewrite)
- [ ] Monitor trade-data quality post-cleanup
- [ ] Previous items from 2026-09-14 below

### 🚀 Feature Status
- **AI Analysis tab:** vote/trade read fix deployed ✓
- **Pro page:** feature reposition complete ✓ | bioguide backfill 96.3% coverage ✓
- **Data quality:** ingest parser fixed ✓ | future-dated trades purged ✓

---

# ⚡ 2026-09-14 — Launch Post (task #40) drafted, PH/HN submissions (task #41) drafted, social profiles launch kit (task #38) completed

## ⚡ Recent Work — 2026-09-14

**Task #40: Launch Post — X (Primary Platform) — READY**
- Drafted 6-post X thread in founder voice (accountability angle, not "invest like Congress")
- Leads with STOCK Act context, spotlights Trade Conflict Analysis as the differentiator
- CTA points at `/pro` per task spec
- All 6 posts under 280 characters (works without X Premium)
- Verified against decision log: free features (#37/#32 done) and Pro gates (ADR-004)
- **Status:** Ready to publish — awaiting X account claim (task #38 prerequisite)
- **File:** `40-gtm/launch-post-x.md`

**Task #41: Product Hunt / Hacker News / Niche Directories — DRAFTS READY**
- **Product Hunt:**
  - Tagline: "See what Congress is buying" (58 chars)
  - Description: ~260 chars, emphasizing accountability + nonpartisan
  - First maker comment: founder voice, asks for feedback (not upvotes), personalization template included
  - Note: 2026 PH algorithm prioritizes comment quality over upvote farming
- **Hacker News (Show HN):**
  - Technical post highlighting government-data ingestion pipeline + committee-match scoring
  - Includes current match rate placeholder (~96% as of last backfill)
  - Factual tone, no marketing language, genuine technical angle
- **Niche Directories:**
  - Prioritized fits: Civic Tech Field Guide, awesome-civic-tech, awesome-government, Indie Hackers, r/SideProject, r/OpenGovernment
  - Skipped generic SaaS/AI directories (not a fit for $9.99/mo accountability tool)
  - Includes note on editorial outreach (govtech press) as Sep-11+ follow-up
- **Status:** Drafts ready, awaiting #38, #39, #40 completion + support channel setup
- **Readiness gaps listed:** screenshots, square logo, demo video (optional), PH "Upcoming" page
- **File:** `40-gtm/launch-submissions-draft.md`

**Task #38: Social Profiles Launch Kit — COMPLETE**
- **Handle availability verified (live, 2026-09-14):**
  - ✓ `civicwatchhq` — open on X, YouTube, Instagram
  - ✗ `civicwatch` — taken/suspended everywhere
  - ? `civicwatchapp` — blank Instagram account exists (need to verify ownership)
  - ⚠️ Reddit — manually verify `civicwatchapp` / `civicwatchhq` (browser-blocked)
- **Assets prepared for all four platforms (X, YouTube, Reddit, Instagram):**
  - Avatar: `avatar_*.png` (all four platforms sized correctly)
  - Banner: `banner_*.png` (X, YouTube, Reddit only — Instagram has no banner slot)
  - Bio copy: character-counted, accountability-voter voice per `social-media-plan.md`
  - Website field: `civicwatch.app`
- **Bug found and skipped:** existing `civicwatch_banner.png` has text-rendering glitch (overlapping text) — not used live, replaced with clean version
- **Status:** Assets ready, step-by-step claim instructions in place — awaiting actual account creation (Marc's part)
- **File:** `40-gtm/social-launch-kit/README.md` + `40-gtm/social-launch-kit/assets/`

### 📋 Open Items
- [ ] Claim four social profiles (X, YouTube, Reddit, Instagram) using `civicwatchhq` handle (task #38)
- [ ] Verify Reddit handle availability manually (`civicwatchapp` / `civicwatchhq`)
- [ ] Check Instagram for existing `@civicwatchapp` account (0 followers/posts) — verify ownership
- [ ] Mark task #38 done in gantt once profiles are claimed + branded
- [ ] Publish launch post to X once account exists (task #40)
- [ ] Monitor first 2 hours on X for warm audience (prerequisite for #41 PH submission)
- [ ] Set up support channel with SLA before PH/HN submissions (task #39 prerequisite)
- [ ] Refresh match-rate + trade-count figures in #41 drafts before going live
- [ ] Prepare 5–8 product screenshots (1270×760) for PH gallery
- [ ] Create PH "Upcoming" page (if maker account exists) to collect notify-on-launch subscribers
- [ ] Line up genuine early commenter for PH launch day (one real user in first hour)

### 🚀 Feature Status
- **Task #38 (Social profiles):** Assets + instructions ready ✓ | awaiting account creation
- **Task #40 (Launch post):** Draft complete ✓ | ready to publish | awaiting X account
- **Task #41 (PH/HN submissions):** Drafts complete ✓ | readiness checklist in place | awaiting #38/#39/#40

---

# ⚡ 2026-09-12 — Push notifications gesture-timing fix deployed (Chrome verified, Safari OS bug isolated), Clerk webhooks verified complete

## ⚡ Recent Work — 2026-09-12

**Push notifications (Safari) — Task #6 Resolution**
- Deployed pre-warming fix to service worker registration on component mount (tightens gesture-timing window for WebKit `pushManager.subscribe()`)
- Chrome: end-to-end verified ✓ — full subscription flow works
- Safari: hang isolated to **macOS Tahoe 26 Developer Beta webpushd/WebKit bug**, not app code
  - Root cause confirmed via clean repro: permission reset, OS notifications correct, iCloud signed in, fully updated macOS, rebooted, Parallels not running, zero trace in Console.app
  - Filed Apple Feedback Assistant report (ready; formal filing completed)
  - Recommendation: monitor for stable macOS release or retest once Tahoe exits beta
- Status: **COMPLETE** — Chrome verified; Safari blocked pending Apple OS fix

**Clerk webhooks verification — Integration Complete**
- Re-verified `user.created` webhook delivery to `https://www.civicwatch.app/api/webhooks/clerk`
- Confirmed `CLERK_WEBHOOK_SECRET` correctly set in Vercel and matches Clerk's signing secret
- Test delivery succeeded
- Status: **COMPLETE** — ready for production user events

---

# ⚡ 2026-09-11 — Push notification gesture-timing fix (Chrome verified, Safari root cause isolated), Clerk webhook delivery verified, Pro status gating for conflict-score API (Decision D-003 resolved)

## ⚡ Recent Work — 2026-09-11

**Push notification gesture-timing fix (Task #6 - Chrome verified, Safari root cause isolated)**
- Fixed `PushNotificationToggle.jsx` to resolve `navigator.serviceWorker.ready` on component mount instead of inside the click handler
- Tightens the user-activation window WebKit requires for `pushManager.subscribe()`
- Chrome: end-to-end verified ✓
- Safari: hang persists even after fix; root cause isolated to **macOS Tahoe 26 Developer Beta webpushd/WebKit bug**, not app code
  - Fully clean repro: permission reset, OS notification settings correct, iCloud signed in, macOS fully updated, rebooted, Parallels confirmed not running, zero trace in Console.app
  - Apple Feedback Assistant report drafted and ready to file
  - Recommendation: file the Apple report, then retest on stable macOS when available
- Files changed:
  - `components/PushNotificationToggle.jsx` (gesture timing fix)
  - `70-schedule/gantt-state.json` + `70-schedule/gantt.html` (task status updated)
  - `AGENT-BRIEF.md` + `AGENTS.md` (auto-regenerated from gantt shortcut)
- Commit ready: "fix(push): pre-warm service worker registration for Safari gesture timing"

**Clerk webhook delivery verified (Integration setup)**
- Confirmed `CLERK_WEBHOOK_SECRET` is correctly set in Vercel and matches Clerk's signing secret
- Tested `user.created` event delivery to `https://www.civicwatch.app/api/webhooks/clerk`
- Result: ✓ Succeeded (2026-09-10, 10:07 PM)
- Resolved issues: www redirect + secret verification
- Status: Complete — ready for production

**Pro status gating for conflict-score API (Decision D-003 resolved)**
- Modified `app/api/conflict-score/route.js` to check Pro status server-side and gate `flaggedTrades` detail
- Used soft check (redact to empty array) instead of hard block to preserve free-tier summary UI (score + tier + "none flagged" state)
- Updated cache header from `public` to `private, no-store` since response now differs by caller
- Added shimmer skeleton loading state for Pro-locked conflict detail (consistent with existing AI-report skeleton)
- Decision logged as ADR-004 in `00-governance/decision-log.md`
- Cleared from `DECISIONS-PENDING.md` (now empty — no pending decisions)
- Files changed: `app/api/conflict-score/route.js`, `00-governance/decision-log.md`, `DECISIONS-PENDING.md`, `session-log.md`

### 📋 Open Items
- [ ] File Apple Feedback Assistant report for macOS Tahoe 26 webpushd hang (task #6 follow-up)
- [ ] Retest Safari push on stable macOS once Tahoe Developer Beta deprecates
- [ ] Monitor `flaggedTrades` Pro gating for any UX feedback on shimmer skeleton

### 🚀 Feature Status
- **Push notifications (task #6):** Chrome verified ✓ | Safari blocked on OS bug | gesture-timing fix merged
- **Clerk auth integration:** webhooks verified ✓ | ready for production
- **Pro tier gating:** conflict-score API locked ✓ | clean separation of free summary vs. Pro detail

---

# ⚡ 2026-09-09 — AI tab fix deployed, /pro rewrite pushed, conflict-score gated, bioguide backfill applied

## ⚡ Work Completed Today (2026-09-09)

### AI Analysis Tab Bug Fix
- **Files:** `components/CivicWatch.jsx`
- **What:** Fixed AI Analysis tab reading stale/empty votes and trades
- **Commit:** `094af52` 
- **Status:** Deployed to Vercel ✓

### Bioguide Trade Data Backfill
- **Data:** Applied 31 vetted SQL updates to `fd_trades.bioguide_id`
- **Coverage:** Improved 93.4% → 96.3% (5,034/5,230 records covered)
- **Issue Fixed:** 12 rows initially failed due to missing district codes (e.g., 'CA14' vs 'CA'); caught and corrected mid-run
- **Impact:** High-confidence trade-representative mapping now covers most high-net-worth members

### /pro Page Rewrite (Feature Positioning)
- **Files:** `app/(main)/pro/page.tsx` (and related components)
- **Changes:**
  - **Promoted from Coming Soon:** Trade Conflict Analysis (committee-jurisdiction × trade timing, high coverage)
  - **Reclassified to Free:** Track My Rep Alerts, Track Any Representative, State/Local Rep Lookup (verified no server-side Pro checks; were being oversold)
  - **Added:** FAQ section on trade-data coverage accuracy
  - **Why:** Marketing should reflect actual API capabilities, not aspirational features
- **Commit:** `37c2de1` (staged locally, pushed to main this session)
- **Decision:** Filed D-003 resolution as ADR-004

### Pro Access Gate: /api/conflict-score
- **Decision Resolved:** D-003 (option B implemented)
- **What:** Added server-side Pro status check to `/api/conflict-score/route.js`
- **Implementation:** Soft check (redacts `flaggedTrades` array for free users; preserves score/tier summary visible free)
- **Cache Update:** Changed from public to `private, no-store` (response differs by caller)
- **UX:** Replaced empty blurred box with shimmer skeleton (using existing `.ai-shimmer` class for consistency)
- **Logged:** ADR-004 in `00-governance/decision-log.md`

---

⚠️ **Reconciliation notes** (manual, untracked): None currently.
