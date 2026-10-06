# fd_trades bioguide backfill check — 2026-10-01 (report only)

> **PROPOSED matches only. Nothing has been written to Supabase.** Applying these requires a human-confirmed follow-up turn.

## Summary

- Coverage: **5,034 / 5,259 = 95.7%** (225 rows NULL)
- Names with ≥3 unresolved trades: **28 (124 trades)**. Proposed: 28 high-confidence.
- Root cause signal: nearly all NULL rows were created **2026-08-27 or later**. The ingest isn't resolving bioguide IDs on new rows; these are mostly members already resolved in older rows.
- **2 existing mis-mappings found (46 rows) plus 1 suspect row.** See "Data errors" below.

## Method

The Congress.gov API couldn't be reached via web_fetch in this run (provenance-blocked), so matches were built from three read-only sources:
1. The same last_name + state already resolved elsewhere in `fd_trades` (the prior backfill's output).
2. Cross-check against `committee_memberships` (119th Congress, from Congress.gov). The party side (majority = R, minority = D) had to agree with the member's known party.
3. Where (2) disagreed, the ID was verified on congress.gov (via web search).

The doc_id join pass found nothing: none of these rows' filings has a bioguide_id in `fd_filings`.

## Proposed resolutions (n ≥ 3)

`last_name | state | proposed_bioguideId | trade_count | confidence`

```
Taylor     | OH | T000490 | 8 | high
Hern       | OK | H001082 | 7 | high
Allen      | GA | A000372 | 6 | high
DelBene    | WA | D000617 | 6 | high
Kelly      | PA | K000376 | 6 | high   (Mike Kelly, PA16)
Cohen      | TN | C001068 | 5 | high
Peters     | CA | P000608 | 5 | high   (Scott Peters)
Fields     | LA | F000110 | 5 | high
Gottheimer | NJ | G000583 | 5 | high
Salazar    | FL | S000168 | 5 | high
Doggett    | TX | D000399 | 5 | high
Cisneros   | CA | C001123 | 5 | high
Kean       | NJ | K000398 | 5 | high
Delaney    | MD | M001232 | 5 | high   (April McClain Delaney; note M- prefix)
McGuire    | VA | M001239 | 5 | high   (3 "John" + 2 "John J Mr")
Moore      | NC | M001236 | 4 | high   (Tim Moore, NC14)
Morrison   | MN | M001234 | 4 | high
Moskowitz  | FL | M001217 | 4 | high   (verified congress.gov; NOT M001219, see below)
Dingell    | MI | D000624 | 3 | high   (Debbie, MI06; first_name check required)
Donalds    | FL | D000032 | 3 | high
McCormick  | GA | M001218 | 3 | high
Miller     | OH | M001222 | 3 | high   (Max Miller, verified congress.gov; NOT M001225)
Timmons    | SC | T000480 | 3 | high   (no prior fd_trades match; committee data agrees)
Keating    | MA | K000375 | 3 | high
Beyer      | VA | B001292 | 3 | high
Biggs      | SC | B001325 | 3 | high   (Sheri Biggs)
Roy        | TX | R000614 | 3 | high   (no prior fd_trades match; committee data agrees)
Sessions   | TX | S000250 | 3 | high
```

Suggested apply pattern (scope by first_name too, for family/seat traps):

```sql
-- example; review before running
UPDATE fd_trades SET bioguide_id = 'T000490'
WHERE bioguide_id IS NULL AND last_name = 'Taylor' AND left(state_dst,2) = 'OH';
UPDATE fd_trades SET bioguide_id = 'D000624'
WHERE bioguide_id IS NULL AND last_name = 'Dingell' AND first_name ILIKE 'Debbie%';
UPDATE fd_trades SET bioguide_id = 'M001222'
WHERE bioguide_id IS NULL AND last_name = 'Miller' AND first_name ILIKE 'Max%' AND left(state_dst,2) = 'OH';
-- etc.
```

## Data errors in already-resolved rows (needs human review)

| Rows | Currently | Should be | Evidence |
|---|---|---|---|
| 17 × Moskowitz, Jared FL23 | M001219 | **M001217** | M001219 sits on the majority (R) side of committees. Moskowitz is a D, and congress.gov lists him as M001217. |
| 29 × Miller, Max OH07 | M001225 | **M001222** | M001225 sits on the minority (D) side of E&C. Max Miller is an R, and congress.gov lists him as M001222. |
| 1 × Dingell, John D. MI12 | D000624 (Debbie) | likely **D000355** (John D. Dingell Jr.) | Family/seat-succession trap. Check the trade year before changing it. |

These also affect Trade Conflict Analysis today: their trades are being scored against another member's committees.

## Not resolved this run

- Long tail (n ≤ 2, about 100 rows, e.g. Cooper TN, Crist FL, Torres NY, Pelosi CA). These were skipped per the task scope. Most look like the same "new rows not resolved at ingest" pattern.
- Nothing in the n ≥ 3 set was ambiguous.
