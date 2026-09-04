-- Committee assignment snapshots — powers the "committee alerts" leg of
-- Track My Rep (previously a TODO stub in app/api/send-alerts/route.js that
-- always returned 0). Populated by the daily send-alerts cron itself; no
-- separate ingestion job needed since committee membership is fetched live
-- from Congress.gov per tracked representative.

CREATE TABLE IF NOT EXISTS committee_snapshots (
  id             BIGSERIAL PRIMARY KEY,
  bioguide_id    TEXT NOT NULL,
  committee_name TEXT NOT NULL,
  chamber        TEXT,
  first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bioguide_id, committee_name)
);

CREATE INDEX IF NOT EXISTS committee_snapshots_bioguide ON committee_snapshots (bioguide_id);

COMMENT ON TABLE committee_snapshots IS
  'Last-known committee roster per member, diffed on each send-alerts cron run to detect new committee assignments for Track My Rep alerts.';

ALTER TABLE committee_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all"
  ON committee_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
