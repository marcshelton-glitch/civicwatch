# Archived — superseded by `supabase/migrations/`

**Resolved by ADR-003 (2026-09-03), see `00-governance/decision-log.md`.**

This folder is no longer where new schema changes go. It predates this
repo's adoption of the Supabase CLI migration workflow and was applied by
hand (`psql` / the Supabase SQL editor) rather than `supabase db push` —
several of these files (003–008) never appeared in the live migration
ledger at all despite creating real, still-live tables.

Every file here has been reconciled against the live database
(`supabase_migrations.schema_migrations` on project `hgtofwsvbblumcgbqzat`)
and re-homed in `supabase/migrations/` under its true applied timestamp:

| This folder | Now lives at |
|---|---|
| `001_financial_disclosures.sql` | `supabase/migrations/20260421230035_financial_disclosures_schema.sql` |
| `002_senate_trades.sql` | `supabase/migrations/20260504001940_002_senate_trades.sql` |
| `003_alerts.sql` | `supabase/migrations/20260510000001_003_alerts.sql` |
| `004_preferences.sql` | `supabase/migrations/20260510000002_004_preferences.sql` |
| `005_opensecrets_networth.sql` | `supabase/migrations/20260524000000_005_opensecrets_networth.sql` |
| `006_fd_net_worth_ocr.sql` | `supabase/migrations/20260525000000_006_fd_net_worth_ocr.sql` |
| `007_senate_net_worth.sql` | `supabase/migrations/20260525000001_007_senate_net_worth.sql` |
| `008_email_sequences.sql` | `supabase/migrations/20260620000000_008_email_sequences.sql` |
| `009_fix_push_subscriptions_rls.sql` | `supabase/migrations/20260813062235_fix_push_subscriptions_rls.sql` |
| `010_committee_memberships.sql` | `supabase/migrations/20260804035331_committee_memberships.sql` |

The files in this folder are kept as-is for historical reference (git
blame, old commit messages) but are **not** the source of truth — do not
edit them and do not apply them again. `supabase/migrations/` is canonical
going forward: new schema changes are `supabase migration new <name>` +
`supabase db push`, full stop.

### Known gaps this reconciliation did *not* fix

- `public.tracked_reps`, `public.alerts` (bare, not `sent_alerts`),
  `public.poll_votes`, `public.legiscan_cache`, and `public.users` exist
  live with **no creation SQL anywhere in this repo**, in either this
  folder or `supabase/migrations/`. Their origin is unknown — likely
  created directly against the database before any migration convention
  existed. Flagged for Marc; not fabricated here.
- `db/backfills/2026-06-30_backfill_fd_net_worth_bioguide_id.sql` (moved
  out of `supabase/migrations/`, where it was miscategorized as a schema
  migration) is a one-off idempotent data backfill for
  `fd_net_worth.bioguide_id`, not a schema change. As of 2026-09-03, 210 of
  503 `fd_net_worth` rows still have a null `bioguide_id` — this script has
  **not** been run. Whether/when to run it is a separate call from D-001
  and was not made here.
