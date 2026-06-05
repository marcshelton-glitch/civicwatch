import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BIOGUIDE_RE = /^[A-Z]\d{6}$/

// GET /api/track — return the current user's tracked bioguide IDs
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_tracked_reps')
    .select('bioguide_id')
    .eq('user_id', userId)

  if (error) {
    console.error('track GET error:', error.message)
    return NextResponse.json({ tracked: [] })
  }

  return NextResponse.json({ tracked: (data || []).map(r => r.bioguide_id) }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

// POST /api/track — add or remove a tracked rep
// Body: { bioguideId, repName, lastName, isSenator, action: 'add' | 'remove' }
export async function POST(request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bioguideId, repName, lastName, isSenator, action } = body

  if (!BIOGUIDE_RE.test(bioguideId)) {
    return NextResponse.json({ error: 'Invalid bioguideId' }, { status: 400 })
  }
  if (action !== 'add' && action !== 'remove') {
    return NextResponse.json({ error: 'action must be add or remove' }, { status: 400 })
  }

  const supabase = getSupabase()

  if (action === 'remove') {
    const { error } = await supabase
      .from('user_tracked_reps')
      .delete()
      .eq('user_id', userId)
      .eq('bioguide_id', bioguideId)

    if (error) console.error('track remove error:', error.message)
    return NextResponse.json({ tracked: false })
  }

  // action === 'add'
  const { error } = await supabase
    .from('user_tracked_reps')
    .upsert(
      {
        user_id: userId,
        bioguide_id: bioguideId,
        rep_name: repName || null,
        last_name: lastName || null,
        is_senator: !!isSenator,
      },
      { onConflict: 'user_id,bioguide_id' }
    )

  if (error) console.error('track add error:', error.message)
  return NextResponse.json({ tracked: true })
}
