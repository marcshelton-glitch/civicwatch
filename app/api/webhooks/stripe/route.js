import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { clerkClient } from '@clerk/nextjs/server'
import { Resend } from 'resend'

// Lazy — constructing these at module scope makes `next build` fail during
// "Collecting page data" if the secret env vars aren't present in the build
// environment. Matches the getSupabase() factory pattern used elsewhere.
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
let _resend = null
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

async function sendProWelcomeEmail(email, firstName) {
  const resend = getResend()
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

async function sendPaymentFailedEmail(email, firstName) {
  const resend = getResend()
  if (!resend || !email) return
  try {
    await resend.emails.send({
      from: 'CivicWatch <noreply@civicwatch.app>',
      to: email,
      subject: 'Action required: CivicWatch Pro payment failed',
      html: `
        <div style="font-family:Georgia,serif;background:#0A1628;color:#F8F9FF;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:48px;">🏛️</span>
            <h1 style="font-size:28px;font-weight:900;margin:16px 0 4px;">CIVIC<span style="color:#D4AF37">WATCH</span></h1>
          </div>
          <div style="background:rgba(178,34,52,0.12);border:1px solid rgba(178,34,52,0.4);border-radius:12px;padding:28px;margin-bottom:24px;">
            <h2 style="color:#FF6B6B;font-size:18px;margin:0 0 12px;">Payment Failed${firstName ? ', ' + firstName : ''}</h2>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 16px;">
              We weren't able to charge your card for your CivicWatch Pro subscription. Stripe will automatically retry — no action is needed right now.
            </p>
            <p style="color:#CDD2E0;font-size:14px;line-height:1.8;margin:0 0 20px;">
              If retries fail, your subscription will be cancelled and access will revert to the free tier. To avoid interruption, update your payment method now.
            </p>
            <a href="https://www.civicwatch.app/pro" style="display:inline-block;padding:12px 28px;background:#B22234;color:white;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;">
              Update Payment Method →
            </a>
          </div>
          <p style="color:#8892A4;font-size:12px;text-align:center;margin:0;">
            Questions? <a href="mailto:support@civicwatch.app" style="color:#D4AF37;">support@civicwatch.app</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Payment failed email error:', err.message)
  }
}

async function sendCancellationEmail(email, firstName) {
  const resend = getResend()
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

// Resolve the subscription id off an invoice, across Stripe API versions.
// The flat `invoice.subscription` field was removed and relocated to
// `invoice.parent.subscription_details.subscription` (it's absent from the
// Invoice type in the pinned 2026-03-25.dahlia version). The shape a webhook
// receives depends on the API version configured on the endpoint, not on this
// SDK, so accept either rather than assuming.
function invoiceSubscriptionId(invoice) {
  const direct = invoice.subscription
  if (direct) return typeof direct === 'string' ? direct : direct.id
  const nested = invoice.parent?.subscription_details?.subscription
  if (nested) return typeof nested === 'string' ? nested : nested.id
  return null
}

// ── Stripe requires the raw body for signature verification ───────────────────
export const runtime = 'nodejs'

// ── Helper: find Clerk user by Stripe customerId ──────────────────────────────
// Primary path: retrieve the Stripe Customer and read clerkUserId from its metadata
// (stored there at checkout time in /api/subscribe). O(1), scales to any user count.
// Fallback: scan Clerk user list (only works up to 100 users — kept as safety net).
async function findClerkUserByStripeCustomerId(clerk, customerId) {
  try {
    // Primary: get clerkUserId from Stripe Customer metadata
    const customer = await getStripe().customers.retrieve(customerId)
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

  // Fallback: scan Clerk user list (covers legacy customers created before metadata was added)
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

  // ── Verify the event came from Stripe, not a forged request ──────────────
  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
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

      // ── Subscription cancelled → revoke Pro ──────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        if (!customerId || typeof customerId !== 'string') {
          console.error('Webhook: subscription.deleted missing customer id')
          break
        }

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

        const cancelEmail = user.emailAddresses?.[0]?.emailAddress
        const cancelName = user.firstName || ''
        await sendCancellationEmail(cancelEmail, cancelName)

        console.log('⛔ Pro revoked — subscription cancelled')
        break
      }

      // ── Subscription paused → revoke Pro, prompt payment update ──────────
      case 'customer.subscription.paused': {
        const subscription = event.data.object
        const customerId = subscription.customer

        if (!customerId || typeof customerId !== 'string') {
          console.error('Webhook: subscription.paused missing customer id')
          break
        }

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

        // Paused means Stripe exhausted retries — user needs to update payment
        const pausedEmail = user.emailAddresses?.[0]?.emailAddress
        const pausedName = user.firstName || ''
        await sendPaymentFailedEmail(pausedEmail, pausedName)

        console.log('⏸ Pro revoked — subscription paused (payment exhausted)')
        break
      }

      // ── Invoice paid → activate Pro for the wallet (Apple Pay / Google Pay) path ──
      // /api/subscribe-instant creates the subscription directly, so no Checkout
      // Session exists and checkout.session.completed never fires for it. That
      // handler is the only other place Pro is granted, so without this one a
      // wallet subscriber is charged and never receives access. An invoice.paid
      // handler existed for exactly this reason (added in 3e97b36) and was
      // dropped by 7d1c8b9 while hardening the Checkout flow.
      //
      // Scoped by subscription metadata: only subscribe-instant puts clerkUserId
      // there. Checkout puts it on the Session instead, so Checkout-created
      // subscriptions fall through untouched and can't double-fire against
      // checkout.session.completed.
      case 'invoice.paid': {
        const invoice = event.data.object
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        const subscriptionId = invoiceSubscriptionId(invoice)
        if (!customerId || !subscriptionId) break

        let subscription
        try {
          subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        } catch (err) {
          console.error('Webhook invoice.paid: subscription retrieve failed:', err.message)
          break
        }

        const clerkUserId = subscription.metadata?.clerkUserId
        if (!clerkUserId) break // Checkout-created — checkout.session.completed owns it
        if (!CLERK_USER_ID_RE.test(clerkUserId)) {
          console.error('Webhook invoice.paid: invalid clerkUserId in subscription metadata')
          break
        }
        if (!['active', 'trialing'].includes(subscription.status)) break

        let walletUser
        try {
          walletUser = await clerk.users.getUser(clerkUserId)
        } catch {
          console.error('Webhook invoice.paid: Clerk user not found for provided id')
          break
        }
        if (!walletUser) break

        const tier = ['voter_pro', 'civic_pack'].includes(subscription.metadata?.tier)
          ? subscription.metadata.tier
          : 'civic_pack'
        const wasPro = walletUser.publicMetadata?.isPro === true

        await clerk.users.updateUserMetadata(clerkUserId, {
          publicMetadata: {
            isPro: true,
            tier,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            // Renewals also fire invoice.paid — don't reset the original date.
            proActivatedAt: wasPro
              ? walletUser.publicMetadata?.proActivatedAt || new Date().toISOString()
              : new Date().toISOString(),
          },
        })

        // Only on first activation — this fires on every renewal too.
        if (!wasPro) {
          await sendProWelcomeEmail(
            walletUser.emailAddresses?.[0]?.emailAddress,
            walletUser.firstName || ''
          )
          console.log(`✅ Pro activated via wallet checkout (${tier})`)
        }
        break
      }

      // ── Payment failed: notify user; Stripe will retry automatically ────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (customerId) {
          const user = await findClerkUserByStripeCustomerId(clerk, customerId)
          if (user) {
            const email = user.emailAddresses?.[0]?.emailAddress
            await sendPaymentFailedEmail(email, user.firstName || '')
          }
        }
        console.warn('⚠️ Payment failed — Stripe will retry')
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

            // Notify user their access was cut and why
            const suspendEmail = user.emailAddresses?.[0]?.emailAddress
            await sendPaymentFailedEmail(suspendEmail, user.firstName || '')

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