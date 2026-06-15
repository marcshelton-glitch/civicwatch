-- Run this in your Supabase SQL editor
-- Project: hgtofwsvbblumcgbqzat.supabase.co
-- Purpose: Local cache for LegiScan API responses
--          Stores change_hash per entry so we never re-fetch unchanged data
--          This is required for compliance with LegiScan's 30k/mo query limit

create table if not exists legiscan_cache (
  key          text        primary key,   -- e.g. "legiscan:getMasterListRaw:{"state":"CA"}"
  data         jsonb       not null,      -- full LegiScan response payload
  change_hash  text,                      -- LegiScan change_hash for this record
  fetched_at   timestamptz default now()  -- when we last fetched from LegiScan
);

-- Index for fast lookups by hash (used during hash comparison checks)
create index if not exists legiscan_cache_hash_idx
  on legiscan_cache (change_hash);

-- Auto-update fetched_at on upsert
create or replace function update_legiscan_fetched_at()
returns trigger as $$
begin
  new.fetched_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger legiscan_cache_updated
  before update on legiscan_cache
  for each row execute function update_legiscan_fetched_at();

-- Row-level security: only service role can read/write
alter table legiscan_cache enable row level security;

create policy "Service role only"
  on legiscan_cache
  using (auth.role() = 'service_role');
