import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// POST /api/push/subscribe — save a push subscription for the current user
// Body: { endpoint, keys: { p256dh, auth } }
export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { endpoint, keys } = body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Missing endpoint or keys' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id:    userId,
        endpoint,
        p256dh:     keys.p256dh,
        auth:       keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('push/subscribe POST error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe — remove a push subscription
// Body: { endpoint }
export async function DELETE(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { endpoint } = body
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('push/subscribe DELETE error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
