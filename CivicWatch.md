## ⚡ 2026-10-24 — Data Integrity & Transparency Refactor

**Status: Major refactor completed — improving data honesty and compliance**

**Daily Work (Oct 23 PT = Oct 24 UTC early morning):**

This session involved a comprehensive refactor of CivicWatch's messaging and data sourcing, focused on regulatory compliance, transparency, and data quality:

- **Rename 'Conflict Score' → 'Committee Overlap'** (commit 382b25b) — removed red-flag language ("High", "flagged" in red), stopped emailing a made-up "conflict of interest" report (Day-7 email showed invented figures like "7.4/10 score"), renamed across API (`conflict-score/route.js`), Pro page, email sequences, settings, FAQ, page metadata, JSON-LD. Now displays as neutral gold tag with "Committee Overlap is not evidence of wrongdoing."
- **Fix deep links + vote labels** (PRs #8, #7) — 'Former Member of Congress' label now correct on direct links; vote source correctly labeled (Clerk XML vs GovTrack). Merged pull requests to main.
- **Reword AI rating as activity level** (commit 7b706f2) — remove prediction-based scoring claims from teaser (was implying predictive analysis; now says activity-based), base rating on actual data count, remove claims from locked teaser
- **House votes: read Clerk's XML directly** (commit 0cb0efd) — GovTrack is bot-walled; now parsing official House Clerk roll-call XML as authoritative source
- **Fix garbled names** (commit d5d0432) — data count-driven rating replaces prediction tier; gentler Clerk API access to avoid 429 errors
- **AI report truthfulness** (commit 8668285) — say 'insufficient data' honestly instead of generating spurious analysis when data is thin
- **Gemini model env-driven + 402 handling** (commits 06ce2b3, d656a77) — make Gemini model configurable via environment, treat HTTP 402 (quota exceeded) as 'busy' not 'failed'

**Why this matters:**
- Removes misleading language that could expose CivicWatch to regulatory/FTC scrutiny (no more "conflict" language without data)
- Fixes data quality issues (garbled member names, incorrect vote sources)
- Moves vote sourcing to official Clerk records (more reliable, authoritative, compliant)
- Makes AI rating transparent and data-grounded (activity-based count, not prediction-based scoring)
- Honest messaging in emails (no invented reports, no false figures)

**Files changed:** 12 files across API routes, email sequences, Pro page, settings, metadata, JSON-LD

**Commits pushed to main:**
- 382b25b Rename 'Conflict Score' to 'Committee Overlap'; stop emailing an invented report
- 0939b3c Merge pull request #8 from marcshelton-glitch/fix/deeplink-title-votes-label
- 840d87b Fix 'Former Member of Congress' on direct links; label votes by real source
- 71d7e88 Merge pull request #7 from marcshelton-glitch/fix/house-votes
- 7b706f2 Reword the AI rating as an activity level; remove claims from the locked teaser
- d5d0432 Rating decided by data count; fix garbled names; gentler Clerk access
- 0cb0efd Votes: read House roll calls from the Clerk's XML (GovTrack is bot-walled)
- 8668285 AI report: give it the data the page already has; say 'insufficient data' honestly
- 2bb3cf2 Merge pull request #6 from marcshelton-glitch/fix/gemini-model-env

**Next Steps — Verification Required:**
- [ ] Verify emails reflect new copy (committee overlap, no invented reports)
- [ ] Confirm vote labels show Clerk XML source on live site
- [ ] Check AI rating displays activity level (data count) not prediction score
- [ ] Monitor production to ensure 382b25b deployed successfully

### 📋 Open Items
- [ ] **URGENT: Apply 2 existing-ID corrections** (Moskowitz 17 trades, Max Miller 29 trades) — fixes Trade Conflict Analysis reporting
- [ ] **Verify John D. Dingell correction** — check trade year(s) to confirm if should be D000355 before applying
- [ ] Apply 28 proposed bioguide UPDATEs to `fd_trades` (new rows with NULL IDs) — see Oct 1 for full list
- [ ] Fix ingest pipeline to assign bioguide_id to recent House trade rows (prevents monthly recurrence)
- [ ] Monitor next ingest run to confirm ingest fix is deployed
- [ ] Complete #47: Publish Meta ad pilot & record political-ad classification (scheduled Oct 7-8)
- **#41** (Sep 28-30): Submit to Product Hunt, Hacker News, niche directories — **READY, submissions can proceed**
- **#46** (Oct 5-6): Add payment method & verify phone on Meta ad account
- **#48** (Oct 1): Lock AI presenter reference image for organic content

### 🚀 Feature Status
- ✅ Privacy & consent (GDPR Art. 20 data export, tracker gating)
- ✅ Accessibility (full AA compliance pass)
- ✅ Push notifications (Chrome + Safari end-to-end tested)
- ✅ Social profiles claimed (X, YouTube, Instagram, Facebook)
- ✅ Launch post published (@CivicWatchAlert, Sep 22)
- ✅ ProductHunt assets finalized
- ✅ Conversion pixel tracking (deployed & verified live)
- ✅ Senate disclosure ingest pipeline (Playwright workflow ready)
- ✅ Vote sourcing via official Clerk XML (GovTrack bot-walled)
- ✅ AI rating: activity-based, data-grounded (no prediction claims)
- ✅ Committee Overlap messaging: transparent, compliant
- ⏳ Meta ad account setup (payment method pending)
- ⏳ Directory submissions (gate: Sep 28, now active)
- 🔄 Bioguide backfill (28 matches + 3 corrections identified; awaiting human approval + ingest fix deployment)

---

## ⚡ 2026-10-23 — Status Check (No Development Sessions Captured)

**Status: Launch on track — automated daily check, no development work sessions captured**

### Daily Work (2026-10-23)
- **Daily reference update:** No CivicWatch development sessions found for October 23.
  - Scheduled daily update ran to confirm status
  - All features remain stable per Oct 22 audit
  - Pending items unchanged from Oct 22

### 📋 Open Items
- [ ] **URGENT: Apply 2 existing-ID corrections** (Moskowitz 17 trades, Max Miller 29 trades) — fixes Trade Conflict Analysis reporting
- [ ] **Verify John D. Dingell correction** — check trade year(s) to confirm if should be D000355 before applying
- [ ] Apply 28 proposed bioguide UPDATEs to `fd_trades` (new rows with NULL IDs) — see Oct 1 for full list
- [ ] Fix ingest pipeline to assign bioguide_id to recent House trade rows (prevents monthly recurrence)
- [ ] Monitor next ingest run to confirm ingest fix is deployed
- [ ] Complete #47: Publish Meta ad pilot & record political-ad classification (scheduled Oct 7-8)
- **#41** (Sep 28-30): Submit to Product Hunt, Hacker News, niche directories — **READY, submissions can proceed**
- **#46** (Oct 5-6): Add payment method & verify phone on Meta ad account
- **#48** (Oct 1): Lock AI presenter reference image for organic content

### 🚀 Feature Status (stable)
- ✅ Privacy & consent (GDPR Art. 20 data export, tracker gating)
- ✅ Accessibility (full AA compliance pass)
- ✅ Push notifications (Chrome + Safari end-to-end tested)
- ✅ Social profiles claimed (X, YouTube, Instagram, Facebook)
- ✅ Launch post published (@CivicWatchAlert, Sep 22)
- ✅ ProductHunt assets finalized
- ✅ Conversion pixel tracking (deployed & verified live)
- ✅ Senate disclosure ingest pipeline (Playwright workflow ready)
- ⏳ Meta ad account setup (payment method pending)
- ⏳ Directory submissions (gate: Sep 28, now active)
- 🔄 Bioguide backfill (28 matches + 3 corrections identified; awaiting human approval + ingest fix deployment)

---

## ⚡ 2026-10-22 — Status Check (No Development Sessions Captured)

**Status: Launch on track — automated daily check, no development work sessions captured**

### Daily Work (2026-10-22)
- **Daily reference update:** No CivicWatch development sessions found for October 22.
  - Scheduled daily update ran to confirm status
  - All features remain stable per Oct 20 audit
  - Pending items unchanged from Oct 20

### 📋 Open Items
- [ ] **URGENT: Apply 2 existing-ID corrections** (Moskowitz 17 trades, Max Miller 29 trades) — fixes Trade Conflict Analysis reporting
- [ ] **Verify John D. Dingell correction** — check trade year(s) to confirm if should be D000355 before applying
- [ ] Apply 28 proposed bioguide UPDATEs to `fd_trades` (new rows with NULL IDs) — see Oct 1 for full list
- [ ] Fix ingest pipeline to assign bioguide_id to recent House trade rows (prevents monthly recurrence)
- [ ] Monitor next ingest run to confirm ingest fix is deployed
- [ ] Complete #47: Publish Meta ad pilot & record political-ad classification (scheduled Oct 7-8)
- **#41** (Sep 28-30): Submit to Product Hunt, Hacker News, niche directories — **READY, submissions can proceed**
- **#46** (Oct 5-6): Add payment method & verify phone on Meta ad account
- **#48** (Oct 1): Lock AI presenter reference image for organic content

### 🚀 Feature Status (stable)
- ✅ Privacy & consent (GDPR Art. 20 data export, tracker gating)
- ✅ Accessibility (full AA compliance pass)
- ✅ Push notifications (Chrome + Safari end-to-end tested)
- ✅ Social profiles claimed (X, YouTube, Instagram, Facebook)
- ✅ Launch post published (@CivicWatchAlert, Sep 22)
- ✅ ProductHunt assets finalized
- ✅ Conversion pixel tracking (deployed & verified live)
- ✅ Senate disclosure ingest pipeline (Playwright workflow ready)
- ⏳ Meta ad account setup (payment method pending)
- ⏳ Directory submissions (gate: Sep 28, now active)
- 🔄 Bioguide backfill (28 matches + 3 corrections identified; awaiting human approval + ingest fix deployment)

---

## Tech Stack
- **Next.js 14** (frontend + API routes)
- **Supabase** (PostgreSQL + realtime + auth helpers)
- **Stripe** (billing + subscription management)
- **Clerk** (user authentication + management)
- **Vercel** (deployment)
- **Playwright** (Senate disclosure ingest)
- **Google Gemini 2.0 Flash** (AI analysis & vote summaries)

### Data Sources
- **House Clerk** (live trades via `house.gov/clerk`)
- **Congress.gov** (committees, member IDs, legislative data)
- **OpenSecrets** (wealth estimation via iCapital API — used for net worth labels)
- **X/Twitter API** (member social profiles, sentiment tracking)
- **YouTube/Instagram/Facebook** (member profiles for social claims)

### ⚠️ Reconciliation notes
- Meta ad account setup: awaiting payment method from founder
- Directory submissions: ready as of Sep 28; submissions can proceed whenever
- Next milestone: **Nov 5, 2026** (Election Day) — target 1,000 Pro subscribers
