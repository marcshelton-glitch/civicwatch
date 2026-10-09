## ⚡ 2026-10-08 — Bioguide Coverage Confirmed (Automated Daily Check)

**Status: Launch on track — bioguide backfill audit confirmed 95.7% coverage, no degradation**

### Daily Work (2026-10-08)
- **Bioguide backfill maintenance check (automated):** Reconfirmed 95.7% coverage (5,034 of 5,259 trades resolved)
  - Coverage stable since Oct 1 analysis
  - 28 high-confidence match proposals remain valid (see Oct 1 entry)
  - 2 existing-ID corrections still flagged: Moskowitz (M001219→M001217), Max Miller (M001225→M001222)
  - Root cause confirmed: ingest pipeline not assigning IDs to recent House filings (rows created after 2026-08-27)
  - **Status:** Awaiting human approval to apply fixes; no database writes executed

### 📋 Open Items
- [ ] Apply 28 proposed bioguide UPDATEs to `fd_trades` (new rows with NULL IDs) — see Oct 1 for full list
- [ ] Apply 2 existing-ID corrections: Moskowitz (affects 17 trades), Max Miller (affects 29 trades)
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
- 🔄 Bioguide backfill (28 matches + 2 corrections proposed, awaiting human approval; ingest-level fix pending)

---

## ⚡ 2026-10-07 — Meta Ad Pilot (scheduled)

**Status: Launch on track — Meta ad pilot #47 scheduled for today**

### Daily Work (2026-10-07)
- **Meta ad pilot launch:** #47 scheduled for today (Oct 7-8) — publish pilot ad & record political-ad classification on Meta platform
- **No other CivicWatch development sessions captured for today** in automated session logs

### 📋 Open Items
- [ ] Complete #47: Publish pilot ad to Meta (Oct 7-8)
- [ ] Record Meta's political-ad classification for the pilot
- [ ] Review 28 proposed bioguide new-row matches and 3 existing-ID corrections in `docs/bioguide-backfill-check-2026-10-01.md` (pending since Oct 1)
- [ ] Apply approved UPDATEs to `fd_trades.bioguide_id` (with human confirmation for the 3 corrections)
- [ ] Monitor upcoming ingest runs to confirm recent-row issue is fixed at source (otherwise repeats monthly)
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
- 🔄 Bioguide backfill (analysis complete, awaiting human approval + ingest fix verification)

---

## ⚡ 2026-10-06 — Status Check (bioguide backfill analysis reviewed)

**Status: Bioguide backfill proposals remain pending human review; launch on track**

### Daily Work (2026-10-06)
- **Bioguide backfill review:** Session confirmed prior analysis — 95.7% coverage maintained, 28 high-confidence match proposals + 2 wrong-ID corrections in `docs/bioguide-backfill-check-2026-10-01.md`
  - No new trade data changes; analysis stands as documented Oct 1
  - **Next step:** Await human approval to apply fixes to database

---

## ⚡ 2026-10-01 — Bioguide Backfill Analysis: 95.7% Coverage, 28 High-Confidence Matches Proposed

**Status: Bioguide data-quality audit complete — 225 unresolved trades analyzed, 28 matches + 2 ID corrections proposed**

### Daily Work (2026-10-01)

**Bioguide Trade ID Backfill Analysis**
- **Coverage achieved:** 95.7% (5,034 of 5,259 trades have `bioguide_id`) — 225 unresolved remain
- **Unresolved trades root cause:** All unresolved rows created on/after 2026-08-27 (ingest pipeline not assigning IDs to recent House filings; older rows already have IDs)
  - **Recommendation:** Fix at ingest level to prevent this list recurring monthly
- **Matching method:** Congress.gov API unreachable (fetch refused), so used three fallback checks:
  1. **Earlier rows:** ID already assigned to same surname + state in older rows
  2. **Committee data:** Cross-check against `committee_memberships` (Congress.gov source), party match required
  3. **Congress.gov search:** Web lookup where first two disagreed
- **Result:** 100% of 124 high-priority trades matched (28 names with 3+ unresolved trades each)

**Proposed Updates (28 high-confidence matches, all new rows with NULL bioguide_id):**
- Taylor | OH | T000490 | 8 trades
- Hern | OK | H001082 | 7 trades
- Allen | GA | A000372 | 6 trades
- DelBene | WA | D000617 | 6 trades
- Kelly | PA | K000376 | 6 trades
- Cohen | TN | C001068 | 5 trades
- Peters | CA | P000608 | 5 trades
- Fields | LA | F000110 | 5 trades
- Gottheimer | NJ | G000583 | 5 trades
- Salazar | FL | S000168 | 5 trades
- Doggett | TX | D000399 | 5 trades
- Cisneros | CA | C001123 | 5 trades
- Kean | NJ | K000398 | 5 trades
- Delaney | MD | M001232 | 5 trades
- McGuire | VA | M001239 | 5 trades
- Moore | NC | M001236 | 4 trades
- Morrison | MN | M001234 | 4 trades
- Moskowitz | FL | M001217 | 4 trades
- Dingell (Debbie) | MI | D000624 | 3 trades
- Donalds | FL | D000032 | 3 trades
- McCormick | GA | M001218 | 3 trades
- Miller (Max) | OH | M001222 | 3 trades
- Timmons | SC | T000480 | 3 trades
- Keating | MA | K000375 | 3 trades
- Beyer | VA | B001292 | 3 trades
- Biggs | SC | B001325 | 3 trades
- Roy | TX | R000614 | 3 trades
- Sessions | TX | S000250 | 3 trades

**Existing Wrong IDs Flagged (need human review before correction):**
- **Moskowitz, FL-23:** Currently `M001219`, should be `M001217` (Jared Moskowitz) — affects 17 trades
- **Max Miller, OH-07:** Currently `M001225`, should be `M001222` — affects 29 trades
- **John D. Dingell, MI-12:** 1 row currently listed with Debbie Dingell's `D000624`; check if should be `D000355` (John Dingell Jr.) before updating

**Report Generated**
- File: `docs/bioguide-backfill-check-2026-10-01.md`
- Contains: full matching logic, example UPDATE statements (scoped by first name to avoid family mix-ups), coverage stats
- Status: **Proposals only — no writes to Supabase yet** (awaiting human review + approval)

### Tech Stack
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
