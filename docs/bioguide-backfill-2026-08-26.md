# fd_trades.bioguide_id backfill — proposed resolutions (2026-08-26)

**Status: PROPOSED ONLY. No writes were made to Supabase.** This was a report-only run per the scheduled task's permission constraints (unattended writes to production require a human in the loop — see `00-governance/session-log.md`, 2026-08-13 entry, and `docs/paywall-funnel-audit.md` Finding 5).

## Summary

- `fd_trades` coverage: **4,884 / 5,076 rows have `bioguide_id`** (96.2%), up from 47.5% (Aug 13) / the 52%-missing figure cited in the paywall audit (Aug 20). Someone has been chipping away at this between runs.
- 192 rows remain unresolved, across many distinct `(last_name, first_name, state_dst)` tuples.
- This run resolved **31 name/state pairs (145 trades)** with high confidence, using Congress.gov's `/v3/member/{state}` roster and matching on last name + state + district/term overlap, per `scripts/backfill-trades-bioguide.mjs`'s two-pass logic.
- All matches below are **high confidence** — no ambiguous family/seat-succession cases turned up in this batch (see notes on Sánchez and Scott below, where a same-surname trap was checked and ruled out).
- Remaining unresolved rows are mostly 1–2 trade stragglers (long tail) plus a few pairs beyond this run's top-40 scope; next month's run should pick those up.

## Proposed resolutions

Format: `last_name | state | proposed_bioguideId | trade_count | confidence`

```
Boehner        | OH | B000589 | 10 | high
Yoder          | KS | Y000063 | 7  | high
Malinowski     | NJ | M001203 | 7  | high
Rice           | SC | R000597 | 7  | high
LoBiondo       | NJ | L000554 | 6  | high
Crenshaw       | TX | C001120 | 6  | high
Garbarino      | NY | G000597 | 5  | high
Jacobs         | CA | J000305 | 5  | high  (district CA53→CA51 post-redistricting; same person)
Gonzalez       | OH | G000588 | 5  | high
Sanchez        | CA | S001156 | 5  | high  (Linda T. Sánchez, CA38 — checked against Loretta Sanchez, CA46/S000030; different bioguideId, not a match)
Scott          | VA | S000185 | 5  | high  (Robert C. "Bobby" Scott, VA03 — checked against William Lloyd Scott, VA Senate 1973-79; no overlap, not a match)
Courtney       | CT | C001069 | 5  | high
Cawthorn       | NC | C001104 | 5  | high
Speier         | CA | S001175 | 5  | high
Meijer         | MI | M001186 | 4  | high
Smith          | NE | S001172 | 4  | high  (Adrian Smith, NE03)
Sherman        | CA | S000344 | 4  | high
Bentz          | OR | B000668 | 4  | high
Rose           | TN | R000612 | 4  | high  (John W. Rose, TN06)
Schrier        | WA | S001216 | 8  | high  (combines "Kim Dr" and "Kim" first_name variants — same malformed-name issue flagged in Finding 5)
Fletcher       | TX | F000468 | 4  | high  (Elizabeth Fletcher = "Lizzie" Fletcher, TX07)
Himes          | CT | H001047 | 3  | high
Murphy         | NC | M001210 | 3  | high  (Greg Francis Murphy = Gregory F. Murphy, NC03)
Ross           | NC | R000305 | 3  | high  (Deborah K. Ross, NC02)
Bice           | OK | B000740 | 3  | high
Reschenthaler  | PA | R000610 | 3  | high  (ignore "Guy Mr" malformed first_name)
Issa           | CA | I000056 | 3  | high
Waltz          | FL | W000823 | 3  | high
Pallone        | NJ | P000034 | 3  | high
Auchincloss    | MA | A000148 | 3  | high
Fortenberry    | NE | F000449 | 3  | high
```

31 pairs, 145 trades total.

## Not resolved this run

Everything below `n >= 3` in the top-40 unresolved list was skipped per the task's scope (long-tail stragglers, 1–2 trades each): Cooper (TN05), Barragan (CA44), Steil (WI01), Crist (FL13), Deutch (FL22), O'Halleran (AZ01), Mann (KS01), Letlow (LA05) — 16 trades total. There are also more distinct name tuples beyond the top-40 rows returned by this run's query (total unresolved is 192; the top 40 groups shown account for 161 of those). Next month's run should re-run the `GROUP BY` query with a higher `LIMIT` or no limit to pick up the remainder.

No ambiguous/unresolvable names came up in this batch — every `n >= 3` pair matched exactly one Congress.gov member for that surname + state.

## Next step (requires a human)

This file has ready-to-paste values for an `UPDATE ... WHERE last_name = ? AND state_dst LIKE ?` per row, e.g.:

```sql
UPDATE fd_trades SET bioguide_id = 'B000589' WHERE last_name = 'Boehner' AND state_dst = 'OH08' AND bioguide_id IS NULL;
```

**Nothing has been written to Supabase.** Applying these requires either a follow-up session where a human explicitly confirms the write, or a change to this session's permission settings to allow unattended UPDATEs. Recommend applying in a single follow-up turn with `execute_sql`, one statement per row above, then re-running the coverage query to confirm the jump (96.2% → ~99.1% if all 31 land cleanly).
