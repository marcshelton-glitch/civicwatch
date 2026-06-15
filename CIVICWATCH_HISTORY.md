# CivicWatch Development History

Last updated: 2026-04-29. This file is the canonical record of everything built across all development sessions. Future Claude sessions should read this first.

---

## Project Identity

| Item | Value |
|------|-------|
| **Live URL** | https://civicwatch.app |
| **Real codebase** | `/Users/marcshelton/civicwatch/` |
| **Dead-end clone** | `/Users/marcshelton/Flash Reader/` — Vite prototype, NOT connected to Vercel, ignore it |
| **Framework** | Next.js 16.2.2 (App Router, Turbopack) |
| **Deployment** | Vercel, auto-deploy from `main` branch |
| **Vercel project ID** | `prj_T6SQqXCl3dlHsmHdfptW7fQJTl2t` |
| **Vercel team** | `team_xqBfmmND8dVo0xUIBIbgJD36` (`marcshelton-glitchs-projects`) |
| **GitHub repo** | `github.com/marcshelton-glitch/civicwatch` (private) |

---

## Critical Gotchas

1. **Always work in `/Users/marcshelton/civicwatch/`** — the Flash Reader directory is a dead Vite clone that is not connected to Vercel. Early sessions wasted time there.
2. **Clerk blocks localhost** — production Clerk keys are domain-locked to `civicwatch.app`. The app cannot be previewed locally; deploy to Vercel to verify UI changes.
3. **ProPublica search endpoint is `/search.json`** — NOT `/organizations.json` (404). Revenue is NOT in search results; fetch separately via `/organizations/{ein}.json` → `filings_with_data[0].totrevenue`.
4. **Cicero API key is present in `.env.local`** but needs to be confirmed in Vercel env vars for production local official cards.
5. **`fd_trades` Supabase table** must be populated via `scripts/ingest-disclosures.js` before Supabase-first trade history works for House members.

---

## Tech Stack

### Core
- **Next.js 16.2.2** — App Router, server components, `next: { revalidate }` caching
- **React 19.2.4**
- **Tailwind** (via inline styles + globals.css)

### Authentication
- **Clerk** (`@clerk/nextjs ^7.0.8`) — production keys, domain-locked to `civicwatch.app`
- Pro membership stored in `user.publicMetadata.isPro` (boolean)
- Sign-in: `/sign-in`, sign-up: `/sign-up`, after auth: `/dashboard`

### Database
- **Supabase** (`@supabase/supabase-js ^2.101.1`)
- Tables: `fd_trades`, `fd_filings`, `fd_net_worth`
- `fd_trades`: House PTR filings ingested by `scripts/ingest-disclosures.js`
- `fd_filings`: index of disclosure PDFs
- `fd_net_worth`: annual financial disclosure net worth figures

### Payments
- **Stripe** (`stripe ^21.0.1`) — live keys, Pro plan at `STRIPE_PRO_PRICE_ID`
- Webhook at `/api/webhooks/stripe`
- Billing portal at `/api/billing-portal`

### Email
- **Resend** (`resend ^6.10.0`)
- From: `noreply@civicwatch.app` (transactional), `support@civicwatch.app` (support)
- Sends: Pro welcome email on subscription, cancellation email on downgrade

### AI
- **Anthropic SDK** (`@anthropic-ai/sdk ^0.88.0`) — AI analysis tab in rep profiles
- **Google Generative AI** (`@google/generative-ai ^0.24.1`) — dev dependency for ingestion scripts

### UI Libraries
- `lucide-react ^1.7.0` — icons
- `react-simple-maps ^3.0.0` — US map component

---

## Design System

| Token | Value |
|-------|-------|
| Navy (primary bg) | `#0A1628` |
| Gold (accent) | `#D4AF37` |
| Red (secondary accent) | `#B22234` |
| Heading font | Playfair Display (Google Fonts) |
| Body font | Source Serif 4 (Google Fonts) |

Party colors in `InitialsAvatar`: Democrat = navy-blue `#1a3a6e`, Republican = dark-red `#8b1a1a`

---

## Environment Variables

