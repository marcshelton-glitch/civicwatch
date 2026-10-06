#!/usr/bin/env node
/**
 * Unusual Whales API — trial evaluation (READ-ONLY).
 *
 * Purpose: during the API Basic 7-day trial, measure whether UW's congressional
 * data is good enough to replace/augment our own House Clerk + Senate eFD
 * ingest, and how many requests a real sync costs (for the licensing talk).
 *
 * It NEVER writes to Supabase and nothing it produces is shown to users —
 * the trial license is individual-use only. Raw UW data is written to
 * .local/uw-trial/ (gitignored) and must not be committed or deployed.
 *
 * Tests:
 *   1. Coverage/accuracy — for a sample of our most active members, pull their
 *      UW trades and match against fd_trades / senate_trades
 *      (ticker + transaction date + buy/sell, with a ±3-day near-match pass).
 *   2. Identity mapping — does UW resolve our member names? Saves a
 *      bioguide_id → UW politician_id map.
 *   3. Filing-date agreement and amount-range agreement on matched trades.
 *   4. Freshness (--snapshot, run once a day) — logs UW recent-trades and
 *      records when each filing first appears, and whether we already had it.
 *   5. Prices (--prices) — UW daily OHLC close vs Stooq for top tickers.
 *   6. Request accounting — counts every call, extrapolates to all 535 members.
 *
 * Setup: add UW_API_KEY=... to .env.local
 *
 * Usage:
 *   npm run uw:trial                       # tests 1-3 + 6, 25 members, 365 days
 *   npm run uw:trial -- --snapshot         # also run the freshness snapshot
 *   npm run uw:trial -- --prices           # also run the price comparison
 *   npm run uw:trial -- --members=40 --days=730
 *   npm run uw:trial -- --db-only          # no UW calls; just check our sample
 *
 * Output: .local/uw-trial/report-YYYY-MM-DD.md (+ raw JSON alongside)
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  })
)
const MEMBERS = Number(args.members ?? 25)
const DAYS = Number(args.days ?? 365)
const DB_ONLY = Boolean(args['db-only'])
const OUT_DIR = path.resolve('.local/uw-trial')
const UW_BASE = 'https://api.unusualwhales.com'
const UW_KEY = process.env.UW_API_KEY
const TOTAL_MEMBERS = 535

if (!DB_ONLY && !UW_KEY) {
  console.error('Missing UW_API_KEY. Add UW_API_KEY=... to .env.local (or run with --db-only).')
  process.exit(1)
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
fs.mkdirSync(OUT_DIR, { recursive: true })
const now = new Date()
const today = now.toISOString().slice(0, 10)
const since = new Date(now.getTime() - DAYS * 864e5).toISOString().slice(0, 10)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── UW client with request accounting ───────────────────────────────────────
const stats = { requests: 0, byEndpoint: {}, statuses: {}, totalMs: 0, rateHeaders: {} }

async function uw(pathname, params = {}) {
  const url = new URL(pathname, UW_BASE)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  const ep = pathname.replace(/^\/api\/stock\/[^/]+/, '/api/stock/{ticker}')
  for (let attempt = 0; attempt < 4; attempt++) {
    const t0 = Date.now()
    const res = await fetch(url, { headers: { Authorization: `Bearer ${UW_KEY}`, Accept: 'application/json' } })
    stats.requests++
    stats.totalMs += Date.now() - t0
    stats.byEndpoint[ep] = (stats.byEndpoint[ep] || 0) + 1
    stats.statuses[res.status] = (stats.statuses[res.status] || 0) + 1
    res.headers.forEach((v, k) => {
      if (/^x-uw|ratelimit|x-rate/i.test(k)) stats.rateHeaders[k] = v
    })
    if (res.status === 429) {
      await sleep(2000 * 2 ** attempt)
      continue
    }
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`UW ${res.status} ${pathname}: ${body.slice(0, 200)}`)
    }
    await sleep(200) // be polite; well under any plan's limits
    const json = await res.json()
    return Array.isArray(json) ? json : json.data ?? json
  }
  throw new Error(`UW rate-limited repeatedly on ${pathname}`)
}

// ── Normalizers ─────────────────────────────────────────────────────────────
const normType = (t) => {
  const s = String(t || '').toLowerCase().trim()
  if (/exch/.test(s)) return 'EXCH'
  if (/buy|purchase|^p$/.test(s)) return 'BUY'
  if (/sell|sale|^s$|^s \(/.test(s)) return 'SELL'
  return s.toUpperCase() || '?'
}
const normTicker = (t) => String(t || '').toUpperCase().replace(/[^A-Z.]/g, '')
const parseMin = (s) => {
  const m = String(s || '').replace(/,/g, '').match(/\d+/)
  return m ? Number(m[0]) : null
}
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5)
const cleanFirst = (s) => String(s || '').replace(/\b(hon|mr|mrs|ms|dr)\.?\s*/gi, '').replace(/[.,]/g, '').trim()
const cleanLast = (s) => String(s || '').replace(/,?\s*\b(jr|sr|ii|iii|iv)\.?$/i, '').replace(/[.,]/g, '').trim()
const median = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a')

