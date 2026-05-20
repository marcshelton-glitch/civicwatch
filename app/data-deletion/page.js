import Link from "next/link";

export const metadata = {
  title: "Data Deletion Instructions | CivicWatch",
  description:
    "How to delete your CivicWatch account and request removal of your personal data.",
};

const LAST_UPDATED = "April 24, 2026";
const CONTACT_EMAIL = "support@civicwatch.app";

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
const LI = { fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 6 }

export default function DataDeletionPage() {
  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .del-link { color: ${S.gold}; text-decoration: underline; }
        .del-link:hover { color: #E8C84A; }
        .del-footer-link { color: ${S.gray}; text-decoration: none; }
        .del-footer-link:hover { color: ${S.gold}; }
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
            Data Deletion Instructions
          </h1>
          <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <p style={P}>
            You have the right to delete your CivicWatch account and the personal information associated with it at any time.
            This page explains the two ways to do that and what happens to your data afterward.
          </p>

          <div>
            <h2 style={H2}>Option 1: Delete Your Account In-App</h2>
            <p style={P}>The fastest way to delete your account is from your account settings:</p>
            <ol style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>Sign in to <Link href="/sign-in" className="del-link">CivicWatch</Link>.</li>
              <li style={LI}>Go to your <strong style={{ color: S.white }}>Account Settings</strong> page.</li>
              <li style={LI}>Scroll to the <strong style={{ color: S.white }}>Danger Zone</strong> section.</li>
              <li style={LI}>Click <strong style={{ color: S.white }}>Delete Account</strong> and confirm when prompted.</li>
            </ol>
            <p style={P}>Your account will be deactivated immediately and your personal data will be permanently deleted within 30 days.</p>
          </div>

          <div>
            <h2 style={H2}>Option 2: Request Deletion by Email</h2>
            <p style={P}>
              If you cannot access your account, or if you signed up using Facebook, Google, or Apple and need help removing
              your data, send an email to{' '}
              <a href={`mailto:${CONTACT_EMAIL}?subject=CivicWatch%20Data%20Deletion%20Request`} className="del-link">{CONTACT_EMAIL}</a>
              {' '}with the following information:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>The subject line: <em>CivicWatch Data Deletion Request</em></li>
              <li style={LI}>The email address associated with your CivicWatch account</li>
              <li style={LI}>The sign-in method you used (email + password, Google, Facebook, or Apple)</li>
            </ul>
            <p style={P}>We will verify your request and complete deletion within 30 days. We will email you when the deletion is complete.</p>
          </div>

          <div>
            <h2 style={H2}>Revoking Access from Facebook</h2>
            <p style={P}>
              If you signed in to CivicWatch using Facebook and want to revoke our access to your Facebook account in addition
              to deleting your CivicWatch data, follow these steps:
            </p>
            <ol style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>
                Go to your Facebook{' '}
                <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" className="del-link">
                  Apps and Websites settings
                </a>.
              </li>
              <li style={LI}>Find <strong style={{ color: S.white }}>CivicWatch</strong> in the list of active apps.</li>
              <li style={LI}>
                Click <strong style={{ color: S.white }}>Remove</strong> to revoke access. You can optionally check the box to
                delete posts, photos, and videos that the app may have created on Facebook (CivicWatch does not create any).
              </li>
            </ol>
            <p style={P}>
              Revoking access from Facebook stops Facebook from sharing future data with CivicWatch, but it does not delete
              the data we have already received. To delete that data, use Option 1 or Option 2 above.
            </p>
          </div>

          <div>
            <h2 style={H2}>What Gets Deleted</h2>
            <p style={P}>When we process your deletion request, we permanently remove:</p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>Your name, email address, and profile image</li>
              <li style={LI}>Your Clerk account, authentication credentials, and sign-in history</li>
              <li style={LI}>Your tracked representatives, alert history, and saved preferences</li>
              <li style={LI}>Your poll votes and activity history</li>
              <li style={LI}>Any other personal information stored in your CivicWatch account</li>
            </ul>
            <p style={{ ...P, color: S.white, fontWeight: 600 }}>No personal data is retained after deletion is processed.</p>
          </div>

          <div>
            <h2 style={H2}>What We May Retain</h2>
            <p style={P}>
              We retain no personal data after deletion. A limited set of non-identifying records may be kept strictly for
              legal or fraud-prevention purposes:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>Billing and transaction records (retained by Stripe and CivicWatch as required by tax and accounting laws — these contain only transaction metadata, not personal profile data).</li>
              <li style={LI}>Anonymized, non-identifiable usage analytics.</li>
              <li style={LI}>Records of past abuse or fraud, where required to protect CivicWatch and other users.</li>
            </ul>
            <p style={P}>These records cannot be used to identify you and are retained only as long as legally required.</p>
          </div>

          <div>
            <h2 style={H2}>Questions?</h2>
            <p style={P}>
              If you have any questions about deleting your data or this process, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="del-link">{CONTACT_EMAIL}</a>.
              You can also review our{' '}
              <Link href="/privacy" className="del-link">Privacy Policy</Link>
              {' '}for more information about how we handle your data.
            </p>
          </div>
        </div>

        <footer style={{ marginTop: 56, borderTop: `1px solid ${S.border}`, paddingTop: 24, fontSize: 12, color: S.gray }}>
          <Link href="/" className="del-footer-link">CivicWatch</Link>
          {' · '}
          <Link href="/privacy" className="del-footer-link">Privacy Policy</Link>
          {' · '}
          <Link href="/terms" className="del-footer-link">Terms of Service</Link>
        </footer>
      </main>
    </div>
  );
}
