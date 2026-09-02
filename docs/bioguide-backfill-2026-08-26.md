# fd_trades.bioguide_id backfill — proposed resolutions (2026-08-26)

**Status: APPLIED 2026-09-01.** Marc confirmed the write in the `/pro`
rewrite session; all 31 pairs below landed (12 needed a district-corrected
`state_dst` — see `00-governance/session-log.md`, 2026-09-01 entry). Live
coverage is now 5,034/5,230 (96.3%) against today's larger row count (new
trades keep landing unmatched until the next backfill pass). `/pro`'s
"Coming Soon" badge on Trade Conflict Analysis has been lifted accordingly.

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

## Applied 2026-09-01

All 31 pairs above were applied via `execute_sql` with Marc's confirmation.
Two corrections were needed mid-run: 12 of the pairs listed above with just
a two-letter state (Speier, Meijer, Smith, Sherman, Rose, Schrier, Fletcher,
Himes, Murphy, Ross, Bice, Reschenthaler, Issa, Waltz, Pallone, Auchincloss,
Fortenberry — the ones without a district cited inline) needed the actual
`state_dst` (state+district, e.g. `'CA14'` not `'CA'`) pulled from a live
`SELECT` before the `UPDATE` matched anything; a first pass using the bare
state code as written above silently matched 0 rows for those. Two rows
that share a surname with resolved members were correctly left alone
(`Murphy` FL07 vs. the targeted NC03 Murphy; `Smith` WA09 vs. the targeted
NE03 Smith) — not the same person, not part of this batch.

Result: 5,034/5,230 rows now have `bioguide_id` (96.3%). The total row count
grew from 5,076 to 5,230 between Aug 26 and Sep 1 as new trades were
ingested, most of them not yet matched — so 96.3% understates how complete
the *original* 5,076-row backfill target actually is; all 31 targeted
pairs are fully resolved. See `00-governance/session-log.md`, 2026-09-01
entry, for the full account. `/pro`'s "Coming Soon" badge on Trade Conflict
Analysis has been lifted.

Next month's run should still pick up the long tail flagged below and the
newly-arrived unmatched trades from routine ingestion.
