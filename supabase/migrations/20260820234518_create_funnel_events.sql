CREATE TABLE IF NOT EXISTS funnel_events (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    TEXT,
  event_name TEXT        NOT NULL,
  location   TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_event_location_created
  ON funnel_events (event_name, location, created_at);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_id
  ON funnel_events (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all"
  ON funnel_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
