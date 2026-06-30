import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function checkAuth(request) {
  const auth = request.headers.get('authorization')
  const secret = process.env.INTERNAL_API_SECRET
  return secret && auth === `Bearer ${secret}`
}

// POST /api/push/send — send a push notification to one or all users
// Protected by INTERNAL_API_SECRET header.
// Body: { userId?: string, title: string, body: string, url?: string }
//   userId omitted → broadcast to all subscribers
export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId, title, body: msgBody, url } = body
  if (!title || !msgBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
  }

  const supabase = getSupabase()

  let query = supabase.from('push_subscriptions').select('endpoint, p256dh, auth')
  if (userId) query = query.eq('user_id', userId)

  const { data: subs, error: dbErr } = await query
  if (dbErr) {
    console.error('push/send: db error:', dbErr.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers' })
  }

  const payload = JSON.stringify({ title, body: msgBody, url: url || '/' })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  // Prune expired/invalid subscriptions (410 Gone or 404)
  const staleEndpoints = []
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected') {
      const status = r.reason?.statusCode
      if (status === 410 || status === 404) {
        staleEndpoints.push(subs[i].endpoint)
      } else {
        console.error('push/send: delivery error:', r.reason?.message)
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  console.log(`push/send: sent=${sent} stale_pruned=${staleEndpoints.length}`)
  return NextResponse.json({ sent, stale_pruned: staleEndpoints.length })
}
