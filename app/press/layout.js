export const metadata = {
  title: 'Press & Media — CivicWatch',
  description:
    'CivicWatch makes congressional financial data accessible to the public. Press kit, key facts, and media contact information.',
  openGraph: {
    title: 'Press & Media — CivicWatch',
    description:
      'CivicWatch makes congressional financial data accessible to the public. Press kit, key facts, and media contact information.',
    url: 'https://civicwatch.app/press',
    siteName: 'CivicWatch',
    images: [{ url: '/api/og-image?type=home', width: 1200, height: 630 }],
  },
}

export default function PressLayout({ children }) {
  return children
}
