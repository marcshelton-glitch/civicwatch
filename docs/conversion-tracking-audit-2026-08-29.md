# Conversion tracking audit — 2026-08-29

**Trigger:** verify Meta + TikTok Purchase-event tracking end to end before any paid ad spend.

**Status:** ✅ Fixed and verified live on production (www.civicwatch.app). Three separate bugs found, all now shipped to `main` and deployed.

## What was found

1. **Both pixel scripts were CSP-blocked, so nothing ever reached Meta or TikTok — not even PageView.**
   `components/MetaPixel.jsx` and `TiktokPixel.jsx` render with valid production pixel IDs (Meta `825005290673130`, TikTok `D8SUL7BC77U3G2M47DR0`), but `next.config.mjs`'s Content-Security-Policy `script-src` never allowlisted `connect.facebook.net` or `analytics.tiktok.com`. Confirmed via browser console: both script loads were blocked, so `fbq`/`ttq` stayed in their pre-load queue-stub state indefinitely. **Fix:** added both domains to `script-src`, plus `www.facebook.com`, `analytics.tiktok.com`, `business-api.tiktok.com`, and `analytics-ipv6.tiktokw.us` to `connect-src` for the pixels' own event/enrichment calls.

2. **The Purchase-tracking code itself (`lib/funnel-track.js`, the `app/dashboard/page.js` wiring) was written but never deployed.** It existed only as an uncommitted local diff — `git show HEAD:lib/funnel-track.js` returned "not in HEAD." Comments in the code say "Added 2026-08-27," but the commit backing that work was never pushed. **Fix:** committed and pushed (`fa934f8`).

3. **`/api/funnel-event` (the first-party Supabase click/purchase log) 401'd every signed-out caller.** The route itself was correctly written with no auth requirement, but it was never added to `proxy.ts`'s Clerk-middleware `isPublicRoute` allowlist — same bug class already documented in that file for `/api/pro-count` and `/robots.txt`. This only affects the first-party Supabase log, not the Meta/TikTok pixels, which fire client-side and never call this endpoint. **Fix:** added `/api/funnel-event(.*)` to the allowlist (`ae070cc`).

## Live verification performed

- Reloaded production after the CSP fix: `fbevents.js` and TikTok's `events.js` both load successfully now (previously blocked).
- Fired a real Purchase event via the shipped code path (`?upgrade=success`, no login required to trigger `trackPurchase`): confirmed a live network call to `https://www.facebook.com/tr/?...ev=Purchase&cd[value]=9.99&cd[currency]=USD` and two dispatches to `https://analytics.tiktok.com/api/v2/pixel`.
- Confirmed `/api/funnel-event` returns `200 {"ok":true}` for a signed-out caller after the middleware fix (was `401` before).
- Cleaned up the one diagnostic row this testing wrote to `funnel_events`.

## Not yet verified (needs your own ad-account access)

- **Meta Events Manager → Test Events** and **TikTok Events Manager → Test Events**, to confirm the events are being *received and matched* server-side, not just that the client-side call dispatches without error. That requires being logged into each platform's own dashboard — I can't do this from here.
- Whether Meta/TikTok flag the event quality (e.g. low match rate from no server-side Conversions API) — CivicWatch is client-pixel-only today per `lib/funnel-track.js`'s own comment, so ad-blockers and Safari/Firefox's third-party-cookie blocking will undercount this. That's a known, separate gap from what was asked here.

## Commits

- `fa934f8` — CSP unblock + ship Purchase/CompletePayment tracking
- `b51c256` — CSP: allow `analytics-ipv6.tiktokw.us`
- `ae070cc` — middleware: unblock `/api/funnel-event` for signed-out callers
