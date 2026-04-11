import { NextResponse } from 'next/server'

const FEC_KEY = process.env.FEC_API_KEY
const BASE = 'https://api.fec.gov/v1'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'candidate'
  const name = searchParams.get('name') || ''
  const state = searchParams.get('state') || 'CA'
  const bioguideId = searchParams.get('bioguideId') || ''

  try {
    if (type === 'search') {
      const url = `${BASE}/candidates/?api_key=${FEC_KEY}&q=${encodeURIComponent(name)}&state=${state}&per_page=5&sort=-receipts`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      const data = await res.json()
      const candidates = (data.results || []).map(c => ({
        fecId: c.candidate_id,
        name: c.name,
        party: c.party,
        state: c.state,
        office: c.office_full,
        totalRaised: c.receipts,
        totalSpent: c.disbursements,
        cashOnHand: c.cash_on_hand_end_period,
        cycle: c.election_years?.[0],
      }))
      return NextResponse.json({ candidates, source: 'live' })
    }

    if (type === 'finance' && name) {
      const searchUrl = `${BASE}/candidates/?api_key=${FEC_KEY}&q=${encodeURIComponent(name)}&per_page=3&sort=-receipts`
      const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } })
      const searchData = await searchRes.json()
      const candidate = searchData.results?.[0]

      const finUrl = `${BASE}/candidates/${candidate.candidate_id}/history/?api_key=${FEC_KEY}&per_page=5`
      const finRes = await fetch(finUrl, { next: { revalidate: 86400 } })
      const finData = await finRes.json()

      const topIndustriesUrl = `${BASE}/schedules/schedule_a/by_industry/?api_key=${FEC_KEY}&candidate_id=${candidate.candidate_id}&cycle=2024&per_page=10`
      const indRes = await fetch(topIndustriesUrl, { next: { revalidate: 86400 } })
      const indData = await indRes.json()

      return NextResponse.json({
        fecId: candidate.candidate_id,
        name: candidate.name,
        party: candidate.party,
        totalRaised: candidate.receipts,
        totalSpent: candidate.disbursements,
        cashOnHand: candidate.cash_on_hand_end_period,
        history: finData.results || [],
        topIndustries: indData.results || [],
        source: 'live'
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (err) {
    console.error('FEC API error:', err.message)
    return NextResponse.json({
      error: err.message,
      source: 'error',
      totalRaised: null,
      topIndustries: []
    })
  }
}