-- Purpose: Persistent cache for Congress.gov API responses
--          Avoids hammering the rate-limited API across serverless cold starts
--          TTL is stored per-row: 1h for member lists, 24h for static member detail

CREATE TABLE IF NOT EXISTS congress_cache (
  key          TEXT        PRIMARY KEY,
  data         JSONB       NOT NULL,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds  INTEGER     NOT NULL DEFAULT 3600
);

CREATE INDEX IF NOT EXISTS congress_cache_fetched_idx
  ON congress_cache (fetched_at);

ALTER TABLE congress_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON congress_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
