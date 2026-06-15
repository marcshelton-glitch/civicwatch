import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import webpush from 'web-push'

export const runtime = 'nodejs'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ── Web push setup ────────────────────────────────────────────────────────────
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@civicwatch.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

async function sendPushToUser(supabase, userId, payload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  await Promise.allSettled(subs.map(sub =>
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    ).catch(err => {
      if (err.statusCode === 410) {
        // Subscription expired — clean it up
        supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    })
  ))
}

// ── Cron rate limiter — prevents more than 5 manual triggers per hour ─────────
const cronRateMap = new Map()
function isCronRateLimited() {
  const now = Date.now()
  const WINDOW_MS = 60 * 60 * 1000
  const MAX = 5
  const entry = cronRateMap.get('cron') || { count: 0, windowStart: now }
  if (now - entry.windowStart > WINDOW_MS) {
    cronRateMap.set('cron', { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= MAX) return true
  entry.count++
  cronRateMap.set('cron', entry)
  return false
}

// CRON_SECRET must be a 32+ character random string set in Vercel env vars
function checkAuth(request) {
  // Vercel sets Authorization: Bearer <CRON_SECRET> for cron jobs
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  if (authHeader === `Bearer ${cronSecret}`) return true
  return false
}

// GET — called by Vercel cron scheduler
export async function GET(request) {
  return runAlerts(request)
}

// POST — manual trigger (e.g. from admin tooling)
export async function POST(request) {
  return runAlerts(request)
}

async function runAlerts(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isCronRateLimited()) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Log a warning when called from non-production Vercel environments
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    console.warn('send-alerts: called from non-production environment:', process.env.VERCEL_ENV)
  }

  const supabase = getSupabase()
  const clerk = await clerkClient()

  // ── 1. Fetch all tracked reps ─────────────────────────────────────────────
  const { data: allTracked, error: trackErr } = await supabase
    .from('user_tracked_reps')
    .select('user_id, bioguide_id, last_name, is_senator, rep_name')

  if (trackErr) {
    console.error('send-alerts: failed to fetch tracked reps:', trackErr.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!allTracked || allTracked.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No tracked reps' })
  }

  // ── 2. Fetch user preferences for alert filtering ─────────────────────────
  const { data: allPrefs } = await supabase
    .from('user_preferences')
    .select('user_id, alert_trades, alert_networth, alert_legislation, alert_committees')

  const prefsMap = {}
  for (const p of allPrefs || []) {
    prefsMap[p.user_id] = p
  }

  // ── 3. Determine new-filing window (25h to overlap the 24h cron cadence) ──
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

  // ── 4. Group tracked reps by user_id ─────────────────────────────────────
  const byUser = {}
  for (const row of allTracked) {
    if (!byUser[row.user_id]) byUser[row.user_id] = []
    byUser[row.user_id].push(row)
  }

  // ── 5. Run all alert types in parallel ───────────────────────────────────
  const [tradesSent, networthSent, committeeSent, legislationSent] = await Promise.all([
    sendTradeAlerts(supabase, clerk, byUser, prefsMap, cutoff),
    sendNetWorthAlerts(supabase, clerk, byUser, prefsMap, cutoff),
    sendCommitteeAlerts(supabase, clerk, byUser, prefsMap, cutoff),
    sendLegislationAlerts(supabase, clerk, byUser, prefsMap, cutoff),
  ])

  const totalSent = tradesSent + networthSent + committeeSent + legislationSent
  console.log(`send-alerts: done — trades:${tradesSent} networth:${networthSent} committee:${committeeSent} legislation:${legislationSent}`)
  return NextResponse.json({ sent: totalSent, trades: tradesSent, networth: networthSent, committee: committeeSent, legislation: legislationSent }, { headers: { 'Cache-Control': 'private, no-store' } })
}

// ── Trade alerts ──────────────────────────────────────────────────────────────
async function sendTradeAlerts(supabase, clerk, byUser, prefsMap, cutoff) {
  // Fetch new House PTR filings
  const { data: newHouseFilings } = await supabase
    .from('fd_filings')
    .select('doc_id, last_name, bioguide_id, filing_date, pdf_url, year')
    .eq('filing_type', 'P')
    .gt('created_at', cutoff)

  // Fetch new Senate filings (distinct filing_id from senate_trades)
  const { data: newSenTrades } = await supabase
    .from('senate_trades')
    .select('filing_id, last_name, filing_date, ptr_url')
    .gt('created_at', cutoff)

  const senFilingsMap = {}
  for (const t of newSenTrades || []) {
    if (!senFilingsMap[t.filing_id]) senFilingsMap[t.filing_id] = t
  }
  const newSenFilings = Object.values(senFilingsMap)

  if ((newHouseFilings || []).length === 0 && newSenFilings.length === 0) return 0

  let sentCount = 0

  for (const [userId, trackedReps] of Object.entries(byUser)) {
    // Respect alert_trades preference (default: true)
    const userPrefs = prefsMap[userId]
    if (userPrefs && userPrefs.alert_trades === false) continue

    const userNewFilings = []

    for (const rep of trackedReps) {
      const lastNameLower = (rep.last_name || '').toLowerCase()

      if (!rep.is_senator) {
        const matches = (newHouseFilings || []).filter(f =>
          (f.bioguide_id && f.bioguide_id === rep.bioguide_id) ||
          (!f.bioguide_id && lastNameLower && f.last_name?.toLowerCase() === lastNameLower)
        )
        for (const f of matches) {
          userNewFilings.push({
            filingId: f.doc_id,
            repName: rep.rep_name || `${f.last_name}`,
            bioguideId: rep.bioguide_id,
            filingDate: f.filing_date,
            docUrl: f.pdf_url || (f.year && f.doc_id
              ? `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${f.year}/${f.doc_id}.pdf`
              : null),
            chamber: 'House',
          })
        }
      } else {
        if (!lastNameLower) continue
        const matches = newSenFilings.filter(f =>
          f.last_name?.toLowerCase() === lastNameLower
        )
        for (const f of matches) {
          userNewFilings.push({
            filingId: f.filing_id,
            repName: rep.rep_name || `Sen. ${rep.last_name}`,
            bioguideId: rep.bioguide_id,
            filingDate: f.filing_date,
            docUrl: f.ptr_url || null,
            chamber: 'Senate',
          })
        }
      }
    }

    if (userNewFilings.length === 0) continue

    const filingIds = userNewFilings.map(f => f.filingId)
    const { data: alreadySent } = await supabase
      .from('sent_alerts')
      .select('filing_id')
      .eq('user_id', userId)
      .in('filing_id', filingIds)

    const sentIds = new Set((alreadySent || []).map(r => r.filing_id))
    const toSend = userNewFilings.filter(f => !sentIds.has(f.filingId))

    if (toSend.length === 0) continue

    let email, firstName
    try {
      const clerkUser = await clerk.users.getUser(userId)
      email = clerkUser.emailAddresses?.[0]?.emailAddress
      firstName = clerkUser.firstName || ''
    } catch (err) {
      console.error(`send-alerts: Clerk lookup failed for ${userId}:`, err.message)
      continue
    }

    if (!email) continue

    const emailSent = await sendTradeAlertEmail(email, firstName, toSend)
    if (!emailSent) continue

    sentCount++

    // Send web push alongside email
    const repNames = [...new Set(toSend.map(f => f.repName))].join(', ')
    await sendPushToUser(supabase, userId, {
      title: 'New trade disclosure',
      body: `${repNames} filed a new trade disclosure`,
      url: toSend[0]?.bioguideId ? `/?rep=${toSend[0].bioguideId}` : '/',
      tag: 'trade-alert',
    })

    const records = toSend.map(f => ({
      user_id: userId,
      bioguide_id: f.bioguideId,
      filing_id: f.filingId,
    }))
    await supabase
      .from('sent_alerts')
      .upsert(records, { onConflict: 'user_id,filing_id', ignoreDuplicates: true })
  }

  return sentCount
}

// ── Net worth update alerts ───────────────────────────────────────────────────
async function sendNetWorthAlerts(supabase, clerk, byUser, prefsMap, cutoff) {
  // Fetch new fd_net_worth rows since the cutoff window
  const { data: newWorthRows } = await supabase
    .from('fd_net_worth')
    .select('bioguide_id, last_name, state_dst, report_year, net_worth_min, net_worth_max, created_at')
    .gt('created_at', cutoff)

  if (!newWorthRows || newWorthRows.length === 0) return 0

  // Index new rows by bioguide_id
  const newWorthByBioguide = {}
  for (const row of newWorthRows) {
    if (!row.bioguide_id) continue
    if (!newWorthByBioguide[row.bioguide_id]) newWorthByBioguide[row.bioguide_id] = []
    newWorthByBioguide[row.bioguide_id].push(row)
  }

  let sentCount = 0

  for (const [userId, trackedReps] of Object.entries(byUser)) {
    const userPrefs = prefsMap[userId]
    if (userPrefs && userPrefs.alert_networth === false) continue

    const userNewFilings = []

    for (const rep of trackedReps) {
      if (!rep.bioguide_id) continue
      const rows = newWorthByBioguide[rep.bioguide_id] || []
      for (const row of rows) {
        userNewFilings.push({
          filingId: `nw_${rep.bioguide_id}_${row.report_year}`,
          repName: rep.rep_name || rep.last_name,
          bioguideId: rep.bioguide_id,
          reportYear: row.report_year,
          netWorthMin: row.net_worth_min,
          netWorthMax: row.net_worth_max,
          filedAt: row.created_at,
        })
      }
    }

    if (userNewFilings.length === 0) continue

    const filingIds = userNewFilings.map(f => f.filingId)
    const { data: alreadySent } = await supabase
      .from('sent_alerts')
      .select('filing_id')
      .eq('user_id', userId)
      .in('filing_id', filingIds)

    const sentIds = new Set((alreadySent || []).map(r => r.filing_id))
    const toSend = userNewFilings.filter(f => !sentIds.has(f.filingId))

    if (toSend.length === 0) continue

    let email, firstName
    try {
      const clerkUser = await clerk.users.getUser(userId)
      email = clerkUser.emailAddresses?.[0]?.emailAddress
      firstName = clerkUser.firstName || ''
    } catch (err) {
      console.error(`send-alerts: Clerk lookup failed for ${userId}:`, err.message)
      continue
    }

    if (!email) continue

    const emailSent = await sendNetWorthAlertEmail(email, firstName, toSend)
    if (!emailSent) continue

    sentCount++

    // Send web push alongside email
    const nwRepNames = [...new Set(toSend.map(f => f.repName))].join(', ')
    await sendPushToUser(supabase, userId, {
      title: 'Net worth update',
      body: `New financial disclosure data for ${nwRepNames}`,
      url: toSend[0]?.bioguideId ? `/?rep=${toSend[0].bioguideId}` : '/',
      tag: 'networth-alert',
    })

    await supabase
      .from('sent_alerts')
      .upsert(
        toSend.map(f => ({ user_id: userId, bioguide_id: f.bioguideId, filing_id: f.filingId })),
        { onConflict: 'user_id,filing_id', ignoreDuplicates: true }
      )
  }

  return sentCount
}

// ── Committee assignment alerts ───────────────────────────────────────────────
// TODO: No committee_assignments table exists yet. Wire this up once a table with
// columns (bioguide_id, committee_name, committee_code, assigned_at) is created.
// Query would be:
//   SELECT bioguide_id, committee_name, assigned_at FROM committee_assignments
//   WHERE assigned_at > cutoff
async function sendCommitteeAlerts(supabase, clerk, byUser, prefsMap, cutoff) {
  return 0
}

// ── Legislation alerts ────────────────────────────────────────────────────────
// TODO: No rep-linked bill table exists. The legiscan_cache table is keyed by
// request parameters, not by sponsoring rep, so we can't efficiently query it
// by bioguide_id. Wire this up once a rep_legislation table is created with
// columns (bioguide_id, bill_id, bill_title, sponsor_type, introduced_at).
// Query would be:
//   SELECT * FROM rep_legislation WHERE introduced_at > cutoff
async function sendLegislationAlerts(supabase, clerk, byUser, prefsMap, cutoff) {
  return 0
}

// ── Email: trade disclosures ──────────────────────────────────────────────────
async function sendTradeAlertEmail(email, firstName, filings) {
  if (!resend) return false

  const byRep = {}
  for (const f of filings) {
    if (!byRep[f.bioguideId]) byRep[f.bioguideId] = { repName: f.repName, chamber: f.chamber, filings: [] }
    byRep[f.bioguideId].filings.push(f)
  }

  const repRows = Object.entries(byRep).map(([bioguideId, { repName, chamber, filings }]) => {
    const filingLinks = filings.map(f => {
      const dateStr = f.filingDate
        ? new Date(f.filingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent'
      const docLink = f.docUrl
        ? `<a href="${f.docUrl}" style="color:#D4AF37;font-size:12px;">View filing →</a>`
        : ''
      return `<div style="margin-bottom:6px;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#CDD2E0;font-size:12px;">PTR filed ${dateStr}</span>
        ${docLink}
      </div>`
    }).join('')

    const civicUrl = `https://www.civicwatch.app?rep=${bioguideId}`
    return `
      <div style="margin-bottom:20px;padding:16px;background:rgba(27,42,107,0.4);border:1px solid rgba(212,175,55,0.2);border-radius:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div>
            <span style="font-size:15px;font-weight:700;color:#F8F9FF;">${repName}</span>
            <span style="margin-left:8px;font-size:11px;color:#8892A4;background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:6px;">${chamber}</span>
          </div>
          <a href="${civicUrl}" style="font-size:11px;color:#D4AF37;text-decoration:none;">View profile →</a>
        </div>
        ${filingLinks}
      </div>`
  }).join('')

  const greeting = firstName ? `, ${firstName}` : ''
  const count = filings.length
  const repCount = Object.keys(byRep).length
  const subtitle = repCount === 1
    ? `1 of your tracked representatives filed a new trade disclosure.`
    : `${repCount} of your tracked representatives filed new trade disclosures.`

  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: `🏛️ New trade disclosure${count > 1 ? 's' : ''} from your tracked representatives`,
      html: emailWrapper(`
        <div style="margin-bottom:24px;">
          <h2 style="color:#D4AF37;font-size:18px;margin:0 0 6px;">New Trade Disclosures${greeting}</h2>
          <p style="color:#CDD2E0;font-size:13px;line-height:1.7;margin:0;">${subtitle}</p>
        </div>
        ${repRows}
      `),
    })
    return true
  } catch (err) {
    console.error('send-alerts: Resend trade error:', err.message)
    return false
  }
}

