import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, paymentDate, plan, reason, evidence } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  if (!paymentDate) return NextResponse.json({ error: 'Payment date is required.' }, { status: 400 })
  if (!plan) return NextResponse.json({ error: 'Subscription plan is required.' }, { status: 400 })
  if (!reason?.trim() || reason.trim().length < 50) {
    return NextResponse.json({ error: 'Please describe the service issue in at least 50 characters.' }, { status: 400 })
  }

  const paymentMs = new Date(paymentDate).getTime()
  const nowMs = Date.now()
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
  if (isNaN(paymentMs) || paymentMs > nowMs) {
    return NextResponse.json({ error: 'Payment date must be a valid past date.' }, { status: 400 })
  }
  if (nowMs - paymentMs > fourteenDaysMs) {
    return NextResponse.json({ error: 'Refund requests must be submitted within 14 days of the original payment date.' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('refund_requests').insert({
    user_id: userId,
    email: email.trim(),
    name: name.trim(),
    payment_date: paymentDate,
    plan,
    reason: reason.trim(),
    evidence_description: evidence?.trim() || null,
    status: 'pending',
  })

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: 'Failed to submit request. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
