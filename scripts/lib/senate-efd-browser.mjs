/**
 * Shared Playwright-driven session for efdsearch.senate.gov.
 *
 * Why this exists (2026-08-29): the previous raw fetch()-based session dance
 * (GET home -> POST agreement -> GET search -> POST search) was blocked by
 * the site's bot defense essentially 100% of the time — confirmed via
 * ingest-senate.log (4,722/4,724 probes returned 503 over a ~16h window from
 * a residential IP) and via GitHub Actions runs (Azure datacenter IP). The
 * identical multi-step flow driven by a real browser succeeded cleanly every
 * time it was tested manually. See docs/senate-waf-2026-08-29.md.
 *
 * Rather than trying to hand-craft headers that mimic a browser, this module
 * drives an actual headless Chromium session via Playwright, so every
 * request — TLS handshake, HTTP/2 frame ordering, headers, all of it — is
 * indistinguishable from the browser session that's known to work. The
 * scripts that use this module only change how bytes are fetched; the
 * downstream parsing/upsert logic is untouched.
 *
 * The exact request contract for /search/report/data/ below (field names,
 * bracketed-array encoding, date format) was reverse-engineered by
 * instrumenting a live, working browser session — not guessed. The
 * previous script used singular `filer_type`/`report_type` fields in a
 * format the real UI never actually sends; this was a second, independent
 * bug on top of the WAF blocking.
 */

import { chromium } from 'playwright'

export const SENATE_BASE = 'https://efdsearch.senate.gov'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

/**
 * Launches headless Chromium, accepts the eFD terms-of-use agreement, and
 * returns { browser, context, page } with an authenticated session ready to
 * search. Caller is responsible for calling `browser.close()` when done —
 * use the `withSenateSession` wrapper below to get that for free.
 */
export async function openSenateSession() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ userAgent: UA })
  const page = await context.newPage()

  const homeRes = await page.goto(`${SENATE_BASE}/search/home/`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  if (!homeRes || !homeRes.ok()) {
    await browser.close()
    throw new Error(`GET /search/home/ failed: ${homeRes ? homeRes.status() : 'no response'}`)
  }

  // First-visit flow: check the agreement checkbox, which auto-submits the
  // form via the page's own JS (no separate submit click needed — verified
  // manually: checking the box alone navigates to /search/).
  const checkbox = page.locator('#agree_statement')
  if (await checkbox.count()) {
    await Promise.all([
      page.waitForURL(/\/search\/?(\?.*)?$/, { timeout: 30_000 }),
      checkbox.check(),
    ])
  }

  const formOk = await page
    .locator('input[name="last_name"]')
    .first()
    .isVisible()
    .catch(() => false)
  if (!formOk) {
    const url = page.url()
    await browser.close()
    throw new Error(`Did not reach the search form after accepting terms (landed on ${url}) — site may be blocking or in maintenance`)
  }

  return { browser, context, page }
}

/** Convenience wrapper: run `fn({ page, context })` with automatic cleanup. */
export async function withSenateSession(fn) {
  const { browser, context, page } = await openSenateSession()
  try {
    return await fn({ page, context })
  } finally {
    await browser.close()
  }
}

async function getCsrfToken(page) {
  const cookies = await page.context().cookies()
  const csrf = cookies.find((c) => c.name === 'csrftoken')
  if (!csrf) throw new Error('No csrftoken cookie present on session')
  return csrf.value
}

/**
 * Runs a DataTables search against /search/report/data/, matching the exact
 * payload shape the live UI sends. Executes via page.evaluate so the request
 * carries the browser's real fingerprint/headers.
 *
 * @param {import('playwright').Page} page
 * @param {object} opts
 * @param {string} [opts.lastName]
 * @param {string} [opts.firstName]
 * @param {number[]} [opts.filerTypes]   e.g. [1] = Senator
 * @param {number[]} [opts.reportTypes]  e.g. [11] = PTR, [7] = Annual FD
 * @param {string} [opts.submittedStart] 'MM/DD/YYYY'
 * @param {string} [opts.submittedEnd]   'MM/DD/YYYY'
 * @param {number} [opts.start]          DataTables pagination offset
 * @param {number} [opts.length]         page size (site allows up to 100)
 * @param {number} [opts.draw]           DataTables draw counter
 */
