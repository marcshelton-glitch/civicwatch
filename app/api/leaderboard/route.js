import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function enrichWithBioguideIds(entries) {
  const KEY = process.env.CONGRESS_API_KEY
  if (!KEY) return entries

  // Group by state code to minimize API calls
  const byState = new Map()
  for (const entry of entries) {
    if (!entry.state) continue
    if (!byState.has(entry.state)) byState.set(entry.state, [])
    byState.get(entry.state).push(entry)
  }

  for (const [stateCode, stateEntries] of byState) {
    try {
      const url = `https://api.congress.gov/v3/member?stateCode=${stateCode}&limit=250&api_key=${KEY}`
      const res = await fetch(url)
      if (!res.ok) continue
      const json = await res.json()
      const members = json.members || []

      // Build lookup: lowercase last name → member info
      const lookup = new Map()
      for (const member of members) {
        const lastName = member.name.split(',')[0].trim().toLowerCase()
        lookup.set(lastName, member)
      }

      for (const entry of stateEntries) {
        if (entry.bioguide_id || !entry.last_name) continue
        const member = lookup.get(entry.last_name.toLowerCase())
        if (member) {
          entry.bioguide_id = member.bioguideId
          entry.party = member.partyName || member.party || null
        }
      }
    } catch {
      // Skip state on error — leaderboard still returns without bioguide enrichment
    }
  }

  return entries
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
      const { data: rows, error: qErr } = await supabase
        .from('fd_filings')
        .select('bioguide_id, last_name, first_name, state_dst, filing_date')
        .eq('filing_type', 'P')

      if (qErr) throw new Error(qErr.message)

      const map = new Map()
      for (const row of rows || []) {
        const key = `${row.last_name}|${row.first_name}`
        if (!map.has(key)) {
          map.set(key, {
            bioguide_id: row.bioguide_id || null,
            last_name: row.last_name || null,
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

      let sorted = [...map.values()]
        .sort((a, b) => b.filing_count - a.filing_count)
        .slice(0, 50)

      sorted = await enrichWithBioguideIds(sorted)

      // Strip internal last_name field before returning
      for (const entry of sorted) delete entry.last_name

      return NextResponse.json(sorted)
    }

    // RPC path: enrich in case the stored proc returns null bioguide_ids
    const enriched = await enrichWithBioguideIds(data)
    return NextResponse.json(enriched)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
