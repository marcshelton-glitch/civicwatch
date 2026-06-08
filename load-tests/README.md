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
| `K6_AUTH_TOKEN` | No | Clerk `__session` cookie value for authenticated routes. Without this, `/dashboard` is tested unauthenticated (expects a redirect). |

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

---

### `stress.js` — Stress test
**When to use:** find the breaking point and observe degradation behavior under extreme load.

```bash
BASE_URL=https://civicwatch.app k6 run load-tests/stress.js
```

- Ramps to 200 VUs, holds for 10 minutes
- Thresholds are loose (10% error / p95 < 10s) — this test is about **observation**, not pass/fail
- Watch k6's real-time output and your Vercel/Supabase dashboards while it runs to see where things break

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
