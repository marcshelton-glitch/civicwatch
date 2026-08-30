#!/usr/bin/env node
/**
 * Ingest Senate Annual Financial Disclosure net worth data from efdsearch.senate.gov
 *
 * Rewritten 2026-08-29 to drive a real headless browser session (Playwright)
 * instead of raw fetch(). See docs/senate-waf-2026-08-29.md for why: the
 * site's bot defense blocked the raw-fetch session/search/download flow
 * essentially 100% of the time, while the identical flow through a real
 * browser worked cleanly. Session management, search, PDF-URL resolution,
 * and the PDF download itself now all go through
 * scripts/lib/senate-efd-browser.mjs so every request carries a real
 * browser fingerprint. The PDF text extraction (pdftotext), Schedule A/D
 * parsing, and Supabase upsert are unchanged from the previous version.
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
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import {
  openSenateSession,
  searchReports,
  resolvePdfUrl,
  downloadBinary,
} from './lib/senate-efd-browser.mjs'

const execFileAsync = promisify(execFile)

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

// ── PDF text extraction ───────────────────────────────────────────────────────

async function pdfToText(buf, tag) {
  const tmp = `/tmp/senate_fd_${tag}_${Date.now()}.pdf`
  await writeFile(tmp, buf)
  try {
    const { stdout } = await execFileAsync(
      'pdftotext', ['-layout', tmp, '-'],
      { maxBuffer: 25 * 1024 * 1024 }
    )
    return stdout
  } finally {
    await unlink(tmp).catch(() => {})
  }
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

// ── Net worth parser ─────────────────────────────────────────────────────────
//
// Senate Annual FD PDFs have this structure when linearized by pdftotext -layout:
//
//   SCHEDULE A: ASSETS AND "UNEARNED" INCOME
//   ...headers...
//   FIDELITY TOTAL MARKET    JT   MF  2010  $50,001 - $100,000   Dividends  $1,001 - $2,500
//   RENTAL PROPERTY (MA)     SP   RP  2001  $500,001 - $1,000,000  Rent     $15,001 - $50,000
//
//   SCHEDULE B: TRANSACTIONS
//   SCHEDULE D: LIABILITIES
//   BANK OF AMERICA MORTGAGE  M  2012  $250,001 - $500,000
//
// Strategy for Schedule A:
//   - Per line, the FIRST dollar range is the "Current Value" (asset value column).
//   - The optional SECOND range is gross income — we ignore it.
//
// Strategy for Schedule D:
//   - Per line, the LAST dollar range is the liability amount owed.

function parseNetWorth(rawText) {
  // Strip null bytes (PDF font encoding artifact common in Senate FDs)
  // and repair line-broken ranges like "$50,001 -\n$100,000"
  const text = rawText
    .replace(/\x00/g, '')
    .replace(/(\$[\d,]+)\s*[-–]\s*\n\s*(\$[\d,]+)/g, '$1 - $2')

  const RANGE_RE = /(?:Over\s+\$[\d,]+|\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+(?:\.\d+)?)/gi

  const schedA = text.match(/SCHEDULE\s+A\b[\s\S]*?(?=SCHEDULE\s+[B-Z]\b|$)/i)?.[0] ?? ''
  const schedD = text.match(/SCHEDULE\s+D\b[\s\S]*?(?=SCHEDULE\s+[E-Z]\b|$)/i)?.[0] ?? ''

  const SKIP_RE = /^\s*(?:schedule\b|asset name|asset type|owner|type|year|creditor|none\b|exclud|attach|source|note|http|\*|=+|-{5}|gross income|income type|current value|date)/i

  let assetsMin = 0, assetsMax = 0, assetCount = 0
  if (schedA && !/none\s*(or\s*less|disclosed)/i.test(schedA)) {
    for (const line of schedA.split('\n')) {
      if (SKIP_RE.test(line)) continue
      const ranges = [...line.matchAll(RANGE_RE)].map(m => m[0])
      if (!ranges.length) continue
      const { min, max } = parseRange(ranges[0])
      if (min !== null) {
        assetsMin += min
        assetsMax += (max ?? min)
        assetCount++
      }
    }
  }

  let liabMin = 0, liabMax = 0, liabCount = 0
  if (schedD && !/none\s*(or\s*less|disclosed)/i.test(schedD)) {
    for (const line of schedD.split('\n')) {
      if (SKIP_RE.test(line)) continue
      const ranges = [...line.matchAll(RANGE_RE)].map(m => m[0])
      if (!ranges.length) continue
      const { min, max } = parseRange(ranges[ranges.length - 1])
      if (min !== null) {
        liabMin += min
        liabMax += (max ?? min)
        liabCount++
      }
    }
  }

  if (!assetCount && !liabCount) {
    return { assetsMin: null, assetsMax: null, liabMin: null, liabMax: null, nwMin: null, nwMax: null, assetCount: 0, liabCount: 0, confidence: 'low' }
  }

  const confidence = assetCount >= 5 ? 'high' : assetCount >= 1 ? 'medium' : 'low'

  return {
    assetsMin:  assetCount ? assetsMin : null,
    assetsMax:  assetCount ? assetsMax : null,
    liabMin:    liabCount  ? liabMin   : null,
    liabMax:    liabCount  ? liabMax   : null,
    nwMin:      assetCount ? assetsMin - (liabCount ? liabMax : 0) : null,
    nwMax:      assetCount ? assetsMax - (liabCount ? liabMin : 0) : null,
    assetCount,
    liabCount,
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
      const [firstName, lastName, office, , dateFiled, linkHtml] = row
      const uuid        = extractUuid(extractHref(linkHtml) ?? '') ?? extractUuid(linkHtml ?? '')
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

      if (!linkHtml) {
        console.log('no link')
        skipped++
        continue
      }

      const href = extractHref(linkHtml)
      let pdfUrl
      try {
        pdfUrl = await withRetry(
          () => resolvePdfUrl(session.context, href),
          `resolve PDF ${uuid ?? 'unknown'}`,
        )
      } catch (e) {
        console.log(`PDF resolve error: ${e.message}`)
        failed++
        continue
      }

      if (!pdfUrl) {
        console.log('PDF URL not found in viewer page')
        noData++
        continue
      }

      let pdfBuf
      try {
        pdfBuf = await withRetry(
          () => downloadBinary(session.context, pdfUrl),
          `download ${uuid ?? 'pdf'}`,
        )
      } catch (e) {
        console.log(`download failed: ${e.message}`)
        failed++
        continue
      }

      let text
      try {
        text = await pdfToText(pdfBuf, uuid ?? `${lastName}_${rYear}`)
      } catch (e) {
        console.log(`pdftotext failed: ${e.message}`)
        failed++
        continue
      }

      const parsed = parseNetWorth(text)

      if (parsed.nwMin === null && parsed.assetsMin === null) {
        console.log(`no data (${parsed.assetCount} asset rows, ${parsed.liabCount} liability rows in text)`)
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
        pdf_url:         pdfUrl,
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
      console.log(`Tip: "no data" means pdftotext found no Schedule A/D rows — likely a scanned PDF.`)
    }
  } finally {
    if (session?.browser) await session.browser.close().catch(() => {})
  }
}

run().catch(e => { console.error(e.stack ?? e.message); process.exit(1) })
