import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONGRESS_BASE = 'https://api.congress.gov/v3'

// Returns { byId: { bioguideId -> party }, byName: { "last|first" -> { party, bioguideId } } }
// Uses currentMember=true so we only get the current Congress, not all historical members.
async function fetchMemberPartyPage(offset = 0) {
  const key = process.env.CONGRESS_API_KEY
  if (!key) return { byId: {}, byName: {} }
  try {
    const url = `${CONGRESS_BASE}/member?currentMember=true&limit=250&offset=${offset}&api_key=${key}`
    const res = await fetch(url, { next: { revalidate: 21600 } })
    if (!res.ok) return { byId: {}, byName: {} }
    const json = await res.json()
    const byId = {}
    const byName = {}
    for (const m of json.members || []) {
      const party = m.partyName === 'Democratic' ? 'Democrat' : m.partyName
      if (!party) continue
      if (m.bioguideId) byId[m.bioguideId] = party
      // m.name is "LastName, FirstName [MiddleName]" — build a normalized lookup key
      if (m.name) {
        const comma = m.name.indexOf(',')
        if (comma > 0) {
          const last = m.name.slice(0, comma).trim().toLowerCase()
          const first = m.name.slice(comma + 1).trim().split(/\s+/)[0].toLowerCase()
          if (last && first) byName[`${last}|${first}`] = { party, bioguideId: m.bioguideId || null }
        }
      }
    }
    return { byId, byName }
  } catch {
    return { byId: {}, byName: {} }
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Query fd_filings — bioguide_ids populated via DB backfill (only for reps whose
    // trade page has been visited; many rows will have bioguide_id = null)
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
          _last: (row.last_name || '').toLowerCase(),
          _first: (row.first_name || '').toLowerCase().split(/\s+/)[0],
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

    // Fetch party data from Congress.gov — 3 pages covers all ~535 current members.
    // Without currentMember=true the API returns historical members and the first 500
    // results would mostly be members from past Congresses, not today's.
    const [p0, p1, p2] = await Promise.all([
      fetchMemberPartyPage(0),
      fetchMemberPartyPage(250),
      fetchMemberPartyPage(500),
    ])
    const partyById = { ...p0.byId, ...p1.byId, ...p2.byId }
    const partyByName = { ...p0.byName, ...p1.byName, ...p2.byName }

    // Enrich top-50 with party (and fill in missing bioguide_id via name match).
    // Normalize stored IDs in case DB has mixed case.
    for (const rep of sorted) {
      const id = rep.bioguide_id?.trim().toUpperCase() || null
      if (id) rep.bioguide_id = id

      if (id && partyById[id]) {
        rep.party = partyById[id]
      } else {
        const nameKey = `${rep._last}|${rep._first}`
        const match = partyByName[nameKey]
        if (match) {
          rep.party = match.party
          if (!rep.bioguide_id && match.bioguideId) rep.bioguide_id = match.bioguideId
        }
      }
      delete rep._last
      delete rep._first
    }

    return NextResponse.json(sorted)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
