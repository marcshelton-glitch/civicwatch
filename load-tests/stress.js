import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test — ramp to 200 VUs to find the breaking point.
// Thresholds are intentionally loose; this script is about observation, not pass/fail.
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // warm up
    { duration: '3m', target: 100 },  // increase load
    { duration: '3m', target: 200 },  // peak load
    { duration: '10m', target: 200 }, // hold at peak
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],       // alert if > 10% errors at peak
    http_req_duration: ['p(95)<10000'],   // alert if p95 > 10s (hard failure signal)
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://civicwatch.app';
const HAS_AUTH = !!__ENV.K6_AUTH_TOKEN;

const headers = {};
if (HAS_AUTH) {
  headers['Cookie'] = `__session=${__ENV.K6_AUTH_TOKEN}`;
}

const ROUTES = [
  { url: `${BASE_URL}/`,                                        name: 'landing' },
  { url: `${BASE_URL}/dashboard`,                               name: 'dashboard' },
  { url: `${BASE_URL}/api/congress?bioguideId=K000395`,         name: 'congress API' },
  { url: `${BASE_URL}/api/public-feed`,                         name: 'public-feed' },
  { url: `${BASE_URL}/api/leaderboard`,                         name: 'leaderboard' },
  // Pro-only route: without K6_AUTH_TOKEN, 401/403 are the correct expected responses.
  { url: `${BASE_URL}/api/networth?bioguideId=K000395`,         name: 'networth API', proOnly: true },
];

export default function () {
  http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 401, 403));
  for (const route of ROUTES) {
    const opts = { headers, redirects: 5, tags: { name: route.name } };

    if (route.proOnly && !HAS_AUTH) {
      opts.expectedStatuses = http.expectedStatuses({ min: 200, max: 399 }, 401, 403);
    }

    const res = http.get(route.url, opts);
    check(res, {
      [`${route.name}: status ok`]: (r) => {
        if (route.proOnly && !HAS_AUTH) return r.status < 400 || r.status === 401 || r.status === 403;
        return r.status >= 200 && r.status < 400;
      },
    });
    sleep(0.3);
  }
}
