import { NextResponse } from 'next/server'

const PP_BASE = 'https://projects.propublica.org/nonprofits/api/v2'

const NTEE_LABELS = {
  A: 'Arts & Culture', B: 'Education', C: 'Environment', D: 'Animal-Related',
  E: 'Health', F: 'Mental Health', G: 'Disease & Disorders', H: 'Medical Research',
  I: 'Crime & Legal', J: 'Employment', K: 'Food & Agriculture', L: 'Housing',
  M: 'Public Safety', N: 'Recreation & Sports', O: 'Youth Development',
  P: 'Human Services', Q: 'International', R: 'Civil Rights', S: 'Community Improvement',
  T: 'Philanthropy', U: 'Science & Technology', V: 'Social Science', W: 'Public Affairs',
  X: 'Religion', Y: 'Mutual Benefit', Z: 'Unknown',
}

function nteeLabel(code) {
  if (!code) return null
  return NTEE_LABELS[code.charAt(0).toUpperCase()] || null
}

function formatRevenue(n) {
  if (!n || n === 0) return null
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

async function ppSearch(q, state) {
  const url = state
    ? `${PP_BASE}/search.json?q=${encodeURIComponent(q)}&state[id]=${state}&per_page=25`
    : `${PP_BASE}/search.json?q=${encodeURIComponent(q)}&per_page=25`
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.organizations || []
}

async function ppRevenue(ein) {
  try {
    const res = await fetch(`${PP_BASE}/organizations/${ein}.json`, {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
    })
    if (!res.ok) return null
    const data = await res.json()
    // Most recent filing's totrevenue field
    const filing = data.filings_with_data?.[0] || data.filings_without_data?.[0]
    return filing?.totrevenue || filing?.totfuncexpns || null
  } catch { return null }
}

export async function GET(request) {

  const { searchParams } = new URL(request.url)
  const name  = (searchParams.get('name')  || '').trim()
  const state = (searchParams.get('state') || '').trim().toUpperCase()

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // Parse name — Congress.gov uses "Last, First" format
  const nameParts = name.includes(',')
    ? name.split(',').map(s => s.trim())
    : name.trim().split(/\s+/)
  const lastName = (name.includes(',') ? nameParts[0] : nameParts[nameParts.length - 1])
    .replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '').trim()
  const firstName = (name.includes(',') ? nameParts[1]?.split(/\s+/)[0] : nameParts[0]) || ''

  try {
    // Two searches in parallel: full name (personal foundations) + last name in state
    const [fullResults, lastResults] = await Promise.all([
      ppSearch(`${firstName} ${lastName}`.trim(), state).catch(() => []),
      ppSearch(lastName, state).catch(() => []),
    ])

    // Merge and deduplicate by EIN, preserving highest relevance score
    const seen = new Map()
    for (const org of [...fullResults, ...lastResults]) {
      const key = String(org.ein)
      if (!seen.has(key) || (org.score || 0) > (seen.get(key).score || 0)) {
        seen.set(key, org)
      }
    }

    // Sort by score desc, take top 20
    const deduped = [...seen.values()]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 20)

    // Fetch revenue for top 8 in parallel (separate org endpoint)
    const top8 = deduped.slice(0, 8)
    const revenues = await Promise.all(top8.map(org => ppRevenue(org.ein)))
    const revenueMap = Object.fromEntries(
      top8.map((org, i) => [String(org.ein), revenues[i]])
    )

    const organizations = deduped.map(org => {
      const revenue = revenueMap[String(org.ein)] ?? null
      return {
        ein:          String(org.ein),
        strein:       org.strein || null,
        name:         org.name,
        city:         org.city || null,
        state:        org.state || null,
        nteeCode:     org.ntee_code || null,
        category:     nteeLabel(org.ntee_code),
        revenue,
        revenueLabel: formatRevenue(revenue),
        subsection:   org.subseccd ? `501(c)(${org.subseccd})` : null,
        profileUrl:   `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
        score:        org.score || 0,
      }
    })

    return NextResponse.json({
      organizations,
      total: organizations.length,
      query: { name, lastName, state },
      attribution: 'IRS 990 filings via ProPublica Nonprofit Explorer',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60' },
    })
  } catch (e) {
    console.error('Nonprofits API error:', e.message)
    return NextResponse.json({ error: 'Could not fetch nonprofit data.' }, { status: 500 })
  }
}
