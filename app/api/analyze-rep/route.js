import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { validateAIRequest, checkSpendCap, logTokenUsage } from '@/lib/ai-gateway'
import { getUserTier } from '@/lib/tier-utils'
import { buildPrompt, hasAnyData, INSUFFICIENT_DATA_MESSAGE } from '@/lib/analyze-rep-prompt'
import {
  readGeminiResponse, trimToLastSentence, isTransientStatus, RETRY_DELAYS_MS,
} from '@/lib/gemini-response'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Supabase-backed per-user rate limiting ────────────────────────────────────
// Survives serverless cold starts; stored in rate_limits table.
async function checkRateLimit(userId, mode) {
  const supabase = getSupabase()
  const limit = mode === 'preview' ? 3 : 20
  const windowHours = 1
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  try {
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', `analyze_${mode}`)
      .gte('created_at', windowStart)

    if (count >= limit) return false  // rate limited — return false means "is limited"

    await supabase.from('rate_limits').insert({
      user_id: userId,
      action: `analyze_${mode}`,
      created_at: new Date().toISOString(),
    })

    return true  // allowed
  } catch (err) {
    console.error('analyze-rep: rate limit check failed:', err.message)
    return true  // fail open — don't block if rate limit table is unreachable
  }
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
function sanitizeYear(v) {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1900 && v <= 2100 ? v : null
}

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
    netWorthEntryYear: sanitizeYear(raw.netWorthEntryYear),
    netWorthCurrentYear: sanitizeYear(raw.netWorthCurrentYear),
    filingsCount: typeof raw.filingsCount === 'number' && isFinite(raw.filingsCount)
      ? Math.max(0, Math.min(500, Math.floor(raw.filingsCount)))
      : 0,
  }

  // Trades
  const rawTrades = Array.isArray(raw.trades) ? raw.trades.slice(0, 20) : []
  sanitized.trades = rawTrades.map(t => ({
    date: sanitizeString(t?.date, 20),
    type: ['BUY', 'SELL'].includes((t?.type || '').toUpperCase())
      ? t.type.toUpperCase() : 'UNKNOWN',
    asset: sanitizeString(t?.asset, 80),
    ticker: sanitizeString(t?.ticker, 12),
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

  // ── Parse body ────────────────────────────────────────────────────────────
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ── Payload validation ────────────────────────────────────────────────────
  const validationError = validateAIRequest(request, body, { requiredFields: ['mode', 'rep'] })
  if (validationError) return validationError

  const { mode, rep: rawRep } = body

  if (!['preview', 'full'].includes(mode)) {
    return Response.json({ error: 'Invalid mode' }, { status: 400 })
  }

  // ── User metadata (tier check + spend cap) ────────────────────────────────
  const user = await currentUser()
  const userTier = getUserTier(user)

  if (mode === 'full' && userTier !== 'pro') {
    return Response.json({ error: 'Pro subscription required' }, { status: 403 })
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

  // Nothing to analyse: answer without a Gemini call, a rate-limit slot or tokens.
  if (!hasAnyData(rep)) {
    return Response.json(
      { text: '', insufficient: true, message: INSUFFICIENT_DATA_MESSAGE },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const allowed = await checkRateLimit(userId, mode)
  if (!allowed) {
    const limit = mode === 'preview' ? 3 : 20
    return Response.json(
      { error: `Rate limit reached. Maximum ${limit} ${mode === 'preview' ? 'previews' : 'full reports'} per hour.` },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  // ── Spend cap ─────────────────────────────────────────────────────────────
  const underCap = await checkSpendCap(userId, userTier)
  if (!underCap) {
    const capLabels = { pro: '50,000', free: '2,000' }
    const cap = capLabels[userTier] ?? '2,000'
    return Response.json(
      { error: `Daily token limit reached (${cap} tokens/${userTier} tier). Resets at midnight UTC.` },
      { status: 429, headers: { 'Retry-After': '86400' } }
    )
  }

  // ── Build prompt from sanitized data ──────────────────────────────────────
  const prompt = buildPrompt(rep, mode)

  // ── Call AI API ───────────────────────────────────────────────────────────
  // Model is env-driven so a swap (or a retired model) needs no code change.
  const model = (mode === 'preview'
    ? process.env.GEMINI_MODEL_PREVIEW
    : process.env.GEMINI_MODEL_FULL) || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

  try {
    // The key goes in a header, not the URL, so it never lands in a logged URL.
    const callGemini = () => fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GOOGLE_AI_API_KEY ?? '',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            // gemini-2.5-flash spends thinking tokens out of this same cap, so
            // the old 1000 left room for about one sentence. Thinking is off
            // (the report is summarising supplied data, not solving a puzzle)
            // and the cap sits well above a full five-paragraph report.
            maxOutputTokens: mode === 'preview' ? 400 : 2500,
            temperature: 0.4,
            // thinkingBudget is a 2.5-family setting; Gemini 3.x models reject it
            // (HTTP 400). Flash-Lite 3.x doesn't think by default.
            ...(model.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          ],
        }),
      }
    )

    // Google answers 503 "model overloaded" in short bursts and 429 when the
    // shared quota is spent. A brief retry clears the first; neither is the
    // user's fault, so the final message says so instead of "failed".
    let res = await callGemini()
    for (
      let attempt = 0;
      !res.ok && isTransientStatus(res.status) && attempt < RETRY_DELAYS_MS.length;
      attempt++
    ) {
      console.error('AI API transient error, retrying:', res.status, { attempt: attempt + 1 })
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
      res = await callGemini()
    }

    if (!res.ok) {
      console.error('AI API HTTP error:', res.status)
      // 402 = prepaid Gemini credits depleted. Users get the same "busy" message,
      // but the log line names the real cause.
      if (res.status === 402) console.error('AI API: Gemini prepay credits depleted — top up or switch key in AI Studio')
      if (isTransientStatus(res.status) || res.status === 429 || res.status === 402) {
        return Response.json(
          { error: 'AI analysis is busy right now. Please try again in a minute.' },
          { status: 503, headers: { 'Retry-After': '60' } }
        )
      }
      return Response.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
    }

    const data = await res.json()
    const reply = readGeminiResponse(data)

    if (!reply.text) {
      console.error('AI empty response received', { finishReason: reply.finishReason })
      return Response.json({ error: 'AI analysis returned no content. Please try again.' }, { status: 500 })
    }

    // A cut-off reply still comes back as HTTP 200. Log it so a regression is
    // visible, and never hand the user a sentence that stops mid-word.
    let text = reply.text
    if (reply.truncated) {
      console.error('AI reply hit the token cap', {
        mode,
        finishReason: reply.finishReason,
        outputTokens: reply.outputTokens,
        thoughtTokens: reply.thoughtTokens,
      })
      text = trimToLastSentence(text)
    }

    // ── Log token usage (thinking tokens are billed as output) ────────────
    await logTokenUsage(
      userId, 'analyze-rep', model,
      reply.inputTokens, reply.outputTokens + reply.thoughtTokens,
    )

    return Response.json(
      { text, truncated: reply.truncated },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )

  } catch (err) {
    console.error('AI API error:', err.message)
    return Response.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 })
  }
}
