# Proposed — GTM tasks for CivicWatch

Drafted 2026-08-31 by claude. **Not applied.** Review, then run
`70-schedule/apply-gtm-tasks.py` to write these into `gantt-state.json`,
followed by `projects-dashboard/sync-charts.sh` and `build-today.sh`.

## Why these five

The schedule has 36 tasks across six phases and not one of them puts CivicWatch
in front of a person who could pay for it. Checkout works; nobody knows the
product exists. These five close that gap using only free channels.

They are deliberately small. The GTM documents in `40-gtm/` are unfilled
templates, so there is no plan to execute — the first task creates the three
decisions everything else depends on.

## New phase: `GTM — First Customers`

| # | Task | Days | Scheduled | Depends on |
|---|---|---|---|---|
| 37 | Decide the GTM basics — one objective, ICP in a sentence, two platforms | 1 | Sep 1 | — |
| 38 | Claim and brand the two social profiles chosen in #37 | 1 | Sep 7 | #37 |
| 39 | Support channel live with a stated SLA, FAQ covering the top 10 questions | 2 | Sep 8–9 | #37 |
| 40 | Write and publish the launch post — founder-led, primary platform | 1 | Sep 10 | #37, #32 |
| 41 | Submit to Product Hunt, Hacker News, niche directories | 2 | Sep 11–14 | #32, #40 |

## One reschedule, not an addition

**#32 "Rewrite /pro around what actually works"** moves from **Sep 21–23 → Sep 2–4.**

Every task above points a stranger at `/pro`. Its own note says the page
"currently undersells what works, oversells what doesn't." Driving traffic to a
page that misrepresents the product wastes the traffic and the goodwill. The
conversion page has to be right *before* anyone is sent to it, not three weeks
after.

## Daily load

Interleaved with the P0 Product Claim run already scheduled, this holds at
**two tasks per day** — no day gets heavier:

| Date | Existing | Added |
|---|---|---|
| Sep 1 | #21 real-card checkout | #37 GTM basics |
| Sep 2 | #21 | #32 rewrite /pro |
| Sep 3–4 | #14 Clerk webhook | #32 |
| Sep 7 | #23 bioguide backfill | #38 social profiles |
| Sep 8–9 | #23 | #39 support channel |
| Sep 10 | #23 | #40 launch post |
| Sep 11–14 | #24 future-dated trades | #41 directories |

## The honest risk

**#37 is a decision only you can make, and #38–#41 all depend on it.** If it
sits unanswered the whole chain stalls and this is worse than not scheduling it,
because the calendar will show green while nothing moves. It is one sitting:
pick a single objective, write the ICP in one sentence, choose two platforms
from the five in `social-media-plan.md`. The plan's own advice is "pick two to
do well — five done badly is worse than two done well."

## What these deliberately exclude

- **Paid media.** No budget, and organic is unexhausted. The conversion-tracking
  gate is already cleared (#30), so paid is *available* — it is just not the
  cheapest next dollar.
- **Rewriting the four `40-gtm` templates in full.** Filling in documents is not
  distribution. #37 captures the three fields that actually gate action; the
  rest can stay blank until there is evidence to put in them.
- **A press push.** `app/press` exists, but earned media without a launch moment
  to point at is wasted effort. Revisit after #41.
