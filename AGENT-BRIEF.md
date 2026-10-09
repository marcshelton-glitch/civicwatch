# civicwatch — agent brief

> **Auto-generated 2026-10-09 15:00 by `projects-dashboard/build-briefs.sh`. Do not edit.**
> Regenerate with the **Project Schedule** shortcut on the Desktop.

**Read this before starting work.** It records what has already been done
and why, so you do not repeat it or undo it. The task notes below are the
real content — several record approaches that were tried and failed.

- **Status:** LIVE (wave 1)
- **Progress:** 47/53 done · 6 open
- **Projected launch:** 2026-10-27

## Already done — do not redo

### #47 Publish the pilot ad and record whether Meta flags it as political
*Completed 2026-10-06.*

DONE 2026-10-06 - RESULT: Meta did NOT flag the ad as political. Published
2026-10-06 ~00:33 local as 'New Traffic Ad - Copy' (copy variant A, Learn
more, all Advantage+ enhancements off); status went In review -> Active by
2026-10-06 18:09 with no rejection and no authorization / 'Paid for by'
demand. Recorded in policyPrecedent.actualResult in ~/tools/ad-
pipeline/campaigns/civicwatch-meta-pilot.json. Caveat: one ad is one data
point. The old errored draft 'New Traffic Ad' was deleted by Marc 2026-10-06;
only the Active copy remains. Marked done by hand-edit under the ADR-005
exception, at Marc's request. Original note: The actual experiment. Draft is
already built in Ads Manager: ad account, campaign, ad set (US / 18+ / $5 a
day), destination URL and a placeholder Capitol image from the Page library
are all saved. Two things still to do by hand, because Meta's creative wizard
hung on its Next button: paste copy variant A (primary text / headline /
description, CTA 'Learn more') from ~/tools/ad-pipeline/campaigns/civicwatch-
meta-pilot.json, and optionally swap the placeholder for the better 2026-09-13
Capitol/flagged-trade creative — Meta's upload button opens a native file
picker that can't be automated. Then publish and watch the review status: a
political/issue classification shows up as a rejection demanding authorization
and a 'Paid for by' disclaimer. Either outcome is the answer worth having;
record it in policyPrecedent.actualResult.

### #48 Lock the CivicWatch AI presenter reference image
*Completed 2026-10-05.*

DONE 2026-10-05 — reference locked. Spokesman is the 'A3' candidate (FLUX.1
Krea via Hugging Face Spaces, seed 244279322, even-key variant), chosen by
Marc for its light-out-of-darkness look. Lapel pin is the real CivicWatch
shield mark composited on (gold rim, navy enamel, silver Capitol) rather than
model-drawn. Saved to ~/Projects/ad-creative/civicwatch/reference.jpg;
presenter.json set to reference_image=reference.jpg, status=reference-locked
(confirmed from Marc's terminal output). Copies of the spokesman and five
additional presenters (distinct looks, all wearing the pin) are in
assets/presenters/. Still open, not part of this task: presenter.json
casting/lighting text still describes the pre-lock spec (late 30s-mid 40s,
plain brass pin). Marked done by hand-edit under the ADR-005 exception, at
Marc's request. Spec lives at ~/Projects/ad-creative/civicwatch/presenter.json
(built 2026-09-20 from the reel Marc sent). Run `./lib/build-prompt.py
civicwatch --sheet`, generate four variants, pick the least synthetic-looking
one, save it as civicwatch/reference.jpg, then set reference_image and flip
status to reference-locked. The JSON alone will NOT hold the face steady
across sessions — the saved image is the actual consistency mechanism, and
every later generation attaches it as image 1. DELIBERATELY POST-LAUNCH: this
feeds ORGANIC short-form (X / Instagram / YouTube via ~/tools/ad-
pipeline/publish.mjs), not the Meta pilot. #45 already chose the pilot
creative, and #47 is a political-classification experiment — swapping in a
synthetic presenter would change the variable being tested. Moved 2026-09-21
from 10-09 to 10-01, taking the slot from #6 (which waves.json already lists
as deferred). Rationale: landing the presenter BEFORE launch on 10-08 means
presenter-led organic can run during launch week instead of starting after it.
It still does not touch the Meta pilot. NON-NEGOTIABLE ON PUBLISH: persistent
'AI presenter - data from public STOCK Act filings' lower-third for the full
duration, platform AI-content flag set on upload, and the claims block in
presenter.json respected — narrator only, never a user or testimonial. For
this audience an unlabelled synthetic presenter would discredit the product's
whole premise. Collapsed 2026-09-21: build-prompt.py now reads ~/tools/ad-
pipeline/briefs/civicwatch.json for ICP, angle and brand voice, so
presenter.json holds appearance and claim limits only. Chain is brief +
presenter + scene -> build-prompt.py -> generate.mjs -> publish.mjs.

