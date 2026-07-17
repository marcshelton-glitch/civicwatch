// Free, no-key stock price lookups via Stooq (https://stooq.com).
// Used to compute "return since disclosure" for congressional trades.
//
// Stooq has no auth, no rate-limit key, and returns plain CSV — matches the
// project's existing pattern of using free public endpoints (Congress.gov,
// House Clerk, Senate EFTS, GovTrack) rather than paid market-data APIs.
//
// NOTE: Coverage gaps are expected and handled gracefully everywhere this is
// used — options, private placements, bonds, and some OTC/foreign tickers
// won't resolve. Callers must treat a null return as "unknown", never as 0%.

const STOOQ_QUOTE = (sym) => `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`
const STOOQ_HISTORY = (sym, d1, d2) =>
  `https://stooq.com/q/d/l/?s=${encodeURIComponent(sym)}&d1=${d1}&d2=${d2}&i=d`

// Tickers that are almost never real equity/ETF symbols in PTR filings —
// filters out common OCR/parse noise before we waste a network round trip.
const JUNK_TICKERS = new Set(['N', 'NA', 'INC', 'CO', 'LLC', 'LP', 'ETF', 'FUND'])

function toStooqSymbol(ticker) {
  const t = (ticker || '').trim().toUpperCase()
  if (!t || JUNK_TICKERS.has(t) || t.length > 6) return null
  if (!/^[A-Z][A-Z.]{0,5}$/.test(t)) return null
  return `${t}.US`
}

function parseCsvRows(text) {
  return text
    .trim()
    .split('\n')
    .slice(1) // header row
    .map((line) => line.split(','))
    .filter((cols) => cols.length > 1)
}

function dateToStooqFmt(d) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

/**
 * Current/latest close price for a ticker. Returns null on any failure —
 * never throws, since this enriches data that must still render without it.
 */
export async function getCurrentPrice(ticker) {
  const sym = toStooqSymbol(ticker)
  if (!sym) return null
  try {
    const res = await fetch(STOOQ_QUOTE(sym), {
      next: { revalidate: 900 }, // 15 min — close enough for a "since disclosure" estimate
      headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
    })
    if (!res.ok) return null
    const text = await res.text()
    const rows = parseCsvRows(text)
    const cols = rows[0]
    if (!cols) return null
    // f=sd2t2ohlcv → Symbol,Date,Time,Open,High,Low,Close,Volume
    const close = parseFloat(cols[6])
    return Number.isFinite(close) && close > 0 ? close : null
  } catch {
    return null
  }
}

/**
 * Closing price on the first available trading day on/after `dateStr`
 * (YYYY-MM-DD). Looks ahead up to 10 calendar days to clear weekends and
 * market holidays. Returns null if no data is found in that window.
 */
export async function getPriceOnOrAfter(ticker, dateStr) {
  const sym = toStooqSymbol(ticker)
  if (!sym || !dateStr) return null
  try {
    const start = new Date(`${dateStr}T00:00:00Z`)
    if (isNaN(start.getTime())) return null
    const end = new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000)
    const res = await fetch(STOOQ_HISTORY(sym, dateToStooqFmt(start), dateToStooqFmt(end)), {
      next: { revalidate: 86400 }, // historical closes never change — cache a full day
      headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
    })
    if (!res.ok) return null
    const text = await res.text()
    if (text.includes('No data')) return null
    const rows = parseCsvRows(text)
    const first = rows[0]
    if (!first) return null
    // Date,Open,High,Low,Close,Volume
    const close = parseFloat(first[4])
    return Number.isFinite(close) && close > 0 ? close : null
  } catch {
    return null
  }
}

/**
 * Enrich a list of trade-like objects ({ ticker, date, type }) with a
 * `returnPct` field: % change from the disclosed transaction price (proxied
 * by the closing price on/shortly after the trade date) to the current
 * price. Positive = the position gained value since the trade.
 *
 * Bounded and fail-soft by design:
 * - Caps enrichment to `limit` trades (default 25) to keep serverless
 *   function time and Stooq request volume predictable.
 * - Dedupes identical (ticker, date) pairs so repeat trades of the same
 *   stock only cost one historical-price lookup.
 * - Never throws — a trade that can't be priced just comes back without
 *   `returnPct`, and callers should render "—" rather than treat it as 0.
 */
export async function enrichTradesWithReturns(trades, { limit = 25 } = {}) {
  const eligible = trades.filter((t) => t.ticker && t.date && toStooqSymbol(t.ticker))
  const targets = eligible.slice(0, limit)
  if (targets.length === 0) return trades

  const uniqueTickers = [...new Set(targets.map((t) => t.ticker.toUpperCase()))]
  const currentPriceByTicker = {}
  await Promise.all(
    uniqueTickers.map(async (tk) => {
      currentPriceByTicker[tk] = await getCurrentPrice(tk)
    })
  )

  const historicalKey = (t) => `${t.ticker.toUpperCase()}|${t.date}`
  const uniquePairs = [...new Map(targets.map((t) => [historicalKey(t), t])).values()]
  const historicalByKey = {}
  await Promise.all(
    uniquePairs.map(async (t) => {
      historicalByKey[historicalKey(t)] = await getPriceOnOrAfter(t.ticker, t.date)
    })
  )

  return trades.map((t) => {
    if (!t.ticker || !t.date) return t
    const current = currentPriceByTicker[t.ticker.toUpperCase()]
    const atDisclosure = historicalByKey[historicalKey(t)]
    if (!current || !atDisclosure) return t
    const rawPct = ((current - atDisclosure) / atDisclosure) * 100
    // A SELL "gaining value since disclosure" reads backwards to a user —
    // flip the sign so returnPct always means "how the position the
    // member ended up holding (or avoiding) actually performed."
    const signed = t.type === 'SELL' ? -rawPct : rawPct
    return {
      ...t,
      returnPct: Math.round(signed * 10) / 10,
      priceAtDisclosure: atDisclosure,
      priceCurrent: current,
    }
  })
}
