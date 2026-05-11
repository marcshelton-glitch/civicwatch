const cache = new Map()

// Normalize the district number from various Census field names
function extractDistrictNum(props) {
  const raw =
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

  // Census TIGER REST endpoints to try in order
  const endpoints = [
    // 118th Congress via tigerWMS_ACS2022 (layer 8 = congressional districts)
    `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2022/MapServer/8/query?where=STATEFP%3D%27${fips}%27&outFields=CD118FP%2CSTATEFP%2CNAMELSAD&returnGeometry=true&geometryPrecision=5&f=geojson`,
    // tigerWMS_Legislative fallback (layer 0)
    `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Legislative/MapServer/0/query?where=STATEFP%3D%27${fips}%27&outFields=*&returnGeometry=true&geometryPrecision=5&f=geojson`,
    // Older ACS layer if newer not available
    `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2021/MapServer/8/query?where=STATEFP%3D%27${fips}%27&outFields=*&returnGeometry=true&geometryPrecision=5&f=geojson`,
  ]

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
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
    } catch {
      // try next endpoint
    }
  }

  return Response.json({ type: 'FeatureCollection', features: [] })
}
