import { NextResponse } from 'next/server'

const BASE = 'https://api.congress.gov/v3'
const KEY = process.env.CONGRESS_API_KEY

// ── helpers ──────────────────────────────────────────────────────────────────
async function cFetch(path) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${KEY}&format=json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Congress API ${res.status}: ${path}`)
  return res.json()
}

// ── GET /api/congress?type=members&state=CA ───────────────────────────────
// ── GET /api/congress?type=votes&bioguideId=P000197 ──────────────────────
// ── GET /api/congress?type=member&bioguideId=P000197 ─────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'members'
    const state = searchParams.get('state') || 'CA'
    const bioguideId = searchParams.get('bioguideId')
    const congress = searchParams.get('congress') || '119'

    if (type === 'members') {
      // Fetch all current members for a state
      const data = await cFetch(`/member?currentMember=true&limit=250`)
     const stateAbbrevToFull = {
  'CA': 'California', 'TX': 'Texas', 'FL': 'Florida',
  'NY': 'New York', 'IL': 'Illinois', 'AZ': 'Arizona',
  'WA': 'Washington', 'CO': 'Colorado', 'GA': 'Georgia',
  'OH': 'Ohio', 'NC': 'North Carolina', 'MI': 'Michigan',
  'PA': 'Pennsylvania', 'TN': 'Tennessee', 'VA': 'Virginia',
  'NV': 'Nevada', 'OR': 'Oregon', 'MN': 'Minnesota',
}
const stateFull = stateAbbrevToFull[state] || state
const stateMembers = (data.members || []).filter(
  m => m.state === state || m.state === stateFull || !state
).slice(0, 20)

      const members = stateMembers.map(m => ({
        bioguideId: m.bioguideId,
        name: `${m.honorificPrefix ? m.honorificPrefix + ' ' : ''}${m.name}`,
        party: m.partyName,
        state: m.state,
        district: m.district ? `District ${m.district}` : 'Statewide',
        chamber: m.terms?.item?.[0]?.chamber || 'Unknown',
        url: m.url,
        depiction: m.depiction?.imageUrl || null,
      }))

      return NextResponse.json({ members, source: 'live' })
    }

    if (type === 'member' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}`)
      const m = data.member
      return NextResponse.json({
        member: {
          bioguideId: m.bioguideId,
          name: m.directOrderName,
          party: m.partyHistory?.[0]?.partyName,
          state: m.state,
          birthYear: m.birthYear,
          officialWebsiteUrl: m.officialWebsiteUrl,
          depiction: m.depiction?.imageUrl || null,
          leadership: m.leadership || [],
          terms: m.terms?.item || [],
        },
        source: 'live'
      })
    }

    if (type === 'votes' && bioguideId) {
      // Recent votes by this member
      const data = await cFetch(
        `/member/${bioguideId}/votes?limit=20`
      )
      const votes = (data.votes || []).map(v => ({
        bill: v.description || v.question,
        vote: v.memberVoted || v.votePosition,
        date: v.date,
        congress: v.congress,
        session: v.session,
        rollNumber: v.rollNumber,
        result: v.result,
        url: v.url,
      }))
      return NextResponse.json({ votes, source: 'live' })
    }

    if (type === 'bills') {
      // Recent bills introduced
      const data = await cFetch(
        `/bill/${congress}?limit=20&sort=updateDate+desc`
      )
      const bills = (data.bills || []).map(b => ({
        number: `${b.type}${b.number}`,
        title: b.title,
        congress: b.congress,
        url: b.url,
        latestAction: b.latestAction?.text,
        latestActionDate: b.latestAction?.actionDate,
        sponsor: b.sponsors?.[0]?.fullName,
        sponsorState: b.sponsors?.[0]?.state,
        sponsorParty: b.sponsors?.[0]?.party,
      }))
      return NextResponse.json({ bills, source: 'live' })
    }

    if (type === 'schedule') {
      // House/Senate floor schedule
      const chamber = searchParams.get('chamber') || 'house'
      const data = await cFetch(
        `/congressional-record?limit=10`
      )
      return NextResponse.json({
        schedule: data.results || [],
        source: 'live'
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (err) {
    console.error('Congress API error:', err.message)
    // Return mock data as fallback so app never breaks
    return NextResponse.json({
      error: err.message,
      source: 'fallback',
      members: getMockMembers(),
    })
  }
}

function getMockMembers() {
  return [
    {
      bioguideId: 'P000197',
      name: 'Nancy Pelosi',
      party: 'Democratic',
      state: 'CA',
      district: 'District 11',
      chamber: 'House of Representatives',
    },
    {
      bioguideId: 'S001168',
      name: 'Adam Schiff',
      party: 'Democratic',
      state: 'CA',
      district: 'Statewide',
      chamber: 'Senate',
    },
  ]
}