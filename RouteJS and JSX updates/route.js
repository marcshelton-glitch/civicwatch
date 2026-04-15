import { NextResponse } from 'next/server'

const BASE = 'https://api.congress.gov/v3'
const KEY = process.env.CONGRESS_API_KEY
const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY

// ── helpers ──────────────────────────────────────────────────────────────────
async function cFetch(path) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${KEY}&format=json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Congress API ${res.status}: ${path}`)
  return res.json()
}

async function safeFetch(url, opts = {}) {
  const res = await fetch(url, { next: { revalidate: 3600 }, ...opts })
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`)
  return res.json()
}

// ── GET handlers ──────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'members'
    const state = searchParams.get('state') || 'CA'
    const bioguideId = searchParams.get('bioguideId')
    const congress = searchParams.get('congress') || '119'

    // ── MEMBERS ───────────────────────────────────────────────────────────────
    if (type === 'members') {
      const data = await cFetch(`/member?currentMember=true&limit=250`)

      // API always returns two-letter state codes — filter directly
      const stateMembers = (data.members || []).filter(
        m => m.state === state
      ).slice(0, 30)

      const members = stateMembers.map(m => {
        const termItems = m.terms?.item || []
        const latestTerm = termItems[termItems.length - 1] || {}
        const chamber = latestTerm.chamber || ''
        const isSen = chamber.toLowerCase().includes('senate')
        return {
          bioguideId: m.bioguideId,
          name: m.name,
          party: m.partyName || 'Unknown',
          state: m.state,
          district: m.district ? `District ${m.district}` : 'Statewide',
          chamber,
          isSenator: isSen,
          url: m.url,
          depiction: m.depiction?.imageUrl || null,
        }
      })

      return NextResponse.json({ members, source: 'live' })
    }

    // ── MEMBER DETAIL (bio, committees, terms) ────────────────────────────────
    if (type === 'member' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}`)
      const m = data.member
      return NextResponse.json({
        member: {
          bioguideId: m.bioguideId,
          name: m.directOrderName,
          party: m.partyHistory?.[0]?.partyName,
          state: m.state,
          birthYear: m.birthYear,
          officialWebsiteUrl: m.officialWebsiteUrl,
          depiction: m.depiction?.imageUrl || null,
          leadership: m.leadership || [],
          terms: m.terms?.item || [],
          sponsoredLegislation: m.sponsoredLegislation || null,
          cosponsoredLegislation: m.cosponsoredLegislation || null,
        },
        source: 'live'
      })
    }

    // ── VOTES ─────────────────────────────────────────────────────────────────
    if (type === 'votes' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}/votes?limit=20`)
      const votes = (data.votes || []).map(v => ({
        bill: v.description || v.question || 'Unknown Bill',
        vote: v.memberVoted || v.votePosition || '—',
        date: v.date,
        congress: v.congress,
        session: v.session,
        rollNumber: v.rollNumber,
        result: v.result,
        outcome: v.result?.toLowerCase().includes('pass') ? 'PASSED' : 'FAILED',
        url: v.url || 'https://congress.gov',
      }))
      return NextResponse.json({ votes, source: 'live' })
    }

    // ── HOUSE STOCK TRADES (STOCK Act — Official Clerk API) ───────────────────
    // Returns all House PTR filings. We filter by last name on the client side.
    if (type === 'trades' && bioguideId) {
      const year = new Date().getFullYear()

      // Try current year first, fall back to prior year
      let houseData = []
      for (const y of [year, year - 1]) {
        try {
          const res = await fetch(
            `https://disclosures-clerk.house.gov/api/tradingData?year=${y}`,
            { next: { revalidate: 86400 } }
          )
          if (res.ok) {
            const json = await res.json()
            houseData = json.data || []
            if (houseData.length > 0) break
          }
        } catch { /* try next year */ }
      }

      // Get the member name to match against disclosure records
      let memberName = ''
      try {
        const memberData = await cFetch(`/member/${bioguideId}`)
        memberName = memberData.member?.directOrderName || ''
      } catch { /* skip name match */ }

      // Match by bioguideId field if present, otherwise by last name
      const lastName = memberName.split(',')[0]?.trim().toLowerCase() || ''
      const memberTrades = houseData
        .filter(t => {
          if (t.bioguide_id) return t.bioguide_id === bioguideId
          return lastName && t.last_name?.toLowerCase() === lastName
        })
        .slice(0, 20)
        .map(t => ({
          date: t.transaction_date || t.disclosure_date,
          asset: t.asset_description || t.ticker || 'Unknown',
          ticker: t.ticker || null,
          type: (t.type || '').toUpperCase().includes('PURCHASE') ? 'BUY'
            : (t.type || '').toUpperCase().includes('SALE') ? 'SELL' : t.type,
          amount: t.amount || 'Undisclosed',
          sector: t.asset_type || 'Stock',
          filedDate: t.disclosure_date,
          source: 'House Clerk STOCK Act Disclosure',
        }))

      // Also try Senate STOCK Act disclosures via senate.gov
      let senateTrades = []
      try {
        const senRes = await fetch(
          `https://efts.senate.gov/LATEST/search-index?q=%22${encodeURIComponent(lastName)}%22&df=senator_name&fq=report_types:ptr`,
          { next: { revalidate: 86400 } }
        )
        if (senRes.ok) {
          const senJson = await senRes.json()
          senateTrades = (senJson.hits?.hits || []).slice(0, 10).map(h => ({
            date: h._source?.transaction_date,
            asset: h._source?.asset_name || 'Unknown',
            ticker: h._source?.ticker || null,
            type: h._source?.transaction_type?.includes('Purchase') ? 'BUY' : 'SELL',
            amount: h._source?.amount || 'Undisclosed',
            sector: 'Stock',
            filedDate: h._source?.date_received,
            source: 'Senate STOCK Act Disclosure',
          }))
        }
      } catch { /* senate endpoint optional */ }

      const allTrades = [...memberTrades, ...senateTrades]
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      return NextResponse.json({
        trades: allTrades,
        source: allTrades.length > 0 ? 'live' : 'none',
      })
    }

    // ── BILLS (recent legislation) ────────────────────────────────────────────
    if (type === 'bills') {
      const data = await cFetch(
        `/bill/${congress}?limit=20&sort=updateDate+desc`
      )
      const bills = (data.bills || []).map(b => ({
        number: `${b.type}${b.number}`,
        title: b.title,
        congress: b.congress,
        url: b.url,
        latestAction: b.latestAction?.text,
        latestActionDate: b.latestAction?.actionDate,
        sponsor: b.sponsors?.[0]?.fullName,
        sponsorState: b.sponsors?.[0]?.state,
        sponsorParty: b.sponsors?.[0]?.party,
      }))
      return NextResponse.json({ bills, source: 'live' })
    }

    // ── SPONSORED BILLS by member ─────────────────────────────────────────────
    if (type === 'sponsored' && bioguideId) {
      const data = await cFetch(
        `/member/${bioguideId}/sponsored-legislation?limit=10`
      )
      const bills = (data.sponsoredLegislation || []).map(b => ({
        number: `${b.type}${b.number}`,
        title: b.title,
        congress: b.congress,
        url: b.url,
        latestAction: b.latestAction?.text,
        latestActionDate: b.latestAction?.actionDate,
        policyArea: b.policyArea?.name,
      }))
      return NextResponse.json({ bills, source: 'live' })
    }

    // ── SCHEDULE / DOCKET (LegiScan — requires key, graceful fallback) ─────────
    if (type === 'schedule') {
      if (!LEGISCAN_KEY) {
        return NextResponse.json({
          schedule: [],
          source: 'unavailable',
          message: 'LegiScan API key not configured yet.'
        })
      }
      const data = await safeFetch(
        `https://api.legiscan.com/?key=${LEGISCAN_KEY}&op=getSessionList&state=US`
      )
      return NextResponse.json({
        schedule: data.sessions || [],
        source: 'live'
      })
    }

    // ── COMMITTEE ASSIGNMENTS ─────────────────────────────────────────────────
    if (type === 'committees' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}`)
      const terms = data.member?.terms?.item || []
      // Extract unique committees from term history
      const committees = terms
        .flatMap(t => t.memberOf || [])
        .filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i)
        .map(c => ({ name: c.name, chamber: c.chamber }))
      return NextResponse.json({ committees, source: 'live' })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (err) {
    console.error('Congress API error:', err.message)
    return NextResponse.json({
      error: err.message,
      source: 'error',
      members: [],
      votes: [],
      trades: [],
    }, { status: 500 })
  }
}
