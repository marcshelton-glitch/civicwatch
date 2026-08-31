#!/usr/bin/env node
/**
 * Backfill bioguide_id in fd_net_worth for 119th Congress freshmen.
 * Fetches all members from Congress.gov, builds UPDATE SQL keyed on
 * lower(last_name) + state_dst, writes to supabase/migrations.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Load env ─────────────────────────────────────────────────────────────────
function loadEnv(...files) {
  for (const f of files) {
    const fp = path.join(ROOT, f)
    if (!fs.existsSync(fp)) continue
    const lines = fs.readFileSync(fp, 'utf8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
    }
    console.error(`[env] loaded ${f}`)
  }
}
loadEnv('.env.vercel', '.env.local', '.env')

const API_KEY = process.env.CONGRESS_API_KEY
if (!API_KEY) {
  console.error('CONGRESS_API_KEY not found — run `npx vercel env pull .env.vercel` first')
  process.exit(1)
}

// ── Congress.gov fetch with pagination ────────────────────────────────────────
async function fetchAllMembers(congress = 119) {
  const members = []
  let offset = 0
  const limit = 250
  let total = null

  while (true) {
    const url =
      `https://api.congress.gov/v3/member?congress=${congress}` +
      `&limit=${limit}&offset=${offset}&api_key=${API_KEY}&format=json`

    console.error(`[fetch] GET ${url.replace(API_KEY, '***')}`)
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Congress.gov ${res.status}: ${text.slice(0, 200)}`)
    }
    const data = await res.json()

    const page = data.members ?? []
    members.push(...page)

    if (total === null) {
      total = data.pagination?.count ?? page.length
      console.error(`[fetch] total members reported: ${total}`)
    }

    console.error(`[fetch] received ${page.length} members (offset ${offset}, running total ${members.length})`)

    if (page.length < limit || members.length >= total) break
    offset += limit
  }

  return members
}

// ── State name → 2-letter abbreviation ───────────────────────────────────────
const STATE_ABBR = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  'american samoa': 'AS', 'guam': 'GU', 'northern mariana islands': 'MP',
  'puerto rico': 'PR', 'virgin islands': 'VI',
  // pass-through if already 2-letter
  ...Object.fromEntries(
    ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
     'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
     'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
     'VA','WA','WV','WI','WY','DC','AS','GU','MP','PR','VI']
    .map(a => [a.toLowerCase(), a])
  ),
}

// ── Build state_dst ───────────────────────────────────────────────────────────
function toStateDst(state, district) {
  if (!state) return null
  const abbr = STATE_ABBR[state.toLowerCase()]
  if (!abbr) {
    console.error(`[warn] unknown state: "${state}"`)
    return null
  }
  const d = district != null ? String(district).padStart(2, '0') : '00'
  return abbr + d
}

// ── SQL escaping (single-quote only — no user data beyond names/codes) ────────
function esc(s) {
  return s.replace(/'/g, "''")
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const members = await fetchAllMembers(119)
  console.error(`[info] fetched ${members.length} total members`)

  const lines = []
  const seen = new Set()
  let skipped = 0

  for (const m of members) {
    const bioguideId = m.bioguideId
    if (!bioguideId) { skipped++; continue }

    // Name field varies: some have m.name (last, first), others have m.lastName
    let lastName = m.lastName
    if (!lastName && m.name) {
      // "name" is often "Last, First" format
      lastName = m.name.split(',')[0].trim()
    }
    if (!lastName) { skipped++; continue }

    const state = m.state
    // district may be absent (senators) or a number
    const district = m.district ?? null
    const stateDst = toStateDst(state, district)
    if (!stateDst) { skipped++; continue }

    // Deduplicate on (lastName, stateDst) — prefer first occurrence
    const key = `${lastName.toLowerCase()}|${stateDst}`
    if (seen.has(key)) continue
    seen.add(key)

    lines.push(
      `UPDATE fd_net_worth SET bioguide_id = '${esc(bioguideId)}'` +
      ` WHERE bioguide_id IS NULL` +
      ` AND lower(last_name) = '${esc(lastName.toLowerCase())}'` +
      ` AND state_dst = '${esc(stateDst)}';`
    )
  }

  console.error(`[info] generated ${lines.length} UPDATE statements, skipped ${skipped} members`)

  const header = `-- Run manually in Supabase SQL editor
-- Backfill bioguide_id for 119th Congress freshmen (191 null rows)
-- Generated from Congress.gov API on ${new Date().toISOString().slice(0, 10)}
-- Members fetched: ${members.length}  |  Updates generated: ${lines.length}

`
  const footer = `
-- Report remaining nulls after running above
SELECT COUNT(*) AS still_null FROM fd_net_worth WHERE bioguide_id IS NULL;
`

  const sql = header + lines.join('\n') + footer

  // Write migration file
  const outPath = path.join(ROOT, 'supabase', 'migrations', '20260630000003_backfill_bioguide_id.sql')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, sql, 'utf8')
  console.error(`[done] wrote ${lines.length} UPDATE statements → ${outPath}`)

  // Also print to stdout
  process.stdout.write(sql)
}

main().catch(err => {
  console.error('[error]', err.message)
  process.exit(1)
})
