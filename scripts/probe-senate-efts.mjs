#!/usr/bin/env node
// Probe script: exits 0 and prints "200" if Senate EFD search is live, else prints the status code.
const BASE = 'https://efdsearch.senate.gov'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

function parseCookies(headers) {
  const jar = {}
  const raw = headers.getSetCookie?.() ?? [headers.get('set-cookie') || '']
  for (const line of raw) {
    const m = line.match(/^([^=]+)=([^;]*)/)
    if (m) jar[m[1].trim()] = m[2].trim()
  }
  return jar
}
function cookieStr(j) { return Object.entries(j).map(([k, v]) => `${k}=${v}`).join('; ') }
function extractCsrf(html) { return html.match(/csrfmiddlewaretoken[^>]+value="([^"]+)"/)?.[1] ?? null }

try {
  const r1 = await fetch(`${BASE}/search/home/`, { redirect: 'follow', headers: { 'User-Agent': UA } })
  const html1 = await r1.text()
  const jar1 = parseCookies(r1.headers)
  const csrf1 = extractCsrf(html1) || jar1.csrftoken

  const r2 = await fetch(`${BASE}/search/home/`, {
    method: 'POST', redirect: 'manual',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr(jar1) },
    body: `csrfmiddlewaretoken=${encodeURIComponent(csrf1)}&prohibition_agreement=1`,
  })
  const jar2 = { ...jar1, ...parseCookies(r2.headers) }

  const r3 = await fetch(`${BASE}/search/`, { redirect: 'follow', headers: { 'User-Agent': UA, 'Cookie': cookieStr(jar2) } })
  const html3 = await r3.text()
  const jar3 = { ...jar2, ...parseCookies(r3.headers) }
  const csrf3 = extractCsrf(html3) || jar3.csrftoken

  const body = new URLSearchParams({
    csrfmiddlewaretoken: csrf3, first_name: '', last_name: 'warren',
    filer_type: '1', report_type: '11', draw: '1', start: '0', length: '1',
  })
  const r4 = await fetch(`${BASE}/search/report/data/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', 'Referer': `${BASE}/search/`,
      'X-CSRFToken': csrf3, 'Cookie': cookieStr(jar3), 'User-Agent': UA,
    },
    body: body.toString(),
  })
  console.log(r4.status)
  process.exit(r4.status === 200 ? 0 : 1)
} catch (e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}
