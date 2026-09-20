# civicwatch — agent brief

> **Auto-generated 2026-09-18 07:00 by `projects-dashboard/build-briefs.sh`. Do not edit.**
> Regenerate with the **Project Schedule** shortcut on the Desktop.

**Read this before starting work.** It records what has already been done
and why, so you do not repeat it or undo it. The task notes below are the
real content — several record approaches that were tried and failed.

- **Status:** LIVE (wave 1)
- **Progress:** 40/47 done · 7 open
- **Projected launch:** 2026-10-08

## Already done — do not redo

### #42 Stand up the CivicWatch ad account under the Meta business portfolio
*Completed 2026-09-17.*

Ad account 'CivicWatch' (1652236096483801) created inside the CivicWatch.app
business portfolio (995485309758258) and linked to the existing CivicWatch.app
Page — not a new Page, and deliberately not Marc's unrelated personal ad
account (440418995978843). Meta commercial terms + non-discrimination policy
accepted. Free.

### #43 Check Meta's political-ad rules against real precedent in the Ad Library
*Completed 2026-09-17.*

Answered the 'will Meta call this a political ad' question for $0 using the
public Ad Library instead of waiting on ad spend. Finding: 'Autopilot — copy
politicians' trades' ran at $6K–$7K / 700K–800K impressions with copy
explicitly pushing 'a ban on congressional stock trading' and carried NO
elections/social-issue disclaimer, while real candidate ads in the same
results were removed specifically for a bad social-issue disclaimer. A
directly comparable product cleared as an ordinary commercial ad. Caveat: one
advertiser is precedent, not proof. Full write-up in ~/tools/ad-
pipeline/campaigns/civicwatch-meta-pilot.json.

### #44 Draft the Meta pilot campaign — Traffic, US, $5/day
*Completed 2026-09-17.*

Campaign 'CivicWatch – Political Ad Policy Test' (120254890948070063) drafted:
Auction, Traffic objective, manual setup. Ad set (120254890948060063) targets
United States, 18+, website conversions, highest-volume bid, $5.00/day. Meta
bills only on delivery, so nothing is charged until it actually runs.

### #45 Write the pilot ad copy and pick the creative
*Completed 2026-09-17.*

Three ad-copy variants written and stored in ~/tools/ad-
pipeline/campaigns/civicwatch-meta-pilot.json (A recommended). Every claim
checked against app/pro/page.js: free tier really is $0 with no card and
really does include STOCK Act disclosures, voting records and tracking alerts
— conflict scoring is Pro at $9.99/mo, so no variant implies it is free. Copy
stays factual and names no individual member, keeping clear of Meta's
'Political values and governance' social-issue category. Creative reuses the
2026-09-13 Capitol/flagged-trade image — no new kie.ai spend. The 2026-09-18
image was rejected: it depicts an invented 'Alex Carter, Founder & CEO' with a
fabricated testimonial.

### #37 Decide the GTM basics — objective, ICP, four platforms
*Completed 2026-09-04.*

Decision task, Marc only. Decided 2026-09-04 (asked directly, not assumed):
(1) objective — first paying Pro subscribers; (2) ICP — civic watchdog /
accountability voter (tracks a specific rep's trades for accountability, not
personal investing — conflict-score is the paid proof point, not 'invest like
Congress'); (3) platforms — X, YouTube, Reddit, and Instagram (added
2026-09-04, same day), four rather than the doc's own 'pick two' advice, by
explicit choice. Written into 40-gtm/media-plan.md and 40-gtm/social-media-
plan.md. Unblocked #38-#41 same day.

### #14 Verify Clerk webhook secret, test user.created
*Completed 2026-09-03.*

