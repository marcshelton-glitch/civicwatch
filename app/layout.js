import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import CookieBanner from '@/components/CookieBanner'
import ScrollIndicator from '@/components/ScrollIndicator'
import StickyProBar from '@/components/StickyProBar'
import ConsentGatedAnalytics from '@/components/ConsentGatedAnalytics'
import './globals.css'

export const viewport = {
  themeColor: '#0a0f1e',
}

export const metadata = {
  // Required: openGraph.images and twitter.images below are relative paths.
  // Without metadataBase, Next resolves them against http://localhost:3000 —
  // so every link shared to X, Facebook, LinkedIn or iMessage renders a broken
  // preview card. Silent in production; only visible as a build warning.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.civicwatch.app'),
  title: 'CivicWatch — See What Congress Is Buying',
  description: 'Your representatives are trading stocks with information you don\'t have. Track every trade, every vote, every dollar. Real-time congressional accountability — free.',
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
    title: 'CivicWatch — See What Congress Is Buying',
    description: 'Your representatives are trading stocks with information you don\'t have. Track every trade, every vote, every dollar. Real-time congressional accountability — free.',
    url: 'https://civicwatch.app',
    siteName: 'CivicWatch',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CivicWatch — See What Congress Is Buying',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicWatch — See What Congress Is Buying',
    description: 'Your representatives are trading stocks with information you don\'t have. Track every trade, every vote, every dollar. Real-time congressional accountability — free.',
    images: ['/og-image.png'],
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
          {/* Keyboard users land here first and can jump past the nav.
              tabIndex -1 on the target so focus actually moves there. */}
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <ServiceWorkerRegistration />
          {/* body is a column flex container and pages size themselves with
              min-height:100vh as its flex children. This wrapper mirrors that
              context so wrapping changes nothing about how they lay out. */}
          <div id="main-content" tabIndex={-1} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {children}
          </div>
          <CookieBanner />
          <ScrollIndicator />
          <StickyProBar />
          {/* Vercel Analytics, Speed Insights, GA, Meta Pixel and TikTok Pixel
              all mount from here and only after the user opts in. Env vars:
              NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_META_PIXEL_ID,
              NEXT_PUBLIC_TIKTOK_PIXEL_ID. */}
          <ConsentGatedAnalytics
            gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
            metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
            tiktokPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}