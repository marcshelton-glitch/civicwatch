-- OpenSecrets estimated net worth data (pending bulk data approval)
CREATE TABLE IF NOT EXISTS opensecrets_net_worth (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bioguide_id text,
  cid text,
  name text NOT NULL,
  cycle integer,
  net_worth_low bigint,
  net_worth_high bigint,
  net_worth_mid bigint GENERATED ALWAYS AS ((net_worth_low + net_worth_high) / 2) STORED,
  source text DEFAULT 'opensecrets',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opensecrets_nw_bioguide ON opensecrets_net_worth(bioguide_id);
CREATE INDEX IF NOT EXISTS idx_opensecrets_nw_cycle ON opensecrets_net_worth(cycle DESC);