### #46 Add a payment method and verify the phone on the ad account
*Completed 2026-10-05.*

MARC ONLY. Two separate gates: (1) a payment method — Meta reviews and
delivers nothing without a card on file, there is no free tier of paid ads and
no workaround, though Meta only charges on delivery so the card can sit
unused; (2) phone verification, which needs a code sent to his phone and is
free and doable any time. Deferred in waves.json because (1) waits on money,
so it must not sit at the front of the daily list looking overdue.

### #40 Write and publish the launch post — founder-led, primary platform
*Completed 2026-09-22.*

DONE 2026-09-22 (two days early). Posted from @CivicWatchAlert:
https://x.com/CivicWatchAlert/status/2102517338298007802 — one founder-voice
post pointing at civicwatch.app/pro, link card renders. Text and revision
notes in 40-gtm/launch-post-x.md (the Sep 4 6-post thread was cut to one post,
'and votes' and 'no other tracker does this' removed as unverified).
Prerequisite fix shipped first: app/pro/layout.js meta/OG/Twitter descriptions
still sold alerts and local lookup as Pro, contradicting ADR-004; corrected in
commit 86a342c, Vercel READY, live tags verified before posting. Marked done
by hand-edit under the ADR-005 exception (shortcut completion pipeline still
does not persist), at Marc's request.

### #6 Test push end-to-end on Chrome + Safari
*Completed 2026-09-22.*

DONE 2026-09-22 — both browsers verified end-to-end. SAFARI (2026-09-22):
after Marc updated macOS to Tahoe 26.7.1, the 2026-09-04 hang
(pushManager.subscribe() never resolving on the 26 Developer Beta) is gone —
'Enable alerts' flipped to 'Alerts on' immediately, a new web.push.apple.com
row for user_3CYyW20bfR44ZBoNUj3KG1v5kZB landed in push_subscriptions at 23:13
UTC, POST /api/push/send returned {"sent":2,"stale_pruned":0} (Safari + Chrome
subs), and Marc confirmed 'CivicWatch test — Safari' from www.civicwatch.app
in macOS Notification Center. Confirms the Safari block was the OS beta, not
app code; apple-feedback-webpush-hang.md no longer needs filing. As with
Chrome, it arrived without a banner — a macOS notification display-style
setting, not a pipeline defect. CHROME (2026-09-03): verified after commit
a65c2a9 added /api/push/send to proxy.ts's isPublicRoute matcher (the earlier
401 was Clerk middleware, not INTERNAL_API_SECRET). Full chain subscribe ->
Supabase -> /api/push/send -> FCM/APNs -> service worker -> OS notification
works on both. Marked done by hand-edit under the ADR-005 exception, at Marc's
request.

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

## Next up

- **#53 Confirm the Gemini API key is on a billed Google AI Studio project, before Show HN and Product Hunt traffic** — 2026-10-09 → 2026-10-12 · P0 Launch Blockers

  Added 2026-10-09 from DECISIONS-PENDING D-005 (step 0). About five minutes.
  In Google AI Studio, open the project behind GOOGLE_AI_API_KEY and check it
  has billing enabled. A free-tier key shares one ~1,500 requests/day pool
  across the whole app, so an HN or Product Hunt spike would make paying Pro
  users see 'AI analysis failed'. Paid-tier cost is pennies: a full report is
  about $0.003 and the per-user 50k tokens/day cap bounds a maxed-out Pro user
  at about $2/mo. Does NOT include the per-rep cache (D-005 option A), which
  is post-launch. Marc adds the card himself; Claude does not handle payment
  details. Ordered first in waves.json so it lands before #49 (Show HN,
  10-13); once ticked done, rebaseline gives the two workdays back.

