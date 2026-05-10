-- Alert system tables for CivicWatch
-- Run in: Supabase Dashboard → SQL Editor

-- ── user_tracked_reps: which federal reps each user is tracking ───────────────
CREATE TABLE IF NOT EXISTS user_tracked_reps (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  bioguide_id TEXT NOT NULL,
  rep_name    TEXT,
  last_name   TEXT,
  is_senator  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, bioguide_id)
);

CREATE INDEX IF NOT EXISTS user_tracked_reps_user_id  ON user_tracked_reps (user_id);
CREATE INDEX IF NOT EXISTS user_tracked_reps_bioguide ON user_tracked_reps (bioguide_id);

-- ── sent_alerts: dedup log to prevent duplicate emails ────────────────────────
CREATE TABLE IF NOT EXISTS sent_alerts (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  bioguide_id TEXT NOT NULL,
  filing_id   TEXT NOT NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, filing_id)
);

CREATE INDEX IF NOT EXISTS sent_alerts_user_id   ON sent_alerts (user_id);
CREATE INDEX IF NOT EXISTS sent_alerts_filing_id ON sent_alerts (filing_id);
