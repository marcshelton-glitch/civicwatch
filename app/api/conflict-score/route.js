import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sectorsForCommittee, tickerMatchesCommittee } from '../../../lib/committeeSectors'

// GET /api/conflict-score?bioguideId=P000197
//
// CivicWatch's vote-trade conflict score — no competitor researched (Capitol
// Trades, QuiverQuant, InsiderFinance, Barchart, Unusual Whales) actually
// scores or flags trades against committee jurisdiction; at most they show
// committee membership as a separate fact next to a trade list. This route
// cross-references a member's committee assignments (with tenure dates)
// against their disclosed trades and flags trades in a ticker whose sector
// overlaps a committee they served on at the time of the trade.
//
// See lib/committeeSectors.js for the full methodology disclosure — this is
// a jurisdiction/timing overlap heuristic, not proof of misconduct.

const BASE = 'https://api.congress.gov/v3'
const KEY = process.env.CONGRESS_API_KEY
const BIOGUIDE_RE = /^[A-Z]\d{6}$/

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Congress N started in the year 1789 + (N-1)*2, and covers that year plus the next.
const congressToStartYear = (n) => 1789 + (n - 1) * 2

async function fetchCommitteesWithTenure(bioguideId) {
  if (!KEY) return []
  const res = await fetch(`${BASE}/member/${bioguideId}?format=json&api_key=${KEY}`, {
    next: { revalidate: 21600 },
  })
  if (!res.ok) return []
  const json = await res.json()
  const terms = json.member?.terms || []
  const byName = {}
  for (const term of terms) {
    const congress = term.congress
    for (const c of (term.memberOf || [])) {
      if (!c.name) continue
      if (!byName[c.name]) {
        byName[c.name] = { name: c.name, chamber: c.chamber, startCongress: congress, endCongress: congress }
      } else {
        if (congress < byName[c.name].startCongress) byName[c.name].startCongress = congress
        if (congress > byName[c.name].endCongress) byName[c.name].endCongress = congress
      }
    }
  }
  return Object.values(byName).map((c) => ({
    ...c,
    tenureStartYear: congressToStartYear(c.startCongress),
    tenureEndYear: congressToStartYear(c.endCongress) + 1,
    sectors: sectorsForCommittee(c.name).map((s) => s.sector),
  }))
}

async function fetchTradesForBioguide(supabase, bioguideId) {
  const [{ data: houseTrades }, { data: senTrades }] = await Promise.all([
    supabase
      .from('fd_trades')
      .select('transaction_date, asset_name, ticker, transaction_type, amount_str, doc_id, year')
      .eq('bioguide_id', bioguideId)
      .not('ticker', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(200),
    supabase
      .from('senate_trades')
      .select('transaction_date, asset_name, ticker, transaction_type, amount_str, ptr_url')
      .eq('bioguide_id', bioguideId)
      .not('ticker', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(200),
  ])

  const normalize = (t, chamber) => ({
    chamber,
    date: t.transaction_date,
    year: t.transaction_date ? parseInt(t.transaction_date.slice(0, 4), 10) : null,
    asset: t.asset_name,
    ticker: t.ticker,
    type: t.transaction_type === 'Purchase' ? 'BUY' : t.transaction_type === 'Sale' ? 'SELL' : (t.transaction_type || 'OTHER').toUpperCase(),
    amount: t.amount_str || 'Undisclosed',
    docUrl: chamber === 'house'
      ? (t.doc_id && t.year ? `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${t.year}/${t.doc_id}.pdf` : null)
      : (t.ptr_url || null),
  })

  return [
    ...(houseTrades || []).map((t) => normalize(t, 'house')),
    ...(senTrades || []).map((t) => normalize(t, 'senate')),
  ]
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const bioguideId = (searchParams.get('bioguideId') || '').trim().toUpperCase()

  if (!BIOGUIDE_RE.test(bioguideId)) {
    return NextResponse.json({ error: 'Valid bioguideId required' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()
    const [committees, trades] = await Promise.all([
      fetchCommitteesWithTenure(bioguideId),
      fetchTradesForBioguide(supabase, bioguideId),
    ])

    const relevantCommittees = committees.filter((c) => c.sectors.length > 0)

    const flagged = []
    for (const trade of trades) {
      if (!trade.ticker || !trade.year) continue
      for (const committee of relevantCommittees) {
        const inTenure = trade.year >= committee.tenureStartYear && trade.year <= committee.tenureEndYear
        if (inTenure && tickerMatchesCommittee(trade.ticker, committee.name)) {
          flagged.push({
            ...trade,
            committeeName: committee.name,
            sector: sectorsForCommittee(committee.name).find((s) => s.tickers.includes(trade.ticker.toUpperCase()))?.sector || null,
          })
          break // one flag per trade is enough — avoid double-counting multi-committee overlap
        }
      }
    }

    const score = flagged.length
    const tier = score === 0 ? 'None flagged' : score <= 2 ? 'Low' : score <= 5 ? 'Medium' : 'High'

    return NextResponse.json({
      bioguideId,
      score,
      tier,
      committees: relevantCommittees.map(({ name, chamber, tenureStartYear, tenureEndYear, sectors }) => ({
        name, chamber, tenureStartYear, tenureEndYear, sectors,
      })),
      flaggedTrades: flagged,
      totalTradesReviewed: trades.length,
      methodology: 'Flags a trade when its ticker falls in a sector overseen by a committee the member served on at the time of the trade. This is a jurisdiction/timing overlap, not proof of misconduct or nonpublic information — treat it as a starting point for further reading, not a verdict.',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('conflict-score error:', err.message)
    return NextResponse.json({ error: 'Failed to compute conflict score' }, { status: 500 })
  }
}
