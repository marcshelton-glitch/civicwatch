#!/usr/bin/env node
/**
 * Ingest Senate Annual Financial Disclosure net worth data from efdsearch.senate.gov
 *
 * The Senate eFD search uses a CSRF-protected Django POST endpoint.
 * Flow:
 *   1. GET /search/home/  → csrftoken cookie + CSRF token in form
 *   2. POST /search/home/ → accept terms → sessionid cookie
 *   3. GET /search/       → fresh CSRF for search form
 *   4. POST /search/report/data/ with filer_type=1 (Senator), report_type=7 (Annual FD)
 *   5. For each filing, fetch the viewer page to locate the PDF URL
 *   6. Download PDF → pdftotext -layout → parse Schedule A (assets) + Schedule D (liabilities)
 *   7. Upsert rows into senate_net_worth
 *
 * 503 retry: exponential backoff starting at 30 s, up to 5 retries (30s→60s→120s→240s→480s).
 * The session is refreshed before each retry so stale CSRF tokens don't block recovery.
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

const execFileAsync = promisify(execFile)

// ── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE = 'https://efdsearch.senate.gov'
const UA   = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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

// ── Session management ───────────────────────────────────────────────────────

function parseCookies(headers) {
  const jar = {}
  const raw = headers.getSetCookie?.() ?? [headers.get('set-cookie') ?? '']
  for (const line of raw) {
    const m = line.match(/^([^=]+)=([^;]*)/)
    if (m) jar[m[1].trim()] = m[2].trim()
  }
  return jar
}

function cookieStr(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
}

function extractCsrf(html) {
  return html.match(/csrfmiddlewaretoken[^>]+value="([^"]+)"/)?.[1] ?? null
}

async function getSession() {
  const r1 = await fetch(`${BASE}/search/home/`, { headers: { 'User-Agent': UA } })
  if (!r1.ok) throw new Error(`GET /search/home/ failed: ${r1.status}`)
  const html1 = await r1.text()
  const jar1  = parseCookies(r1.headers)
  const csrf1 = extractCsrf(html1) ?? jar1.csrftoken
  if (!csrf1) throw new Error('No CSRF token on home page')

  const r2 = await fetch(`${BASE}/search/home/`, {
    method: 'POST', redirect: 'manual',
    headers: {
      'User-Agent': UA, 'Referer': `${BASE}/search/home/`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieStr(jar1),
    },
    body: `csrfmiddlewaretoken=${encodeURIComponent(csrf1)}&prohibition_agreement=1`,
  })
  const jar2 = { ...jar1, ...parseCookies(r2.headers) }

  const r3 = await fetch(`${BASE}/search/`, {
    headers: { 'User-Agent': UA, 'Cookie': cookieStr(jar2) },
  })
  if (!r3.ok) throw new Error(`GET /search/ failed: ${r3.status}`)
  const html3 = await r3.text()
  const jar3  = { ...jar2, ...parseCookies(r3.headers) }
  const csrf3 = extractCsrf(html3) ?? jar3.csrftoken
  if (!csrf3) throw new Error('No CSRF token on search page')

  return { csrf: csrf3, cookies: jar3 }
}

// ── 503 retry + session refresh ──────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Module-level session so withRetry can refresh it transparently
let session = null

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
        session = await getSession()
        console.log('  Session refreshed, retrying...')
      } else {
        throw e
      }
    }
  }
}

function throw503(status) {
  const e = new Error(`HTTP ${status}`)
  e.is503 = (status === 503)
  throw e
}

// ── Search ───────────────────────────────────────────────────────────────────

async function searchAnnual(lastName, start) {
  const body = new URLSearchParams({
    csrfmiddlewaretoken:  session.csrf,
    first_name:           '',
    last_name:            lastName,
    filer_type:           '1',   // Senator
    report_type:          '7',   // Annual FD
    submitted_start_date: YEAR ? `01/01/${YEAR}` : '',
    submitted_end_date:   YEAR ? `12/31/${YEAR}` : '',
    draw:   '1',
    start:  String(start),
    length: String(BATCH),
  })

  const res = await fetch(`${BASE}/search/report/data/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer':      `${BASE}/search/`,
      'X-CSRFToken':  session.csrf,
      'Cookie':       cookieStr(session.cookies),
      'User-Agent':   UA,
    },
    body: body.toString(),
  })
  if (!res.ok) throw503(res.status)
  return res.json()
}

// ── PDF resolution ───────────────────────────────────────────────────────────

function extractHref(linkHtml) {
  return linkHtml?.match(/href="([^"]+)"/)?.[1] ?? null
}

function extractUuid(str) {
  return str?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1] ?? null
}

async function resolvePdfUrl(linkHtml) {
  const href = extractHref(linkHtml)
  if (!href) return null

  // Direct PDF link
  if (/\.pdf(\?|$)/i.test(href)) {
    return href.startsWith('http') ? href : `${BASE}${href}`
  }

  const uuid = extractUuid(href) ?? extractUuid(linkHtml)
  if (!uuid) return null

  // Fetch the viewer/detail page to find the embedded PDF URL
  const viewerUrl = href.startsWith('http') ? href : `${BASE}${href}`
  const res = await fetch(viewerUrl, {
    headers: { 'User-Agent': UA, 'Cookie': cookieStr(session.cookies) },
  })
  if (!res.ok) {
    if (res.status === 503) throw503(503)
    return null
  }
  const html = await res.text()

  // Look for a PDF URL in iframe src, embed src, object data, or <a href>
  const pdfMatch = html.match(
    /(?:src|data|href)="([^"]*(?:annual|report|document|filing)[^"]*\.pdf[^"]*)"/i
  ) ?? html.match(/(?:src|data|href)="([^"]+\.pdf[^"]*)"/i)
  if (pdfMatch) {
    const u = pdfMatch[1]
    return u.startsWith('http') ? u : `${BASE}${u}`
  }

  // Some eFD responses send the PDF directly (Content-Type: application/pdf)
  if (res.headers.get('content-type')?.includes('pdf')) return viewerUrl

  return null
}

// ── PDF download + text extraction ───────────────────────────────────────────

async function downloadPdf(pdfUrl) {
  const res = await fetch(pdfUrl, {
    headers: { 'User-Agent': UA, 'Cookie': cookieStr(session.cookies) },
  })
  if (!res.ok) throw503(res.status)
  return Buffer.from(await res.arrayBuffer())
}

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

  // Isolate Schedule A up to the next schedule or end of text
  const schedA = text.match(/SCHEDULE\s+A\b[\s\S]*?(?=SCHEDULE\s+[B-Z]\b|$)/i)?.[0] ?? ''
  // Isolate Schedule D up to the next schedule or end of text
  const schedD = text.match(/SCHEDULE\s+D\b[\s\S]*?(?=SCHEDULE\s+[E-Z]\b|$)/i)?.[0] ?? ''

  // Lines that are clearly headers / metadata — skip them
  const SKIP_RE = /^\s*(?:schedule\b|asset name|asset type|owner|type|year|creditor|none\b|exclud|attach|source|note|http|\*|=+|-{5}|gross income|income type|current value|date)/i

  let assetsMin = 0, assetsMax = 0, assetCount = 0
  if (schedA && !/none\s*(or\s*less|disclosed)/i.test(schedA)) {
    for (const line of schedA.split('\n')) {
      if (SKIP_RE.test(line)) continue
      const ranges = [...line.matchAll(RANGE_RE)].map(m => m[0])
      if (!ranges.length) continue
      // First range on the line = Current Value (asset value column)
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
      // Last range on the line = liability amount owed
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
  // Annual FDs cover the previous calendar year (filed mid-year for prior Dec 31)
  const y = filingDateStr?.match(/(\d{4})/)?.[1]
  return y ? parseInt(y, 10) - 1 : new Date().getFullYear() - 1
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('Senate Annual FD net worth ingestion')
  console.log(`  senator=${SENATOR || 'all'}  year=${YEAR || 'all'}  limit=${LIMIT}${DRY_RUN ? '  DRY-RUN' : ''}${SKIP_EXISTING ? '  skip-existing' : ''}`)
  console.log()

  // Fetch existing filing_ids if --skip-existing
  let existingIds = new Set()
  if (SKIP_EXISTING) {
    const { data } = await db.from('senate_net_worth').select('filing_id')
    existingIds = new Set((data ?? []).map(r => r.filing_id))
    console.log(`Skipping ${existingIds.size} already-ingested filings`)
  }

  console.log('Establishing session...')
  session = await withRetry(() => getSession(), 'session')
  console.log('Session established.')
  console.log()

  // First page to discover total count
  const firstPage = await withRetry(() => searchAnnual(SENATOR, 0), 'initial search')
  const total = firstPage.recordsTotal ?? (firstPage.data ?? []).length
  console.log(`Found ${total} Annual FD filings`)

  // Paginate through all results up to LIMIT
  const filings = [...(firstPage.data ?? [])]
  for (let start = BATCH; start < Math.min(total, LIMIT); start += BATCH) {
    await sleep(600)
    const page = await withRetry(() => searchAnnual(SENATOR, start), `page start=${start}`)
    filings.push(...(page.data ?? []))
    console.log(`  fetched ${filings.length}/${Math.min(total, LIMIT)}`)
  }

  const toProcess = filings.slice(0, LIMIT)
  console.log(`\nProcessing ${toProcess.length} filings...\n`)

  let ok = 0, noData = 0, failed = 0, skipped = 0

  for (const row of toProcess) {
    // DataTables row: [first_name, last_name, office, report_type_label, date_filed, link_html]
    const [firstName, lastName, office, , dateFiled, linkHtml] = row
    const uuid        = extractUuid(extractHref(linkHtml) ?? '') ?? extractUuid(linkHtml ?? '')
    const filingDate  = parseMDY(dateFiled)
    const rYear       = reportYearFromFilingDate(dateFiled)
    const state       = office?.match(/\(([A-Z]{2})\)/)?.[1] ?? null
    const label       = `[${dateFiled}] ${lastName}, ${firstName}`

    process.stdout.write(`  ${label}... `)

    // Skip if already in DB
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

    // Resolve PDF URL (with retry for 503 during maintenance)
    let pdfUrl
    try {
      pdfUrl = await withRetry(() => resolvePdfUrl(linkHtml), `resolve PDF ${uuid ?? 'unknown'}`)
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

    // Download PDF
    let pdfBuf
    try {
      pdfBuf = await withRetry(() => downloadPdf(pdfUrl), `download ${uuid ?? 'pdf'}`)
    } catch (e) {
      console.log(`download failed: ${e.message}`)
      failed++
      continue
    }

    // Extract text with pdftotext
    let text
    try {
      text = await pdfToText(pdfBuf, uuid ?? `${lastName}_${rYear}`)
    } catch (e) {
      console.log(`pdftotext failed: ${e.message}`)
      failed++
      continue
    }

    // Parse Schedule A and D
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

    await sleep(500)  // polite delay between requests
  }

  console.log()
  console.log(`Done — ok=${ok}, no data=${noData}, failed=${failed}, skipped=${skipped}`)
  if (noData > 0) {
    console.log(`Tip: "no data" means pdftotext found no Schedule A/D rows — likely a scanned PDF.`)
  }
}

run().catch(e => { console.error(e.stack ?? e.message); process.exit(1) })
