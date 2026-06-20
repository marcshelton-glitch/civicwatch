import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const FROM = 'CivicWatch <noreply@civicwatch.app>'
const BASE = 'https://www.civicwatch.app'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function scheduleUserSequence(userId, email, firstName, state) {
  const supabase = getSupabase()
  const now = new Date()

  const records = [0, 1, 7, 30].map(day => {
    const scheduled = new Date(now)
    scheduled.setDate(scheduled.getDate() + day)
    return {
      user_id: userId,
      email,
      first_name: firstName || null,
      sequence_day: day,
      scheduled_for: scheduled.toISOString(),
      state: state || null,
      status: 'pending',
    }
  })

  const { error } = await supabase
    .from('email_sequences')
    .upsert(records, { onConflict: 'user_id,sequence_day', ignoreDuplicates: true })

  if (error) throw error

  const { data: day0 } = await supabase
    .from('email_sequences')
    .select()
    .eq('user_id', userId)
    .eq('sequence_day', 0)
    .single()

  return day0 || records[0]
}

export async function sendSequenceEmail(record, currentlyPro = false) {
  const supabase = getSupabase()

  if (record.sequence_day === 7 && currentlyPro) {
    if (record.id) await supabase.from('email_sequences')
      .update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', record.id)
    return { skipped: true }
  }

  let emailData
  try {
    if (record.sequence_day === 0) emailData = buildDay0(record)
    else if (record.sequence_day === 1) emailData = await buildDay1(record, supabase)
    else if (record.sequence_day === 7) emailData = buildDay7(record)
    else if (record.sequence_day === 30) emailData = await buildDay30(record, supabase, currentlyPro)
    else throw new Error(`Unknown sequence_day: ${record.sequence_day}`)
  } catch (err) {
    if (record.id) await supabase.from('email_sequences').update({ status: 'failed' }).eq('id', record.id)
    throw err
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ from: FROM, to: record.email, subject: emailData.subject, html: emailData.html })

  if (record.id) await supabase.from('email_sequences')
    .update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', record.id)

  return { sent: true }
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function wrap(content) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#060E1E;">
<div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
  <div style="text-align:center;margin-bottom:28px;">
    <span style="font-size:40px;">&#127963;</span>
    <h1 style="font-size:26px;font-weight:900;margin:10px 0 4px;letter-spacing:2px;color:#F8F9FF;">CIVIC<span style="color:#D4AF37;">WATCH</span></h1>
    <p style="color:#8892A4;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Your Representatives. Accountable.</p>
  </div>
  ${content}
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0 20px;">
  <p style="color:#8892A4;font-size:11px;text-align:center;margin:0;line-height:1.8;">
    You received this because you signed up for CivicWatch.<br>
    <a href="mailto:support@civicwatch.app" style="color:#D4AF37;">support@civicwatch.app</a>
  </p>
