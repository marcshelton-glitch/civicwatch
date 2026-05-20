export const metadata = {
  title: 'Congressional Trading Leaderboard — CivicWatch',
  description: 'Which members of Congress trade stocks most aggressively? Rankings by trade volume, frequency, and portfolio size — sourced from official STOCK Act disclosures.',
  openGraph: {
    title: 'Congressional Trading Leaderboard — CivicWatch',
    description: 'Which members of Congress trade stocks most aggressively? Rankings by trade volume, frequency, and portfolio size.',
    url: 'https://civicwatch.app/leaderboard',
    siteName: 'CivicWatch',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Congressional Trading Leaderboard — CivicWatch',
    description: 'Which members of Congress trade stocks most aggressively? STOCK Act rankings.',
  },
}

export default function LeaderboardLayout({ children }) {
  return children
}
