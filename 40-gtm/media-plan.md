---
doc: media-plan
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-10-08
review_cadence: 90d
gantt_tasks: [41, 47, 49, 50, 51, 52]
---

# Media Plan — civicwatch

Paid and earned media. Organic social lives in `social-media-plan.md`.

## Objective
**First paying Pro subscribers.** Decided 2026-09-04 (gantt #37, Marc's call —
not lead gen, not awareness for its own sake). Every GTM task should be judged
against whether it points a stranger at `/pro` and gets them to convert, not
whether it grows follower count or free signups.

Launch target: **2026-10-16**. **Standing rule (Marc, 2026-10-08): $0 budget. Nothing that costs money is started, resumed or enabled without telling Marc the exact cost first and getting a yes.** Free earned channels only until revenue exists.

## Paid channels

| Channel | Budget/mo | Target CPA | Audience | Creative | Status |
|---|---|---|---|---|---|
| Meta (Facebook + Instagram) — "CivicWatch – Political Ad Policy Test" | Cap $5/day (about $150 if it runs all month); billed only on delivery | Not set. Set after the pilot returns click and signup data | US, 18+, Traffic objective | Copy variant A; Capitol / flagged-trade image from 2026-09-13 | **PAUSED 2026-10-08 by Marc's request (out of funds).** Was active 2026-10-06 to 2026-10-08 (gantt #47). Meta did not flag it as political, no "Paid for by" demand. One ad is one data point, not proof |
| TikTok | $0 | n/a | n/a | n/a | Not chosen. Pixel is installed but there is no channel plan (see `social-media-plan.md`) |

**Before spending anything beyond the pilot:** conversion tracking must be
verified working end to end. Spending into broken attribution is how budgets
vanish with nothing learned. Gate this in the launch checklist.

Tracking status (from `docs/conversion-tracking-audit-2026-08-29.md`):
- Done: Meta and TikTok pixels load; a Purchase event ($9.99) dispatches from production.
- Not done: confirm receipt in Meta Events Manager → Test Events (needs your login).
- Known gap: client-side pixel only, no Conversions API, so ad blockers and Safari/Firefox will undercount.
- Consequence: the pilot is a Traffic test. Do not switch to a conversion objective or raise spend until Test Events is checked.

## Earned media
- **Target outlets / newsletters / podcasts:** GovTrack Insider, The Fulcrum, Democracy Docket (govtech / civic-accountability press). Pitch only after there is real usage data to cite. Not before Oct 16.
- **The angle:** "Did my representative trade in a way that looks like a conflict?" A tool that answers it from public filings with the same mechanical rule for every member, no party input. Audience cares about checking their own rep, not about copying trades.
- **Press kit:** `app/press` page is live. `assets/press/` has not been created yet. Gallery screenshots and logo are in `40-gtm/producthunt/`.

## Directories & launch platforms

