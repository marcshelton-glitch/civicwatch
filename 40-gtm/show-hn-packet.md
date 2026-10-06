---
doc: show-hn-packet
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-09-30
review_cadence: n/a
gantt_tasks: [41]
---

# Show HN — launch packet (gantt #41)

One file with everything needed to post. **Not posted.** Hacker News posts
under your own account; Claude cannot submit it. Supersedes the Show HN
section of `launch-submissions-draft.md`.

## How HN works here (changes the old draft)

- A submission with a URL **discards the text field**. So: submit the URL +
  title, then post the write-up below as **your first comment** immediately.
- Show HN rules (news.ycombinator.com/showhn.html): must be something people
  can try; no signup walls or landing pages; you must be the creator and
  around to answer; **never ask anyone to upvote or comment** (friends
  included). No best-time rule is official; weekday US morning is folklore.
- Verified 2026-09-30: `/trades` is public (HTTP 200, no signup, no login).

## Submit

- **Title** (74/80 chars): `Show HN: CivicWatch – Congressional stock trades vs. committee assignments`
- **URL:** `https://www.civicwatch.app/trades`  (the data itself, not the
  marketing homepage)

## First comment (post right after submitting)

> I built a pipeline that ingests congressional stock-trade disclosures —
> House Clerk Periodic Transaction Reports and the Senate's eFD system — and
> checks each trade's ticker against the sectors overseen by the committees
> the filing member currently sits on.
>
> The data is public but hard to use. The two chambers publish to separate
> systems with different formats, and the Senate's eFD sits behind a WAF
> that blocks plain fetches, so that side runs through a headless browser
> (Playwright). Then there's matching filings to members: Senate filings
> carry names, not IDs, so I mapped 103 name spellings (e.g. "Rounds, M.
> Michael", "Ladda Tammy") to bioguide IDs. About 98% of the 13,100+ trades
> are now matched to a member (12,884 of 13,109 on 2026-09-30).
>
> The main limitation: committee rosters come from the
> unitedstates/congress-legislators dataset, which only has current
> assignments. So I only score trades from the current Congress (2025–26).
> Older trades are listed but not scored, rather than matched against a seat
> the member may not have held then. If anyone knows a clean source for
> historical committee rosters, I'd like to hear about it.
>
> Browsing trades, votes and wealth filings is free with no account, and
> every member's profile shows a conflict score and tier for free. The
> breakdown of which specific trades were flagged is part of a $9.99/mo
> paid tier — mentioning that up front so nobody clicks through expecting
> otherwise.
>
> Curious what HN makes of the sector-matching approach, and whether anyone
> else has fought the eFD WAF.

## Pre-flight (do on the day, in order)

1. Re-run counts; update the two numbers above if they moved:
   `select count(*), count(bioguide_id) from fd_trades;` and the same on
   `senate_trades` (read-only).
2. Deploy the `/pro` copy fix + JSON-LD first (both are local edits as of
   2026-09-30, not yet deployed).
3. Open `/trades` in a private window: loads, no login prompt.
4. Confirm `github.com/marcshelton-glitch/civicwatch` has no secrets or
   private files (repo is public) before anyone clicks through.
5. Be free for the first 2-3 hours to reply.

## Likely questions — have answers ready

- **"Is this partisan?"** Scoring is mechanical (ticker sector vs. committee
  sector), same rule for every member; no party input. Point to the
  methodology text in `app/api/conflict-score`.
- **"Why is the flagged list paid?"** Server cost (AI + data upkeep); free
  tier still shows score, tier and every raw trade.
- **"Does sector overlap mean insider trading?"** No — it's a flag for
  review, not an accusation; say so plainly.
- **"Where's the data from?"** House Clerk PTRs, Senate eFD, votes via
  congressional API, wealth from official disclosure filings, committees from
  unitedstates/congress-legislators.
- **"Why not historical committees?"** Only current rosters available; see
  limitation above.
- **"Source available?"** Answer per the repo's actual public contents.

## After posting

- Don't edit the title after it gains traction; don't repost if it sinks
  (one retry maybe after a few days with real changes).
- Log in `media-plan.md` line 40 (Hacker News): submitted date, URL.
