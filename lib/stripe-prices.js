/**
 * Single source of truth for CivicWatch Stripe price IDs.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 * Price IDs from a *different* product (the California Candidate Calculator)
 * were set on this Vercel project by mistake:
 *
 *   STRIPE_VOTER_PRO_MONTHLY_PRICE_ID   price_1Tmk39Pe8la2Z0hh4yDJnWca
 *   STRIPE_VOTER_PRO_ONETIME_PRICE_ID   price_1Tmk3DPe8la2Z0hhnM08fsN8
 *   STRIPE_CIVIC_PACK_ONETIME_PRICE_ID  price_1Tmk3FPe8la2Z0hh5tGr95kY
 *
 * Both apps share one Stripe account, so these IDs are *valid* — Stripe will
 * happily charge against them. That is exactly the danger: a wrong-but-valid
 * price fails silently at the API and loudly on the customer's statement.
 *
 * getProMonthlyPriceId() therefore does two things a bare env read cannot:
 *   1. Fails fast and legibly when the price is unset (previously a generic
 *      500 — "Failed to create checkout session" — with no cause in the logs).
 *   2. Hard-rejects the three known foreign IDs so they can never be charged
 *      against CivicWatch, no matter what ends up in the environment.
 */

/** Price IDs that belong to the California Candidate Calculator, not CivicWatch. */
const FOREIGN_PRICE_IDS = new Set([
  'price_1Tmk39Pe8la2Z0hh4yDJnWca',
  'price_1Tmk3DPe8la2Z0hhnM08fsN8',
  'price_1Tmk3FPe8la2Z0hh5tGr95kY',
])

export class PriceConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PriceConfigError'
  }
}

/**
 * Resolve the CivicWatch Pro monthly price ID ($9.99/mo).
 *
 * Reads STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID, falling back to the legacy
 * STRIPE_PRO_PRICE_ID name so this can ship without a simultaneous env rename.
 *
 * @throws {PriceConfigError} when unset, malformed, or pointing at another product.
 */
export function getProMonthlyPriceId() {
  const priceId =
    process.env.STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID ||
    process.env.STRIPE_PRO_PRICE_ID

  if (!priceId) {
    throw new PriceConfigError(
      'No CivicWatch Pro price configured. Set STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID ' +
        'in Vercel to the price ID of the CivicWatch Pro $9.99/mo recurring price. ' +
        'Do NOT reuse STRIPE_VOTER_PRO_MONTHLY_PRICE_ID — that price belongs to the ' +
        'California Candidate Calculator.'
    )
  }

  if (FOREIGN_PRICE_IDS.has(priceId)) {
    throw new PriceConfigError(
      `Refusing to charge against ${priceId}: this price belongs to the California ` +
        'Candidate Calculator, not CivicWatch. Point ' +
        'STRIPE_CIVICWATCH_PRO_MONTHLY_PRICE_ID at a CivicWatch price.'
    )
  }

  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) {
    throw new PriceConfigError(
      `Malformed Stripe price ID: "${priceId}". Expected a value starting with "price_". ` +
        'A product ID ("prod_…") or a payment-link URL will not work here.'
    )
  }

  return priceId
}

/**
 * Non-throwing probe of the Pro price configuration, for health checks.
 *
 * A misconfigured price is invisible until a real customer clicks Upgrade and
 * gets a 503 — by which point the sale is already lost. This lets /api/health
 * surface the same condition without leaking the price ID itself.
 *
 * @returns {{ ok: boolean, reason: string | null }}
 */
export function checkProPriceConfig() {
  try {
    getProMonthlyPriceId()
    return { ok: true, reason: null }
  } catch (err) {
    if (err instanceof PriceConfigError) return { ok: false, reason: err.message }
    return { ok: false, reason: 'Unexpected error resolving Pro price' }
  }
}
