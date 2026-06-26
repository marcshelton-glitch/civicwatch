import { auth, currentUser } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { getUserTier, tierAtLeast } from '@/lib/tier-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_MAP = {
  voter_pro: () => process.env.STRIPE_VOTER_PRO_MONTHLY_PRICE_ID,
  civic_pack: () => process.env.STRIPE_PRO_PRICE_ID,
}

const VALID_TIERS = ['voter_pro', 'civic_pack']

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { paymentMethodId, tier: rawTier } = body
  const tier = VALID_TIERS.includes(rawTier) ? rawTier : 'civic_pack'

  if (!paymentMethodId || typeof paymentMethodId !== 'string') {
    return Response.json({ error: 'paymentMethodId is required' }, { status: 400 })
  }

  const user = await currentUser()
  const currentTier = getUserTier(user)
  if (currentTier !== 'free' && tierAtLeast(currentTier, tier)) {
    return Response.json({ error: 'Already subscribed to this tier or higher' }, { status: 400 })
  }

  const priceId = PRICE_MAP[tier]?.()
  if (!priceId) {
    return Response.json({ error: `Price not configured for ${tier}` }, { status: 500 })
  }

  try {
    const email = user?.emailAddresses?.[0]?.emailAddress
    let customerId = user?.publicMetadata?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { clerkUserId: userId },
      })
      customerId = customer.id
    }

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: { clerkUserId: userId, tier },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const status = subscription.status
    const paymentIntent = subscription.latest_invoice?.payment_intent

    if (status === 'active') {
      return Response.json({ success: true, subscriptionId: subscription.id })
    }

    if (paymentIntent?.client_secret) {
      return Response.json({
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
      })
    }

    return Response.json({ error: 'Unexpected subscription state' }, { status: 500 })
  } catch (err) {
    console.error('subscribe-instant error:', err.message)
    return Response.json({ error: err.message || 'Failed to create subscription' }, { status: 500 })
  }
}
