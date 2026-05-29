import Link from 'next/link'

export const metadata = {
  title: 'Request Received | CivicWatch',
}

const S = {
  navy:    '#0A1628',
  navyMid: '#1B2A6B',
  gold:    '#D4AF37',
  white:   '#F5F0E8',
  gray:    '#8892A4',
  grayLight: '#CDD2E0',
  border:  'rgba(212,175,55,0.2)',
  red:     '#B22234',
}

export default function RefundSuccessPage() {
  return (
    <div style={{ background: S.navy, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Source Serif 4', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .success-btn:hover { background: #E8C84A !important; }
      `}</style>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          background: 'rgba(13,30,53,0.85)',
          border: `1px solid ${S.border}`,
          borderRadius: 16,
          padding: '56px 48px',
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
        }}>
          {/* Icon */}
          <div style={{ fontSize: 52, marginBottom: 24, lineHeight: 1 }}>🏛️</div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: 28,
            color: S.white,
            margin: '0 0 16px',
            lineHeight: 1.3,
          }}>
            We&rsquo;re sorry to see you go.
          </h1>

          <p style={{ fontSize: 16, color: S.gold, margin: '0 0 20px', fontStyle: 'italic', lineHeight: 1.6 }}>
            But you&rsquo;re welcome to come back anytime &mdash; we&rsquo;ll be waiting for you.
          </p>

          <div style={{ width: 48, height: 2, background: `linear-gradient(90deg, ${S.red}, ${S.gold})`, margin: '0 auto 24px', borderRadius: 2 }} />

          <p style={{ fontSize: 14, color: S.grayLight, margin: '0 0 36px', lineHeight: 1.8 }}>
            Your request has been received and will be reviewed within{' '}
            <strong style={{ color: S.white }}>2 business days</strong>. You&rsquo;ll receive an email at your account
            address once a decision has been made.
          </p>

          <Link
            href="/"
            className="success-btn"
            style={{
              display: 'inline-block',
              background: S.gold,
              color: '#0A1628',
              textDecoration: 'none',
              borderRadius: 6,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              letterSpacing: 0.5,
              transition: 'background 0.2s',
            }}
          >
            Return to Home
          </Link>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${S.border}`, padding: '16px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: S.gray }}>
          Questions? <a href="mailto:support@civicwatch.app" style={{ color: S.gold, textDecoration: 'underline' }}>support@civicwatch.app</a>
        </div>
      </footer>
    </div>
  )
}
