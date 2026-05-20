export const metadata = {
  title: '404 — Page Not Found | CivicWatch',
  description: 'This page could not be found. Visit CivicWatch to track congressional stock trades, voting records, and financial disclosures.',
}

export default function NotFound() {
  return (
    <div style={{
      background: '#0A1628', minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480, textAlign: 'center', padding: '48px 40px',
        background: 'rgba(27,42,107,0.4)', border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🏛️</div>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: 64, color: 'rgba(212,175,55,0.25)', lineHeight: 1,
          marginBottom: 16, letterSpacing: '-2px',
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: 24, color: '#F8F9FF', marginBottom: 12,
        }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: '#8892A4', lineHeight: 1.7, marginBottom: 32 }}>
          This page doesn't exist or has been moved.
          Head back to the dashboard to keep watching your representatives.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/dashboard"
            style={{
              padding: '10px 24px', background: '#B22234', border: 'none',
              borderRadius: 10, color: 'white', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              display: 'inline-block',
            }}>
            Go to Dashboard
          </a>
          <a
            href="/"
            style={{
              padding: '10px 24px', background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10,
              color: '#D4AF37', fontFamily: 'inherit', fontSize: 13,
              fontWeight: 700, textDecoration: 'none', display: 'inline-block',
            }}>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
