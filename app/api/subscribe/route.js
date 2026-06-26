import { auth, currentUser } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { getUserTier, tierAtLeast } from '@/lib/tier-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ── NEW ENV VARS REQUIRED IN VERCEL ──────────────────────────────────────────
// STRIPE_VOTER_PRO_MONTHLY_PRICE_ID  — Voter Pro $3.99/mo recurring
// STRIPE_VOTER_PRO_ONETIME_PRICE_ID  — Voter Pro $9.99 one-time
// STRIPE_PRO_PRICE_ID                — Civic Pack $9.99/mo recurring (existing)
// STRIPE_CIVIC_PACK_ONETIME_PRICE_ID — Civic Pack $19.99 one-time
// ─────────────────────────────────────────────────────────────────────────────

const PRICE_MAP = {
  voter_pro: {
    subscription: () => process.env.STRIPE_VOTER_PRO_MONTHLY_PRICE_ID,
    onetime:      () => process.env.STRIPE_VOTER_PRO_ONETIME_PRICE_ID,
  },
  civic_pack: {
    subscription: () => process.env.STRIPE_PRO_PRICE_ID,
    onetime:      () => process.env.STRIPE_CIVIC_PACK_ONETIME_PRICE_ID,
  },
}

const VALID_TIERS = ['voter_pro', 'civic_pack']
const VALID_PAYMENT_TYPES = ['subscription', 'onetime']

function getSafeAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || ''
  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    throw new Error('NEXT_PUBLIC_APP_URL must be a valid https URL')
  }
  return url.replace(/\/$/, '')
}

export async function POST(request) {
  const contentType = request.headers.get('content-type') || ''
  if (contentType && !contentType.includes('application/json') && contentType !== '') {
    if (contentType.includes('text/') || contentType.includes('multipart/')) {
      return Response.json({ error: 'Invalid content type' }, { status: 415 })
    }
  }

  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()

  // ── Parse body for tier + paymentType ─────────────────────────────────────
  let tier = 'civic_pack'
  let paymentType = 'subscription'
  try {
    const body = await request.json().catch(() => ({}))
    if (body.tier && VALID_TIERS.includes(body.tier)) tier = body.tier
    if (body.paymentType && VALID_PAYMENT_TYPES.includes(body.paymentType)) paymentType = body.paymentType
  } catch { /* use defaults */ }

  // ── Already at this tier or higher ────────────────────────────────────────
  const currentTier = getUserTier(user)
  if (currentTier !== 'free' && tierAtLeast(currentTier, tier)) {
    return Response.json({ error: 'Already subscribed to this tier or higher' }, { status: 400 })
  }

  // ── Resolve price ID ──────────────────────────────────────────────────────
  const priceId = PRICE_MAP[tier]?.[paymentType]?.()
  if (!priceId) {
    return Response.json({ error: `Price not configured for ${tier}/${paymentType}` }, { status: 500 })
  }

  try {
    const appUrl = getSafeAppUrl()
    const email = user?.emailAddresses?.[0]?.emailAddress

    let customerId = user?.publicMetadata?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      })
      customerId = customer.id
    }

    const isOnetime = paymentType === 'onetime'

    const session = await stripe.checkout.sessions.create({
      mode: isOnetime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { clerkUserId: userId, tier, paymentType },
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url: `${appUrl}/pro?upgrade=cancelled`,
    }, {
      idempotencyKey: `checkout-${userId}-${tier}-${paymentType}-${Math.floor(Date.now() / 60000)}`,
    })

    return Response.json({ url: session.url }, { headers: { 'Cache-Control': 'private, no-store' } })

  } catch (err) {
    console.error('Stripe checkout error:', err.message)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
