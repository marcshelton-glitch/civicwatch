# CivicWatch — Project Reference

> **"Track the Power. Know the Truth."**  
> The first real-time civic intelligence platform for American voters.  
> Non-partisan · Built in the USA · [civicwatch.app](https://civicwatch.app)

**Status: LIVE** · Repo: `/Users/marcshelton/civicwatch` · Last updated: June 13, 2026

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
| Committee assignment alerts | Sign-In | 🔲 Coming Soon (scaffold in place; needs committee_assignments table) |
| Sponsored legislation alerts | Sign-In | 🔲 Coming Soon (scaffold in place; needs rep_legislation table) |
| Annual subscription tier | — | 🔲 Planned |
| Trade Conflict Analysis | Pro | 🔲 Coming Soon |
| Peer Standing | Pro | 🔲 Coming Soon |
| State & Local Lookup | Pro | 🔲 Coming Soon |

---

## ⚡ Recent Work

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
- **CCPA/GDPR named sections** in Privacy Policy — Section 7 covers user rights generically but does NOT name California or EU/EEA users explicitly
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

## Push Pattern for GitHub (NEVER use `git push` — it hangs)

```python
import subprocess, requests, re
token = subprocess.check_output(['security','find-internet-password','-s','github.com','-w']).decode().strip()
headers = {'Authorization': f'token {token}', 'Accept': 'application/vnd.github+json'}
remote = subprocess.check_output(['git','remote','get-url','origin']).decode().strip()
match = re.search(r'[:/]([^/]+/[^/]+?)(?:\.git)?$', remote)
base = f'https://api.github.com/repos/{match.group(1)}'

def push_file(disk_path, repo_path, msg):
    ref = requests.get(f'{base}/git/ref/heads/main', headers=headers).json()
    sha = ref['object']['sha']
    commit_obj = requests.get(f'{base}/git/commits/{sha}', headers=headers).json()
    tree_sha = commit_obj['tree']['sha']
    with open(disk_path, 'r') as f:
        content = f.read()
    blob = requests.post(f'{base}/git/blobs', headers=headers, json={'content': content, 'encoding': 'utf-8'}).json()
    tree = requests.post(f'{base}/git/trees', headers=headers, json={'base_tree': tree_sha, 'tree': [{'path': repo_path, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']}]}).json()
    new_commit = requests.post(f'{base}/git/commits', headers=headers, json={'message': msg, 'tree': tree['sha'], 'parents': [sha]}).json()
    requests.patch(f'{base}/git/refs/heads/main', headers=headers, json={'sha': new_commit['sha']})
    print(f'Pushed {repo_path}:', new_commit['sha'])
```

The script is saved at `~/civicwatch/_push.py`.

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
| `/privacy` | Privacy Policy (last updated April 24, 2026) |
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
| `CONGRESS_API_KEY` | ⚠️ Verify set | Needed for leaderboard party badge enrichment |
| `GEMINI_API_KEY` | ✅ Set | AI accountability reports |
| `STRIPE_SECRET_KEY` | ✅ Set | Payments |
| `CLERK_SECRET_KEY` | ✅ Set | Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | Database |

---

## Open Items

### Immediate (before launch)
- [x] Run `python3 ~/civicwatch/_push.py` on Mac to push the 10 P3 QA fixes from June 5 — ✅ Done June 8 (confirmed)
- [ ] Add Vercel env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `INTERNAL_API_SECRET`
- [ ] Apply Supabase migration for `push_subscriptions` table (project: `hgtofwsvbblumcgbqzat`)
- [ ] Verify `CONGRESS_API_KEY` is set in Vercel (affects leaderboard party badges)
- [ ] Fix "Transparency is the foundation of democracy" duplication on About page h1 vs Mission section
- [ ] Add Refund Policy link to homepage marketing footer (currently only in dashboard footer)
- [ ] Add CCPA/GDPR named sections to Privacy Policy (California + EU/EEA explicit)
- [ ] Add "Do Not Sell My Personal Information" link to all footers
- [ ] Run SQL backfill for `fd_net_worth.bioguide_id` (97 rows with null bioguide_id from OCR pipeline)
- [ ] Finish caching layer on `congress/route.js` (session hit 1M limit mid-way — 15 return statements done)

### Manual testing checklist
- [ ] Walk through app on real iPhone (Safari)
- [ ] Test Go Pro → Stripe checkout → success flow end-to-end
- [ ] Test declined card
- [ ] Verify free users hit paywall at right moment
- [ ] Sign up → email verification → onboarding flow
- [ ] Verify welcome/confirmation/cancellation emails send from domain (not Clerk default)
- [ ] Lighthouse audit 80+ Performance, 100 Accessibility
- [ ] Test on slow 4G

### Post-launch
- [ ] Add actual files to Press Kit on /press page
- [ ] Consider dedicated press@civicwatch.app for press contact (currently personal Gmail)
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

*File built from: Product Spec Sheet (June 2026) + live site audit of civicwatch.app + full session transcript OCR (11 screenshots, March–June 2026) · Last rebuilt: June 6, 2026 · Last updated: June 13, 2026 (automated daily task)*
