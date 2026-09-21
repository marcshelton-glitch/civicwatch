# civicwatch — agent brief

> **Auto-generated 2026-09-21 16:24 by `projects-dashboard/build-briefs.sh`. Do not edit.**
> Regenerate with the **Project Schedule** shortcut on the Desktop.

**Read this before starting work.** It records what has already been done
and why, so you do not repeat it or undo it. The task notes below are the
real content — several record approaches that were tried and failed.

- **Status:** LIVE (wave 1)
- **Progress:** 41/48 done · 7 open
- **Projected launch:** 2026-10-08

## Already done — do not redo

### #38 Claim and brand the four social profiles chosen in #37
*Completed 2026-09-21.*

DONE 2026-09-21 — closed at three of four platforms; Reddit dropped as an
owned channel by Marc's decision 2026-09-21. Live and connected to the self-
hosted Postiz instance since 2026-09-13/14: Facebook + Instagram
(CivicWatch.app), X (@CivicWatchAlert), and YouTube (@civicwatchapp, a
dedicated Brand Account so CivicWatch never posts from Marc's personal
channel). Integration ids are in ~/tools/ad-pipeline/briefs/civicwatch.json.
WHY REDDIT WAS DROPPED: Reddit's own app-creation flow silently fails — a
documented, months-long platform bug reproduced in Safari, automated Chrome
and old.reddit.com alike. Not fixable from our side, no ETA, and leaving the
task open parked a permanently-overdue item at the top of TODAY.md, which
waves.json explicitly warns against. This reverses the four-platform choice
made in #37 on 2026-09-04; the reversal is recorded in 40-gtm/social-media-
plan.md so a future pass doesn't quietly restore it. SCOPE OF THE DROP — READ
THIS BEFORE 'FIXING' IT: only the OWNED, branded, API-integrated Reddit
channel is dropped. Manual participation in subreddits at launch
(r/SideProject, r/OpenGovernment et al., per 40-gtm/launch-submissions-
draft.md and task #41) is unaffected — that needs no app, no API and no
integration, and the 90/10 participate-don't-broadcast rule still applies.
Reopen the owned channel only if Reddit ships a fix or we switch to Devvit.

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

## Next up

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

- **#48 Lock the CivicWatch AI presenter reference image** — 2026-10-01 → 2026-10-01 · Brand & Content

  Spec lives at ~/Projects/ad-creative/civicwatch/presenter.json (built
  2026-09-20 from the reel Marc sent). Run `./lib/build-prompt.py civicwatch
  --sheet`, generate four variants, pick the least synthetic-looking one, save
  it as civicwatch/reference.jpg, then set reference_image and flip status to
  reference-locked. The JSON alone will NOT hold the face steady across
  sessions — the saved image is the actual consistency mechanism, and every
  later generation attaches it as image 1. DELIBERATELY POST-LAUNCH: this
  feeds ORGANIC short-form (X / Instagram / YouTube via ~/tools/ad-
  pipeline/publish.mjs), not the Meta pilot. #45 already chose the pilot
  creative, and #47 is a political-classification experiment — swapping in a
  synthetic presenter would change the variable being tested. Moved 2026-09-21
  from 10-09 to 10-01, taking the slot from #6 (which waves.json already lists
  as deferred). Rationale: landing the presenter BEFORE launch on 10-08 means
  presenter-led organic can run during launch week instead of starting after
  it. It still does not touch the Meta pilot. NON-NEGOTIABLE ON PUBLISH:
  persistent 'AI presenter - data from public STOCK Act filings' lower-third
  for the full duration, platform AI-content flag set on upload, and the
  claims block in presenter.json respected — narrator only, never a user or
  testimonial. For this audience an unlabelled synthetic presenter would
  discredit the product's whole premise. Collapsed 2026-09-21: build-prompt.py
  now reads ~/tools/ad-pipeline/briefs/civicwatch.json for ICP, angle and
  brand voice, so presenter.json holds appearance and claim limits only. Chain
  is brief + presenter + scene -> build-prompt.py -> generate.mjs ->
  publish.mjs.

- **#46 Add a payment method and verify the phone on the ad account** — 2026-10-05 → 2026-10-06 · Paid Acquisition — Meta Pilot

  MARC ONLY. Two separate gates: (1) a payment method — Meta reviews and
  delivers nothing without a card on file, there is no free tier of paid ads
  and no workaround, though Meta only charges on delivery so the card can sit
  unused; (2) phone verification, which needs a code sent to his phone and is
  free and doable any time. Deferred in waves.json because (1) waits on money,
  so it must not sit at the front of the daily list looking overdue.

- **#47 Publish the pilot ad and record whether Meta flags it as political** — 2026-10-07 → 2026-10-08 · Paid Acquisition — Meta Pilot

  The actual experiment. Draft is already built in Ads Manager: ad account,
  campaign, ad set (US / 18+ / $5 a day), destination URL and a placeholder
  Capitol image from the Page library are all saved. Two things still to do by
  hand, because Meta's creative wizard hung on its Next button: paste copy
  variant A (primary text / headline / description, CTA 'Learn more') from
  ~/tools/ad-pipeline/campaigns/civicwatch-meta-pilot.json, and optionally
  swap the placeholder for the better 2026-09-13 Capitol/flagged-trade
  creative — Meta's upload button opens a native file picker that can't be
  automated. Then publish and watch the review status: a political/issue
  classification shows up as a rejection demanding authorization and a 'Paid
  for by' disclaimer. Either outcome is the answer worth having; record it in
  policyPrecedent.actualResult.


## Open decisions (blocked on Marc)

None open.

## Recent commits

```
cee845e docs: daily CivicWatch.md update — Sept 21, 2026 (privacy, accessibility, launch prep)
3a33c59 feat(gtm): support channel, contact-email migration and launch prep
2dee477 docs(legal): reconcile the compliance checklist against shipped code
643f903 fix(a11y): pre-launch accessibility pass
f055096 feat(privacy): self-serve data export
6c88061 fix(privacy): gate all trackers behind consent and disclose them
682f866 docs: daily CivicWatch.md update — push fix, bioguide backfill, /pro messaging rewrite, GTM prep
766cc68 docs: daily CivicWatch.md update (September 4, 2026)
```

---

**Where the source of truth lives.** `70-schedule/gantt-state.json` holds the
tasks and their notes; this brief is a view of it. Mark work done in the Gantt
chart, not here. Governance decisions belong in `00-governance/decision-log.md`,
open questions in `DECISIONS-PENDING.md`, and narrative in
`00-governance/session-log.md`.
