import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/constitution(.*)',
  '/about(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/data-deletion(.*)',
  '/api/webhooks/stripe(.*)',
  '/api/rep-photo/:path*',
  '/api/representatives(.*)',
  '/api/district-boundaries(.*)',
  '/api/congress(.*)',
  '/api/public-feed(.*)',
  '/api/leaderboard(.*)',
  '/api/stats(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
