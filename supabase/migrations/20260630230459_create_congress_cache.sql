
CREATE TABLE IF NOT EXISTS congress_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS congress_cache_key_idx ON congress_cache (cache_key);
CREATE INDEX IF NOT EXISTS congress_cache_expires_idx ON congress_cache (expires_at);

ALTER TABLE congress_cache ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON congress_cache
  USING (false)
  WITH CHECK (false);
