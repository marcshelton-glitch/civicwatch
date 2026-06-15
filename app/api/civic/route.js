import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// ── IP-based rate limiter ─────────────────────────────────────────────────────
const civicRateMap = new Map()
const CIVIC_WINDOW_MS = 60_000
const CIVIC_MAX_CALLS = 20

function cleanupCivicRateMap() {
  const now = Date.now()
  for (const [key, entry] of civicRateMap.entries()) {
    if (now - entry.windowStart > CIVIC_WINDOW_MS * 2) civicRateMap.delete(key)
  }
}
setInterval(cleanupCivicRateMap, 5 * 60_000)

function isCivicRateLimited(ip) {
  const now = Date.now()
  const entry = civicRateMap.get(ip) || { count: 0, windowStart: now }
  if (now - entry.windowStart > CIVIC_WINDOW_MS) {
    civicRateMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= CIVIC_MAX_CALLS) return true
  entry.count++
  civicRateMap.set(ip, entry)
  return false
}

const OPENSTATES_API_KEY = process.env.OPENSTATES_API_KEY
const CICERO_API_KEY     = process.env.CICERO_API_KEY   // get free key at cicerodata.com (2,500 req/mo)

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

// ── Geocoding ─────────────────────────────────────────────────────────────────
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
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), normalized: data[0].display_name }
}

async function geocodeAddress(address) {
  const census = await geocodeWithCensus(address).catch(() => null)
  if (census) return census
  const nominatim = await geocodeWithNominatim(address).catch(() => null)
  if (nominatim) return nominatim
  throw new Error('Address not found — try a full address, city + state, or ZIP code')
}

// ── Census Geographies — city, county, school district ───────────────────────
async function getCensusGeographies(lat, lng) {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Incorporated+Places,Counties,Unified+School+Districts,States&format=json`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    const geos = data?.result?.geographies || {}

    const rawCity = geos['Incorporated Places']?.[0]?.NAME || null
    const city    = rawCity ? rawCity.replace(/ (city|town|village|borough|municipality)$/i, '').trim() : null
    const county  = geos['Counties']?.[0]?.NAME || null
    const school  = geos['Unified School Districts']?.[0]?.NAME || null
    const state   = geos['States']?.[0]?.NAME || null

    return { city, county, schoolDistrict: school, state }
  } catch { return null }
}

// ── Cicero API — local officials (mayor, council, county board, school board) ─
// district_type values: LOCAL, COUNTY, SCHOOL, SPECIAL, STATE_*, NATIONAL_*
const CICERO_LOCAL_TYPES = new Set(['LOCAL', 'COUNTY', 'SCHOOL', 'SPECIAL'])

async function getCiceroOfficials(address) {
  if (!CICERO_API_KEY) return []
  try {
    const url = `https://cicero.azavea.com/v3.1/official/?search_loc=${encodeURIComponent(address)}&format=json&key=${CICERO_API_KEY}`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
    })
    if (!res.ok) return []
    const data = await res.json()

    const officials = data?.response?.results?.candidates?.[0]?.officials || []

    return officials
      .filter(o => {
        const distType = (o.office?.district?.district_type || '').toUpperCase()
        const govType  = (o.office?.chamber?.government?.type || '').toUpperCase()
        return CICERO_LOCAL_TYPES.has(distType) || CICERO_LOCAL_TYPES.has(govType)
      })
      .map(o => {
        const distType  = (o.office?.district?.district_type || '').toUpperCase()
        const govType   = (o.office?.chamber?.government?.type || '').toUpperCase()
        const levelRaw  = distType || govType
        const levelLabel = levelRaw.includes('COUNTY') ? 'county'
          : levelRaw.includes('SCHOOL') ? 'school'
          : levelRaw.includes('SPECIAL') ? 'district'
          : 'local'

        const firstName = o.first_name || ''
        const lastName  = o.last_name  || ''
        const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown'

        // Addresses come as an array
        const addrs = o.addresses || []
        const phone   = addrs.find(a => a.phone)?.phone || ''
        const email   = addrs.find(a => a.email)?.email || ''
        const website = addrs.find(a => a.url)?.url || ''
        const addrStr = (() => {
          const a = addrs.find(a => a.city) || {}
          return [a.address_1, a.city, a.state].filter(Boolean).join(', ')
        })()

        const district  = o.office?.district
        const distLabel = district?.city
          ? `${district.city}${district.label ? ', ' + district.label : ''}`
          : district?.label || ''

        return {
          id:           `cicero-${o.sk || o.id || name}`,
          name,
          title:        o.office?.title || 'Local Official',
          party:        normalizeParty(o.party || ''),
          level:        levelLabel,
          district:     distLabel,
          state:        (o.office?.representing_state || district?.state || '').toUpperCase(),
          photo:        o.photo_url || null,
          phone,
          email,
          website,
          officeLocation: addrStr,
          officeHours:  '',
          bio:          `${name} serves as ${o.office?.title || 'local official'}${distLabel ? ' for ' + distLabel : ''}.`,
          trades: [], votes: [], docket: [], townHall: [],
          peers: [], peerComparison: {},
          netWorthBefore: null, netWorthCurrent: null, yearsInOffice: null,
          communityPoll: { housing: 0, transit: 0, safety: 0, education: 0 },
          isLive: true,
          source: 'cicero',
        }
      })
  } catch { return [] }
}

