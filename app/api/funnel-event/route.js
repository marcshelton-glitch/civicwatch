import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/funnel-event — best-effort click tracking for the upgrade funnel.
//
// Added as part of the 2026-08-20 paywall audit (docs/paywall-funnel-audit.md):
// there was no instrumentation anywhere on the five upgrade CTAs (/pro hero,
// comparison card, bottom CTA, in-context lock overlays, Settings upsell), so
// there was no way to tell which one actually drives checkouts. This route is
// deliberately low-ceremony — no auth requirement (signed-out visitors click
// "Go Pro" too), no strict schema validation beyond basic shape checks, and it
// always returns 200 even on failure. Never let analytics break the upgrade
// flow it's trying to measure.
//
// Body: { eventName: string, location: string, metadata?: object }

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MAX_LEN = 100

function clip(val, max = MAX_LEN) {
  return typeof val === 'string' ? val.slice(0, max) : null
}

export async function POST(request) {
  try {
    const { userId } = await auth().catch(() => ({ userId: null }))

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const eventName = clip(body?.eventName)
    const location = clip(body?.location)
    if (!eventName || !location) {
      return NextResponse.json({ ok: false, error: 'eventName and location required' }, { status: 400 })
    }

    const metadata = body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata
      : {}

    const supabase = getSupabase()
    const { error } = await supabase.from('funnel_events').insert({
      user_id: userId || null,
      event_name: eventName,
      location,
      metadata,
    })

    if (error) {
      // funnel_events may not exist yet if the migration hasn't been applied —
      // log and no-op rather than surfacing an error to the click handler.
      console.error('funnel-event insert failed:', error.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('funnel-event error:', err.message)
    // Always 200 — a broken analytics endpoint should never look like a
    // failure to the client-side fire-and-forget caller.
    return NextResponse.json({ ok: false })
  }
}
