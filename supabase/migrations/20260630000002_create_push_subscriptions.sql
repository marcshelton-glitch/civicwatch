-- Push subscription storage for Web Push / VAPID notifications
-- Apply via: Supabase Dashboard → SQL Editor, or `supabase db push`

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own subscriptions (Clerk JWT carries `sub`)
CREATE POLICY "users_own_subscriptions"
  ON push_subscriptions
  FOR ALL
  USING     (auth.jwt() ->> 'sub' = user_id)
  WITH CHECK(auth.jwt() ->> 'sub' = user_id);

-- Service role (used by API routes) bypasses RLS
CREATE POLICY "service_role_all"
  ON push_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
