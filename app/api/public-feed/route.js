import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 300 // 5-minute edge cache

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  const supabase = getSupabase()

  const [tradesRes, wealthRes] = await Promise.all([
    // 20 most recent House + Senate trades
    Promise.all([
      supabase
        .from('fd_trades')
        .select('representative, ticker, asset_description, transaction_type, amount, transaction_date, chamber')
        .not('ticker', 'is', null)
        .not('transaction_date', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(10),
      supabase
        .from('senate_trades')
        .select('first_name, last_name, ticker, asset_description, transaction_type, amount, transaction_date')
        .not('ticker', 'is', null)
        .not('transaction_date', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(10),
    ]),
    // Top 10 members by net worth
    supabase
      .from('fd_net_worth')
      .select('name, net_worth_min, net_worth_max, year')
      .order('net_worth_min', { ascending: false })
      .limit(10),
  ])

  const [houseTrades, senateTrades] = tradesRes
  const { data: topWealth } = wealthRes

  const houseFeed = (houseTrades.data || []).map(t => ({
    name: t.representative,
    ticker: t.ticker,
    asset: t.asset_description,
    type: t.transaction_type,
    amount: t.amount,
    date: t.transaction_date,
    chamber: t.chamber || 'house',
  }))

  const senateFeed = (senateTrades.data || []).map(t => ({
    name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
    ticker: t.ticker,
    asset: t.asset_description,
    type: t.transaction_type,
    amount: t.amount,
    date: t.transaction_date,
    chamber: 'senate',
  }))

  // Merge and sort by date descending, take top 20
  const allTrades = [...houseFeed, ...senateFeed]
    .filter(t => t.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)

  return NextResponse.json({
    trades: allTrades,
    topWealth: topWealth || [],
  })
}
