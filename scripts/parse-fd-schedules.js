/**
 * parse-fd-schedules.js
 *
 * Parses raw OCR text from a House Financial Disclosure Annual Report PDF
 * and returns structured net worth data.
 *
 * Usage:
 *   import { parseFDSchedules } from './parse-fd-schedules.js'
 *   const result = parseFDSchedules(ocrText, { year: 2024 })
 */

// Standard FD disclosure dollar ranges → [min, max]
const FD_RANGES = [
  { min:          1, max:       1_000, patterns: ['$1 - $1,000', '$1-$1,000'] },
  { min:      1_001, max:      15_000, patterns: ['$1,001 - $15,000', '$1,001-$15,000'] },
  { min:     15_001, max:      50_000, patterns: ['$15,001 - $50,000', '$15,001-$50,000'] },
  { min:     50_001, max:     100_000, patterns: ['$50,001 - $100,000', '$50,001-$100,000'] },
  { min:    100_001, max:     250_000, patterns: ['$100,001 - $250,000', '$100,001-$250,000'] },
  { min:    250_001, max:     500_000, patterns: ['$250,001 - $500,000', '$250,001-$500,000'] },
  { min:    500_001, max:   1_000_000, patterns: ['$500,001 - $1,000,000', '$500,001-$1,000,000'] },
  { min:  1_000_001, max:   5_000_000, patterns: ['$1,000,001 - $5,000,000', '$1,000,001-$5,000,000'] },
  { min:  5_000_001, max:  25_000_000, patterns: ['$5,000,001 - $25,000,000', '$5,000,001-$25,000,000'] },
  { min: 25_000_001, max:  50_000_000, patterns: ['$25,000,001 - $50,000,000', '$25,000,001-$50,000,000'] },
  { min: 50_000_001, max: 100_000_000, patterns: ['over $50,000,000', '$50,000,001 +', '$50,000,001+'] },
]

// Build a regex that matches any FD range pattern (handles OCR noise: varied spacing/hyphens)
const RANGE_RX = /\$\s*([\d,]+)\s*[-–—]\s*\$\s*([\d,]+)|\bover\s+\$\s*([\d,]+)/gi

function parseDollarRange(line) {
  // Normalise OCR noise: remove stray spaces within numbers
  const clean = line.replace(/\$\s+/g, '$').replace(/,\s+/g, ',')

  // Try exact FD range match first (most reliable)
  const lower = clean.toLowerCase()
  for (const r of FD_RANGES) {
    for (const p of r.patterns) {
      if (lower.includes(p.toLowerCase())) return { min: r.min, max: r.max }
    }
  }

  // Generic: extract two dollar amounts from a range expression
  const rx = /\$\s*([\d,]+)/g
  const amounts = []
  let m
  while ((m = rx.exec(clean)) !== null) {
    const v = parseInt(m[1].replace(/,/g, ''), 10)
    if (!isNaN(v)) amounts.push(v)
  }

  if (amounts.length >= 2) {
    const lo = Math.min(...amounts.slice(0, 2))
    const hi = Math.max(...amounts.slice(0, 2))
    // Snap to nearest FD bracket
    const bracket = FD_RANGES.find(r => lo >= r.min && hi <= r.max * 1.1)
    return bracket ? { min: bracket.min, max: bracket.max } : { min: lo, max: hi }
  }
  return null
}

/**
 * Split OCR text into sections by detecting Schedule headers.
 * Returns { assetLines: string[], liabilityLines: string[] }
 */
function splitSections(text) {
  const lines = text.split('\n')
  const assetLines = []
  const liabilityLines = []
  let mode = 'none'

  for (const line of lines) {
    const u = line.toUpperCase().trim()

    // Detect section transitions
    if (/SCHEDULE\s+A\b/.test(u) || (u.includes('ASSET') && u.includes('INCOME'))) {
      mode = 'assets'
    } else if (/SCHEDULE\s+D\b/.test(u) || /LIABILIT/.test(u)) {
      mode = 'liabilities'
    } else if (/SCHEDULE\s+[BCEF]\b/.test(u)) {
      mode = 'other'
    }

    if (mode === 'assets') assetLines.push(line)
    else if (mode === 'liabilities') liabilityLines.push(line)
  }

  // If no sections detected, treat entire document as potential assets
  // (handles single-page or reformatted disclosures)
  if (assetLines.length === 0 && liabilityLines.length === 0) {
    return { assetLines: lines, liabilityLines: [] }
  }

  return { assetLines, liabilityLines }
}

/**
 * Extract all dollar ranges from a list of lines, returning array of {min, max}.
 */
function extractRanges(lines) {
  const items = []
  for (const line of lines) {
    // Only consider lines that look like data rows (contain a $)
    if (!line.includes('$')) continue
    const range = parseDollarRange(line)
    if (range) items.push(range)
  }
  return items
}

/**
 * Try to extract the calendar year from OCR text.
 */
function extractYear(text) {
  const patterns = [
    /calendar\s+year\s+(\d{4})/i,
    /annual\s+report\s+for\s+(\d{4})/i,
    /report\s+year[:\s]+(\d{4})/i,
    /\bfor\s+the\s+year\s+(\d{4})/i,
    /filing\s+year[:\s]+(\d{4})/i,
  ]
  for (const rx of patterns) {
    const m = text.match(rx)
    if (m) return parseInt(m[1], 10)
  }
  // Last resort: find a plausible 4-digit year in the 2000-2030 range
  const allYears = [...text.matchAll(/\b(20\d{2})\b/g)]
    .map(m => parseInt(m[1], 10))
    .filter(y => y >= 2008 && y <= 2030)
  if (allYears.length) return allYears[0]
  return null
}

/**
 * Main parser entry point.
 *
 * @param {string} ocrText - Full OCR text from all pages of the disclosure PDF
 * @param {{ year?: number }} opts - Optional hint for the calendar year
 * @returns {{ netWorthLow, netWorthHigh, year, assetCount, liabilityCount, confidence }}
 */
export function parseFDSchedules(ocrText, opts = {}) {
  const year = opts.year ?? extractYear(ocrText)
  const { assetLines, liabilityLines } = splitSections(ocrText)

  const assets = extractRanges(assetLines)
  const liabilities = extractRanges(liabilityLines)

  const assetsMin = assets.reduce((s, r) => s + r.min, 0)
  const assetsMax = assets.reduce((s, r) => s + r.max, 0)
  const liabMin = liabilities.reduce((s, r) => s + r.min, 0)
  const liabMax = liabilities.reduce((s, r) => s + r.max, 0)

  const netWorthLow = assetsMin - liabMax
  const netWorthHigh = assetsMax - liabMin

  const totalParsed = assets.length + liabilities.length
  const confidence = totalParsed >= 5 ? 'high' : totalParsed >= 1 ? 'medium' : 'low'

  return {
    netWorthLow,
    netWorthHigh,
    year,
    assetCount: assets.length,
    liabilityCount: liabilities.length,
    confidence,
  }
}
