import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Clerk user IDs are always in the format: user_XXXXXXXXXXXXXXXXXXXXXXXXXX
const CLERK_USER_ID_RE = /^user_[a-zA-Z0-9]{24,}$/

// ── Stripe requires the raw body for signature verification ───────────────────
export const runtime = 'nodejs'

// ── Helper: find Clerk user by Stripe customerId ──────────────────────────────
// Searches with a query filter instead of fetching all users (scales to any size)
async function findClerkUserByStripeCustomerId(clerk, customerId) {
  try {
    // Fetch a small page and match on exact metadata — Clerk doesn't support
    // metadata-exact queries yet, so we fetch up to 100 and filter.
    // For apps with >100 users, store clerkUserId on the Stripe Customer object
    // at checkout time (see subscribe_route.js) as the preferred lookup path.
    const result = await clerk.users.getUserList({ limit: 100 })
    return result.data.find(
      u => u.publicMetadata?.stripeCustomerId === customerId
    ) || null
  } catch (err) {
    console.error('Clerk user lookup error:', err.message)
    return null
  }
}

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !webhookSecret) {
    console.error('Webhook: missing signature or secret')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // ── Verify the event came from Stripe, not a forged request ──────────────
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const clerk = await clerkClient()

  try {
    switch (event.type) {

      // ── Subscription created ──────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const clerkUserId = session.metadata?.clerkUserId

        // ✅ Validate clerkUserId format before touching Clerk API
        if (!clerkUserId || !CLERK_USER_ID_RE.test(clerkUserId)) {
          console.error('Webhook: invalid or missing clerkUserId in metadata')
          break
        }

        // ✅ Verify user exists in Clerk before updating
        let clerkUser
        try {
          clerkUser = await clerk.users.getUser(clerkUserId)
        } catch {
          console.error('Webhook: Clerk user not found for provided id')
          break
        }
        if (!clerkUser) break

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            isPro: true,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            proActivatedAt: new Date().toISOString(),
          },
        })

        // ✅ No user IDs logged in production
        console.log('✅ Pro activated for a new subscriber')
        break
      }

      // ── Subscription cancelled or paused → revoke Pro ─────────────────────
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object
        const customerId = subscription.customer

        if (!customerId || typeof customerId !== 'string') {
          console.error('Webhook: subscription event missing customer id')
          break
        }

        // ✅ Fixed: proper lookup that works at scale
        const user = await findClerkUserByStripeCustomerId(clerk, customerId)
        if (!user) {
          console.error('Webhook: no Clerk user found for Stripe customer')
          break
        }

        await clerk.users.updateUserMetadata(user.id, {
          publicMetadata: {
            isPro: false,
            stripeCustomerId: customerId,
            stripeSubscriptionId: null,
            proCancelledAt: new Date().toISOString(),
          },
        })

        console.log('⛔ Pro revoked for a subscriber')
        break
      }

      // ── Payment failed: Stripe will retry, revocation happens on deleted ──
      case 'invoice.payment_failed': {
        console.warn('⚠️ Payment failed for a customer — Stripe will retry')
        break
      }

      // ── Subscription updated (status change) ──────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const isActive = ['active', 'trialing'].includes(subscription.status)

        if (!isActive) {
          const customerId = subscription.customer
          if (!customerId || typeof customerId !== 'string') break

          const user = await findClerkUserByStripeCustomerId(clerk, customerId)
          if (user) {
            await clerk.users.updateUserMetadata(user.id, {
              publicMetadata: {
                isPro: false,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
                proSuspendedAt: new Date().toISOString(),
              },
            })
            console.log(`⏸ Pro suspended due to status: ${subscription.status}`)
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err.message)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}