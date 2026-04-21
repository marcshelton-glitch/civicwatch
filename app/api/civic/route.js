import { NextResponse } from 'next/server'

const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY

function normalizeParty(raw = '') {
  const p = raw.toLowerCase()
  if (p.includes('democrat')) return 'Democrat'
  if (p.includes('republican')) return 'Republican'
  if (p.includes('independent')) return 'Independent'
  if (p.includes('nonpartisan') || p.includes('non-partisan')) return 'Nonpartisan'
  if (p.includes('green')) return 'Green'
  if (p.includes('libertarian')) return 'Libertarian'
  return raw || 'Unknown'
}

async function geocodeWithCensus(address) {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) return null
  const data = await res.json()
  const match = data?.result?.addressMatches?.[0]
  if (!match) return null
  return { lat: match.coordinates.y, lng: match.coordinates.x, normalized: match.matchedAddress }
}

async function geocodeWithNominatim(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&countrycodes=us&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data?.[0]) return null
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    normalized: data[0].display_name,
  }
}

async function geocodeAddress(address) {
  // Try Census first (most accurate for full street addresses)
  const census = await geocodeWithCensus(address).catch(() => null)
  if (census) return census

  // Fall back to Nominatim (handles ZIP codes, city names, partial addresses)
  const nominatim = await geocodeWithNominatim(address).catch(() => null)
  if (nominatim) return nominatim

  throw new Error('Address not found — try a full address, city + state, or ZIP code')
}

async function getStateReps(lat, lng) {
  if (!OPENSTATES_API_KEY) throw new Error('OPENSTATES_API_KEY not configured')
  const url = `https://v3.openstates.org/people.geo?lat=${lat}&lng=${lng}&include=links&include=offices&apikey=${OPENSTATES_API_KEY}`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || `OpenStates API error ${res.status}`)
  }
  return res.json()
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }

  try {
    // Step 1: Geocode the address using US Census (free, no key needed)
    const { lat, lng, normalized } = await geocodeAddress(address)

    // Step 2: Fetch state legislators from OpenStates
    const data = await getStateReps(lat, lng)

    const officials = (data.results || []).map(person => {
      const isSenator = (person.current_role?.title || '').toLowerCase().includes('senator')
      const office = (person.offices || [])[0]
      const link = (person.links || [])[0]?.url || ''

      return {
        id: `os-${person.id}`,
        name: person.name,
        title: person.current_role?.title || (isSenator ? 'State Senator' : 'State Representative'),
        party: normalizeParty(person.party),
        level: 'state',
        district: person.current_role?.district
          ? `${person.current_role.org_classification === 'upper' ? 'Senate' : 'House'} District ${person.current_role.district}`
          : person.current_role?.title || '',
        state: person.current_role?.state?.toUpperCase() || '',
        photo: person.image || null,
        phone: office?.voice || '',
        email: '',
        website: link || `https://openstates.org/people/${person.id}/`,
        officeLocation: office ? [office.address, office.city, office.state].filter(Boolean).join(', ') : '',
        officeHours: '',
        bio: `${person.name} serves as ${person.current_role?.title || 'state legislator'} in ${person.current_role?.state?.toUpperCase() || 'the state legislature'}.`,
        trades: [], votes: [], docket: [], townHall: [],
        peers: [], peerComparison: {},
        netWorthBefore: null, netWorthCurrent: null, yearsInOffice: null,
        communityPoll: { housing: 0, transit: 0, safety: 0, education: 0 },
        isLive: true,
        source: 'openstates',
      }
    })

    return NextResponse.json({ officials, normalizedAddress: normalized })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
