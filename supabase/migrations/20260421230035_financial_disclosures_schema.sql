
-- Filing index: one row per document from the House XML indices
CREATE TABLE fd_filings (
  doc_id        TEXT PRIMARY KEY,
  last_name     TEXT NOT NULL,
  first_name    TEXT,
  state_dst     TEXT,        -- e.g. "CA12"
  filing_type   TEXT NOT NULL, -- P=PTR, A=Annual, X=Extension, T=Termination, etc.
  year          INTEGER NOT NULL,
  filing_date   DATE,
  pdf_url       TEXT,
  bioguide_id   TEXT,        -- filled in when matched to Congress.gov
  processed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fd_filings_name ON fd_filings (LOWER(last_name), LOWER(first_name));
CREATE INDEX idx_fd_filings_bioguide ON fd_filings (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX idx_fd_filings_type_year ON fd_filings (filing_type, year);

-- Extracted trade transactions from PTR PDFs (Gemini-parsed, cached)
CREATE TABLE fd_trades (
  id               BIGSERIAL PRIMARY KEY,
  doc_id           TEXT REFERENCES fd_filings(doc_id) ON DELETE CASCADE,
  last_name        TEXT NOT NULL,
  first_name       TEXT,
  state_dst        TEXT,
  bioguide_id      TEXT,
  year             INTEGER,
  transaction_date DATE,
  owner            TEXT,       -- self / SP=Spouse / JT=Joint / DC=Dependent Child
  asset_name       TEXT,
  ticker           TEXT,
  transaction_type TEXT,       -- Purchase, Sale, Sale (Partial), Exchange
  amount_min       BIGINT,
  amount_max       BIGINT,
  amount_str       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fd_trades_bioguide ON fd_trades (bioguide_id);
CREATE INDEX idx_fd_trades_name ON fd_trades (LOWER(last_name), LOWER(first_name));
CREATE INDEX idx_fd_trades_ticker ON fd_trades (ticker) WHERE ticker IS NOT NULL;
CREATE INDEX idx_fd_trades_date ON fd_trades (transaction_date DESC);

-- Annual net worth extracted from Annual FD PDFs
CREATE TABLE fd_net_worth (
  id               BIGSERIAL PRIMARY KEY,
  doc_id           TEXT REFERENCES fd_filings(doc_id) ON DELETE CASCADE,
  last_name        TEXT NOT NULL,
  first_name       TEXT,
  state_dst        TEXT,
  bioguide_id      TEXT,
  report_year      INTEGER,
  assets_min       BIGINT,
  assets_max       BIGINT,
  liabilities_min  BIGINT,
  liabilities_max  BIGINT,
  net_worth_min    BIGINT,
  net_worth_max    BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fd_net_worth_bioguide ON fd_net_worth (bioguide_id);
CREATE INDEX idx_fd_net_worth_name ON fd_net_worth (LOWER(last_name), LOWER(first_name));
CREATE INDEX idx_fd_net_worth_year ON fd_net_worth (report_year);

-- RLS: these are public government records — readable by all authenticated users
ALTER TABLE fd_filings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd_trades   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fd_net_worth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fd_filings_read"   ON fd_filings   FOR SELECT USING (true);
CREATE POLICY "fd_trades_read"    ON fd_trades    FOR SELECT USING (true);
CREATE POLICY "fd_net_worth_read" ON fd_net_worth FOR SELECT USING (true);
