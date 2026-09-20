import Link from "next/link";
import Image from "next/image";
import CookieChoicesLink from '@/components/CookieChoicesLink'
import DataExportButton from '@/components/DataExportButton'

export const metadata = {
  title: "Download Your Data | CivicWatch",
  description:
    "Download a copy of everything CivicWatch holds about your account, in a machine-readable format.",
};

const LAST_UPDATED = "September 20, 2026";
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

export default function DataExportPage() {
  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .exp-link { color: ${S.gold}; text-decoration: underline; }
        .exp-link:hover { color: #E8C84A; }
        .exp-footer-link { color: ${S.gray}; text-decoration: none; }
        .exp-footer-link:hover { color: ${S.gold}; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.97)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          <Image src="/brand/logo_civicwatch_horizontal.png" alt="CivicWatch" width={160} height={43} priority style={{display:'block'}} />
        </Link>
        <Link href="/" style={{ fontSize: 13, color: S.gray, textDecoration: 'none' }}>← Back</Link>
      </nav>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px' }}>
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 36, color: S.white, margin: '0 0 10px' }}>
            Download Your Data
          </h1>
          <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <p style={P}>
            You can download everything CivicWatch holds about your account at any time. The file is JSON — a structured,
            machine-readable format you can open in a text editor or load into another service.
          </p>

          <div>
            <h2 style={H2}>Download</h2>
            <p style={P}>
              You need to be <Link href="/sign-in" className="exp-link">signed in</Link>. The file is built when you click,
              so it always reflects your data as of right now.
            </p>
            <DataExportButton />
          </div>

          <div>
            <h2 style={H2}>What&apos;s In the File</h2>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>Your account details — email addresses, name, when you joined, when you last signed in</li>
              <li style={LI}>Your notification preferences</li>
              <li style={LI}>The representatives you track</li>
              <li style={LI}>Alerts we have sent you</li>
              <li style={LI}>Your push notification registrations</li>
              <li style={LI}>Emails we have scheduled or sent you</li>
              <li style={LI}>Your AI feature usage</li>
              <li style={LI}>Any refund requests you have submitted</li>
              <li style={LI}>Your activity events on the site</li>
              <li style={LI}>Abuse-prevention counters recorded against your account</li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>What&apos;s Not In It</h2>
            <p style={P}>Three things are left out on purpose, and the file itself says so:</p>
            <ul style={{ paddingLeft: 22, margin: '0 0 10px' }}>
              <li style={LI}>
                <strong style={{ color: S.white }}>Browser push encryption keys.</strong> These are credentials rather than
                information about you, and putting them in a file people forward by email would be a security risk.
              </li>
              <li style={LI}>
                <strong style={{ color: S.white }}>Internal notes on refund requests.</strong> Your own submission is included;
                staff notes and reviewer names are not, because they concern other people.
              </li>
              <li style={LI}>
                <strong style={{ color: S.white }}>Congressional trading and voting data.</strong> That is public record, not
                personal to you, and it is already browsable across the site.
              </li>
            </ul>
          </div>

          <div>
            <h2 style={H2}>Limits</h2>
            <p style={P}>
              Exports are limited to three per hour, which is well above normal use. If a section of your data cannot be read
              at the time you export, the file will say which one, and you can email us for the rest.
            </p>
          </div>

          <div>
            <h2 style={H2}>Deleting Instead</h2>
            <p style={P}>
              If you want your data removed rather than copied, see{' '}
              <Link href="/data-deletion" className="exp-link">Data Deletion Instructions</Link>. It is worth downloading
              your data first — deletion is permanent.
            </p>
          </div>

          <div>
            <h2 style={H2}>Questions?</h2>
            <p style={P}>
              If anything in your export looks wrong or incomplete, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="exp-link">{CONTACT_EMAIL}</a>.
              Our <Link href="/privacy" className="exp-link">Privacy Policy</Link> explains how we handle your data.
            </p>
          </div>
        </div>

        <footer style={{ marginTop: 56, borderTop: `1px solid ${S.border}`, paddingTop: 24, fontSize: 12, color: S.gray }}>
          <Link href="/" className="exp-footer-link">CivicWatch</Link>
          {' · '}
          <Link href="/privacy" className="exp-footer-link">Privacy Policy</Link>
          {' · '}
          <CookieChoicesLink className="exp-footer-link" />
          {' · '}
          <Link href="/data-deletion" className="exp-footer-link">Data Deletion</Link>
          {' · '}
          <Link href="/support" className="exp-footer-link">Support</Link>
        </footer>
      </main>
    </div>
  );
}
