create table if not exists public.committee_memberships (
  id                 bigserial primary key,
  bioguide_id        text        not null,
  committee_id       text        not null,
  committee_name     text        not null,
  chamber            text,
  subcommittee_id    text        not null default '',
  subcommittee_name  text,
  match_name         text        not null,
  rank               integer,
  title              text,
  party              text,
  congress           integer     not null,
  synced_at          timestamptz not null default now(),
  constraint committee_memberships_unique
    unique (bioguide_id, committee_id, subcommittee_id, congress)
);

create index if not exists committee_memberships_bioguide_congress_idx
  on public.committee_memberships (bioguide_id, congress);

create index if not exists committee_memberships_committee_idx
  on public.committee_memberships (committee_id);

alter table public.committee_memberships enable row level security;

drop policy if exists committee_memberships_read on public.committee_memberships;
create policy committee_memberships_read
  on public.committee_memberships
  for select
  using (true);