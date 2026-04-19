import { auth, currentUser } from '@clerk/nextjs/server'

// ── Body size limit ───────────────────────────────────────────────────────────
export const config = {
  api: { bodyParser: { sizeLimit: '64kb' } },
}

// ── Per-user rate limiting with automatic cleanup ─────────────────────────────
const rateMap = new Map()
const PREVIEW_LIMIT = 3
const FULL_LIMIT = 20
const WINDOW_MS = 60 * 60 * 1000  // 1 hour
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000  // clean stale entries every 30 min

// Sweep entries older than the window to prevent unbounded Map growth
function cleanupRateMap() {
  const now = Date.now()
  for (const [key, entry] of rateMap.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      rateMap.delete(key)
    }
  }
}
setInterval(cleanupRateMap, CLEANUP_INTERVAL_MS)

function checkRateLimit(userId, mode) {
  const now = Date.now()
  const key = `${userId}:${mode}`
  const entry = rateMap.get(key) || { count: 0, windowStart: now }
  if (now - entry.windowStart > WINDOW_MS) {
    rateMap.set(key, { count: 1, windowStart: now })
    return false
  }
  const limit = mode === 'preview' ? PREVIEW_LIMIT : FULL_LIMIT
  if (entry.count >= limit) return true
  entry.count++
  rateMap.set(key, entry)
  return false
}

// ── String sanitizer: strips prompt injection patterns ───────────────────────
function sanitizeString(val, maxLen = 500) {
  if (typeof val !== 'string') return ''
  return val
    .slice(0, maxLen)
    .replace(/<[^>]*>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[INST\]|\[\/INST\]/gi, '')
    .replace(/system:/gi, '')
    .replace(/user:/gi, '')
    .replace(/assistant:/gi, '')
    .trim()
}

// ── Validate and sanitize rep payload from client ─────────────────────────────
function sanitizeRep(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid rep data')
  }

  const sanitized = {
    name: sanitizeString(raw.name, 100),
    title: sanitizeString(raw.title, 80),
    party: sanitizeString(raw.party, 50),
    state: sanitizeString(raw.state, 50),
    bio: sanitizeString(raw.bio, 800),
    yearsInOffice: typeof raw.yearsInOffice === 'number' && isFinite(raw.yearsInOffice)
      ? Math.max(0, Math.min(50, Math.floor(raw.yearsInOffice)))
      : null,
    netWorthBefore: typeof raw.netWorthBefore === 'number' && isFinite(raw.netWorthBefore)
      ? raw.netWorthBefore
      : null,
    netWorthCurrent: typeof raw.netWorthCurrent === 'number' && isFinite(raw.netWorthCurrent)
      ? raw.netWorthCurrent
      : null,
  }

  // Trades
  const rawTrades = Array.isArray(raw.trades) ? raw.trades.slice(0, 20) : []
  sanitized.trades = rawTrades.map(t => ({
    date: sanitizeString(t?.date, 20),
    type: ['BUY', 'SELL'].includes((t?.type || '').toUpperCase())
      ? t.type.toUpperCase() : 'UNKNOWN',
    asset: sanitizeString(t?.asset, 80),
    amount: typeof t?.amount === 'number' && isFinite(t.amount)
      ? t.amount
      : sanitizeString(String(t?.amount || ''), 30),
    sector: sanitizeString(t?.sector, 50),
  }))

  // Votes
  const rawVotes = Array.isArray(raw.votes) ? raw.votes.slice(0, 20) : []
  sanitized.votes = rawVotes.map(v => ({
    bill: sanitizeString(v?.bill, 150),
    vote: ['YEA', 'NAY', 'PRESENT', 'NOT VOTING', '—'].includes(
      (v?.vote || '').toUpperCase()
    ) ? v.vote.toUpperCase() : '—',
    outcome: ['PASSED', 'FAILED'].includes((v?.outcome || '').toUpperCase())
      ? v.outcome.toUpperCase() : '',
  }))

  // Peer comparison
  const rawPeers = raw.peerComparison && typeof raw.peerComparison === 'object'
    ? raw.peerComparison : {}
  sanitized.peerComparison = {}
  for (const [issue, vals] of Object.entries(rawPeers).slice(0, 10)) {
    const cleanIssue = sanitizeString(issue, 30)
    if (cleanIssue && typeof vals === 'object' && vals !== null) {
      const self = typeof vals.self === 'number' && isFinite(vals.self)
        ? Math.max(0, Math.min(100, vals.self)) : null
      const peers = typeof vals.peers === 'number' && isFinite(vals.peers)
        ? Math.max(0, Math.min(100, vals.peers)) : null
      if (self !== null && peers !== null) {
        sanitized.peerComparison[cleanIssue] = { self, peers }
      }
    }
  }

  // Peers list
  sanitized.peers = Array.isArray(raw.peers)
    ? raw.peers.slice(0, 5).map(p => sanitizeString(p, 80))
    : []

  return sanitized
}

