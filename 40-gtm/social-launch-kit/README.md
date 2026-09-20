---
doc: social-profile-launch-kit
project: civicwatch
status: ready-for-marc
owner: Marc Shelton
created: 2026-09-04
relates_to: gantt #38 ("Claim and brand the four social profiles chosen in #37")
---

# Social Profile Launch Kit — X, YouTube, Reddit, Instagram

Everything needed to claim and brand the four platforms decided in **gantt
#37** (2026-09-04): **X, YouTube, Reddit, Instagram**. Source: `40-gtm/social-media-plan.md`.

**What I could not do myself:** creating the accounts. Signing up for a new
account is something I never do on your behalf, even with your go-ahead — so
#38 isn't fully closeable by me. Everything below is built so the actual
sign-up is a five-minute copy/paste/upload job once you're ready.

---

## 1. Handle

**Recommendation: `civicwatchhq`** — checked live on 2026-09-04:

| Platform | `civicwatch` | `civicwatchapp` | `civicwatchhq` |
|---|---|---|---|
| X | 🔴 Taken (account suspended) | 🟢 Available | 🟢 Available |
| Instagram | 🔴 Taken (unrelated watch-seller account) | 🟡 Exists — `@civicwatchapp`, display name "CivicWatch.app", 0 followers, 0 posts, empty. Could be a prior claim of yours; you weren't sure when I asked. **Log in and check before you pick a handle** — if it's yours, use it and skip re-registering; if not, it's a squat. | 🟢 Available |
| YouTube | 🔴 Taken (dormant channel, 3 subscribers, no content) | 🔴 Taken (dormant, `youtube.com/@civicwatchapp`) | 🟢 Available |
| Reddit | — not checked, moot | — not checked, moot | ⚪ **Unconfirmed** — Reddit is blocked to my browsing tools. Check `reddit.com/user/civicwatchhq` yourself at signup. |

Note: `@CivicWatchAlerts` already exists as the automated trade-alert bot
(`app/api/alerts/x-bot/route.js`) — that's a separate, already-decided
account and not one of these four.

If `civicwatchhq` doesn't clear Reddit, next candidates in order:
`getcivicwatch`, `thecivicwatchapp`, `civicwatch_hq`.

---

## 2. Assets — ready to upload

All in `40-gtm/social-launch-kit/assets/`, built from the existing brand mark
(`brand/logo_icon_transparent.png`) so they match what's already on the site
and app icon.

| File | Size | Use |
|---|---|---|
| `avatar_x_400x400.png` | 400×400 | X profile photo |
| `avatar_instagram_1080x1080.png` | 1080×1080 | Instagram profile photo |
| `avatar_youtube_800x800.png` | 800×800 | YouTube channel icon |
| `avatar_reddit_512x512.png` | 512×512 | Reddit avatar |
| `banner_x_1500x500.png` | 1500×500 | X header photo |
| `banner_youtube_2048x1152.png` | 2048×1152 | YouTube banner (text kept inside YouTube's 1235×338 safe area — it won't get cropped on TV/mobile) |
| `banner_reddit_1920x384.png` | 1920×384 | Reddit profile banner |

Instagram has no banner slot, so there's no Instagram banner file.

**One bug found along the way:** `civicwatch_logos/civicwatch_banner.png`
(the existing 1500×500 banner export) has a text-rendering glitch — "Watch"
and "Civic" overlap into a garbled mess. It isn't referenced anywhere in the
live site or app, so nothing is broken in production, but don't reuse that
file — the `banner_x_1500x500.png` built here replaces it cleanly. Worth
regenerating `civicwatch_banner.svg`'s export properly at some point since
the SVG source itself is fine.

---

## 3. Bio copy — per platform, under each limit

**X** (160 char limit, using 121):
> We track members of Congress' stock trades and flag conflicts of interest. Real STOCK Act data, zero spin. civicwatch.app

Website field: `civicwatch.app`

**Instagram** (150 char limit, using 115):
> Congress trades stocks while writing the rules.
> We track it and flag the conflicts.
> Real data. Real accountability.

Link field: `civicwatch.app`

**YouTube** (channel description, ~1000 char limit, using ~370):
> CivicWatch tracks stock trades disclosed by members of Congress under the STOCK Act and flags the ones that look like conflicts of interest — trades that line up with a committee vote, a bill, or an industry a rep oversees.
>
> This isn't "invest like Congress." It's accountability: real disclosure data, plain-language flags, no spin.
>
> Free to track your reps. Pro unlocks the full conflict-score breakdown.
>
> civicwatch.app

**Reddit** (About/user description, ~200 char limit, using 101):
> Tracking congressional stock trades and flagging conflicts of interest. Real STOCK Act data, no spin.

Link (Reddit profile "Social Links"): `civicwatch.app`

---

## 4. Claim steps (do this part yourself)

1. Log into (or create) each account under **an email/entity you control for
   the business**, not a personal throwaway — per `launch-checklist.md`'s
   "Developer accounts under the correct entity" spirit.
2. Set the handle to `civicwatchhq` (or your confirmed alternate) on all four,
   for consistency.
3. Set display name to **CivicWatch** everywhere.
4. Upload the avatar file from the table above (right one per platform).
5. Upload the banner file where the platform has a banner slot (X, YouTube,
   Reddit — not Instagram).
6. Paste the matching bio from §3, and set the website link to
   `civicwatch.app` wherever there's a dedicated field.
7. Come back and check the box in `40-gtm/launch-checklist.md` — "Social
   profiles claimed and branded consistently" — and update gantt task **#38**
   to done in `70-schedule/gantt-state.json` (or however you're tracking
   completion now) once all four are live.

I didn't touch the gantt file or the checklist — those completion marks
should follow the actual claiming, not this prep work.

---

## Open items for you

- Confirm whether `@civicwatchapp` on Instagram is already yours (I couldn't
  tell from the outside — 0 followers/posts, but that's consistent with
  either a stale claim of yours or a squat).
- Confirm `civicwatchhq` clears on Reddit specifically (I couldn't check —
  Reddit is blocked to my browsing tools).
- Decide whether `civicwatch_banner.svg`/`.png` is worth fixing/regenerating
  now or later — it's unused in production today, so it's not urgent.
