export const metadata = {
  title: 'Go Pro — CivicWatch',
  description: 'Unlock full AI accountability reports, trade conflict analysis, wealth trajectories, real-time alerts, and local representative lookup with CivicWatch Pro for $9.99/month.',
  openGraph: {
    title: 'Go Pro — CivicWatch',
    description: 'Unlock AI accountability reports, trade conflict analysis, wealth trajectory data, and real-time congressional alerts.',
    url: 'https://civicwatch.app/pro',
    siteName: 'CivicWatch',
    images: [{ url: '/api/og-image?type=home', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Go Pro — CivicWatch',
    description: 'Unlock AI accountability reports, trade conflict analysis, and real-time congressional alerts.',
    images: ['/api/og-image?type=home'],
  },
}

export default function ProLayout({ children }) {
  return children
}
