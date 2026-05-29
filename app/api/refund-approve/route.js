import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || '';

  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, action, notes } = body;
  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }

  if (action === 'deny') {
    const { error } = await supabase.from('refund_requests').update({
      status: 'denied',
      notes: notes || null,
      reviewed_by: email,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: 'denied' });
  }

  if (action === 'approve') {
    const { data: request, error: fetchErr } = await supabase
      .from('refund_requests').select('*').eq('id', id).single();
    if (fetchErr || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let stripeRefundId = null;
    try {
      const customers = await stripe.customers.list({ email: request.email, limit: 1 });
      if (customers.data.length > 0) {
        const customer = customers.data[0];
        const invoices = await stripe.invoices.list({ customer: customer.id, limit: 1 });
        if (invoices.data.length > 0 && invoices.data[0].payment_intent) {
          const refund = await stripe.refunds.create({
            payment_intent: invoices.data[0].payment_intent,
          });
          stripeRefundId = refund.id;
        }
      }
    } catch (stripeErr) {
      console.error('Stripe refund error:', stripeErr);
      return NextResponse.json({ error: 'Stripe refund failed: ' + stripeErr.message }, { status: 500 });
    }

    const { error: updateErr } = await supabase.from('refund_requests').update({
      status: 'approved',
      notes: notes || null,
      stripe_refund_id: stripeRefundId,
      reviewed_by: email,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ success: true, action: 'approved', stripe_refund_id: stripeRefundId });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
