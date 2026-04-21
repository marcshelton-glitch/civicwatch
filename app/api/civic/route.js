import { NextResponse } from 'next/server'

const CIVIC_API_KEY = process.env.GOOGLE_CIVIC_API_KEY

// Levels that correspond to municipal/local government
const LOCAL_LEVELS = new Set(['locality', 'subLocality1', 'subLocality2', 'administrativeArea2'])

// Normalize party string from Google Civic API
function normalizeParty(raw = '') {
  const p = raw.toLowerCase()
  if (p.includes('democrat')) return 'Democrat'
  if (p.includes('republican')) return 'Republican'
  if (p.includes('independent')) return 'Independent'
  if (p.includes('nonpartisan') || p.includes('non-partisan')) return 'Nonpartisan'
  return raw || 'Unknown'
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 })
  }

  if (!CIVIC_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_CIVIC_API_KEY not configured' }, { status: 503 })
  }

  const url = `https://civicinfo.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${CIVIC_API_KEY}`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.message || 'Civic API error', status: res.status }, { status: res.status })
    }

    const data = await res.json()
    const offices = data.offices || []
    const officials = data.officials || []

    // Build municipal reps from local-level offices
    const municipal = []
    for (const office of offices) {
      const isLocal = (office.levels || []).some(l => LOCAL_LEVELS.has(l))
      if (!isLocal) continue
      for (const idx of (office.officialIndices || [])) {
        const o = officials[idx]
        if (!o) continue
        const phone = (o.phones || [])[0] || ''
        const email = (o.emails || [])[0] || ''
        const website = (o.urls || [])[0] || ''
        const address = o.address?.[0]
        municipal.push({
          id: `civic-${idx}-${office.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: o.name,
          title: office.name,
          party: normalizeParty(o.party),
          level: 'municipal',
          district: office.divisionId?.split(':').pop()?.replace(/_/g, ' ') || office.name,
          photo: o.photoUrl || null,
          phone,
          email,
          website,
          officeLocation: address ? `${address.line1 || ''}, ${address.city || ''}, ${address.state || ''}`.replace(/^,\s*|,\s*$/g, '') : '',
          officeHours: '',
          bio: `${o.name} serves as ${office.name}.`,
          trades: [], votes: [], docket: [], townHall: [],
          peers: [], peerComparison: {},
          netWorthBefore: null, netWorthCurrent: null, yearsInOffice: null,
          communityPoll: { housing: 0, transit: 0, safety: 0, education: 0 },
          isLive: true,
          source: 'google-civic',
        })
      }
    }

    return NextResponse.json({
      officials: municipal,
      normalizedAddress: data.normalizedInput
        ? `${data.normalizedInput.city}, ${data.normalizedInput.state} ${data.normalizedInput.zip}`
        : address,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