// ── Email: net worth update ───────────────────────────────────────────────────
async function sendNetWorthAlertEmail(email, firstName, filings) {
  if (!resend) return false

  const fmt = (n) => n == null ? 'N/A' : new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
  }).format(n)

  const rows = filings.map(f => {
    const range = f.netWorthMax && f.netWorthMax !== f.netWorthMin
      ? `${fmt(f.netWorthMin)} – ${fmt(f.netWorthMax)}`
      : fmt(f.netWorthMin)
    return `
      <div style="margin-bottom:16px;padding:16px;background:rgba(27,42,107,0.4);border:1px solid rgba(212,175,55,0.2);border-radius:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:15px;font-weight:700;color:#F8F9FF;">${f.repName}</span>
          <a href="https://www.civicwatch.app?rep=${f.bioguideId}" style="font-size:11px;color:#D4AF37;text-decoration:none;">View profile →</a>
        </div>
        <div style="font-size:13px;color:#CDD2E0;">
          <span style="color:#8892A4;">FY ${f.reportYear} Net Worth: </span>
          <strong style="color:#F8F9FF;">${range}</strong>
        </div>
      </div>`
  }).join('')

  const greeting = firstName ? `, ${firstName}` : ''
  const repCount = new Set(filings.map(f => f.bioguideId)).size

  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: `📊 New net worth filing${repCount > 1 ? 's' : ''} from your tracked representatives`,
      html: emailWrapper(`
        <div style="margin-bottom:24px;">
          <h2 style="color:#D4AF37;font-size:18px;margin:0 0 6px;">Net Worth Updates${greeting}</h2>
          <p style="color:#CDD2E0;font-size:13px;line-height:1.7;margin:0;">
            New financial disclosure data is available for ${repCount === 1 ? '1 representative' : `${repCount} representatives`} you track.
          </p>
        </div>
        ${rows}
      `),
    })
    return true
  } catch (err) {
    console.error('send-alerts: Resend networth error:', err.message)
    return false
  }
}

// ── Shared email shell ────────────────────────────────────────────────────────
function emailWrapper(body) {
  return `
    <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
      <div style="text-align:center;margin-bottom:28px;">
        <span style="font-size:48px;">🏛️</span>
        <h1 style="font-size:24px;font-weight:900;margin:12px 0 4px;letter-spacing:1px;">
          CIVIC<span style="color:#D4AF37">WATCH</span>
        </h1>
        <p style="color:#8892A4;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Your Representatives. Accountable.</p>
      </div>
      ${body}
      <div style="text-align:center;margin:28px 0 20px;">
        <a href="https://www.civicwatch.app/dashboard"
          style="display:inline-block;padding:12px 32px;background:#B22234;color:white;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
          View on CivicWatch →
        </a>
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:20px 0;" />
      <p style="color:#8892A4;font-size:11px;text-align:center;margin:0;line-height:1.8;">
        You're receiving this because you tracked these representatives on CivicWatch.<br/>
        Manage alerts in your <a href="https://www.civicwatch.app/dashboard" style="color:#D4AF37;">dashboard</a>
        · <a href="mailto:support@civicwatch.app" style="color:#D4AF37;">support@civicwatch.app</a>
      </p>
    </div>
  `
}
