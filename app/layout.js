import { ClerkProvider } from '@clerk/nextjs'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import CookieBanner from '@/components/CookieBanner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const viewport = {
  themeColor: '#0a0f1e',
}

export const metadata = {
  title: 'CivicWatch — Your Representatives, Accountable',
  description: 'Track your U.S. representatives\' stock trades, net worth, legislation, and more. Real transparency, in real time.',
  keywords: 'congress stock trades, representative financial disclosure, STOCK Act, congressional transparency, civicwatch',
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'CivicWatch',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  },
  openGraph: {
    title: 'CivicWatch — Your Representatives, Accountable',
    description: 'Track your U.S. representatives\' stock trades, net worth, legislation, and more. Real transparency, in real time.',
    url: 'https://civicwatch.app',
    siteName: 'CivicWatch',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CivicWatch — Your Representatives, Accountable',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicWatch — Your Representatives, Accountable',
    description: 'Track your U.S. representatives\' stock trades, net worth, legislation, and more. Real transparency, in real time.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'dYkgYgk80Pl5OyCxB9q6Co6daeeKR2vJ4I06N8Sd5Js',
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
      <html lang="en">
        <body>
          <ServiceWorkerRegistration />
          {children}
          <CookieBanner />
          <Analytics />
          <SpeedInsights />
          {/* GA Measurement ID set via NEXT_PUBLIC_GA_MEASUREMENT_ID Vercel env var */}
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        </body>
      </html>
    </ClerkProvider>
  )
}