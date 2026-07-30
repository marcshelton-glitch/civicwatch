import { auth, currentUser } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { getProMonthlyPriceId, PriceConfigError } from '@/lib/stripe-prices'

// Lazy — see app/api/pro-count/route.js for why this isn't module-scope.
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

// CivicWatch sells exactly one paid tier: Pro, $9.99/mo.
//
// This route previously carried a voter_pro / civic_pack PRICE_MAP imported
// from the California Candidate Calculator's pricing model. voter_pro pointed
// at STRIPE_VOTER_PRO_MONTHLY_PRICE_ID — a live price on the *other* product.
// It was only ever unreachable because PaymentRequestButton is not mounted;
// mounting it would have charged CivicWatch customers against that product.
// The map is gone. There is one price, and it is validated before use.

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

  const { paymentMethodId } = body

  if (!paymentMethodId || typeof paymentMethodId !== 'string') {
    return Response.json({ error: 'paymentMethodId is required' }, { status: 400 })
  }

  const user = await currentUser()
  if (user?.publicMetadata?.isPro === true) {
    return Response.json({ error: 'Already subscribed' }, { status: 400 })
  }

  let priceId
  try {
    priceId = getProMonthlyPriceId()
  } catch (err) {
    if (err instanceof PriceConfigError) {
      console.error('STRIPE PRICE MISCONFIGURED —', err.message)
      return Response.json(
        { error: 'Checkout is temporarily unavailable. Our team has been notified.' },
        { status: 503 }
      )
    }
    throw err
  }

  try {
    const email = user?.emailAddresses?.[0]?.emailAddress
    let customerId = user?.publicMetadata?.stripeCustomerId

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email,
        metadata: { clerkUserId: userId },
      })
      customerId = customer.id
    }

    await getStripe().paymentMethods.attach(paymentMethodId, { customer: customerId })
    await getStripe().customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const subscription = await getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      metadata: { clerkUserId: userId, tier: 'pro' },
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
