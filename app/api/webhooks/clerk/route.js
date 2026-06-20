import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { scheduleUserSequence, sendSequenceEmail } from '@/lib/email-sequences'

export const runtime = 'nodejs'

function verifySignature(headers, body, secret) {
  const id = headers.get('svix-id')
  const ts = headers.get('svix-timestamp')
  const sig = headers.get('svix-signature')
  if (!id || !ts || !sig) return false

  const tsNum = parseInt(ts, 10)
  if (isNaN(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > 300) return false

  let key
  try {
    key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  } catch { return false }

  const computed = 'v1,' + crypto.createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64')

  return sig.split(' ').some(s => {
    try {
      return s.length === computed.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(computed))
    } catch { return false }
  })
}

export async function POST(request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const body = await request.text()
  if (!verifySignature(request.headers, body, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event
  try { event = JSON.parse(body) }
  catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  if (event.type !== 'user.created') return NextResponse.json({ received: true })

  const { id, email_addresses, primary_email_address_id, first_name, public_metadata, unsafe_metadata } = event.data

  const primaryEmail = email_addresses?.find(e => e.id === primary_email_address_id)?.email_address
    ?? email_addresses?.[0]?.email_address

  if (!primaryEmail) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const state = public_metadata?.state ?? unsafe_metadata?.state ?? null

  try {
    const day0 = await scheduleUserSequence(id, primaryEmail, first_name || null, state)
    await sendSequenceEmail(day0, false)
  } catch (err) {
    console.error('[clerk-webhook] email sequence error:', err)
  }

  return NextResponse.json({ received: true })
}
