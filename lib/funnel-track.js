'use client'

// Fire-and-forget upgrade-funnel tracking.
//
// Added 2026-08-20 (docs/paywall-funnel-audit.md) — until now none of the
// upgrade CTAs fired any event anywhere, so there was no way to tell which of
// the five entry points (pro hero, comparison card, bottom CTA, in-context
// lock overlays, Settings upsell) actually drives checkouts vs. gets clicked
// and abandoned. This does two things on every call, neither of which can
// block or delay the checkout redirect it's placed next to:
//
//   1. Forwards to window.gtag if GA is ever wired up (NEXT_PUBLIC_GA_MEASUREMENT_ID
//      is unset today per the audit — this is a no-op until it is, not a
//      requirement).
//   2. Best-effort POSTs to /api/funnel-event → funnel_events (Supabase), so
//      there's at least first-party click data on day one regardless of
//      whether a third-party analytics tool ever gets configured.
//
// Call this, then immediately do the checkout/navigation — do not await it.

export function trackUpgradeClick(location, metadata = {}) {
  if (typeof window === 'undefined') return

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'upgrade_click', { location, ...metadata })
    }
  } catch {
    // never let analytics forwarding break the click handler
  }

  try {
    const payload = JSON.stringify({ eventName: 'upgrade_click', location, metadata })
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/funnel-event', blob)
    } else {
      fetch('/api/funnel-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // best-effort only
  }
}

// Bottom-of-funnel: fire once when a Pro subscription actually completes.
//
// Added 2026-08-27 — checkout success only ever reflected in the /dashboard
// success banner (?upgrade=success); neither the Meta Pixel nor the TikTok
// Pixel had a Purchase/CompletePayment call anywhere, so both pixels only
// ever saw PageViews and neither ad platform could optimize toward buyers or
// build a Purchase-based lookalike audience. Both fire from the browser
// because CivicWatch has no server-side Conversions API integration for
// either platform yet — this is client pixel only, so an ad blocker or
// third-party-cookie-blocking browser will undercount it. That's a known gap,
// not something this call can fix.
//
// Call this from the success redirect landing (both the Stripe Checkout
// success_url and the wallet/subscribe-instant flow route there), guarded so
// it only ever fires once per completed purchase — see the sessionStorage
// dedupe at the call site.
export function trackPurchase(value, metadata = {}) {
  if (typeof window === 'undefined') return

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'purchase', { value, currency: 'USD', ...metadata })
    }
  } catch {
    // never let analytics forwarding break the success flow
  }

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Purchase', { value, currency: 'USD' })
    }
  } catch {
    // never let one pixel's failure block the other
  }

  try {
    if (typeof window.ttq?.track === 'function') {
      // TikTok's standard event name for a completed purchase is
      // CompletePayment, not "Purchase" — Meta and TikTok name this
      // differently.
      window.ttq.track('CompletePayment', { value, currency: 'USD' })
    }
  } catch {
    // never let one pixel's failure block the other
  }

  try {
    const payload = JSON.stringify({ eventName: 'purchase', location: 'dashboard_upgrade_success', metadata: { value, currency: 'USD', ...metadata } })
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/funnel-event', blob)
    } else {
      fetch('/api/funnel-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // best-effort only
  }
}
