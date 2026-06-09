export const metadata = {
  title: 'About — CivicWatch',
  description:
    'CivicWatch exists because transparency is the foundation of democracy. Learn about our mission, data sources, and the STOCK Act.',
  openGraph: {
    title: 'About — CivicWatch',
    description:
      'CivicWatch exists because transparency is the foundation of democracy. Learn about our mission, data sources, and the STOCK Act.',
    url: 'https://civicwatch.app/about',
    siteName: 'CivicWatch',
    images: [{ url: '/api/og-image?type=home', width: 1200, height: 630 }],
  },
}

export default function AboutLayout({ children }) {
  return children
}
