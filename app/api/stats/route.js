import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const supabase = getSupabase()

    const [filingsRes, tradesRes, repsRes] = await Promise.all([
      supabase.from('fd_filings').select('*', { count: 'exact', head: true }),
      supabase.from('fd_trades').select('*', { count: 'exact', head: true }),
      supabase.from('fd_filings').select('bioguide_id', { count: 'exact', head: true }).not('bioguide_id', 'is', null),
    ])

    return NextResponse.json({
      filings: filingsRes.count ?? 0,
      trades: tradesRes.count ?? 0,
      representatives: repsRes.count ?? 0,
    })
  } catch (e) {
    console.error('Stats route error:', e.message)
    return NextResponse.json({ filings: 0, trades: 0, representatives: 0 }, { status: 500 })
  }
}
