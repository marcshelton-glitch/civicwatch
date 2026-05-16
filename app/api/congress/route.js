import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// ── Supabase client factory (server-only) ─────────────────────────────────────
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE = 'https://api.congress.gov/v3'
const KEY = process.env.CONGRESS_API_KEY
const LEGISCAN_KEY = process.env.LEGISCAN_API_KEY

// ── Input validation ──────────────────────────────────────────────────────────
const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
])

const VALID_TYPES = new Set([
  'members','member','votes','trades','bills','sponsored','schedule','committees','townhall','search'
])

const BIOGUIDE_RE = /^[A-Z]\d{6}$/

// ── Rate limiter with cleanup to prevent memory leak ─────────────────────────
const rateLimitMap = new Map()
const WINDOW_MS = 60_000
const MAX_CALLS = 30
const CLEANUP_INTERVAL_MS = 5 * 60_000  // sweep every 5 minutes

function cleanupRateLimitMap() {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 2) {
      rateLimitMap.delete(key)
    }
  }
}
setInterval(cleanupRateLimitMap, CLEANUP_INTERVAL_MS)

function isRateLimited(userId) {
  const now = Date.now()
  const entry = rateLimitMap.get(userId) || { count: 0, windowStart: now }
  if (now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= MAX_CALLS) return true
  entry.count++
  rateLimitMap.set(userId, entry)
  return false
}

