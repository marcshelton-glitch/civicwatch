import Stripe from 'stripe'
import { createClerkClient } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function POST(request) {
  const sig = request.headers.get('stripe-signature')
  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const clerkUserId = session.metadata?.clerkUserId
      console.log('Session metadata:', session.metadata)
      console.log('Clerk user ID:', clerkUserId)

      if (clerkUserId) {
        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: { isPro: true, proSince: new Date().toISOString() },
        })
        console.log(`Pro granted to ${clerkUserId}`)
      }
    }
    return Response.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
