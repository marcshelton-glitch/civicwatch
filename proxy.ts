import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Page routes and API routes that are open to unauthenticated users
const isPublicRoute = createRouteMatcher([
  '/',
  '/dashboard(.*)',
  '/pro(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about(.*)',
  '/press(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/data-deletion(.*)',
  '/manifest.json',
  '/api/webhooks/(.*)',
  '/api/public-feed(.*)',
  '/api/congress(.*)',
  '/constitution(.*)',
  '/api/rep-photo/:path*',
  '/api/representatives(.*)',
  '/api/district-boundaries(.*)',
  '/api/civic(.*)',
  '/api/nonprofits(.*)',
  '/api/fec(.*)',
  '/api/disclosures(.*)',
  '/api/ptr-trades(.*)',
  '/api/stats(.*)',
  '/leaderboard(.*)',
  '/api/leaderboard(.*)',
  '/api/networth(.*)',
  '/api/og-image(.*)',
  '/api/health(.*)',
  '/trades(.*)',
  '/api/ticker-trades(.*)',
  '/accountability(.*)',
  '/api/accountability-stats(.*)',
  '/api/conflict-score(.*)',
  // Read-only subscriber count rendered by ProCountBanner on /pro. /pro is a
  // public route, so the banner's fetch came from signed-out visitors and was
  // answered with 401 by this middleware — the social-proof counter on the
  // pricing page has therefore never rendered for the exact audience it exists
  // to persuade. Returns an aggregate integer only; no customer data.
  '/api/pro-count(.*)',
  // Same bug class as /api/pro-count above: app/api/funnel-event/route.js was
  // deliberately written with no auth requirement (`auth().catch(() => ({
  // userId: null }))`) because signed-out visitors click "Go Pro" too, and
  // trackPurchase() itself doesn't gate on being logged in. But this route
  // was never added here, so Clerk middleware 401'd every anonymous call
  // before the route's own no-auth-required logic ever ran — meaning every
  // upgrade-CTA click from a signed-out visitor, and any trackPurchase() call
  // that fires without an active session, silently never reached
  // funnel_events. Confirmed via a live diagnostic POST returning 401 before
  // this fix. Pixel events (Meta/TikTok) are unaffected by this — they run
  // client-side and don't hit this endpoint's auth gate — only the
  // first-party Supabase click/purchase log was blocked.
  '/api/funnel-event(.*)',
  '/refund-policy(.*)',
  '/robots.txt',
  '/sitemap.xml',
  // Cron-only endpoints: authenticate themselves via `Authorization: Bearer
  // CRON_SECRET` inside the route handler, not Clerk sessions. Without these
  // entries, Clerk middleware intercepts the request first and issues a
  // handshake redirect (no session cookie present on cron/curl calls), so
  // the route's own auth check never runs — the same class of bug that
  // blocked robots.txt/sitemap.xml above.
  '/api/alerts/x-bot(.*)',
  '/api/send-alerts(.*)',
  // Same bug, same fix, third time in this file (task #6, 2026-09-04):
  // app/api/push/send/route.js authenticates via `Authorization: Bearer
  // INTERNAL_API_SECRET` inside the handler, exactly like the two cron
  // routes just above — but was never added here, so every call was
  // rejected by Clerk (curl has no session cookie) before the route's own
  // checkAuth() ever ran. Confirmed live: the response carried
  // x-clerk-auth-reason: token-invalid and x-clerk-auth-status: signed-out,
  // and a temporary diagnostic added directly to the route's JSON response
  // never appeared in any response — proof the handler was never reached.
  // Hours were spent suspecting INTERNAL_API_SECRET itself (rotating it,
  // re-saving it three different ways) before checking here; it was never
  // the problem.
  '/api/push/send(.*)',
])

// Only Stripe checkout and billing portal require authentication at middleware level
const isProtectedApiRoute = createRouteMatcher([
  '/api/subscribe(.*)',
  '/api/billing-portal(.*)',
  '/api/push-subscribe(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedApiRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (!isPublicRoute(request)) {
    // Remaining non-public routes (e.g. /api/analyze-rep) keep their own auth checks
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
})

export const config = {
  matcher: [
    // NOTE: .txt and .xml were previously missing from this extension exclusion
    // list, so /robots.txt and /sitemap.xml were being routed through Clerk
    // middleware. Neither path is in isPublicRoute, so both were falling
    // through to the auth check and returning 401 Unauthorized to anyone
    // without a session — including Googlebot. That meant search engines
    // could not fetch crawl directives or the page list, which is almost
    // certainly why civicwatch.app wasn't showing up in organic search
    // results beyond the bare homepage. Adding txt|xml here, plus the
    // explicit isPublicRoute entries above as a defense-in-depth backstop,
    // fixes both.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
}
