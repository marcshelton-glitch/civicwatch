-- Add OCR provenance columns to fd_net_worth
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (all statements use IF NOT EXISTS / DO NOTHING guards)

ALTER TABLE fd_net_worth ADD COLUMN IF NOT EXISTS source text DEFAULT 'fd';
ALTER TABLE fd_net_worth ADD COLUMN IF NOT EXISTS confidence text;
ALTER TABLE fd_net_worth ADD COLUMN IF NOT EXISTS asset_count integer;
ALTER TABLE fd_net_worth ADD COLUMN IF NOT EXISTS liability_count integer;

-- source values: 'fd' (machine-readable PDF), 'ocr' (Google Vision),
--               'senate_efd' (Senate EFT system), 'opensecrets', 'wikidata'
-- confidence values: 'high' (≥5 rows parsed), 'medium' (1–4), 'low' (0)

COMMENT ON COLUMN fd_net_worth.source IS
  'Origin of this net worth estimate: fd | ocr | senate_efd | opensecrets | wikidata';
COMMENT ON COLUMN fd_net_worth.confidence IS
  'Parser confidence based on number of rows extracted: high | medium | low';
COMMENT ON COLUMN fd_net_worth.asset_count IS
  'Number of Schedule A asset rows parsed from the disclosure';
COMMENT ON COLUMN fd_net_worth.liability_count IS
  'Number of Schedule D liability rows parsed from the disclosure';

-- Index to quickly find OCR rows that need re-processing or quality review
CREATE INDEX IF NOT EXISTS fd_net_worth_source ON fd_net_worth (source);
CREATE INDEX IF NOT EXISTS fd_net_worth_confidence ON fd_net_worth (confidence) WHERE confidence IS NOT NULL;
