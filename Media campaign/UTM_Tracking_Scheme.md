# CivicWatch UTM Tracking Scheme
**Version 1.0 — July 4, 2026**  
**Domain:** civicwatch.app

---

## Table of Contents

1. [What Are UTM Parameters?](#1-what-are-utm-parameters)
2. [Naming Convention Rules](#2-naming-convention-rules)
3. [Parameter Reference](#3-parameter-reference)
4. [Channel Taxonomy](#4-channel-taxonomy)
5. [Campaign Naming Conventions](#5-campaign-naming-conventions)
6. [Content & Term Values](#6-content--term-values)
7. [Pre-Built UTM URLs](#7-pre-built-utm-urls)
8. [Podcast Promo Codes](#8-podcast-promo-codes)
9. [Analytics Setup Notes](#9-analytics-setup-notes)

---

## 1. What Are UTM Parameters?

UTM (Urchin Tracking Module) parameters are query string tags appended to URLs that tell your analytics platform where a visitor came from. When a user clicks a UTM-tagged link, the parameters are captured in your analytics tool (Stripe, Mixpanel, GA4, etc.) and attributed to that visit/conversion.

**Example:**
```
https://civicwatch.app/pro?utm_source=tangle&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s
```

This tells you: the visitor came from the **Tangle** podcast, via a **podcast** sponsorship, during the **launch-2026** campaign, from a **60-second mid-roll** ad.

---

## 2. Naming Convention Rules

Consistent naming is critical. Inconsistent casing or delimiters create duplicate sources in analytics (e.g., `TikTok` and `tiktok` appear as two separate sources).

| Rule | ✅ Correct | ❌ Wrong |
|------|-----------|---------|
| Always lowercase | `tiktok` | `TikTok` |
| Hyphens, not underscores | `paid-social` | `paid_social` |
| No spaces (they become `%20`) | `civicwatch-email` | `civicwatch email` |
| No special characters | `the-verge` | `the verge!` |
| Be specific, not generic | `tangle` | `podcast` |
| Dates use YYYY format | `launch-2026` | `launch-26` |
| Abbreviate consistently | `pro-upgrade` | `promo`, `upgrade`, `pro` |

> **Golden rule:** If two people build a UTM link for the same placement, they should arrive at the exact same string. When in doubt, consult this document before publishing.

---

## 3. Parameter Reference

| Parameter | Required? | Purpose | CivicWatch Usage |
|-----------|-----------|---------|-----------------|
| `utm_source` | ✅ Always | Identifies the traffic origin (the "who") | `tiktok`, `tangle`, `techcrunch`, `civicwatch-email` |
| `utm_medium` | ✅ Always | Identifies the marketing channel type (the "how") | `social`, `paid-social`, `podcast`, `email`, `referral` |
| `utm_campaign` | ✅ Always | Groups traffic by campaign or initiative | `launch-2026`, `election-day-2026`, `pro-upgrade-2026` |
| `utm_content` | Recommended | Differentiates ads, placements, or creative variants | `midroll-60s`, `bio-link`, `story-ad`, `video-1` |
| `utm_term` | Optional | Originally for paid search keywords; usable for additional segmentation | `pro-tier`, `trade-alerts`, `leaderboard` |

---

## 4. Channel Taxonomy

### 4.1 Social — Organic

Use for all unpaid, organic social posts. The `content` field should identify the specific post type or creative variant.

| utm_source | utm_medium | Notes |
|------------|------------|-------|
| `tiktok` | `social` | All organic TikTok posts |
| `instagram` | `social` | Feed posts, Reels, Stories |
| `facebook` | `social` | Page posts, Groups |
| `x` | `social` | Tweets/posts on X (formerly Twitter) |
| `linkedin` | `social` | Company page & personal posts |
| `youtube` | `social` | Organic video descriptions |
| `threads` | `social` | Threads posts |

**Example:**
```
utm_source=tiktok&utm_medium=social&utm_campaign=launch-2026&utm_content=bio-link
```

---

### 4.2 Social — Paid

Use for all paid/boosted social ad placements. Use the same source values as organic but switch `utm_medium` to `paid-social`.

| utm_source | utm_medium | Notes |
|------------|------------|-------|
| `tiktok` | `paid-social` | TikTok Ads (feed, TopView, Spark) |
| `instagram` | `paid-social` | Instagram Ads (feed, stories, reels) |
| `facebook` | `paid-social` | Facebook Ads (feed, video, Messenger) |
| `x` | `paid-social` | X Promoted Posts / Ads |
| `linkedin` | `paid-social` | LinkedIn Sponsored Content |
| `youtube` | `paid-social` | YouTube pre-roll/mid-roll ads |

**Example:**
```
utm_source=instagram&utm_medium=paid-social&utm_campaign=pro-upgrade-2026&utm_content=story-ad-v1
```

> **Note on paid social:** Most ad platforms (Meta, TikTok Ads Manager) let you set UTMs at the ad level. Always apply them there — do not rely on platform-level tracking only. For split-testing ads, increment `utm_content` (e.g., `story-ad-v1`, `story-ad-v2`).

---

### 4.3 Podcast Sponsorships

Each podcast gets its own `utm_source` using a slugified version of the show name. This allows granular per-show attribution in addition to promo code redemptions.

| utm_source | utm_medium | Podcast Name |
|------------|------------|--------------|
| `tangle` | `podcast` | Tangle |
| `pivot` | `podcast` | Pivot (Kara Swisher & Scott Galloway) |
| `all-in` | `podcast` | All-In Podcast |
| `hacks-on-tap` | `podcast` | Hacks on Tap |
| `political-gabfest` | `podcast` | Slate Political Gabfest |
| `the-weeds` | `podcast` | The Weeds (Vox) |
| `morning-wire` | `podcast` | Morning Wire |
| `rational-security` | `podcast` | Rational Security (Lawfare) |
| `fresh-air` | `podcast` | Fresh Air (NPR) |
| `up-first` | `podcast` | Up First (NPR) |
| `the-daily` | `podcast` | The Daily (NYT) |
| `american-scandal` | `podcast` | American Scandal |

**`utm_content` values for podcasts:**
- `midroll-30s` — 30-second mid-roll read
- `midroll-60s` — 60-second mid-roll read
- `preroll-30s` — 30-second pre-roll read
- `host-read` — host-read ad (no specified length)
- `bonus-ep` — bonus/sponsored episode

**Example:**
```
utm_source=tangle&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s
```

> **Attribution note:** Podcast listeners rarely click links. Use **promo codes** (see Section 8) as the primary attribution mechanism. UTMs are secondary, captured when a listener visits the link in the show notes.

---

### 4.4 Newsletter Sponsorships

Each newsletter gets its own `utm_source`. Medium is always `email-sponsorship` to distinguish from CivicWatch's own email list.

| utm_source | utm_medium | Newsletter |
|------------|------------|------------|
| `axios` | `email-sponsorship` | Axios AM / Axios Pro |
| `politico-playbook` | `email-sponsorship` | Politico Playbook |
| `morning-brew` | `email-sponsorship` | Morning Brew |
| `the-hustle` | `email-sponsorship` | The Hustle |
| `1440-daily` | `email-sponsorship` | 1440 Daily Digest |
| `grid-news` | `email-sponsorship` | Grid News |
| `semafor` | `email-sponsorship` | Semafor |
| `popular-info` | `email-sponsorship` | Popular Information (Judd Legum) |
| `the-dispatch` | `email-sponsorship` | The Dispatch |
| `ground-news` | `email-sponsorship` | Ground News |

**`utm_content` values for newsletters:**
- `header-ad` — top-of-email banner/sponsor block
- `inline-ad` — mid-email placement
- `footer-ad` — bottom sponsor section
- `dedicated-send` — full dedicated email

**Example:**
```
utm_source=axios&utm_medium=email-sponsorship&utm_campaign=launch-2026&utm_content=header-ad
```

---

### 4.5 Press & Organic Referral

When a publication writes about CivicWatch and links to civicwatch.app, UTMs aren't placed (the publication controls the link). However, when **you control the link** (e.g., a quote with a specific URL, a press kit landing page, a guest op-ed), use `medium=referral`.

| utm_source | utm_medium | Outlet |
|------------|------------|--------|
| `techcrunch` | `referral` | TechCrunch |
| `the-verge` | `referral` | The Verge |
| `politico` | `referral` | Politico |
| `axios` | `referral` | Axios (editorial, not sponsored) |
| `wired` | `referral` | Wired |
| `bloomberg` | `referral` | Bloomberg |
| `npr` | `referral` | NPR |
| `the-information` | `referral` | The Information |
| `semafor` | `referral` | Semafor (editorial) |
| `product-hunt` | `referral` | Product Hunt listing |
| `app-store` | `referral` | App Store editorial feature |

**Example:**
```
utm_source=techcrunch&utm_medium=referral&utm_campaign=launch-2026
```

> **Note:** If Axios runs a **paid** newsletter sponsorship AND also does editorial coverage, keep the sources the same (`axios`) but differentiate by medium: `email-sponsorship` vs `referral`.

---

### 4.6 CivicWatch Own Email List

For all emails sent from CivicWatch's own list (welcome sequences, weekly newsletters, re-engagement, product announcements).

| utm_source | utm_medium | Use Case |
|------------|------------|----------|
| `civicwatch-email` | `email` | All sends from CivicWatch's own list |

**`utm_content` values for own email:**
- `welcome-series-1`, `welcome-series-2`, etc. — onboarding drip emails
- `weekly-digest` — weekly newsletter
- `product-update` — feature announcement emails
- `re-engagement` — win-back campaigns
- `pro-upsell` — upgrade prompts to free users

**Example:**
```
utm_source=civicwatch-email&utm_medium=email&utm_campaign=pro-upgrade-2026&utm_content=pro-upsell
```

---

### 4.7 Offline / QR Code

For physical placements — event signage, printed materials, merchandise, billboards, outdoor ads.

| utm_source | utm_medium | Use Case |
|------------|------------|----------|
| `qr-code` | `offline` | Any QR code in physical media |
| `event` | `offline` | Event booth or sponsorship links |
| `direct-mail` | `offline` | Printed mailers |

**`utm_content` values for offline:**
- `event-nyc-july26` — specific event name/date
- `billboard-dc` — billboard location
- `merch-tshirt` — merchandise placement
- `conference-badge` — conference materials

**Example:**
```
utm_source=qr-code&utm_medium=offline&utm_campaign=launch-2026&utm_content=event-dc-july26
```

---

## 5. Campaign Naming Conventions

Campaign names group traffic across all channels for a specific marketing push. Use these consistently across all channels running simultaneously.

| utm_campaign | Description | Period |
|--------------|-------------|--------|
| `launch-2026` | Main app launch blitz | July 2026 |
| `independence-day-2026` | July 4th launch tie-in | July 4, 2026 |
| `election-day-2026` | Election season push (midterms/specials) | Fall 2026 |
| `trade-alert-organic` | Feature spotlight: real-time trade alerts | Ongoing |
| `pro-upgrade-2026` | Pro tier ($9.99/mo) conversion campaigns | Ongoing |
| `brand-awareness-2026` | Top-of-funnel awareness, no direct CTA | Q3–Q4 2026 |
| `podcast-blitz-q3` | Q3 podcast sponsorship wave | Q3 2026 |
| `newsletter-blitz-q3` | Q3 newsletter sponsorship wave | Q3 2026 |
| `influencer-2026` | Influencer/creator partnership content | Ongoing |
| `leaderboard-viral` | Viral leaderboard sharing campaign | Ongoing |
| `app-store-featured` | App Store feature tie-in | TBD |
| `referral-program` | User referral / word-of-mouth program | TBD |

> **Campaign naming tip:** When running a specific promotion tied to a news event (e.g., a major vote, Supreme Court decision), name the campaign after the event: `supreme-court-2026`, `debt-ceiling-2026`. This creates a clean record in analytics of which news moments drove acquisition.

---

## 6. Content & Term Values

### utm_content (Creative/Placement Identifier)

| Value | Use Case |
|-------|----------|
| `bio-link` | Link in social profile bio (Instagram, TikTok, X) |
| `feed-post` | Standard feed post/tweet |
| `story-ad` | Story format (Instagram/Facebook Stories) |
| `reel` | Instagram Reel |
| `tiktok-video` | TikTok video |
| `carousel` | Carousel/swipe post |
| `pinned-post` | Pinned tweet or pinned Facebook post |
| `video-1`, `video-2` | Video ad variants (for A/B testing) |
| `midroll-60s` | 60-second mid-roll podcast ad |
| `midroll-30s` | 30-second mid-roll podcast ad |
| `preroll-30s` | 30-second pre-roll podcast ad |
| `host-read` | Host-read podcast sponsorship |
| `header-ad` | Newsletter header/top placement |
| `inline-ad` | Newsletter inline/middle placement |
| `footer-ad` | Newsletter footer placement |
| `dedicated-send` | Full dedicated email send |
| `welcome-series-1` | First email in welcome series |
| `pro-upsell` | Pro upgrade CTA in email |
| `event-dc-july26` | DC launch event, July 2026 |

### utm_term (Optional Segmentation)

Primarily used for paid search. Can be repurposed for additional segmentation in non-search contexts.

| Value | Use Case |
|-------|----------|
| `pro-tier` | Ads specifically targeting Pro tier conversion |
| `trade-alerts` | Ads featuring trade alert feature |
| `leaderboard` | Ads featuring the leaderboard |
| `civic-engagement` | Broad civic/democracy angle |
| `congress-tracker` | Congress tracking feature angle |

---

## 7. Pre-Built UTM URLs

All links use these base URLs:
- **Homepage:** `https://civicwatch.app`
- **Pro upgrade:** `https://civicwatch.app/pro`
- **Leaderboard:** `https://civicwatch.app/leaderboard`

---

### 7.1 Social — Organic

| # | Channel | Destination | Full UTM URL |
|---|---------|-------------|--------------|
| 1 | TikTok (bio link) | Homepage | `https://civicwatch.app?utm_source=tiktok&utm_medium=social&utm_campaign=launch-2026&utm_content=bio-link` |
| 2 | TikTok (bio link) | Pro upgrade | `https://civicwatch.app/pro?utm_source=tiktok&utm_medium=social&utm_campaign=pro-upgrade-2026&utm_content=bio-link` |
| 3 | Instagram (bio link) | Homepage | `https://civicwatch.app?utm_source=instagram&utm_medium=social&utm_campaign=launch-2026&utm_content=bio-link` |
| 4 | Instagram (Reel) | Pro upgrade | `https://civicwatch.app/pro?utm_source=instagram&utm_medium=social&utm_campaign=pro-upgrade-2026&utm_content=reel` |
| 5 | X / Twitter (feed) | Homepage | `https://civicwatch.app?utm_source=x&utm_medium=social&utm_campaign=launch-2026&utm_content=feed-post` |
| 6 | LinkedIn (feed) | Homepage | `https://civicwatch.app?utm_source=linkedin&utm_medium=social&utm_campaign=launch-2026&utm_content=feed-post` |
| 7 | Facebook (feed) | Leaderboard | `https://civicwatch.app/leaderboard?utm_source=facebook&utm_medium=social&utm_campaign=leaderboard-viral&utm_content=feed-post` |

---

### 7.2 Social — Paid

| # | Channel | Destination | Full UTM URL |
|---|---------|-------------|--------------|
| 8 | TikTok Ads (feed) | Homepage | `https://civicwatch.app?utm_source=tiktok&utm_medium=paid-social&utm_campaign=launch-2026&utm_content=video-1` |
| 9 | Instagram Ads (story) | Pro upgrade | `https://civicwatch.app/pro?utm_source=instagram&utm_medium=paid-social&utm_campaign=pro-upgrade-2026&utm_content=story-ad` |
| 10 | Facebook Ads (feed) | Pro upgrade | `https://civicwatch.app/pro?utm_source=facebook&utm_medium=paid-social&utm_campaign=pro-upgrade-2026&utm_content=video-1` |
| 11 | LinkedIn Ads (feed) | Pro upgrade | `https://civicwatch.app/pro?utm_source=linkedin&utm_medium=paid-social&utm_campaign=pro-upgrade-2026&utm_content=feed-post` |
| 12 | X Promoted Post | Homepage | `https://civicwatch.app?utm_source=x&utm_medium=paid-social&utm_campaign=launch-2026&utm_content=feed-post` |

---

### 7.3 Podcast

| # | Podcast | Destination | Full UTM URL |
|---|---------|-------------|--------------|
| 13 | Tangle (mid-roll 60s) | Homepage | `https://civicwatch.app?utm_source=tangle&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s` |
| 14 | Pivot (mid-roll 60s) | Homepage | `https://civicwatch.app?utm_source=pivot&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s` |
| 15 | Hacks on Tap (host-read) | Pro upgrade | `https://civicwatch.app/pro?utm_source=hacks-on-tap&utm_medium=podcast&utm_campaign=launch-2026&utm_content=host-read` |
| 16 | All-In (mid-roll 30s) | Pro upgrade | `https://civicwatch.app/pro?utm_source=all-in&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-30s` |

---

### 7.4 Newsletter Sponsorships

| # | Newsletter | Destination | Full UTM URL |
|---|------------|-------------|--------------|
| 17 | Axios (header) | Homepage | `https://civicwatch.app?utm_source=axios&utm_medium=email-sponsorship&utm_campaign=launch-2026&utm_content=header-ad` |
| 18 | Politico Playbook (inline) | Pro upgrade | `https://civicwatch.app/pro?utm_source=politico-playbook&utm_medium=email-sponsorship&utm_campaign=launch-2026&utm_content=inline-ad` |
| 19 | 1440 Daily (header) | Homepage | `https://civicwatch.app?utm_source=1440-daily&utm_medium=email-sponsorship&utm_campaign=launch-2026&utm_content=header-ad` |
| 20 | The Dispatch (inline) | Pro upgrade | `https://civicwatch.app/pro?utm_source=the-dispatch&utm_medium=email-sponsorship&utm_campaign=launch-2026&utm_content=inline-ad` |

---

### 7.5 Press / Referral

| # | Outlet | Destination | Full UTM URL |
|---|--------|-------------|--------------|
| 21 | TechCrunch article | Homepage | `https://civicwatch.app?utm_source=techcrunch&utm_medium=referral&utm_campaign=launch-2026` |
| 22 | Product Hunt listing | Homepage | `https://civicwatch.app?utm_source=product-hunt&utm_medium=referral&utm_campaign=launch-2026` |

---

### 7.6 Own Email

| # | Email Type | Destination | Full UTM URL |
|---|------------|-------------|--------------|
| 23 | Welcome series email 1 | Homepage | `https://civicwatch.app?utm_source=civicwatch-email&utm_medium=email&utm_campaign=launch-2026&utm_content=welcome-series-1` |
| 24 | Pro upsell email | Pro upgrade | `https://civicwatch.app/pro?utm_source=civicwatch-email&utm_medium=email&utm_campaign=pro-upgrade-2026&utm_content=pro-upsell` |
| 25 | Weekly digest | Leaderboard | `https://civicwatch.app/leaderboard?utm_source=civicwatch-email&utm_medium=email&utm_campaign=leaderboard-viral&utm_content=weekly-digest` |

---

### 7.7 Offline / QR Code

| # | Placement | Destination | Full UTM URL |
|---|-----------|-------------|--------------|
| 26 | Event QR code | Homepage | `https://civicwatch.app?utm_source=qr-code&utm_medium=offline&utm_campaign=launch-2026&utm_content=event-dc-july26` |
| 27 | Printed flyer | Pro upgrade | `https://civicwatch.app/pro?utm_source=qr-code&utm_medium=offline&utm_campaign=launch-2026&utm_content=direct-mail` |

---

## 8. Podcast Promo Codes

Promo codes are the **primary attribution mechanism** for podcast ads, since most listeners don't click show notes links. Each show gets a unique, memorable code. Codes are applied at checkout on the Pro upgrade page (`civicwatch.app/pro`) and redeemed through Stripe.

**Discount:** 30% off first month of Pro ($9.99/mo → ~$7.00 first month)  
**Redemption URL:** `https://civicwatch.app/pro` (code entered at Stripe checkout)

| Podcast | Promo Code | Discount | Show Notes URL |
|---------|-----------|----------|----------------|
| Tangle | `TANGLE` | 30% off first month | `https://civicwatch.app/pro?utm_source=tangle&utm_medium=podcast&utm_campaign=launch-2026&utm_content=host-read` |
| Pivot | `PIVOT` | 30% off first month | `https://civicwatch.app/pro?utm_source=pivot&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s` |
| All-In | `ALLIN` | 30% off first month | `https://civicwatch.app/pro?utm_source=all-in&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-30s` |
| Hacks on Tap | `HACKS` | 30% off first month | `https://civicwatch.app/pro?utm_source=hacks-on-tap&utm_medium=podcast&utm_campaign=launch-2026&utm_content=host-read` |
| Slate Political Gabfest | `GABFEST` | 30% off first month | `https://civicwatch.app/pro?utm_source=political-gabfest&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s` |
| The Weeds | `WEEDS` | 30% off first month | `https://civicwatch.app/pro?utm_source=the-weeds&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-60s` |
| Morning Wire | `WIRE` | 30% off first month | `https://civicwatch.app/pro?utm_source=morning-wire&utm_medium=podcast&utm_campaign=launch-2026&utm_content=host-read` |
| Rational Security | `RATSEC` | 30% off first month | `https://civicwatch.app/pro?utm_source=rational-security&utm_medium=podcast&utm_campaign=launch-2026&utm_content=host-read` |
| The Daily (NYT) | `DAILY` | 30% off first month | `https://civicwatch.app/pro?utm_source=the-daily&utm_medium=podcast&utm_campaign=launch-2026&utm_content=midroll-30s` |
| Up First (NPR) | `UPFIRST` | 30% off first month | `https://civicwatch.app/pro?utm_source=up-first&utm_medium=podcast&utm_campaign=launch-2026&utm_content=preroll-30s` |

> **Stripe setup:** Create each promo code as a Stripe coupon (e.g., `TANGLE` → 30% off, one-time, applies to first invoice only). Track redemptions in the Stripe Dashboard under Coupons. Cross-reference monthly with UTM data in your analytics tool to measure show notes click-through vs. direct code entry.

---

## 9. Analytics Setup Notes

### Recommended Tooling

| Tool | Purpose |
|------|---------|
| **Stripe** | Track promo code redemptions per show; correlate with UTM source on Pro sign-ups |
| **Mixpanel / PostHog** | Full-funnel UTM attribution from first click to Pro conversion |
| **Google Analytics 4** | Backup web analytics; source/medium reporting |
| **Bitly / Short.io** | Shorten UTM URLs for social bios and print use |

### UTM Hygiene Checklist

- [ ] Never modify a live UTM URL without creating a new one — changing parameters mid-campaign breaks historical data
- [ ] Always use a link shortener for podcast/show notes links (e.g., `civicwatch.app/tangle` as a redirect)
- [ ] Check GA4/Mixpanel for "direct" traffic spikes — these often mean UTMs were stripped (common with email clients)
- [ ] Audit monthly: look for misspelled sources or mediums and create an alias/filter to clean them
- [ ] Store all UTM links in the companion `UTM_Link_Builder.xlsx` Campaign Library tab

### Reserved Vanity Redirects

Set these up as server-side redirects at civicwatch.app:

| Short Path | Destination |
|------------|-------------|
| `/tangle` | `civicwatch.app/pro?utm_source=tangle&utm_medium=podcast&...` |
| `/pivot` | `civicwatch.app/pro?utm_source=pivot&utm_medium=podcast&...` |
| `/allin` | `civicwatch.app/pro?utm_source=all-in&utm_medium=podcast&...` |
| `/launch` | `civicwatch.app?utm_source=qr-code&utm_medium=offline&utm_campaign=launch-2026` |

Short, spoken paths are more reliable for audio ads than full UTM strings.

---

*Last updated: July 4, 2026 | Maintained by: CivicWatch Marketing*
