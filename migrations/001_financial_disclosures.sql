-- Financial Disclosure tables for CivicWatch
-- Run in: Supabase Dashboard → SQL Editor
-- Or via: supabase db push (if using Supabase CLI)

-- ── fd_filings: index of all House Clerk financial disclosure filings ──────────
CREATE TABLE IF NOT EXISTS fd_filings (
  doc_id        TEXT PRIMARY KEY,
  last_name     TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  state_dst     TEXT,
  filing_type   TEXT NOT NULL,  -- P=PTR (trades), A=Annual FD, D=Amendment, etc.
  year          INTEGER NOT NULL,
  filing_date   DATE,
  pdf_url       TEXT,
  bioguide_id   TEXT,
  processed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fd_filings_last_name   ON fd_filings (lower(last_name));
CREATE INDEX IF NOT EXISTS fd_filings_bioguide    ON fd_filings (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fd_filings_type_proc   ON fd_filings (filing_type, processed);
CREATE INDEX IF NOT EXISTS fd_filings_year        ON fd_filings (year);

-- ── fd_trades: STOCK Act periodic transaction reports (PTRs) ──────────────────
CREATE TABLE IF NOT EXISTS fd_trades (
  id               BIGSERIAL PRIMARY KEY,
  doc_id           TEXT NOT NULL REFERENCES fd_filings(doc_id) ON DELETE CASCADE,
  last_name        TEXT NOT NULL,
  first_name       TEXT NOT NULL,
  state_dst        TEXT,
  bioguide_id      TEXT,
  year             INTEGER NOT NULL,
  transaction_date DATE,
  owner            TEXT,  -- self / SP (spouse) / JT (joint) / DC (dependent child)
  asset_name       TEXT,
  ticker           TEXT,
  transaction_type TEXT,  -- Purchase / Sale / Exchange
  amount_min       BIGINT,
  amount_max       BIGINT,
  amount_str       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fd_trades_last_name   ON fd_trades (lower(last_name));
CREATE INDEX IF NOT EXISTS fd_trades_bioguide    ON fd_trades (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fd_trades_doc_id      ON fd_trades (doc_id);
CREATE INDEX IF NOT EXISTS fd_trades_date        ON fd_trades (transaction_date DESC);
CREATE INDEX IF NOT EXISTS fd_trades_ticker      ON fd_trades (ticker) WHERE ticker IS NOT NULL;

-- ── fd_net_worth: annual financial disclosure net worth summaries ──────────────
CREATE TABLE IF NOT EXISTS fd_net_worth (
  id               BIGSERIAL PRIMARY KEY,
  doc_id           TEXT NOT NULL REFERENCES fd_filings(doc_id) ON DELETE CASCADE,
  last_name        TEXT NOT NULL,
  first_name       TEXT NOT NULL,
  state_dst        TEXT,
  bioguide_id      TEXT,
  report_year      INTEGER NOT NULL,
  assets_min       BIGINT,
  assets_max       BIGINT,
  liabilities_min  BIGINT,
  liabilities_max  BIGINT,
  net_worth_min    BIGINT,
  net_worth_max    BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doc_id)
);

CREATE INDEX IF NOT EXISTS fd_net_worth_last_name  ON fd_net_worth (lower(last_name));
CREATE INDEX IF NOT EXISTS fd_net_worth_bioguide   ON fd_net_worth (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fd_net_worth_year       ON fd_net_worth (report_year DESC);
