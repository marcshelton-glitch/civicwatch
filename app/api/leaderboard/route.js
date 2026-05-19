import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Enrich leaderboard entries with bioguide_id + party from the representatives table,
// matching on state + last name (case-insensitive).
async function enrichFromRepresentatives(supabase, entries) {
  if (!entries || entries.length === 0) return entries

  const { data: repsData } = await supabase
    .from('representatives')
    .select('bioguide_id, name, state, party')

  if (!repsData || repsData.length === 0) return entries

  // Build lookup: "STATE|lastname" -> rep row
  // representatives.name may be "First Last" or "Last, First" — index every token > 2 chars
  const byKey = new Map()
  for (const r of repsData) {
    const state = (r.state || '').toUpperCase()
    const tokens = (r.name || '').split(/[\s,]+/).filter(p => p.length > 2)
    for (const token of tokens) {
      const key = `${state}|${token.toLowerCase()}`
      if (!byKey.has(key)) byKey.set(key, r)
    }
  }

  return entries.map(e => {
    if (e.bioguide_id && e.party) return e
    // Extract last name from "First Last" format
    const lastName = (e.name || '').split(/\s+/).filter(Boolean).pop() || ''
    const key = `${(e.state || '').toUpperCase()}|${lastName.toLowerCase()}`
    const match = byKey.get(key)
    if (!match) return e
    return {
      ...e,
      bioguide_id: e.bioguide_id || match.bioguide_id || null,
      party: e.party || match.party || null,
    }
  })
}

export async function GET() {
  try {
    const supabase = getSupabase()

    let data = null
    try {
      const result = await supabase.rpc('leaderboard_top50')
      if (!result.error) data = result.data
    } catch {
      // rpc unavailable, fall through to fallback query
    }

    if (!data) {
      // Fallback: raw query via select
      // fd_filings has: bioguide_id, last_name, first_name, state_dst, filing_type, filing_date, etc.
      const { data: rows, error: qErr } = await supabase
        .from('fd_filings')
        .select('bioguide_id, last_name, first_name, state_dst, filing_date')
        .eq('filing_type', 'P')

      if (qErr) throw new Error(qErr.message)

      // Aggregate in JS — group by last_name|first_name (bioguide_id is usually null here)
      const map = new Map()
      for (const row of rows || []) {
        const key = `${row.last_name}|${row.first_name}`
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

      const enriched = await enrichFromRepresentatives(supabase, sorted)
      return NextResponse.json(enriched)
    }

    // RPC path: also enrich in case the stored proc returns null bioguide_ids
    const enriched = await enrichFromRepresentatives(supabase, data)
    return NextResponse.json(enriched)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
