import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || 'marc@civicwatch.app')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

async function isAdmin() {
  const user = await currentUser()
  if (!user) return false
  const email = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
  return email && getAdminEmails().includes(email)
}

// GET /api/refund-approve — list all refund requests (admin only)
export async function GET() {
  const { userId } = await auth()
  if (!userId || !(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch requests.' }, { status: 500 })
  }

  return NextResponse.json({ requests: data })
}

// POST /api/refund-approve — approve or deny a request (admin only)
export async function POST(request) {
  const { userId } = await auth()
  if (!userId || !(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await currentUser()
  const reviewerEmail = user?.emailAddresses?.[0]?.emailAddress || userId

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { requestId, action, notes } = body
  if (!requestId) return NextResponse.json({ error: 'requestId is required.' }, { status: 400 })
  if (!['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve" or "deny".' }, { status: 400 })
  }

  const supabase = getSupabase()

  if (action === 'deny') {
    const { error } = await supabase
      .from('refund_requests')
      .update({ status: 'denied', notes: notes || null, reviewed_by: reviewerEmail, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update request.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  // action === 'approve'
  const { data: refundReq, error: fetchError } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !refundReq) {
    return NextResponse.json({ error: 'Refund request not found.' }, { status: 404 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  // Find Stripe customer by email
  const customers = await stripe.customers.list({ email: refundReq.email, limit: 5 })
  if (!customers.data.length) {
    return NextResponse.json({ error: `No Stripe customer found for email: ${refundReq.email}` }, { status: 404 })
  }
  const customerId = customers.data[0].id

  // Get latest invoice
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 1 })
  if (!invoices.data.length) {
    return NextResponse.json({ error: 'No invoices found for this customer.' }, { status: 404 })
  }
  const invoice = invoices.data[0]

  if (!invoice.payment_intent) {
    return NextResponse.json({ error: 'Invoice has no payment intent — may have been paid via credit or balance.' }, { status: 422 })
  }

  // Issue refund
  const refund = await stripe.refunds.create({ payment_intent: invoice.payment_intent })

  // Update Supabase
  const { error: updateError } = await supabase
    .from('refund_requests')
    .update({
      status: 'approved',
      notes: notes || null,
      stripe_refund_id: refund.id,
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (updateError) {
    console.error('Supabase update error after Stripe refund:', updateError)
    // Refund already issued — log but don't fail the response
  }

  return NextResponse.json({ success: true, refundId: refund.id })
}
