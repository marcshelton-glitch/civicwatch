import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONGRESS_BASE = 'https://api.congress.gov/v3'

// Fetch one page of members from Congress.gov and return { bioguideId -> partyName }
async function fetchMemberPartyPage(offset = 0) {
  const key = process.env.CONGRESS_API_KEY
  if (!key) return {}
  try {
    const url = `${CONGRESS_BASE}/member?limit=250&offset=${offset}&api_key=${key}`
    const res = await fetch(url, { next: { revalidate: 21600 } })
    if (!res.ok) return {}
    const json = await res.json()
    const map = {}
    for (const m of json.members || []) {
      if (m.bioguideId && m.partyName) {
        // Normalize "Democratic" → "Democrat" to match the rest of the app
        map[m.bioguideId] = m.partyName === 'Democratic' ? 'Democrat' : m.partyName
      }
    }
    return map
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Query fd_filings — bioguide_ids populated via DB backfill
    const { data: rows, error: qErr } = await supabase
      .from('fd_filings')
      .select('bioguide_id, last_name, first_name, state_dst, filing_date')
      .eq('filing_type', 'P')

    if (qErr) throw new Error(qErr.message)

    // Aggregate by bioguide_id when available, else by last_name|first_name
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

    // Fetch party data from Congress.gov — two pages covers all 535 members
    const [page0, page1] = await Promise.all([
      fetchMemberPartyPage(0),
      fetchMemberPartyPage(250),
    ])
    const partyLookup = { ...page0, ...page1 }

    // Enrich top-50 with party
    for (const rep of sorted) {
      if (rep.bioguide_id && partyLookup[rep.bioguide_id]) {
        rep.party = partyLookup[rep.bioguide_id]
      }
    }

    return NextResponse.json(sorted)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
