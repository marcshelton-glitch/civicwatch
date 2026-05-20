import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | CivicWatch",
  description:
    "How CivicWatch collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "April 24, 2026";
const CONTACT_EMAIL = "support@civicwatch.app";

const S = {
  navy:    '#0A1628',
  gold:    '#D4AF37',
  white:   '#F5F0E8',
  gray:    '#8892A4',
  grayLight: '#CDD2E0',
  border:  'rgba(212,175,55,0.2)',
  red:     '#B22234',
  navyMid: '#1B2A6B',
}

const H2 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: S.white, marginBottom: 12, marginTop: 0 }
const P  = { fontSize: 14, color: S.grayLight, lineHeight: 1.85, margin: '0 0 10px' }
const LI = { fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .priv-link { color: ${S.gold}; text-decoration: underline; }
        .priv-link:hover { color: #E8C84A; }
        .priv-footer-link { color: ${S.gray}; text-decoration: none; }
        .priv-footer-link:hover { color: ${S.gold}; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.97)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: S.white, textDecoration: 'none', letterSpacing: 0.5 }}>
          🏛️ Civic<span style={{ color: S.gold }}>Watch</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: S.gray, textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px' }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 36, color: S.white, margin: '0 0 10px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <p style={P}>
            CivicWatch (&quot;CivicWatch,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a civic information service
            that helps users track elected representatives, follow legislation, and stay informed about issues affecting their
            communities. This Privacy Policy explains what information we collect, how we use it, and the choices you have.
            By using CivicWatch, you agree to this policy.
          </p>

          <div>
            <h2 style={H2}>1. Information We Collect</h2>
            <p style={P}>We collect the following categories of information:</p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li style={LI}><strong style={{ color: S.white }}>Account information.</strong> When you create an account, we collect your name, email address, and profile image. If you sign in through a third-party provider such as Google, Facebook, or Apple, we receive these details from that provider based on the permissions you grant.</li>
              <li style={LI}><strong style={{ color: S.white }}>Authentication data.</strong> Account creation and session management are handled by our authentication provider, Clerk. Clerk stores credentials, session tokens, and related security metadata on our behalf.</li>
              <li style={LI}><strong style={{ color: S.white }}>Usage data.</strong> We collect information about how you interact with CivicWatch, including representatives you track, polls you participate in, pages you view, and features you use.</li>
              <li style={LI}><strong style={{ color: S.white }}>Billing information.</strong> If you subscribe to a paid plan, payment is processed by Stripe. We do not store full payment card numbers on our servers; Stripe stores them securely and provides us with a customer reference, plan status, and the last four digits of your card.</li>
              <li style={LI}><strong style={{ color: S.white }}>Device and log data.</strong> We automatically collect information your browser or device sends when you use CivicWatch, including IP address, browser type, operating system, referring pages, and timestamps.</li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>2. How We Use Your Information</h2>
            <p style={P}>We use the information we collect to:</p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li style={LI}>Create and manage your account.</li>
              <li style={LI}>Provide and improve CivicWatch features, including tracked representatives, poll results, and personalized civic alerts.</li>
              <li style={LI}>Process subscription payments and send billing receipts.</li>
              <li style={LI}>Send service-related emails, including account notifications, security alerts, and (if you opt in) civic updates.</li>
              <li style={LI}>Detect, investigate, and prevent fraud and abuse.</li>
              <li style={LI}>Comply with legal obligations.</li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>3. How We Share Your Information</h2>
            <p style={P}>We do not sell your personal information. We share information only with:</p>
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              <li style={LI}><strong style={{ color: S.white }}>Service providers</strong> who help us operate CivicWatch, including Clerk (authentication), Supabase (database hosting), Stripe (payments), Vercel (web hosting), and Google (AI features via Gemini). These providers are bound by contracts that restrict how they can use your data.</li>
              <li style={LI}><strong style={{ color: S.white }}>Legal authorities</strong> when required by valid legal process, or to protect the rights, property, or safety of CivicWatch, our users, or the public.</li>
              <li style={LI}><strong style={{ color: S.white }}>Successors</strong> in connection with a merger, acquisition, or sale of assets, with notice to you when required by law.</li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>4. Data from Facebook, Google, and Apple Sign-In</h2>
            <p style={P}>
              When you sign in using Facebook, Google, or Apple, we receive your name, email address, and profile picture from
              that provider. We use this information solely to create and authenticate your CivicWatch account. We do not post
              to your social accounts, access your contacts, or share data back to those providers beyond what is required for
              authentication. You can disconnect a third-party login at any time from your account settings, and you can revoke
              our access from your provider&apos;s app settings (for example, Facebook → Settings → Apps and Websites).
            </p>
          </div>

          <div>
            <h2 style={H2}>5. Cookies and Similar Technologies</h2>
            <p style={P}>
              CivicWatch uses cookies and similar technologies to keep you signed in, remember preferences, and measure how
              the service is used. You can control cookies through your browser settings, but disabling them may affect
              functionality such as staying signed in.
            </p>
          </div>

          <div>
            <h2 style={H2}>6. Data Retention</h2>
            <p style={P}>
              We retain your account information for as long as your account is active. If you delete your account, we delete
              or anonymize your personal information within 30 days, except where we are required to retain it for legal, tax,
              or fraud prevention purposes. See our{' '}
              <Link href="/data-deletion" className="priv-link">Data Deletion Instructions</Link>
              {' '}for details on how to request deletion.
            </p>
          </div>

          <div>
            <h2 style={H2}>7. Your Rights</h2>
            <p style={P}>Depending on where you live, you may have the right to:</p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>Access the personal information we hold about you.</li>
              <li style={LI}>Correct inaccurate information.</li>
              <li style={LI}>Delete your account and associated data.</li>
              <li style={LI}>Export your data in a portable format.</li>
              <li style={LI}>Opt out of marketing communications at any time by clicking the unsubscribe link in any email we send.</li>
            </ul>
            <p style={P}>
              To exercise any of these rights, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a>.
            </p>
          </div>

          <div>
            <h2 style={H2}>8. Security</h2>
            <p style={P}>
              We use industry-standard technical and organizational measures to protect your information, including TLS
              encryption in transit, encryption at rest for sensitive data, and strict access controls. No system is 100%
              secure, however, and we cannot guarantee the absolute security of your data.
            </p>
          </div>

          <div>
            <h2 style={H2}>9. Children&apos;s Privacy</h2>
            <p style={P}>
              CivicWatch is not directed to children under 13. We do not knowingly collect personal information from children
              under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.
            </p>
          </div>

          <div>
            <h2 style={H2}>10. Changes to This Policy</h2>
            <p style={P}>
              We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last updated&quot; date
              at the top of this page. If the changes are material, we will notify you by email or through a notice in the app.
            </p>
          </div>

          <div>
            <h2 style={H2}>11. Contact Us</h2>
            <p style={P}>
              If you have questions about this Privacy Policy or our data practices, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a>.
            </p>
          </div>
        </div>

        <footer style={{ marginTop: 56, borderTop: `1px solid ${S.border}`, paddingTop: 24, fontSize: 12, color: S.gray }}>
          <Link href="/" className="priv-footer-link">CivicWatch</Link>
          {' · '}
          <Link href="/terms" className="priv-footer-link">Terms of Service</Link>
          {' · '}
          <Link href="/data-deletion" className="priv-footer-link">Data Deletion</Link>
        </footer>
      </main>
    </div>
  );
}
