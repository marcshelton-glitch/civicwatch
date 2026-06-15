CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limits_user_action_time ON rate_limits (user_id, action, created_at);

-- Auto-cleanup: delete records older than 24 hours
-- (Run as a Supabase cron job or accept minor table growth)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);