// ── Load our trades (read-only) ─────────────────────────────────────────────
async function fetchAll(table, select) {
  const rows = []
  const size = 1000
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .gte('transaction_date', since)
      .order('id')
      .range(from, from + size - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...data)
    if (data.length < size) break
  }
  return rows
}

console.log(`Loading our trades since ${since}…`)
const house = (
  await fetchAll('fd_trades', 'first_name,last_name,bioguide_id,transaction_date,ticker,transaction_type,amount_min,fd_filings(filing_date)')
).map((r) => ({ ...r, chamber: 'house', filing_date: r.fd_filings?.filing_date ?? null }))
const senate = (
  await fetchAll('senate_trades', 'first_name,last_name,bioguide_id,transaction_date,ticker,transaction_type,amount_min,filing_date')
).map((r) => ({ ...r, chamber: 'senate' }))
console.log(`  house: ${house.length} rows, senate: ${senate.length} rows`)

// Group by member and pick the most active from each chamber.
const members = new Map()
for (const r of [...house, ...senate]) {
  const key = r.bioguide_id || `${r.chamber}:${r.last_name}|${r.first_name}`
  if (!members.has(key))
    members.set(key, { key, bioguide_id: r.bioguide_id, chamber: r.chamber, first: r.first_name, last: r.last_name, trades: [] })
  members.get(key).trades.push(r)
}
const byChamber = (c) => [...members.values()].filter((m) => m.chamber === c).sort((a, b) => b.trades.length - a.trades.length)
const half = Math.ceil(MEMBERS / 2)
let sample = [...byChamber('house').slice(0, half), ...byChamber('senate').slice(0, MEMBERS - half)]
if (sample.length < MEMBERS) {
  const picked = new Set(sample.map((m) => m.key))
  sample.push(...[...members.values()].filter((m) => !picked.has(m.key)).sort((a, b) => b.trades.length - a.trades.length).slice(0, MEMBERS - sample.length))
}
console.log(`  sample: ${sample.length} members (${sample.filter((m) => m.chamber === 'house').length} House, ${sample.filter((m) => m.chamber === 'senate').length} Senate)`)

if (DB_ONLY) {
  for (const m of sample) console.log(`  ${m.chamber.padEnd(6)} ${m.first} ${m.last} (${m.bioguide_id || 'no bioguide'}) — ${m.trades.length} trades`)
  console.log('\n--db-only: skipping UW calls.')
  process.exit(0)
}

// ── Test 1-3: per-member comparison ─────────────────────────────────────────
async function fetchUwTrader(m) {
  const first = cleanFirst(m.first)
  const last = cleanLast(m.last)
  const variants = [...new Set([`${first} ${last}`, `${first.split(/\s+/)[0]} ${last}`])]
  const before = stats.requests
  for (const name of variants) {
    const rows = []
    for (let page = 0; page < 15; page++) {
      const data = await uw('/api/congress/congress-trader', { name, date_from: since, limit: 200, page })
      rows.push(...data)
      if (data.length < 200) break
    }
    if (rows.length) return { name, rows, requests: stats.requests - before }
  }
  return { name: null, rows: [], requests: stats.requests - before }
}

