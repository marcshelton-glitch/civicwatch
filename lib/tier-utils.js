/**
 * getUserTier — resolve the user's access tier from Clerk publicMetadata.
 * Works on both server (currentUser().publicMetadata) and client (user.publicMetadata).
 *
 * Backward compat: existing users with isPro:true → 'civic_pack'
 * New schema: explicit tier field ('free' | 'voter_pro' | 'civic_pack')
 */
export function getUserTier(user) {
  const meta = user?.publicMetadata ?? {}
  if (meta.tier === 'civic_pack') return 'civic_pack'
  if (meta.tier === 'voter_pro') return 'voter_pro'
  if (meta.isPro === true) return 'civic_pack'
  return 'free'
}

/** Returns true when user's tier is at least `minimum`. */
export function tierAtLeast(tier, minimum) {
  const ORDER = { free: 0, voter_pro: 1, civic_pack: 2 }
  return (ORDER[tier] ?? 0) >= (ORDER[minimum] ?? 0)
}

export const TIER_LABELS = {
  free: 'Free',
  voter_pro: 'Voter Pro',
  civic_pack: 'Civic Pack',
}
