
CREATE INDEX IF NOT EXISTS fd_filings_state_dst ON fd_filings (state_dst);
CREATE INDEX IF NOT EXISTS fd_net_worth_state_dst ON fd_net_worth (state_dst);
CREATE INDEX IF NOT EXISTS fd_trades_year ON fd_trades (year);