const results = []
const idMap = {}
for (const [i, m] of sample.entries()) {
  process.stdout.write(`[${i + 1}/${sample.length}] ${m.first} ${m.last}… `)
  let uwRes
  try {
    uwRes = await fetchUwTrader(m)
  } catch (e) {
    console.log(`error: ${e.message}`)
    results.push({ member: m, error: e.message })
    continue
  }
  const ours = m.trades.map((r) => ({
    ticker: normTicker(r.ticker),
    date: r.transaction_date,
    type: normType(r.transaction_type),
    amountMin: r.amount_min,
    filingDate: r.filing_date,
  }))
  const oursComparable = ours.filter((t) => t.ticker && t.date)
  const theirs = uwRes.rows.map((r) => ({
    ticker: normTicker(r.ticker),
    date: r.transaction_date,
    type: normType(r.txn_type),
    amountMin: parseMin(r.amounts),
    filingDate: r.filed_at_date,
    politician_id: r.politician_id,
  }))
  const pid = theirs.find((t) => t.politician_id)?.politician_id
  if (pid && m.bioguide_id) idMap[m.bioguide_id] = pid

  // Exact match pass
  const pool = new Map()
  for (const t of theirs) {
    const k = `${t.ticker}|${t.date}|${t.type}`
    if (!pool.has(k)) pool.set(k, [])
    pool.get(k).push(t)
  }
  const matched = []
  const unmatchedOurs = []
  for (const o of oursComparable) {
    const arr = pool.get(`${o.ticker}|${o.date}|${o.type}`)
    if (arr?.length) matched.push({ o, t: arr.pop(), near: false })
    else unmatchedOurs.push(o)
  }
  // Near-match pass: same ticker + type, within ±3 days
  const onlyOurs = []
  for (const o of unmatchedOurs) {
    let hit = null
    for (const [k, arr] of pool) {
      if (!arr.length || !k.startsWith(`${o.ticker}|`) || !k.endsWith(`|${o.type}`)) continue
      const idx = arr.findIndex((t) => Math.abs(dayDiff(t.date, o.date)) <= 3)
      if (idx >= 0) {
        hit = arr.splice(idx, 1)[0]
        break
      }
    }
    if (hit) matched.push({ o, t: hit, near: true })
    else onlyOurs.push(o)
  }
  const onlyUw = [...pool.values()].flat()

  const withAmounts = matched.filter((x) => x.o.amountMin != null && x.t.amountMin != null)
  const withFiling = matched.filter((x) => x.o.filingDate && x.t.filingDate)
  const r = {
    member: { name: `${m.first} ${m.last}`, chamber: m.chamber, bioguide_id: m.bioguide_id },
    uwName: uwRes.name,
    politician_id: pid ?? null,
    requests: uwRes.requests,
    ours: ours.length,
    oursNoTicker: ours.length - oursComparable.length,
    uw: theirs.length,
    matched: matched.length,
    nearMatched: matched.filter((x) => x.near).length,
    onlyOurs: onlyOurs.length,
    onlyUw: onlyUw.length,
    amountAgree: withAmounts.filter((x) => x.o.amountMin === x.t.amountMin).length,
    amountCompared: withAmounts.length,
    filingAgree: withFiling.filter((x) => Math.abs(dayDiff(x.o.filingDate, x.t.filingDate)) <= 1).length,
    filingCompared: withFiling.length,
    examplesOnlyOurs: onlyOurs.slice(0, 5),
    examplesOnlyUw: onlyUw.slice(0, 5).map(({ politician_id, ...t }) => t),
  }
  results.push(r)
  console.log(uwRes.name ? `ours ${r.ours} / UW ${r.uw} / matched ${r.matched} (${r.requests} req)` : 'NOT FOUND in UW by name')
}

