import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sectorsForCommittee, tickerMatchesCommittee } from '../../../lib/committeeSectors'
import { currentCongress, congressToStartYear } from '../../../lib/congressSession'
import { getProStatus } from '../../../lib/requirePro'

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
//
// Pro gate (D-003, option B, 2026-09-03): the score/tier summary and the
// "no data" / "none flagged" states are intentionally free — see the
// component comment in CivicWatch.jsx above this section's render. The
// paid content is the flagged-trade detail (which ticker, which committee).
// That detail used to be blurred client-side only via CSS, while the full
// list was still sitting in the JSON response — readable by anyone who
// opened dev tools, not just a UI bypass. This uses the soft check
// (getProStatus, not requirePro) so free/anonymous callers keep getting the
// score and tier exactly as before; only `flaggedTrades` is redacted
// server-side for non-Pro callers.

const BIOGUIDE_RE = /^[A-Z]\d{6}$/

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Committee seats for a member, from public.committee_memberships.
 *
 * This used to call Congress.gov /member/{bioguideId} and read
 * `terms[].memberOf[]`. That field does not exist in the v3 response — see the
 * official MemberEndpoint docs — so the loop never ran and this function
 * returned [] for every member in Congress. With no committees, the scorer
 * below had nothing to match trades against and answered "None flagged" for
 * everyone, with a 200 and no error anywhere. Congress.gov exposes no
 * per-member committee endpoint, so the data now comes from the
 * unitedstates/congress-legislators dataset via scripts/ingest-committees.mjs.
 *
 * Tenure is the current Congress only, because the upstream file is a snapshot
 * with no history. That is enforced here rather than assumed: `congress` is
 * both the query filter and the source of the returned year window.
 */
async function fetchCommitteesWithTenure(supabase, bioguideId, congress) {
  const { data, error } = await supabase
    .from('committee_memberships')
    .select('committee_name, subcommittee_name, match_name, chamber, title, congress')
    .eq('bioguide_id', bioguideId)
    .eq('congress', congress)

  if (error) {
    console.error('conflict-score committee lookup failed:', error.message)
    return []
  }

  const startYear = congressToStartYear(congress)
  return (data || []).map((c) => ({
    name: c.match_name,
    committeeName: c.committee_name,
    subcommitteeName: c.subcommittee_name,
    chamber: c.chamber,
    title: c.title,
    tenureStartYear: startYear,
    tenureEndYear: startYear + 1,
    sectors: sectorsForCommittee(c.match_name).map((s) => s.sector),
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

  const { isPro } = await getProStatus()

  try {
    const supabase = getSupabase()
    const congress = currentCongress()
    const [committees, trades] = await Promise.all([
      fetchCommitteesWithTenure(supabase, bioguideId, congress),
      fetchTradesForBioguide(supabase, bioguideId),
    ])

    const relevantCommittees = committees.filter((c) => c.sectors.length > 0)

    // Only trades inside the scored window can ever be flagged. Counting the
    // rest as "reviewed" would overstate the work the score represents.
    const windowStartYear = congressToStartYear(congress)
    const inWindow = (t) => t.year != null && t.year >= windowStartYear && t.year <= windowStartYear + 1
    const eligibleTrades = trades.filter((t) => t.ticker && inWindow(t))

    const flagged = []
    for (const trade of eligibleTrades) {
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
    // A score of 0 means two very different things and they must not be
    // conflated: "we checked this member's trades and found no overlap" vs.
    // "we have no resolved trades for this member to check in the first
    // place" (bioguide_id backfill gap, or a member who simply hasn't filed
    // this Congress). Collapsing both into "None flagged" told a paying
    // subscriber "clean bill of health" when the honest answer for the
    // second case is "we don't know." trades.length (not eligibleTrades,
    // which is windowed to the current Congress) is the right test — a
    // member with only prior-Congress trades on file still has data, just
    // none in the scored window.
    const hasAnyTradeData = trades.length > 0
    const tier = !hasAnyTradeData
      ? 'No trade data on file'
      : score === 0 ? 'None flagged' : score <= 2 ? 'Low' : score <= 5 ? 'Medium' : 'High'

    return NextResponse.json({
      bioguideId,
      score,
      tier,
      hasAnyTradeData,
      congress,
      scoredYears: [windowStartYear, windowStartYear + 1],
      committees: relevantCommittees.map(({ name, committeeName, subcommitteeName, chamber, title, tenureStartYear, tenureEndYear, sectors }) => ({
        name, committeeName, subcommitteeName, chamber, title, tenureStartYear, tenureEndYear, sectors,
      })),
      // Redacted, not omitted: the key stays present with an empty array so
      // the client doesn't need to special-case a missing field, it just
      // has nothing to render in the unlocked branch.
      flaggedTrades: isPro ? flagged : [],
      totalTradesReviewed: eligibleTrades.length,
      totalTradesOnFile: trades.length,
      methodology: !hasAnyTradeData
        ? `We don't yet have this member's trade disclosures matched to their record — this is a data ` +
          `coverage gap, not a clean bill of health. Check back as ingestion catches up, or see the ` +
          `member's raw filings if any are listed above.`
        :
        `Flags a trade when its ticker falls in a sector overseen by a committee the member sat on, ` +
        `and the trade was made during the ${congress}th Congress (${windowStartYear}–${windowStartYear + 1}). ` +
        `Committee rosters come from the unitedstates/congress-legislators dataset, which records current ` +
        `assignments only — so trades from earlier Congresses are shown under "on file" but deliberately ` +
        `not scored, rather than being matched against a seat the member may not have held at the time. ` +
        `This is a jurisdiction/timing overlap, not proof of misconduct or nonpublic information — treat it ` +
        `as a starting point for further reading, not a verdict.`,
    }, {
      // Was a shared public cache — fine when every caller got the same
      // body. Now the body depends on Pro status, so a cached Pro response
      // could leak flagged-trade detail to the next free caller (or a
      // cached free response could wrongly withhold it from a Pro one).
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (err) {
    console.error('conflict-score error:', err.message)
    return NextResponse.json({ error: 'Failed to compute conflict score' }, { status: 500 })
  }
}
