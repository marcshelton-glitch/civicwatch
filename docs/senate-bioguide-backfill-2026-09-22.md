# Senate bioguide backfill — 2026-09-22

**Problem.** Every `senate_trades` row (7,850) and `senate_net_worth` row (1,231)
had `bioguide_id = NULL` and `state = NULL`. `scripts/ingest-senate-trades.mjs`
parses state from the eFD office string with `/\(([A-Z]{2})\)/`, which never
matches, and never set a bioguide id. `/api/conflict-score` filters Senate
trades by `bioguide_id`, so **every senator scored on zero trades**: the false
"all clear" `/pro` promises not to show. Found while preparing gantt #41 (the
Show HN post invites people to check the matching).

**Fix.** Migration `supabase/migrations/20260922000001_senate_bioguide_map.sql`
(applied to prod 2026-09-22 with Marc's confirmation):

- `senate_member_map (last_name, first_name) -> bioguide_id, state`: 103
  eFD name spellings, 97 senators. Built from unitedstates/congress-legislators;
  each is a unique match on surname + first name/nickname + a Senate term
  overlapping the filing dates. Spelling variants map to the same id
  (`Duckworth, Tammy` / `Ladda Tammy`, `Rounds, Mike` / `M. Michael`, `Wyden, Ron` / `Ron L`,
  `McConnell` / `McConnell, Jr.`, `Klobuchar, Amy J` with a double space).
- `fill_senate_bioguide()` BEFORE INSERT trigger on both tables. It fills only
  NULL values and does nothing when there's no map row.
- One-time backfill of existing rows.

**Excluded:** `senate_net_worth` "Graham, Darline" (1 report). She isn't a
senator; the only Senate Graham is Lindsey. Left NULL.

**Result:**

| table | rows | matched |
|---|---|---|
| senate_trades | 7,850 | 7,850 (100%) |
| senate_net_worth | 1,231 | 1,230 |
| fd_trades (House, unchanged) | 5,254 | 5,034 (95.8%) |
| **all trades** | **13,104** | **12,884 (98.3%)** |

58 senators have trades; all 58 have `committee_memberships` rows. Verified live:
`/api/conflict-score?bioguideId=T000278` (Tuberville) now returns score 14/High,
W000802 (Whitehouse) 17, C001047 (Capito) 26. Before the fix, all three had no trades.

**Maintenance.** A newly seated senator's first filing comes in unmatched
until a row is added to `senate_member_map`. Check with:
`select last_name, first_name, count(*) from senate_trades where bioguide_id is null group by 1,2;`