// ── Test 4: freshness snapshot ──────────────────────────────────────────────
let fresh = null
if (args.snapshot) {
  console.log('\nFreshness snapshot (recent-trades)…')
  const seenPath = path.join(OUT_DIR, 'seen.json')
  const seen = fs.existsSync(seenPath) ? JSON.parse(fs.readFileSync(seenPath, 'utf8')) : {}
  const baseline = Object.keys(seen).length === 0
  const recent = await uw('/api/congress/recent-trades', { limit: 200 })
  let added = 0
  for (const r of recent) {
    const k = [r.politician_id, r.ticker, r.transaction_date, r.txn_type, r.amounts].join('|')
    if (seen[k]) continue
    added++
    const entry = {
      first_seen: now.toISOString(),
      filed_at_date: r.filed_at_date,
      transaction_date: r.transaction_date,
      name: r.name,
      ticker: normTicker(r.ticker),
      type: normType(r.txn_type),
      baseline,
    }
    if (!baseline && entry.ticker && entry.transaction_date) {
      const last = cleanLast(String(r.name || '').split(/\s+/).pop()).toLowerCase()
      let weHadIt = false
      for (const table of ['fd_trades', 'senate_trades']) {
        const { data } = await supabase
          .from(table)
          .select('last_name')
          .eq('ticker', entry.ticker)
          .eq('transaction_date', entry.transaction_date)
          .limit(20)
        if (data?.some((d) => String(d.last_name).toLowerCase().includes(last))) weHadIt = true
      }
      entry.we_had_it_at_first_seen = weHadIt
    }
    seen[k] = entry
  }
  fs.writeFileSync(seenPath, JSON.stringify(seen, null, 2))
  const tracked = Object.values(seen).filter((e) => !e.baseline && e.filed_at_date)
  fresh = {
    baseline,
    added,
    tracked: tracked.length,
    medianLagDays: median(tracked.map((e) => dayDiff(e.first_seen.slice(0, 10), e.filed_at_date))),
    uwFirst: tracked.filter((e) => e.we_had_it_at_first_seen === false).length,
    weHadIt: tracked.filter((e) => e.we_had_it_at_first_seen === true).length,
  }
  console.log(baseline ? `  baseline recorded (${added} trades). Run again tomorrow to start measuring.` : `  ${added} new trades since last snapshot`)
}

