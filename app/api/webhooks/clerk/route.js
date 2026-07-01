import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { Resend } from 'resend'

// CLERK_WEBHOOK_SECRET: Clerk Dashboard → Webhooks → add endpoint
// https://civicwatch.app/api/webhooks/clerk → copy the signing secret → add to Vercel env vars
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const runtime = 'nodejs'

async function sendFreeWelcomeEmail(email, firstName) {
  if (!resend || !email) return
  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: 'Welcome to CivicWatch 🏛️',
      html: `
        <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;">🏛️</span>
            <h1 style="font-family:'Georgia',serif;font-size:28px;font-weight:900;margin:16px 0 4px;letter-spacing:1px;">
              CIVIC<span style="color:#D4AF37">WATCH</span>
            </h1>
            <p style="color:#8892A4;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0;">Your Representatives. Accountable.</p>
          </div>
          <div style="background:rgba(27,42,107,0.5);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:28px;margin-bottom:24px;">
            <h2 style="color:#D4AF37;font-size:20px;margin:0 0 12px;">Welcome${firstName ? ', ' + firstName : ''}!</h2>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 16px;">
              CivicWatch tracks what Congress actually does — stock trades made while writing the laws, net worth growth on a government salary, and voting records your rep would rather you forget.
            </p>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 20px;">
              Your free account includes:
            </p>
            <ul style="color:#CDD2E0;font-size:14px;line-height:2;padding-left:20px;margin:0 0 24px;">
              <li>🗳️ <strong style="color:#F8F9FF;">Voting Records</strong> — See exactly how your rep votes</li>
              <li>💰 <strong style="color:#F8F9FF;">Net Worth Tracker</strong> — Public wealth estimates for every member</li>
              <li>📈 <strong style="color:#F8F9FF;">Stock Trades</strong> — Recent STOCK Act filings, free tier</li>
              <li>🏆 <strong style="color:#F8F9FF;">Leaderboard</strong> — Which members trade the most</li>
            </ul>
            <a href="https://www.civicwatch.app/leaderboard" style="display:inline-block;padding:12px 28px;background:#B22234;color:white;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.5px;margin-right:12px;">
              View the Leaderboard →
            </a>
          </div>
          <p style="color:#CDD2E0;font-size:13px;text-align:center;line-height:1.8;margin:0 0 16px;">
            Want AI conflict scoring, full trade history, and real-time alerts?<br>
            <a href="https://www.civicwatch.app/pro" style="color:#D4AF37;text-decoration:none;font-weight:700;">Upgrade to Pro</a> — cancel anytime.
          </p>
          <p style="color:#8892A4;font-size:12px;text-align:center;margin:0;">
            Questions? <a href="mailto:support@civicwatch.app" style="color:#D4AF37;">support@civicwatch.app</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Free welcome email failed:', err.message)
  }
}

export async function POST(request) {
  const body = await request.text()

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  let event
  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (err) {
    console.error('Clerk webhook verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const email = event.data.email_addresses?.[0]?.email_address
    const firstName = event.data.first_name || ''
    await sendFreeWelcomeEmail(email, firstName)
    console.log('✅ Free welcome email sent to new user')
  }

  return NextResponse.json({ received: true })
}
