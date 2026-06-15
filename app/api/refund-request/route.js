import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const getStripe = () => process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get actual Clerk user — do not trust email from request body
  const clerkUser = await currentUser()
  const verifiedEmail = clerkUser?.emailAddresses?.[0]?.emailAddress
  if (!verifiedEmail) {
    return NextResponse.json({ error: 'Could not verify account email.' }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, paymentDate, plan, reason, evidence } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
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

  // Validate plan against Stripe subscription when possible
  const stripe = getStripe()
  if (stripe) {
    try {
      const customers = await stripe.customers.list({ limit: 1, email: verifiedEmail })
      const customer = customers.data[0]
      if (customer) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 })
        const activeSub = subs.data.find(s => ['active', 'past_due', 'trialing'].includes(s.status))
        if (activeSub) {
          const priceId = activeSub.items.data[0]?.price?.id || ''
          const isMonthly = priceId.toLowerCase().includes('month') || activeSub.items.data[0]?.price?.recurring?.interval === 'month'
          const submittedPlanIsMonthly = plan === 'pro_monthly'
          if (isMonthly !== submittedPlanIsMonthly) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
          }
        }
      }
    } catch (stripeErr) {
      console.error('refund-request: Stripe validation error:', stripeErr.message)
      // Proceed — don't block valid refund requests on Stripe lookup failures
    }
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('refund_requests').insert({
    user_id: userId,
    email: verifiedEmail,  // always use Clerk-verified email, never body email
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
