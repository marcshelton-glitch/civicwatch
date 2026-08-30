#!/usr/bin/env node
/**
 * Ingest Senate STOCK Act PTR trades from efdsearch.senate.gov
 *
 * Rewritten 2026-08-29 to drive a real headless browser session (Playwright)
 * instead of a raw fetch() CSRF/session dance. The raw-fetch version was
 * blocked by the site's bot defense essentially 100% of the time — see
 * docs/senate-waf-2026-08-29.md for how that was diagnosed. The session
 * management, exact DataTables request shape, and PTR JSON fetch all now go
 * through scripts/lib/senate-efd-browser.mjs so they carry a real browser
 * fingerprint. Everything below that layer — amount parsing, row shaping,
 * the Supabase upsert — is unchanged from the previous version.
 *
 * Also fixes a second, independent bug found while reverse-engineering the
 * real request contract: the old script posted `filer_type=1` / `report_type=11`
 * (singular, bare values). The live UI actually sends `filer_types=[1]` /
 * `report_types=[11]` (plural, JSON-array-encoded strings) and a
 * `submitted_start_date` with a time component (`MM/DD/YYYY 00:00:00`).
 *
 * Update (same day, first live run after the WAF fix): the fix above
 * worked — the probe and search both succeeded, and pagination found the
 * real 1,689 PTR filings — but every single one still came back skipped.
 * Root cause was two more site changes, confirmed live:
 *   1. The search response row is 5 columns
 *      [first_name, last_name, office, link_html, date_filed], not the
 *      previously-assumed 6 columns with a separate trailing link column.
 *      `link_html` was always `undefined` under the old destructuring.
 *   2. There is no more `/search/report/ptr/{uuid}/data.json` endpoint
 *      (confirmed 404 live) — individual trade line items are now only
 *      available as an HTML table on the report's own view page at
 *      /search/view/ptr/{uuid}/ (note: "view", not "report" — the old
 *      UUID-matching regex looked for "/search/report/ptr/" and would
 *      never have matched the real href either).
 * Both are fixed below: the row is destructured to its real 5 fields, and
 * trade rows are scraped from the "List of transactions added to this
 * report" table on the view page via scrapeReportTables(), which also
 * gives a real Ticker column instead of regexing it out of the asset name.
 *
 * Usage:
 *   node --env-file=../.env.local scripts/ingest-senate-trades.mjs [--senator=<lastName>] [--limit=50] [--year=2024]
 */

import { createClient } from '@supabase/supabase-js'
import { searchReports, SENATE_BASE, withSenateSession, scrapeReportTables } from './lib/senate-efd-browser.mjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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

const LIMIT    = parseInt(args.limit   ?? '50',  10)
const SENATOR  = args.senator  ?? ''     // filter to specific last name
const YEAR     = parseInt(args.year    ?? '0',   10)  // 0 = all years

// ── amount parsing ───────────────────────────────────────────────────────────
const AMOUNT_MAP = [
  ['Over $50,000,000',          50_000_001, null],
  ['$25,000,001 - $50,000,000', 25_000_001, 50_000_000],
  ['$5,000,001 - $25,000,000',   5_000_001, 25_000_000],
  ['$1,000,001 - $5,000,000',    1_000_001,  5_000_000],
  ['$500,001 - $1,000,000',        500_001,  1_000_000],
  ['$250,001 - $500,000',          250_001,    500_000],
  ['$100,001 - $250,000',          100_001,    250_000],
  ['$50,001 - $100,000',            50_001,    100_000],
  ['$15,001 - $50,000',             15_001,     50_000],
  ['$1,001 - $15,000',               1_001,     15_000],
  ['$1 - $1,000',                        1,      1_000],
]

