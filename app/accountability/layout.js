export const metadata = {
  title: 'Congressional Stock Trading Accountability Dashboard — CivicWatch',
  description: 'A live, continuously updated view of how much of Congress trades individual stocks — party breakdown, trade volume trends, and the most-traded tickers, sourced from official STOCK Act disclosures.',
  openGraph: {
    title: 'Congressional Stock Trading Accountability Dashboard — CivicWatch',
    description: 'How much of Congress trades individual stocks, live and continuously updated — party breakdown, trade volume trends, most-traded tickers.',
    url: 'https://civicwatch.app/accountability',
    siteName: 'CivicWatch',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Congressional Stock Trading Accountability Dashboard — CivicWatch',
    description: 'How much of Congress trades individual stocks, live and continuously updated.',
  },
}

export default function AccountabilityLayout({ children }) {
  return children
}
