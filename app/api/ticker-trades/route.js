import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enrichTradesWithReturns } from '../../../lib/stockPrice'

// GET /api/ticker-trades?ticker=NVDA           → every disclosed trade in that stock, both chambers
// GET /api/ticker-trades                       → trending tickers (most disclosed trades recently)
//
// This is the "who in Congress traded X" search that Capitol Trades, Quiver,
// InsiderFinance, and Barchart all offer and CivicWatch didn't — reverse-
// indexes the existing fd_trades / senate_trades tables by ticker instead of
// by member.

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function normalizeType(raw) {
  const t = (raw || '').toString()
  if (t === 'Purchase' || t === 'BUY') return 'BUY'
  if (t === 'Sale' || t === 'SELL') return 'SELL'
  if (t) return t.toUpperCase()
  return 'OTHER'
}

async function fetchTrendingTickers(supabase) {
  // Bounded scan of the most recent trades in each table — cheap enough to
  // run on every request (no ticker index math needed), and gives a "what's
  // hot in Congress right now" view for the empty-search state.
  const [{ data: houseRows }, { data: senRows }] = await Promise.all([
    supabase
      .from('fd_trades')
      .select('ticker, transaction_date')
      .not('ticker', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(400),
    supabase
      .from('senate_trades')
      .select('ticker, transaction_date')
      .not('ticker', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(400),
  ])

  const counts = new Map()
  for (const row of [...(houseRows || []), ...(senRows || [])]) {
    const tk = (row.ticker || '').toUpperCase().trim()
    if (!tk) continue
    counts.set(tk, (counts.get(tk) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([ticker, count]) => ({ ticker, count }))
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ticker = (searchParams.get('ticker') || '').trim().toUpperCase()

  const supabase = getSupabase()

  if (!ticker) {
    try {
      const trending = await fetchTrendingTickers(supabase)
      return NextResponse.json({ trending }, {
        headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300' },
      })
    } catch (err) {
      console.error('ticker-trades trending error:', err.message)
      return NextResponse.json({ trending: [] }, { status: 500 })
    }
  }

  if (!/^[A-Z][A-Z.]{0,5}$/.test(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker format' }, { status: 400 })
  }

  try {
    const [{ data: houseRows, error: houseErr }, { data: senRows, error: senErr }] = await Promise.all([
      supabase
        .from('fd_trades')
        .select('last_name, first_name, bioguide_id, state_dst, transaction_date, asset_name, ticker, transaction_type, amount_str, amount_min, amount_max, doc_id, year')
        .eq('ticker', ticker)
        .order('transaction_date', { ascending: false })
        .limit(100),
      supabase
        .from('senate_trades')
        .select('last_name, first_name, bioguide_id, state, transaction_date, asset_name, ticker, transaction_type, amount_str, amount_min, amount_max, ptr_url')
        .eq('ticker', ticker)
        .order('transaction_date', { ascending: false })
        .limit(100),
    ])

    if (houseErr) throw new Error(houseErr.message)
    if (senErr) throw new Error(senErr.message)

    const houseTrades = (houseRows || []).map(t => ({
      chamber: 'house',
      repName: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      bioguideId: t.bioguide_id || null,
      state: t.state_dst ? t.state_dst.slice(0, 2) : null,
      date: t.transaction_date || '',
      asset: t.asset_name || 'Unknown Asset',
      ticker: t.ticker,
      type: normalizeType(t.transaction_type),
      amount: t.amount_str || 'Undisclosed',
      amountMin: t.amount_min,
      amountMax: t.amount_max,
      docUrl: t.doc_id && t.year
        ? `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${t.year}/${t.doc_id}.pdf`
        : null,
    }))

    const senTrades = (senRows || []).map(t => ({
      chamber: 'senate',
      repName: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
      bioguideId: t.bioguide_id || null,
      state: t.state || null,
      date: t.transaction_date || '',
      asset: t.asset_name || 'Unknown Asset',
      ticker: t.ticker,
      type: normalizeType(t.transaction_type),
      amount: t.amount_str || 'Undisclosed',
      amountMin: t.amount_min,
      amountMax: t.amount_max,
      docUrl: t.ptr_url || null,
    }))

    const merged = [...houseTrades, ...senTrades].sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return b.date.localeCompare(a.date)
    })

    const priced = await enrichTradesWithReturns(merged, { limit: 40 })

    const buys = merged.filter(t => t.type === 'BUY').length
    const sells = merged.filter(t => t.type === 'SELL').length
    const distinctTraders = new Set(merged.map(t => t.bioguideId || t.repName)).size

    return NextResponse.json({
      ticker,
      trades: priced,
      totalCount: merged.length,
      buys,
      sells,
      distinctTraders,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120' },
    })
  } catch (err) {
    console.error('ticker-trades error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch trades for ticker' }, { status: 500 })
  }
}
