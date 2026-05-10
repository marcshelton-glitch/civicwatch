import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.rpc('leaderboard_top50').catch(() => ({ data: null, error: 'rpc_unavailable' }))

    if (!data) {
      // Fallback: raw query via select
      const { data: rows, error: qErr } = await supabase
        .from('fd_filings')
        .select('bioguide_id, member_name, state, party, id, filing_date')
        .eq('type', 'P')
        .not('bioguide_id', 'is', null)

      if (qErr) throw new Error(qErr.message)

      // Aggregate in JS since Supabase JS client doesn't support GROUP BY directly
      const map = new Map()
      for (const row of rows || []) {
        const key = row.bioguide_id
        if (!map.has(key)) {
          map.set(key, {
            bioguide_id: key,
            name: row.member_name,
            state: row.state,
            party: row.party,
            filing_count: 0,
            latest_filing: null,
          })
        }
        const entry = map.get(key)
        entry.filing_count++
        if (!entry.name && row.member_name) entry.name = row.member_name
        if (!entry.state && row.state) entry.state = row.state
        if (!entry.party && row.party) entry.party = row.party
        if (row.filing_date && (!entry.latest_filing || row.filing_date > entry.latest_filing)) {
          entry.latest_filing = row.filing_date
        }
      }

      const sorted = [...map.values()]
        .sort((a, b) => b.filing_count - a.filing_count)
        .slice(0, 50)

      return NextResponse.json(sorted)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
