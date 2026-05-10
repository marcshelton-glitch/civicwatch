/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist uses Node.js workers and must not be bundled by Next.js/Turbopack
  serverExternalPackages: ['pdfjs-dist'],

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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://clerk.civicwatch.app https://vercel.live https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "worker-src 'self' blob:",
              "connect-src 'self' https://*.supabase.co https://api.clerk.dev https://clerk.civicwatch.app https://*.clerk.com https://vercel.live https://cdn.jsdelivr.net https://www.govtrack.us https://api.mobilize.us https://cicero.azavea.com https://api.stripe.com https://projects.propublica.org",
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

export default nextConfig