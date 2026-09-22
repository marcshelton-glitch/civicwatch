export const metadata = {
  title: 'Go Pro — CivicWatch',
  description: 'Unlock full AI accountability reports, trade conflict analysis, and wealth trajectories with CivicWatch Pro for $9.99/month. Tracking, alerts, and local rep lookup stay free.',
  openGraph: {
    title: 'Go Pro — CivicWatch',
    description: 'Every disclosed congressional stock trade, checked against the committees the member sat on. Full AI accountability reports and wealth trajectories.',
    url: 'https://civicwatch.app/pro',
    siteName: 'CivicWatch',
    images: [{ url: '/api/og-image?type=home', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Go Pro — CivicWatch',
    description: 'Every disclosed congressional stock trade, checked against the committees the member sat on. Full AI accountability reports and wealth trajectories.',
    images: ['/api/og-image?type=home'],
  },
}

export default function ProLayout({ children }) {
  return children
}
