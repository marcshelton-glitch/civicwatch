import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Auth ──────────────────────────────────────────────────────────────────────
function checkAuth(request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

// ── OAuth 1.0a signing for Twitter API v2 ────────────────────────────────────
function buildOAuthHeader(method, url, bodyParams = {}) {
  const consumerKey    = process.env.X_BOT_CLIENT_ID
  const consumerSecret = process.env.X_BOT_CLIENT_SECRET
  const accessToken    = process.env.X_BOT_ACCESS_TOKEN
  const tokenSecret    = process.env.X_BOT_ACCESS_TOKEN_SECRET

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  }

  const allParams = { ...oauthParams, ...bodyParams }

  const sortedParams = Object.keys(allParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&')

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`
  const signature  = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')

  oauthParams.oauth_signature = signature

  return 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')
}

// ── Post a tweet via API v2 ───────────────────────────────────────────────────
async function postTweet(text) {
  const url = 'https://api.twitter.com/2/tweets'
  const body = JSON.stringify({ text })
  const auth = buildOAuthHeader('POST', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twitter API ${res.status}: ${err}`)
  }

  const json = await res.json()
  return json.data?.id
}

// ── Party lookup (best-effort, cached per invocation) ────────────────────────
const partyCache = new Map()

async function getParty(bioguideId) {
  if (!bioguideId) return null
  if (partyCache.has(bioguideId)) return partyCache.get(bioguideId)

  const key = process.env.CONGRESS_API_KEY
  if (!key) return null

  try {
    const res = await fetch(
      `https://api.congress.gov/v3/member/${bioguideId}?api_key=${key}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const json = await res.json()
    const raw = json.member?.partyHistory?.[0]?.partyName || json.member?.partyName
    const party = raw === 'Democratic' ? 'D' : raw === 'Republican' ? 'R' : raw ? raw[0] : null
    partyCache.set(bioguideId, party)
    return party
  } catch {
    return null
  }
}

// ── Format tweet text ─────────────────────────────────────────────────────────
function mapTxType(type) {
  if (!type) return 'TRADE'
  const t = type.toLowerCase()
  if (t.includes('purchase') || t.includes('buy')) return 'BUY'
  if (t.includes('sale') || t.includes('sell')) return 'SELL'
  if (t.includes('exchange')) return 'XCHG'
  return type.toUpperCase()
}

function formatState(stateDst) {
  if (!stateDst) return ''
  return stateDst.slice(0, 2).toUpperCase()
}

async function formatTweet(trade, chamber) {
  const name  = `${trade.first_name} ${trade.last_name}`.trim()
  const state = formatState(trade.state_dst || trade.state)
  const party = await getParty(trade.bioguide_id)
  const tag   = party && state ? `(${party}-${state})` : state ? `(${state})` : ''
  const type  = mapTxType(trade.transaction_type)
  const asset = trade.ticker || trade.asset_name || 'Unknown'
  const amt   = trade.amount_str || 'Undisclosed'
  const filed = trade.filing_date
    ? new Date(trade.filing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const created = new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const dateLabel = filed || created
  const url   = trade.bioguide_id
    ? `https://civicwatch.app/rep/${trade.bioguide_id}`
    : 'https://civicwatch.app'

  // Twitter counts any URL as 23 chars regardless of length
  const lines = [
    '🚨 STOCK ACT DISCLOSURE',
    '',
    `${name}${tag ? ' ' + tag : ''} · ${chamber.toUpperCase()}`,
    `${type} ${asset} · ${amt}`,
    `Filed: ${dateLabel}`,
    '',
    url,
    '',
    '#STOCKAct #CongressionalTrading #CivicWatch',
  ]

  const text = lines.join('\n')
  // Twitter limit is 280 chars; URL always 23 chars in count, so raw length is fine
  return text
}

// ── Main handler ──────────────────────────────────────────────────────────────
async function runBot() {
  const supabase = getSupabase()

  // Look back 2 hours to catch any trades the last run may have missed
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  // Fetch already-posted trade IDs
  const { data: posted } = await supabase
    .from('x_bot_posts')
    .select('trade_id')
  const postedSet = new Set((posted || []).map(r => r.trade_id))

  // Query new House trades
  const { data: houseTrades } = await supabase
    .from('fd_trades')
    .select('id, first_name, last_name, state_dst, bioguide_id, ticker, asset_name, transaction_type, amount_str, transaction_date, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })

  // Query new Senate trades
  const { data: senateTrades } = await supabase
    .from('senate_trades')
    .select('id, first_name, last_name, state, bioguide_id, ticker, asset_name, transaction_type, amount_str, transaction_date, filing_date, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })

  const results = { posted: 0, skipped: 0, errors: [] }

  // Interleave house + senate sorted by created_at so tweets go out in chronological order
  const allTrades = [
    ...(houseTrades  || []).map(t => ({ ...t, _source: 'house',  _id: `house_${t.id}` })),
    ...(senateTrades || []).map(t => ({ ...t, _source: 'senate', _id: `senate_${t.id}` })),
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  for (const trade of allTrades) {
    if (postedSet.has(trade._id)) {
      results.skipped++
      continue
    }

    // Skip trades without a meaningful asset
    if (!trade.ticker && !trade.asset_name) {
      results.skipped++
      continue
    }

    try {
      const chamber = trade._source === 'senate' ? 'Senate' : 'House'
      const text = await formatTweet(trade, chamber)
      const tweetId = await postTweet(text)

      await supabase.from('x_bot_posts').insert({
        trade_id:  trade._id,
        tweet_id:  tweetId || null,
        posted_at: new Date().toISOString(),
      })

      postedSet.add(trade._id)
      results.posted++

      // Twitter rate limit: max 1 tweet/sec for basic tier
      await new Promise(r => setTimeout(r, 1100))
    } catch (err) {
      results.errors.push({ trade_id: trade._id, error: err.message })
      // Still record a failed attempt so we don't retry spam the same trade
      await supabase.from('x_bot_posts').upsert(
        { trade_id: trade._id, tweet_id: null },
        { onConflict: 'trade_id', ignoreDuplicates: true }
      )
    }
  }

  return results
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.X_BOT_CLIENT_ID || !process.env.X_BOT_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'X bot credentials not configured' }, { status: 503 })
  }

  try {
    const results = await runBot()
    return NextResponse.json({ ok: true, ...results })
  } catch (err) {
    console.error('[x-bot] Fatal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST for manual trigger / testing
export async function POST(request) {
  return GET(request)
}
