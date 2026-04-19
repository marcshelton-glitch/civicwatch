/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Security Headers ───────────────────────────────────────────────────────
  // Applied to every response. Protects against clickjacking, MIME sniffing,
  // XSS, and information leakage.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking — disallow iframe embedding
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS for 1 year, include subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Restrict referrer information sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by the app
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Basic XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Content Security Policy
          // - default-src self: only load resources from our own domain
          // - script-src: allow Next.js inline scripts and Stripe.js
          // - style-src: allow inline styles (used heavily in CivicWatch.jsx)
          // - img-src: allow Congress.gov bioguide photos, pravatar fallbacks
          // - connect-src: allow API calls to our own routes and Supabase
          // - frame-src: allow Stripe checkout iframe
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://bioguide.congress.gov https://i.pravatar.cc https://cdn.jsdelivr.net",
              "connect-src 'self' https://*.supabase.co https://api.clerk.dev https://clerk.civicwatch.app",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      // ── Webhook route: allow Stripe's content-type ──────────────────────
      {
        source: '/api/webhook',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },

  // ── Image domains: allow Congress.gov and pravatar for rep photos ──────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'bioguide.congress.gov' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    ],
  },
}

export default nextConfig
