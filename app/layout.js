import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import CookieBanner from '@/components/CookieBanner'
import ScrollIndicator from '@/components/ScrollIndicator'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

export const viewport = {
  themeColor: '#0a0f1e',
}

export const metadata = {
  metadataBase: new URL('https://civicwatch.app'),
  title: 'CivicWatch — Track Congressional Stock Trades in Real Time',
  description: 'Your representatives trade stocks, cast votes, and build wealth while serving you. See exactly what they\'re doing.',
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
    title: 'CivicWatch — Track Congressional Stock Trades in Real Time',
    description: 'Your representatives trade stocks, cast votes, and build wealth while serving you. See exactly what they\'re doing.',
    url: 'https://civicwatch.app',
    siteName: 'CivicWatch',
    images: [
      {
        url: '/api/og-image?type=home',
        width: 1200,
        height: 630,
        alt: 'CivicWatch — Track Congressional Stock Trades in Real Time',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicWatch — Track Congressional Stock Trades in Real Time',
    description: 'Your representatives trade stocks, cast votes, and build wealth while serving you. See exactly what they\'re doing.',
    images: ['/api/og-image?type=home'],
  },
  verification: {
    google: 'dYkgYgk80Pl5OyCxB9q6Co6daeeKR2vJ4I06N8Sd5Js',
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard">
      <html lang="en" className={inter.variable}>
        <body>
          <ServiceWorkerRegistration />
          {children}
          <CookieBanner />
          <ScrollIndicator />
          <Analytics />
          <SpeedInsights />
          {/* GA Measurement ID set via NEXT_PUBLIC_GA_MEASUREMENT_ID Vercel env var */}
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        </body>
      </html>
    </ClerkProvider>
  )
}