import { NextResponse } from 'next/server'

const STATE_FIPS = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',DC:'11',
  FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',
  LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',MO:'29',MT:'30',
  NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',NC:'37',ND:'38',OH:'39',
  OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',
  VT:'50',VA:'51',WA:'53',WV:'54',WI:'55',WY:'56',
}

const TIGER_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0/query'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const state = (searchParams.get('state') || '').toUpperCase()
  const fips = STATE_FIPS[state]

  if (!fips) {
    return NextResponse.json({ error: 'Invalid or unsupported state abbreviation' }, { status: 400 })
  }

  const params = new URLSearchParams({
    where: `STATE='${fips}'`,
    outFields: 'GEOID,CD119,STATE,BASENAME,NAME',
    outSR: '4326',
    returnGeometry: 'true',
    f: 'geojson',
  })

  try {
    const res = await fetch(`${TIGER_URL}?${params}`, {
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': 'CivicWatch/1.0' },
    })
    if (!res.ok) {
      console.error(`[district-boundaries] TIGER API responded ${res.status} for state=${state}`)
      return NextResponse.json({ error: `Census API error ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    if (!data.features || !Array.isArray(data.features)) {
      console.error('[district-boundaries] Unexpected response shape:', JSON.stringify(data).slice(0, 300))
      return NextResponse.json({ error: 'Unexpected response from Census API' }, { status: 502 })
    }
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[district-boundaries] Fetch error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
