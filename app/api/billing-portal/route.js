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

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()
  const customerId = user?.publicMetadata?.stripeCustomerId

  if (!customerId) {
    return Response.json({ error: 'No billing account found' }, { status: 404 })
  }

  try {
    const appUrl = getSafeAppUrl()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard`,
    })
    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Billing portal error:', err.message)
    return Response.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }
}
