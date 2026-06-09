export const metadata = {
  title: 'Dashboard — CivicWatch',
  description: 'Track congressional stock trades, voting records, and net worth for all 535 members of Congress. Updated daily from official STOCK Act disclosures.',
  openGraph: {
    title: 'Dashboard — CivicWatch',
    description: 'Track congressional stock trades, voting records, and net worth for all 535 members of Congress.',
    url: 'https://civicwatch.app/dashboard',
    siteName: 'CivicWatch',
    images: [{ url: '/api/og-image?type=home', width: 1200, height: 630 }],
  },
}

export default function DashboardLayout({ children }) {
  return children
}