| Platform | Submitted | Live | Backlink |
|---|---|---|---|
| Product Hunt | ☐ planned Oct 15 (#50), chosen by Marc 2026-10-08 to avoid the Oct 14 Cloud Run hackathon crowd. Maker account created 2026-10-07; launch draft complete, not yet scheduled | ☐ | |
| Hacker News | ☐ planned Oct 13, 8:00 AM PT (#49) | ☐ | |
| Civic Tech Field Guide | ☑ 2026-10-05, in review | ☐ | |
| Indie Hackers | ☑ profile + product section live 2026-10-05; launch post blocked by new-account limit (#51) | ☐ post | ☑ profile link |
| "Awesome" GitHub lists | Skipped 2026-10-05 (no fit; repo has no LICENSE or real README). Revisit only if that changes | n/a | n/a |
| G2 / Capterra / AI-tool directories | Skipped by design (see `launch-submissions-draft.md`) | n/a | n/a |

## Launch sequence

| Date | Step | Owner | Source |
|---|---|---|---|
| Oct 7–12 | Product Hunt prep: maker account (done 2026-10-07), Upcoming page, one early commenter lined up, gallery in `producthunt/gallery/` | Marc | `launch-submissions-draft.md` |
| Oct 13, 8:00 AM PT | Show HN. The scheduled task opens the prefilled submit page. Marc submits and posts the first comment right away. Pre-flight checklist runs first; be free 2–3 hours to reply | Marc | `show-hn-packet.md` |
| Oct 15 | Product Hunt launch. Marc present for the first hours; ask for feedback, never upvotes | Marc | `launch-submissions-draft.md` |
| Oct 16 | Indie Hackers post, if posting has unlocked. No hard date | Marc | `indiehackers-post.md` |
| Oct 16 | Launch date. Review traffic and `/pro` conversions at 24h and 48h | Marc | `launch-checklist.md` |

## Creative assets
- Product Hunt gallery (7 screenshots, 2540×1520) and 1024 square logo: `40-gtm/producthunt/`
- Social launch kit: `40-gtm/social-launch-kit/`
- Vertical data-card clips (Remotion, $0 per render): `40-gtm/video/out/`. They name real members and make claims about their finances; read the README warning before posting any.
- Launch post copy: `launch-post-x.md`, `show-hn-packet.md`, `indiehackers-post.md`
- Every asset must comply with `30-brand/brand.md`. Never use `#C9A227` gold on white; use `#A8851A`.
- Rule from the ad pilot: no invented people or fabricated testimonials. The 2026-09-18 image was rejected for exactly this.

## Video ad concepts
Two 10-second concepts from the ChatGPT outline (storyboards and cast images in `civicwatch_ads/`), adapted to this plan on 2026-10-08. Gantt #52. **Organic channels only (X, Instagram, YouTube Shorts). $0.** Any paid placement needs the exact cost told to Marc first and a yes. The Meta pilot creative is not changed.

| Cut | Format | Where it runs | Cost |
|---|---|---|---|
| Concept 2: Capitol motion graphics, real screenshots, no presenter | 16:9, 10s | Product Hunt gallery, Show HN, press kit | $0 per render |
| Concept 1: AI presenter A3 | 9:16, 10s | Organic social, launch week Oct 13–16, pointing to `/pro` | $0 |
| Concept 3: cast slideshow, three AI presenters | 9:16, 10s | Organic social, pointing to civicwatch.app | $0 |
| Concept 4: spotlight room, three AI presenters | 9:16 and 16:9, 18s | Organic social (9:16); press kit, Product Hunt gallery, YouTube (16:9) | $0 |

All cuts are silent, with on-screen captions only. Rendered 2026-10-09 with Remotion in `40-gtm/video/concept2/` (see its README for re-rendering). Rendered, not yet posted.

**Labeling rules (non-negotiable on publish)**
- Persistent lower-third for the full duration: "AI presenter – data from public STOCK Act filings".
- Platform AI-content flag set on upload.
- The presenter narrates only. He is never shown as a user, never gives a testimonial, and respects the claims block in `presenter.json`.
- Lapel pin is the real CivicWatch shield mark, composited on, not model-drawn.
- Concepts 1, 3 and 4 carry the lower-third for the full length. Concept 3 and 4 read "AI presenters" (plural) because three faces appear. Concept 2 has no presenter, so no lower-third is needed.
- Concept 1 uses the locked A3 reference image (#48). Concepts 3 and 4 use the cast portraits, each wearing the shield pin and not given a name.

**Content rules**
- Real product screenshots and real member profiles only. No invented people, headshots or sample scores.
- Describe the committee conflict score as an analytical indicator, not proof of wrongdoing. Read the `40-gtm/video` README warning before showing a score next to a named real member.
- The "13,100+ disclosed trades" figure was checked on 2026-10-08 against the live `/api/stats` (13,117 trades, 535 members). Re-check it the day a cut is posted. The "5,000+" on the home page is a placeholder, not the real figure.
- Use the real logo files from `30-brand`. Gold `#C9A227` on dark only; `#A8851A` on light backgrounds.

## Budget

| Line | Amount | Period |
|---|---|---|
| Meta pilot | Up to $5/day, billed on delivery only | Daily |
| Directories, Show HN, Product Hunt, Indie Hackers | $0 | One-time |
| Remotion video clips | $0 | Per clip |
| Video ad concepts (organic, Remotion and existing tools) | $0 | Per clip |
| **Total** | **$0 committed; up to about $150/mo if the pilot runs a full month** | Monthly |

Reconcile against `20-business/finance-plan.md` — media spend is CAC. That file's
CAC row is still blank; fill it from real pilot spend and signups.

## Decisions needed
- Meta pilot is paused and stays paused. Outstanding Meta balance: $5.59 (two card charges failed Oct 6-7, one $4.02 paid). Marc decides how and when to settle it, and whether to remove the card so Meta stops retrying.
