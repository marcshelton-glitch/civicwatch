-- Senate STOCK Act PTR trades
-- Run in: Supabase Dashboard → SQL Editor

-- Add chamber column to existing fd_trades (all existing rows are House)
ALTER TABLE fd_trades ADD COLUMN IF NOT EXISTS chamber TEXT NOT NULL DEFAULT 'house';

-- Senate PTR trades (UUID-based filing IDs — no FK to fd_filings)
CREATE TABLE IF NOT EXISTS senate_trades (
  id               BIGSERIAL PRIMARY KEY,
  filing_id        TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  first_name       TEXT NOT NULL,
  state            TEXT,
  bioguide_id      TEXT,
  year             INTEGER NOT NULL,
  filing_date      DATE,
  transaction_date DATE,
  owner            TEXT,
  asset_name       TEXT,
  ticker           TEXT,
  transaction_type TEXT,
  amount_min       BIGINT,
  amount_max       BIGINT,
  amount_str       TEXT,
  ptr_url          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (filing_id, transaction_date, asset_name, transaction_type)
);

CREATE INDEX IF NOT EXISTS senate_trades_last_name  ON senate_trades (lower(last_name));
CREATE INDEX IF NOT EXISTS senate_trades_bioguide   ON senate_trades (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS senate_trades_date       ON senate_trades (transaction_date DESC);
CREATE INDEX IF NOT EXISTS senate_trades_ticker     ON senate_trades (ticker) WHERE ticker IS NOT NULL;
CREATE INDEX IF NOT EXISTS senate_trades_filing     ON senate_trades (filing_id);
CREATE INDEX IF NOT EXISTS senate_trades_year       ON senate_trades (year);
