/**
 * Backfill bioguide_id on fd_trades (and, as a side effect, fd_filings).
 *
 * ── Why ───────────────────────────────────────────────────────────────────
 * fd_trades.bioguide_id was NULL on all 5,076 rows. /api/conflict-score joins
 * a member's committee assignments to their trades on that column, so the
 * scorer reviewed zero trades for every member in Congress and returned
 * `{ score: 0, tier: "None flagged", totalTradesReviewed: 0 }` — a 200 response
 * that reads as a finding of innocence rather than a missing join. Nothing
 * errored, so nothing surfaced in Sentry.
 *
 * ── Two passes, most trustworthy first ────────────────────────────────────
 *   Pass 1 — doc_id join. Every trade carries the doc_id of the PTR it was
 *     parsed out of, and fd_filings already resolves 4,594 of those to a
 *     bioguide. This is an exact identity link, not a guess: no API calls, no
 *     name matching, no ambiguity. Covers ~47% of trades on current data.
 *
 *   Pass 2 — name + state match against the Congress.gov member list, reusing
 *     the normalisation rules proven in scripts/backfill-bioguide.js (suffix
 *     stripping, compound surnames like "McMorris Rodgers", hyphenated names
 *     like "Kamlager-Dove", first-name disambiguation, senator-vs-rep
 *     tie-break). Anything still ambiguous is left NULL and reported — for an
 *     accountability product, attributing a trade to the wrong member is far
 *     worse than attributing it to nobody.
 *
 * Resolutions found in pass 2 are also written back to fd_filings, so the next
 * run's pass 1 covers more and the expensive path shrinks over time.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────
 *   node --env-file=.env.local scripts/backfill-trades-bioguide.mjs           # dry run
 *   node --env-file=.env.local scripts/backfill-trades-bioguide.mjs --apply   # write
 *
 * Dry run is the default on purpose. Read the report before writing.
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CONGRESS_API_KEY.
 */

import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const STATE_CODES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
  'American Samoa': 'AS', 'Guam': 'GU', 'Northern Mariana Islands': 'MP',
  'Puerto Rico': 'PR', 'Virgin Islands': 'VI',
}

const normalizeLastName = (name) =>
  (name || '')
    .replace(/,?\s+(Jr\.?|Sr\.?|II+|IV|V|Esq\.?)$/i, '')
    .replace(/[^A-Z]/gi, '')
    .toUpperCase()

const normalizeFirstName = (name) =>
  (name || '').trim().split(/\s+/)[0].replace(/[^A-Z]/gi, '').toUpperCase()

// ── Fetch every row of a table in pages ─────────────────────────────────────
// Supabase caps a single select at 1,000 rows; fd_filings has 40k.
async function selectAll(table, columns, filter = (q) => q) {
  const out = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await filter(
      supabase.from(table).select(columns)
    ).range(from, from + PAGE - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...data)
    if (data.length < PAGE) break
  }
  return out
}

async function fetchAllMembers() {
  if (!CONGRESS_API_KEY) {
    console.warn('! CONGRESS_API_KEY unset — skipping pass 2 (name matching)')
    return null
  }
  const members = []
  const pageSize = 250
  process.stdout.write('Fetching Congress.gov member list')
  for (let offset = 0; offset < 3000; offset += pageSize) {
    const url = `https://api.congress.gov/v3/member?limit=${pageSize}&offset=${offset}&api_key=${CONGRESS_API_KEY}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Congress API ${resp.status}`)
    const page = (await resp.json()).members || []
    members.push(...page)
    process.stdout.write('.')
    if (page.length < pageSize) break
    await new Promise(r => setTimeout(r, 100))
  }
  console.log(` ${members.length} members`)
  return members
}

function buildLookup(members) {
  const byLastState = {}
  const add = (key, entry) => {
    if (!byLastState[key]) byLastState[key] = []
    if (!byLastState[key].find(e => e.bioguideId === entry.bioguideId)) {
      byLastState[key].push(entry)
    }
  }

  for (const m of members) {
    const stateCode = STATE_CODES[m.state]
    if (!stateCode) continue
    const rawLast = m.name.split(',')[0].trim()
    const entry = { bioguideId: m.bioguideId, fullName: m.name, district: m.district }

    const lastName = normalizeLastName(rawLast)
    add(`${lastName}-${stateCode}`, entry)

    // "McMorris Rodgers" → also index RODGERS
    const words = rawLast.split(/\s+/)
    if (words.length > 1) {
      const lastWord = normalizeLastName(words[words.length - 1])
      if (lastWord !== lastName) add(`${lastWord}-${stateCode}`, entry)
    }
    // "Kamlager-Dove" → also index KAMLAGER
    if (rawLast.includes('-')) {
      const prefix = normalizeLastName(rawLast.split('-')[0])
      if (prefix !== lastName) add(`${prefix}-${stateCode}`, entry)
    }
  }
  return byLastState
}

