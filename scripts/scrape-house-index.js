/**
 * scrape-house-index.js
 *
 * Fetches the House Clerk financial disclosure index for a given year and outputs
 * a JSON array of Annual Report filings (type 'A') suitable for use as input to
 * ocr-pipeline.js.
 *
 * Usage:
 *   node --env-file=.env.local scripts/scrape-house-index.js 2024 > data/house-filings-2024.json
 *   node --env-file=.env.local scripts/scrape-house-index.js 2024 --verbose
 *
 * Output format:
 *   [{ doc_id, last_name, first_name, state_dst, year, pdf_url, bioguide_id }]
 */

import 'dotenv/config'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import https from 'https'
import http from 'http'

const UA = 'CivicWatch/1.0 (civicwatch.app)'

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true] })
)
const YEAR    = parseInt(process.argv.find(a => /^\d{4}$/.test(a)) ?? new Date().getFullYear() - 1, 10)
const VERBOSE = args.verbose === true || args.verbose === 'true'

function log(...a) { if (VERBOSE) process.stderr.write(a.join(' ') + '\n') }

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error('Too many redirects'))
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { headers: { 'User-Agent': UA, Accept: '*/*' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        return fetchBuffer(res.headers.location, redirects - 1).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
    req.setTimeout(60_000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

async function fetchJson(url) {
  const buf = await fetchBuffer(url)
  return JSON.parse(buf.toString('utf8'))
}

// ── PDF URL builder ───────────────────────────────────────────────────────────

function pdfUrl(filingType, year, docId) {
  const base = 'https://disclosures-clerk.house.gov/public_disc'
  return (filingType === 'P' || filingType === 'D')
    ? `${base}/ptr-pdfs/${year}/${docId}.pdf`
    : `${base}/financial-pdfs/${year}/${docId}.pdf`
}

// ── Strategy 1: ZIP + XML index (known-good, used by ingest-disclosures.mjs) ──

async function fetchViaZip(year) {
  const url = `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.zip`
  log(`Trying ZIP index: ${url}`)

  const buf = await fetchBuffer(url)
  const zip = new AdmZip(buf)
  const entries = zip.getEntries()
  const xmlEntry = entries.find(e => e.name.endsWith('.xml'))
  if (!xmlEntry) throw new Error('No XML found in ZIP')

  log(`Parsing ${xmlEntry.name} (${xmlEntry.getData().length} bytes)`)
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false })
  const doc = parser.parse(xmlEntry.getData().toString('utf8'))

  // The XML root may be <filings> or <FinancialDisclosure>
  const root = doc?.filings?.filing ?? doc?.FinancialDisclosure?.Member ?? []
  const rows = Array.isArray(root) ? root : [root]

  log(`Found ${rows.length} total filings in XML`)
  return rows.map(m => ({
    doc_id:     (m.DocID ?? m.documentid ?? '').toString().trim(),
    last_name:  (m.Last ?? m.lastname ?? '').toString().trim(),
    first_name: (m.First ?? m.firstname ?? '').toString().trim(),
    state_dst:  (m.StateDst ?? m.statedst ?? m.District ?? '').toString().trim(),
    year:       parseInt(m.Year ?? m.year ?? year, 10),
    filing_type:(m.FilingType ?? m.filingtype ?? '').toString().trim().toUpperCase(),
    pdf_url:    null, // filled in below
    bioguide_id:null,
  }))
    .filter(r => r.doc_id)
    .map(r => ({ ...r, pdf_url: pdfUrl(r.filing_type, r.year, r.doc_id) }))
}

// ── Strategy 2: House Clerk REST API ─────────────────────────────────────────

async function fetchViaApi(year) {
  // Probe endpoint 1: /api/filings
  const url1 = `https://disclosures.house.gov/api/filings?year=${year}&filingType=1`
  log(`Probing House Clerk API: ${url1}`)

  let data
  try {
    data = await fetchJson(url1)
    log(`API response keys: ${Object.keys(data).join(', ')}`)
  } catch (err) {
    log(`API probe 1 failed: ${err.message}`)
    throw err
  }

  // The response may be an array directly, or wrapped in a property
  const rows = Array.isArray(data) ? data
    : data.FilingData ?? data.filings ?? data.results ?? data.data ?? []

  if (!rows.length) throw new Error('Empty API response — no rows found')

  log(`API returned ${rows.length} rows`)

  return rows.map(r => ({
    doc_id:      (r.DocID ?? r.docId ?? r.doc_id ?? r.FilingID ?? '').toString().trim(),
    last_name:   (r.Last ?? r.lastName ?? r.last_name ?? '').toString().trim(),
    first_name:  (r.First ?? r.firstName ?? r.first_name ?? '').toString().trim(),
    state_dst:   (r.StateDst ?? r.stateDst ?? r.state_dst ?? r.District ?? '').toString().trim(),
    year:        parseInt(r.Year ?? r.year ?? year, 10),
    filing_type: (r.FilingType ?? r.filingType ?? r.filing_type ?? '').toString().trim().toUpperCase(),
    pdf_url:     r.pdf_url ?? r.PdfUrl ?? r.pdfUrl ?? null,
    bioguide_id: r.bioguide_id ?? r.BioguideID ?? null,
  }))
    .filter(r => r.doc_id)
    .map(r => ({
      ...r,
      pdf_url: r.pdf_url ?? pdfUrl(r.filing_type, r.year, r.doc_id),
    }))
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`=== House FD Index Scraper — year ${YEAR} ===`)

  let allFilings = []
  let source = 'unknown'

  // Try ZIP first (most reliable — known to work)
  try {
    allFilings = await fetchViaZip(YEAR)
    source = 'zip'
    log(`ZIP strategy succeeded: ${allFilings.length} filings`)
  } catch (zipErr) {
    log(`ZIP strategy failed: ${zipErr.message}`)
    log('Falling back to House Clerk REST API...')
    try {
      allFilings = await fetchViaApi(YEAR)
      source = 'api'
      log(`API strategy succeeded: ${allFilings.length} filings`)
    } catch (apiErr) {
      process.stderr.write(`ERROR: Both strategies failed.\n  ZIP: ${zipErr.message}\n  API: ${apiErr.message}\n`)
      process.exit(1)
    }
  }

  // Filter to Annual Reports only (filing_type === 'A')
  const annual = allFilings.filter(f => f.filing_type === 'A')
  log(`Annual Reports (type A): ${annual.length} of ${allFilings.length}`)

  // Strip internal filing_type field from output (not needed by ocr-pipeline)
  const output = annual.map(({ filing_type, ...rest }) => rest)

  process.stdout.write(JSON.stringify(output, null, 2) + '\n')
  process.stderr.write(`Done: ${output.length} Annual Reports written (source: ${source})\n`)
}

main().catch(err => { process.stderr.write(`Error: ${err.message}\n`); process.exit(1) })
