import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || '';

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, payment_date, plan, reason, evidence_description } = body;

  if (!name || !payment_date || !plan || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (reason.trim().length < 50) {
    return NextResponse.json({ error: 'Reason must be at least 50 characters' }, { status: 400 });
  }

  const { error } = await supabase.from('refund_requests').insert({
    user_id: userId,
    email,
    name,
    payment_date,
    plan,
    reason,
    evidence_description: evidence_description || null,
    status: 'pending',
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
