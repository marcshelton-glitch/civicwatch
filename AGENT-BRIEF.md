# civicwatch — agent brief

> **Auto-generated 2026-09-04 07:00 by `projects-dashboard/build-briefs.sh`. Do not edit.**
> Regenerate with the **Project Schedule** shortcut on the Desktop.

**Read this before starting work.** It records what has already been done
and why, so you do not repeat it or undo it. The task notes below are the
real content — several record approaches that were tried and failed.

- **Status:** LIVE (wave 1)
- **Progress:** 32/36 done · 4 open
- **Projected launch:** 2026-09-22

## Already done — do not redo

### #21 Run one real-card checkout end to end
*Completed 2026-09-02.*

DONE 2026-09-02. Marc subscribed to Pro with his real business card and
confirmed previously-paywalled sections unlocked. Verified independently, not
just on his report: Vercel runtime logs for prj_T6SQqXCl3dlHsmHdfptW7fQJTl2t
show `POST /api/webhooks/stripe 200` at 2026-09-03T05:27:40Z logging '✅ Pro
activated for a new subscriber' — the checkout.session.completed handler in
app/api/webhooks/stripe/route.js ran and set
isPro/tier/stripeCustomerId/stripeSubscriptionId on the Clerk user. Found in
passing, not yet fixed: the same log window also shows repeated `400 Webhook
signature verification failed: No signatures found matching...` for the
identical events. Root cause via Stripe API (GetWebhookEndpoints on
acct_1TJO7aPe8la2Z0hh): TWO live, enabled webhook endpoints exist —
we_1TNjdLPe8la2Z0hhfGoeZEqE at https://www.civicwatch.app/api/webhooks/stripe
(current, correct) and a stale we_1TLcoxPe8la2Z0hhpLoWB1kp at
https://civicwatch-six.vercel.app/api/webhooks/stripe (created earlier, still
subscribed to the legacy invoice.payment_succeeded event name rather than
invoice.paid). Both domains resolve to the same Vercel project/code, but each
Stripe endpoint has its own signing secret and the app only reads one
STRIPE_WEBHOOK_SECRET, so every event Stripe fires to the stale endpoint fails
signature verification — harmless today (the correct endpoint still gets its
copy and succeeds) but it is pure noise in error logs and a landmine if that
URL is ever repointed. Recommend deleting we_1TLcoxPe8la2Z0hhpLoWB1kp; left
undone pending Marc's go-ahead since removing a Stripe webhook endpoint is an
account-settings change.

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

## Next up

- **#14 Verify Clerk webhook secret, test user.created** — 2026-09-04 → 2026-09-07 · Phase 1 Hardening
- **#6 Test push end-to-end on Chrome + Safari** — 2026-09-08 → 2026-09-09 · Phase 1 Hardening

  Reverted from a prior 'done' mark (which was based on Marc's word alone, no
  artifact) after this session's own live test contradicted it: Chrome
  subscription confirmed working end-to-end, but /api/push/send returned 401
  Unauthorized. INITIAL SUSPICION WAS WRONG: hours were spent on
  INTERNAL_API_SECRET mismatch theory (rotating it, re-saving via Vercel
  dashboard and CLI three different ways) before finding the real cause via
  curl -si response headers (x-clerk-auth-reason: token-invalid, x-clerk-auth-
  status: signed-out) — /api/push/send was simply missing from proxy.ts's
  isPublicRoute matcher, so Clerk middleware rejected every call before the
  route's own checkAuth() ever ran, same bug class already fixed twice
  elsewhere in that file. Fixed in commit a65c2a9 (2026-09-03), deployed, and
  verified live: POST /api/push/send returned {"sent":1,"stale_pruned":0}.

  CHROME HALF NOW FULLY VERIFIED (2026-09-03): no OS banner appeared, which
  looked like a fresh bug, but Marc found the notification sitting correctly
  in macOS Notification Center ('CivicWatch test — Push pipeline check —
  Chrome (task #6)'). Confirmed via live browser inspection during this
  session that this is not a delivery problem: Notification.permission is
  'granted', the active service worker is the correct sw.js, and its
  pushManager subscription endpoint matches byte-for-byte the
  push_subscriptions row the server just sent to. The full chain (subscribe ->
  Supabase -> /api/push/send -> FCM -> service worker -> OS notification)
  works end-to-end on Chrome. The missing banner is a macOS/Chrome
  notification *display-style* setting (System Settings -> Notifications ->
  Google Chrome, or Focus/DND), not a code or pipeline defect — worth Marc
  fixing for UX but not a blocker for this task.

  STILL OPEN: Safari has not been attempted at all — no Safari automation tool
  available, requires Marc at the keyboard (visit the site in Safari, sign in,
  enable alerts, trigger/receive a test push).

- **#34 Resolve D-001 — which migration directory is authoritative** — 2026-09-10 → 2026-09-14 · Standard Adoption
- **#35 Resolve D-002 — move loose docs into the standard structure** — 2026-09-15 → 2026-09-22 · Standard Adoption

## Open decisions (blocked on Marc)

None open.

## Recent commits

```
36ce3a0 docs(gantt): correct task #6 note now that push pipeline is fixed
a65c2a9 fix(push): add /api/push/send to Clerk isPublicRoute matcher
6fc999c Resolve D-003 (conflict-score Pro gate), fix dashboard default-rep bug, revert premature #6 done-mark
98bbd85 docs: daily CivicWatch.md update — 2026-09-03 sessions
308a590 Move fd_net_worth bioguide_id backfill to db/backfills/; restore #35 note in AGENTS.md
43797ee Rename to real applied timestamp 20260820234518 (D-001 reconciliation)
b67a8f5 Rename to real applied timestamp 20260709042408 (D-001 reconciliation)
e7e0ab1 Rename to real applied timestamp 20260630230502, content corrected to match ground truth (D-001 reconciliation)
```

---

**Where the source of truth lives.** `70-schedule/gantt-state.json` holds the
tasks and their notes; this brief is a view of it. Mark work done in the Gantt
chart, not here. Governance decisions belong in `00-governance/decision-log.md`,
open questions in `DECISIONS-PENDING.md`, and narrative in
`00-governance/session-log.md`.
