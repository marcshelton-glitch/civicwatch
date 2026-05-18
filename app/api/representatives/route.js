import { NextResponse } from 'next/server'

// Looks up representatives by zip code using Google Civic API
// Falls back to Congress.gov by state if needed
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip')
  const state = searchParams.get('state') || 'CA'

  try {
    // Fetch members from Congress.gov for this state
    const KEY = process.env.CONGRESS_API_KEY
    const url = `https://api.congress.gov/v3/member?currentMember=true&limit=50&api_key=${KEY}&format=json`
    
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()

    // Filter by state
    const stateMap = {
      'CA': 'California', 'TX': 'Texas', 'FL': 'Florida',
      'NY': 'New York', 'IL': 'Illinois', 'AZ': 'Arizona',
      'WA': 'Washington', 'CO': 'Colorado', 'GA': 'Georgia',
      'OH': 'Ohio', 'NC': 'North Carolina', 'MI': 'Michigan',
      'PA': 'Pennsylvania', 'TN': 'Tennessee', 'VA': 'Virginia',
    }

    const members = (data.members || [])
      .filter(m => m.state === (stateMap[state] || state))
      .slice(0, 10)
      .map(m => ({
        bioguideId: m.bioguideId,
        name: m.name,
        party: m.partyName,
        state: m.state,
        stateFull: stateMap[m.state] || m.state,
        district: m.district ? `${stateMap[m.state] || m.state}-${m.district}` : 'Statewide',
        chamber: m.terms?.item?.[0]?.chamber || 'Unknown',
        title: m.terms?.item?.[0]?.chamber === 'Senate' 
          ? 'U.S. Senator' 
          : 'U.S. Representative',
        website: m.url,
        photo: `/api/rep-photo/${m.bioguideId}`,
      }))

    return NextResponse.json({ 
      members,
      state,
      stateFull: stateMap[state] || state,
      total: members.length,
      source: 'live'
    })

  } catch (err) {
    console.error('Representatives lookup error:', err)
    return NextResponse.json({ 
      error: err.message,
      members: [],
      source: 'error'
    }, { status: 500 })
  }
}