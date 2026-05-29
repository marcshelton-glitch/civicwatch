import Link from 'next/link'

export const metadata = {
  title: 'Refund Policy | CivicWatch',
  description: 'CivicWatch refund policy — eligibility, process, and timelines.',
}

const EFFECTIVE_DATE = 'May 29, 2026'
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
            CivicWatch (&ldquo;CivicWatch,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) aims to provide
            a reliable, continuously available service. This policy describes when refunds are available and how to request one.
          </p>

          <div>
            <h2 style={H2}>1. Refund Eligibility</h2>
            <p style={P}>
              Refunds are available within <strong style={{ color: S.white }}>14 days</strong> of your original payment date,
              subject to the following condition:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 8 }}>
                You must be able to demonstrate a <strong style={{ color: S.white }}>loss of service</strong> — meaning the
                CivicWatch site was down, inaccessible, or a core feature was broken during a meaningful portion of your
                billing period.
              </li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 8 }}>
                All refund requests are reviewed and must be approved by CivicWatch staff before any charge is reversed
                through Stripe.
              </li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>2. When Refunds Are Not Issued</h2>
            <p style={P}>
              If the CivicWatch site is functioning correctly, refunds are not available — regardless of usage level or
              satisfaction. In this case, you are welcome to <strong style={{ color: S.white }}>cancel your subscription</strong> at
              any time, no questions asked. Your access will continue until the end of the current billing period.
            </p>
            <p style={P}>
              Examples of situations that do <em>not</em> qualify for a refund:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Changed your mind about subscribing</li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Did not use the service during the billing period</li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Dissatisfied with data coverage or content</li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Forgot to cancel before renewal</li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>3. How to Request a Refund</h2>
            <p style={P}>
              To submit a refund request, sign in to your CivicWatch account and complete the{' '}
              <a href="/refund-request" className="rp-link">refund request form</a>. You will be asked to:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Provide the date of your original payment</li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Describe the service disruption or outage you experienced</li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Provide any supporting evidence (error messages, screenshots, dates)</li>
              <li style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }}>Confirm that the site was not functioning correctly during this period</li>
            </ul>
            <p style={P}>
              Requests submitted outside the 14-day window will not be reviewed.
            </p>
          </div>

          <div>
            <h2 style={H2}>4. Processing Time</h2>
            <p style={P}>
              Once your request is submitted, our team will review it within <strong style={{ color: S.white }}>2 business days</strong>.
              If approved, the refund will be processed through Stripe and typically appears on your original payment method
              within <strong style={{ color: S.white }}>5–10 business days</strong>, depending on your bank or card issuer.
              You will receive an email notification once a decision has been made.
            </p>
          </div>

          <div>
            <h2 style={H2}>5. Contact</h2>
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
