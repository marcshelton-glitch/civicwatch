export const metadata = {
  title: 'Search Congressional Stock Trades by Ticker — CivicWatch',
  description: 'See every member of Congress who has disclosed a trade in a specific stock — STOCK Act periodic transaction reports, searchable by ticker.',
  openGraph: {
    title: 'Search Congressional Stock Trades by Ticker — CivicWatch',
    description: 'Who in Congress traded this stock? Search STOCK Act disclosures by ticker.',
    url: 'https://civicwatch.app/trades',
    siteName: 'CivicWatch',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Congressional Stock Trades by Ticker — CivicWatch',
    description: 'Who in Congress traded this stock? Search STOCK Act disclosures by ticker.',
  },
}

export default function TradesLayout({ children }) {
  return children
}
