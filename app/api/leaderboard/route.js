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

    // Query fd_filings directly — bioguide_ids are populated via direct DB backfill
    const { data: rows, error: qErr } = await supabase
      .from('fd_filings')
      .select('bioguide_id, last_name, first_name, state_dst, filing_date')
      .eq('filing_type', 'P')

    if (qErr) throw new Error(qErr.message)

    // Aggregate in JS — group by bioguide_id when available, else by last_name|first_name
    const map = new Map()
    for (const row of rows || []) {
      const key = row.bioguide_id || `${row.last_name}|${row.first_name}`
      if (!map.has(key)) {
        map.set(key, {
          bioguide_id: row.bioguide_id || null,
          name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || null,
          state: row.state_dst ? row.state_dst.slice(0, 2) : null,
          party: null,
          filing_count: 0,
          latest_filing: null,
        })
      }
      const entry = map.get(key)
      entry.filing_count++
      if (!entry.bioguide_id && row.bioguide_id) entry.bioguide_id = row.bioguide_id
      if (row.filing_date && (!entry.latest_filing || row.filing_date > entry.latest_filing)) {
        entry.latest_filing = row.filing_date
      }
    }

    const sorted = [...map.values()]
      .sort((a, b) => b.filing_count - a.filing_count)
      .slice(0, 50)

    return NextResponse.json(sorted)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
