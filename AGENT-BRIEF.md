# civicwatch — agent brief

> **Auto-generated 2026-09-02 22:04 by `projects-dashboard/build-briefs.sh`. Do not edit.**
> Regenerate with the **Project Schedule** shortcut on the Desktop.

**Read this before starting work.** It records what has already been done
and why, so you do not repeat it or undo it. The task notes below are the
real content — several record approaches that were tried and failed.

- **Status:** LIVE (wave 1)
- **Progress:** 31/36 done · 5 open
- **Projected launch:** 2026-09-22

## Already done — do not redo

### #24 Purge/repair 27 future-dated trades
*Completed 2026-09-02.*

DONE 2026-09-02. 29 rows (not 27 — two more had been ingested) had a future
transaction_date, latest 2030-10-15, all from one 2026-08-27 batch. Repaired
by setting transaction_date = NULL, not by deleting the rows and not by
guessing a correction: the trades are real filings with doc_ids, only the date
was wrong, and NULL is exactly what the fixed parser (#25) now produces for
these inputs. Verified after: 0 future-dated, max date 2026-08-21, row count
unchanged at 5,232. Full pre-repair backup and reasoning in docs/future-dated-
trades-repair-2026-09-02.md.

### #25 Fix the ingest date parser
*Completed 2026-09-02.*

DONE — verified in HEAD (commit 8df8c89). parseDate() in scripts/ingest-
disclosures.mjs now rejects any date later than today: `if (d.getTime() >
todayUTC) return null`. The code's own comment names the bug: the old guard
only rejected years past 2030, which itself became a future date once the
calendar caught up. Also rejects UTC rollover dates (Feb 30) and pre-2000 bond
maturity dates.

### #36 Fix sharp on Vercel — rep photos 500 on every request
*Completed 2026-09-02.*

DONE 2026-09-02. Verified in production: S000344, P000197, O000172 and M001165
all return HTTP 200 with real JPEG data (was HTTP 500 on every request, ~1,858
errors in 4 days).

ROOT CAUSE was not the bundler. The route already had a try/catch that falls
back to the original image when sharp fails -- it never ran, because `import
sharp from 'sharp'` at the TOP of the module fails at module-load time,
killing the route before GET is entered. Fixed by importing sharp lazily
inside the try.

TWO WRONG DIAGNOSES, recorded so nobody repeats them: (1) `npm install
--os=linux --cpu=x64 sharp` is a no-op -- the linux binaries are already in
package-lock.json. (2) `serverExternalPackages: ['sharp']` is also a no-op --
sharp is already in Next's built-in server-external-packages.jsonc.
outputFileTracingIncludes was deployed and did NOT fix it either; it was kept
because it is still correct for a dlopen-loaded native lib, but it is not the
fix.

REMAINING (not a blocker): sharp still does not load on Vercel, so photos
serve as original JPEG rather than resized webp -- larger payloads, no 200x200
resize. Photos work; this is a performance follow-up, not a bug.

### #11 Run K6 load test at 50 VUs
*Completed 2026-09-02.*

DONE — Marc ran the 50-VU test a few days before 2026-09-02 and reports it
passed. Recorded on his confirmation; no run artifact was committed. Note
load-tests/README.md's own caveat: most routes sit behind Vercel edge caching,
so load.js largely measures the CDN rather than Supabase. stress-networth.js
is the test that actually reaches the database, and it needs a fresh Clerk Pro
token or it measures nothing.

### #23 Backfill bioguide_id on fd_trades (5,076 rows)
*Completed 2026-09-01.*

DONE 2026-09-01. Verified against the live database, not just the doc:
fd_trades has 5,232 rows, 5,034 with bioguide_id (96.2%), up from 47.5% in
August. docs/bioguide-backfill-2026-08-26.md records 'Status: APPLIED
2026-09-01' and the session log describes all 31/31 pairs landing, including
12 that needed re-running once it was found the live column stores
state+district ('CA14') not a bare state code. The 198 rows still null are the
long tail (1-2 trades each) that the task explicitly scoped OUT; they are a
future run, not unfinished work here.

### #32 Rewrite /pro around what actually works
*Completed 2026-09-01.*

Promoted Trade Conflict Analysis off Coming Soon (backfill applied same
session, coverage 93.4%->96.3%); moved Track/Alerts and state-local lookup to
Free copy since neither is actually Pro-gated server-side (see DECISIONS-
PENDING.md D-003). See 00-governance/session-log.md, 2026-09-01 entry.

### #26 Automate ingest off local Mac
*Completed 2026-08-30.*

Shipped ahead of its listed dependency (task 25, still pending) — the
scheduling work turned out to be independent of the date-parser bug. Two
GitHub Actions workflows (.github/workflows/ingest-house.yml every 6h, ingest-
senate.yml daily) replace ingest-loop.sh/ingest-senate-loop.sh; both call the
existing scripts/ingest-*.mjs unchanged, writing to Supabase directly.
Verified live, not just committed: House workflow has 20 recorded runs
(scheduled runs completing in 15–22s, draining the unprocessed-rows backlog as
designed), Senate has 9 (task 27's note has senate_trades=7,164 /
senate_net_worth=83 rows from this same pipeline). See docs/automate-
ingest-2026-08-26.md. Also closed a follow-up from that doc while verifying:
package-lock.json now resolves playwright cleanly (npm ci --dry-run), so
ingest-senate.yml's dependency-install step was switched back from npm install
to npm ci; package.json's ingest:index/trades/networth scripts were pointed at
the real scripts/ingest-disclosures.mjs filename (they'd been referencing a
.js path that doesn't exist — unused by the workflows, which call the script
directly, but broken for anyone running npm run ingest:* by hand). Not done:
task 24 (future-dated trades) and task 25 (date parser) remain open, unrelated
data-quality issues — automation moving the ingest off the Mac doesn't require
fixing what the ingest parses.

### #27 Senate ingest — senate_trades and senate_net_worth are empty
*Completed 2026-08-30.*

Root cause was two-layered: (1) raw fetch() was WAF-blocked by
efdsearch.senate.gov almost 100% of the time — fixed with a real Playwright
browser session (scripts/lib/senate-efd-browser.mjs); (2) the site had also
been redesigned (5-column search rows, no more data.json API, PDFs replaced by
HTML tables) — fixed with scrapeReportTables()/computeNetWorth(). Verified via
direct Supabase query, not just a green Action run: senate_trades=7,164 rows,
senate_net_worth=83 rows. See docs/senate-waf-2026-08-29.md. A full backlog
catch-up run (limits raised to 2000) was in progress as of this checkmark.

## Next up

- **#21 Run one real-card checkout end to end** — 2026-09-02 → 2026-09-03 · P0 Launch Blockers
- **#14 Verify Clerk webhook secret, test user.created** — 2026-09-04 → 2026-09-07 · Phase 1 Hardening
- **#6 Test push end-to-end on Chrome + Safari** — 2026-09-08 → 2026-09-09 · Phase 1 Hardening
- **#34 Resolve D-001 — which migration directory is authoritative** — 2026-09-10 → 2026-09-14 · Standard Adoption
- **#35 Resolve D-002 — move loose docs into the standard structure** — 2026-09-15 → 2026-09-22 · Standard Adoption

## Open decisions (blocked on Marc)

- D-003 · Four Pro-tier features have no server-side Pro gate — enforce it, or keep them free?
- D-002 · Move the loose business documents into the standard structure?
- D-001 · Which migration directory is authoritative — `migrations/` or `supabase/migrations/`?

**Agents may never fill in a `Decision:` field.** Research and
recommend; Marc decides.

## Recent commits

```
907e6f0 Add AGENT-BRIEF.md so the next agent knows what was already done
d2bab27 Fix #36 properly: load sharp lazily so the route's fallback can run
81abc80 Fix #24 future-dated trades and #36 sharp; mark #11 and #25 done
75f9798 Mark #23 done — bioguide_id backfill verified against the live database
0c8c7c5 Chart: deep links and a working task panel over file://
37c2de1 content: rewrite /pro around verified feature reality; apply bioguide backfill
f1fa321 Add the Remotion clip pipeline for social video
c731ea3 Refresh schedule export timestamps
```

---

**Where the source of truth lives.** `70-schedule/gantt-state.json` holds the
tasks and their notes; this brief is a view of it. Mark work done in the Gantt
chart, not here. Governance decisions belong in `00-governance/decision-log.md`,
open questions in `DECISIONS-PENDING.md`, and narrative in
`00-governance/session-log.md`.
