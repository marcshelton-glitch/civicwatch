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
  '/privacy(.*)',
  '/terms(.*)',
  '/data-deletion(.*)',
  '/api/webhooks/(.*)',
  '/api/public-feed(.*)',
  '/api/congress(.*)',
  '/api/representatives(.*)',
  '/api/civic(.*)',
  '/api/nonprofits(.*)',
  '/api/fec(.*)',
  '/api/disclosures(.*)',
  '/api/ptr-trades(.*)',
  '/api/stats(.*)',
  '/leaderboard(.*)',
  '/api/leaderboard(.*)',
  '/api/networth(.*)',
])

// Only Stripe checkout and billing portal require authentication at middleware level
const isProtectedApiRoute = createRouteMatcher([
  '/api/subscribe(.*)',
  '/api/billing-portal(.*)',
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
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
