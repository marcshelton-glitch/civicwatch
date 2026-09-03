# Future-dated trades — repair, 2026-09-02

Gantt **#24**. 29 rows in `fd_trades` had a `transaction_date` in the future,
the latest **2030-10-15**. All were ingested in one batch on **2026-08-27**.

## Cause

Not a systematic offset — comparing the authoritative `year` column against
`transaction_date` shows drifts of 0, +5, +6, +8, +10 years with no pattern.
The parser was reading the wrong date out of the filing (a bond maturity or
similar), and the old guard only rejected years past 2030 — which, as the
code's own comment now says, *"became a future date once the calendar caught
up. That's how 27 bad rows got in."*

**#25 already fixed the cause.** `parseDate()` in `scripts/ingest-disclosures.mjs`
now rejects any date later than today:

```js
if (d.getTime() > todayUTC) return null
```

## Repair chosen: null the date, keep the row

Not deletion, and not a guessed correction.

- The **trade** is real — it came from a filed disclosure with a `doc_id`. The
  member, asset, amount and type are all good. Only the date is wrong.
- The correct date cannot be recovered from what is stored. It lives in the
  source filing, and re-deriving it would be a guess.
- **`NULL` is exactly what the fixed parser produces today** for these inputs.
  So nulling makes the table consistent with what a re-ingest would write,
  rather than inventing a third state.
- 32 rows already carry a null `transaction_date`, so this is an existing,
  handled condition rather than a new one.

The 29 rows below are the complete pre-repair state. Restoring any of them is
a matter of writing `transaction_date` back by `id`.

## Affected members

Keating (7), DelBene (7), Hern (3), Clark (2), Cohen (2), Kelly (2),
Buchanan, Blunt Rochester, Jacobs, Matsui, Yakym (1 each).

## Pre-repair backup

See `future-dated-trades-backup-2026-09-02.json` next to this file.
