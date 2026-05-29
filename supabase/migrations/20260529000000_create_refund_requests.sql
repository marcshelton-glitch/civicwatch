CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  payment_date DATE NOT NULL,
  plan TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  stripe_refund_id TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON refund_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
