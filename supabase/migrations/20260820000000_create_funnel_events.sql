-- Paywall/upgrade funnel click tracking.
-- Apply via: Supabase Dashboard → SQL Editor, or `supabase db push`
--
-- Added 2026-08-20 as part of the paywall funnel audit (docs/paywall-funnel-audit.md):
-- there was previously zero instrumentation on any of the five upgrade CTAs
-- (/pro hero, comparison card, bottom CTA, in-context lock overlays, Settings
-- upsell), so there was no way to tell which one actually drives checkouts vs.
-- which gets clicked and abandoned at Stripe. This table is the write side;
-- app/api/funnel-event/route.js is the only writer (service role bypasses RLS
-- below), lib/funnel-track.js is the only client-side caller.

CREATE TABLE IF NOT EXISTS funnel_events (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    TEXT,                          -- Clerk user id; NULL for signed-out visitors
  event_name TEXT        NOT NULL,          -- e.g. 'upgrade_click'
  location   TEXT        NOT NULL,          -- CTA identifier, e.g. 'pro_hero', 'settings_upsell'
  metadata   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_event_location_created
  ON funnel_events (event_name, location, created_at);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id
  ON funnel_events (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

-- No public read/write policy — this table is written exclusively by the
-- service role from app/api/funnel-event/route.js. Anon/authenticated roles
-- get no policy at all, i.e. no access, matching the intent that this is an
-- internal analytics sink, not user-facing data.
CREATE POLICY "service_role_all"
  ON funnel_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
