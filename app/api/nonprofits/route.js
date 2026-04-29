import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// ProPublica Nonprofit Explorer API — free, no key required
const PP_BASE = 'https://projects.propublica.org/nonprofits/api/v2'

// NTEE major group codes → human-readable category
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
  const major = code.charAt(0).toUpperCase()
  return NTEE_LABELS[major] || null
}

function formatRevenue(n) {
  if (!n || n === 0) return null
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export async function GET(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const name  = (searchParams.get('name')  || '').trim()
  const state = (searchParams.get('state') || '').trim().toUpperCase()

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // Extract last name for the most targeted search
  // Name formats seen: "Last, First" (Congress.gov) or "First Last"
  const nameParts = name.includes(',')
    ? name.split(',').map(s => s.trim())
    : name.trim().split(/\s+/)
  const lastName = (name.includes(',') ? nameParts[0] : nameParts[nameParts.length - 1])
    .replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '').trim()
  const firstName = (name.includes(',') ? nameParts[1]?.split(/\s+/)[0] : nameParts[0]) || ''

  try {
    // Run two searches in parallel:
    // 1. Rep's full name — finds personal foundations, eponymous orgs
    // 2. Last name + state — finds orgs associated with their name in their jurisdiction
    const queries = [
      `${firstName} ${lastName}`.trim(),
      lastName,
    ]

    const results = await Promise.all(
      queries.map(q => {
        const url = state
          ? `${PP_BASE}/organizations.json?q=${encodeURIComponent(q)}&state[id]=${state}&per_page=25`
          : `${PP_BASE}/organizations.json?q=${encodeURIComponent(q)}&per_page=25`
        return fetch(url, {
          next: { revalidate: 3600 },
          headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
        })
          .then(r => r.ok ? r.json() : { organizations: [] })
          .catch(() => ({ organizations: [] }))
      })
    )

    // Merge, deduplicate by EIN, sort by revenue descending
    const seen = new Set()
    const orgs = []
    for (const result of results) {
      for (const org of (result.organizations || [])) {
        if (!seen.has(org.ein)) {
          seen.add(org.ein)
          orgs.push(org)
        }
      }
    }

    orgs.sort((a, b) => (b.revenue_amount || 0) - (a.revenue_amount || 0))

    const organizations = orgs.slice(0, 20).map(org => ({
      ein:          org.ein,
      name:         org.name,
      city:         org.city || null,
      state:        org.state || null,
      nteeCode:     org.ntee_code || null,
      category:     nteeLabel(org.ntee_code),
      revenue:      org.revenue_amount || null,
      revenueLabel: formatRevenue(org.revenue_amount),
      // Subsection: 501(c)(3), 501(c)(4), etc.
      subsection:   org.subsection_code ? `501(c)(${org.subsection_code})` : null,
      taxExempt:    org.tax_exempt !== false,
      profileUrl:   `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
      filingYear:   org.data_source || null,
    }))

    return NextResponse.json({
      organizations,
      total: organizations.length,
      query: { name, lastName, state },
      source: 'ProPublica Nonprofit Explorer',
      attribution: 'Data from IRS 990 filings via ProPublica Nonprofit Explorer',
    })
  } catch (e) {
    console.error('Nonprofits API error:', e.message)
    return NextResponse.json({ error: 'Could not fetch nonprofit data.' }, { status: 500 })
  }
}