// ── Test 5: price comparison ────────────────────────────────────────────────
let prices = null
if (args.prices) {
  console.log('\nPrice comparison (UW 1d OHLC vs Stooq)…')
  const counts = {}
  for (const m of sample) for (const t of m.trades) { const k = normTicker(t.ticker); if (k) counts[k] = (counts[k] || 0) + 1 }
  const tickers = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)
  prices = []
  for (const t of tickers) {
    let uwClose = null
    let stooqClose = null
    try {
      const candles = await uw(`/api/stock/${t}/ohlc/1d`, { timeframe: '1M' })
      const lastC = Array.isArray(candles) ? candles[candles.length - 1] : null // daily = oldest-first
      uwClose = lastC ? Number(lastC.close) : null
    } catch {}
    try {
      const res = await fetch(`https://stooq.com/q/l/?s=${t.toLowerCase()}.us&f=sd2t2ohlcv&h&e=csv`)
      const cols = (await res.text()).trim().split('\n')[1]?.split(',')
      stooqClose = cols && !Number.isNaN(Number(cols[6])) ? Number(cols[6]) : null
    } catch {}
    prices.push({ ticker: t, uwClose, stooqClose, diffPct: uwClose && stooqClose ? ((100 * (uwClose - stooqClose)) / stooqClose).toFixed(2) : null })
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const ok = results.filter((r) => !r.error)
const found = ok.filter((r) => r.uwName)
const sum = (k) => ok.reduce((a, r) => a + (r[k] || 0), 0)
const memberReqs = ok.reduce((a, r) => a + r.requests, 0)
const reqPerMember = ok.length ? memberReqs / ok.length : 0
const L = []
L.push(`# Unusual Whales trial evaluation — ${today}`, '')
L.push(`Window: trades since ${since} (${DAYS} days). Sample: ${sample.length} most active members. Read-only; nothing written to Supabase.`, '')
L.push('## Coverage & accuracy', '')
L.push(`- Members resolved by name in UW: **${found.length}/${ok.length}** (${pct(found.length, ok.length)})`)
L.push(`- Our trades: ${sum('ours')} (${sum('oursNoTicker')} without a ticker, not comparable)`)
L.push(`- UW trades for the same members: ${sum('uw')}`)
L.push(`- Matched: **${sum('matched')}** (${sum('nearMatched')} within ±3 days) → ${pct(sum('matched'), sum('ours') - sum('oursNoTicker'))} of our comparable trades`)
L.push(`- Only in ours: ${sum('onlyOurs')} · Only in UW: **${sum('onlyUw')}** (possible gaps in our ingest — spot-check below)`)
L.push(`- Amount range agrees: ${pct(sum('amountAgree'), sum('amountCompared'))} of ${sum('amountCompared')} compared`)
L.push(`- Filing date agrees (±1 day): ${pct(sum('filingAgree'), sum('filingCompared'))} of ${sum('filingCompared')} compared`, '')
L.push('| Member | Chamber | UW name | Ours | UW | Matched | Only ours | Only UW | Req |', '|---|---|---|---|---|---|---|---|---|')
for (const r of results) {
  if (r.error) L.push(`| ${r.member.first} ${r.member.last} | ${r.member.chamber} | error: ${r.error.slice(0, 60)} | | | | | | |`)
  else L.push(`| ${r.member.name} | ${r.member.chamber} | ${r.uwName ?? '**not found**'} | ${r.ours} | ${r.uw} | ${r.matched} | ${r.onlyOurs} | ${r.onlyUw} | ${r.requests} |`)
}
L.push('', '## Identity mapping', '')
L.push(`- ${Object.keys(idMap).length} bioguide_id → UW politician_id pairs saved to \`uw-id-map.json\`.`)
const missing = ok.filter((r) => !r.uwName).map((r) => r.member.name)
if (missing.length) L.push(`- Not found by name (need an alias table): ${missing.join(', ')}`)
if (fresh) {
  L.push('', '## Freshness', '')
  if (fresh.baseline) L.push('- Baseline recorded today. Re-run with `--snapshot` daily for the rest of the trial.')
  else {
    L.push(`- Trades tracked since baseline: ${fresh.tracked} (${fresh.added} new today)`)
    L.push(`- Median days from filing to appearing in UW: **${fresh.medianLagDays ?? 'n/a'}**`)
    L.push(`- UW had it before we did: **${fresh.uwFirst}** · We already had it: ${fresh.weHadIt}`)
  }
}
if (prices) {
  L.push('', '## Prices (latest daily close)', '', '| Ticker | UW | Stooq | Diff % |', '|---|---|---|---|')
  for (const p of prices) L.push(`| ${p.ticker} | ${p.uwClose ?? '—'} | ${p.stooqClose ?? '—'} | ${p.diffPct ?? '—'} |`)
}
L.push('', '## Request usage (for the licensing conversation)', '')
L.push(`- Requests this run: **${stats.requests}** · avg latency ${stats.requests ? Math.round(stats.totalMs / stats.requests) : 0} ms`)
L.push(`- By endpoint: ${Object.entries(stats.byEndpoint).map(([k, v]) => `\`${k}\` ${v}`).join(', ')}`)
L.push(`- HTTP statuses: ${Object.entries(stats.statuses).map(([k, v]) => `${k}×${v}`).join(', ')}`)
if (Object.keys(stats.rateHeaders).length) L.push(`- Rate-limit headers seen: ${Object.entries(stats.rateHeaders).map(([k, v]) => `\`${k}: ${v}\``).join(', ')}`)
L.push(`- Avg requests per member (${DAYS}-day pull): ${reqPerMember.toFixed(1)}`)
L.push(`- **Estimated full backfill, all ${TOTAL_MEMBERS} members: ~${Math.ceil(reqPerMember * TOTAL_MEMBERS)} requests** (one-time)`)
L.push(`- Estimated daily incremental sync: ~1–5 requests polling recent-trades, or ~${Math.ceil(reqPerMember * TOTAL_MEMBERS)} if re-pulling every member daily`)
L.push('', '## Spot-check examples', '')
for (const r of found.filter((r) => r.examplesOnlyUw.length || r.examplesOnlyOurs.length).slice(0, 10)) {
  L.push(`**${r.member.name}**`)
  for (const t of r.examplesOnlyUw) L.push(`- only UW: ${t.ticker} ${t.type} ${t.date} (filed ${t.filingDate})`)
  for (const t of r.examplesOnlyOurs) L.push(`- only ours: ${t.ticker} ${t.type} ${t.date}`)
  L.push('')
}
L.push('---', '_Trial data is licensed for individual use only. Do not commit, deploy, or show to users._')

const reportPath = path.join(OUT_DIR, `report-${today}.md`)
fs.writeFileSync(reportPath, L.join('\n'))
fs.writeFileSync(path.join(OUT_DIR, `results-${today}.json`), JSON.stringify({ results, stats, fresh, prices }, null, 2))
fs.writeFileSync(path.join(OUT_DIR, 'uw-id-map.json'), JSON.stringify(idMap, null, 2))
console.log(`\nDone. ${stats.requests} UW requests. Report: ${path.relative(process.cwd(), reportPath)}`)
