---
doc: launch-post-x
project: civicwatch
status: ready-for-marc
owner: Marc Shelton
created: 2026-09-04
relates_to: gantt #40 ("Write and publish the launch post — founder-led, primary platform")
---

# Launch Post — X (primary platform)

Written per gantt #40's own note: "One post, primary platform (X — real-time
reach for the accountability angle), pointing at /pro." Founder voice (first
person), audience is the accountability voter defined in
`40-gtm/social-media-plan.md`, not the "invest like Congress" crowd.

**Not published.** Verified live just now: `x.com/civicwatchhq` returns "This
account doesn't exist" — gantt #38 (claim the four social profiles) is still
`pending`, and I don't create accounts on your behalf even with a go-ahead
(see `40-gtm/social-launch-kit/README.md`). This post is ready the moment an
account exists — nothing else blocks it (#37 and #32, its other dependencies,
are both done).

---

## The thread (6 posts)

**1/**
Congress writes the laws that move the market — then some of them trade on
it. The STOCK Act says they have to disclose it. Almost nobody reads those
filings. I built CivicWatch so you don't have to.

**2/**
Track any member of the House or Senate. Every disclosed stock trade, pulled
straight from the actual filings — no spin, no "buy what Congress buys"
pitch. This is an accountability tool, not a stock-picking tip sheet.

**3/**
The feature I actually built this for: Trade Conflict Analysis. It
cross-references a rep's committee assignments and votes against the timing
of their trades, and flags the ones that look like a conflict of interest.
No other tracker does this.

**4/**
Free: track any rep, get alerts the moment they file a new trade, look up
your state and local reps too.

**5/**
Pro: the full conflict-score breakdown — every flagged trade, why it was
flagged, and which committee or vote it lines up with.

**6/**
Real disclosure data. Real accountability.
civicwatch.app/pro

---

## Notes

- All six posts are under 280 characters, so this works even without X
  Premium's longer post limit.
- Claim checked: 2/6 references "state and local reps" (free `/api/civic`
  lookup) and 5/6 references the conflict-score breakdown gated per ADR-004
  — both verified against `00-governance/decision-log.md`, not assumed.
- Optional: attach a screenshot of the conflict-score page to post 3 — the
  visual sells the differentiator faster than the text alone. Didn't
  generate one; say the word if you want it made.
- CTA points at `/pro`, not the homepage, per #40's own note ("this is the
  first task in the whole schedule that asks a stranger to look" — send that
  look at the page built to convert it).

## To actually publish

1. Claim the X handle — kit's in `40-gtm/social-launch-kit/README.md`
   (recommends `civicwatchhq`; `civicwatch`/`civicwatchapp` are taken).
2. Post the 6 replies above as a thread from that account.
3. Check off #38 and #40 in the gantt once both are live — I didn't touch
   the gantt file, same as the social-launch-kit prep.
