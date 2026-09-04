-- Add transaction_id column to fd_trades for dedup
ALTER TABLE fd_trades ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Unique constraint for trade dedup (skip if already exists)
DO $$ BEGIN
  ALTER TABLE fd_trades ADD CONSTRAINT fd_trades_doc_transaction_unique UNIQUE (doc_id, transaction_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- Deduplicate fd_net_worth: keep newest row per (bioguide_id, report_year)
DELETE FROM fd_net_worth
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY bioguide_id, report_year ORDER BY id DESC) AS rn
    FROM fd_net_worth
    WHERE bioguide_id IS NOT NULL
  ) t WHERE rn > 1
);

-- Now add unique constraint
DO $$ BEGIN
  ALTER TABLE fd_net_worth ADD CONSTRAINT fd_net_worth_bioguide_year_unique UNIQUE (bioguide_id, report_year);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS fd_filings_state_dst ON fd_filings (state_dst);
CREATE INDEX IF NOT EXISTS fd_net_worth_state_dst ON fd_net_worth (state_dst);
CREATE INDEX IF NOT EXISTS fd_trades_year ON fd_trades (year);