// ── OpenStates — state legislators ───────────────────────────────────────────
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

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous'
  if (isCivicRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) return NextResponse.json({ error: 'address is required' }, { status: 400 })

  try {
    const { lat, lng, normalized } = await geocodeAddress(address)

    // Run all lookups in parallel — Cicero uses original address, others use lat/lng
    const [stateData, ciceroOfficials, geoInfo] = await Promise.all([
      getStateReps(lat, lng).catch(() => ({ results: [] })),
      getCiceroOfficials(address),
      getCensusGeographies(lat, lng),
    ])

    // State legislators (OpenStates)
    const stateOnly = (stateData.results || []).filter(person => {
      const jid = person.jurisdiction?.id || person.current_role?.jurisdiction_id || ''
      return jid.includes('/state:')
    })

    const stateOfficials = stateOnly.map(person => {
      const isSenator = (person.current_role?.title || '').toLowerCase().includes('senator')
      const office = (person.offices || [])[0]
      const link = (person.links || [])[0]?.url || ''
      return {
        id:           `os-${person.id}`,
        name:         person.name,
        title:        person.current_role?.title || (isSenator ? 'State Senator' : 'State Representative'),
        party:        normalizeParty(person.party),
        level:        'state',
        district:     person.current_role?.district
          ? `${person.current_role.org_classification === 'upper' ? 'Senate' : 'House'} District ${person.current_role.district}`
          : person.current_role?.title || '',
        state:        ((person.current_role?.jurisdiction_id || person.jurisdiction?.id || '')
          .match(/\/state:([a-z]{2})\//)?.[1] || '').toUpperCase(),
        photo:        person.image || null,
        phone:        office?.voice || '',
        email:        '',
        website:      link || `https://openstates.org/people/${person.id}/`,
        officeLocation: office ? [office.address, office.city, office.state].filter(Boolean).join(', ') : '',
        officeHours:  '',
        bio:          `${person.name} serves as ${person.current_role?.title || 'state legislator'} in ${(person.current_role?.state || '').toUpperCase() || 'the state legislature'}.`,
        trades: [], votes: [], docket: [], townHall: [],
        peers: [], peerComparison: {},
        netWorthBefore: null, netWorthCurrent: null, yearsInOffice: null,
        communityPoll: { housing: 0, transit: 0, safety: 0, education: 0 },
        isLive: true,
        source: 'openstates',
      }
    })

    return NextResponse.json({
      officials:        [...stateOfficials, ...ciceroOfficials],
      normalizedAddress: normalized,
      // Municipality info for fallback cards when Cicero has no data
      municipality: geoInfo,
      hasCiceroData: ciceroOfficials.length > 0,
    }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } })
  } catch (e) {
    console.error('Civic API error:', e.message)
    return NextResponse.json({ error: 'Could not look up address. Please try again.' }, { status: 500 })
  }
}
