import { NextResponse } from 'next/server'
import https from 'https'

export const dynamic = 'force-dynamic'

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'X-API-Key': process.env.FEC_API_KEY || '', 'User-Agent': 'CivicWatch/1.0' } }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch(e) { resolve({ status: res.statusCode, data: {}, raw: data.slice(0,200) }) }
      })
    }).on('error', reject)
  })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'Schiff'
  const state = searchParams.get('state') || 'CA'
  const chamber = searchParams.get('chamber') || 'senate'

  try {
    // ProPublica Campaign Finance API - no key needed, not blocked
    const ppUrl = `https://api.propublica.org/campaign-finance/v1/2024/candidates/search.json?query=${encodeURIComponent(name)}`
    const ppResult = await httpsGet(ppUrl)
    
    if (ppResult.status === 200 && ppResult.data.results) {
      const candidates = (ppResult.data.results || []).slice(0, 5).map(c => ({
        fecId: c.id,
        name: c.name,
        party: c.party,
        state: c.state,
        office: c.office,
        totalRaised: c.total_receipts,
        totalSpent: c.total_disbursements,
        cashOnHand: c.cash_on_hand,
        source: 'propublica'
      }))
      return NextResponse.json({ candidates, source: 'live' })
    }

    // Fallback: return structured empty data with OpenFEC link
    return NextResponse.json({
      candidates: [],
      fallbackUrl: `https://www.fec.gov/data/candidates/?state=${state}&office=S`,
      source: 'fallback',
      message: 'FEC API unavailable from server — use fallback link'
    })

  } catch (err) {
    return NextResponse.json({ error: err.message, source: 'error' }, { status: 500 })
  }
}