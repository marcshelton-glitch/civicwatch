import { auth, currentUser } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function getSafeAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || ''
  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    throw new Error('NEXT_PUBLIC_APP_URL must be a valid https URL')
  }
  return url.replace(/\/$/, '')
}

export async function POST(request) {
  // ── Content-Type check ────────────────────────────────────────────────────
  // Subscribe sends no body but check anyway to reject malformed requests
  const contentType = request.headers.get('content-type') || ''
  // Allow requests with no body (empty POST) or application/json
  if (contentType && !contentType.includes('application/json') && contentType !== '') {
    // Only reject explicitly wrong content types, not missing ones
    if (contentType.includes('text/') || contentType.includes('multipart/')) {
      return Response.json({ error: 'Invalid content type' }, { status: 415 })
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()

  // ── Already Pro ───────────────────────────────────────────────────────────
  if (user?.publicMetadata?.isPro === true) {
    return Response.json({ error: 'Already subscribed' }, { status: 400 })
  }

  try {
    const appUrl = getSafeAppUrl()
    const email = user?.emailAddresses?.[0]?.emailAddress

    // ── Reuse existing Stripe customer if one was stored ──────────────────
    // This prevents duplicate customers in Stripe for the same Clerk user
    let customerId = user?.publicMetadata?.stripeCustomerId

    if (!customerId) {
      // ✅ Create a Stripe Customer and store clerkUserId on it
      // This enables the webhook to look up users by customerId directly
      // at any scale — no scanning user list required
      const customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      customer: customerId,
      client_reference_id: userId,
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { clerkUserId: userId },
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url: `${appUrl}/dashboard?upgrade=cancelled`,
    }, {
      idempotencyKey: `checkout-${userId}-${Math.floor(Date.now() / 60000)}`,
    })

    return Response.json({ url: session.url }, { headers: { 'Cache-Control': 'private, no-store' } })

  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}