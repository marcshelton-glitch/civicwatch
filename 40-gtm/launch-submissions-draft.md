---
doc: launch-submissions-draft
project: civicwatch
status: draft
owner: Marc Shelton
last_reviewed: 2026-09-22
review_cadence: n/a
gantt_tasks: [41]
---

# Launch Submissions — Product Hunt / Hacker News / Directories (draft)

Drafted 2026-09-04 by claude, for gantt **#41** ("Submit to Product Hunt, Hacker
News, niche directories"), scheduled **Sep 9–10**. **Not submitted anywhere.**
This is copy and a target list to review, not a record of anything posted.

## Why this isn't going out today

#41 depends on **#40** (launch post, scheduled Sep 8) and sits behind **#38**
(social profiles, Sep 5) and **#39** (support channel + FAQ, Sep 6–7) — none
done yet as of today (Sep 4). Two concrete reasons this order matters, not
just calendar hygiene:

- **Product Hunt's 2026 algorithm needs a warm first two hours** — roughly 50
  supporters in that window to trigger distribution. #40 (the founder-led post
  on X) is what creates that warm audience. Submitting before it exists means
  launching to no one.
- **You cannot point strangers at the product without somewhere for them to
  land a question or complaint.** #39 is the support-SLA gate the launch
  checklist itself requires before real customers arrive — PH and HN
  commenters will ask things, some pointed ("is this actually nonpartisan,"
  "where's your data from").

Also worth being direct about: I can't submit these myself. Product Hunt and
Hacker News both go out under your own accounts, and PH specifically expects
the maker to be present and responding in real time on launch day. My part
ends at having the copy and target list ready.

## Readiness gaps (per the directory-submissions playbook + PH norms)

