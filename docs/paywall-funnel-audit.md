# CivicWatch paywall & upgrade funnel audit

**Date:** 2026-08-20 (fixes applied same day)
**Scope:** `/pro`, `/api/subscribe`, `/api/subscribe-instant`, `/api/webhooks/stripe`, `/api/billing-portal`, `/api/pro-count`, Pro gating in `CivicWatch.jsx`, `SettingsPanel.jsx`, `ExitIntentModal.js`.

## Summary

The core checkout → webhook → access-grant path is in good shape. The July 30 price-ID incident (`docs/stripe-price-fix.md`) is fixed and defended with a validated resolver (`lib/stripe-prices.js`), a `/api/health` billing check, and cross-product scoping on `/api/pro-count`. Paywall UI (blurred previews, lock overlays, preview counters on AI Analysis) is well built.

**Status:** Findings 1, 3, and 4 are fixed and fully live (including the `funnel_events` migration, applied and verified against the production database). Finding 2 was **reversed, not fixed** — a live Supabase check while implementing it showed the "Coming Soon" badge is actually correct today (see Finding 5), so `SettingsPanel.jsx` was brought in line with `/pro` instead of the other way around. Details below.

## Findings

### 1. HIGH — Pro status doesn't refresh client-side after checkout — ✅ FIXED

`app/dashboard/page.js`'s `UpgradeBanner` shows "★ Welcome to CivicWatch Pro! Your subscription is now active." on `?upgrade=success`, but nothing calls `user.reload()` (or any Clerk refresh) at that point. Every `isPro` check in `CivicWatch.jsx` reads `user.publicMetadata.isPro` off the client-cached Clerk `useUser()` object, which was fetched before the webhook updated `publicMetadata`. Net effect: a user who just paid sees a success toast while every paywalled section (AI Analysis, net worth, conflict score) still renders the free-tier lock overlay and "Upgrade to Pro" buttons, because the client's copy of `isPro` is stale until Clerk's next background refresh or a manual page reload.

This is the kind of thing that generates "did I get charged twice / did this even work" support tickets and refund requests right at the moment of highest purchase anxiety.

**Fix applied:** `app/dashboard/page.js`'s `UpgradeBanner` now calls `user.reload()` in a backoff loop (1.5s / 3s / 4.5s / 6s, up to 5 attempts, stopping early once `publicMetadata.isPro` is `true`) whenever `status === 'success'`. Every `isPro`-gated section re-renders correctly once the reload lands, without waiting on Clerk's own background refresh or a manual page reload.

### 2. MEDIUM — Pricing page undersells a feature that's already live — ⚠️ REVERSED, see Finding 5

Originally filed as: `app/pro/page.js` marks **Trade Conflict Analysis** `comingSoon: true` despite `/api/conflict-score` being fully implemented and correctly gated in `CivicWatch.jsx`, while `components/SettingsPanel.jsx`'s upgrade CTA lists "📈 Stock trade conflict analysis" as a current benefit with no such caveat — a direct contradiction between the two, and the original recommendation was to drop the `comingSoon` flag on `/pro` since the feature is shipped.

**What changed before fixing:** a live Supabase check (see Finding 5) showed `fd_trades.bioguide_id` is still NULL on 2,663 of 5,076 rows (52%), including sitting members with real trade volume and directly relevant committee seats — Lloyd Doggett (114 trades, Ways & Means), Judy Chu (43 trades, Ways & Means), Susie Lee (44 trades, Natural Resources + Appropriations). For any of those members, Pro's conflict score still silently returns "None flagged" today. Removing "Coming Soon" would have advertised a feature that materially misleads paying customers looking up well-known committee members.

**Fix applied (reversed from original plan):** `/pro`'s `comingSoon: true` on Trade Conflict Analysis was left as-is — it's the accurate label. Instead, `components/SettingsPanel.jsx` was brought into line with it: the unqualified "📈 Stock trade conflict analysis" bullet was replaced with "⭐ Track any representative" (a genuinely complete, non-`comingSoon` feature), with a comment pointing back to this doc so it's restored once Finding 5's ingest bug is fixed.

### 3. MEDIUM — "N Americans went Pro this month" counts subscriptions that never converted — ✅ FIXED

`app/api/pro-count/route.js` calls `stripe.subscriptions.list({ price: priceId, created: { gte: monthStart }, status: 'all' })`. `status: 'all'` includes `incomplete`, `incomplete_expired`, and `canceled` subscriptions created this month — not just `active`/`trialing` ones. A user who abandoned checkout mid-payment, or whose card was declined and the subscription auto-canceled, still counts toward the number shown on `/pro` as social proof.

This inflates a number that's presented to prospective buyers as a trust signal. It's a smaller integrity issue than the original cross-product leak (already fixed), but it's the same category of bug.

**Fix applied:** `app/api/pro-count/route.js` now runs two paginated `stripe.subscriptions.list()` passes — `status: 'active'` and `status: 'trialing'` — and sums them, instead of one pass with `status: 'all'`. CivicWatch has no trial today, so `trialing` is currently always zero, but it's included so this doesn't quietly regress if a trial is ever added.

### 4. MEDIUM — Zero funnel instrumentation — ✅ FIXED

