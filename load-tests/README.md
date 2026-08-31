# CivicWatch Load Tests

K6 load test scripts for [civicwatch.app](https://civicwatch.app). Run these **after** all pre-launch bugs are resolved, before going live.

## Prerequisites

```bash
brew install k6
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | No (defaults to `https://civicwatch.app`) | Target host |
| `K6_AUTH_TOKEN` | No for `smoke.js`/`load.js`/`stress.js`. **Required** for `stress-networth.js`. | Clerk `__session` cookie value. Without it, `/dashboard` is tested unauthenticated (expects a redirect) and `/api/networth` 401s immediately. |

To capture a valid Clerk session token: open DevTools in your browser → Application → Cookies → copy the value of `__session`.

## Scripts

### `smoke.js` — Smoke test
**When to use:** after every deploy, to confirm the app is up and key routes respond.

```bash
BASE_URL=https://civicwatch.app k6 run load-tests/smoke.js
```

- 1 virtual user, 30 seconds
- Verifies: `/`, `/dashboard`, `/api/congress?bioguideId=K000395`, `/api/public-feed`, `/api/leaderboard`
- Thresholds: p95 < 5s, error rate < 1%

---

### `load.js` — Load test
**When to use:** simulate realistic concurrent traffic before launch.

```bash
BASE_URL=https://civicwatch.app k6 run load-tests/load.js
```

- Ramps from 0 → 50 VUs over 2 min, holds 5 min, ramps down 1 min
- Tests all smoke routes plus `/api/networth?bioguideId=K000395`
- **Thresholds (must pass):**
  - `p(95) < 3000ms` — 95th percentile response time under 3 seconds
  - `error rate < 1%` — fewer than 1 in 100 requests can fail

**Known limitation (found 2026-08-16):** every VU hits the exact same params every time, and most routes here are behind Vercel edge caching (`s-maxage` of 5 min–6 hrs depending on route). That means after the first few seconds, almost all traffic in this test is served from cache — it validates your CDN, not your database or backend logic. See `stress-networth.js` below for a test that actually reaches Supabase.

---

### `stress.js` — Stress test
**When to use:** find the breaking point and observe degradation behavior under extreme load.

```bash
BASE_URL=https://civicwatch.app k6 run load-tests/stress.js
```

- Ramps to 200 VUs, holds for 10 minutes
- Thresholds are loose (10% error / p95 < 10s) — this test is about **observation**, not pass/fail
- Watch k6's real-time output and your Vercel/Supabase dashboards while it runs to see where things break
- Same caching caveat as `load.js` above — a clean result here does not mean your database can handle 200 concurrent users.

---

### `verify-rate-limits.js` — Rate limiter check
**When to use:** before running `stress-networth.js` for the first time, or after touching rate-limiting code in `/api/congress`, `/api/public-feed`, or `/api/leaderboard`.

```bash
BASE_URL=https://civicwatch.app k6 run load-tests/verify-rate-limits.js
```

- 1 VU, 45 tight-loop iterations, done in well under a minute
- Cache-busts every request (random query param) so it actually reaches the route handler instead of Vercel's edge cache
- Reuses a small pool of real bioguideIds so the Supabase-backed `congress_cache` table still shields the live Congress.gov API — this script will NOT hammer your Congress.gov API quota
- Confirms three separate in-memory, per-IP rate limiters found in the code:
  - `/api/congress` — 30 calls/min
  - `/api/public-feed` — 30 calls/min
  - `/api/leaderboard` — 10 calls/min
- Check the summary's custom counters (`congress_429`, `public_feed_429`, `leaderboard_429`) — each should start climbing once its route's call count crosses its limit. If a counter stays at 0 all run, either the limiter isn't firing or (more likely) Vercel served some responses from a warm-but-separate function instance that has its own limiter memory — the in-memory approach doesn't guarantee a shared count across parallel instances, which is worth knowing regardless of the result.

---

### `stress-networth.js` — Real breaking-point test
**When to use:** to find out where the database and backend actually degrade under load, as opposed to where the CDN cache does. This is the test that answers "where does it break before a hacker finds out."

**Before you run it:** `/api/networth` requires a Clerk session belonging to a Pro-tier account. Sanity-check your token BEFORE the full run — a bad token makes this test look clean while measuring nothing, the same failure mode that made the original `load.js`/`stress.js` results misleading:

```bash
curl -s "https://civicwatch.app/api/networth?bioguideId=K000395" \
  -H "Cookie: __session=$K6_AUTH_TOKEN" | head -c 300
```

You want to see a JSON body with a `history` array (or `entry_worth`/`current_worth` fields). If you get `{"error":"Authentication required"}` the token is missing or expired — grab a fresh one from DevTools. If you get `{"error":"Pro subscription required"}` the token is valid but that account isn't on Pro — use an account that is.

Once the token checks out:

```bash
BASE_URL=https://civicwatch.app \
  K6_AUTH_TOKEN=<pro-account-session-token> \
  k6 run load-tests/stress-networth.js
```

- Ramps 0 → 50 → 150 → 300 VUs over 6 min, holds 300 for 5 min, ramps down 1 min (~13 min total)
- Hits only `/api/networth`, rotating through 17 real bioguideIds so some requests hit cached rows directly and others fall through to the slower fallback queries
- Thresholds are loose (error rate < 20%, p95 < 8s) — again, this is about finding where it bends, not a pass/fail gate
- Watch the `auth_failures` counter in the summary — if it's anywhere close to your total request count, the token went stale mid-run (Clerk session tokens expire) and the results aren't real. Get a fresh token and re-run.
- Watch your Supabase dashboard (Postgres requests, CPU, connection count) during this run — this is the test that should actually move those numbers, unlike the original `load.js`/`stress.js`.

---

## Running with auth

```bash
BASE_URL=https://civicwatch.app \
  K6_AUTH_TOKEN=<your-clerk-session-token> \
  k6 run load-tests/load.js
```

The session token is injected as a `Cookie: __session=<token>` header on every request. Tokens expire; grab a fresh one from DevTools before each test run.

## Interpreting results

K6 prints a summary at the end. Key metrics to watch:

- **`http_req_duration` p(95) / p(99)** — tail latency; p95 > 3s means slow pages for real users
- **`http_req_failed`** — any non-2xx/3xx response counts as a failure
- **`http_reqs` (rate)** — requests per second the server actually handled
- **`vus_max`** — peak concurrency reached

If thresholds are breached, k6 exits with a non-zero status code (useful for CI).

For `verify-rate-limits.js` and `stress-networth.js`, also check the custom counters described above (`congress_429`, `public_feed_429`, `leaderboard_429`, `auth_failures`) — they're printed in the same end-of-run summary alongside the built-in metrics.
