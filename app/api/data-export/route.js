import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { isRateLimitedDurable } from '@/lib/rateLimit'

// GDPR Art. 20 (portability) and Art. 15 (access): the signed-in user can
// download everything we hold about them, in a structured, machine-readable
// format, without asking a human.

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Every table keyed to a single user, with the columns that are genuinely
// theirs. Two deliberate omissions, both repeated in the file itself so the
// export is honest about its own edges:
//   push_subscriptions.auth / .p256dh — browser push key material. Exporting
//     credentials into a file people email around is a security risk, and the
//     keys tell the user nothing about themselves.
//   refund_requests.notes / .reviewed_by / .stripe_refund_id — internal
//     handling, and reviewed_by is a different person's identity.
const USER_TABLES = [
  { table: 'user_preferences',   label: 'preferences',        select: 'alert_frequency, alert_trades, alert_networth, alert_legislation, alert_committees, updated_at' },
  { table: 'user_tracked_reps',  label: 'trackedRepresentatives', select: 'bioguide_id, rep_name, last_name, is_senator, created_at' },
  { table: 'push_subscriptions', label: 'pushSubscriptions',  select: 'endpoint, created_at, updated_at' },
  { table: 'sent_alerts',        label: 'alertsSentToYou',    select: 'bioguide_id, filing_id, sent_at' },
  { table: 'email_sequences',    label: 'emailSequences',     select: 'email, first_name, sequence_day, scheduled_for, sent_at, status, state, is_pro, created_at' },
  { table: 'ai_usage',           label: 'aiUsage',            select: 'endpoint, model, input_tokens, output_tokens, total_tokens, created_at' },
  { table: 'refund_requests',    label: 'refundRequests',     select: 'email, name, payment_date, plan, reason, evidence_description, status, created_at' },
  { table: 'funnel_events',      label: 'activityEvents',     select: 'event_name, location, metadata, created_at' },
  { table: 'rate_limits',        label: 'rateLimitCounters',  select: 'action, created_at' },
]

// GET /api/data-export — download the signed-in user's data as JSON
export async function GET() {
  let userId
  try {
    ;({ userId } = await auth())
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Assembling an export touches every user table, so cap it. Three an hour
  // is far more than anyone legitimately needs.
  try {
    if (await isRateLimitedDurable(userId, 'data-export', 3, 3600)) {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again in an hour.' },
        { status: 429 },
      )
    }
  } catch (err) {
    // A rate-limiter failure must not block someone exercising a legal right.
    console.error('data-export rate limit check failed:', err.message)
  }

  const supabase = getSupabase()
  const data = {}
  const failed = []

  // One table failing should not sink the whole export — the user still gets
  // everything else, and the file names what could not be read.
  await Promise.all(USER_TABLES.map(async ({ table, label, select }) => {
    try {
      const { data: rows, error } = await supabase
        .from(table)
        .select(select)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
      data[label] = rows ?? []
    } catch (err) {
      console.error(`data-export: ${table} failed —`, err.message)
      data[label] = []
      failed.push(table)
    }
  }))

  let account = null
  try {
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)
    account = {
      id: user.id,
      emailAddresses: user.emailAddresses?.map(e => e.emailAddress) ?? [],
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
    }
  } catch (err) {
    console.error('data-export: Clerk lookup failed —', err.message)
    failed.push('account')
  }

  const payload = {
    export: {
      service: 'CivicWatch',
      generatedAt: new Date().toISOString(),
      userId,
      format: 'JSON',
      about: 'Everything CivicWatch holds that is linked to your account.',
      notIncluded: [
        'Browser push encryption keys — credentials, not information about you.',
        'Internal notes and reviewer names on refund requests — these concern our staff.',
        'Congressional trading, filings and voting data — public record, not personal to you. See civicwatch.app.',
      ],
      ...(failed.length ? { couldNotBeRead: failed, note: 'Some sections could not be read. Email support@civicwatch.app and we will send them separately.' } : {}),
    },
    account,
    ...data,
  }

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="civicwatch-data-export-${stamp}.json"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
