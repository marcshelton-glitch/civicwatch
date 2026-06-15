/**
 * Financial Disclosure Ingestion Script
 *
 * Phase 1 (--phase=index):    Download House Clerk XML indices 2008-present → fd_filings
 * Phase 2 (--phase=trades):   Parse unprocessed PTR filings with pdf-parse → fd_trades
 * Phase 3 (--phase=networth): Parse unprocessed Annual FD filings → fd_net_worth
 *
 * Usage:
 *   node --env-file=.env.local scripts/ingest-disclosures.js --phase=index
 *   node --env-file=.env.local scripts/ingest-disclosures.js --phase=trades [--year=2025] [--limit=100]
 *   node --env-file=.env.local scripts/ingest-disclosures.js --phase=networth [--year=2024] [--limit=20]
 */

import 'dotenv/config'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'
import https from 'https'
import http from 'http'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const START_YEAR    = 2008
const CURRENT_YEAR  = new Date().getFullYear()

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true] })
)
const PHASE = args.phase || 'index'
const LIMIT = parseInt(args.limit || '100', 10)
const YEAR  = args.year ? parseInt(args.year, 10) : null

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return fetchBuffer(res.headers.location).then(resolve).catch(reject)
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function parseDate(str) {
  if (!str) return null
  const clean = str.toString().trim().replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')
  const d = new Date(clean)
  if (isNaN(d)) return null
  const year = d.getFullYear()
  if (year < 2000 || year > 2030) return null  // reject bond maturity dates
  return d.toISOString().split('T')[0]
}

function pdfUrl(filingType, year, docId) {
  const base = 'https://disclosures-clerk.house.gov/public_disc'
  return (filingType === 'P' || filingType === 'D')
    ? `${base}/ptr-pdfs/${year}/${docId}.pdf`
    : `${base}/financial-pdfs/${year}/${docId}.pdf`
}

const AMOUNT_MAP = [
  ['Over $50,000,000',              50_000_001, null],
  ['$25,000,001 - $50,000,000',     25_000_001, 50_000_000],
  ['$5,000,001 - $25,000,000',       5_000_001, 25_000_000],
  ['$1,000,001 - $5,000,000',        1_000_001,  5_000_000],
  ['$500,001 - $1,000,000',            500_001,  1_000_000],
  ['$250,001 - $500,000',              250_001,    500_000],
  ['$100,001 - $250,000',              100_001,    250_000],
  ['$50,001 - $100,000',                50_001,    100_000],
  ['$15,001 - $50,000',                 15_001,     50_000],
  ['$1,001 - $15,000',                   1_001,     15_000],
  ['$1 - $1,000',                            1,      1_000],
]
function parseAmountRange(str) {
  if (!str) return { min: null, max: null }
  const s = str.replace(/\s+/g, ' ').trim()
  for (const [label, min, max] of AMOUNT_MAP) {
    if (s.includes(label.replace(/\s+/g, ' '))) return { min, max }
  }
  // Exact dollar amount like "$314,950.00" — treat as min=max
  const exact = s.match(/^\$?([\d,]+)(?:\.\d+)?$/)
  if (exact) { const v = parseInt(exact[1].replace(/,/g, ''), 10); return { min: v, max: v } }
  // Fallback for ranges not in AMOUNT_MAP
  const nums = s.replace(/[$,]/g, '').match(/\d+/g)?.map(Number) || []
  return { min: nums[0] ?? null, max: nums[1] ?? null }
}

// Strip the repeated column header line that appears at the top of each transaction block
const HEADER_RE = /ID\s+Owner\s+Asset\s+Transaction[\s\S]*?Cap\.?\s*Gains\s*>?\s*\$?200\??/i

// Remove null bytes, lone surrogates, and other chars that break JSON serialization.
// Annual FD PDFs embed null bytes inside heading text (e.g. "S\0\0\0 A:") due to
// font encoding — stripping them makes all downstream section regex work correctly.
function sanitize(str) {
  if (!str) return str
  return str
    .replace(/\x00/g, '')               // null bytes from PDF font encoding
    .replace(/[\uD800-\uDFFF]/g, '')   // lone surrogates
    .replace(/\uFFFD/g, '')             // replacement chars
    .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/g, '') // non-XML-safe chars
}