All must be present in both `.env.local` (local) and Vercel project settings.

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_PRICE_ID
CONGRESS_API_KEY
FEC_API_KEY
NEXT_PUBLIC_APP_URL=https://civicwatch.app
RESEND_API_KEY
GOOGLE_AI_API_KEY
GOOGLE_CIVIC_API_KEY        (legacy, kept for reference)
OPENSTATES_API_KEY
LEGISCAN_API_KEY
CICERO_API_KEY              (get free key at cicerodata.com — needed for local official cards)
```

---

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/congress` | GET | Clerk | Rep detail: votes (GovTrack), trades (Supabase/House Clerk), docket, bio, town halls (Mobilize America) |
| `/api/civic` | GET | Clerk | Address lookup → federal + state + local officials (OpenStates, Cicero, Census) |
| `/api/fec` | GET | Clerk | FEC campaign finance data |
| `/api/nonprofits` | GET | Clerk | ProPublica Nonprofit Explorer — reps' associated nonprofits |
| `/api/analyze-rep` | POST | Clerk (Pro) | AI analysis of rep via Anthropic SDK |
| `/api/representatives` | GET | Public | Representative search |
| `/api/subscribe` | POST | Clerk | Create Stripe checkout session |
| `/api/billing-portal` | POST | Clerk | Create Stripe billing portal session |
| `/api/webhooks/stripe` | POST | Stripe sig | Handle subscription events, send emails via Resend |

### ProPublica Nonprofit Explorer API
- Base: `https://projects.propublica.org/nonprofits/api/v2`
- No API key required
- Search: `GET /search.json?q={query}&state[id]={state}&per_page=25`
- Org detail: `GET /organizations/{ein}.json` → `filings_with_data[0].totrevenue`
- Revenue is NOT returned in search results — must be fetched per-EIN

---

## Files Created/Modified by Session

### Session 1 (Apr 17, 2026) — Initial Build
Commits: `71b42ab` through `59563b3`
- Initial Next.js app scaffold
- Clerk auth integration
- Landing page (`app/page.js`)
- Dashboard (`app/dashboard/page.js`)
- `components/CivicWatch.jsx` — main app component (Congress.gov data, mock alerts)
- `app/api/congress/route.js` — Congress.gov rep detail
- Stripe subscription flow (`app/api/subscribe/route.js`)
- Stripe webhook (`app/api/webhooks/stripe/route.js`)
- Favicon emoji (`app/favicon.ico`)
- Privacy policy, data deletion, terms pages
- Security headers in `next.config.mjs`

### Session 2 (Apr 24, 2026) — Live Data & State Reps
Commits: `a9bb9a0` through `0fdd916`
- Fixed post-sign-in Google OAuth redirect loop
- Replaced Google Civic API with OpenStates + Census geocoder for state reps
- Removed all mock representative data; all data now live from Congress API
- Fixed ZIP geocoding and null photo handling
- Fixed GovTrack votes endpoint (name search + bioguide matching; old `?bioguideid=` param defunct)
- Added LegiScan docket tab (state reps get live bill data)
- Added GovTrack voting records with bill links
- Overhauled Wealth & Trades tab (buy/sell stats, visual bars, state rep handling)
- Fixed CSP `img-src` to allow state legislature photo domains
- `app/error.js` — branded error page
- `app/opengraph-image.js` — OG image route (1200×630)
- Updated `app/layout.js` — full OpenGraph + Twitter card metadata

### Session 3 (Apr 27, 2026) — Redesign & Local Officials
Commits: `27ab20a` through `3d14195`
- `app/not-found.js` — branded 404 page (navy bg, gold/red palette, Playfair Display)
- `InitialsAvatar` component added to `CivicWatch.jsx`
- First-visit onboarding modal (localStorage `cw_onboarded` flag)
- Local Government section: Cicero official cards OR Census-derived Google search fallback
- `app/api/civic/route.js` — added Cicero API integration + Census geographies
- Header logo → clickable, returns to dashboard
- Pro-aware header: "★ Pro Member" (billing portal) vs "★ Go Pro $9.99/mo"
- `app/api/billing-portal/route.js` — Stripe billing portal endpoint
- `app/api/webhooks/stripe/route.js` — Pro welcome + cancellation emails via Resend
- Town Hall tab rewrite: live Mobilize America events, official website links, Google search
- Rep-change state reset useEffect (prevents stale data flash on rep switch)
- Community poll divide-by-zero fix
- Updated privacy/terms/data-deletion with `support@civicwatch.app`, April 24, 2026 dates
- CSP additions: `https://api.mobilize.us https://cicero.azavea.com https://api.stripe.com`

### Session 4 (Apr 29, 2026) — ProPublica Nonprofit Explorer
Commits: `2610fdb`, `7df46bf`
- `app/api/nonprofits/route.js` — ProPublica integration
  - Two parallel searches (full name + last name in state)
  - Deduplicates by EIN, keeps highest relevance score
  - Fetches revenue for top 8 in parallel
  - Returns: ein, name, city, state, nteeCode, category, revenue, revenueLabel, subsection (501(c) type), profileUrl, score
