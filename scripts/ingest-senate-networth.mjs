#!/usr/bin/env node
/**
 * Ingest Senate Annual Financial Disclosure net worth data from efdsearch.senate.gov
 *
 * Rewritten 2026-08-29 to drive a real headless browser session (Playwright)
 * instead of raw fetch(). See docs/senate-waf-2026-08-29.md for why: the
 * site's bot defense blocked the raw-fetch session/search/download flow
 * essentially 100% of the time, while the identical flow through a real
 * browser worked cleanly.
 *
 * Update (same day, first live run after the WAF fix): the fix above
 * worked — the probe and search both succeeded, and pagination found the
 * real 1,599 Annual FD filings — but every single one came back "no link".
 * Root cause, confirmed live: the site has been redesigned since this
 * script was written.
 *   1. The search response row is 5 columns
 *      [first_name, last_name, office, link_html, date_filed], not the
 *      previously-assumed 6 columns with a separate trailing link column.
 *      `linkHtml` was always `undefined` under the old destructuring.
 *   2. Annual FD filings are no longer PDFs at all. Each report is now a
 *      plain HTML page at /search/view/annual/{uuid}/ with numbered
 *      "Parts" rendered directly in the DOM — Part 3 ("List of assets
 *      added to this report") and Part 7 ("List of liabilities added to
 *      this report") are what this script needs. There is nothing left to
 *      download or run pdftotext on.
 * Both are fixed below: the search row is destructured to its real 5
 * fields, and net worth is computed directly from the live HTML tables via
 * scrapeReportTables() — no PDF, no pdftotext, no regex-over-linearized-text
 * guessing. This is more reliable than the old approach, not just a port of
 * it: real cell boundaries instead of scraping ranges out of PDF text.
 *
 * 503 retry: exponential backoff starting at 30s, up to 5 retries
 * (30s→60s→120s→240s→480s). On retry, the whole browser session is closed
 * and re-opened (fresh cookies/CSRF) rather than reusing stale state.
 *
 * Usage:
 *   node --env-file=../.env.local scripts/ingest-senate-networth.mjs \
 *     [--senator=<lastName>] [--limit=200] [--year=2024] [--dry-run] [--skip-existing]
 *
 * Options:
 *   --senator=NAME     Filter to a specific senator by last name
 *   --year=YYYY        Only fetch filings submitted in this calendar year (default: all)
 *   --limit=N          Max filings to process in one run (default: 200)
 *   --dry-run          Parse but do not write to database
 *   --skip-existing    Skip filing_ids already present in senate_net_worth
 */

import { createClient } from '@supabase/supabase-js'
import {
  openSenateSession,
  searchReports,
  scrapeReportTables,
} from './lib/senate-efd-browser.mjs'

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BATCH = 100  // DataTables page size (max the site allows)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true] })
)

const SENATOR       = args.senator ?? ''
const LIMIT         = parseInt(args.limit ?? '200', 10)
const YEAR          = args.year ? parseInt(args.year, 10) : 0
const DRY_RUN       = !!args['dry-run']
const SKIP_EXISTING = !!args['skip-existing']

// ── Browser session holder + 503 retry ──────────────────────────────────────
//
// Module-level so withRetry can transparently close and re-open it.

let session = null  // { browser, context, page }

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function refreshSession() {
  if (session?.browser) await session.browser.close().catch(() => {})
  session = await openSenateSession()
}

async function withRetry(fn, label = 'request') {
  const MAX_RETRIES = 5
  const BASE_DELAY  = 30_000  // 30 s

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (e) {
      const is503 = e.is503 || /503|maintenance/i.test(e.message)
      if (is503 && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * (2 ** attempt)  // 30s, 60s, 120s, 240s, 480s
        const timeStr = delay >= 60000 ? `${Math.round(delay / 60000)}m` : `${delay / 1000}s`
        console.log(`\n  [503] ${label} — site in maintenance, retry ${attempt + 1}/${MAX_RETRIES} in ${timeStr}`)
        await sleep(delay)
        console.log('  Refreshing session after wait...')
        await refreshSession()
        console.log('  Session refreshed, retrying...')
      } else {
        throw e
      }
    }
  }
}

function extractHref(linkHtml) {
  return linkHtml?.match(/href="([^"]+)"/)?.[1] ?? null
}

function extractUuid(str) {
  return str?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1] ?? null
}

// ── Amount parsing ───────────────────────────────────────────────────────────