// ── PTR text parser (regex-based) ─────────────────────────────────────────────
function parsePTRTransactions(text) {
  const transactions = []

  // Isolate from the table header to either "* For the complete list" or end
  const tSection = text.match(/ID\s+Owner[\s\S]+?(?=\*\s*For the complete list)/i)?.[0]
    || text.match(/ID\s+Owner[\s\S]+?(?=I\s{3,}P\s{3,}O)/i)?.[0]
    || text.match(/ID\s+Owner[\s\S]+/i)?.[0]
  if (!tSection) return transactions

  // Strip the column header block from the top
  const body = tSection.replace(HEADER_RE, '').trim()

  // Each entry ends with "F      S     : New" (or Amendment / Amendment to New)
  const blocks = body.split(/F\s{2,}S\s{2,}:\s+(?:New|Amendment)/i)

  for (const block of blocks) {
    const b = block.replace(HEADER_RE, '').trim()
    if (b.length < 10) continue

    // Owner: SP / JT / DC — appears at start of the block or on its own line
    const ownerMatch = b.match(/^(SP|JT|DC)\s+/m)
    const owner = ownerMatch ? ownerMatch[1] : 'self'

    // Transaction type: P / S / E immediately followed (possibly via tab) by a date
    const typeMatch = b.match(/\b([PSE])\s+(\d{2}\/\d{2}\/\d{4})/)
    if (!typeMatch) continue
    const rawType = typeMatch[1]
    const txType = rawType === 'P' ? 'Purchase' : rawType === 'S' ? 'Sale' : 'Exchange'

    // Dates
    const dates = [...b.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map(m => m[1])
    if (!dates[0]) continue

    // Amount — may span a line break between range values
    const amountMatch = b.match(/(\$[\d,]+\s*-\s*[\n\r ]*\$[\d,]+|Over \$50,000,000)/s)
    const amountStr = amountMatch
      ? amountMatch[0].replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
      : null

    // Ticker: parenthesized uppercase symbol (1-5 letters, or with . for preferred shares)
    const tickerMatch = [...b.matchAll(/\(([A-Z][A-Z0-9.]{0,9})\)/g)]
      .find(m => /^[A-Z]{1,5}$/.test(m[1]) || /^[A-Z]{1,4}\.[A-Z]$/.test(m[1]) || /^\d{9}$/.test(m[1]))
    const ticker = tickerMatch?.[1] && !/^\d/.test(tickerMatch[1]) ? tickerMatch[1] : null

    // Asset name: everything before the type+date match, cleaned up
    const preType = b.split(/\b[PSE]\s+\d{2}\/\d{2}\/\d{4}/)[0]
    const assetName = preType
      .replace(/^(SP|JT|DC)\s+/gm, '')        // strip owner codes
      .replace(/\[[A-Z]{2,5}\]/g, '')          // strip asset type codes like [ST]
      .replace(/S\s{3,}O\s*:[^\n]+\n?/g, '')   // strip "Source Of:" lines
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown Asset'

    const { min, max } = parseAmountRange(amountStr)
    transactions.push({
      transaction_date: parseDate(dates[0]),
      owner,
      asset_name: assetName,
      ticker,
      transaction_type: txType,
      amount_str: amountStr,
      amount_min: min,
      amount_max: max,
    })
  }

  return transactions
}

// ── Annual FD net worth parser ────────────────────────────────────────────────
// House Clerk Annual FDs are itemized lists — there are no "Total Assets" summary
// lines. We sum individual asset values (identified by asset-type codes like [MF],
// [ST], [RP]) and individual liability amounts from Schedule D.
function parseNetWorthText(rawText) {
  // Strip null bytes first — Annual FD PDFs embed \x00 in section headings
  const text = rawText.replace(/\x00/g, '')
  // Normalize ranges broken across lines (e.g. "$50,001 -\n$100,000")
  const normalized = text.replace(/(\$[\d,]+)\s*[-–]\s*\n\s*(\$[\d,]+)/g, '$1 - $2')

  // Isolate Schedule A (Assets) and Schedule D (Liabilities) by their abbreviated headers
  const schedA = normalized.match(/S\s+A:[\s\S]*?(?=S\s+[B-Z]:|$)/i)?.[0] ?? ''
  const schedD = normalized.match(/S\s+D:[\s\S]*?(?=S\s+[E-Z]:|$)/i)?.[0] ?? ''

  const AMT_RE = /\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+(?:\.\d+)?|Over \$[\d,]+|\$[\d,]+(?:\.\d+)?/

  // Each asset entry in Schedule A is tagged with an asset-type code like [MF], [ST], [RP].
  // The value immediately follows — either on the same line (tab-separated) or the next line.
  // Single regex handles both cases: [^\S\n]* = non-newline whitespace, \n? = optional newline.
  let assetsMin = 0, assetsMax = 0, hasAssets = false
  if (schedA && !/None disclosed/i.test(schedA)) {
    const assetRe = /\[[A-Z]{2,3}\][^\S\n]*\n?[^\S\n]*(\$[\d,]+(?:\.\d+)?\s*[-–]\s*\$[\d,]+(?:\.\d+)?|Over \$[\d,]+|\$[\d,]+(?:\.\d+)?)/g
    let m
    while ((m = assetRe.exec(schedA)) !== null) {
      const { min, max } = parseAmountRange(m[1])
      if (min !== null) { assetsMin += min; assetsMax += (max ?? min); hasAssets = true }
    }
  }

  // Each liability in Schedule D is one creditor row; the last dollar amount on the
  // row (after date and liability type) is the amount owed.
  let liabMin = 0, liabMax = 0, hasLiab = false
  if (schedD && !/None disclosed/i.test(schedD)) {
    const skipRe = /^(Owner|Creditor|Filing ID|S\s|None|https?)/i
    for (const line of schedD.split('\n')) {
      if (skipRe.test(line.trim())) continue
      const amounts = [...line.matchAll(new RegExp(AMT_RE.source, 'g'))].map(m => m[0])
      if (amounts.length > 0) {
        const { min, max } = parseAmountRange(amounts[amounts.length - 1])
        if (min !== null) { liabMin += min; liabMax += (max ?? min); hasLiab = true }
      }
    }
  }

  if (!hasAssets && !hasLiab) return { assetsMin: null, assetsMax: null, liabMin: null, liabMax: null, nwMin: null, nwMax: null }

  return {
    assetsMin:  hasAssets ? assetsMin : null,
    assetsMax:  hasAssets ? assetsMax : null,
    liabMin:    hasLiab   ? liabMin   : null,
    liabMax:    hasLiab   ? liabMax   : null,
    nwMin:      hasAssets ? assetsMin - (hasLiab ? liabMax : 0) : null,
    nwMax:      hasAssets ? assetsMax - (hasLiab ? liabMin : 0) : null,
  }
}

// ── Phase 1: Download XML indices ────────────────────────────────────────────
async function runIndexPhase() {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true })
  const years = YEAR
    ? [YEAR]
    : Array.from({ length: CURRENT_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)

  let total = 0
  for (const year of years) {
    const url = `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.zip`
    process.stdout.write(`[${year}] Downloading... `)
    try {
      const buf   = await fetchBuffer(url)
      const zip   = new AdmZip(buf)
      const entry = zip.getEntries().find(e => e.entryName.endsWith('.xml'))
      if (!entry) { console.log('no XML'); continue }

      const doc     = parser.parse(entry.getData().toString('utf8'))
      const members = [doc.FinancialDisclosure?.Member].flat().filter(Boolean)

      const rows = members.map(m => ({
        doc_id:       String(m.DocID),
        last_name:    (m.Last  || '').trim(),
        first_name:   (m.First || '').trim(),
        state_dst:    (m.StateDst || '').trim(),
        filing_type:  (m.FilingType || '').trim(),
        year:         parseInt(m.Year, 10) || year,
        filing_date:  parseDate(m.FilingDate),
        pdf_url:      pdfUrl((m.FilingType || '').trim(), year, m.DocID),
      }))

      let inserted = 0
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await supabase
          .from('fd_filings')
          .upsert(rows.slice(i, i + 500), { onConflict: 'doc_id', ignoreDuplicates: true })
        if (error) { console.error('  upsert error:', error.message); break }
        inserted += rows.slice(i, i + 500).length
      }
      total += inserted
      console.log(`${rows.length} filings (${inserted} upserted)`)
    } catch (e) {
      console.log(`FAILED — ${e.message}`)
    }
  }
  console.log(`\nTotal: ${total} rows indexed`)
}