const fmt = (n) => {
  if (n == null || isNaN(n)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(n)
}

export async function POST(request) {
  // ── Content-Type check ────────────────────────────────────────────────────
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return Response.json({ error: 'Invalid content type' }, { status: 415 })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse & validate body ─────────────────────────────────────────────────
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { mode, rep: rawRep } = body

  if (!mode || !rawRep) {
    return Response.json({ error: 'Missing mode or rep data' }, { status: 400 })
  }

  if (!['preview', 'full'].includes(mode)) {
    return Response.json({ error: 'Invalid mode' }, { status: 400 })
  }

  // ── Pro check for full mode ───────────────────────────────────────────────
  if (mode === 'full') {
    const user = await currentUser()
    const isPro = user?.publicMetadata?.isPro === true
    if (!isPro) {
      return Response.json({ error: 'Pro subscription required' }, { status: 403 })
    }
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  if (checkRateLimit(userId, mode)) {
    const limit = mode === 'preview' ? PREVIEW_LIMIT : FULL_LIMIT
    return Response.json(
      { error: `Rate limit reached. Maximum ${limit} ${mode === 'preview' ? 'previews' : 'full reports'} per hour.` },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  // ── Sanitize client-supplied rep data ─────────────────────────────────────
  let rep
  try {
    rep = sanitizeRep(rawRep)
  } catch {
    return Response.json({ error: 'Invalid representative data' }, { status: 400 })
  }

  if (!rep.name) {
    return Response.json({ error: 'Representative name is required' }, { status: 400 })
  }

  // ── Build prompt from sanitized data ──────────────────────────────────────
  const enrichPct = rep.netWorthBefore && rep.netWorthCurrent && rep.netWorthBefore > 0
    ? (((rep.netWorthCurrent - rep.netWorthBefore) / rep.netWorthBefore) * 100).toFixed(0)
    : 'unknown'

  const tradeList = rep.trades.length > 0
    ? rep.trades.map(t => `${t.date}: ${t.type} ${t.asset} (${fmt(t.amount)}, ${t.sector})`).join('; ')
    : 'No trades disclosed'

  const voteList = rep.votes.length > 0
    ? rep.votes.map(v => `${v.bill} — ${v.vote} — ${v.outcome}`).join('; ')
    : 'No votes on record'

  const peerData = Object.keys(rep.peerComparison).length > 0
    ? Object.entries(rep.peerComparison)
        .map(([issue, v]) => `${issue}: this rep ${v.self}% vs peers ${v.peers}%`)
        .join('; ')
    : 'No peer data available'

  const prompt = mode === 'preview'
    ? `You are a civic accountability analyst. In 2-3 sentences only, write a sharp, factual preview summary of this elected official for a civic watchdog platform. Be specific about one notable pattern. Do NOT use markdown, headers, or bullet points. Write in plain prose.

Representative: ${rep.name}, ${rep.title}, ${rep.party}, ${rep.state}
Net worth change in office: ${fmt(rep.netWorthBefore)} → ${fmt(rep.netWorthCurrent)} (+${enrichPct}% over ${rep.yearsInOffice ?? 'unknown'} years)
Recent trades: ${tradeList}
Recent votes: ${voteList}`
    : `You are a nonpartisan civic accountability analyst. Write a thorough, factual accountability report for a civic watchdog platform. Use plain prose only — no markdown headers, no bullet points, no asterisks. Write in flowing paragraphs. Be specific, factual, and objective.

Cover these four areas in order, each as its own paragraph:

1. VOTING RECORD: Analyze their votes and what they reveal about priorities.
2. FINANCIAL ACTIVITY: Examine stock trades in context of their committee roles and votes. Note any timing patterns.
3. WEALTH TRAJECTORY: Assess net worth growth in office relative to their years served and peer norms.
4. PEER STANDING: Compare their issue scores vs peers and what that says about their positioning.

End with one sentence: an overall accountability rating as "Low / Medium / High / Very High" concern, with a one-line reason.

Representative: ${rep.name}, ${rep.title}, ${rep.party}, ${rep.state}
Bio: ${rep.bio}
Years in office: ${rep.yearsInOffice ?? 'unknown'}
Net worth before office: ${fmt(rep.netWorthBefore)}
Current net worth: ${fmt(rep.netWorthCurrent)} (+${enrichPct}%)
Trades: ${tradeList}
Votes: ${voteList}
Peer comparison: ${peerData}
Committee peers: ${rep.peers.join(', ') || 'unknown'}`

  // ── Call AI API ───────────────────────────────────────────────────────────
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: mode === 'preview' ? 300 : 1000,
            temperature: 0.6,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          ],
        }),
      }
    )

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error('AI API HTTP error:', res.status)
      return Response.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text) {
      console.error('AI empty response received')
      return Response.json({ error: 'AI analysis returned no content. Please try again.' }, { status: 500 })
    }

    return Response.json({ text })

  } catch (err) {
    console.error('AI API error:', err.message)
    return Response.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
  }
}