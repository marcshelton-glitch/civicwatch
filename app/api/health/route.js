import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkProPriceConfig } from '@/lib/stripe-prices'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  let dbOk = false
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('fd_filings')
      .select('doc_id', { count: 'exact', head: true })
      .limit(1)
    dbOk = !error
  } catch { /* db unreachable */ }

  // ── Revenue path ──────────────────────────────────────────────────────────
  // A missing or foreign Stripe price ID makes every Upgrade click return 503.
  // That failure is otherwise silent until a paying customer hits it, so the
  // health check owns it: `billing` reports whether checkout can be created at
  // all, plus whether the secret and webhook signing key are present. No IDs or
  // key material are returned — booleans only.
  const price = checkProPriceConfig()
  const billing = {
    priceConfigured: price.ok,
    stripeKey: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  }
  const billingOk = billing.priceConfigured && billing.stripeKey && billing.webhookSecret

  if (!price.ok) {
    // Logged in full so the cause is one search away in Vercel logs.
    console.error('HEALTH: Pro price misconfigured —', price.reason)
  }

  if (!dbOk) {
    return NextResponse.json(
      { status: 'error', db: 'unreachable', billing },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  // Billing failures are reported but do not fail the check — the site is still
  // serving free-tier traffic, and a 503 here would take healthy pages down with
  // it. `status: 'degraded'` is the signal to act on.
  return NextResponse.json(
    {
      status: billingOk ? 'ok' : 'degraded',
      db: 'ok',
      billing,
      timestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
