import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE = 'https://api.congress.gov/v3'
const KEY = process.env.CONGRESS_API_KEY
const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY

async function cFetch(path) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${KEY}&format=json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Congress API ${res.status}: ${path}`)
  return res.json()
}

async function legiScanFetch(op, params = {}) {
  if (!LEGISCAN_KEY) throw new Error('LEGISCAN_API_KEY not configured')
  const cacheKey = `legiscan:${op}:${JSON.stringify(params)}`
  const { data: cached } = await supabase
    .from('legiscan_cache')
    .select('data, change_hash, fetched_at')
    .eq('key', cacheKey)
    .single()
  const qs = new URLSearchParams({ key: LEGISCAN_KEY, op, ...params }).toString()
  const url = `https://api.legiscan.com/?${qs}`
  if (cached?.change_hash && (op === 'getMasterListRaw' || op === 'getSearchRaw')) {
    const checkRes = await fetch(url, { next: { revalidate: 0 } })
    const checkJson = await checkRes.json()
    if (checkJson.status !== 'OK') {
      if (cached) return cached.data
      throw new Error(`LegiScan error: ${checkJson.alert?.message}`)
    }
    const payload = checkJson[Object.keys(checkJson).find(k => k !== 'status')]
    if (payload?.hash && payload.hash === cached.change_hash) return cached.data
  }
  const res = await fetch(url, { next: { revalidate: 0 } })
  const json = await res.json()
  if (json.status !== 'OK') {
    if (cached) return cached.data
    throw new Error(`LegiScan error: ${json.alert?.message || 'Unknown'}`)
  }
  const payload = json[Object.keys(json).find(k => k !== 'status')] || json
  const changeHash = payload?.hash || null
  await supabase.from('legiscan_cache').upsert({
    key: cacheKey,
    data: payload,
    change_hash: changeHash,
    fetched_at: new Date().toISOString(),
  }, { onConflict: 'key' })
  return payload
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'members'
    const state = searchParams.get('state') || 'CA'
    const bioguideId = searchParams.get('bioguideId')
    const congress = searchParams.get('congress') || '119'

    if (type === 'members') {
      const data = await cFetch(`/member?currentMember=true&limit=250`)
      const stateAbbrevToFull = {
        'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California',
        'CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia',
        'HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa',
        'KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland',
        'MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri',
        'MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey',
        'NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio',
        'OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina',
        'SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont',
        'VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
      }
      const stateFull = stateAbbrevToFull[state] || state
      const stateMembers = (data.members || []).filter(m => m.state === stateFull).slice(0, 30)
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
        },
        source: 'live'
      })
    }

    if (type === 'votes' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}/votes?limit=20`)
      const votes = (data.votes || []).map(v => ({
        bill: v.description || v.question || 'Unknown Bill',
        vote: v.memberVoted || v.votePosition || '—',
        date: v.date,
        result: v.result,
        outcome: v.result?.toLowerCase().includes('pass') ? 'PASSED' : 'FAILED',
        url: v.url || 'https://congress.gov',
      }))
      return NextResponse.json({ votes, source: 'live' })
    }

    if (type === 'trades' && bioguideId) {
      const year = new Date().getFullYear()
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
      let memberName = ''
      try {
        const memberData = await cFetch(`/member/${bioguideId}`)
        memberName = memberData.member?.directOrderName || ''
      } catch { /* skip */ }
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
          source: 'House Clerk STOCK Act Disclosure',
        }))
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
            source: 'Senate STOCK Act Disclosure',
          }))
        }
      } catch { /* optional */ }
      const allTrades = [...memberTrades, ...senateTrades]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      return NextResponse.json({
        trades: allTrades,
        source: allTrades.length > 0 ? 'live' : 'none',
      })
    }

    if (type === 'bills') {
      const data = await cFetch(`/bill/${congress}?limit=20&sort=updateDate+desc`)
      const bills = (data.bills || []).map(b => ({
        number: `${b.type}${b.number}`,
        title: b.title,
        congress: b.congress,
        url: b.url,
        latestAction: b.latestAction?.text,
        latestActionDate: b.latestAction?.actionDate,
        sponsor: b.sponsors?.[0]?.fullName,
      }))
      return NextResponse.json({ bills, source: 'live' })
    }

    if (type === 'sponsored' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}/sponsored-legislation?limit=10`)
      const bills = (data.sponsoredLegislation || [])
        .filter(b => b.title && b.type && b.number)
        .slice(0, 10)
        .map(b => ({
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

    if (type === 'schedule') {
      if (!LEGISCAN_KEY) {
        return NextResponse.json({
          schedule: [],
          source: 'unavailable',
          message: 'LegiScan API key not configured yet.',
        })
      }
      const stateParam = searchParams.get('state') || 'US'
      const masterList = await legiScanFetch('getMasterListRaw', { state: stateParam })
      const bills = Object.values(masterList)
        .filter(b => typeof b === 'object' && b.bill_id)
        .slice(0, 20)
        .map(b => ({
          billId: b.bill_id,
          number: b.number,
          title: b.title,
          changeHash: b.change_hash,
          lastAction: b.last_action,
          lastActionDate: b.last_action_date,
          status: b.status,
          url: b.url,
        }))
      return NextResponse.json({
        schedule: bills,
        source: 'live',
        attribution: 'Data provided by LegiScan LLC — CC BY 4.0',
      })
    }

    if (type === 'committees' && bioguideId) {
      const data = await cFetch(`/member/${bioguideId}`)
      const terms = data.member?.terms?.item || []
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