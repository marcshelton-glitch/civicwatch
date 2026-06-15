export const revalidate = 300

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const supabase = getSupabase()

    const [filingsRes, houseTradesRes, senateTradesRes] = await Promise.all([
      supabase.from('fd_filings').select('*', { count: 'exact', head: true }),
      supabase.from('fd_trades').select('*', { count: 'exact', head: true }),
      supabase.from('senate_trades').select('*', { count: 'exact', head: true }),
    ])

    const filings = filingsRes.count ?? 0
    const trades = (houseTradesRes.count ?? 0) + (senateTradesRes.count ?? 0)

    return NextResponse.json({
      filings,
      trades,
      representatives: 535,
      updated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch (e) {
    console.error('Stats route error:', e.message)
    return NextResponse.json({ filings: 0, trades: 0, representatives: 535 }, { status: 500 })
  }
}
