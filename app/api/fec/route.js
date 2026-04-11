import { NextResponse } from 'next/server'
import https from 'https'

export const dynamic = 'force-dynamic'

const FEC_KEY = process.env.FEC_API_KEY
const BASE = 'https://api.fec.gov/v1'

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch(e) { reject(new Error('Invalid JSON: ' + data.slice(0,100))) }
      })
    }).on('error', reject)
  })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'search'
  const name = searchParams.get('name') || ''
  const state = searchParams.get('state') || 'CA'

  try {
    if (type === 'search') {
      const url = `${BASE}/candidates/?api_key=${FEC_KEY}&q=${encodeURIComponent(name)}&state=${state}&per_page=5&sort=-receipts`
      const data = await httpsGet(url)
      const candidates = (data.results || []).map(c => ({
        fecId: c.candidate_id,
        name: c.name,
        party: c.party,
        state: c.state,
        office: c.office_full,
        totalRaised: c.receipts,
        totalSpent: c.disbursements,
        cashOnHand: c.cash_on_hand_end_period,
      }))
      return NextResponse.json({ candidates, source: 'live' })
    }

    if (type === 'finance') {
      const searchUrl = `${BASE}/candidates/?api_key=${FEC_KEY}&q=${encodeURIComponent(name)}&per_page=3&sort=-receipts`
      const searchData = await httpsGet(searchUrl)
      const candidate = searchData.results?.[0]

      const donorUrl = `${BASE}/schedules/schedule_a/by_industry/?api_key=${FEC_KEY}&candidate_id=${candidate.candidate_id}&cycle=2024&per_page=10`
      let industries = []
      try {
        const indData = await httpsGet(donorUrl)
        industries = indData.results || []
      } catch(e) {}

      return NextResponse.json({
        fecId: candidate.candidate_id,
        name: candidate.name,
        party: candidate.party,
        totalRaised: candidate.receipts,
        totalSpent: candidate.disbursements,
        cashOnHand: candidate.cash_on_hand_end_period,
        topIndustries: industries,
        source: 'live'
      })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (err) {
    console.error('FEC error:', err.message)
    return NextResponse.json({ error: err.message, source: 'error' }, { status: 500 })
  }
}