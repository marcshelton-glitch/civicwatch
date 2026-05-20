import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { extractText, getDocumentProxy } from 'unpdf'

const HOUSE_CLERK = 'https://disclosures-clerk.house.gov/public_disc'

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

function parseAmountRange(str) {
  if (!str) return { min: null, max: null }
  const s = str.replace(/\s+/g, ' ').trim()
  for (const [label, min, max] of AMOUNT_MAP) {
    if (s.includes(label.replace(/\s+/g, ' '))) return { min, max }
  }
  const nums = s.replace(/,/g, '').match(/\d+/g)?.map(Number) || []
  return { min: nums[0] ?? null, max: nums[1] ?? null }
}

function sanitize(str) {
  if (!str) return str
  return str
    .replace(/\x00/g, ' ')  // null bytes appear between letters in some PTR PDF filings
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/�/g, '')
    .replace(/[^\x09\x0A\x0D\x20-퟿-�]/g, '')
}

function formatAmount(min, max) {
  const fmt = v => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B`
    : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M`
    : v >= 1e3 ? `$${Math.round(v/1e3)}K`
    : `$${v}`
  if (min == null) return 'Undisclosed'
  if (max == null) return `Over ${fmt(min)}`
  return `${fmt(min)} – ${fmt(max)}`
}

const HEADER_RE = /ID\s+Owner\s+Asset\s+Transaction[\s\S]*?Cap\.?\s*Gains\s*>?\s*\$?200\??/i

function parsePTR(text) {
  const trades = []
  const tSection = text.match(/ID\s+Owner[\s\S]+?(?=\*\s*For the complete list)/i)?.[0]
    || text.match(/ID\s+Owner[\s\S]+?(?=I\s{3,}P\s{3,}O)/i)?.[0]
    || text.match(/ID\s+Owner[\s\S]+/i)?.[0]
  if (!tSection) return trades

  const body = tSection.replace(HEADER_RE, '').trim()
  const blocks = body.split(/F\s{2,}S\s{2,}:\s+(?:New|Amendment)/i)

  for (const block of blocks) {
    const b = block.replace(HEADER_RE, '').trim()
    if (b.length < 10) continue

    const ownerMatch = b.match(/^(SP|JT|DC)\s+/m)
    const owner = ownerMatch ? ownerMatch[1] : 'Self'

    // Allow optional modifier like "(partial)" between type letter and date
    const typeMatch = b.match(/\b([PSE])(?:\s+\([^)]*\))?\s+(\d{2}\/\d{2}\/\d{4})/)
    if (!typeMatch) continue
    const rawType = typeMatch[1]
    const txType = rawType === 'P' ? 'Purchase' : rawType === 'S' ? 'Sale' : 'Exchange'

    const dates = [...b.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map(m => m[1])
    if (!dates[0]) continue

    const amountMatch = b.match(/(\$[\d,]+\s*-\s*[\n\r ]*\$[\d,]+|Over \$50,000,000)/s)
    const amountStr = amountMatch
      ? amountMatch[0].replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
      : null

    const tickerMatch = [...b.matchAll(/\(([A-Z][A-Z0-9.]{0,9})\)/g)]
      .find(m => /^[A-Z]{1,5}$/.test(m[1]) || /^[A-Z]{1,4}\.[A-Z]$/.test(m[1]))
    const ticker = tickerMatch?.[1] && !/^\d/.test(tickerMatch[1]) ? tickerMatch[1] : null

    const preType = b.split(/\b[PSE](?:\s+\([^)]*\))?\s+\d{2}\/\d{2}\/\d{4}/)[0]
    const assetName = preType
      .replace(/^(SP|JT|DC)\s+/gm, '')
      .replace(/\[[A-Z]{2,5}\]/g, '')
      .replace(/S\s{3,}O\s*:[^\n]+\n?/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Unknown Asset'

    const { min, max } = parseAmountRange(amountStr)
    const [month, day, year] = dates[0].split('/')
    trades.push({
      date: `${year}-${month}-${day}`,
      asset: assetName,
      ticker,
      type: txType === 'Purchase' ? 'BUY' : txType === 'Sale' ? 'SELL' : 'EXCHANGE',
      owner: owner === 'SP' ? 'Spouse' : owner === 'JT' ? 'Joint' : owner === 'DC' ? 'Dependent' : 'Self',
      amountMin: min,
      amountMax: max,
      amount: formatAmount(min, max),
    })
  }
  return trades
}

async function extractPdfText(buf) {
  const pdf = await getDocumentProxy(new Uint8Array(buf))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

export async function GET(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const docId = (searchParams.get('docId') || '').trim()
  const year  = (searchParams.get('year')  || '').trim()

  if (!docId || !year) return NextResponse.json({ error: 'docId and year required' }, { status: 400 })

  const pdfUrl = `${HOUSE_CLERK}/ptr-pdfs/${year}/${docId}.pdf`

  try {
    const pdfRes = await fetch(pdfUrl, {
      headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
      cache: 'no-store',
    })
    if (!pdfRes.ok) {
      return NextResponse.json({ error: `PDF fetch failed: ${pdfRes.status}`, pdfUrl }, { status: 502 })
    }
    const buf    = Buffer.from(await pdfRes.arrayBuffer())
    const raw    = await extractPdfText(buf)
    const text   = sanitize(raw)
    const trades = parsePTR(text)
    return NextResponse.json(
      { trades, pdfUrl, docId, year, parsed: trades.length > 0 },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
    )
  } catch (e) {
    console.error('PTR parse error:', e.message, e.stack?.split('\n').slice(0, 3).join(' | '))
    return NextResponse.json({ error: 'Could not parse PDF', detail: e.message, pdfUrl }, { status: 500 })
  }
}
