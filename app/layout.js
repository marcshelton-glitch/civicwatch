import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'CivicWatch — Your Representatives. Accountable.',
  description: 'Track your elected representatives at every level of government. View voting records, stock trades, wealth disclosures, and town halls — all in one place.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
  },
  openGraph: {
    title: 'CivicWatch — Your Representatives. Accountable.',
    description: 'Track voting records, stock trades, wealth disclosures, and town halls for every elected official at every level of government.',
    url: 'https://www.civicwatch.app',
    siteName: 'CivicWatch',
    images: [
      {
        url: 'https://www.civicwatch.app/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'CivicWatch — Your Representatives. Accountable.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicWatch — Your Representatives. Accountable.',
    description: 'Track voting records, stock trades, and town halls for every elected official.',
    images: ['https://www.civicwatch.app/opengraph-image'],
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}