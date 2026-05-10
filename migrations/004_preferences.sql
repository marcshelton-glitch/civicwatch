-- Notification preferences for CivicWatch users
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id           TEXT PRIMARY KEY,
  alert_frequency   TEXT NOT NULL DEFAULT 'daily',   -- 'daily' | 'weekly' | 'instant'
  alert_trades      BOOLEAN NOT NULL DEFAULT true,
  alert_networth    BOOLEAN NOT NULL DEFAULT true,
  alert_legislation BOOLEAN NOT NULL DEFAULT false,
  alert_committees  BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
