---
doc: session-log
project: civicwatch
status: active
owner: Marc Shelton
last_reviewed: 2026-08-13
review_cadence: 365d
---

# Session Log — civicwatch

**Append-only. Newest first.** Every session writes one entry before it ends.

This is the continuity mechanism: a new chat has no memory of the last one, so
whatever isn't written here is lost. Keep entries short — this is a handoff
note, not a transcript.

If you are an agent starting a session: read the top three entries. If you are
an agent ending one: add yours.

---

## 2026-09-01 · applied bioguide_id backfill, rewrote /pro around verified reality
- **Did:** completed gantt task 32 ("Rewrite /pro around what actually
  works"). First applied the 31-pair backfill proposed in
  `docs/bioguide-backfill-2026-08-26.md` (Marc confirmed the write) —
  `fd_trades.bioguide_id` coverage is now 5,034/5,230 (96.3%); the two
  remaining nulls in that name list (`Murphy FL07`, `Smith WA09`) are
  different people from the ones the backfill targeted and were correctly
  left alone. Two of the 31 `UPDATE`s needed a correction mid-run — several
  proposed rows used a bare state code (e.g. `state_dst = 'CA'`) where the
  live column actually stores state+district (`'CA14'`); those 12 pairs were
  re-run with the correct district once found, landing all 31/31. Then
  audited every feature `/pro` claims against the code, not just the copy:
  found `/api/conflict-score` (Trade Conflict Analysis), `/api/track`
  (watchlist), `/api/push/subscribe` + `/api/send-alerts` (Track My Rep™
  Alerts), and `/api/civic` (state/local lookup) all have **no server-side
  Pro check** — `/pro` was marketing three of those four as paid-exclusive
  when any signed-in (or, for conflict-score, anonymous) user already gets
  them free. Rewrote `app/pro/page.js`: moved tracking/alerts/state-local
  lookup into the Free column (matches reality), promoted Trade Conflict
  Analysis off "Coming Soon" (methodology is real, coverage is now high, and
  the API already tells the caller "no data on file" instead of a false
  clean bill of health), kept Peer Standing Breakdown as Coming Soon
  (genuinely not built — the AI report's peer commentary is narrative only),
  added an honest coverage-caveat FAQ entry, and trimmed the hero/section
  copy to match. Filed `D-003` in `DECISIONS-PENDING.md` recommending Marc
  gate `conflict-score` server-side, since it's the one still-paid feature
  with a completely open API.
- **Learned:** the backfill doc's proposed `WHERE state_dst = ?` values
  weren't all copy-pasteable as written — several used the plain two-letter
  state from the summary table instead of the full `state_dst` (state +
  district) the column actually stores, so a naive bulk-apply would have
  silently updated 0 rows for 12 of the 31 pairs while reporting success.
  Always re-verify the exact `state_dst` value against a live `SELECT`
  before trusting a proposed `WHERE` clause copied from a report, even a
  well-vetted one. Also: client-side blur/lock overlays are not evidence a
  feature is actually paywalled — `conflict-score`'s route had zero auth and
  was served with a public cache header, which a marketing page can't tell
  just by looking at the UI.
- **Left undone:** did not add the server-side Pro gate to
  `conflict-score`/`track`/`push`/`civic` — that's a product decision (D-003),
  not a copy fix, and changes what free users can do today. Also didn't
  touch `app/terms/page.js`, which separately claims Pro includes "all
  government levels," "town hall notifications," and "data export" — none
  of which exist yet as built features; worth a follow-up pass once D-003 is
  resolved, since terms and `/pro` should agree with each other too.

---

## 2026-08-26 · monthly bioguide_id backfill check (report-only, no writes)
- **Did:** ran the scheduled `civicwatch-bioguide-backfill` maintenance check.
  `fd_trades` coverage is now 4,884/5,076 (96.2%) — up sharply from the 47.5%
  logged Aug 13 / 52%-missing cited in the paywall audit Aug 20, so real
  progress landed between runs (not from this session). Replicated
  `scripts/backfill-trades-bioguide.mjs`'s name+state matching logic by hand
  via `mcp__workspace__web_fetch` against Congress.gov (bash/node network
  access to api.congress.gov and supabase.co is blocked in this sandbox —
  confirmed again, don't retry `node scripts/backfill-trades-bioguide.mjs`
  directly). Resolved 31 name/state pairs (145 of the 192 remaining
  unresolved trades) with high confidence, including checking two
  family/seat-succession traps (Linda T. Sánchez vs. Loretta Sanchez in CA;
  Robert C. "Bobby" Scott vs. William Lloyd Scott in VA) that turned out not
  to be conflicts. Full proposed-UPDATE list written to
  `docs/bioguide-backfill-2026-08-26.md`.
- **Learned:** large states' Congress.gov member rosters (CA especially, 228
  members) don't fit in one `web_fetch` call even at `limit=250` — response
  gets truncated mid-JSON. Workaround that worked: `web_fetch` still saves
  the raw (truncated) response to a local file even on "exceeds max tokens"
  errors, and that file is readable via `bash`+`python3` regex extraction
  (no network needed since it's already on disk) — much cheaper than
  re-fetching with smaller `limit`/`offset` pages every time. Also: Linda
  Sánchez's Congress.gov record uses the accented "Sánchez" — a plain-ASCII
  "Sanchez" grep will silently miss her and only find Loretta.
- **Left undone:** did NOT write any `UPDATE` to `fd_trades` — this task is
  intentionally report-only (a prior attempt to make this auto-apply was
  blocked by a permission classifier; unattended prod writes need a human).
  The 31 proposed resolutions in `docs/bioguide-backfill-2026-08-26.md` are
  ready to paste into `execute_sql` but need a human to confirm the write in
  a follow-up turn. Also didn't chase the long tail (1–2 trade stragglers,
  ~31 trades) or names beyond the top-40 `GROUP BY` query — next month's run
  should raise the `LIMIT` or drop it. Once applied, coverage should jump to
  roughly 99.1%, which is the threshold at which `docs/paywall-funnel-audit.md`
  Finding 5 said `/pro`'s "Coming Soon" badge on Trade Conflict Analysis
  should be revisited.

---

## 2026-08-13 · pushed the prelaunch branch, closed a live P0
- **Did:** verified `fd_trades.bioguide_id` coverage against live Supabase
  (47.5% — the Aug 3 backfill only partially landed; wrote details to memory).
  Confirmed `fix/prelaunch-revenue-and-security` (7 commits, not 5 — includes
  the committee work) had never been pushed; Marc pushed it directly from his
  Mac since this cloud session's git proxy has no credential for this repo.
  Confirmed the Vercel preview build (`dpl_21ZgiBqEbaE9B3sTDhNb3jciNGiK`) is
  READY. Checked live RLS on `push_subscriptions` and found migrations/009's
  fix had **not** actually been applied — the world-writable "Service role
  bypass" policy (public role, `USING(true)`, all commands) was live in
  production. Dropped it via `apply_migration`; security advisor now clean.
  Gantt #15, #16, #17 marked done; totals/needsAttentionCount recomputed;
  `project-state.json` regenerated from real numbers (was a stub — every
  field had been null/zero since the Aug 11 scaffold).
- **Learned:** "5 unpushed commits" in `CivicWatch.md`'s Aug 11/12 notes was
  stale — it was 7, and more importantly the branch wasn't on GitHub or
  Vercel at all, so nothing in it (including the RLS fix) had reached
  production until today. Treat "committed locally" and "live" as separate
  claims going forward; this doc has been wrong about that twice now (see the
  July 8 iCloud-copy incident logged above this structure).
- **Left undone:** #18 (merge to main) needs the same manual step on Marc's
  Mac as the push did — cloud session cannot reach GitHub for this repo.
  Gave exact command; waiting on it before #19–21 (health check, Stripe price
  ID, real-card checkout). `launch.projected` (2026-08-29) is carried over
  unrecomputed — it predates today's work and should be rebuilt once #18–21
  land. Also flagging, not resolving: `PROJECT.md` still has `status: draft`
  and an unfilled stage line, while `CivicWatch.md` says "Status: LIVE" —
  those two documents disagree about what stage this product is actually in.