function lookupBioguide(lastName, stateDst, firstName, byLastState) {
  const stateCode = (stateDst || '').trim().slice(0, 2).toUpperCase()
  if (!stateCode) return { bioguideId: null, status: 'no_state' }

  const matches = byLastState[`${normalizeLastName(lastName)}-${stateCode}`]
  if (!matches?.length) return { bioguideId: null, status: 'no_match' }
  if (matches.length === 1) return { bioguideId: matches[0].bioguideId, status: 'matched' }

  if (firstName) {
    const normFirst = normalizeFirstName(firstName)
    const byFirst = matches.filter(m =>
      normalizeFirstName((m.fullName.split(',')[1] || '').trim()) === normFirst
    )
    if (byFirst.length === 1) return { bioguideId: byFirst[0].bioguideId, status: 'matched' }

    const withDistrict = matches.filter(m => m.district != null)
    if (withDistrict.length === 1) return { bioguideId: withDistrict[0].bioguideId, status: 'matched' }
  }
  return { bioguideId: null, status: 'ambiguous', matches }
}

// Supabase has no bulk-update-by-id; chunk the per-row updates.
async function applyUpdates(table, updates) {
  if (!APPLY || !updates.length) return
  const CHUNK = 50
  for (let i = 0; i < updates.length; i += CHUNK) {
    await Promise.all(
      updates.slice(i, i + CHUNK).map(u =>
        supabase.from(table).update({ bioguide_id: u.bioguide_id }).eq('id', u.id)
      )
    )
    process.stdout.write(`\r  ${table}: ${Math.min(i + CHUNK, updates.length)}/${updates.length}`)
  }
  console.log()
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE — writes enabled ===' : '=== DRY RUN — no writes (pass --apply to write) ===\n')

  const trades = await selectAll('fd_trades', 'id, doc_id, last_name, first_name, state_dst, bioguide_id',
    q => q.is('bioguide_id', null))
  console.log(`fd_trades rows needing a bioguide_id: ${trades.length}`)
  if (!trades.length) return console.log('Nothing to do.')

  // ── Pass 1: exact, via the filing the trade was parsed from ──────────────
  const filings = await selectAll('fd_filings', 'id, doc_id, last_name, first_name, state_dst, bioguide_id')
  const filingByDoc = new Map(filings.map(f => [f.doc_id, f]))

  const tradeUpdates = []
  const stillNull = []
  for (const t of trades) {
    const bg = filingByDoc.get(t.doc_id)?.bioguide_id
    if (bg) tradeUpdates.push({ id: t.id, bioguide_id: bg })
    else stillNull.push(t)
  }
  console.log(`\nPass 1 — doc_id → fd_filings.bioguide_id (exact)`)
  console.log(`  resolved: ${tradeUpdates.length}`)
  console.log(`  remaining: ${stillNull.length}`)

  // ── Pass 2: name + state against Congress.gov ────────────────────────────
  const members = stillNull.length ? await fetchAllMembers() : null
  const filingUpdates = []
  const stats = { matched: 0, no_match: 0, ambiguous: 0, no_state: 0 }
  const unresolvedNames = new Map()

  if (members) {
    const lookup = buildLookup(members)
    for (const t of stillNull) {
      const r = lookupBioguide(t.last_name, t.state_dst, t.first_name, lookup)
      stats[r.status]++
      if (r.bioguideId) {
        tradeUpdates.push({ id: t.id, bioguide_id: r.bioguideId })
        // Feed the result back so the next run's pass 1 is cheaper.
        const f = filingByDoc.get(t.doc_id)
        if (f && !f.bioguide_id) {
          filingUpdates.push({ id: f.id, bioguide_id: r.bioguideId })
          f.bioguide_id = r.bioguideId
        }
      } else {
        const key = `${t.last_name}, ${t.first_name} (${t.state_dst}) — ${r.status}`
        unresolvedNames.set(key, (unresolvedNames.get(key) || 0) + 1)
      }
    }
    console.log(`\nPass 2 — name + state vs Congress.gov`)
    for (const [k, v] of Object.entries(stats)) console.log(`  ${k}: ${v}`)
  }

  const pct = ((tradeUpdates.length / trades.length) * 100).toFixed(1)
  console.log(`\n── Total resolvable: ${tradeUpdates.length}/${trades.length} (${pct}%)`)
  console.log(`   fd_filings rows also fixed: ${filingUpdates.length}`)

  if (unresolvedNames.size) {
    console.log(`\nStill unresolved (left NULL deliberately — a wrong attribution is worse than none):`)
    ;[...unresolvedNames.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`))
    if (unresolvedNames.size > 30) console.log(`  … and ${unresolvedNames.size - 30} more`)
  }

  if (!APPLY) return console.log('\nDry run complete. Re-run with --apply to write.')

  console.log('\nWriting…')
  await applyUpdates('fd_trades', tradeUpdates)
  await applyUpdates('fd_filings', filingUpdates)
  console.log('Done. Re-check with:')
  console.log('  select count(*) total, count(bioguide_id) with_bg from fd_trades;')
}

main().catch(err => { console.error('\nFAILED:', err.message); process.exit(1) })
