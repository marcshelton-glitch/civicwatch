CREATE TABLE IF NOT EXISTS ai_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ai_usage_user_date ON ai_usage (user_id, created_at);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON ai_usage FOR ALL TO service_role USING (true) WITH CHECK (true);
