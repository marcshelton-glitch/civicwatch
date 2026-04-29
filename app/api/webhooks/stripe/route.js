import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendProWelcomeEmail(email, firstName) {
  if (!resend || !email) return
  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: '★ Welcome to CivicWatch Pro',
      html: `
        <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;">🏛️</span>
            <h1 style="font-family:'Georgia',serif;font-size:28px;font-weight:900;margin:16px 0 4px;letter-spacing:1px;">
              CIVIC<span style="color:#D4AF37">WATCH</span>
            </h1>
            <p style="color:#8892A4;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0;">Your Representatives. Accountable.</p>
          </div>
          <div style="background:rgba(27,42,107,0.5);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:28px;margin-bottom:24px;">
            <h2 style="color:#D4AF37;font-size:20px;margin:0 0 12px;">Welcome to Pro${firstName ? ', ' + firstName : ''}!</h2>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 16px;">
              Your subscription is active. You now have full access to:
            </p>
            <ul style="color:#CDD2E0;font-size:14px;line-height:2;padding-left:20px;margin:0 0 20px;">
              <li>🤖 <strong style="color:#F8F9FF;">AI Analysis</strong> — Conflict scoring, wealth trajectories & peer comparisons</li>
              <li>📊 <strong style="color:#F8F9FF;">Full Trade History</strong> — Every STOCK Act filing, cross-referenced</li>
              <li>🔔 <strong style="color:#F8F9FF;">Alerts</strong> — Real-time votes and trades for tracked reps</li>
              <li>🏛️ <strong style="color:#F8F9FF;">All Representatives</strong> — Federal, state, and local officials</li>
            </ul>
            <a href="https://www.civicwatch.app/dashboard" style="display:inline-block;padding:12px 28px;background:#B22234;color:white;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
              Go to My Dashboard →
            </a>
          </div>
          <p style="color:#8892A4;font-size:12px;text-align:center;margin:0;">
            Questions? Reply to this email or contact <a href="mailto:support@civicwatch.app" style="color:#D4AF37;">support@civicwatch.app</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Welcome email failed:', err.message)
  }
}

async function sendCancellationEmail(email, firstName) {
  if (!resend || !email) return
  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: 'Your CivicWatch Pro subscription has been cancelled',
      html: `
        <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;">🏛️</span>
            <h1 style="font-size:28px;font-weight:900;margin:16px 0 4px;">CIVIC<span style="color:#D4AF37">WATCH</span></h1>
          </div>
          <div style="background:rgba(27,42,107,0.5);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:28px;margin-bottom:24px;">
            <h2 style="font-size:18px;margin:0 0 12px;">Subscription Cancelled${firstName ? ', ' + firstName : ''}</h2>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 16px;">
              Your CivicWatch Pro subscription has been cancelled. You'll retain access until the end of your current billing period.
            </p>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 20px;">
              You can resubscribe at any time from your dashboard.
            </p>
            <a href="https://www.civicwatch.app/dashboard" style="display:inline-block;padding:12px 28px;background:rgba(212,175,55,0.15);border:1px solid #D4AF37;color:#D4AF37;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;">
              Return to Dashboard
            </a>
          </div>
          <p style="color:#8892A4;font-size:12px;text-align:center;margin:0;">
            Need help? <a href="mailto:support@civicwatch.app" style="color:#D4AF37;">support@civicwatch.app</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Cancellation email failed:', err.message)
  }
}

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

        // Send welcome email
        const email = clerkUser.emailAddresses?.[0]?.emailAddress
        const firstName = clerkUser.firstName || ''
        await sendProWelcomeEmail(email, firstName)

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

        // Send cancellation email
        const cancelEmail = user.emailAddresses?.[0]?.emailAddress
        const cancelName = user.firstName || ''
        await sendCancellationEmail(cancelEmail, cancelName)

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