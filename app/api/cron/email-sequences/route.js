import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'
import { sendSequenceEmail } from '@/lib/email-sequences'

export const runtime = 'nodejs'

function authorized(request) {
  const secret = process.env.CRON_SECRET
  return secret && request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: due, error } = await supabase
    .from('email_sequences')
    .select()
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due?.length) return NextResponse.json({ processed: 0 })

  const clerk = await clerkClient()
  const results = []

  for (const record of due) {
    let isPro = false
    try {
      const user = await clerk.users.getUser(record.user_id)
      isPro = user.publicMetadata?.proPlan === true
    } catch {
      await supabase.from('email_sequences').update({ status: 'failed' }).eq('id', record.id)
      results.push({ id: record.id, status: 'failed', reason: 'user not found' })
      continue
    }

    try {
      const result = await sendSequenceEmail(record, isPro)
      results.push({ id: record.id, day: record.sequence_day, ...result })
    } catch (err) {
      console.error(`[email-sequences cron] id=${record.id}:`, err.message)
      results.push({ id: record.id, day: record.sequence_day, error: err.message })
    }
  }

  return NextResponse.json({
    processed: results.length,
    sent: results.filter(r => r.sent).length,
    skipped: results.filter(r => r.skipped).length,
    failed: results.filter(r => r.error || r.status === 'failed').length,
  })
}