</div></body></html>`
}

function card(html) {
  return `<div style="background:rgba(27,42,107,0.5);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:22px;margin-bottom:14px;">${html}</div>`
}

function goldCta(text, url) {
  return `<div style="text-align:center;margin:28px 0;"><a href="${url}" style="display:inline-block;padding:14px 36px;background:#D4AF37;color:#0A1628;text-decoration:none;border-radius:10px;font-size:14px;font-weight:800;letter-spacing:0.5px;">${text}</a></div>`
}

function redCta(text, url) {
  return `<div style="text-align:center;margin:20px 0 0;"><a href="${url}" style="display:inline-block;padding:14px 36px;background:#B22234;color:#F8F9FF;text-decoration:none;border-radius:10px;font-size:14px;font-weight:800;letter-spacing:0.5px;">${text}</a></div>`
}

function eyebrow(text) {
  return `<p style="color:#D4AF37;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">${text}</p>`
}

// ── Day 0 — Welcome ───────────────────────────────────────────────────────────

function buildDay0({ first_name }) {
  const name = first_name ? `, ${first_name}` : ''
  const steps = [
    {
      step: '01', title: 'Search your rep',
      body: 'Find every STOCK Act trade, vote, net worth filing, and conflict score for any U.S. senator or representative.',
      url: `${BASE}/dashboard`, linkText: 'Open Dashboard &rarr;',
    },
    {
      step: '02', title: 'Set an alert',
      body: 'Get notified the moment your rep files a new trade or casts a vote you care about.',
      url: `${BASE}/dashboard?tab=alerts`, linkText: 'Set Up Alerts &rarr;',
    },
    {
      step: '03', title: 'Pin to home screen',
      body: 'On mobile, tap Share &rarr; &ldquo;Add to Home Screen&rdquo; for instant one-tap access without the browser.',
      url: null, linkText: null,
    },
  ]

  const stepsHtml = steps.map(s => card(`
    ${eyebrow(`STEP ${s.step} &mdash; ${s.title}`)}
    <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0${s.url ? ' 0 10px' : ''};">${s.body}</p>
    ${s.url ? `<a href="${s.url}" style="color:#D4AF37;font-size:13px;font-weight:700;text-decoration:none;">${s.linkText}</a>` : ''}
  `)).join('')

  return {
    subject: "You've got the receipts. Here's how to use them.",
    html: wrap(`
      <h2 style="color:#F8F9FF;font-size:22px;font-weight:700;line-height:1.3;margin:0 0 8px;">Welcome to CivicWatch${name}.</h2>
      <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0 0 24px;">Every STOCK Act trade, every vote, every dollar &mdash; public record, now searchable. Here&rsquo;s how to get started:</p>
      ${stepsHtml}
      ${goldCta('Search your rep now &rarr;', `${BASE}/dashboard`)}
    `)
  }
}

// ── Day 1 — First trade alert ─────────────────────────────────────────────────

async function buildDay1({ state }, supabase) {
  let trade = null

  if (state) {
    const { data } = await supabase.from('senate_trades')
      .select('first_name, last_name, asset_name, ticker, transaction_type, amount_str, transaction_date')
      .eq('state', state.toUpperCase())
      .not('asset_name', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    trade = data
  }

  if (!trade) {
    const { data } = await supabase.from('senate_trades')
      .select('first_name, last_name, asset_name, ticker, transaction_type, amount_str, transaction_date')
      .not('ticker', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    trade = data
  }

  if (!trade) {
    return {
      subject: "Here's a trade you might have missed",
      html: wrap(`
        <h2 style="color:#F8F9FF;font-size:22px;font-weight:700;margin:0 0 12px;">Your representatives are trading.</h2>
        <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0 0 24px;">Under the STOCK Act, members of Congress must disclose stock trades within 45 days. Head to your dashboard to see the latest from your reps.</p>
        ${goldCta('See the full record &rarr;', `${BASE}/dashboard`)}
      `)
    }
  }

  const senatorName = `Sen. ${trade.first_name} ${trade.last_name}`
  const txLower = (trade.transaction_type || '').toLowerCase()
  const txVerb = txLower.includes('purchase') ? 'purchased' : txLower.includes('sale') ? 'sold' : (trade.transaction_type || 'traded')
  const txCap = txVerb.charAt(0).toUpperCase() + txVerb.slice(1)
  const ticker = trade.ticker ? ` (${trade.ticker})` : ''
  const amount = trade.amount_str || 'an undisclosed amount'
  const tradeDate = trade.transaction_date
    ? new Date(trade.transaction_date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'recently'

  return {
    subject: "Here's a trade you might have missed",
    html: wrap(`
      ${eyebrow('STOCK ACT DISCLOSURE')}
      <h2 style="color:#F8F9FF;font-size:22px;font-weight:700;margin:0 0 20px;">Here&rsquo;s a trade you might have missed</h2>
      ${card(`
        <p style="color:#8892A4;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">${tradeDate}</p>
        <p style="color:#F8F9FF;font-size:16px;font-weight:700;margin:0 0 6px;">${senatorName}</p>
        <p style="color:#CDD2E0;font-size:14px;margin:0 0 14px;">${txCap} <strong style="color:#F8F9FF;">${trade.asset_name}${ticker}</strong> &mdash; <strong style="color:#D4AF37;">${amount}</strong></p>
        <p style="color:#8892A4;font-size:12px;line-height:1.6;margin:0;">Under the STOCK Act, members of Congress must disclose stock trades within 45 days of the transaction date.</p>
      `)}
      <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0 0 8px;">This is one disclosure among thousands. See the complete trading history for all your representatives.</p>
      ${goldCta('See the full record &rarr;', `${BASE}/dashboard`)}
    `)
  }
}

// ── Day 7 — AI report preview (free users only) ───────────────────────────────

function buildDay7({ state }) {
  const stateLabel = state ? `for your ${state} senators` : 'for your senators'

  return {
    subject: "Your senators' AI accountability report (preview)",
    html: wrap(`
      ${eyebrow('AI ACCOUNTABILITY REPORT &mdash; PREVIEW')}
      <h2 style="color:#F8F9FF;font-size:22px;font-weight:700;margin:0 0 8px;">Your senators&rsquo; AI report</h2>
      <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0 0 20px;">CivicWatch Pro generates this analysis ${stateLabel}. Here&rsquo;s a preview:</p>
      ${card(`
        <p style="color:#D4AF37;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">CONFLICT-OF-INTEREST SCORE: <span style="color:#F8F9FF;">7.4 / 10</span></p>
        <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0 0 12px;"><strong style="color:#F8F9FF;">14 trades</strong> were made in sectors directly tied to committee assignments over the past 12 months. Cross-referencing vote records shows a statistically significant correlation between portfolio moves and policy positions.</p>
        <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:0 0 12px;">Net worth trajectory: <strong style="color:#F8F9FF;">+$1.2M</strong> during session &mdash; outperforming the S&amp;P 500 by <strong style="color:#D4AF37;">34%</strong>. Key holdings include tech, defense, and pharma &mdash; all sectors with active legislation on the floor.</p>
        <p style="color:#8892A4;font-size:13px;line-height:1.6;margin:0 0 16px;">Detailed vote-to-trade timeline: On March 3rd, a $50,000&ndash;$100,000 purchase of defense contractor stock was filed 11 days before a committee vote on the defense appropriations bill. The senator voted yes. Pattern analysis across 8 similar instances shows&hellip;</p>
        <div style="border-top:2px dashed rgba(212,175,55,0.35);padding-top:16px;text-align:center;">
          <p style="color:#D4AF37;font-size:14px;font-weight:700;margin:0 0 6px;">&#128274; Full report locked</p>
          <p style="color:#8892A4;font-size:12px;line-height:1.6;margin:0;">Upgrade to Pro to see the complete vote-to-trade timeline, wealth analysis, and conflict scoring for every rep you track.</p>
        </div>
      `)}
      ${redCta('Unlock full report &rarr;', `${BASE}/pro`)}
    `)
  }
}

// ── Day 30 — Month in accountability ─────────────────────────────────────────

async function buildDay30({ state }, supabase, currentlyPro) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const monthLabel = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  let totalTrades = 0
  let topTraders = []

  try {
    const { data: trades } = await supabase.from('senate_trades')
      .select('first_name, last_name')
      .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0])
      .limit(500)

    if (trades?.length) {
      totalTrades = trades.length
      const counts = {}
      trades.forEach(t => {
        const key = `Sen. ${t.first_name} ${t.last_name}`
        counts[key] = (counts[key] || 0) + 1
      })
      topTraders = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))
    }
  } catch (_) {}

  const tradersHtml = topTraders.length
    ? topTraders.map((t, i) => `<p style="color:#CDD2E0;font-size:14px;margin:0 0 8px;">#${i + 1} <strong style="color:#F8F9FF;">${t.name}</strong> &mdash; <span style="color:#D4AF37;">${t.count} trades</span></p>`).join('')
    : `<p style="color:#8892A4;font-size:13px;margin:0;">No trade data available for this period.</p>`

  const upgradeSection = currentlyPro ? '' : `
    <div style="background:rgba(178,34,52,0.1);border:1px solid rgba(178,34,52,0.35);border-radius:12px;padding:22px;text-align:center;margin-top:20px;">
      <p style="color:#F8F9FF;font-size:15px;font-weight:700;margin:0 0 8px;">Go deeper with CivicWatch Pro</p>
      <p style="color:#CDD2E0;font-size:13px;margin:0 0 4px;">AI conflict analysis, vote-to-trade timelines, and real-time alerts for every rep you track.</p>
      ${redCta('Go Pro &rarr;', `${BASE}/pro`)}
    </div>`

  return {
    subject: 'Your month in accountability',
    html: wrap(`
      ${eyebrow(`YOUR ${monthLabel.toUpperCase()} RECAP`)}
      <h2 style="color:#F8F9FF;font-size:22px;font-weight:700;margin:0 0 20px;">One month of watching power</h2>
      ${card(`
        <p style="color:#8892A4;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 10px;">SENATE STOCK ACT TRADES DISCLOSED</p>
        <p style="color:#D4AF37;font-size:48px;font-weight:900;margin:0 0 4px;line-height:1;">${totalTrades}</p>
        <p style="color:#CDD2E0;font-size:13px;margin:0;">trades filed in the past 30 days</p>
      `)}
      ${topTraders.length ? card(`
        <p style="color:#8892A4;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px;">MOST ACTIVE TRADERS</p>
        ${tradersHtml}
      `) : ''}
      <p style="color:#CDD2E0;font-size:14px;line-height:1.7;margin:16px 0;">You&rsquo;ve been keeping watch for a month. Every disclosure you&rsquo;ve seen is public record &mdash; and CivicWatch keeps it searchable.</p>
      ${goldCta("See this month&rsquo;s trades &rarr;", `${BASE}/dashboard`)}
      ${upgradeSection}
    `)
  }
}
