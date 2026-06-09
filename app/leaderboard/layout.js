export const metadata = {
  title: 'Congressional Trading Leaderboard — CivicWatch',
  description: 'Which members of Congress trade stocks most aggressively? Rankings by trade volume, frequency, and portfolio size — sourced from official STOCK Act disclosures.',
  openGraph: {
    title: 'Congressional Trading Leaderboard — CivicWatch',
    description: 'Which members of Congress trade stocks most aggressively? Rankings by trade volume, frequency, and portfolio size.',
    url: 'https://civicwatch.app/leaderboard',
    siteName: 'CivicWatch',
    images: [{ url: '/api/og-image?type=home', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Congressional Trading Leaderboard — CivicWatch',
    description: 'Which members of Congress trade stocks most aggressively? STOCK Act rankings.',
    images: ['/api/og-image?type=home'],
  },
}

export default function LeaderboardLayout({ children }) {
  return children
}
