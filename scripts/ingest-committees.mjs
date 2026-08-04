/**
 * Ingest congressional committee memberships into public.committee_memberships.
 *
 * ── Why ───────────────────────────────────────────────────────────────────
 * /api/conflict-score and /api/congress?type=committees both read
 * `member.terms[].memberOf[]` from Congress.gov /member/{bioguideId}. That field
 * does not exist (see migrations/010 and the official MemberEndpoint docs), so
 * both returned [] for every member — the conflict scorer had no committees to
 * match trades against and reported "None flagged" for all of Congress.
 *
 * Congress.gov v3 has no per-member committee endpoint at all, so this loads the
 * public unitedstates/congress-legislators dataset instead. No API key needed.
 *
 *   committees-current.yaml            names, chambers, thomas_ids, subcommittees
 *   committee-membership-current.yaml  bioguide ids per committee, keyed by
 *                                      thomas_id (full) or thomas_id+subcode
 *
 * ── Scope ─────────────────────────────────────────────────────────────────
 * These are *-current* files: a snapshot of who sits where today, with no
 * history. Every row is therefore stamped with the current Congress, and the
 * scorer restricts itself to trades made during it. Do not widen that claim
 * without a historical roster source — scoring an old trade against a present
 * committee seat invents a conflict that never existed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────
 *   node --env-file=.env.local scripts/ingest-committees.mjs           # dry run
 *   node --env-file=.env.local scripts/ingest-committees.mjs --apply   # write
 *
 * Requires migrations/010_committee_memberships.sql to have been applied, plus
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. No Congress.gov key.
 */

import { createClient } from '@supabase/supabase-js'
import yaml from 'js-yaml'
import { sectorsForCommittee } from '../lib/committeeSectors.js'
import { currentCongress } from '../lib/congressSession.js'

const APPLY = process.argv.includes('--apply')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BASE = 'https://raw.githubusercontent.com/unitedstates/congress-legislators/main'

async function fetchYaml(file) {
  const res = await fetch(`${BASE}/${file}`, { headers: { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' } })
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  return yaml.load(await res.text())
}

// congress-legislators uses `type: house|senate|joint`; keep it verbatim.
const chamberOf = (c) => (c.type || '').toLowerCase() || null

function buildRows(committees, membership, congress) {
  // thomas_id -> committee, and thomas_id+subId -> { committee, subcommittee }
  const byKey = new Map()
  for (const c of committees) {
    if (!c.thomas_id) continue
    byKey.set(c.thomas_id, { committee: c, sub: null })
    for (const s of c.subcommittees || []) {
      if (!s.thomas_id) continue
      byKey.set(`${c.thomas_id}${s.thomas_id}`, { committee: c, sub: s })
    }
  }

  const rows = []
  const unknownKeys = []
  const seen = new Set()

  for (const [key, members] of Object.entries(membership)) {
    const entry = byKey.get(key)
    if (!entry) {
      // Almost always a committee that has since dissolved, or a historical
      // code. Reported rather than silently dropped.
      unknownKeys.push(key)
      continue
    }
    const { committee, sub } = entry
    const subId = sub ? sub.thomas_id : ''
    // A subcommittee's own jurisdiction can match a sector its parent's name
    // does not — "Commodity Markets, Digital Assets, and Rural Development"
    // under "House Committee on Agriculture", for instance.
    const matchName = sub ? `${committee.name} — ${sub.name}` : committee.name

    for (const m of members || []) {
      if (!m.bioguide) continue
      // The unique index is (bioguide, committee, subcommittee, congress);
      // dedupe here so a repeated entry doesn't abort the whole upsert.
      const dedupe = `${m.bioguide}|${committee.thomas_id}|${subId}`
      if (seen.has(dedupe)) continue
      seen.add(dedupe)

      rows.push({
        bioguide_id: m.bioguide,
        committee_id: committee.thomas_id,
        committee_name: committee.name,
        chamber: chamberOf(committee),
        subcommittee_id: subId,
        subcommittee_name: sub ? sub.name : null,
        match_name: matchName,
        rank: Number.isFinite(m.rank) ? m.rank : null,
        title: m.title || null,
        party: m.party || null,
        congress,
      })
    }
  }
  return { rows, unknownKeys }
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE — writes enabled ===\n' : '=== DRY RUN — no writes (pass --apply to write) ===\n')

  const congress = currentCongress()
  console.log(`Target Congress: ${congress}th`)

  const [committees, membership] = await Promise.all([
    fetchYaml('committees-current.yaml'),
    fetchYaml('committee-membership-current.yaml'),
  ])
  console.log(`Loaded ${committees.length} committees, ${Object.keys(membership).length} membership groups`)

  const { rows, unknownKeys } = buildRows(committees, membership, congress)
  const members = new Set(rows.map(r => r.bioguide_id))
  const fullCommitteeRows = rows.filter(r => !r.subcommittee_id)

  console.log(`\nRows: ${rows.length}  (${fullCommitteeRows.length} full-committee, ${rows.length - fullCommitteeRows.length} subcommittee)`)
  console.log(`Distinct members: ${members.size}`)
  if (unknownKeys.length) {
    console.log(`Unmatched membership keys (skipped): ${unknownKeys.length} — ${unknownKeys.slice(0, 8).join(', ')}`)
  }

  // ── Sector coverage ───────────────────────────────────────────────────────
  // Only rows whose name matches a COMMITTEE_SECTORS entry can ever flag a
  // trade, so this is the number that actually governs whether the conflict
  // scorer does anything. Worth watching after any committee rename.
  const scored = rows.filter(r => sectorsForCommittee(r.match_name).length > 0)
  const scoredMembers = new Set(scored.map(r => r.bioguide_id))
  console.log(`\nSector-matched rows: ${scored.length}/${rows.length}`)
  console.log(`Members with at least one scoreable seat: ${scoredMembers.size}/${members.size}`)

  const unmatchedCommittees = [...new Set(
    fullCommitteeRows.filter(r => !sectorsForCommittee(r.match_name).length).map(r => r.committee_name)
  )].sort()
  if (unmatchedCommittees.length) {
    console.log(`\nFull committees with no sector mapping (expected for Ethics, Rules, Budget, etc.):`)
    unmatchedCommittees.forEach(n => console.log(`  · ${n}`))
    console.log(`  → add a COMMITTEE_SECTORS entry in lib/committeeSectors.js if any of these should score.`)
  }

  if (!APPLY) return console.log('\nDry run complete. Re-run with --apply to write.')

  // Replace this Congress's rows wholesale: membership changes mid-Congress
  // (members resign, switch committees), so a pure upsert would leave stale
  // seats behind and over-report jurisdiction.
  console.log(`\nClearing existing rows for Congress ${congress}…`)
  const { error: delErr } = await supabase
    .from('committee_memberships')
    .delete()
    .eq('congress', congress)
  if (delErr) throw new Error(`delete failed: ${delErr.message}`)

  console.log('Inserting…')
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase
      .from('committee_memberships')
      .insert(rows.slice(i, i + CHUNK))
    if (error) throw new Error(`insert failed at ${i}: ${error.message}`)
    process.stdout.write(`\r  ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
  }
  console.log('\nDone.')
  console.log('\nVerify with:')
  console.log('  select count(*), count(distinct bioguide_id) from committee_memberships;')
  console.log('  curl -s "https://www.civicwatch.app/api/conflict-score?bioguideId=F000450" | jq')
}

main().catch(err => { console.error('\nFAILED:', err.message); process.exit(1) })
