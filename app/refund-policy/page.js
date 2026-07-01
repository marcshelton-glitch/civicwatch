import Link from 'next/link'

export const metadata = {
  title: 'Refund Policy | CivicWatch',
  description: 'CivicWatch refund policy — eligibility, process, and timelines.',
}

const EFFECTIVE_DATE = 'June 30, 2026'
const CONTACT_EMAIL = 'support@civicwatch.app'

const S = {
  navy:      '#0A1628',
  gold:      '#D4AF37',
  white:     '#F5F0E8',
  gray:      '#8892A4',
  grayLight: '#CDD2E0',
  border:    'rgba(212,175,55,0.2)',
  red:       '#B22234',
  navyMid:   '#1B2A6B',
}

const H2 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: S.white, marginBottom: 12, marginTop: 0 }
const P  = { fontSize: 14, color: S.grayLight, lineHeight: 1.85, margin: '0 0 10px' }

export default function RefundPolicyPage() {
  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .rp-link { color: ${S.gold}; text-decoration: underline; }
        .rp-link:hover { color: #E8C84A; }
      `}</style>

      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.97)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: S.white, textDecoration: 'none', letterSpacing: 0.5 }}>
          🏛️ Civic<span style={{ color: S.gold }}>Watch</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: S.gray, textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px' }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 36, color: S.white, margin: '0 0 10px' }}>
            Refund Policy
          </h1>
          <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>Effective date: {EFFECTIVE_DATE}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <p style={P}>
            CivicWatch (&ldquo;CivicWatch,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) wants you
            to be satisfied with your subscription. This policy describes when refunds are available and how to request one.
          </p>

          <div>
            <h2 style={H2}>1. 7-Day Refund Window</h2>
            <p style={P}>
              If you are a new Pro subscriber and are not satisfied, you may request a full refund within{' '}
              <strong style={{ color: S.white }}>7 days of your initial purchase</strong>. No reason is required.
              Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="rp-link">{CONTACT_EMAIL}</a> within 7 days of
              your first charge and we will issue a full refund.
            </p>
          </div>

          <div>
            <h2 style={H2}>2. After the 7-Day Window</h2>
            <p style={P}>
              After the 7-day window has passed, subscription fees are non-refundable. There are no prorated refunds
              for partial months. If you cancel your subscription, your Pro access continues until the end of the
              current billing period, after which it will not renew.
            </p>
          </div>

          <div>
            <h2 style={H2}>3. Cancellations</h2>
            <p style={P}>
              You may cancel your Pro subscription at any time from your account settings. Cancellations take effect
              at the end of the current billing period — you will not be charged again, and you will retain Pro access
              through the period you have already paid for.
            </p>
          </div>

          <div>
            <h2 style={H2}>4. Contact</h2>
            <p style={P}>
              Questions about this policy or your subscription?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="rp-link">{CONTACT_EMAIL}</a>
            </p>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${S.border}`, padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12 }}>
          <a href="/privacy" style={{ color: S.gray, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: S.gray, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/refund-policy" style={{ color: S.gold, textDecoration: 'none' }}>Refund Policy</a>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: S.gray, textDecoration: 'none' }}>Contact</a>
        </div>
      </footer>
    </div>
  )
}
