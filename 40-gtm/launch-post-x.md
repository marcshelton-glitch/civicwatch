---
doc: launch-post-x
project: civicwatch
status: published
owner: Marc Shelton
created: 2026-09-04
revised: 2026-09-22
relates_to: gantt #40 ("Write and publish the launch post — founder-led, primary platform")
---

# Launch Post — X (primary platform)

Gantt #40: "One post, primary platform (X), pointing at /pro." Founder voice,
written for the accountability voter in `social-media-plan.md`.

## The post (269 / 280 chars — URL counts as 23)

> Your representative has to disclose every stock trade. Almost nobody reads the filings.
>
> I built CivicWatch to fix that: look up any member of Congress and see every disclosed trade, free. Pro checks each one against the committees they sat on.
>
> civicwatch.app/pro

## What changed from the Sep 4 draft (and why)

- **6-post thread → one post.** The task says one post. The old thread is in
  `launch-post-x.md.bak` if you want replies to seed later.
- **Dropped "committee assignments *and votes*."** `/pro` describes Trade
  Conflict Analysis as committee cross-referencing only; votes were an overclaim.
- **Dropped "No other tracker does this."** Unverified competitive claim.
- **Handle:** the draft assumed `@civicwatchhq`; #38 actually claimed
  **@CivicWatchAlert** (connected to Postiz).

## Fixed before posting: the /pro link card

`app/pro/layout.js` meta descriptions — which X renders as the link-preview
card — still sold "real-time alerts" and "local representative lookup" as Pro.
ADR-004 made those free. Rewritten to match; needs a deploy before the post
goes out, or the first thing a stranger sees contradicts the page.

## Published

- Meta fix deployed 2026-09-22 (commit 86a342c, Vercel READY, live tags verified).
- Posted 2026-09-22 from @CivicWatchAlert: https://x.com/CivicWatchAlert/status/2102517338298007802 (link card renders).
- Remaining: check off #40 in the gantt.