// ── Phase 2: Parse PTR trades ────────────────────────────────────────────────
async function runTradesPhase() {
  let query = supabase
    .from('fd_filings')
    .select('doc_id, last_name, first_name, state_dst, year, pdf_url, bioguide_id')
    .eq('filing_type', 'P')
    .eq('processed', false)
    .order('year', { ascending: false })
    .limit(LIMIT)
  if (YEAR) query = query.eq('year', YEAR)

  const { data: filings, error } = await query
  if (error) { console.error('Query error:', error.message); process.exit(1) }
  console.log(`Processing ${filings.length} PTR filings (year filter: ${YEAR || 'all'})...\n`)

  let ok = 0, failed = 0, empty = 0
  for (const filing of filings) {
    process.stdout.write(`  [${filing.year}] ${filing.last_name}, ${filing.first_name} (${filing.doc_id})... `)
    try {
      const parser = new PDFParse({ url: filing.pdf_url })
      const { text: rawText } = await parser.getText()
      const text = sanitize(rawText)
      const transactions = parsePTRTransactions(text)

      if (transactions.length > 0) {
        const rows = transactions.map((t, idx) => ({
          doc_id:           filing.doc_id,
          // Stable natural key for dedup: filing + position within the filing
          transaction_id:   `${filing.doc_id}:${idx}:${(t.ticker || t.asset_name || '').slice(0, 20)}`,
          last_name:        filing.last_name,
          first_name:       filing.first_name,
          state_dst:        filing.state_dst,
          bioguide_id:      filing.bioguide_id || null,
          year:             filing.year,
          transaction_date: t.transaction_date,
          owner:            t.owner,
          asset_name:       sanitize(t.asset_name),
          ticker:           sanitize(t.ticker),
          transaction_type: t.transaction_type,
          amount_min:       t.amount_min,
          amount_max:       t.amount_max,
          amount_str:       sanitize(t.amount_str),
        }))
        const { error: insErr } = await supabase
          .from('fd_trades')
          .upsert(rows, { onConflict: 'doc_id,transaction_id', ignoreDuplicates: true })
        if (insErr) throw new Error(insErr.message)
        console.log(`${transactions.length} trades`)
        ok++
      } else {
        console.log('0 trades (form may be empty or scanned)')
        empty++
      }
      await supabase.from('fd_filings').update({ processed: true }).eq('doc_id', filing.doc_id)
    } catch (e) {
      console.log(`FAILED — ${e.message}`)
      failed++
      await supabase.from('fd_filings').update({ processed: true }).eq('doc_id', filing.doc_id)
    }
    // Be polite to the House Clerk server
    await new Promise(r => setTimeout(r, 400))
  }
  console.log(`\nDone — OK: ${ok}, Empty: ${empty}, Failed: ${failed}`)
}