const AMOUNT_MAP = [
  ['Over $50,000,000',          50_000_001,  null],
  ['$25,000,001 - $50,000,000', 25_000_001,  50_000_000],
  ['$5,000,001 - $25,000,000',   5_000_001,  25_000_000],
  ['$1,000,001 - $5,000,000',    1_000_001,   5_000_000],
  ['$500,001 - $1,000,000',        500_001,   1_000_000],
  ['$250,001 - $500,000',          250_001,     500_000],
  ['$100,001 - $250,000',          100_001,     250_000],
  ['$50,001 - $100,000',            50_001,     100_000],
  ['$15,001 - $50,000',             15_001,      50_000],
  ['$1,001 - $15,000',               1_001,      15_000],
  ['$1 - $1,000',                        1,       1_000],
]

function parseRange(str) {
  if (!str) return { min: null, max: null }
  const s = str.replace(/\s+/g, ' ').trim()
  for (const [label, min, max] of AMOUNT_MAP) {
    if (s.toLowerCase().includes(label.toLowerCase())) return { min, max: max ?? min }
  }
  const exact = s.match(/^\$?([\d,]+)(?:\.\d+)?$/)
  if (exact) { const v = parseInt(exact[1].replace(/,/g, ''), 10); return { min: v, max: v } }
  const nums = s.replace(/[$,]/g, '').match(/\d+/g)?.map(Number) ?? []
  if (nums.length >= 2) return { min: nums[0], max: nums[1] }
  if (nums.length === 1) return { min: nums[0], max: nums[0] }
  return { min: null, max: null }
}

// ── Net worth computation from live HTML tables ─────────────────────────────
//
// Verified live 2026-08-29 against a real Annual FD view page
// (/search/view/annual/{uuid}/). Two tables matter:
//
//   caption "List of assets added to this report"
//   row cells: [asset_number, asset_name, asset_type, owner, value, income_type, income]
//   ("value" is "--" for a parent/grouping row like a brokerage account —
//   the actual dollar range lives on its numbered sub-rows, e.g. "2.1",
//   "2.2" — so grouping rows are naturally skipped by only summing rows
//   that have a real range in the value column.)
//
//   caption "List of liabilities added to this report"
//   row cells: [_, liability_number, incurred, debtor, type, points, rate_term, amount, creditor, comments]
//
// A filer who answered "No" to a section simply won't have that table on
// the page at all — findTableByCaption returning null is the normal case,
// not an error.

function sumRangeColumn(rows, valueIndex) {
  let min = 0, max = 0, count = 0
  for (const row of rows) {
    const cell = row[valueIndex]
    if (!cell || cell === '--') continue
    const { min: rMin, max: rMax } = parseRange(cell)
    if (rMin === null) continue
    min += rMin
    max += (rMax ?? rMin)
    count++
  }
  return { min, max, count }
}

