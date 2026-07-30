/**
 * getUserTier — resolve the user's access tier from Clerk publicMetadata.
 * Works on both server (currentUser().publicMetadata) and client (user.publicMetadata).
 *
 * ── CivicWatch has exactly two tiers: 'free' and 'pro' ($9.99/mo) ──────────
 * An earlier three-tier model ('voter_pro' / 'civic_pack') came from the
 * California Candidate Calculator, a separate product, and was never sold on
 * civicwatch.app — /pro has only ever advertised the single $9.99/mo plan.
 * Both legacy values are still recognised below so any account that picked one
 * up keeps its access; both map to 'pro'.
 */
export function getUserTier(user) {
  const meta = user?.publicMetadata ?? {}
  // Legacy values from the Candidate Calculator's model — treat as Pro.
  if (meta.tier === 'pro' || meta.tier === 'civic_pack' || meta.tier === 'voter_pro') return 'pro'
  if (meta.isPro === true) return 'pro'
  return 'free'
}

/** Returns true when the user's tier is at least `minimum`. */
export function tierAtLeast(tier, minimum) {
  const ORDER = { free: 0, pro: 1 }
  return (ORDER[tier] ?? 0) >= (ORDER[minimum] ?? 0)
}

export const TIER_LABELS = {
  free: 'Free',
  pro: 'Pro',
}
