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
