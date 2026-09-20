// Cookie/tracker consent state.
//
// Under GDPR + ePrivacy, non-essential trackers must not fire before the user
// opts in, and rejecting must be as easy as accepting. This module is the
// single source of truth for that decision; everything non-essential reads it.
//
// Not gated (necessary, legitimate interest — these run regardless):
//   Clerk session, Stripe checkout, basic Sentry *error* capture.
// Gated:
//   analytics  -> Vercel Analytics, Speed Insights, Google Analytics,
//                 Sentry Session Replay + PII
//   marketing  -> Meta Pixel, TikTok Pixel

export const CONSENT_KEY = 'cookie_consent'
export const CONSENT_VERSION = 2
export const CONSENT_EVENT = 'civicwatch:consent-change'

// Fired by the footer's "Cookie choices" control to reopen the banner.
// GDPR requires withdrawing consent to be as easy as giving it.
export const REOPEN_EVENT = 'civicwatch:consent-reopen'

export const DENIED = { analytics: false, marketing: false }
export const GRANTED = { analytics: true, marketing: true }

/**
 * Current consent, or null when the user has not chosen yet.
 * null means "show the banner and fire nothing".
 */
export function readConsent() {
  if (typeof window === 'undefined') return null

  let raw
  try {
    raw = window.localStorage.getItem(CONSENT_KEY)
  } catch {
    // Private mode / blocked storage. Treat as undecided and deny.
    return null
  }
  if (!raw) return null

  // Legacy v1 value. The old banner wrote '1' on Accept, but it was
  // accept-only and gated nothing, so it is not a record of informed,
  // freely-given consent. Re-prompt rather than inherit it.
  if (raw === '1') return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.v !== CONSENT_VERSION) return null
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      ts: parsed.ts,
    }
  } catch {
    return null
  }
}

/** Persist a choice and notify listeners in this tab. */
export function writeConsent(choice) {
  const record = {
    v: CONSENT_VERSION,
    analytics: choice.analytics === true,
    marketing: choice.marketing === true,
    ts: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
  } catch {
    // Storage blocked: the choice applies to this page view only.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }))
  return record
}

/** Has the user made any choice yet? */
export function hasDecided() {
  return readConsent() !== null
}

/** Effective permissions, denying everything until a choice exists. */
export function effectiveConsent() {
  return readConsent() || DENIED
}

/**
 * Subscribe to consent changes. Returns an unsubscribe function.
 * Also listens to `storage` so a choice made in another tab applies here.
 */
export function onConsentChange(handler) {
  if (typeof window === 'undefined') return () => {}
  const local = () => handler(effectiveConsent())
  const cross = (e) => {
    if (e.key === CONSENT_KEY) handler(effectiveConsent())
  }
  window.addEventListener(CONSENT_EVENT, local)
  window.addEventListener('storage', cross)
  return () => {
    window.removeEventListener(CONSENT_EVENT, local)
    window.removeEventListener('storage', cross)
  }
}
