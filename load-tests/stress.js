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

const headers = {};
if (__ENV.K6_AUTH_TOKEN) {
  headers['Cookie'] = `__session=${__ENV.K6_AUTH_TOKEN}`;
}

const ROUTES = [
  { url: `${BASE_URL}/`,                                        name: 'landing' },
  { url: `${BASE_URL}/dashboard`,                               name: 'dashboard' },
  { url: `${BASE_URL}/api/congress?bioguideId=K000395`,         name: 'congress API' },
  { url: `${BASE_URL}/api/public-feed`,                         name: 'public-feed' },
  { url: `${BASE_URL}/api/leaderboard`,                         name: 'leaderboard' },
  { url: `${BASE_URL}/api/networth?bioguideId=K000395`,         name: 'networth API' },
];

export default function () {
  for (const route of ROUTES) {
    const res = http.get(route.url, { headers, redirects: 5, tags: { name: route.name } });
    check(res, {
      [`${route.name}: status ok`]: (r) => r.status >= 200 && r.status < 400,
    });
    sleep(0.3);
  }
}