No `gtag`, `fbq`, pixel, or custom `track()` calls exist anywhere in `/pro`, the exit-intent modal, or any of the in-app upgrade CTAs (net worth lock, AI Analysis lock, conflict-score lock, `SettingsPanel` upsell). `docs/stripe-price-fix.md` already flagged this in July ("No `NEXT_PUBLIC_GA_MEASUREMENT_ID` or pixel IDs → no funnel visibility, no attribution") and it's still true. There are at least five distinct upgrade entry points in the product (hero CTA, comparison-grid CTA, bottom-of-page CTA, exit-intent modal, and four separate in-context lock overlays), and there is currently no way to tell which ones actually drive checkouts versus which ones get clicked and abandoned at Stripe.

**Fix applied:** built a first-party click-tracking path rather than waiting on a third-party pixel:
- `supabase/migrations/20260820000000_create_funnel_events.sql` — new `funnel_events` table (`user_id`, `event_name`, `location`, `metadata`, `created_at`), service-role-only via RLS. Applied to the live database (project `hgtofwsvbblumcgbqzat`) and verified — table, both indexes, and the `service_role_all` policy are confirmed present.
- `app/api/funnel-event/route.js` — new POST endpoint, no auth required (signed-out visitors click "Go Pro" too), always returns 200 even on failure so a missing table or DB hiccup can never break the upgrade flow it's instrumenting.
- `lib/funnel-track.js` — new `trackUpgradeClick(location, metadata)` client helper: forwards to `window.gtag` if GA is ever wired up (no-op today), and best-effort `sendBeacon`/`fetch` POSTs to `/api/funnel-event`.
- Wired into all 9 upgrade-CTA call sites: `/pro`'s `pro_hero`, `pro_comparison_card`, `pro_mission_section`, `pro_bottom_cta`; `CivicWatch.jsx`'s `networth_lock`, `networth_chart_lock`, `conflict_score_lock`, `ai_analysis_lock`, `ai_analysis_idle_signed_in`, `ai_analysis_idle_signed_out`, `ai_analysis_error_unauthorized`; and `SettingsPanel.jsx`'s `settings_upsell`. (`ExitIntentModal.js` was left alone — it's a search/state-lookup modal with no upgrade CTA to instrument.)

`app/api/track/route.js` was checked and is unrelated — it's the "track this representative" watchlist endpoint, not analytics.

### 5. MEDIUM — Conflict score still silently under-reports for some Pro users — confirmed still open, not fixed here

Only half-fixed as of this audit. The *committee* side of `/api/conflict-score` is solid — `committee_memberships` is populated (3,891 rows / 531 members via `scripts/ingest-committees.mjs`) and the route no longer returns "None flagged" for everyone the way it did Aug 3.

But the *trades* side still joins on `fd_trades.bioguide_id`, and a fresh Supabase check while implementing Finding #2's original fix (2026-08-20, project `hgtofwsvbblumcgbqzat`) confirmed the column is still NULL on 2,663 of 5,076 rows (52%) across 266 distinct name tuples — including sitting members with live committee seats and substantial trade volume: Lloyd Doggett (114 trades, Ways & Means + Budget), Judy Chu (43 trades, Ways & Means + Budget), Susie Lee (44 trades, Natural Resources + Appropriations). For those members the endpoint still returns `score: 0, tier: "None flagged"` with a 200 — indistinguishable from a clean bill of health to a Pro subscriber paying specifically for this feature. Root cause is believed to be malformed `first_name` values (e.g. `"Mark Dr"`) breaking the ingest name-matcher.

**Not fixed here** — this is a trade-ingest/name-matching bug, not a paywall/funnel bug, and is out of scope for this pass. It's the reason Finding #2 was reversed instead of applied as originally written. Re-run `count(bioguide_id)` vs `count(*)` on `fd_trades` (grouped by member, not just row count) before ever removing `/pro`'s "Coming Soon" badge on Trade Conflict Analysis.

## Confirmed healthy (no action needed)

- **Price-ID cross-contamination** (the incident behind `docs/stripe-price-fix.md`): fixed. `getProMonthlyPriceId()` hard-rejects the three Candidate Calculator price IDs, and `/api/health` surfaces misconfiguration before a customer hits it.
- **Webhook idempotency / metadata handling**: `checkout.session.completed`, `invoice.paid` (wallet path), `customer.subscription.deleted`, `.paused`, and `.updated` all merge `publicMetadata` rather than overwrite it, and all set `tier` explicitly. The dual-path (Checkout vs. `subscribe-instant`) grant logic is correctly scoped so neither double-fires.
- **`/api/networth`, `/api/analyze-rep` (full mode), `lib/requirePro.js`**: all correctly gate on server-side `currentUser().publicMetadata.isPro`, not a client-supplied flag.
- **Apple Pay / `PaymentRequestButton`**: confirmed still unmounted — the dangerous foreign-price-ID landmine described in `subscribe-instant/route.js`'s comment can't fire because nothing renders that button.
- **Billing portal**: straightforward, correctly gated on `stripeCustomerId` presence, returns 404 rather than crashing when a free user hits it directly.

## Not verified (outside code access)

- Whether `RESEND_API_KEY` and `STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID` are actually set in Vercel today. The code path degrades gracefully either way (health check flags missing price; missing Resend key just no-ops the welcome/dunning/cancellation emails), but if `RESEND_API_KEY` is still unset per the July 30 doc, every failed-payment dunning email is silently not sending — meaning failed cards convert straight to churn with no recovery attempt. Worth a 30-second check in Vercel env vars.