DONE — verified via Clerk Dashboard > Webhooks > Delivery Stats (last 24h):
SUCCESS-1. Attempt row for 'user.created' dated 2026-09-03 10:07 PM shows
Succeeded against https://www.civicwatch.app/api/webhooks/clerk. Root cause of
prior silent failures was a www-redirect eating deliveries before they reached
the route; fixed, and this delivery is the proof. Signature verification
(CLERK_WEBHOOK_SECRET vs. Clerk's signing secret) happens before the route can
return anything but a signature error, so 'Succeeded' round-trips both halves
of this task at once — no separate secret check needed. Verified by Marc
directly in the Clerk dashboard, reported 2026-09-04.

### #34 Resolve D-001 — which migration directory is authoritative
*Completed 2026-09-03.*

RECONCILED 2026-09-04: gantt had drifted behind 00-governance/decision-log.md.
ADR-003 (dated 2026-09-03, status accepted) resolved D-001 —
supabase/migrations/ made canonical, rebuilt file-by-file from the live
schema_migrations ledger, 25 files 1:1 with the 25-entry live ledger. This
gantt entry was never updated to match; a 2026-09-03 session (see session-
log.md) found the same drift and deliberately left it unfixed pending the real
Project Schedule shortcut. Marked done now on the strength of the accepted
ADR, which is a stronger signal than a stale JSON field.

### #35 Resolve D-002 — move loose docs into the standard structure
*Completed 2026-09-03.*

RECONCILED 2026-09-04: gantt had drifted behind 00-governance/decision-log.md.
ADR-002 (dated 2026-09-03, status accepted) resolved D-002 — loose business
documents moved into the 00- through 70- standard structure in a single
reviewable commit (f28c5d9). This gantt entry was never updated to match.
Marked done now on the strength of the accepted ADR.

## Next up

- **#38 Claim and brand the four social profiles chosen in #37** — 2026-09-17 → 2026-09-18 · GTM — First Customers

  Launch-checklist gate: 'Social profiles claimed and branded consistently'.
  X, YouTube, Reddit, Instagram. Handles per 30-brand/brand.md. Free. STATUS
  2026-09-17: three of four live and connected to the self-hosted Postiz
  instance — Facebook + Instagram (CivicWatch.app), X (@CivicWatchAlert), and
  YouTube (@civicwatchapp, a dedicated Brand Account so CivicWatch never posts
  from Marc's personal channel). Integration ids are in ~/tools/ad-
  pipeline/briefs/civicwatch.json. Still open ONLY because Reddit app creation
  fails on Reddit's side — a documented, months-long platform bug reproduced
  in Safari, automated Chrome and old.reddit.com alike. Not fixable from here;
  reopen if Reddit ships a fix or switch to Devvit.

- **#39 Support channel live with a stated SLA, FAQ for the top 10 questions** — 2026-09-21 → 2026-09-23 · GTM — First Customers

  Launch-checklist gate: 'Support channel live with a stated response SLA' +
  'FAQ / docs cover the top 10 expected questions'. You cannot take money
  without somewhere for a customer to complain. Free — a monitored address and
  a published SLA is enough at this stage.

- **#40 Write and publish the launch post — founder-led, primary platform** — 2026-09-24 → 2026-09-25 · GTM — First Customers

  social-media-plan.md: 'Founder-led, human-first content beats polished
  corporate output.' One post, primary platform (X — real-time reach for the
  accountability angle), pointing at /pro. This is the first task in the whole
  schedule that asks a stranger to look.

- **#41 Submit to Product Hunt, Hacker News, niche directories** — 2026-09-28 → 2026-09-30 · GTM — First Customers

  media-plan.md already names these three rows. Free, and the backlinks
  outlast the launch spike.

- **#6 Test push end-to-end on Chrome + Safari** — 2026-10-01 → 2026-10-02 · Phase 1 Hardening

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

  SAFARI ATTEMPTED 2026-09-04, BLOCKED — NOT a CivicWatch bug:
  PushNotificationToggle.jsx's enable() calls Notification.requestPermission()
  (resolves 'granted', confirmed) -> navigator.serviceWorker.ready (resolves
  with the correct active sw.js registration, confirmed) ->
  registration.pushManager.subscribe(...). subscribe() never resolves or
  rejects on this Mac's Safari; the button hangs in its loading state forever
  with zero error, on a completely clean repro (permission reset via Safari >
  Settings > Websites > Notifications, OS notification settings for Safari all
  correctly enabled, iCloud/Apple ID signed in, macOS fully updated, machine
  rebooted). Console.app shows nothing at all for 'webpushd' or broader 'push'
  filters during a live repro, and Spin Reports / Crash Reports show nothing
  for Safari/WebKit at the time of the hang (only unrelated historical
  Parallels Desktop entries, and Parallels was confirmed not running during
  testing). Applied a legitimate code improvement regardless (commit pending):
  PushNotificationToggle.jsx now pre-resolves navigator.serviceWorker.ready on
  mount instead of inside the click handler, so enable() only has one await
  (requestPermission) before calling subscribe(), tightening the user-
  activation window Safari/WebKit cares about — did not change the outcome,
  ruling out a gesture-timing cause. The exact same subscribe flow (same VAPID
  key, same sw.js, same manifest) works correctly in Chrome on this same
  machine. Root cause is almost certainly a bug in macOS Tahoe 26 Developer
  Beta's webpushd/WebKit push implementation, not application code. Wrote up a
  full repro report for Apple Feedback Assistant (apple-feedback-webpush-
  hang.md) for Marc to file. Chrome is fully done; Safari stays blocked
  pending an Apple fix (or a retest on a non-beta Mac) — do not mark task #6
  done until Safari is independently verified working.

- **#46 Add a payment method and verify the phone on the ad account** — 2026-10-05 → 2026-10-06 · Paid Acquisition — Meta Pilot

  MARC ONLY. Two separate gates: (1) a payment method — Meta reviews and
  delivers nothing without a card on file, there is no free tier of paid ads
  and no workaround, though Meta only charges on delivery so the card can sit
  unused; (2) phone verification, which needs a code sent to his phone and is
  free and doable any time. Deferred in waves.json because (1) waits on money,
  so it must not sit at the front of the daily list looking overdue.


## Open decisions (blocked on Marc)

None open.

---

**Where the source of truth lives.** `70-schedule/gantt-state.json` holds the
tasks and their notes; this brief is a view of it. Mark work done in the Gantt
chart, not here. Governance decisions belong in `00-governance/decision-log.md`,
open questions in `DECISIONS-PENDING.md`, and narrative in
`00-governance/session-log.md`.

## Dev server hangs? Clear `.next` first

2026-09-20: `next dev` served every request in 1-7 **minutes** (one homepage
request logged `application-code: 6.9min`) while `next build` compiled the
whole app in 8 seconds. Cause was a corrupt 1.0 GB `.next` cache, not the
code. `rm -rf .next` fixed it — homepage went 7.1min to 1.06s and reclaimed
1 GB.

Tell-tale sign: a boot error naming a hashed module that no longer resolves,
e.g. `Cannot find module 'require-in-the-middle-<hash>'` from a cached chunk.

Ruled out along the way, so don't re-investigate: the nested Remotion project
at `40-gtm/video/` (676 MB of its own `node_modules` inside the app root) is
**not** the problem — dev is fast with it in place.
