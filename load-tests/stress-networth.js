import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Real breaking-point test for /api/networth — the ONE route in the app with
// no CDN cache (Cache-Control: private, no-store) and no rate limiter. Every
// request here reaches Supabase for real (fd_net_worth, with an ilike fallback
// and an opensecrets_net_worth fallback for members with no direct match).
//
// This is deliberately separate from load.js/stress.js: those scripts' traffic
// to /api/congress, /api/leaderboard, and /api/public-feed is mostly served
// from Vercel's edge cache, and their /api/networth requests were unauthenticated
// (401 before ever reaching Supabase) — so neither test exercised the database
// under real concurrency. This one does, on purpose.
//
// REQUIRES a Pro-tier Clerk session token. Without one, every request 401s
// before touching Supabase and this test silently measures nothing — the
// auth_failures counter in the summary will equal your total request count
// if that happens. Sanity-check your token FIRST — see
// load-tests/README.md "Before you run stress-networth.js".
//
// Run:
//   BASE_URL=https://civicwatch.app \
//     K6_AUTH_TOKEN=<pro-account-__session-cookie-value> \
//     k6 run load-tests/stress-networth.js

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // warm up
    { duration: '2m', target: 150 },  // increase — past the 200 VU zone we already validated for the CACHED routes
    { duration: '3m', target: 300 },  // push into genuinely untested territory for THIS route
    { duration: '5m', target: 300 },  // hold at peak
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.20'],   // loose — this is about observation, not pass/fail
    http_req_duration: ['p(95)<8000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://civicwatch.app';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error(
    'K6_AUTH_TOKEN is required. /api/networth returns 401 on every request without ' +
    'it, and this test would run to completion looking "clean" while never touching ' +
    'the database. See load-tests/README.md "Before you run stress-networth.js".'
  );
}

const headers = { Cookie: `__session=${AUTH_TOKEN}` };

// Real bioguideIds spanning current and former members, so some requests hit
// existing fd_net_worth rows directly and others fall through to the ilike
// fallback / opensecrets query — exercising every Supabase code path in the
// route, not just the cheapest one.
const BIOGUIDE_IDS = [
  'K000395', 'P000197', 'S001150', 'W000187', 'K000389', 'C001092',
  'L000579', 'D000620', 'G000563', 'M001157', 'B001273', 'F000372',
  'B000574', 'F000461', 'M001158', 'G000584', 'K000401',
];

// 401/403 here means the token is missing, expired, or not on a Pro account —
// NOT a real backend failure. Watch this counter separately from error rate.
const authFailures = new Counter('auth_failures');

export default function () {
  const id = BIOGUIDE_IDS[Math.floor(Math.random() * BIOGUIDE_IDS.length)];
  const res = http.get(`${BASE_URL}/api/networth?bioguideId=${id}`, {
    headers,
    tags: { name: 'networth' },
  });

  if (res.status === 401 || res.status === 403) {
    authFailures.add(1);
  }

  check(res, {
    'networth: status 200': (r) => r.status === 200,
  });

  sleep(0.3);
}
