'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const S = {
  navy: '#080E1C',
  navyMid: '#0F1A35',
  navyLight: '#1B2A6B',
  red: '#B22234',
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.12)',
  white: '#F0F2FF',
  gray: '#7A8499',
  grayLight: '#CDD2E0',
  border: 'rgba(212,175,55,0.2)',
}

export default function PressPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const filings = stats?.filings ? stats.filings.toLocaleString() : '39,000+'
  const trades = stats?.trades ? stats.trades.toLocaleString() : null

  return (
    <div
      style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        background: S.navy,
        color: S.white,
        minHeight: '100vh',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .press-email-btn:hover { background: rgba(212,175,55,0.2) !important; }
        .press-footer-link:hover { color: ${S.gold} !important; }
        @media (max-width: 600px) {
          .press-nav { padding: 0 16px !important; }
          .press-main { padding: 48px 16px 80px !important; }
          .press-fact-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav
        className="press-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          background: 'rgba(8,14,28,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${S.border}`,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: 2,
            color: S.white,
            textDecoration: 'none',
          }}
        >
          CIVIC<span style={{ color: S.gold }}>WATCH</span>
        </Link>
        <Link
          href="/dashboard"
          style={{
            padding: '8px 20px',
            background: `linear-gradient(135deg, ${S.red}, #8B1A2A)`,
            borderRadius: 6,
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: 0.3,
          }}
        >
          Explore →
        </Link>
      </nav>

      {/* FLAG STRIPE */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyLight} 66%)`,
        }}
      />

      <main
        className="press-main"
        style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}
      >
        <Link
          href="/about"
          style={{
            color: S.gold,
            fontSize: 13,
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 40,
          }}
        >
          ← Back to About
        </Link>

        {/* PAGE HEADER */}
        <header style={{ marginBottom: 64, borderBottom: `1px solid ${S.border}`, paddingBottom: 48 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: S.gold,
              marginBottom: 16,
            }}
          >
            Media Resources
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Press &amp; Media
          </h1>
          <p
            style={{
              fontSize: 18,
              color: S.gray,
              lineHeight: 1.8,
              fontWeight: 300,
              maxWidth: 600,
            }}
          >
            CivicWatch makes congressional financial data accessible to the public.
            We welcome press inquiries, research collaborations, and media interviews.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>

          {/* PRESS CONTACT */}
          <section>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: `1px solid ${S.border}`,
              }}
            >
              Press Contact
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.9,
                color: S.grayLight,
                fontWeight: 300,
                marginBottom: 24,
              }}
            >
              For interviews, data requests, screenshots, or any media inquiry, reach out directly:
            </p>
            <a
              href="mailto:support@civicwatch.app"
              className="press-email-btn"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: S.goldDim,
                border: `1px solid ${S.border}`,
                borderRadius: 8,
                color: S.gold,
                fontSize: 14,
                textDecoration: 'none',
                fontWeight: 600,
                letterSpacing: 0.5,
                transition: 'background 0.2s',
              }}
            >
              support@civicwatch.app
            </a>
          </section>

          {/* KEY FACTS */}
          <section>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: `1px solid ${S.border}`,
              }}
            >
              Key Facts
            </h2>
            <div
              className="press-fact-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                marginBottom: 24,
              }}
            >
              {[
                { value: '535', label: 'Members of Congress Tracked' },
                { value: filings, label: 'Financial Filings Indexed' },
                { value: '2012', label: 'Disclosures Dating Back To' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    padding: '28px 16px',
                    background: S.navyMid,
                    border: `1px solid ${S.border}`,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 32,
                      fontWeight: 900,
                      color: S.gold,
                      marginBottom: 8,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: S.gray,
                      lineHeight: 1.4,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: '20px 24px',
                background: S.navyMid,
                border: `1px solid ${S.border}`,
                borderRadius: 8,
              }}
            >
              <p style={{ fontSize: 15, lineHeight: 1.9, color: S.grayLight, fontWeight: 300 }}>
                CivicWatch tracks all 535 members of Congress, covering financial disclosures
                dating back to 2012 — the year the STOCK Act was signed into law — and monitors
                real-time stock trade filings as they are submitted to the House Clerk and Senate
                EFTS systems.{trades ? ` The platform has indexed over ${trades} individual trades.` : ''}
              </p>
            </div>
          </section>

          {/* WHAT IS CIVICWATCH */}
          <section>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: `1px solid ${S.border}`,
              }}
            >
              About CivicWatch
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  title: 'What it is',
                  body: 'CivicWatch is an independent civic transparency platform that aggregates public congressional financial disclosures and makes them searchable in seconds — net worth estimates, stock trades, legislative activity, and more.',
                },
                {
                  title: 'Why it exists',
                  body: 'Financial conflicts of interest in Congress are a real and documented problem. Congressional financial disclosure data is technically public, but navigating official government sites requires significant time and expertise. CivicWatch removes that barrier.',
                },
                {
                  title: 'Data sources',
                  body: 'All data is sourced from official U.S. government databases: the House of Representatives Office of the Clerk (Periodic Transaction Reports), the Senate Electronic Financial Disclosure System, and Congress.gov. CivicWatch does not create or alter the underlying data.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px 24px',
                    background: S.navyMid,
                    border: `1px solid ${S.border}`,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: S.gold,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    {item.title}
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.8, color: S.grayLight, fontWeight: 300 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* PRESS KIT */}
          <section>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: `1px solid ${S.border}`,
              }}
            >
              Download Press Kit
            </h2>
            <div
              style={{
                padding: '28px 32px',
                background: 'rgba(212,175,55,0.05)',
                border: `1px solid ${S.border}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  flexShrink: 0,
                  opacity: 0.6,
                }}
              >
                📦
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 17,
                    fontWeight: 700,
                    marginBottom: 8,
                    color: S.white,
                  }}
                >
                  Press kit coming soon
                </div>
                <p style={{ fontSize: 14, color: S.gray, lineHeight: 1.7, fontWeight: 300 }}>
                  Logos, screenshots, and brand assets are available on request. Contact{' '}
                  <a
                    href="mailto:support@civicwatch.app"
                    style={{ color: S.gold, textDecoration: 'none' }}
                  >
                    support@civicwatch.app
                  </a>{' '}
                  and we&rsquo;ll send everything you need.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid ${S.border}`,
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 2,
            color: S.gold,
            marginBottom: 16,
          }}
        >
          CIVIC<span style={{ color: S.gold }}>WATCH</span>™
        </div>
        <div
          style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          {[
            { href: '/sign-up', label: 'Sign Up' },
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/about', label: 'About' },
            { href: '/press', label: 'Press' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/data-deletion', label: 'Data Deletion' },
            { href: '/refund-policy', label: 'Refund Policy' },
            { href: '/privacy#ccpa', label: 'Do Not Sell My Personal Information' },
            { href: 'mailto:support@civicwatch.app', label: 'Contact' },
          ].map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="press-footer-link"
              style={{
                fontSize: 12,
                color: S.gray,
                textDecoration: 'none',
                letterSpacing: 0.5,
                transition: 'color 0.2s',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(122,132,153,0.6)', lineHeight: 1.6 }}>
          Data sourced from Congress.gov, House Clerk STOCK Act Disclosures, and Senate Financial Disclosures.
          <br />
          CivicWatch is an independent accountability platform. Not affiliated with any government agency or political party.
          <br />
          © {new Date().getFullYear()} CivicWatch. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