export async function searchReports(page, {
  lastName = '',
  firstName = '',
  filerTypes = [1],
  reportTypes = [11],
  submittedStart = '01/01/2012',
  submittedEnd = '',
  start = 0,
  length = 100,
  draw = 1,
} = {}) {
  const csrf = await getCsrfToken(page)

  const params = new URLSearchParams()
  for (let i = 0; i < 5; i++) {
    params.set(`columns[${i}][data]`, String(i))
    params.set(`columns[${i}][name]`, '')
    params.set(`columns[${i}][searchable]`, 'true')
    params.set(`columns[${i}][orderable]`, 'true')
    params.set(`columns[${i}][search][value]`, '')
    params.set(`columns[${i}][search][regex]`, 'false')
  }
  params.set('draw', String(draw))
  params.set('order[0][column]', '0')
  params.set('order[0][dir]', 'asc')
  params.set('start', String(start))
  params.set('length', String(length))
  params.set('search[value]', '')
  params.set('search[regex]', 'false')
  params.set('report_types', JSON.stringify(reportTypes))
  params.set('filer_types', JSON.stringify(filerTypes))
  params.set('submitted_start_date', submittedStart ? `${submittedStart} 00:00:00` : '')
  params.set('submitted_end_date', submittedEnd ? `${submittedEnd} 00:00:00` : '')
  params.set('candidate_state', '')
  params.set('senator_state', '')
  params.set('office_id', '')
  params.set('first_name', firstName)
  params.set('last_name', lastName)

  return page.evaluate(
    async ({ url, body, csrf }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrf,
        },
        body,
      })
      if (!res.ok) throw new Error(`search POST failed: HTTP ${res.status}`)
      return res.json()
    },
    { url: `${SENATE_BASE}/search/report/data/`, body: params.toString(), csrf },
  )
}

/** Fetch small JSON (e.g. a single PTR's data.json) through the page's own fetch. */
export async function fetchJson(page, url) {
  return page.evaluate(async (u) => {
    const res = await fetch(u)
    if (!res.ok) throw new Error(`GET ${u} failed: HTTP ${res.status}`)
    return res.json()
  }, url)
}

/**
 * Download a binary resource (PDF) via real browser navigation, returning a
 * Node Buffer. Uses a fresh page from the same context so it never disturbs
 * a caller's in-progress search page, but still shares the session cookies.
 */
export async function downloadBinary(context, url) {
  const page = await context.newPage()
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    if (!res || !res.ok()) {
      throw new Error(`GET ${url} failed: ${res ? res.status() : 'no response'}`)
    }
    return await res.body()
  } finally {
    await page.close()
  }
}

/**
 * Resolve the actual PDF URL behind a filing link, which may point straight
 * at a .pdf or at an HTML viewer page that embeds one. Inspects the real
 * rendered DOM (iframe/embed/object/a) rather than regexing raw HTML.
 */
export async function resolvePdfUrl(context, hrefOrUrl) {
  if (/\.pdf(\?|$)/i.test(hrefOrUrl)) {
    return hrefOrUrl.startsWith('http') ? hrefOrUrl : `${SENATE_BASE}${hrefOrUrl}`
  }
  const viewerUrl = hrefOrUrl.startsWith('http') ? hrefOrUrl : `${SENATE_BASE}${hrefOrUrl}`
  const page = await context.newPage()
  try {
    const res = await page.goto(viewerUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    if (!res || !res.ok()) {
      const status = res ? res.status() : null
      const err = new Error(`GET ${viewerUrl} failed: ${status ?? 'no response'}`)
      err.is503 = status === 503
      throw err
    }
    const headers = await res.headers()
    if ((headers['content-type'] || '').includes('pdf')) return viewerUrl

    const pdfHref = await page.evaluate(() => {
      const el = document.querySelector(
        'iframe[src*=".pdf"], embed[src*=".pdf"], object[data*=".pdf"], a[href*=".pdf"]'
      )
      return el?.getAttribute('src') || el?.getAttribute('data') || el?.getAttribute('href') || null
    })
    if (!pdfHref) return null
    return pdfHref.startsWith('http') ? pdfHref : `${SENATE_BASE}${pdfHref}`
  } finally {
    await page.close()
  }
}
