import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getProMonthlyPriceId } from '@/lib/stripe-prices'

export const revalidate = 3600

// Lazy — constructing Stripe at module scope makes `next build` fail during
// "Collecting page data" if STRIPE_SECRET_KEY isn't present in the build
// environment (build-time env vars aren't always the same as runtime env
// vars on Vercel). Matches the getSupabase() factory pattern used elsewhere.
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

function getMonthStart() {
  const now = new Date()
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
}

export async function GET() {
  try {
    const stripe = getStripe()
    const monthStart = getMonthStart()

    // ── Scope to the CivicWatch Pro price ────────────────────────────────────
    // This Stripe account also holds the California Candidate Calculator. An
    // unfiltered subscriptions.list() returns that product's subscribers too,
    // and ProCountBanner renders the result as "N Americans went Pro this
    // month" on /pro — a public claim inflated by a different product's sales.
    // Passing `price` makes Stripe do the filtering server-side.
    //
    // If the price isn't configured, return 0 rather than an inflated number:
    // the banner hides itself at 0, which is the correct failure mode for a
    // social-proof claim we cannot substantiate.
    let priceId
    try {
      priceId = getProMonthlyPriceId()
    } catch (err) {
      console.error('pro-count: Pro price not configured —', err.message)
      return NextResponse.json({ count: 0 }, {
        headers: { 'Cache-Control': 'public, s-maxage=300' },
      })
    }

    // ── Count real subscribers only ──────────────────────────────────────────
    // status: 'all' previously included `incomplete`, `incomplete_expired`, and
    // `canceled` subscriptions created this month — checkouts that were
    // abandoned or failed and never actually converted. Those inflated the
    // "N Americans went Pro this month" social-proof claim on /pro with people
    // who did not, in fact, go Pro. CivicWatch has no trial period today, but
    // 'trialing' is counted too so this doesn't quietly regress if one is
    // added later. The Stripe list API only accepts one `status` value at a
    // time (not an array), hence the two passes.
    let count = 0

    for (const status of ['active', 'trialing']) {
      let hasMore = true
      let startingAfter = undefined

      while (hasMore) {
        const params = {
          price: priceId,
          created: { gte: monthStart },
          limit: 100,
          status,
        }
        if (startingAfter) params.starting_after = startingAfter

        const page = await stripe.subscriptions.list(params)
        count += page.data.length
        hasMore = page.has_more
        if (hasMore && page.data.length > 0) {
          startingAfter = page.data[page.data.length - 1].id
        }
      }
    }

    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (e) {
    console.error('pro-count error:', e.message)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