- **Next session should:** once #18 is merged, run #19 (`/api/health`), then
  #20/#21 (Stripe price ID + real-card checkout) — that's the actual revenue
  unblock. Gantt #23 (bioguide_id backfill) should be reframed as "fix the
  ingest name matcher for sitting members," not "run the backfill" — see the
  updated conflict-score memory for the Doggett/Chu/Lee specifics.

## 2026-09-02 · verified seven "done" tasks, fixed #24 and #36

- **Checked before ticking.** Marc believed #6, #11, #14, #23, #24, #25 and #36
  were complete. Verified each against evidence rather than assumption; **only
  #23 held up** on first pass. #24 had 29 future-dated rows still live in
  `fd_trades` (not 27 — two more had been ingested), and #36 was returning HTTP
  500 in production. Six of seven would have been wrong to mark done.

- **#24 — repaired, not purged.** The 29 rows had `transaction_date` up to
  2030-10-15, all from one 2026-08-27 batch. Comparing the authoritative `year`
  column showed drifts of 0/+5/+6/+8/+10 years — no systematic offset, so no
  correction could be derived. Set `transaction_date = NULL` rather than
  deleting: the filings are real (they have `doc_id`s), only the date was
  wrong, and NULL is exactly what the fixed parser now produces for these
  inputs. After: 0 future-dated, max date 2026-08-21, row count unchanged at
  5,232. Backup and full reasoning in
  `docs/future-dated-trades-repair-2026-09-02.md`.

- **#25 was already done** — `parseDate()` rejects any date later than today
  (`d.getTime() > todayUTC`), committed in `8df8c89`. Marked on that evidence.

- **#36 — two wrong diagnoses before the real one.** Recorded so they are not
  repeated:
  1. `npm install --os=linux --cpu=x64 sharp` — a **no-op**. The linux binaries
     are already in `package-lock.json`.
  2. `serverExternalPackages: ['sharp']` — also a **no-op**. sharp is already
     in Next's built-in `server-external-packages.jsonc`. Caught only because
     AGENTS.md requires reading `node_modules/next/dist/docs/` first.
  3. `outputFileTracingIncludes` — deployed, error unchanged. Kept (it is still
     correct for a dlopen-loaded native lib) but it is **not** the fix.

  The real cause: the route already had a try/catch falling back to the
  original image, but `import sharp from 'sharp'` at the **top of the module**
  fails at load time, so the route 500s before `GET` runs and its own fallback
  never fires. Made the import lazy. Verified in production — S000344, P000197,
  O000172, M001165 all return HTTP 200 with real JPEG data.

  **Still open (not a blocker):** sharp still does not load on Vercel, so
  photos serve as the original JPEG rather than a resized webp. Photos work;
  restoring webp is a performance follow-up.

- **#11** marked done on Marc's word that he ran the 50-VU test a few days ago
  and it passed. No artifact committed. Note `load-tests/README.md`'s own
  caveat: edge caching means `load.js` largely measures the CDN, not Supabase.

- **#6 and #14 left open** — manual verifications with no recorded artifact.

- **Launch pulled in to 2026-09-22** (from 2026-10-12) as a result.
