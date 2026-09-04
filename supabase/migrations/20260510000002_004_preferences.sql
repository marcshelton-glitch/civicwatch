-- Notification preferences for CivicWatch users
-- Originally applied 2026-05-10 via Supabase Dashboard → SQL Editor (see
-- legacy migrations/004_preferences.sql). Backfilled into supabase/migrations/
-- and the live schema_migrations ledger on 2026-09-03 as part of resolving
-- D-001 — content is unchanged from what actually ran.

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id           TEXT PRIMARY KEY,
  alert_frequency   TEXT NOT NULL DEFAULT 'daily',   -- 'daily' | 'weekly' | 'instant'
  alert_trades      BOOLEAN NOT NULL DEFAULT true,
  alert_networth    BOOLEAN NOT NULL DEFAULT true,
  alert_legislation BOOLEAN NOT NULL DEFAULT false,
  alert_committees  BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);