// ── Congress.gov fetch ────────────────────────────────────────────────────────
async function cFetch(path) {
  if (!KEY) throw new Error('CONGRESS_API_KEY not configured')
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${KEY}&format=json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Congress API ${res.status}`)
  return res.json()
}

// ── LegiScan fetch with Supabase cache ────────────────────────────────────────
async function legiScanFetch(op, params = {}) {
  if (!LEGISCAN_KEY) throw new Error('LEGISCAN_API_KEY not configured')

  const supabase = getSupabase()
  const cacheKey = `legiscan:${op}:${JSON.stringify(params)}`

  const { data: cached } = await supabase
    .from('legiscan_cache')
    .select('data, change_hash, fetched_at')
    .eq('key', cacheKey)
    .single()

  const qs = new URLSearchParams({ key: LEGISCAN_KEY, op, ...params }).toString()
  const url = `https://api.legiscan.com/?${qs}`

  if (cached?.change_hash && (op === 'getMasterListRaw' || op === 'getSearchRaw')) {
    try {
      const checkRes = await fetch(url, { next: { revalidate: 0 } })
      const checkJson = await checkRes.json()
      if (checkJson.status !== 'OK') return cached.data
      const payload = checkJson[Object.keys(checkJson).find(k => k !== 'status')]
      if (payload?.hash && payload.hash === cached.change_hash) return cached.data
    } catch { /* fall through to full fetch */ }
  }

  const res = await fetch(url, { next: { revalidate: 0 } })
  const json = await res.json()

  if (json.status !== 'OK') {
    if (cached) return cached.data
    throw new Error(`LegiScan error: ${json.alert?.message || 'Unknown'}`)
  }

  const payload = json[Object.keys(json).find(k => k !== 'status')] || json
  const changeHash = payload?.hash || null

  await supabase.from('legiscan_cache').upsert(
    { key: cacheKey, data: payload, change_hash: changeHash, fetched_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  return payload
}

// ── State map ─────────────────────────────────────────────────────────────────
const STATE_ABBR_TO_FULL = {
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

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { userId } = await auth()
  const rateLimitKey = userId
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous'

  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'members'
    const state = (searchParams.get('state') || 'CA').toUpperCase().trim()
    const bioguideId = searchParams.get('bioguideId') || ''
    const congress = searchParams.get('congress') || '119'

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    if (type === 'members' && !VALID_STATES.has(state)) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }
    // schedule: state required only for state reps (no valid bioguideId)
    if (type === 'schedule' && !BIOGUIDE_RE.test(bioguideId) && !VALID_STATES.has(state)) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }

    const bioguideTypes = ['member', 'votes', 'trades', 'sponsored', 'committees', 'townhall']
    if (bioguideTypes.includes(type) && !BIOGUIDE_RE.test(bioguideId)) {
      if (type === 'trades') {
        return NextResponse.json({ trades: [], source: 'state', message: 'State legislators file disclosures at the state level, not via the federal STOCK Act.' })
      }
      if (type === 'townhall') {
        return NextResponse.json({ events: [], officialEventsUrl: null, googleSearchUrl: null, source: 'state' })
      }
      return NextResponse.json({ error: 'Invalid bioguideId' }, { status: 400 })
    }

    const congressNum = parseInt(congress, 10)
    if (isNaN(congressNum) || congressNum < 100 || congressNum > 130) {
      return NextResponse.json({ error: 'Invalid congress number' }, { status: 400 })
    }

    // ── members ───────────────────────────────────────────────────────────
    if (type === 'members') {
      const stateFull = STATE_ABBR_TO_FULL[state] || state
      const [p1, p2, p3] = await Promise.all([
        cFetch('/member?currentMember=true&limit=250&offset=0'),
        cFetch('/member?currentMember=true&limit=250&offset=250'),
        cFetch('/member?currentMember=true&limit=250&offset=500'),
      ])
      const allMembers = [
        ...(p1.members || []),
        ...(p2.members || []),
        ...(p3.members || []),
      ]
      const stateMembers = allMembers.filter(m => m.state === stateFull).slice(0, 30)
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

    // ── member ────────────────────────────────────────────────────────────
    if (type === 'member') {
      const data = await cFetch(`/member/${bioguideId}`)
      const m = data.member
      return NextResponse.json({
        member: {
          bioguideId: m.bioguideId,
          name: m.invertedOrderName || m.directOrderName,
          party: m.partyHistory?.[0]?.partyName,
          state: m.state,
          birthYear: m.birthYear,
          officialWebsiteUrl: m.officialWebsiteUrl,
          depiction: m.depiction?.imageUrl || null,
          leadership: m.leadership || [],
          terms: m.terms || [],
        },
        source: 'live',
      })
    }

    // ── votes ─────────────────────────────────────────────────────────────
    if (type === 'votes') {
      // GovTrack — free, no key, rich vote detail including chamber totals
      // person.id field does not exist in GovTrack API; extract numeric ID from person.link
      let searchName = bioguideId
      try {
        const mData = await cFetch(`/member/${bioguideId}`)
        const rawName = mData.member?.directOrderName || ''
        searchName = rawName.split(',')[0].trim().replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '') || bioguideId
      } catch { /* keep bioguideId as query */ }

      try {
        const gtPerson = await fetch(
          `https://www.govtrack.us/api/v2/person?q=${encodeURIComponent(searchName)}&limit=10`,
          { next: { revalidate: 86400 }, headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }
        )
        if (!gtPerson.ok) throw new Error('GovTrack person lookup failed')
        const personJson = await gtPerson.json()

        // Prefer bioguide match, fall back to first result
        const match = personJson.objects?.find(p => p.bioguideid === bioguideId)
          ?? personJson.objects?.[0]

        // GovTrack person.id is absent — extract from link: /congress/members/name/12345
        const gtId = match?.link ? parseInt(match.link.split('/').pop(), 10) : null
        if (!gtId) throw new Error('Could not extract GovTrack person ID')

        const gtVotes = await fetch(
          `https://www.govtrack.us/api/v2/vote_voter?person=${gtId}&limit=30&order_by=-created`,
          { next: { revalidate: 3600 }, headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }
        )
        if (!gtVotes.ok) throw new Error('GovTrack vote_voter failed')
        const votesJson = await gtVotes.json()

        const BILL_TYPES = [
          [/\bH\.R\.\s*(\d+)/i,        'house-bill'],
          [/\bH\.J\.Res\.\s*(\d+)/i,   'house-joint-resolution'],
          [/\bH\.Con\.Res\.\s*(\d+)/i, 'house-concurrent-resolution'],
          [/\bH\.Res\.\s*(\d+)/i,      'house-resolution'],
          [/\bS\.J\.Res\.\s*(\d+)/i,   'senate-joint-resolution'],
          [/\bS\.Con\.Res\.\s*(\d+)/i, 'senate-concurrent-resolution'],
          [/\bS\.Res\.\s*(\d+)/i,      'senate-resolution'],
          [/\bS\.\s*(\d+)\b/i,         'senate-bill'],
        ]
        function billUrl(question, congress) {
          if (!question || !congress) return null
          for (const [re, type] of BILL_TYPES) {
            const m = question.match(re)
            if (m) return `https://www.congress.gov/bill/${congress}th-congress/${type}/${m[1]}`
          }
          return null
        }

        const votes = (votesJson.objects || []).map(v => {
          const optVal = v.option?.value || v.option?.key || ''
          const voteLabel = optVal === '+' || /^yea$/i.test(optVal) ? 'YEA'
            : optVal === '-' || /^nay$/i.test(optVal) ? 'NAY'
            : /present/i.test(optVal) ? 'PRESENT'
            : /not voting/i.test(optVal) ? 'NOT VOTING'
            : optVal.toUpperCase() || '—'
          const question = v.vote?.question || v.vote?.description || 'Unknown Bill'
          const congress = v.vote?.congress || null

          return {
            bill: question,
            billUrl: billUrl(question, congress) || v.vote?.link || null,
            category: v.vote?.category_label || null,
            vote: voteLabel,
            date: v.vote?.created ? v.vote.created.split('T')[0] : '',
            result: v.vote?.result || '',
            outcome: v.vote?.passed ? 'PASSED' : 'FAILED',
            totalYea: v.vote?.total_plus ?? null,
            totalNay: v.vote?.total_minus ?? null,
            totalOther: v.vote?.total_other ?? null,
            chamber: v.vote?.chamber_label || null,
            congress,
          }
        })

        if (votes.length > 0) {
          return NextResponse.json({ votes, source: 'govtrack', memberName: match?.name || searchName })
        }
      } catch (e) {
        console.error('GovTrack votes error:', e.message)
      }

      // Fallback: Congress.gov member sponsored-legislation as proxy for activity
      // (Congress.gov has no per-member vote history endpoint)
      return NextResponse.json({ votes: [], source: 'none' })
    }

    // ── trades ────────────────────────────────────────────────────────────
    if (type === 'trades') {
      const supabase = getSupabase()

      // Fetch member name + chamber from Congress.gov
      let lastName = '', firstName = '', isSenator = false, fullName = ''
      try {
        const memberData = await cFetch(`/member/${bioguideId}`)
        const m = memberData.member
        fullName = m?.directOrderName || m?.invertedOrderName || ''
        const nameParts = fullName.split(',')
        lastName = nameParts[0]?.trim().toLowerCase().replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '') || ''
        firstName = nameParts[1]?.trim().split(/\s+/)[0]?.toLowerCase() || ''
        const latestTerm = (m?.terms || []).slice(-1)[0]
        isSenator = latestTerm?.chamber?.toLowerCase().includes('senate') || false
      } catch { /* skip */ }

      const disclosureUrl = isSenator
        ? `https://efdsearch.senate.gov/search/?submitted=1&report_types=ptr&first_name=&last_name=${encodeURIComponent(lastName)}`
        : `https://disclosures-clerk.house.gov/FinancialDisclosure#Search`

      // ── Senators: query senate_trades from Supabase ───────────────────────
      if (isSenator && lastName) {
        const [{ data: senTrades }, { data: dbNetWorth }] = await Promise.all([
          supabase
            .from('senate_trades')
            .select('transaction_date, asset_name, ticker, transaction_type, amount_str, amount_min, amount_max, filing_id, year, ptr_url')
            .ilike('last_name', lastName)
            .order('transaction_date', { ascending: false })
            .limit(50),
          supabase
            .from('fd_net_worth')
            .select('report_year, assets_min, assets_max, liabilities_min, liabilities_max, net_worth_min, net_worth_max, doc_id')
            .ilike('last_name', lastName)
            .order('report_year', { ascending: false })
            .limit(20),
        ])

        const senateNetWorthHistory = (dbNetWorth || []).map(n => ({
          year: n.report_year,
          assetsMin: n.assets_min,
          assetsMax: n.assets_max,
          liabilitiesMin: n.liabilities_min,
          liabilitiesMax: n.liabilities_max,
          netWorthMin: n.net_worth_min,
          netWorthMax: n.net_worth_max,
          pdfUrl: `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${n.report_year}/${n.doc_id}.pdf`,
        }))

        const allSenTrades = (senTrades || []).map(t => ({
          date: t.transaction_date || '',
          asset: t.asset_name || 'Unknown Asset',
          ticker: t.ticker || null,
          type: t.transaction_type === 'Purchase' ? 'BUY'
            : t.transaction_type === 'Sale' ? 'SELL'
            : t.transaction_type?.toUpperCase() || 'OTHER',
          amount: t.amount_str || 'Undisclosed',
          amountMin: t.amount_min,
          amountMax: t.amount_max,
          chamber: 'senate',
          docUrl: t.ptr_url || null,
          source: 'Senate.gov — STOCK Act PTR (CivicWatch DB)',
        }))

        const buys = allSenTrades.filter(t => t.type === 'BUY').length
        const sells = allSenTrades.filter(t => t.type === 'SELL').length
        const topTickers = [...new Set(allSenTrades.map(t => t.ticker).filter(Boolean))].slice(0, 5)

        return NextResponse.json({
          trades: allSenTrades, buys, sells, topTickers,
          isSenator, disclosureUrl, source: allSenTrades.length > 0 ? 'db' : 'none',
          netWorthHistory: senateNetWorthHistory,
        })
      }

      // ── Primary: query fd_trades + fd_net_worth from Supabase in parallel ──
      if (!isSenator && lastName) {
        const [{ data: dbTrades }, { data: dbNetWorth }] = await Promise.all([
          supabase
            .from('fd_trades')
            .select('transaction_date, asset_name, ticker, transaction_type, amount_str, amount_min, amount_max, doc_id, year')
            .ilike('last_name', lastName)
            .order('transaction_date', { ascending: false })
            .limit(50),
          supabase
            .from('fd_net_worth')
            .select('report_year, assets_min, assets_max, liabilities_min, liabilities_max, net_worth_min, net_worth_max, doc_id')
            .ilike('last_name', lastName)
            .order('report_year', { ascending: false })
            .limit(20),
        ])

        const netWorthHistory = (dbNetWorth || []).map(n => ({
          year: n.report_year,
          assetsMin: n.assets_min,
          assetsMax: n.assets_max,
          liabilitiesMin: n.liabilities_min,
          liabilitiesMax: n.liabilities_max,
          netWorthMin: n.net_worth_min,
          netWorthMax: n.net_worth_max,
          pdfUrl: `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${n.report_year}/${n.doc_id}.pdf`,
        }))

        if (dbTrades && dbTrades.length > 0) {
          // Backfill bioguide_id in fd_filings for faster future lookups
          supabase
            .from('fd_filings')
            .update({ bioguide_id: bioguideId })
            .ilike('last_name', lastName)
            .is('bioguide_id', null)
            .then(() => {})

          const allTrades = dbTrades.map(t => ({
            date: t.transaction_date || '',
            asset: t.asset_name || 'Unknown Asset',
            ticker: t.ticker || null,
            type: t.transaction_type === 'Purchase' ? 'BUY'
              : t.transaction_type === 'Sale' ? 'SELL'
              : t.transaction_type?.toUpperCase() || 'OTHER',
            amount: t.amount_str || 'Undisclosed',
            amountMin: t.amount_min,
            amountMax: t.amount_max,
            chamber: 'house',
            sector: 'Stock/Security',
            docUrl: `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${t.year}/${t.doc_id}.pdf`,
            source: 'House Clerk — STOCK Act PTR (CivicWatch DB)',
          }))

          const buys = allTrades.filter(t => t.type === 'BUY').length
          const sells = allTrades.filter(t => t.type === 'SELL').length
          const topTickers = [...new Set(allTrades.map(t => t.ticker).filter(Boolean))].slice(0, 5)

          return NextResponse.json({
            trades: allTrades, buys, sells, topTickers,
            isSenator, disclosureUrl, source: 'db', netWorthHistory,
          })
        }

        // No trades in DB but may have net worth data
        if (netWorthHistory.length > 0) {
          return NextResponse.json({
            trades: [], buys: 0, sells: 0, topTickers: [],
            isSenator, disclosureUrl, source: 'db', netWorthHistory,
          })
        }
      }

      // ── Fallback: live House Clerk endpoint ────────────────────────────────
      let houseTrades = []
      const year = new Date().getFullYear()
      for (const y of [year, year - 1]) {
        try {
          const res = await fetch(
            `https://disclosures-clerk.house.gov/api/tradingData?year=${y}`,
            { next: { revalidate: 86400 }, headers: { 'User-Agent': 'CivicWatch/1.0' } }
          )
          if (res.ok) {
            const json = await res.json()
            const raw = json.data || json || []
            if (Array.isArray(raw) && raw.length > 0) {
              houseTrades = raw.filter(t => {
                if (t.bioguide_id) return t.bioguide_id.toUpperCase() === bioguideId
                if (!lastName) return false
                const tLast = (t.last_name || t.lastName || '').toLowerCase().replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '')
                const tFirst = (t.first_name || t.firstName || '').toLowerCase()
                return tLast === lastName && (!firstName || !tFirst || tFirst.startsWith(firstName[0]))
              })
              if (houseTrades.length > 0) break
            }
          }
        } catch { /* try next year */ }
      }

      const normalizedHouse = houseTrades.slice(0, 25).map(t => ({
        date: t.transaction_date || t.transactionDate || t.disclosure_date || '',
        asset: t.asset_description || t.assetDescription || t.ticker || 'Unknown Asset',
        ticker: t.ticker || null,
        type: /purchase/i.test(t.type || '') ? 'BUY'
          : /sale/i.test(t.type || '') ? 'SELL'
          : (t.type || 'Unknown').toUpperCase(),
        amount: t.amount || 'Undisclosed',
        chamber: 'house',
        sector: t.asset_type || t.assetType || 'Stock/Security',
        docUrl: t.pdf_url || t.pdfUrl || null,
        source: 'House Clerk — STOCK Act PTR',
      }))

      // ── Net worth from Supabase (fallback path — no trades in DB) ────────────
      let liveNetWorthHistory = []
      if (lastName) {
        const { data: nwData } = await supabase
          .from('fd_net_worth')
          .select('report_year, assets_min, assets_max, liabilities_min, liabilities_max, net_worth_min, net_worth_max, doc_id')
          .ilike('last_name', lastName)
          .order('report_year', { ascending: false })
          .limit(20)
        liveNetWorthHistory = (nwData || []).map(n => ({
          year: n.report_year,
          assetsMin: n.assets_min,
          assetsMax: n.assets_max,
          liabilitiesMin: n.liabilities_min,
          liabilitiesMax: n.liabilities_max,
          netWorthMin: n.net_worth_min,
          netWorthMax: n.net_worth_max,
          pdfUrl: `https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${n.report_year}/${n.doc_id}.pdf`,
        }))
      }

      const allTrades = [...normalizedHouse]
        .filter(t => t.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      const buys = allTrades.filter(t => t.type === 'BUY').length
      const sells = allTrades.filter(t => t.type === 'SELL').length
      const topTickers = [...new Set(allTrades.map(t => t.ticker).filter(Boolean))].slice(0, 5)

      return NextResponse.json({
        trades: allTrades, buys, sells, topTickers,
        isSenator, disclosureUrl,
        source: allTrades.length > 0 ? 'live' : 'none',
        netWorthHistory: liveNetWorthHistory,
      })
    }

    // ── bills ─────────────────────────────────────────────────────────────
    if (type === 'bills') {
      const data = await cFetch(`/bill/${congressNum}?limit=20&sort=updateDate+desc`)
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

    // ── sponsored ─────────────────────────────────────────────────────────
    if (type === 'sponsored') {
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

    // ── schedule ──────────────────────────────────────────────────────────
    if (type === 'schedule') {
      // Federal rep: use Congress.gov sponsored legislation as their active docket
      if (BIOGUIDE_RE.test(bioguideId)) {
        const [sponsoredData, cosponsoredData] = await Promise.all([
          cFetch(`/member/${bioguideId}/sponsored-legislation?limit=20`).catch(() => ({ sponsoredLegislation: [] })),
          cFetch(`/member/${bioguideId}/cosponsored-legislation?limit=10`).catch(() => ({ cosponsoredLegislation: [] })),
        ])

        const mapBill = (b, role) => ({
          billId: `${b.congress}-${b.type}-${b.number}`,
          number: `${b.type}${b.number}`,
          title: b.title,
          lastAction: b.latestAction?.text || '',
          lastActionDate: b.latestAction?.actionDate || '',
          status: b.latestAction?.actionDate
            ? (b.latestAction.text?.toLowerCase().includes('passed') ? 4
              : b.latestAction.text?.toLowerCase().includes('engrossed') ? 2
              : b.latestAction.text?.toLowerCase().includes('enrolled') ? 3
              : 1)
            : 1,
          url: b.url || `https://www.congress.gov/bill/${b.congress}th-congress/${b.type?.toLowerCase().replace('hconres','house-concurrent-resolution').replace('hjres','house-joint-resolution').replace('hr','house-bill').replace('s','senate-bill').replace('sconres','senate-concurrent-resolution').replace('sjres','senate-joint-resolution')}/${b.number}`,
          role,
          policyArea: b.policyArea?.name || '',
        })

        const sponsored = (sponsoredData.sponsoredLegislation || [])
          .filter(b => b.title && b.type && b.number)
          .slice(0, 15)
          .map(b => mapBill(b, 'Sponsor'))

        const cosponsored = (cosponsoredData.cosponsoredLegislation || [])
          .filter(b => b.title && b.type && b.number)
          .slice(0, 5)
          .map(b => mapBill(b, 'Cosponsor'))

        const schedule = [...sponsored, ...cosponsored]
          .sort((a, b) => new Date(b.lastActionDate) - new Date(a.lastActionDate))

        return NextResponse.json({ schedule, source: 'congress', attribution: 'Congress.gov' })
      }

      // State rep: use LegiScan master list for their state
      if (!LEGISCAN_KEY) {
        return NextResponse.json({
          schedule: [], source: 'unavailable',
          message: 'LegiScan API key not configured yet.',
        })
      }
      const masterList = await legiScanFetch('getMasterListRaw', { state })
      const bills = Object.values(masterList)
        .filter(b => typeof b === 'object' && b.bill_id)
        .slice(0, 20)
        .map(b => ({
          billId: b.bill_id,
          number: b.number,
          title: b.title,
          lastAction: b.last_action,
          lastActionDate: b.last_action_date,
          status: b.status,
          url: b.url,
        }))
      return NextResponse.json({
        schedule: bills, source: 'legiscan',
        attribution: 'LegiScan LLC — CC BY 4.0',
      })
    }

    // ── townhall ──────────────────────────────────────────────────────────
    if (type === 'townhall') {
      // Derive official website slug — House: {lastname}.house.gov, Senate: {lastname}.senate.gov
      let lastName = '', isSenator = false
      try {
        const memberData = await cFetch(`/member/${bioguideId}`)
        const m = memberData.member
        const nameParts = (m?.directOrderName || '').split(',')
        lastName = nameParts[0]?.trim().toLowerCase()
          .replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '')
          .replace(/[^a-z\-]/g, '') || ''
        const latestTerm = (m?.terms || []).slice(-1)[0]
        isSenator = latestTerm?.chamber?.toLowerCase().includes('senate') || false
      } catch { /* skip */ }

      const officialEventsUrl = lastName
        ? isSenator
          ? `https://www.${lastName}.senate.gov/public/index.cfm/news/type/e`
          : `https://${lastName}.house.gov/news/events`
        : null

      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        (lastName || bioguideId) + ' town hall ' + new Date().getFullYear()
      )}`

      // Fetch upcoming TOWN_HALL events from Mobilize America (public, no key needed)
      let events = []
      try {
        const now = Math.floor(Date.now() / 1000)
        // Fetch up to 200 upcoming town halls, then filter to this rep's state
        const mobRes = await fetch(
          `https://api.mobilize.us/v1/events?event_types=TOWN_HALL&per_page=200&timeslot_start=now`,
          { next: { revalidate: 3600 }, headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }
        )
        if (mobRes.ok) {
          const mobJson = await mobRes.json()
          const stateAbbr = state  // already validated/uppercased above
          const lastNameLower = lastName.toLowerCase()

          events = (mobJson.data || [])
            .filter(ev => {
              // Match by state (sponsor.state) and optionally rep name in title
              const evState = (ev.sponsor?.state || ev.location?.region || '').toUpperCase()
              const titleLower = (ev.title || '').toLowerCase()
              const descLower = (ev.description || ev.summary || '').toLowerCase()
              const stateMatch = evState === stateAbbr
              const nameMatch = lastNameLower && (titleLower.includes(lastNameLower) || descLower.includes(lastNameLower))
              return stateMatch || nameMatch
            })
            .slice(0, 10)
            .map(ev => {
              const slot = ev.timeslots?.[0]
              const startTs = slot?.start_date
              const startDate = startTs ? new Date(startTs * 1000).toISOString().split('T')[0] : null
              const startTime = startTs ? new Date(startTs * 1000).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit', timeZone: ev.timezone || 'America/New_York'
              }) : null
              const loc = ev.location
              const locationStr = ev.is_virtual
                ? 'Virtual Event'
                : [loc?.venue, loc?.locality, loc?.region].filter(Boolean).join(', ')

              return {
                id: ev.id,
                title: ev.title,
                date: startDate,
                time: startTime,
                timezone: ev.timezone,
                location: locationStr,
                isVirtual: ev.is_virtual || false,
                description: ev.summary || ev.description?.slice(0, 200) || '',
                rsvpUrl: ev.browser_url || null,
                sponsor: ev.sponsor?.name || null,
              }
            })
            .filter(ev => ev.date)  // drop events without a parseable date
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        }
      } catch { /* Mobilize unavailable — fallback only */ }

      return NextResponse.json({
        events,
        officialEventsUrl,
        googleSearchUrl,
        isSenator,
        source: events.length > 0 ? 'mobilize' : 'none',
        attribution: events.length > 0 ? 'Mobilize America' : null,
      })
    }

    // ── committees ────────────────────────────────────────────────────────
    if (type === 'committees') {
      const data = await cFetch(`/member/${bioguideId}`)
      const terms = data.member?.terms || []
      // Group by committee name, tracking min/max congress so we can show year ranges
      const byName = {}
      for (const term of terms) {
        const congress = term.congress
        for (const c of (term.memberOf || [])) {
          if (!c.name) continue
          if (!byName[c.name]) byName[c.name] = { name: c.name, chamber: c.chamber, startCongress: congress, endCongress: congress }
          else {
            if (congress < byName[c.name].startCongress) byName[c.name].startCongress = congress
            if (congress > byName[c.name].endCongress) byName[c.name].endCongress = congress
          }
        }
      }
      const committees = Object.values(byName).sort((a, b) => b.endCongress - a.endCongress)
      return NextResponse.json({ committees, source: 'live' })
    }

    // ── search ────────────────────────────────────────────────────────────
    if (type === 'search') {
      const query = (searchParams.get('name') || '').trim().toLowerCase()
      if (query.length < 2) return NextResponse.json({ members: [], source: 'none' })

      const [p1, p2, p3] = await Promise.all([
        cFetch('/member?currentMember=true&limit=250&offset=0'),
        cFetch('/member?currentMember=true&limit=250&offset=250'),
        cFetch('/member?currentMember=true&limit=250&offset=500'),
      ])
      const allMembers = [
        ...(p1.members || []),
        ...(p2.members || []),
        ...(p3.members || []),
      ]

      // Congress.gov list endpoint uses `name` ("Last, First" format).
      // Fall back to invertedOrderName / directOrderName if the field is absent.
      const memberName = m => m.name || m.invertedOrderName || m.directOrderName || ''

      const normalize = m => {
        const rawName = memberName(m)
        const termItems = m.terms?.item || []
        const latestTerm = termItems[termItems.length - 1] || {}
        const chamber = latestTerm.chamber || ''
        return {
          bioguideId: m.bioguideId,
          name: rawName,
          party: m.partyName || 'Unknown',
          state: m.state,
          district: m.district ? `District ${m.district}` : 'Statewide',
          chamber,
          isSenator: chamber.toLowerCase().includes('senate'),
          url: m.url,
          depiction: m.depiction?.imageUrl || null,
        }
      }

      const members = allMembers
        .filter(m => memberName(m).toLowerCase().includes(query))
        .slice(0, 20)
        .map(normalize)

      return NextResponse.json({ members, source: 'live' })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })

  } catch (err) {
    console.error('Congress API error:', err.message)
    return NextResponse.json(
      { error: 'An error occurred fetching data.', members: [], votes: [], trades: [] },
      { status: 500 }
    )
  }
}