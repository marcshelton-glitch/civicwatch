# Stripe price-ID fix — handoff

**Date:** July 30, 2026
**Problem:** CivicWatch's Vercel project carried price IDs belonging to the California
Candidate Calculator. The price the checkout route actually reads was never set, so
every upgrade attempt returned a generic 500.

---

## What you must do (code alone does not fix this)

### 1. Find or create the CivicWatch Pro price in Stripe

Stripe Dashboard → **Products**. Both apps share one Stripe account, so look for a
CivicWatch product distinct from the Candidate Calculator's.

- **If it exists:** copy its `price_…` ID for the $9.99/mo recurring price.
- **If it does not:** create Product **"CivicWatch Pro"** → recurring price **$9.99 / month
  USD** → copy the `price_…` ID.

Do **not** reuse any of these — they belong to the Candidate Calculator, and the code now
refuses to charge against them:

| Env var (delete from CivicWatch's Vercel project) | Price ID |
|---|---|
| `STRIPE_VOTER_PRO_MONTHLY_PRICE_ID` | `price_1Tmk39Pe8la2Z0hh4yDJnWca` |
| `STRIPE_VOTER_PRO_ONETIME_PRICE_ID` | `price_1Tmk3DPe8la2Z0hhnM08fsN8` |
| `STRIPE_CIVIC_PACK_ONETIME_PRICE_ID` | `price_1Tmk3FPe8la2Z0hh5tGr95kY` |

### 2. Set the new env var in Vercel

```
STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID = price_…   (Production + Preview)
```

Then delete the three vars above. Redeploy.

### 3. Test with a real card

Sign in → `/pro` → Upgrade → complete checkout. Confirm all three:

- Stripe shows the charge against the **CivicWatch** product
- Clerk `publicMetadata` gains `isPro: true` **and** `tier: 'pro'`
- The account can load a full AI report (`/api/analyze-rep`, `mode: 'full'`)

---

## What changed in code

| File | Change |
|---|---|
| `lib/stripe-prices.js` | **New.** `getProMonthlyPriceId()` — validates the price, blocks the three Candidate Calculator IDs, throws `PriceConfigError` with a legible cause. |
| `app/api/subscribe/route.js` | Reads the resolver instead of raw `process.env.STRIPE_PRO_PRICE_ID`. Misconfiguration → `503` + explicit server log, not a silent `500`. |
| `app/api/subscribe-instant/route.js` | Removed the `voter_pro`/`civic_pack` `PRICE_MAP`. One price, validated. Was a live landmine for re-mounting Apple Pay. |
| `app/api/webhooks/stripe/route.js` | Both grant paths now **merge** `publicMetadata` instead of replacing it, and set `tier: 'pro'` explicitly. |
| `lib/tier-utils.js` | Collapsed to `free` \| `pro`. Legacy `voter_pro`/`civic_pack` still map to `pro`. |
| `lib/ai-gateway.js` | Spend caps keyed on `pro`; legacy keys retained at the same cap. |
| `app/api/analyze-rep/route.js` | Gates on `'pro'`; error copy says "Pro" not "Civic Pack". |
| `components/SettingsPanel.jsx` | Removed the phantom "Upgrade to Civic Pack" block. **Fixed the upgrade CTA: it advertised "from $3.99/mo"** — Candidate Calculator pricing — while `/pro` charged $9.99. |

## Verification status

- Syntax-checked (ESM parse) — all 7 edited files pass.
- Zero dangling references to every removed identifier.
- `getProMonthlyPriceId()` unit-tested across 6 cases: unset, each foreign ID, a `prod_`
  mistake, and both valid env names.
- **`next build` NOT run.** This sandbox can't: `node_modules/.bin/*` symlinks point at
  the iCloud clone's macOS paths, and the SWC binary is darwin-only with no network to
  fetch a Linux one. **Run `npm run build` on the Mac before deploying.**

## Still open (from the earlier audit, unchanged)

- `RESEND_API_KEY` unset → welcome, **dunning**, cancellation, and net-worth alert emails
  all silently no-op. No dunning means every failed card is permanent churn.
- `X_BOT_*` unset → the `*/15` cron has posted nothing since June 20.
- No `NEXT_PUBLIC_GA_MEASUREMENT_ID` or pixel IDs → no funnel visibility, no attribution.
- Apple Pay still unmounted. Safe to mount **after** step 2 above is done and verified.
