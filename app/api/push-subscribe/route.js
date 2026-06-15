import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { endpoint, keys } = body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' })

  if (error) return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { endpoint } = body
  if (!endpoint) return NextResponse.json({ error: 'endpoint is required' }, { status: 400 })

  const supabase = getSupabase()
  await supabase.from('push_subscriptions').delete()
    .eq('user_id', userId).eq('endpoint', endpoint)

  return NextResponse.json({ success: true })
}