function computeNetWorth(tables) {
  const assetsTable = tables.find((t) => t.caption === 'List of assets added to this report')
  const liabTable   = tables.find((t) => t.caption === 'List of liabilities added to this report')

  const assets = assetsTable ? sumRangeColumn(assetsTable.rows, 4) : { min: 0, max: 0, count: 0 }
  const liabs  = liabTable   ? sumRangeColumn(liabTable.rows, 7)   : { min: 0, max: 0, count: 0 }

  if (!assets.count && !liabs.count) {
    return { assetsMin: null, assetsMax: null, liabMin: null, liabMax: null, nwMin: null, nwMax: null, assetCount: 0, liabCount: 0, confidence: 'low' }
  }

  const confidence = assets.count >= 5 ? 'high' : assets.count >= 1 ? 'medium' : 'low'

  return {
    assetsMin:  assets.count ? assets.min : null,
    assetsMax:  assets.count ? assets.max : null,
    liabMin:    liabs.count  ? liabs.min  : null,
    liabMax:    liabs.count  ? liabs.max  : null,
    nwMin:      assets.count ? assets.min - (liabs.count ? liabs.max : 0) : null,
    nwMax:      assets.count ? assets.max - (liabs.count ? liabs.min : 0) : null,
    assetCount: assets.count,
    liabCount:  liabs.count,
    confidence,
  }
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function parseMDY(str) {
  const m = str?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null
}

function reportYearFromFilingDate(filingDateStr) {
  const y = filingDateStr?.match(/(\d{4})/)?.[1]
  return y ? parseInt(y, 10) - 1 : new Date().getFullYear() - 1
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Senate Annual FD net worth ingestion (Playwright)')
  console.log(`  senator=${SENATOR || 'all'}  year=${YEAR || 'all'}  limit=${LIMIT}${DRY_RUN ? '  DRY-RUN' : ''}${SKIP_EXISTING ? '  skip-existing' : ''}`)
  console.log()

  let existingIds = new Set()
  if (SKIP_EXISTING) {
    const { data } = await db.from('senate_net_worth').select('filing_id')
    existingIds = new Set((data ?? []).map(r => r.filing_id))
    console.log(`Skipping ${existingIds.size} already-ingested filings`)
  }

  console.log('Establishing session...')
  await withRetry(() => refreshSession(), 'session')
  console.log('Session established.')
  console.log()

  try {
    const submittedStart = YEAR ? `01/01/${YEAR}` : '01/01/2012'
    const submittedEnd   = YEAR ? `12/31/${YEAR}` : ''

    const firstPage = await withRetry(
      () => searchReports(session.page, {
        lastName: SENATOR, reportTypes: [7], filerTypes: [1],
        submittedStart, submittedEnd, start: 0, length: BATCH, draw: 1,
      }),
      'initial search',
    )
    const total = firstPage.recordsTotal ?? (firstPage.data ?? []).length
    console.log(`Found ${total} Annual FD filings`)

    const filings = [...(firstPage.data ?? [])]
    let draw = 2
    for (let start = BATCH; start < Math.min(total, LIMIT); start += BATCH) {
      await sleep(600)
      const pageResult = await withRetry(
        () => searchReports(session.page, {
          lastName: SENATOR, reportTypes: [7], filerTypes: [1],
          submittedStart, submittedEnd, start, length: BATCH, draw: draw++,
        }),
        `page start=${start}`,
      )
      filings.push(...(pageResult.data ?? []))
      console.log(`  fetched ${filings.length}/${Math.min(total, LIMIT)}`)
    }

    const toProcess = filings.slice(0, LIMIT)
    console.log(`\nProcessing ${toProcess.length} filings...\n`)

    let ok = 0, noData = 0, failed = 0, skipped = 0

    for (const row of toProcess) {
      // Live search row (verified 2026-08-29): 5 columns —
      // [first_name, last_name, office, link_html, date_filed]. There is
      // no separate trailing "link" column.
      const [firstName, lastName, office, linkHtml, dateFiled] = row
      const href        = extractHref(linkHtml)
      const uuid        = extractUuid(href ?? '') ?? extractUuid(linkHtml ?? '')
      const filingDate  = parseMDY(dateFiled)
      const rYear       = reportYearFromFilingDate(dateFiled)
      const state       = office?.match(/\(([A-Z]{2})\)/)?.[1] ?? null
      const label       = `[${dateFiled}] ${lastName}, ${firstName}`

      process.stdout.write(`  ${label}... `)

      if (SKIP_EXISTING && uuid && existingIds.has(uuid)) {
        console.log('already ingested')
        skipped++
        continue
      }

      if (!href) {
        console.log('no link')
        skipped++
        continue
      }

      const reportUrl = href.startsWith('http') ? href : `https://efdsearch.senate.gov${href}`

      let tables
      try {
        tables = await withRetry(
          () => scrapeReportTables(session.context, href),
          `scrape report ${uuid ?? 'unknown'}`,
        )
      } catch (e) {
        console.log(`scrape failed: ${e.message}`)
        failed++
        continue
      }

      const parsed = computeNetWorth(tables)

      if (parsed.assetCount === 0 && parsed.liabCount === 0) {
        console.log('no data (no asset/liability tables on this report)')
        noData++
        continue
      }

      const nwMid = parsed.nwMin !== null
        ? Math.round((parsed.nwMin + (parsed.nwMax ?? parsed.nwMin)) / 2)
        : null
      console.log(
        `NW ~$${nwMid != null ? (nwMid / 1e6).toFixed(1) + 'M' : '?'} ` +
        `[${parsed.assetCount}a ${parsed.liabCount}l] conf=${parsed.confidence}`
      )

      if (DRY_RUN) { ok++; continue }

      const { error } = await db.from('senate_net_worth').upsert({
        filing_id:       uuid,
        last_name:       (lastName  ?? '').trim(),
        first_name:      (firstName ?? '').trim(),
        state,
        report_year:     rYear,
        filing_date:     filingDate,
        pdf_url:         reportUrl,
        assets_min:      parsed.assetsMin,
        assets_max:      parsed.assetsMax,
        liabilities_min: parsed.liabMin,
        liabilities_max: parsed.liabMax,
        net_worth_min:   parsed.nwMin,
        net_worth_max:   parsed.nwMax,
        asset_count:     parsed.assetCount,
        liability_count: parsed.liabCount,
        source:          'senate_efd',
        confidence:      parsed.confidence,
      }, { onConflict: 'filing_id', ignoreDuplicates: false })

      if (error) {
        console.error(`  DB error: ${error.message}`)
        failed++
      } else {
        ok++
      }

      await sleep(500)
    }

    console.log()
    console.log(`Done — ok=${ok}, no data=${noData}, failed=${failed}, skipped=${skipped}`)
    if (noData > 0) {
      console.log(`Tip: "no data" means the report page had no assets/liabilities tables — check it answered "No" to those sections rather than a scrape bug.`)
    }
  } finally {
    if (session?.browser) await session.browser.close().catch(() => {})
  }
}

run().catch(e => { console.error(e.stack ?? e.message); process.exit(1) })