- `components/CivicWatch.jsx` — Nonprofits tab
  - State: `liveNonprofits`, `loadingNonprofits`
  - Fetches on tab open via `useEffect`
  - Added to rep-change reset effect
  - Tab label: "🏦 Nonprofits"
- CSP addition: `https://projects.propublica.org`

---

## Tabs in Rep Profile (CivicWatch.jsx)

In order: **Overview** | **Votes** | **Today's Docket** | **Wealth & Trades** | **Bio & Compare** | **Town Hall** | **🏦 Nonprofits** | **🤖 AI Analysis**

AI Analysis tab is Pro-gated. Shows "★ Manage Pro Subscription" for Pro members, "Upgrade" for free users.

---

## Utility Scripts

### `scripts/ingest-disclosures.js`
Three-phase House PTR + net worth ingestion into Supabase:
- `--phase=index` → downloads XML indices → `fd_filings` table
- `--phase=trades` → parses PTR PDFs → `fd_trades` table  
- `--phase=networth` → parses Annual FD PDFs → `fd_net_worth` table
- Dependencies: `adm-zip`, `fast-xml-parser`, `pdf-parse`, `@supabase/supabase-js`, `dotenv`

Run with: `node scripts/ingest-disclosures.js --phase=index` etc.

---

## Outstanding Items (as of 2026-04-29)

- [ ] **Cicero API key** — verify `CICERO_API_KEY` is set in Vercel production env vars (local official cards degrade to Census/Google fallback without it)
- [ ] **Populate `fd_trades`** — run `scripts/ingest-disclosures.js` to backfill House PTR data into Supabase; currently Supabase-first trade lookup returns empty
- [ ] **`NEXT_PUBLIC_APP_URL`** — confirm set in Vercel to `https://civicwatch.app` for billing portal redirect
- [ ] **Senate trade data** — EFTS endpoint works for Senate; House uses Supabase/House Clerk. Could unify via EFTS for both chambers.
- [ ] **Mobile layout polish** — overflow fixes applied (`overflowX: hidden`, `min-width: 0`, `wordBreak: break-word`) but full mobile audit not done
- [ ] **`fd_net_worth` display** — ingestion script ready but no UI surface yet for net worth trend chart

---

## Git Log Summary

```
7df46bf  Fix nonprofit API: use search.json endpoint, correct field names, fetch revenue
2610fdb  Add ProPublica Nonprofit Explorer tab to rep profiles
27ab20a  Add local officials, live town halls, Pro emails, OG metadata, and billing portal
3d14195  Add branded 404 not-found page
0fdd916  Fix Overview tab — live votes/docket/trades data, replace empty placeholders
01d16e2  Overhaul Wealth & Trades — buy/sell stats, visual bar, state rep handling
227bd52  Fix Today's Docket — federal reps use Congress.gov, state reps use LegiScan
995f78a  Add GovTrack voting data — detailed votes with bill links
074be5e  Wire LegiScan docket tab — fetch live bills on tab open
8924169  Filter federal officials out of OpenStates results
18cec63  Relax img-src CSP to https: — state rep photos from many domains
cf1edd4  Allow openstates.org image URLs in CSP img-src
864cb80  Fix ZIP geocoding and null photo handling for state reps
f632454  Replace deprecated Google Civic API with OpenStates + Census geocoder
197536e  Add Google Civic Information API for real municipal representative data
551c131  Show placeholder cards when municipal filter is selected
95643b8  Remove all mock representative data; show live Congress API data only
1398f92  Replace mock alerts with live votes/trades for tracked representatives
a9bb9a0  Fix post-sign-in redirect loop after Google OAuth
c970215  Fix 11 UI/data bugs: map, senators, website URL, email, mobile layout
59563b3  fix: resolve /api/congress 500 error and multiple feature bugs
5d11980  Add privacy policy and data deletion pages, expose as public routes
de4777b  chore: trigger redeploy for Clerk production keys
d7f4835  copy: update hero headline
c914787  feat: add public landing page at root route
24a4e37  chore: remove stray zip file from repo
3a6dac2  chore: remove duplicate Middleware.ts
6dbe57a  fix: add legacy-peer-deps for react-simple-maps compatibility
914f039  security: webhook scale fix, security headers, rate limiter cleanup
71b42ab  Add 🏛️ emoji favicon
```
