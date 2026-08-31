# CivicWatch — Cowork Session Notes
*Last updated: May 2026 — pre-media-launch sprint*

## Status: All Critical Fixes Deployed ✅

---

## Bugs Fixed (All Pushed to Main)

### 1. Net Worth showing "data not available" for all reps ✅
**Root cause (2-layer bug):**
- Layer 1: `app/api/networth/route.js` had a Clerk auth gate (`auth()` from `@clerk/nextjs/server`). No Clerk middleware is registered in this project, so `userId` was always null → 401 returned → client got empty data. **Fix:** Removed auth import and `!userId` gate entirely. Net worth is public record. (commit `fa9dd3b0`)
- Layer 2: `components/CivicWatch.jsx` had `isLive &&` guarding the fdNetWorth fetch (line ~2329). Reps from Congress Members search have `isLive: false` (set at line ~1902), so the fetch never triggered. **Fix:** Removed `isLive &&` guard, kept `rep.source !== 'openstates'` check. (commit `7c242cbe`)

### 2. Leaderboard — former members missing party badges + photos ✅
**Root cause:** `currentMember=true` in Congress.gov API only returns active members. Former members (Lowenthal, Delaney, Gibbs, Diane Black) who top the leaderboard weren't found.
**Fix:** `app/api/leaderboard/route.js` now does 3 enrichment passes:
1. Bulk current-member lookup (3 × 250 results)
2. Individual `/v3/member/{bioguideId}` fetch for unmatched reps who have a bioguide_id — catches former members
3. Historical name-match fallback for reps with neither bioguide_id nor party
`app/leaderboard/page.js`: renders a gray "FORMER" chip next to former member names.

### 3. Trade codes showing as raw abbreviations ✅
**Fix:** `components/CivicWatch.jsx` — 5 locations updated:
- `tradeTypeLabel()` helper: `BUY` → "Purchase", `SELL` → "Sale", `EXCHANGE` → "Exchange"
- Public disclosures feed badge
- STOCK Act trade rows
- Expanded PTR trade rows
- Filing history badge: `P`→"PTR", `A`→"Annual", `D`→"Amendment", `G`→"New Member", `X`→"Extension", `W`→"Withdrawal"

### 4. Vercel builds failing for weeks ✅
**Root cause:** Sentry wizard added `pages/_error.jsx` (Pages Router) which required `pages/_document.jsx`; both caused PageNotFoundError in App Router project.
**Fix:** Deleted both files (commit `c01bd34`). Builds are now green.

### 5. Rep photos returning 403 ✅
- Added `User-Agent` and `Accept` headers to bioguide.congress.gov fetches in `app/api/rep-photo/route.js`

### 6. Google Analytics GA4 ✅
- Added `GoogleAnalytics` from `@next/third-parties/google` to `app/layout.js`
- **TODO (manual):** Create GA4 property at analytics.google.com, add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` to Vercel Environment Variables

### 7. Press page ✅
- Created `app/press/page.js` (contact: marcshelton@gmail.com)
- Added `/press` to public routes in `proxy.ts`

### 8. Constitution lightbox ✅
- `app/constitution/page.js` has lightbox (useState, cursor:pointer, fixed overlay modal)

---

## Architecture Notes

### Net Worth Data Flow
- Supabase table: `fd_net_worth` (504 rows, 351 with bioguide_id populated)
- API: `app/api/networth/route.js` — primary query by bioguide_id, fallback by last_name + state
- Component: `components/CivicWatch.jsx` — fetch fires when `rep.source !== 'openstates'`
- Display: entry/today stat cards, SVG sparkline, growth vs salary callout, Pro gate blur overlay

### Key IDs
- Adam Schiff bioguide_id: `S001150`
- Bioguide format: 1 letter + 6 digits

### Deployment
- Platform: Vercel (civicwatch.app)
- Repo: `/Users/marcshelton/civicwatch`
- Branch strategy: git worktrees per task → rebase → push to main
- Build trigger: push to main → auto-deploy on Vercel

---

## Remaining Manual Tasks (Marc must do)
- [ ] GA4: Create property + add `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var to Vercel
- [ ] Google Search Console: Submit sitemap (after GA4)
- [ ] Stripe: Test checkout flow end-to-end
- [ ] Email flows: Confirm welcome/verification/cancellation emails send correctly
- [ ] iPhone Safari: Full walkthrough
- [ ] Lighthouse audit
