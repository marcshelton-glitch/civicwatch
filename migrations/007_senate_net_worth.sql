-- Senate Annual Financial Disclosure net worth summaries
-- Mirrors senate_trades pattern — no FK to fd_filings (Senate uses UUID-based filing IDs)
-- Run in: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS senate_net_worth (
  id               BIGSERIAL PRIMARY KEY,
  filing_id        TEXT NOT NULL,           -- UUID from efdsearch.senate.gov
  last_name        TEXT NOT NULL,
  first_name       TEXT NOT NULL,
  state            TEXT,
  bioguide_id      TEXT,
  report_year      INTEGER NOT NULL,        -- calendar year being reported (filing year - 1)
  filing_date      DATE,
  pdf_url          TEXT,
  assets_min       BIGINT,
  assets_max       BIGINT,
  liabilities_min  BIGINT,
  liabilities_max  BIGINT,
  net_worth_min    BIGINT,
  net_worth_max    BIGINT,
  asset_count      INTEGER,                 -- Schedule A rows parsed (for confidence)
  liability_count  INTEGER,                 -- Schedule D rows parsed
  source           TEXT NOT NULL DEFAULT 'senate_efd',
  confidence       TEXT,                    -- high (≥5 rows) | medium (1–4) | low (0)
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (filing_id)
);

CREATE INDEX IF NOT EXISTS senate_net_worth_last_name ON senate_net_worth (lower(last_name));
CREATE INDEX IF NOT EXISTS senate_net_worth_bioguide  ON senate_net_worth (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS senate_net_worth_year      ON senate_net_worth (report_year DESC);
CREATE INDEX IF NOT EXISTS senate_net_worth_state     ON senate_net_worth (state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS senate_net_worth_source    ON senate_net_worth (source);

COMMENT ON TABLE senate_net_worth IS
  'Annual Financial Disclosure net worth summaries for US Senators, parsed from efdsearch.senate.gov PDFs';
COMMENT ON COLUMN senate_net_worth.report_year IS
  'Calendar year whose holdings are reported (typically filing_year - 1)';
COMMENT ON COLUMN senate_net_worth.confidence IS
  'Parser confidence: high (≥5 Schedule A rows), medium (1–4), low (0 rows found)';
