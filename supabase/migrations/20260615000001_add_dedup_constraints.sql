-- Add transaction_id column to fd_trades for dedup (populated by ingest script as a natural key)
ALTER TABLE fd_trades ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Unique constraint for trade dedup: one row per filing position
ALTER TABLE fd_trades ADD CONSTRAINT fd_trades_doc_transaction_unique
  UNIQUE (doc_id, transaction_id);

-- Unique constraint for net worth dedup: one row per member per year
-- Note: bioguide_id may be null for some members; those rows can still duplicate
ALTER TABLE fd_net_worth ADD CONSTRAINT fd_net_worth_bioguide_year_unique
  UNIQUE (bioguide_id, report_year);

-- Missing DB indexes for common query patterns
CREATE INDEX IF NOT EXISTS fd_filings_state_dst ON fd_filings (state_dst);
CREATE INDEX IF NOT EXISTS fd_net_worth_state_dst ON fd_net_worth (state_dst);
CREATE INDEX IF NOT EXISTS fd_trades_year ON fd_trades (year);
