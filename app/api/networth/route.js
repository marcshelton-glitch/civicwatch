import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/networth?bioguideId=P000197
export async function GET(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const bioguideId = (searchParams.get('bioguideId') || '').trim().toUpperCase()

  if (!bioguideId) return NextResponse.json({ error: 'bioguideId required' }, { status: 400 })

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('fd_net_worth')
      .select('report_year, net_worth_min, net_worth_max, filing_date')
      .eq('bioguide_id', bioguideId)
      .order('report_year', { ascending: true })

    if (error) {
      console.error('networth GET error:', error.message)
      return NextResponse.json({ history: [] })
    }

    const history = (data || [])
      .filter(row => row.net_worth_min != null)
      .map(row => ({
        year: row.report_year,
        min_value: row.net_worth_min,
        max_value: row.net_worth_max ?? row.net_worth_min,
        filing_date: row.filing_date,
      }))

    return NextResponse.json({ history })
  } catch (err) {
    console.error('networth GET error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch net worth data', history: [] }, { status: 500 })
  }
}
