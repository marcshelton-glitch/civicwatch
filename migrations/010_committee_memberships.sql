-- 010 — committee_memberships
--
-- Backs /api/conflict-score and /api/congress?type=committees.
--
-- ── Why a table at all ────────────────────────────────────────────────────
-- Both routes previously read `member.terms[].memberOf[]` from the Congress.gov
-- v3 /member/{bioguideId} endpoint. That field does not exist — per the official
-- MemberEndpoint documentation a terms.item carries only memberType, congress,
-- chamber, stateCode, stateName, partyName, partyCode, startYear, endYear and
-- district. The loop over `memberOf` therefore never executed and both routes
-- returned [] for every member, silently: the conflict scorer had nothing to
-- match trades against and reported "None flagged" for all of Congress, and the
-- UI's Committees tab was empty.
--
-- Congress.gov v3 exposes no per-member committee endpoint, so this cannot be
-- fixed by correcting a field path. Source is now the public
-- unitedstates/congress-legislators dataset, loaded by
-- scripts/ingest-committees.mjs.
--
-- ── Scope: current Congress only ─────────────────────────────────────────
-- committee-membership-current.yaml is a *snapshot* of who sits on what today,
-- not a historical roster. `congress` is stored on every row so the scorer can
-- restrict itself to trades made during that Congress. Scoring a 2019 trade
-- against a 2026 committee seat would manufacture conflicts that did not exist,
-- which on an accountability product is the one error worth avoiding above all.
--
-- Apply with:
--   psql "$SUPABASE_DB_URL" -f migrations/010_committee_memberships.sql
-- or paste into the Supabase SQL editor. Then run:
--   node --env-file=.env.local scripts/ingest-committees.mjs --apply

create table if not exists public.committee_memberships (
  id                 bigserial primary key,
  bioguide_id        text        not null,
  committee_id       text        not null,          -- thomas_id, e.g. HSAG
  committee_name     text        not null,          -- "House Committee on Agriculture"
  chamber            text,                          -- house | senate | joint
  -- '' rather than NULL for the full-committee row: Postgres treats NULLs as
  -- distinct in a unique index, so NULL here would allow duplicate rows.
  subcommittee_id    text        not null default '',
  subcommittee_name  text,
  -- The name sector matching actually runs against. For a full committee this
  -- equals committee_name; for a subcommittee it is "Committee — Subcommittee",
  -- so a subcommittee's own jurisdiction ("Commodity Markets, Digital Assets")
  -- can match a sector its parent committee's name would not.
  match_name         text        not null,
  rank               integer,
  title              text,                          -- Chair, Ranking Member, …
  party              text,                          -- majority | minority
  congress           integer     not null,
  synced_at          timestamptz not null default now(),
  constraint committee_memberships_unique
    unique (bioguide_id, committee_id, subcommittee_id, congress)
);

create index if not exists committee_memberships_bioguide_congress_idx
  on public.committee_memberships (bioguide_id, congress);

create index if not exists committee_memberships_committee_idx
  on public.committee_memberships (committee_id);

-- Committee membership is public record and /api/conflict-score is a public
-- route. Reads go through the service-role key (which bypasses RLS), but the
-- anon-readable policy keeps this consistent with fd_filings / fd_trades and
-- allows a direct client read later without another migration.
alter table public.committee_memberships enable row level security;

drop policy if exists committee_memberships_read on public.committee_memberships;
create policy committee_memberships_read
  on public.committee_memberships
  for select
  using (true);

-- Writes are service-role only. service_role bypasses RLS, so the absence of an
-- INSERT/UPDATE/DELETE policy is what keeps the anon key read-only here.
-- Do not add a permissive ALL policy to `public` — that is precisely the bug
-- migration 009 had to undo on push_subscriptions.
