// House roll-call votes from the Clerk's public XML (no key, no bot wall):
//   https://clerk.house.gov/evs/<year>/roll<NNN>.xml
// One file per vote, listing every member's position, so a member's history is
// "the last N files, pick out this bioguide id". GovTrack used to supply this
// but now sits behind a Cloudflare challenge, which returned HTML to our server.

const BASE = 'https://clerk.house.gov/evs'
const HEADERS = { 'User-Agent': 'CivicWatch/1.0 (civicwatch.app)' }
const pad = (n) => String(n).padStart(3, '0')
const rollUrl = (year, n) => `${BASE}/${year}/roll${pad(n)}.xml`

// Procedural votes say nothing about a member's priorities.
const PROCEDURAL = /adjourn|quorum|journal|call of the house|recess|reconsider/i

const BILL_TYPES = {
  'H R': ['H.R.', 'house-bill'],
  'H RES': ['H.Res.', 'house-resolution'],
  'H J RES': ['H.J.Res.', 'house-joint-resolution'],
  'H CON RES': ['H.Con.Res.', 'house-concurrent-resolution'],
  'S': ['S.', 'senate-bill'],
  'S RES': ['S.Res.', 'senate-resolution'],
  'S J RES': ['S.J.Res.', 'senate-joint-resolution'],
  'S CON RES': ['S.Con.Res.', 'senate-concurrent-resolution'],
}
const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`))
  return m ? decode(m[1]).trim() : ''
}

function isoDate(clerkDate) { // "25-Mar-2026" -> "2026-03-25"
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(clerkDate || '')
  return m && MONTHS[m[2].toLowerCase()] ? `${m[3]}-${MONTHS[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}` : ''
}

function voteLabel(raw) {
  const v = (raw || '').trim()
  if (/^(yea|aye)$/i.test(v)) return 'YEA'
  if (/^(nay|no)$/i.test(v)) return 'NAY'
  if (/^present$/i.test(v)) return 'PRESENT'
  if (/^not voting$/i.test(v)) return 'NOT VOTING'
  return v.toUpperCase() || '—' // e.g. a Speaker-election candidate's name
}

function outcomeOf(result) {
  if (/^(passed|agreed to|adopted|sustained|confirmed|accepted)/i.test(result)) return 'PASSED'
  if (/^(failed|rejected|not sustained|not agreed|defeated)/i.test(result)) return 'FAILED'
  return ''
}

// Parse one roll-call document for one member. Returns null if the member did
// not appear on it (not yet sworn in, or the file is not a roll call).
export function parseRoll(xml, bioguideId, year) {
  if (!/^[A-Z]\d{6}$/.test(bioguideId) || !xml.includes('<rollcall-num>')) return null
  const mv = new RegExp(`name-id="${bioguideId}"[^>]*>[^<]*</legislator>\\s*<vote>([^<]*)</vote>`).exec(xml)
  if (!mv) return null

  const question = tag(xml, 'vote-question')
  const legis = tag(xml, 'legis-num')
  const desc = tag(xml, 'vote-desc')
  const result = tag(xml, 'vote-result')
  const congress = parseInt(tag(xml, 'congress'), 10) || null
  const rollNum = parseInt(tag(xml, 'rollcall-num'), 10)

  let label = ''
  let billUrl = null
  const lm = /^(.*?)\s+(\d+)$/.exec(legis)
  if (lm && BILL_TYPES[lm[1].trim().toUpperCase()]) {
    const [pretty, slug] = BILL_TYPES[lm[1].trim().toUpperCase()]
    label = `${pretty} ${lm[2]}`
    if (congress) billUrl = `https://www.congress.gov/bill/${congress}th-congress/${slug}/${lm[2]}`
  } else if (legis) {
    label = legis
  }

  const totals = xml.split('<totals-by-vote>')[1] || ''
  const num = (name) => { const n = parseInt(tag(totals, name), 10); return Number.isFinite(n) ? n : null }
  const present = num('present-total')
  const notVoting = num('not-voting-total')

  return {
    bill: `${question}${label ? `: ${label}` : ''}${desc ? ` — ${desc}` : ''}`.trim() || 'Unknown vote',
    billUrl: billUrl || `https://clerk.house.gov/Votes/${year}${rollNum}`,
    category: null,
    vote: voteLabel(mv[1]),
    date: isoDate(tag(xml, 'action-date')),
    result,
    outcome: outcomeOf(result),
    totalYea: num('yea-total'),
    totalNay: num('nay-total'),
    totalOther: present == null && notVoting == null ? null : (present || 0) + (notVoting || 0),
    chamber: 'House',
    congress,
    _question: question,
  }
}

async function rollExists(year, n) {
  try {
    const res = await fetch(rollUrl(year, n), {
      headers: { ...HEADERS, Range: 'bytes=0-1499' },
      cache: 'no-store',
    })
    if (res.status !== 200 && res.status !== 206) return false
    return (await res.text()).includes('<rollcall-num>')
  } catch { return false }
}

// Latest posted roll number for a year. Rolls are sequential, so "exists" is
// monotonic: probe every 25th in parallel, then the 24 after the last hit.
// The Clerk answers a missing roll with a tiny body, so this is cheap.
let latestCache = { year: 0, n: 0, at: 0 }
export async function findLatestRoll(year) {
  if (latestCache.year === year && Date.now() - latestCache.at < 15 * 60 * 1000) return latestCache.n
  const coarse = Array.from({ length: 60 }, (_, i) => (i + 1) * 25)
  const hits = await Promise.all(coarse.map(n => rollExists(year, n)))
  let base = 0
  hits.forEach((hit, i) => { if (hit) base = coarse[i] })
  const fine = Array.from({ length: 24 }, (_, i) => base + i + 1)
  const fineHits = await Promise.all(fine.map(n => rollExists(year, n)))
  let latest = base
  fineHits.forEach((hit, i) => { if (hit) latest = fine[i] })
  latestCache = { year, n: latest, at: Date.now() }
  return latest
}

async function fetchRoll(year, n) {
  try {
    const res = await fetch(rollUrl(year, n), { headers: HEADERS, next: { revalidate: 86400 } })
    return res.ok ? await res.text() : null
  } catch { return null }
}

// Most recent substantive votes for a House member, newest first.
export async function getHouseVotes(bioguideId, { want = 30, scan = 45 } = {}) {
  let year = new Date().getUTCFullYear()
  let latest = await findLatestRoll(year)
  if (!latest) { year -= 1; latest = await findLatestRoll(year) } // early January
  if (!latest) return []

  const numbers = []
  for (let n = latest; n >= Math.max(1, latest - scan + 1); n--) numbers.push(n)

  const votes = []
  for (let i = 0; i < numbers.length; i += 15) {
    const xmls = await Promise.all(numbers.slice(i, i + 15).map(n => fetchRoll(year, n)))
    for (const xml of xmls) {
      const v = xml && parseRoll(xml, bioguideId, year)
      if (v && !PROCEDURAL.test(v._question)) votes.push(v)
    }
    if (votes.length >= want) break
  }
  return votes.slice(0, want).map(({ _question, ...v }) => v)
}
