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
  'members','member','votes','trades','bills','sponsored','schedule','committees','townhall'
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
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isRateLimited(userId)) {
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
          name: m.directOrderName,
          party: m.partyHistory?.[0]?.partyName,
          state: m.state,
          birthYear: m.birthYear,
          officialWebsiteUrl: m.officialWebsiteUrl,
          depiction: m.depiction?.imageUrl || null,
          leadership: m.leadership || [],
          terms: m.terms?.item || [],
        },
        source: 'live',
      })
    }

    // ── votes ─────────────────────────────────────────────────────────────
    if (type === 'votes') {
      // Try GovTrack first — free, detailed, includes bill links
      // GovTrack no longer supports ?bioguideid= — use ?q=lastName instead
      try {
        // Get last name from Congress.gov to build the GovTrack search query
        let searchName = bioguideId
        try {
          const mData = await cFetch(`/member/${bioguideId}`)
          const rawName = mData.member?.directOrderName || ''
          searchName = rawName.split(',')[0].trim().replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, '') || bioguideId
        } catch { /* use bioguideId as fallback query */ }

        const gtPerson = await fetch(
          `https://www.govtrack.us/api/v2/person?q=${encodeURIComponent(searchName)}&limit=5`,
          { next: { revalidate: 86400 }, headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }
        )
        if (gtPerson.ok) {
          const personJson = await gtPerson.json()
          // Match by bioguide ID when GovTrack has it, else take first result
          const match = personJson.objects?.find(p => p.bioguideid === bioguideId)
            || personJson.objects?.[0]
          const gtId = match?.id
          if (gtId) {
            const gtVotes = await fetch(
              `https://www.govtrack.us/api/v2/vote_voter?person=${gtId}&limit=20&order_by=-created`,
              { next: { revalidate: 3600 }, headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } }
            )
            if (gtVotes.ok) {
              const votesJson = await gtVotes.json()
              const votes = (votesJson.objects || []).map(v => {
                const rawVal = v.option?.value || ''
                const voteLabel = rawVal === '+' ? 'YEA'
                  : rawVal === '-' ? 'NAY'
                  : rawVal === 'P' ? 'PRESENT'
                  : (v.option?.key || rawVal || '—').toUpperCase()
                const passed = (v.vote?.result || '').toLowerCase().includes('pass')
                const billTitle = v.vote?.related_bill?.title || v.vote?.question || v.vote?.description || 'Unknown Bill'
                const billPath = v.vote?.related_bill?.link || v.vote?.link || ''
                const billUrl = billPath
                  ? `https://www.govtrack.us${billPath}`
                  : `https://www.govtrack.us/congress/votes`
                return {
                  bill: billTitle,
                  vote: voteLabel,
                  date: v.vote?.created ? v.vote.created.split('T')[0] : '',
                  result: v.vote?.result || '',
                  outcome: passed ? 'PASSED' : 'FAILED',
                  url: billUrl,
                  source: 'GovTrack',
                }
              })
              if (votes.length > 0) {
                return NextResponse.json({ votes, source: 'govtrack' })
              }
            }
          }
        }
      } catch { /* fall through to Congress.gov */ }

      // Fallback: Congress.gov
      const data = await cFetch(`/member/${bioguideId}/votes?limit=20`)
      const votes = (data.votes || []).map(v => ({
        bill: v.description || v.question || 'Unknown Bill',
        vote: v.memberVoted || v.votePosition || '—',
        date: v.date,
        result: v.result,
        outcome: v.result?.toLowerCase().includes('pass') ? 'PASSED' : 'FAILED',
        url: v.url || 'https://congress.gov',
        source: 'Congress.gov',
      }))
      return NextResponse.json({ votes, source: 'live' })
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
        const latestTerm = (m?.terms?.item || []).slice(-1)[0]
        isSenator = latestTerm?.chamber?.toLowerCase().includes('senate') || false
      } catch { /* skip */ }

      const disclosureUrl = isSenator
        ? `https://efts.senate.gov/LATEST/search-index?q=%22${encodeURIComponent(lastName)}%22&df=senator_name`
        : `https://disclosures-clerk.house.gov/FinancialDisclosure#Search`

      // ── Primary: query fd_trades from Supabase (House PTR data, 2008–present) ──
      if (!isSenator && lastName) {
        const { data: dbTrades } = await supabase
          .from('fd_trades')
          .select('transaction_date, asset_name, ticker, transaction_type, amount_str, amount_min, amount_max, doc_id, year')
          .ilike('last_name', lastName)
          .order('transaction_date', { ascending: false })
          .limit(50)

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
            sector: 'Stock/Security',
            docUrl: `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${t.year}/${t.doc_id}.pdf`,
            source: 'House Clerk — STOCK Act PTR (CivicWatch DB)',
          }))

          const buys = allTrades.filter(t => t.type === 'BUY').length
          const sells = allTrades.filter(t => t.type === 'SELL').length
          const topTickers = [...new Set(allTrades.map(t => t.ticker).filter(Boolean))].slice(0, 5)

          return NextResponse.json({
            trades: allTrades, buys, sells, topTickers,
            isSenator, disclosureUrl, source: 'db',
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
        sector: t.asset_type || t.assetType || 'Stock/Security',
        docUrl: t.pdf_url || t.pdfUrl || null,
        source: 'House Clerk — STOCK Act PTR',
      }))

      // ── Senate EFTS trades ─────────────────────────────────────────────────
      let senateTrades = []
      if (isSenator && lastName && /^[a-z\s\-']+$/.test(lastName)) {
        try {
          const senRes = await fetch(
            `https://efts.senate.gov/LATEST/search-index?q=%22${encodeURIComponent(lastName)}%22&df=senator_name&fq=report_types:ptr&dateFrom=2020-01-01`,
            { next: { revalidate: 86400 } }
          )
          if (senRes.ok) {
            const senJson = await senRes.json()
            senateTrades = (senJson.hits?.hits || [])
              .filter(h => (h._source?.senator_name || '').toLowerCase().includes(lastName))
              .slice(0, 20)
              .map(h => ({
                date: h._source?.transaction_date || h._source?.date_received || '',
                asset: h._source?.asset_name || 'Unknown Asset',
                ticker: h._source?.ticker || null,
                type: /purchase/i.test(h._source?.transaction_type || '') ? 'BUY' : 'SELL',
                amount: h._source?.amount || 'Undisclosed',
                sector: h._source?.asset_type || 'Stock/Security',
                docUrl: h._source?.link || null,
                source: 'Senate.gov — STOCK Act PTR',
              }))
          }
        } catch { /* optional */ }
      }

      const allTrades = [...normalizedHouse, ...senateTrades]
        .filter(t => t.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      const buys = allTrades.filter(t => t.type === 'BUY').length
      const sells = allTrades.filter(t => t.type === 'SELL').length
      const topTickers = [...new Set(allTrades.map(t => t.ticker).filter(Boolean))].slice(0, 5)

      return NextResponse.json({
        trades: allTrades, buys, sells, topTickers,
        isSenator, disclosureUrl,
        source: allTrades.length > 0 ? 'live' : 'none',
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
        const latestTerm = (m?.terms?.item || []).slice(-1)[0]
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
    return NextResponse.json(
      { error: 'An error occurred fetching data.', members: [], votes: [], trades: [] },
      { status: 500 }
    )
  }
}