- [x] 7 product screenshots, 2540×1520 (2× of PH's 1270×760), live site
      2026-09-22: `40-gtm/producthunt/gallery/`
- [x] Square logo: `40-gtm/producthunt/producthunt-logo-1024.png` (Guardian
      Shield, adopted 2026-09-22; the CW monogram is retired)
- [ ] Optional but doubles upvotes on average: 60–90s demo video
- [ ] PH "Upcoming" page live before launch day, to collect notify-on-launch
      subscribers (needs a maker account — do you have one, or should this be
      created during #38?)
- [x] Support channel live (#39, done 2026-09-04) — still needs same-day replies to PH/HN comments on launch day
- [x] Launch-day post live (#40, posted 2026-09-22 from @CivicWatchAlert)

## Product Hunt

**Tagline** (≤60 chars): `See what Congress is buying`

**Description** (≤260 chars, PH's limit — this one is 255):
> CivicWatch collects the stock trades Congress members disclose under the STOCK Act and shows them next to their votes and wealth filings. Free to browse. Pro ($9.99/mo) shows which trades overlap a member's committees, plus full AI accountability reports.

*Rewritten 2026-09-22: the earlier version read as if conflict flagging were
free. Per ADR-004 the list of flagged trades is Pro; free users see the
score and tier only.*

**Suggested topics/categories** (confirm against PH's live taxonomy at
submission time): Government, Politics, Open Data, Transparency.

**First maker comment** (post this yourself at launch, not boilerplate —
personalize it, and don't ask for upvotes; ask for feedback):

> Hey PH 👋 — I built CivicWatch because congressional stock-trade
> disclosures are public but buried. The House and Senate publish them to
> separate systems, and to tell whether a trade even looks like a conflict
> you'd have to cross-reference it against the member's committee seats
> yourself.
>
> CivicWatch pulls those STOCK Act filings into one place — 13,100+
> disclosed trades so far — next to each member's voting record and wealth
> disclosures. All of that is free to browse, and every member's profile
> shows a committee conflict score for free.
>
> Pro ($9.99/mo) shows *which* trades were flagged and why, plus full
> AI-written accountability reports and wealth-trajectory context.
>
> One limit I want to be upfront about: the conflict score only covers the
> current Congress (2025–26), because the committee data I use only has
> current assignments. Older trades are listed, but I don't score them
> against a seat the member may not have held at the time.
>
> I'd really like the harsh feedback — especially on whether the flagging
> reads as fair to both parties, since that's the part I care most about
> getting right. What would make this useful to you?

*Rewritten 2026-09-22: dropped "going back to 2012" (only confirmed for the
Senate) and "committees they sat on at the time" (scoring uses current
assignments only — see the methodology text in app/api/conflict-score).*

**Customer/second comment:** PH ranks comment *quality* over upvote count in
2026 — a genuine comment from an early user in the first hour helps more than
asking anyone to upvote. Line up one person who's actually used the product
to comment early, if you have one.

## Hacker News (Show HN)

Only worth doing if there's a real technical angle — there is one here (a
government-data ingestion pipeline with a scoring/matching problem), so this
isn't a stretch fit. HN's moderators and community are unforgiving of
anything that reads as a generic "we launched a SaaS" post.

**Title:**
> Show HN: CivicWatch – Tracking congressional stock trades against committee assignments

**Text** (factual, first person, no marketing language):
> I built a pipeline that ingests congressional stock-trade disclosures —
> House Clerk Periodic Transaction Reports and the Senate's eFD system — and
> checks each trade's ticker against the sectors overseen by the committees
> the filing member sits on.
>
> The data is public but hard to use. The two chambers publish to separate
> systems with different formats, and the Senate's eFD sits behind a WAF
> that blocks plain fetches, so that side runs through a headless browser
> (Playwright). Then there's matching filings to members: Senate filings
> carry names, not IDs, so I had to map ~100 name spellings ("Rounds, M.
> Michael", "Ladda Tammy") to bioguide IDs. 98% of the 13,100+ trades are
> now matched to a member.
>
> The main limitation: committee rosters come from the
> unitedstates/congress-legislators dataset, which only has current
> assignments. So I only score trades from the current Congress (2025–26).
> Older trades are listed but not scored, rather than matched against a seat
> the member may not have held then. If anyone knows a clean source for
> historical committee rosters, I'd like to hear about it.
>
> It's at civicwatch.app. Browsing trades, votes and wealth filings is free,
> and every member's profile shows their conflict score and tier for free.
> The breakdown of which specific trades were flagged is part of a $9.99/mo
> paid tier — mentioning that up front so nobody clicks through expecting
> otherwise.
>
> Curious what HN makes of the sector-matching approach, and whether anyone
> else has fought the eFD WAF.

*Rewritten 2026-09-22: the earlier text invited readers to check the
matching without saying the flagged-trade list is paid, and claimed trades
are checked against committees held "at the time of the trade", which the
scoring doesn't do.*

Figures refreshed 2026-09-22: 12,884 of 13,104 trades matched (98.3%). House
5,034/5,254; Senate 7,850/7,850 after `docs/senate-bioguide-backfill-2026-09-22.md`.
Before that fix, the Senate was 0% matched and the real combined rate was 38%.
Re-run the counts on launch day.

## Niche directories

The generic startup/SaaS/AI directory ecosystem (BetaList, SaaSHub,
AlternativeTo, G2, the AI-tool directories) mostly doesn't fit CivicWatch —
it's not enterprise software, doesn't have "alternatives" in the SaaS sense,
and isn't AI-native. Forcing a listing into a category it doesn't belong in
gets rejected by moderators and, worse for a brand built on being
straight about data, makes CivicWatch look like it's padding backlinks
rather than actually serving the accountability-voter audience. A short list
of genuine fits does more than a long list of forced ones:

| Directory | Why it fits | Notes |
|---|---|---|
| **Civic Tech Field Guide** (civictech.guide) | The actual home for this category — a maintained, curated catalog of civic tech projects | Submission is a form/PR against their project list; check current process before submitting |
| **"Awesome" GitHub lists** — `awesome-civic-tech`, `awesome-government`, `awesome-opendata` | Curated by the open-gov/civic-tech dev community; PR-based, high-signal, genuinely read by the audience most likely to build on or cite this data | Requires the repo (or at least the data pipeline) to be presentable — confirm what's public before pointing here |
| **Indie Hackers** | Fits the founder-led, build-in-public voice already chosen for #40 | Post the launch as a build-in-public thread, not just a listing |
| **r/SideProject, r/OpenGovernment, r/PoliticalDiscussion (where self-promo is allowed)** | Already covered by the broader Reddit plan in `social-media-plan.md` — flagging here so it isn't double-submitted as a "directory" separately | 90/10 rule applies: participate, don't just post |
| **GitHub org/repo profile** | If any part of the ingestion pipeline is public, a README with a live link is a legitimate, high-DR backlink | Check whether the repo is public before promising this — `PROJECT.md`'s remote-URL field is still blank |

Deliberately left off: G2/Capterra (review-farming machinery doesn't fit a
$9.99/mo consumer tool with no sales motion), the AI-tool directories (the AI
report is a Pro feature, not the product's identity), and the generic
Tier-2/3 SaaS directory blast (dozens of low-relevance listings for backlink
volume alone) — all skippable without giving up real distribution, per the
directory-submissions playbook's own rule: submit only where the product is
a genuine fit.

Editorial outreach (not self-serve, but worth a mention as a Sep-11-and-later
follow-up once there's a launch to point at): govtech/civic-accountability
press — GovTrack Insider, The Fulcrum, Democracy Docket — for a "new tool"
mention once there's real usage data to cite. `app/press` already exists for
this.

## Before this goes live — checklist

- [x] #38, #39, #40 done (2026-09-21 / 09-04 / 09-22 — evidence in gantt notes)
- [x] Match-rate and trade-count figures refreshed (2026-09-22; re-check on
      launch day)
- [x] Screenshots + square logo ready for the PH gallery
- [ ] A maker account exists (or gets created during #38) and, ideally, an
      "Upcoming" page has been live for at least a few days
- [ ] Someone lined up to leave a genuine early comment on PH
- [ ] Marc is free to reply to comments in real time for the first few hours
      on whichever day this actually launches
