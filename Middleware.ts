import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  '/',                      // landing page
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacy(.*)',           // ← ADD
  '/terms(.*)',
  '/data-deletion(.*)',     // ← ADD
  '/api/webhook(.*)',       // Stripe webhook must be public (no Clerk session)
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}