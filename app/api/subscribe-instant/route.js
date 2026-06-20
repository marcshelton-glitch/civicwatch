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

    // Attach the payment method to the customer and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID }],
      default_payment_method: paymentMethodId,
      metadata: { clerkUserId: userId },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const status = subscription.status
    const paymentIntent = subscription.latest_invoice?.payment_intent

    // Already active (e.g. trial or instant payment collected)
    if (status === 'active') {
      return Response.json({ success: true, subscriptionId: subscription.id })
    }

    // Payment intent needs confirmation (e.g. 3DS challenge)
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
