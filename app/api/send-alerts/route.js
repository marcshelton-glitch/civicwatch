import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function checkAuth(request) {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return auth === `Bearer ${expected}`
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

  // ── 2. Determine new-filing window (25h to overlap the 24h cron cadence) ──
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

  // ── 3. Fetch new House PTR filings (fd_filings) ───────────────────────────
  const { data: newHouseFilings } = await supabase
    .from('fd_filings')
    .select('doc_id, last_name, bioguide_id, filing_date, pdf_url, year')
    .eq('filing_type', 'P')
    .gt('created_at', cutoff)

  // ── 4. Fetch new Senate filings (distinct filing_id from senate_trades) ───
  const { data: newSenTrades } = await supabase
    .from('senate_trades')
    .select('filing_id, last_name, filing_date, ptr_url')
    .gt('created_at', cutoff)

  // Deduplicate senate trades by filing_id (one email entry per filing, not per trade)
  const senFilingsMap = {}
  for (const t of newSenTrades || []) {
    if (!senFilingsMap[t.filing_id]) senFilingsMap[t.filing_id] = t
  }
  const newSenFilings = Object.values(senFilingsMap)

  if ((newHouseFilings || []).length === 0 && newSenFilings.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No new filings in window' })
  }

  // ── 5. Group tracked reps by user_id ─────────────────────────────────────
  const byUser = {}
  for (const row of allTracked) {
    if (!byUser[row.user_id]) byUser[row.user_id] = []
    byUser[row.user_id].push(row)
  }

  // ── 6. Process each user ──────────────────────────────────────────────────
  let sentCount = 0

  for (const [userId, trackedReps] of Object.entries(byUser)) {
    // Find new filings for this user's tracked reps
    const userNewFilings = []

    for (const rep of trackedReps) {
      const lastNameLower = (rep.last_name || '').toLowerCase()

      if (!rep.is_senator) {
        // House: match by bioguide_id first, then last_name fallback
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
        // Senate: match by last_name
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

    // ── 7. Filter out already-sent alerts ──────────────────────────────────
    const filingIds = userNewFilings.map(f => f.filingId)
    const { data: alreadySent } = await supabase
      .from('sent_alerts')
      .select('filing_id')
      .eq('user_id', userId)
      .in('filing_id', filingIds)

    const sentIds = new Set((alreadySent || []).map(r => r.filing_id))
    const toSend = userNewFilings.filter(f => !sentIds.has(f.filingId))

    if (toSend.length === 0) continue

    // ── 8. Get user email from Clerk ───────────────────────────────────────
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

    // ── 9. Send the email ──────────────────────────────────────────────────
    const emailSent = await sendAlertEmail(email, firstName, toSend)
    if (!emailSent) continue

    sentCount++

    // ── 10. Record sent alerts (UNIQUE constraint handles any races) ───────
    const records = toSend.map(f => ({
      user_id: userId,
      bioguide_id: f.bioguideId,
      filing_id: f.filingId,
    }))
    await supabase
      .from('sent_alerts')
      .upsert(records, { onConflict: 'user_id,filing_id', ignoreDuplicates: true })
  }

  console.log(`send-alerts: done — emailed ${sentCount} users`)
  return NextResponse.json({ sent: sentCount })
}

// ── Email template ─────────────────────────────────────────────────────────────
async function sendAlertEmail(email, firstName, filings) {
  if (!resend) return false

  // Group filings by rep for cleaner layout
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
      html: `
        <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="font-size:48px;">🏛️</span>
            <h1 style="font-size:24px;font-weight:900;margin:12px 0 4px;letter-spacing:1px;">
              CIVIC<span style="color:#D4AF37">WATCH</span>
            </h1>
            <p style="color:#8892A4;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Your Representatives. Accountable.</p>
          </div>

          <div style="margin-bottom:24px;">
            <h2 style="color:#D4AF37;font-size:18px;margin:0 0 6px;">New Trade Disclosures${greeting}</h2>
            <p style="color:#CDD2E0;font-size:13px;line-height:1.7;margin:0;">${subtitle}</p>
          </div>

          ${repRows}

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
      `,
    })
    return true
  } catch (err) {
    console.error('send-alerts: Resend error:', err.message)
    return false
  }
}
