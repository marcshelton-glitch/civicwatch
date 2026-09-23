import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/accountability-stats
//
// A live version of the kind of aggregate figure Campaign Legal Center
// publishes as a static, irregularly-updated PDF ("53% of the 117th Congress
// owned individual stock..."). None of the six trading-focused competitors
// researched (Capitol Trades, QuiverQuant, InsiderFinance, Barchart, Unusual
// Whales, plus the CLC report itself) publish this as a live, continuously
// updated product — this route recomputes it from CivicWatch's own ingested
// STOCK Act data on every request (cached at the edge for 30 min).
//
// IMPORTANT — this measures a narrower thing than the CLC report and says so:
// CLC's "% who own stock" comes from Schedule A of the *annual* financial
// disclosure (all holdings, including buy-and-hold positions never traded).
// CivicWatch's pipeline ingests *periodic transaction reports* (PTRs) —
// disclosed buys/sells/exchanges — not the annual asset schedule. So this
// reports "% of Congress with at least one disclosed stock trade," a real
// and honestly-labeled number, not a restatement of CLC's own metric.

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONGRESS_BASE = 'https://api.congress.gov/v3'
const CONGRESS_KEY = process.env.CONGRESS_API_KEY
const TOTAL_MEMBERS = 535

// bioguideId -> party for every current member. Keyed by bioguide id, not
// surname, so two members named Smith no longer collapse into one.
async function fetchCurrentPartyByBioguide() {
  if (!CONGRESS_KEY) return {}
  try {
    const pages = await Promise.all([0, 250, 500].map((offset) =>
      fetch(`${CONGRESS_BASE}/member?format=json&limit=250&offset=${offset}&currentMember=true&api_key=${CONGRESS_KEY}`, {
        next: { revalidate: 21600 },
      }).then((r) => (r.ok ? r.json() : { members: [] })).catch(() => ({ members: [] }))
    ))
    const byId = {}
    for (const page of pages) {
      for (const m of page.members || []) {
        if (!m.bioguideId) continue
        byId[m.bioguideId] = m.partyName === 'Democratic' ? 'Democrat' : (m.partyName || 'Other')
      }
    }
    return byId
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Aggregation runs in Postgres (see migration 20260922000002). Pulling the
    // tables through PostgREST capped each select at 1,000 rows, which is how
    // "Trades on file" read 2,000 and every other figure here was truncated.
    const [{ data: stats, error }, partyById] = await Promise.all([
      supabase.rpc('accountability_stats'),
      fetchCurrentPartyByBioguide(),
    ])
    if (error) throw error

    // Traders = current members with at least one disclosed PTR on file.
    const currentIds = Object.keys(partyById)
    const traderIds = new Set(stats.trader_ids || [])
    const partyCounts = { Democrat: 0, Republican: 0, Other: 0 }
    let tradersCount = 0
    for (const id of currentIds) {
      if (!traderIds.has(id)) continue
      tradersCount++
      const party = partyById[id]
      if (party === 'Democrat') partyCounts.Democrat++
      else if (party === 'Republican') partyCounts.Republican++
      else partyCounts.Other++
    }
    const tradersPct = Math.round((tradersCount / TOTAL_MEMBERS) * 100)

    return NextResponse.json({
      totalMembers: TOTAL_MEMBERS,
      tradersCount,
      tradersPct,
      nonTradersCount: TOTAL_MEMBERS - tradersCount,
      partyCounts,
      totalVolumeYtd: Number(stats.volume_ytd) || 0,
      totalTradesAllTime: Number(stats.total_trades) || 0,
      monthlyVolume: (stats.monthly || []).map((b) => ({ key: b.key, volume: Number(b.volume) || 0, count: Number(b.count) || 0 })),
      topTickers: (stats.top_tickers || []).map((t) => ({ ticker: t.ticker, count: Number(t.count) })),
      updated: new Date().toISOString(),
      methodology: '"Traders" = members of the current Congress with at least one disclosed STOCK Act periodic transaction report on file with CivicWatch — not the broader "owns any stock or fund" figure used in some annual-disclosure studies, which also counts buy-and-hold positions that were never actively traded.',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('accountability-stats error:', err.message)
    return NextResponse.json({ error: 'Failed to compute accountability stats' }, { status: 500 })
  }
}
