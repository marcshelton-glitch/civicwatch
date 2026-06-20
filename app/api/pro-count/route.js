import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const revalidate = 3600

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function getMonthStart() {
  const now = new Date()
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
}

export async function GET() {
  try {
    const monthStart = getMonthStart()
    let count = 0
    let hasMore = true
    let startingAfter = undefined

    while (hasMore) {
      const params = {
        created: { gte: monthStart },
        limit: 100,
        status: 'all',
      }
      if (startingAfter) params.starting_after = startingAfter

      const page = await stripe.subscriptions.list(params)
      count += page.data.length
      hasMore = page.has_more
      if (hasMore && page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id
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
