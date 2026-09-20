import Link from 'next/link'
import Image from 'next/image'
import CookieChoicesLink from '@/components/CookieChoicesLink'

export const metadata = {
  title: 'Support | CivicWatch',
  description: 'Get help with CivicWatch — contact support, our response-time commitment, and answers to the 10 most common questions about data, accounts, billing, and outages.',
}

const CONTACT_EMAIL = 'support@civicwatch.app'
const LAST_UPDATED = 'September 4, 2026'

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

const FAQS = [
  {
    q: 'What is CivicWatch?',
    a: 'CivicWatch is an independent accountability platform that tracks what your elected representatives actually do — how they vote, what stocks they disclose trading, what their financial disclosures show, and how that compares to the committees they sit on. Look up your representatives by address for free; CivicWatch Pro adds full AI accountability reports and trade-vs-committee conflict analysis.',
  },
  {
    q: 'Is CivicWatch affiliated with the government, Congress, or a political party?',
    a: 'No. CivicWatch is an independent, nonpartisan project. We aggregate public records from official sources — Congress.gov, the House and Senate financial disclosure systems, and the FEC — and are not affiliated with any government agency, campaign, or political party.',
  },
  {
    q: 'Where does your data come from, and how current is it?',
    a: 'Voting records come from the official congressional record. Stock trades come from House and Senate STOCK Act disclosure filings. Wealth and financial data come from official financial disclosure filings. New disclosures are pulled from these official sources and typically appear on CivicWatch within 24 hours of filing.',
  },
  {
    q: 'Is the data and AI analysis nonpartisan?',
    a: 'Yes. Every representative is scored and analyzed the same way, using the same public records, regardless of party. Pro’s AI Analysis is explicitly prompted for nonpartisan framing and covers members of both parties equally.',
  },
  {
    q: 'Is the AI analysis or conflict score financial or legal advice?',
    a: 'No. AI reports, conflict scores, and wealth trajectories are for informational and civic-accountability purposes only — not financial, investment, tax, or legal advice, and shouldn’t be the basis for an investment decision. Where we can’t match a trade to a member with enough confidence, we say so rather than showing a false "all clear."',
  },
  {
    q: 'How do I track a representative and get alerts?',
    a: 'Look up your representatives by address from the Dashboard, then select "Track" on any representative’s profile. You’ll get alerts when they vote, file a new trade disclosure, or hold a town hall — configurable from your account preferences.',
  },
  {
    q: 'I think a data point is wrong — how do I report it?',
    a: <>Email <a href={`mailto:${CONTACT_EMAIL}?subject=Data%20correction`} className="sup-link">{CONTACT_EMAIL}</a> with a link to the page and what looks wrong. Most figures trace directly back to an official government filing, but display and matching errors happen — we look into every report and follow up with you either way.</>,
  },
  {
    q: 'How do I cancel Pro, or get a refund?',
    a: <>Cancel any time from the billing portal in your account — you keep Pro access through the period you already paid for, no cancellation fee. New subscribers can request a full refund within 7 days of their first charge. See the <Link href="/refund-policy" className="sup-link">Refund Policy</Link> and the FAQ on the <Link href="/pro" className="sup-link">Pro page</Link> for details.</>,
  },
  {
    q: 'How do I delete my account and data?',
    a: <>See <Link href="/data-deletion" className="sup-link">Data Deletion Instructions</Link> for the in-app option and the email option — both permanently remove your personal data within 30 days.</>,
  },
  {
    q: 'Something looks broken, or the site is down — what do I do?',
    a: <>Email <a href={`mailto:${CONTACT_EMAIL}?subject=Outage`} className="sup-link">{CONTACT_EMAIL}</a> with &ldquo;Outage&rdquo; in the subject and what you&rsquo;re seeing (a screenshot helps). Uptime is monitored continuously, and outage reports are handled ahead of routine questions.</>,
  },
]

const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: typeof f.a === 'string' ? f.a : '',
    },
  })).filter(f => f.acceptedAnswer.text),
}

export default function SupportPage() {
  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .sup-link { color: ${S.gold}; text-decoration: underline; }
        .sup-link:hover { color: #E8C84A; }
        .sup-footer-link { color: ${S.gray}; text-decoration: none; }
        .sup-footer-link:hover { color: ${S.gold}; }
        .sup-faq-item { border-bottom: 1px solid ${S.border}; padding: 20px 0; }
        .sup-faq-item:last-child { border-bottom: none; }
        .sup-faq-q { font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16px; color: ${S.white}; margin: 0 0 8px; }
        .sup-faq-a { font-size: 14px; color: ${S.grayLight}; line-height: 1.85; margin: 0; }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.97)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          <Image src="/brand/logo_civicwatch_horizontal.png" alt="CivicWatch" width={160} height={43} priority style={{ display: 'block' }} />
        </Link>
        <Link href="/" style={{ fontSize: 13, color: S.gray, textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px' }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 36, color: S.white, margin: '0 0 10px' }}>
            Support
          </h1>
          <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </header>

        {/* ── CONTACT + SLA ── */}
        <div style={{ padding: 24, background: 'rgba(212,175,55,0.08)', border: `1px solid ${S.border}`, borderRadius: 12, marginBottom: 48 }}>
          <h2 style={{ ...H2, fontSize: 18, color: S.gold, marginBottom: 10 }}>How to reach us</h2>
          <p style={P}>
            Email <a href={`mailto:${CONTACT_EMAIL}`} className="sup-link">{CONTACT_EMAIL}</a> — it goes straight to a
            real person, not a ticket queue.
          </p>
          <p style={{ ...P, color: S.white, fontWeight: 600, marginBottom: 0 }}>
            We respond to every support email within 1 business day (Monday–Friday). Most replies come sooner.
            Outage reports and billing errors are handled first.
          </p>
        </div>

        <div style={{ marginBottom: 40 }}>
          <p style={P}>
            The 10 questions below cover what people ask most. If yours isn&rsquo;t here, email us — we&rsquo;ll
            answer directly and, if it&rsquo;s a common one, add it to this page.
          </p>
        </div>

        {/* ── FAQ ── */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ ...H2, marginBottom: 8 }}>Frequently asked questions</h2>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="sup-faq-item">
                <p className="sup-faq-q">{f.q}</p>
                <p className="sup-faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── OUTAGES ── */}
        <div>
          <h2 style={H2}>Outages &amp; escalation</h2>
          <p style={P}>
            CivicWatch&rsquo;s uptime is monitored continuously. If something is down or broken, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Outage`} className="sup-link">{CONTACT_EMAIL}</a> with
            &ldquo;Outage&rdquo; in the subject line — those reports are triaged ahead of routine questions and
            handled directly by the team running the site.
          </p>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${S.border}`, padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12 }}>
          <Link href="/" className="sup-footer-link">CivicWatch</Link>
          <Link href="/privacy" className="sup-footer-link">Privacy Policy</Link>
          <CookieChoicesLink className="sup-footer-link" />
          <Link href="/terms" className="sup-footer-link">Terms of Service</Link>
          <Link href="/refund-policy" className="sup-footer-link">Refund Policy</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="sup-footer-link">Contact</a>
        </div>
      </footer>
    </div>
  )
}
