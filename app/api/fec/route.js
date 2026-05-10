import { NextResponse } from 'next/server'

export const revalidate = 86400  // cache 24 hours

const FEC_KEY = process.env.FEC_API_KEY || 'DEMO_KEY'
const FEC_BASE = 'https://api.open.fec.gov/v1'

async function fecFetch(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${FEC_BASE}${path}${sep}api_key=${FEC_KEY}`, {
    next: { revalidate: 86400 },
    headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' },
  })
  if (!res.ok) throw new Error(`FEC ${res.status}: ${path}`)
  return res.json()
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const bioguideId = searchParams.get('bioguideId') || ''
  const fullName = searchParams.get('name') || ''
  const state = (searchParams.get('state') || '').trim()

  // Extract last name (Congress.gov format is "Last, First Middle")
  const lastName = fullName.split(',')[0].trim().replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '')

  if (!lastName) {
    return NextResponse.json({ found: false, fecUrl: 'https://www.fec.gov/data/candidates/' })
  }

  const fecSearchUrl = `https://www.fec.gov/data/candidates/?q=${encodeURIComponent(lastName)}`

  try {
    // Search FEC candidates by name — sorted by most recent receipts descending
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : ''
    const candidateData = await fecFetch(
      `/candidates/?name=${encodeURIComponent(lastName)}${stateParam}&sort=-receipts&per_page=10`
    )

    const candidates = candidateData.results || []
    if (candidates.length === 0) {
      return NextResponse.json({ found: false, fecUrl: fecSearchUrl })
    }

    // Prefer candidate with highest receipts
    const candidate = candidates[0]
    const candidateId = candidate.candidate_id
    const committeeId = candidate.principal_committees?.[0]?.committee_id

    let donors = []
    if (committeeId) {
      try {
        const donorData = await fecFetch(
          `/schedules/schedule_a/?committee_id=${committeeId}&sort=-contribution_receipt_amount&per_page=10`
        )
        donors = (donorData.results || []).map(d => ({
          name: d.contributor_name || 'Unknown',
          amount: Math.round(d.contribution_receipt_amount || 0),
          employer: d.contributor_employer || null,
          date: d.contribution_receipt_date || null,
        }))
      } catch {
        // Donors are nice-to-have; don't fail the whole request
      }
    }

    return NextResponse.json({
      found: true,
      candidateId,
      committeeId: committeeId || null,
      name: candidate.name,
      party: candidate.party,
      office: candidate.office,
      state: candidate.state,
      district: candidate.district,
      electionYear: candidate.election_years?.slice(-1)[0] || null,
      totalRaised: candidate.receipts || 0,
      totalSpent: candidate.disbursements || 0,
      fecUrl: `https://www.fec.gov/data/candidate/${candidateId}/`,
      fecSearchUrl,
      donors,
    })
  } catch (err) {
    // FEC API down or rate-limited — return graceful fallback
    return NextResponse.json({
      found: false,
      error: err.message,
      fecUrl: fecSearchUrl,
    })
  }
}
