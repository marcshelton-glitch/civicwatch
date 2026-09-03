import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp's native binary never reached the deployed function, so
  // /api/rep-photo/[bioguideId] threw ERR_DLOPEN_FAILED on every request
  // (~1,858 errors in 4 days) — every representative photo on the site was
  // broken, including on /pro.
  //
  // Two things that are NOT the cause, both checked against this repo rather
  // than assumed:
  //   - The linux platform binaries ARE already in package-lock.json, so
  //     `npm install --os=linux --cpu=x64 sharp` changes nothing.
  //   - `serverExternalPackages: ['sharp']` is a no-op: sharp is already listed
  //     in next/dist/lib/server-external-packages.jsonc and auto-externalised.
  //
  // The problem is tracing. sharp loads libvips via dlopen at runtime rather
  // than a static import, so the output file tracer never sees the .so and
  // omits it from the serverless bundle. @img/sharp-libvips-linux-x64 does not
  // even ship a package.json, so it is not resolvable as a module either.
  // Force the binaries in.
  outputFileTracingIncludes: {
    '/api/rep-photo/[bioguideId]': ['./node_modules/@img/**'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // connect.facebook.net (Meta Pixel: fbevents.js) and analytics.tiktok.com
              // (TikTok Pixel: events.js) added 2026-08-29 — conversion-tracking audit
              // found both pixel <script> tags were rendering with a valid pixel ID but
              // silently CSP-blocked from ever loading, so fbq/ttq stayed in queue-stub
              // mode and no PageView/Purchase event ever reached Meta or TikTok. See
              // lib/funnel-track.js and .env.example's "Fix this BEFORE any paid spend" note.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://clerk.civicwatch.app https://*.clerk.accounts.dev https://vercel.live https://va.vercel-scripts.com https://challenges.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://www.google-analytics.com",
              "worker-src 'self' blob:",
              "connect-src 'self' https://*.supabase.co https://api.clerk.dev https://clerk.civicwatch.app https://*.clerk.accounts.dev https://*.clerk.com wss://clerk.civicwatch.app wss://*.clerk.accounts.dev wss://*.clerk.com https://vercel.live https://va.vercel-scripts.com https://cdn.jsdelivr.net https://www.govtrack.us https://api.mobilize.us https://cicero.azavea.com https://api.stripe.com https://projects.propublica.org https://o4511420226142208.ingest.us.sentry.io https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://analytics.tiktok.com https://business-api.tiktok.com https://analytics-ipv6.tiktokw.us",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://vercel.live https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/webhook',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },

images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'bioguide.congress.gov' },
    { protocol: 'https', hostname: 'www.congress.gov' },
    { protocol: 'https', hostname: 'i.pravatar.cc' },
    { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    { protocol: 'https', hostname: 'img.clerk.com' },
  ],
},
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "civicwatch",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
