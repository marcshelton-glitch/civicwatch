import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'CivicWatch — Your Representatives, Accountable',
  description: 'Track your U.S. representatives\' stock trades, net worth, legislation, and more. Real transparency, in real time.',
  keywords: 'congress stock trades, representative financial disclosure, STOCK Act, congressional transparency, civicwatch',
  robots: { index: true, follow: true },
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