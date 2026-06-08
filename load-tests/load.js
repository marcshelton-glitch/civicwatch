import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // ramp up
    { duration: '5m', target: 50 },  // hold
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],          // error rate < 1%
    http_req_duration: ['p(95)<3000'],       // p95 < 3s
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
    sleep(0.5);
  }
}
