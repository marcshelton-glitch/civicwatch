import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /api/networth?bioguideId=P000197
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const bioguideId = (searchParams.get('bioguideId') || '').trim().toUpperCase()

  if (!bioguideId) return NextResponse.json({ error: 'bioguideId required' }, { status: 400 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('fd_net_worth')
    .select('year, min_value, max_value, filing_date')
    .eq('bioguide_id', bioguideId)
    .order('year', { ascending: true })

  if (error) {
    console.error('networth GET error:', error.message)
    return NextResponse.json({ history: [] })
  }

  return NextResponse.json({ history: data || [] })
}
