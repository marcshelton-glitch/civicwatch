import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { getUserTier } from '@/lib/tier-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ── Map Stripe price IDs → tier strings ───────────────────────────────────────
function priceIdToTier(priceId) {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_VOTER_PRO_MONTHLY_PRICE_ID) return 'voter_pro'
  if (priceId === process.env.STRIPE_VOTER_PRO_ONETIME_PRICE_ID) return 'voter_pro'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'civic_pack'
  if (priceId === process.env.STRIPE_CIVIC_PACK_ONETIME_PRICE_ID) return 'civic_pack'
  return null
}

const TIER_NAMES = { voter_pro: 'Voter Pro', civic_pack: 'Civic Pack' }

async function sendWelcomeEmail(email, firstName, tier) {
  if (!resend || !email) return
  const tierName = TIER_NAMES[tier] || 'Pro'
  const features = tier === 'voter_pro'
    ? [
        '📊 <strong style="color:#F8F9FF;">Net Worth Data</strong> — Full wealth disclosure timeline',
        '🔔 <strong style="color:#F8F9FF;">Alerts</strong> — Real-time votes and trades for tracked reps',
        '⭐ <strong style="color:#F8F9FF;">Track Any Rep</strong> — Watchlist front and center',
      ]
    : [
        '🤖 <strong style="color:#F8F9FF;">AI Analysis</strong> — Conflict scoring, wealth trajectories & peer comparisons',
        '📊 <strong style="color:#F8F9FF;">Full Trade History</strong> — Every STOCK Act filing, cross-referenced',
        '🔔 <strong style="color:#F8F9FF;">Alerts</strong> — Real-time votes and trades for tracked reps',
        '🏛️ <strong style="color:#F8F9FF;">All Representatives</strong> — Federal, state, and local officials',
      ]

  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: `★ Welcome to CivicWatch ${tierName}`,
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
            <h2 style="color:#D4AF37;font-size:20px;margin:0 0 12px;">Welcome to ${tierName}${firstName ? ', ' + firstName : ''}!</h2>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 16px;">
              Your subscription is active. You now have access to:
            </p>
            <ul style="color:#CDD2E0;font-size:14px;line-height:2;padding-left:20px;margin:0 0 20px;">
              ${features.map(f => `<li>${f}</li>`).join('')}
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
      subject: 'Your CivicWatch subscription has been cancelled',
      html: `
        <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;">🏛️</span>
            <h1 style="font-size:28px;font-weight:900;margin:16px 0 4px;">CIVIC<span style="color:#D4AF37">WATCH</span></h1>
          </div>
          <div style="background:rgba(27,42,107,0.5);border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:28px;margin-bottom:24px;">
            <h2 style="font-size:18px;margin:0 0 12px;">Subscription Cancelled${firstName ? ', ' + firstName : ''}</h2>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 16px;">
              Your CivicWatch subscription has been cancelled. You'll retain access until the end of your current billing period.
            </p>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 20px;">
              You can resubscribe at any time from your dashboard.
            </p>
            <a href="https://www.civicwatch.app/pro" style="display:inline-block;padding:12px 28px;background:rgba(212,175,55,0.15);border:1px solid #D4AF37;color:#D4AF37;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;">
              View Plans
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
// Primary path: retrieve the Stripe Customer and read clerkUserId from its metadata
// (stored there at checkout time in /api/subscribe). O(1), scales to any user count.
// Fallback: scan Clerk user list (only works up to 100 users — kept as safety net).
async function findClerkUserByStripeCustomerId(clerk, customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer.deleted) {
      const clerkUserId = customer.metadata?.clerkUserId
      if (clerkUserId && CLERK_USER_ID_RE.test(clerkUserId)) {
        try {
          const user = await clerk.users.getUser(clerkUserId)
          if (user) return user
        } catch { /* fall through to list scan */ }
      }
    }
  } catch (err) {
    console.error('Stripe customer retrieve error:', err.message)
  }

  try {
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

      // ── Checkout completed (subscription or one-time payment) ─────────────
      case 'checkout.session.completed': {
        const session = event.data.object
        const clerkUserId = session.metadata?.clerkUserId

        if (!clerkUserId || !CLERK_USER_ID_RE.test(clerkUserId)) {
          console.error('Webhook: invalid or missing clerkUserId in metadata')
          break
        }

        let clerkUser
        try {
          clerkUser = await clerk.users.getUser(clerkUserId)
        } catch {
          console.error('Webhook: Clerk user not found for provided id')
          break
        }
        if (!clerkUser) break

        // Determine tier: prefer explicit metadata, fall back to price ID lookup
        let paidTier = session.metadata?.tier || null
        if (!paidTier) {
          // Expand line_items to get price ID (only available on retrieve, not event object)
          try {
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items'],
            })
            const priceId = fullSession.line_items?.data?.[0]?.price?.id
            paidTier = priceIdToTier(priceId)
          } catch {
            paidTier = 'civic_pack'  // safe default for legacy sessions
          }
        }

        if (!paidTier || paidTier === 'free') {
          console.error('Webhook: could not determine paid tier for session', session.id)
          break
        }

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            tier: paidTier,
            tierType: session.mode === 'payment' ? 'onetime' : 'subscription',
            isPro: true,  // backward compat
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription || null,
            proActivatedAt: new Date().toISOString(),
          },
        })

        const email = clerkUser.emailAddresses?.[0]?.emailAddress
        const firstName = clerkUser.firstName || ''
        await sendWelcomeEmail(email, firstName, paidTier)

        console.log(`✅ ${paidTier} activated for a new subscriber`)
        break
      }

      // ── Subscription cancelled or paused → revert to free ─────────────────
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object
        const customerId = subscription.customer

        if (!customerId || typeof customerId !== 'string') {
          console.error('Webhook: subscription event missing customer id')
          break
        }

        const user = await findClerkUserByStripeCustomerId(clerk, customerId)
        if (!user) {
          console.error('Webhook: no Clerk user found for Stripe customer')
          break
        }

        // Don't downgrade one-time purchasers if a subscription gets cancelled
        if (user.publicMetadata?.tierType === 'onetime') {
          console.log('Webhook: skipping downgrade — user has onetime purchase')
          break
        }

        await clerk.users.updateUserMetadata(user.id, {
          publicMetadata: {
            tier: 'free',
            tierType: null,
            isPro: false,
            stripeCustomerId: customerId,
            stripeSubscriptionId: null,
            proCancelledAt: new Date().toISOString(),
          },
        })

        const cancelEmail = user.emailAddresses?.[0]?.emailAddress
        const cancelName = user.firstName || ''
        await sendCancellationEmail(cancelEmail, cancelName)

        console.log('⛔ Subscription revoked — tier reset to free')
        break
      }

      // ── First invoice paid via direct API (Payment Request Button flow) ─────
      case 'invoice.paid': {
        const invoice = event.data.object
        if (invoice.billing_reason !== 'subscription_create') break

        const customerId = invoice.customer
        if (!customerId || typeof customerId !== 'string') break

        const user = await findClerkUserByStripeCustomerId(clerk, customerId)
        if (!user) {
          console.error('Webhook invoice.paid: no Clerk user found for Stripe customer')
          break
        }

        // Skip if already at civic_pack (checkout.session.completed may have fired first,
        // or user has a one-time civic_pack purchase)
        if (getUserTier(user) === 'civic_pack') break

        // Determine tier from price ID in the invoice line items
        const priceId = invoice.lines?.data?.[0]?.price?.id
        const paidTier = priceIdToTier(priceId) || 'civic_pack'

        await clerk.users.updateUserMetadata(user.id, {
          publicMetadata: {
            tier: paidTier,
            tierType: 'subscription',
            isPro: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: invoice.subscription,
            proActivatedAt: new Date().toISOString(),
          },
        })

        const email = user.emailAddresses?.[0]?.emailAddress
        const firstName = user.firstName || ''
        await sendWelcomeEmail(email, firstName, paidTier)

        console.log(`✅ ${paidTier} activated via direct subscription payment`)
        break
      }

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
          if (user && user.publicMetadata?.tierType !== 'onetime') {
            await clerk.users.updateUserMetadata(user.id, {
              publicMetadata: {
                tier: 'free',
                tierType: null,
                isPro: false,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscription.id,
                proSuspendedAt: new Date().toISOString(),
              },
            })
            console.log(`⏸ Tier suspended due to status: ${subscription.status}`)
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