// ── Phase 3: Parse Annual FD net worth ────────────────────────────────────────
async function runNetWorthPhase() {
  let query = supabase
    .from('fd_filings')
    .select('doc_id, last_name, first_name, state_dst, year, pdf_url, bioguide_id')
    .eq('filing_type', 'A')
    .eq('processed', false)
    .order('year', { ascending: false })
    .limit(LIMIT)
  if (YEAR) query = query.eq('year', YEAR)

  const { data: filings, error } = await query
  if (error) { console.error('Query error:', error.message); process.exit(1) }
  console.log(`Processing ${filings.length} Annual FD filings...\n`)

  let ok = 0, failed = 0, noData = 0
  for (const filing of filings) {
    process.stdout.write(`  [${filing.year}] ${filing.last_name}, ${filing.first_name} (${filing.doc_id})... `)
    try {
      const parser = new PDFParse({ url: filing.pdf_url })
      const { text: rawText } = await parser.getText()
      const text = sanitize(rawText)
      const { assetsMin, assetsMax, liabMin, liabMax, nwMin, nwMax } = parseNetWorthText(text)

      if (assetsMin !== null || nwMin !== null) {
        const { error: insErr } = await supabase.from('fd_net_worth').upsert({
          doc_id:          filing.doc_id,
          last_name:       filing.last_name,
          first_name:      filing.first_name,
          state_dst:       filing.state_dst,
          bioguide_id:     filing.bioguide_id || null,
          report_year:     filing.year,
          assets_min:      assetsMin,
          assets_max:      assetsMax,
          liabilities_min: liabMin,
          liabilities_max: liabMax,
          net_worth_min:   nwMin,
          net_worth_max:   nwMax,
        }, { onConflict: 'bioguide_id,report_year', ignoreDuplicates: true })
        if (insErr) throw new Error(insErr.message)
        const nwStr = nwMin ? `NW $${(nwMin/1e6).toFixed(1)}M–$${((nwMax||nwMin)/1e6).toFixed(1)}M` : 'assets only'
        console.log(nwStr)
        ok++
      } else {
        console.log('no totals found (likely scanned PDF)')
        noData++
      }
      await supabase.from('fd_filings').update({ processed: true }).eq('doc_id', filing.doc_id)
    } catch (e) {
      console.log(`FAILED — ${e.message}`)
      failed++
      await supabase.from('fd_filings').update({ processed: true }).eq('doc_id', filing.doc_id)
    }
    await new Promise(r => setTimeout(r, 400))
  }
  console.log(`\nDone — OK: ${ok}, No data: ${noData}, Failed: ${failed}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`CivicWatch Financial Disclosure Ingestion — Phase: ${PHASE}${YEAR ? ` (${YEAR})` : ''} limit: ${LIMIT}`)
console.log(`Supabase: ${SUPABASE_URL ? '✓' : '✗ MISSING'}`)
console.log()

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials'); process.exit(1) }

if (PHASE === 'index')       runIndexPhase().catch(console.error)
else if (PHASE === 'trades')    runTradesPhase().catch(console.error)
else if (PHASE === 'networth')  runNetWorthPhase().catch(console.error)
else { console.error(`Unknown phase: ${PHASE}`); process.exit(1) }
