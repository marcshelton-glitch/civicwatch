import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://civicwatch.app';

const headers = {};
if (__ENV.K6_AUTH_TOKEN) {
  headers['Cookie'] = `__session=${__ENV.K6_AUTH_TOKEN}`;
}

export default function () {
  // Landing page
  const landing = http.get(`${BASE_URL}/`, { headers });
  check(landing, {
    'landing: status 200': (r) => r.status === 200,
    'landing: has content': (r) => r.body && r.body.length > 0,
  });
  sleep(1);

  // Dashboard (may redirect to login without auth — 200 or 302 both acceptable here)
  const dashboard = http.get(`${BASE_URL}/dashboard`, { headers, redirects: 0 });
  check(dashboard, {
    'dashboard: reachable': (r) => r.status === 200 || r.status === 302 || r.status === 307,
  });
  sleep(1);

  // Congress API — Rep. Ro Khanna (K000395)
  const congress = http.get(`${BASE_URL}/api/congress?bioguideId=K000395`, { headers });
  check(congress, {
    'congress API: status 200': (r) => r.status === 200,
    'congress API: returns JSON': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  sleep(1);

  // Public feed
  const feed = http.get(`${BASE_URL}/api/public-feed`, { headers });
  check(feed, {
    'public-feed: status 200': (r) => r.status === 200,
    'public-feed: returns JSON': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  sleep(1);

  // Leaderboard
  const leaderboard = http.get(`${BASE_URL}/api/leaderboard`, { headers });
  check(leaderboard, {
    'leaderboard: status 200': (r) => r.status === 200,
    'leaderboard: returns JSON': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  sleep(1);
}
