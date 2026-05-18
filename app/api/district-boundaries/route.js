const cache = new Map()

// Normalize the district number from various Census field names.
// CD119 is the current 119th Congress field on the working TIGER endpoint.
function extractDistrictNum(props) {
  const raw =
    props.CD119 ??
    props.CD118FP ??
    props.CD116FP ??
    props.CD115FP ??
    props.CDFP ??
    props.DISTRICT ??
    props.CD ??
    '00'
  return String(raw).padStart(2, '0')
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fips = String(searchParams.get('fips') ?? '').padStart(2, '0')

  if (!fips || fips === '00') {
    return Response.json({ error: 'fips required' }, { status: 400 })
  }

  if (cache.has(fips)) {
    return Response.json(cache.get(fips))
  }

  // Census TIGER REST endpoints to try in order.
  // The working service is TIGERweb/Legislative layer 0 (119th Congress).
  // It uses the STATE field (not STATEFP) and CD119 for district number.
  // The tigerWMS_* URLs are stale and return 400 or empty results.
  const endpoints = [
    // 119th Congress — the current working endpoint
    `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0/query?where=STATE%3D%27${fips}%27&outFields=GEOID%2CCD119%2CSTATE%2CBASENAME%2CNAME&outSR=4326&returnGeometry=true&geometryPrecision=5&f=geojson`,
    // Alternate layer 4 (also labeled 119th Congress in the service index)
    `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/4/query?where=STATE%3D%27${fips}%27&outFields=GEOID%2CCD119%2CSTATE%2CBASENAME%2CNAME&outSR=4326&returnGeometry=true&geometryPrecision=5&f=geojson`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'CivicWatch/1.0' },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (!data.features || data.features.length === 0) continue

      // Normalize to a consistent districtNum property
      const normalized = {
        ...data,
        features: data.features.map(f => ({
          ...f,
          properties: {
            ...f.properties,
            districtNum: extractDistrictNum(f.properties),
          },
        })),
      }
      cache.set(fips, normalized)
      return Response.json(normalized)
    } catch (err) {
      console.error('[district-boundaries] endpoint failed:', err.message)
    }
  }

  console.error(`[district-boundaries] all endpoints failed for fips=${fips}`)
  return Response.json({ error: 'District boundary data unavailable', type: 'FeatureCollection', features: [] }, { status: 503 })
}
