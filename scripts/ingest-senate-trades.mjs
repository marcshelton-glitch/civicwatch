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
 * Whether that alone explains any of the historical empty results is
 * unknown — the WAF block meant no request ever got far enough to tell —
 * but it's fixed now regardless.
 *
 * Usage:
 *   node --env-file=../.env.local scripts/ingest-senate-trades.mjs [--senator=<lastName>] [--limit=50] [--year=2024]
 */

import { createClient } from '@supabase/supabase-js'
import { searchReports, fetchJson, SENATE_BASE, withSenateSession } from './lib/senate-efd-browser.mjs'

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
      // DataTables row: [first_name, last_name, office, report_type, date_filed, link]
      const [firstName, lastName, office, , dateFiled, linkHtml] = filing
      const uuidMatch = linkHtml?.match(/\/search\/report\/ptr\/([0-9a-f-]{36})\//)
      if (!uuidMatch) { skipped++; continue }

      const uuid = uuidMatch[1]
      const year = dateFiled ? parseInt(dateFiled.split('/').pop() || dateFiled.slice(0, 4)) : 0
      const filingDateParsed = dateFiled
        ? (dateFiled.includes('/') ? (() => { const [m, d, y] = dateFiled.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` })() : dateFiled)
        : null

      const state = office?.match(/\(([A-Z]{2})\)/)?.[1] ?? null
      const ptrUrl = `${SENATE_BASE}/search/report/ptr/${uuid}/`

      let tradeData
      try {
        tradeData = await fetchJson(page, `${SENATE_BASE}/search/report/ptr/${uuid}/data.json`)
      } catch (e) {
        console.error(`  [${uuid}] fetch error: ${e.message}`)
        failed++
        continue
      }

      if (!tradeData?.data?.length) {
        console.log(`  [${uuid}] ${lastName} — no trade rows`)
        skipped++
        continue
      }

      const rows = []
      for (const td of tradeData.data) {
        // Columns: [transaction_date, owner, asset_name, asset_type, transaction_type, amount, comment]
        const [txDateRaw, owner, assetName, , txType, amountRaw] = td
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

        const tickerMatch = assetName?.match(/\(([A-Z]{1,5})\)/)
        const ticker = tickerMatch?.[1] ?? null

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
          ticker,
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
