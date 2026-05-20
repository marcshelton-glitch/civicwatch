/**
 * Backfill bioguide_id in fd_net_worth
 *
 * Usage:
 *   node --env-file=.env.local scripts/backfill-bioguide.js
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Full state name → 2-letter code
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

function normalizeLastName(name) {
  // Remove suffixes: Jr, Sr, II, III, IV, etc.
  return name
    .replace(/,?\s+(Jr\.?|Sr\.?|II+|IV|V|Esq\.?)$/i, '')
    .replace(/[^A-Z]/gi, '')
    .toUpperCase()
}

async function fetchAllMembers() {
  const members = []
  const totalExpected = 2692
  const pageSize = 250

  console.log('Fetching Congress member list...')
  for (let offset = 0; offset < totalExpected + pageSize; offset += pageSize) {
    const url = `https://api.congress.gov/v3/member?limit=${pageSize}&offset=${offset}&api_key=${CONGRESS_API_KEY}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Congress API error: ${resp.status}`)
    const data = await resp.json()
    const page = data.members || []
    members.push(...page)
    if (page.length < pageSize) break
    // Respect rate limits
    await new Promise(r => setTimeout(r, 100))
  }
  console.log(`Loaded ${members.length} members from Congress.gov`)
  return members
}

function buildLookup(members) {
  // Primary key: "LASTNAME-STATECODE"  → [{ bioguideId, fullName, state, district }]
  const byLastState = {}
  const byBioguide = {}

  const addEntry = (key, entry) => {
    if (!byLastState[key]) byLastState[key] = []
    // Avoid duplicates
    if (!byLastState[key].find(e => e.bioguideId === entry.bioguideId)) {
      byLastState[key].push(entry)
    }
  }

  for (const m of members) {
    const stateCode = STATE_CODES[m.state]
    if (!stateCode) continue

    const rawLast = m.name.split(',')[0].trim()
    const entry = { bioguideId: m.bioguideId, fullName: m.name, state: stateCode, district: m.district }

    // Primary: full normalized last name
    const lastName = normalizeLastName(rawLast)
    addEntry(`${lastName}-${stateCode}`, entry)

    // Fallback A: last word of compound names (e.g. "McMorris Rodgers" → "RODGERS")
    const words = rawLast.split(/\s+/)
    if (words.length > 1) {
      const lastWord = normalizeLastName(words[words.length - 1])
      if (lastWord !== lastName) addEntry(`${lastWord}-${stateCode}`, entry)
    }

    // Fallback B: pre-hyphen prefix (e.g. "Kamlager-Dove" → "KAMLAGER")
    if (rawLast.includes('-')) {
      const prefix = normalizeLastName(rawLast.split('-')[0])
      if (prefix !== lastName) addEntry(`${prefix}-${stateCode}`, entry)
    }

    byBioguide[m.bioguideId] = m
  }

  return { byLastState, byBioguide }
}

function normalizeFirstName(name) {
  // Take just the first word, strip non-alpha
  return (name || '').trim().split(/\s+/)[0].replace(/[^A-Z]/gi, '').toUpperCase()
}

function lookupBioguide(lastName, stateCode, firstName, lookup) {
  const normalLast = normalizeLastName(lastName)
  const key = `${normalLast}-${stateCode}`
  const matches = lookup.byLastState[key]

  if (!matches || matches.length === 0) return { bioguideId: null, status: 'no_match' }
  if (matches.length === 1) return { bioguideId: matches[0].bioguideId, status: 'matched' }

  // Multiple matches — try first-name disambiguation
  if (firstName) {
    const normFirst = normalizeFirstName(firstName)
    const firstMatches = matches.filter(m => {
      // Congress name format: "Last, First Middle" — extract first name
      const congressFirst = normalizeFirstName((m.fullName.split(',')[1] || '').trim())
      return congressFirst === normFirst
    })
    if (firstMatches.length === 1) return { bioguideId: firstMatches[0].bioguideId, status: 'matched' }

    // Tie-breaker: if one candidate has a district and others don't (senator vs house member)
    const withDistrict = matches.filter(m => m.district != null)
    if (withDistrict.length === 1) return { bioguideId: withDistrict[0].bioguideId, status: 'matched' }
  }

  return { bioguideId: null, status: 'ambiguous', matches }
}

async function main() {
  // 1. Fetch Congress member list
  const members = await fetchAllMembers()
  const lookup = buildLookup(members)

  // 2. Get all rows with null bioguide_id
  console.log('\nFetching fd_net_worth rows with null bioguide_id...')
  const { data: rows, error: fetchErr } = await supabase
    .from('fd_net_worth')
    .select('id, last_name, first_name, state_dst, report_year')
    .is('bioguide_id', null)

  if (fetchErr) throw new Error(`Supabase fetch error: ${fetchErr.message}`)
  console.log(`Found ${rows.length} rows to backfill`)

  // 3. Match and update
  let matched = 0
  let updated = 0
  let unmatched = []
  let ambiguous = []

  // Group updates for batching
  const updates = []

  for (const row of rows) {
    const stateCode = (row.state_dst || '').slice(0, 2).toUpperCase()
    const result = lookupBioguide(row.last_name, stateCode, row.first_name, lookup)

    if (result.status === 'matched') {
      matched++
      updates.push({ id: row.id, bioguide_id: result.bioguideId })
    } else if (result.status === 'ambiguous') {
      ambiguous.push({ ...row, stateCode, matches: result.matches })
    } else {
      unmatched.push({ ...row, stateCode })
    }
  }

  // 4. Apply updates in batches of 50
  console.log(`\nApplying ${updates.length} updates...`)
  const BATCH = 50
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH)
    // Supabase doesn't support bulk upsert with different values per row cleanly,
    // so we use individual updates via Promise.all in batches
    const promises = batch.map(u =>
      supabase.from('fd_net_worth').update({ bioguide_id: u.bioguide_id }).eq('id', u.id)
    )
    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)
    if (errors.length) {
      console.error(`Batch ${i / BATCH + 1}: ${errors.length} errors`)
      errors.forEach(r => console.error(' ', r.error.message))
    }
    updated += batch.length - errors.length
    process.stdout.write(`  ${Math.min(i + BATCH, updates.length)}/${updates.length}\r`)
  }

  // 5. Report
  console.log(`\n\n=== Results ===`)
  console.log(`Total rows:      ${rows.length}`)
  console.log(`Matched:         ${matched}`)
  console.log(`Updated:         ${updated}`)
  console.log(`Unmatched:       ${unmatched.length}`)
  console.log(`Ambiguous:       ${ambiguous.length}`)

  if (unmatched.length > 0) {
    console.log('\n--- Unmatched rows (need manual fix) ---')
    const seen = new Set()
    for (const r of unmatched) {
      const key = `${r.last_name}|${r.stateCode}`
      if (!seen.has(key)) {
        seen.add(key)
        console.log(`  ${r.last_name}, ${r.first_name} (${r.state_dst})`)
      }
    }
  }

  if (ambiguous.length > 0) {
    console.log('\n--- Ambiguous rows (multiple members with same last name in state) ---')
    for (const r of ambiguous) {
      console.log(`  ${r.last_name} (${r.state_dst}) → candidates:`)
      for (const m of r.matches) console.log(`    ${m.bioguideId}: ${m.fullName}`)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