- **#41 Submit to Product Hunt, Hacker News, niche directories** — 2026-10-13 → 2026-10-14 · GTM — First Customers

  Close-out: done when Show HN and Product Hunt are live and the Civic Tech
  Field Guide listing is confirmed, with links recorded. Civic Tech Field
  Guide submitted 2026-10-05 (in review); awesome lists skipped; Indie Hackers
  split to its own task. Tick media-plan.md Directories rows at close.
  Rescheduled 2026-10-07: end moved to Oct 14 because it closes only when Show
  HN (Oct 13) and Product Hunt (Oct 14) are live. Progress 2026-10-09: Civic
  Tech Field Guide listing confirmed LIVE (Active, links to civicwatch.app;
  found via https://app.civictech.guide/?search=civicwatch). media-plan.md row
  ticked. Remaining: Show HN live (#49, Oct 13) and Product Hunt live (#50,
  Oct 15), then record links and close.

- **#49 Submit the Show HN post** — 2026-10-15 → 2026-10-16 · GTM — First Customers

  Scheduled prep task opens the prefilled HN submit page Oct 13 8:00 AM PT;
  Marc presses Submit and posts the first comment. Done = live HN link
  recorded. Packet: 40-gtm/show-hn-packet.md. Rescheduled 2026-10-07: window
  was Oct 9-12, but the submit-prep scheduled task fires Oct 13 8:00 AM PT, so
  Oct 13 is the real date.

- **#50 Launch on Product Hunt** — 2026-10-19 → 2026-10-20 · GTM — First Customers

  Day after Show HN. Needs maker account, Upcoming page, early commenter,
  gallery in 40-gtm/producthunt/. Marc present for the first hours. Done =
  live PH link recorded. Rescheduled 2026-10-07: moved to Oct 14 (day after
  Show HN on Oct 13). Progress 2026-10-07: Marc created his Product Hunt maker
  account (signed in, shield avatar showing). Still to do: confirm
  username/headline saved, start the launch draft, line up one early
  commenter. Open question: Oct 14 may be crowded (Google Cloud Run hackathon
  launches that day); Oct 15 is the fallback if Marc wants it. Date left at
  Oct 14 until Marc decides. Decision 2026-10-08: Marc chose Oct 15 (avoids
  Oct 14 Google Cloud Run hackathon crowd). Launch draft complete through
  Launch checklist (required 100%); not yet scheduled.

- **#51 Publish the Indie Hackers launch post once posting unlocks** — 2026-10-21 → 2026-10-22 · GTM — First Customers

  Blocked by Indie Hackers new-account posting limit; the daily comment-
  prompts task works toward unlocking it. Draft: 40-gtm/indiehackers-post.md.
  Does not gate #41. No hard date.

- **#52 Produce the video ad concepts for organic launch week (Concept 2 first, labeled presenter cut second)** — 2026-10-23 → 2026-10-27 · GTM — First Customers

  Added 2026-10-08. See '## Video ad concepts' in 40-gtm/media-plan.md. $0,
  organic channels only; anything paid needs the exact cost told to Marc
  first. Build Concept 2 (Capitol motion graphics, Remotion, real screenshots)
  first for the Product Hunt gallery, Show HN and press kit. Then Concept 1
  (presenter A3) for launch week Oct 13-16. NON-NEGOTIABLE on publish:
  persistent 'AI presenter - data from public STOCK Act filings' lower-third,
  platform AI-content flag, narrator only, real screenshots only, conflict
  score described as an indicator not proof, verify the 13,100+ figure on the
  live site. Does not touch the Meta pilot. Dates are a proposal; move them if
  the Show HN / Product Hunt prep needs the days. PROGRESS 2026-10-09: five
  cuts rendered in 40-gtm/video/concept2/ (Concept 1 presenter 9:16, Concept 2
  Capitol 16:9, Concept 3 cast 9:16, Concept 4 spotlight 9:16 and 16:9),
  silent, $0. Not yet posted. Remaining: review each cut against the labeling
  rules in media-plan.md, set the platform AI-content flag on upload, re-check
  the 13,100+ figure the day of posting.


## Open decisions (blocked on Marc)

- D-005 · Cache AI reports per representative, and is the Gemini key on a billed project?
- D-004 · The live Terms name "CivicWatch LLC" — does it exist, and if not, whose name goes on them?

**Agents may never fill in a `Decision:` field.** Research and
recommend; Marc decides.

## Recent commits

```
7f954ef Fix accusatory social and media-card copy; re-export kit with the shield
f841e84 Add privacy/terms gap review and open D-004 (does CivicWatch LLC exist)
6dcd76b Align privacy policy and terms with what the code does
d8eed97 docs: daily CivicWatch.md update — Oct 8 bioguide backfill confirmation
c7a85a8 chore: commit video ad concept renders, ad source assets and regenerated schedule/briefs
a801235 feat(gtm): add video ad concepts to media plan; add Gantt #52
250e1b1 fix(auth): make /support public so signed-out visitors can reach it
e30f636 chore(schedule): regenerate brief and gantt after #48 completion (45/48)
```

---

**Where the source of truth lives.** `70-schedule/gantt-state.json` holds the
tasks and their notes; this brief is a view of it. Mark work done in the Gantt
chart, not here. Governance decisions belong in `00-governance/decision-log.md`,
open questions in `DECISIONS-PENDING.md`, and narrative in
`00-governance/session-log.md`.
