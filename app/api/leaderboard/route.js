import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 21600

// Hardcoded party fallback for top traders — used when Congress.gov API is unavailable or
// the member doesn't appear in bulk pages (e.g. CONGRESS_API_KEY not set in Vercel).
const PARTY_SEED = {
  L000579: 'Democrat',   // Lowenthal
  D000620: 'Democrat',   // Delaney
  G000563: 'Republican', // Gibbs
  M001157: 'Republican', // McCaul
  P000197: 'Democrat',   // Pelosi
  S001150: 'Democrat',   // Schiff
  W000187: 'Democrat',   // Waters
  K000389: 'Democrat',   // Khanna
  C001092: 'Republican', // Collins
  B001273: 'Republican', // Diane Black
  F000372: 'Republican', // Frelinghuysen
  B000574: 'Democrat',   // Blumenauer
  F000461: 'Republican', // Bill Flores
  M001158: 'Republican', // Kenny Marchant
  G000584: 'Republican', // Greg Gianforte
}

// Members who have left Congress — always mark is_former regardless of API result.
const FORMER_MEMBERS = new Set(['L000579', 'D000620', 'G000563', 'B001273', 'F000372', 'B000574', 'F000461', 'M001158', 'G000584'])

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONGRESS_BASE = 'https://api.congress.gov/v3'

function parseMemberPage(json) {
  const byId = {}
  const byName = {}
  for (const m of json.members || []) {
    const party = m.partyName === 'Democratic' ? 'Democrat' : m.partyName
    if (!party) continue
    if (m.bioguideId) byId[m.bioguideId] = party
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
}

async function fetchMemberPartyPage(offset, currentOnly) {
  const key = process.env.CONGRESS_API_KEY
  if (!key) return { byId: {}, byName: {} }
  try {
    const currentParam = currentOnly ? '&currentMember=true' : ''
    const url = `${CONGRESS_BASE}/member?format=json&limit=250&offset=${offset}${currentParam}&api_key=${key}`
    const res = await fetch(url, { next: { revalidate: 21600 } })
    if (!res.ok) return { byId: {}, byName: {} }
    return parseMemberPage(await res.json())
  } catch {
    return { byId: {}, byName: {} }
  }
}

// Fetch a single member record — returns party and currentMember status.
async function fetchMemberById(bioguideId) {
  const key = process.env.CONGRESS_API_KEY
  if (!key || !bioguideId) return null
  try {
    const url = `${CONGRESS_BASE}/member/${bioguideId}?format=json&api_key=${key}`
    const res = await fetch(url, { next: { revalidate: 21600 } })
    if (!res.ok) return null
    const json = await res.json()
    const m = json.member
    if (!m) return null
    return {
      party: m.partyName === 'Democratic' ? 'Democrat' : m.partyName || null,
      isCurrent: m.currentMember === true,
    }
  } catch {
    return null
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
          is_former: null,
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

    // Pass 1: current members — 3 pages × 250 covers all ~535 current members.
    const [p0, p1, p2] = await Promise.all([
      fetchMemberPartyPage(0, true),
      fetchMemberPartyPage(250, true),
      fetchMemberPartyPage(500, true),
    ])
    const partyById = { ...p0.byId, ...p1.byId, ...p2.byId }
    const partyByName = { ...p0.byName, ...p1.byName, ...p2.byName }

    for (const rep of sorted) {
      const id = rep.bioguide_id?.trim().toUpperCase() || null
      if (id) rep.bioguide_id = id

      if (id && partyById[id]) {
        rep.party = partyById[id]
        rep.is_former = false
      } else {
        const nameKey = `${rep._last}|${rep._first}`
        const match = partyByName[nameKey]
        if (match) {
          rep.party = match.party
          rep.is_former = false
          if (!rep.bioguide_id && match.bioguideId) rep.bioguide_id = match.bioguideId
        }
      }
    }

    // Pass 2: individual bioguide lookup for reps still missing party.
    // Also tells us definitively if they're former (currentMember: false).
    const needsIndividual = sorted.filter(r => !r.party && r.bioguide_id)
    if (needsIndividual.length > 0) {
      const results = await Promise.all(needsIndividual.map(r => fetchMemberById(r.bioguide_id)))
      for (let i = 0; i < needsIndividual.length; i++) {
        const rep = needsIndividual[i]
        const result = results[i]
        if (result) {
          if (result.party) rep.party = result.party
          rep.is_former = !result.isCurrent
        }
      }
    }

    // Pass 3: bulk historical lookup for reps with no bioguide_id and no party.
    // One page of 250 without currentMember=true catches recently retired members.
    const needsHistorical = sorted.filter(r => !r.party && !r.bioguide_id)
    if (needsHistorical.length > 0) {
      const hist = await fetchMemberPartyPage(0, false)
      for (const rep of needsHistorical) {
        const nameKey = `${rep._last}|${rep._first}`
        const match = hist.byName[nameKey]
        if (match) {
          rep.party = match.party
          if (!rep.bioguide_id && match.bioguideId) rep.bioguide_id = match.bioguideId
          // Only mark former if they were absent from the current-member bulk lookup.
          // We can't confirm from the bulk historical list (no per-member currentMember flag),
          // so leave is_former as null → resolved to false below (conservative).
        }
      }
    }

    for (const rep of sorted) {
      const id = rep.bioguide_id
      if (id && !rep.party && PARTY_SEED[id]) rep.party = PARTY_SEED[id]
      if (id && FORMER_MEMBERS.has(id)) rep.is_former = true
      if (rep.is_former === null) rep.is_former = false
      delete rep._last
      delete rep._first
    }

    return NextResponse.json(sorted)
  } catch (err) {
    console.error('Leaderboard error:', err.message)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
