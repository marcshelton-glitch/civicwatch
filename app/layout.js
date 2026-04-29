import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'CivicWatch — Your Representatives. Accountable.',
  description: 'Track your elected representatives at every level of government. View voting records, stock trades, wealth disclosures, and town halls — all in one place.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏛️</text></svg>",
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