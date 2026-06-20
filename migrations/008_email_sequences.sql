-- Email onboarding sequence tracking
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS email_sequences (
  id            BIGSERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  email         TEXT NOT NULL,
  first_name    TEXT,
  sequence_day  INTEGER NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending',
  state         TEXT,
  is_pro        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, sequence_day)
);

CREATE INDEX IF NOT EXISTS email_sequences_due
  ON email_sequences (scheduled_for, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS email_sequences_user_id
  ON email_sequences (user_id);