function parseAmount(str) {
  if (!str) return { min: null, max: null, str: null }
  const s = str.replace(/\s+/g, ' ').trim()
  for (const [label, min, max] of AMOUNT_MAP) {
    if (s.toLowerCase().includes(label.toLowerCase())) return { min, max, str: label }
  }
  const nums = s.replace(/,/g, '').match(/[\d.]+/g)?.map(Number).filter(n => n > 0) || []
  if (nums.length >= 2) return { min: Math.round(nums[0]), max: Math.round(nums[1]), str: s }
  if (nums.length === 1) return { min: Math.round(nums[0]), max: Math.round(nums[0]), str: s }
  return { min: null, max: null, str: s || null }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`Senate PTR ingestion (Playwright) — senator="${SENATOR || 'all'}" year=${YEAR || 'all'} limit=${LIMIT}`)

  await withSenateSession(async ({ page, context }) => {
    console.log('Session established.')

    const submittedStart = YEAR ? `01/01/${YEAR}` : '01/01/2012'
    const submittedEnd   = YEAR ? `12/31/${YEAR}` : ''

    // First page to discover total count
    const firstPage = await searchReports(page, {
      lastName: SENATOR, reportTypes: [11], filerTypes: [1],
      submittedStart, submittedEnd, start: 0, length: Math.min(LIMIT, 100), draw: 1,
    })
    const total = firstPage.recordsTotal ?? (firstPage.data || []).length
    console.log(`Found ${total} PTR filings — paginating in batches of ${LIMIT}`)

    const filings = [...(firstPage.data || [])]
    let draw = 2
    for (let start = LIMIT; start < total; start += LIMIT) {
      await new Promise(r => setTimeout(r, 500))
      const pageResult = await searchReports(page, {
        lastName: SENATOR, reportTypes: [11], filerTypes: [1],
        submittedStart, submittedEnd, start, length: Math.min(LIMIT, 100), draw: draw++,
      })
      filings.push(...(pageResult.data || []))
      console.log(`  fetched ${filings.length}/${total}`)
    }

    let inserted = 0, skipped = 0, failed = 0

    for (const filing of filings) {
      // Live search row (verified 2026-08-29): 5 columns —
      // [first_name, last_name, office, link_html, date_filed]. There is
      // no separate trailing "link" column; link_html is index 3.
      const [firstName, lastName, office, linkHtml, dateFiled] = filing
      const href = linkHtml?.match(/href="([^"]+)"/)?.[1]
      // Real href is /search/view/ptr/{uuid}/ ("view", not "report").
      const uuidMatch = href?.match(/\/search\/view\/ptr\/([0-9a-f-]{36})\//)
      if (!uuidMatch) { skipped++; continue }

      const uuid = uuidMatch[1]
      const year = dateFiled ? parseInt(dateFiled.split('/').pop() || dateFiled.slice(0, 4)) : 0
      const filingDateParsed = dateFiled
        ? (dateFiled.includes('/') ? (() => { const [m, d, y] = dateFiled.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` })() : dateFiled)
        : null

      const state = office?.match(/\(([A-Z]{2})\)/)?.[1] ?? null
      const ptrUrl = href.startsWith('http') ? href : `${SENATE_BASE}${href}`

      let tables
      try {
        tables = await scrapeReportTables(context, href)
      } catch (e) {
        console.error(`  [${uuid}] fetch error: ${e.message}`)
        failed++
        continue
      }

      // Live table (verified 2026-08-29): caption "List of transactions
      // added to this report", 9 columns —
      // [#, Transaction Date, Owner, Ticker, Asset Name, Asset Type, Type, Amount, Comment]
      const txTable = tables.find((t) => t.caption === 'List of transactions added to this report')

      if (!txTable?.rows?.length) {
        console.log(`  [${uuid}] ${lastName} — no trade rows`)
        skipped++
        continue
      }

      const rows = []
      for (const cells of txTable.rows) {
        const [, txDateRaw, owner, ticker, assetName, , txType, amountRaw] = cells
        const { min, max, str: amtStr } = parseAmount(amountRaw)

        let txDate = null
        if (txDateRaw) {
          if (txDateRaw.includes('/')) {
            const [m, d, y] = txDateRaw.split('/')
            txDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
          } else {
            txDate = txDateRaw
          }
        }

        const txNorm = /purchase/i.test(txType || '') ? 'Purchase'
          : /sale/i.test(txType || '') ? 'Sale'
          : /exchange/i.test(txType || '') ? 'Exchange'
          : txType || null

        rows.push({
          filing_id:        uuid,
          last_name:        (lastName || '').trim(),
          first_name:       (firstName || '').trim(),
          state,
          year:             year || (txDate ? parseInt(txDate.slice(0, 4)) : 0),
          filing_date:      filingDateParsed,
          transaction_date: txDate,
          owner:            (owner || '').trim() || null,
          asset_name:       (assetName || '').trim() || null,
          ticker:           (ticker || '').trim() || null,
          transaction_type: txNorm,
          amount_min:       min,
          amount_max:       max,
          amount_str:       amtStr,
          ptr_url:          ptrUrl,
        })
      }

      if (!rows.length) { skipped++; continue }

      const { error } = await db
        .from('senate_trades')
        .upsert(rows, { onConflict: 'filing_id,transaction_date,asset_name,transaction_type', ignoreDuplicates: true })

      if (error) {
        console.error(`  [${uuid}] DB error: ${error.message}`)
        failed++
      } else {
        console.log(`  [${uuid}] ${lastName}, ${firstName} — ${rows.length} trades`)
        inserted += rows.length
      }

      // polite delay
      await new Promise(r => setTimeout(r, 300))
    }

    console.log(`\nDone — inserted: ${inserted}, skipped: ${skipped}, failed: ${failed}`)
  })
}

run().catch(e => { console.error(e); process.exit(1) })
