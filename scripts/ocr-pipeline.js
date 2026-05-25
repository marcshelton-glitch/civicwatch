/**
 * ocr-pipeline.js
 *
 * Batch OCR pipeline for scanned House Financial Disclosure PDFs.
 * Converts each PDF page to a PNG, sends to Google Vision DOCUMENT_TEXT_DETECTION,
 * parses net worth via parse-fd-schedules.js, and upserts into Supabase fd_net_worth.
 *
 * Usage:
 *   node --env-file=.env.local scripts/ocr-pipeline.js \
 *     --year=2024 \
 *     --input=data/house-filings-2024.json \
 *     [--force] [--limit=50]
 *
 * Or query Supabase directly (no --input):
 *   node --env-file=.env.local scripts/ocr-pipeline.js --year=2024
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises'
import { createWriteStream } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import https from 'https'
import http from 'http'
import { parseFDSchedules } from './parse-fd-schedules.js'

const execFileAsync = promisify(execFile)

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const VISION_KEY   = process.env.GOOGLE_VISION_API_KEY

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true] })
)

const YEAR   = args.year  ? parseInt(args.year, 10) : new Date().getFullYear() - 1
const LIMIT  = args.limit ? parseInt(args.limit, 10) : Infinity
const FORCE  = args.force === true || args.force === 'true'
const INPUT  = args.input || null

const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`
const UA = 'CivicWatch/1.0 (civicwatch.app)'

// ── Supabase client ───────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Rate limiter: 5 Vision API requests/second ────────────────────────────────

class RateLimiter {
  constructor(rps) {
    this.minInterval = 1000 / rps
    this.lastCall = 0
  }
  async wait() {
    const now = Date.now()
    const wait = this.minInterval - (now - this.lastCall)
    if (wait > 0) await delay(wait)
    this.lastCall = Date.now()
  }
}

const visionLimiter = new RateLimiter(5)

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Download helpers ──────────────────────────────────────────────────────────

function downloadToFile(url, destPath, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error('Too many redirects'))
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        return downloadToFile(res.headers.location, destPath, redirects - 1)
          .then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const stream = createWriteStream(destPath)
      res.pipe(stream)
      stream.on('finish', resolve)
      stream.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(60_000, () => { req.destroy(); reject(new Error('PDF download timeout')) })
  })
}

// ── PDF → PNG conversion ──────────────────────────────────────────────────────

async function pdfToImages(pdfPath) {
  const tmpDir = await mkdtemp(join(tmpdir(), 'civicwatch-ocr-'))

  try {
    const outPrefix = join(tmpDir, 'page')

    // Try pdftoppm (poppler) first — outputs page-1.png, page-2.png, ...
    let usedGs = false
    try {
      await execFileAsync('pdftoppm', ['-png', '-r', '200', pdfPath, outPrefix], { timeout: 120_000 })
    } catch {
      // Fall back to ghostscript — outputs page-1.png, page-2.png, ...
      usedGs = true
      await execFileAsync('gs', [
        '-dNOPAUSE', '-dBATCH', '-sDEVICE=png16m', '-r200',
        `-sOutputFile=${outPrefix}-%d.png`, pdfPath,
      ], { timeout: 120_000 })
    }

    const files = (await readdir(tmpDir))
      .filter(f => f.endsWith('.png'))
      .sort((a, b) => {
        // Sort numerically by page number embedded in filename
        const numA = parseInt(a.match(/\d+/)?.[0] ?? '0', 10)
        const numB = parseInt(b.match(/\d+/)?.[0] ?? '0', 10)
        return numA - numB
      })

    if (files.length === 0) throw new Error('No PNG pages generated')

    return { tmpDir, files: files.map(f => join(tmpDir, f)) }
  } catch (err) {
    await rm(tmpDir, { recursive: true, force: true })
    throw err
  }
}

// ── Google Vision OCR ─────────────────────────────────────────────────────────

async function ocrPage(imagePath) {
  await visionLimiter.wait()

  const imageData = await readFile(imagePath)
  const base64 = imageData.toString('base64')

  const body = JSON.stringify({
    requests: [{
      image: { content: base64 },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    }],
  })

  const res = await fetch(VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Vision API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.responses?.[0]?.fullTextAnnotation?.text ?? ''
}

async function ocrPdf(pdfPath) {
  const { tmpDir, files } = await pdfToImages(pdfPath)
  const pageTexts = []

  try {
    for (let i = 0; i < files.length; i++) {
      process.stdout.write(`    page ${i + 1}/${files.length}...\r`)
      const text = await ocrPage(files[i])
      pageTexts.push(text)
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }

  return pageTexts.join('\n\n--- PAGE BREAK ---\n\n')
}

// ── Load members to process ───────────────────────────────────────────────────

async function loadMembers() {
  if (INPUT) {
    const raw = await readFile(INPUT, 'utf8')
    const data = JSON.parse(raw)
    console.log(`Loaded ${data.length} filings from ${INPUT}`)
    return data
  }

  // Query Supabase: Annual FD filings for the target year with a PDF URL
  console.log(`Querying Supabase for Annual FD filings (year=${YEAR})...`)
  const { data: filings, error } = await supabase
    .from('fd_filings')
    .select('doc_id, last_name, first_name, state_dst, year, pdf_url, bioguide_id')
    .eq('filing_type', 'A')
    .eq('year', YEAR)
    .not('pdf_url', 'is', null)
    .order('last_name')

  if (error) throw new Error(`Supabase query error: ${error.message}`)
  console.log(`Found ${filings.length} Annual FD filings in fd_filings`)
  return filings
}

// ── Check which members already have OCR rows ─────────────────────────────────

async function loadAlreadyProcessed(year) {
  const { data, error } = await supabase
    .from('fd_net_worth')
    .select('doc_id')
    .eq('report_year', year)
    .eq('source', 'ocr')

  if (error) throw new Error(`Supabase check error: ${error.message}`)
  return new Set((data || []).map(r => r.doc_id))
}

// ── Upsert result to Supabase ─────────────────────────────────────────────────

async function upsertNetWorth(filing, parsed) {
  const row = {
    doc_id:          filing.doc_id,
    last_name:       filing.last_name,
    first_name:      filing.first_name,
    state_dst:       filing.state_dst,
    bioguide_id:     filing.bioguide_id ?? null,
    report_year:     parsed.year ?? filing.year ?? YEAR,
    assets_min:      null,
    assets_max:      null,
    liabilities_min: null,
    liabilities_max: null,
    net_worth_min:   parsed.netWorthLow,
    net_worth_max:   parsed.netWorthHigh,
    source:          'ocr',
    confidence:      parsed.confidence,
    asset_count:     parsed.assetCount,
    liability_count: parsed.liabilityCount,
  }

  const { error } = await supabase
    .from('fd_net_worth')
    .upsert(row, { onConflict: 'doc_id' })

  if (error) throw new Error(`Supabase upsert error: ${error.message}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!VISION_KEY) {
    console.error('Missing GOOGLE_VISION_API_KEY')
    process.exit(1)
  }

  console.log(`=== CivicWatch OCR Pipeline ===`)
  console.log(`Year: ${YEAR}  Force: ${FORCE}  Limit: ${LIMIT === Infinity ? 'none' : LIMIT}`)

  const members = await loadMembers()
  const alreadyDone = FORCE ? new Set() : await loadAlreadyProcessed(YEAR)

  const queue = members
    .filter(m => m.pdf_url && !alreadyDone.has(m.doc_id))
    .slice(0, LIMIT)

  console.log(`Queue: ${queue.length} filings to process (${alreadyDone.size} already done)`)

  const stats = { ok: 0, skipped: 0, failed: 0, lowConfidence: 0 }
  const failures = []

  for (let i = 0; i < queue.length; i++) {
    const filing = queue[i]
    const label = `${filing.last_name}, ${filing.first_name} (${filing.doc_id})`
    console.log(`\n[${i + 1}/${queue.length}] ${label}`)

    // Download PDF to a temp file
    const tmpPdf = join(tmpdir(), `civicwatch-${filing.doc_id}.pdf`)
    try {
      process.stdout.write('  downloading...')
      await downloadToFile(filing.pdf_url, tmpPdf)
      console.log(' done')

      process.stdout.write('  OCR in progress...')
      const ocrText = await ocrPdf(tmpPdf)
      console.log(` done (${ocrText.length} chars)`)

      const parsed = parseFDSchedules(ocrText, { year: filing.year ?? YEAR })
      console.log(`  parsed: assets=${parsed.assetCount} liabilities=${parsed.liabilityCount} confidence=${parsed.confidence}`)
      console.log(`  net worth: $${parsed.netWorthLow.toLocaleString()} – $${parsed.netWorthHigh.toLocaleString()}`)

      if (parsed.confidence === 'low') stats.lowConfidence++

      await upsertNetWorth(filing, parsed)
      console.log('  upserted ✓')
      stats.ok++
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
      stats.failed++
      failures.push({ doc_id: filing.doc_id, name: label, error: err.message })
    } finally {
      // Clean up temp PDF
      await rm(tmpPdf, { force: true })
    }
  }

  // Summary
  console.log(`\n=== Summary ===`)
  console.log(`Processed:      ${stats.ok}`)
  console.log(`Failed:         ${stats.failed}`)
  console.log(`Low confidence: ${stats.lowConfidence}`)

  if (failures.length) {
    console.log('\nFailed filings:')
    for (const f of failures) console.log(`  ${f.name}: ${f.error}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
