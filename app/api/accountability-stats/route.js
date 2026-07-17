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

async function fetchCurrentPartyByName() {
  if (!CONGRESS_KEY) return {}
  try {
    const pages = await Promise.all([0, 250, 500].map((offset) =>
      fetch(`${CONGRESS_BASE}/member?format=json&limit=250&offset=${offset}&currentMember=true&api_key=${CONGRESS_KEY}`, {
        next: { revalidate: 21600 },
      }).then((r) => (r.ok ? r.json() : { members: [] })).catch(() => ({ members: [] }))
    ))
    const byName = {}
    for (const page of pages) {
      for (const m of page.members || []) {
        const party = m.partyName === 'Democratic' ? 'Democrat' : m.partyName
        if (!m.name || !party) continue
        const comma = m.name.indexOf(',')
        if (comma <= 0) continue
        const last = m.name.slice(0, comma).trim().toLowerCase()
        byName[last] = party
      }
    }
    return byName
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()

    const [
      { data: houseTraders },
      { data: senTraders },
      { data: allHouseTrades },
      { data: allSenTrades },
      partyByLastName,
    ] = await Promise.all([
      supabase.from('fd_filings').select('last_name').eq('filing_type', 'P'),
      supabase.from('senate_trades').select('last_name'),
      supabase.from('fd_trades').select('ticker, transaction_date, amount_min, amount_max'),
      supabase.from('senate_trades').select('ticker, transaction_date, amount_min, amount_max'),
      fetchCurrentPartyByName(),
    ])

    // ── Distinct traders + party split ──────────────────────────────────────
    const distinctLastNames = new Set([
      ...(houseTraders || []).map((r) => (r.last_name || '').toLowerCase()),
      ...(senTraders || []).map((r) => (r.last_name || '').toLowerCase()),
    ])
    distinctLastNames.delete('')

    const partyCounts = { Democrat: 0, Republican: 0, Other: 0 }
    for (const last of distinctLastNames) {
      const party = partyByLastName[last]
      if (party === 'Democrat') partyCounts.Democrat++
      else if (party === 'Republican') partyCounts.Republican++
      else partyCounts.Other++
    }

    const tradersCount = distinctLastNames.size
    const tradersPct = Math.round((tradersCount / TOTAL_MEMBERS) * 100)

    // ── Trade volume by month (last 12 months) + top tickers ───────────────
    const allTrades = [...(allHouseTrades || []), ...(allSenTrades || [])]
    const now = new Date()
    const monthBuckets = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      monthBuckets.push({ key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, volume: 0, count: 0 })
    }
    const bucketByKey = Object.fromEntries(monthBuckets.map((b) => [b.key, b]))

    const tickerCounts = new Map()
    let totalVolumeYtd = 0
    const yearNow = now.getUTCFullYear()

    for (const t of allTrades) {
      if (!t.transaction_date) continue
      const key = t.transaction_date.slice(0, 7)
      const midpoint = t.amount_min != null ? (t.amount_min + (t.amount_max ?? t.amount_min)) / 2 : 0
      if (bucketByKey[key]) {
        bucketByKey[key].volume += midpoint
        bucketByKey[key].count++
      }
      if (t.transaction_date.startsWith(String(yearNow))) {
        totalVolumeYtd += midpoint
      }
      const tk = (t.ticker || '').toUpperCase().trim()
      if (tk) tickerCounts.set(tk, (tickerCounts.get(tk) || 0) + 1)
    }

    const topTickers = [...tickerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([ticker, count]) => ({ ticker, count }))

    return NextResponse.json({
      totalMembers: TOTAL_MEMBERS,
      tradersCount,
      tradersPct,
      nonTradersCount: TOTAL_MEMBERS - tradersCount,
      partyCounts,
      totalVolumeYtd: Math.round(totalVolumeYtd),
      totalTradesAllTime: allTrades.length,
      monthlyVolume: monthBuckets.map((b) => ({ ...b, volume: Math.round(b.volume) })),
      topTickers,
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
