import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 300 // 5-minute edge cache

// ── IP-based rate limiter ─────────────────────────────────────────────────────
const feedRateMap = new Map()
const FEED_WINDOW_MS = 60_000
const FEED_MAX_CALLS = 30

function cleanupFeedRateMap() {
  const now = Date.now()
  for (const [key, entry] of feedRateMap.entries()) {
    if (now - entry.windowStart > FEED_WINDOW_MS * 2) feedRateMap.delete(key)
  }
}
setInterval(cleanupFeedRateMap, 5 * 60_000)

function isFeedRateLimited(ip) {
  const now = Date.now()
  const entry = feedRateMap.get(ip) || { count: 0, windowStart: now }
  if (now - entry.windowStart > FEED_WINDOW_MS) {
    feedRateMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= FEED_MAX_CALLS) return true
  entry.count++
  feedRateMap.set(ip, entry)
  return false
}

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous'
  if (isFeedRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = getSupabase()

  const [tradesRes, wealthRes] = await Promise.all([
    // 20 most recent House + Senate trades
    Promise.all([
      supabase
        .from('fd_trades')
        .select('first_name, last_name, ticker, asset_name, transaction_type, amount_str, transaction_date')
        .not('transaction_date', 'is', null)
        .not('asset_name', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(10),
      supabase
        .from('senate_trades')
        .select('first_name, last_name, ticker, asset_name, transaction_type, amount_str, transaction_date')
        .not('transaction_date', 'is', null)
        .not('asset_name', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(10),
    ]),
    // Top 10 members by net worth
    supabase
      .from('fd_net_worth')
      .select('last_name, net_worth_min, net_worth_max, report_year')
      .not('net_worth_min', 'is', null)
      .order('net_worth_min', { ascending: false })
      .limit(10),
  ])

  const [houseTrades, senateTrades] = tradesRes
  const { data: topWealth } = wealthRes

  const houseFeed = (houseTrades.data || []).map(t => ({
    name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Member',
    ticker: t.ticker || null,
    asset: t.asset_name,
    type: t.transaction_type === 'Purchase' ? 'BUY'
      : t.transaction_type === 'Sale' ? 'SELL'
      : (t.transaction_type || '').toUpperCase() || 'TRADE',
    amount: t.amount_str || 'Undisclosed',
    date: t.transaction_date,
    chamber: 'house',
  }))

  const senateFeed = (senateTrades.data || []).map(t => ({
    name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Senator',
    ticker: t.ticker || null,
    asset: t.asset_name,
    type: t.transaction_type === 'Purchase' ? 'BUY'
      : t.transaction_type === 'Sale' ? 'SELL'
      : (t.transaction_type || '').toUpperCase() || 'TRADE',
    amount: t.amount_str || 'Undisclosed',
    date: t.transaction_date,
    chamber: 'senate',
  }))

  // Merge and sort by date descending, take top 20
  const allTrades = [...houseFeed, ...senateFeed]
    .filter(t => t.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)

  const wealthFeed = (topWealth || []).map(r => ({
    name: r.last_name || 'Member',
    netWorthMin: r.net_worth_min,
    netWorthMax: r.net_worth_max,
    year: r.report_year,
  }))

  return NextResponse.json({
    trades: allTrades,
    topWealth: wealthFeed,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
