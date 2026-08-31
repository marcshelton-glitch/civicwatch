import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Confirms the per-IP, in-memory rate limiters on /api/congress (30 calls/min),
// /api/public-feed (30 calls/min), and /api/leaderboard (10 calls/min) actually
// engage. Single VU, tight loop, cache-busted with a nonce query param so every
// request reaches the route handler instead of being served from Vercel's edge
// cache (which would otherwise mask the limiter entirely, as happened in the
// original load.js/stress.js runs).
//
// Deliberately small and short (well under a minute) — this is a surgical check
// of specific rate-limiting logic, not a load test. It reuses a small pool of
// real bioguideIds so /api/congress's own Supabase-backed congress_cache table
// still shields the live Congress.gov API from repeat hits.
//
// Run:
//   BASE_URL=https://civicwatch.app k6 run load-tests/verify-rate-limits.js
//
// What to look for in the summary: congress_429 should start climbing after
// roughly the 30th congress request, leaderboard_429 after roughly the 10th
// leaderboard request. If none of the counters ever go above 0, the limiters
// either aren't firing or the run didn't generate enough real (uncached) hits —
// re-run and check that http_reqs is close to iterations * 3.

export const options = {
  vus: 1,
  iterations: 45,
};

const BASE_URL = __ENV.BASE_URL || 'https://civicwatch.app';

// Real, valid-format bioguideIds (mix of current and former members) —
// see load-tests/README.md for where this pool came from.
const BIOGUIDE_IDS = [
  'K000395', 'P000197', 'S001150', 'W000187', 'K000389', 'C001092',
  'L000579', 'D000620', 'G000563', 'M001157', 'B001273', 'F000372',
  'B000574', 'F000461', 'M001158', 'G000584', 'K000401',
];

const congress429 = new Counter('congress_429');
const publicFeed429 = new Counter('public_feed_429');
const leaderboard429 = new Counter('leaderboard_429');

function pickId() {
  return BIOGUIDE_IDS[Math.floor(Math.random() * BIOGUIDE_IDS.length)];
}

export default function () {
  const nonce = `${__VU}-${__ITER}-${Date.now()}`;

  const congressRes = http.get(
    `${BASE_URL}/api/congress?type=member&bioguideId=${pickId()}&_cb=${nonce}`,
    { tags: { name: 'congress' } }
  );
  check(congressRes, { 'congress: 200 or 429': (r) => r.status === 200 || r.status === 429 });
  if (congressRes.status === 429) congress429.add(1);

  const feedRes = http.get(`${BASE_URL}/api/public-feed?_cb=${nonce}`, { tags: { name: 'public-feed' } });
  check(feedRes, { 'public-feed: 200 or 429': (r) => r.status === 200 || r.status === 429 });
  if (feedRes.status === 429) publicFeed429.add(1);

  const lbRes = http.get(`${BASE_URL}/api/leaderboard?_cb=${nonce}`, { tags: { name: 'leaderboard' } });
  check(lbRes, { 'leaderboard: 200 or 429': (r) => r.status === 200 || r.status === 429 });
  if (lbRes.status === 429) leaderboard429.add(1);

  sleep(0.2);
}
