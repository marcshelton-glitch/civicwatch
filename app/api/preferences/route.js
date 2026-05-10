import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VALID_FREQUENCIES = ['daily', 'weekly', 'instant']

// GET /api/preferences — return the signed-in user's notification preferences
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_preferences')
    .select('alert_frequency, alert_trades, alert_networth, alert_legislation, alert_committees')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('preferences GET error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  // Return defaults when no row exists yet
  return NextResponse.json(data ?? {
    alert_frequency: 'daily',
    alert_trades: true,
    alert_networth: true,
    alert_legislation: false,
    alert_committees: false,
  })
}

// POST /api/preferences — upsert the signed-in user's notification preferences
export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { alert_frequency, alert_trades, alert_networth, alert_legislation, alert_committees } = body

  if (alert_frequency !== undefined && !VALID_FREQUENCIES.includes(alert_frequency)) {
    return NextResponse.json({ error: 'Invalid alert_frequency' }, { status: 400 })
  }

  const patch = { user_id: userId, updated_at: new Date().toISOString() }
  if (alert_frequency !== undefined) patch.alert_frequency = alert_frequency
  if (alert_trades !== undefined) patch.alert_trades = Boolean(alert_trades)
  if (alert_networth !== undefined) patch.alert_networth = Boolean(alert_networth)
  if (alert_legislation !== undefined) patch.alert_legislation = Boolean(alert_legislation)
  if (alert_committees !== undefined) patch.alert_committees = Boolean(alert_committees)

  const supabase = getSupabase()
  const { error } = await supabase
    .from('user_preferences')
    .upsert(patch, { onConflict: 'user_id' })

  if (error) {
    console.error('preferences POST error:', error.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
