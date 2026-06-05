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

const SOURCES = [
  {
    label: 'House Financial Disclosures',
    desc: 'Periodic Transaction Reports (PTRs) from disclosures-clerk.house.gov — every stock trade filed by House members.',
    url: 'https://disclosures-clerk.house.gov',
  },
  {
    label: 'Senate EFTS',
    desc: 'Electronic Financial Disclosure filings from efdsearch.senate.gov, covering all Senate members.',
    url: 'https://efdsearch.senate.gov',
  },
  {
    label: 'Congress.gov API',
    desc: 'Biography, committee assignments, and legislation data for all 535 members of Congress.',
    url: 'https://congress.gov',
  },
]

export default function AboutPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const statCards = [
    {
      value: stats?.filings ? stats.filings.toLocaleString() : '39,000+',
      label: 'Filings Indexed',
    },
    {
      value: stats?.trades ? stats.trades.toLocaleString() : '—',
      label: 'Individual Trades',
    },
    { value: '535', label: 'Members of Congress' },
    { value: '45 days', label: 'STOCK Act Window' },
  ]

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
        .about-source-link:hover { color: #E8C84A !important; }
        .about-email-btn:hover { background: rgba(212,175,55,0.2) !important; }
        .about-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(178,34,52,0.5); }
        .about-footer-link:hover { color: ${S.gold} !important; }
        @media (max-width: 600px) {
          .about-nav { padding: 0 16px !important; }
          .about-main { padding: 48px 16px 80px !important; }
          .about-stat-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav
        className="about-nav"
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
        className="about-main"
        style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}
      >
        <Link
          href="/"
          style={{
            color: S.gold,
            fontSize: 13,
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: 40,
          }}
        >
          ← Back to CivicWatch
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
            About &amp; Press
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Transparency is the{' '}
            <span style={{ color: S.gold, fontStyle: 'italic' }}>
              foundation of democracy.
            </span>
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
            CivicWatch was built by a retired Marine Captain with 21 years of service and six combat tours — someone who has seen firsthand the cost of the decisions made in Washington. After returning home, the question that wouldn&apos;t leave was simple: who do our elected representatives actually work for?
          </p>
          <p
            style={{
              fontSize: 18,
              color: S.gray,
              lineHeight: 1.8,
              fontWeight: 300,
              maxWidth: 600,
              marginTop: 16,
            }}
          >
            The answer, it turned out, was hiding in plain sight — in financial disclosure filings, voting records, and campaign finance data that were technically public but practically inaccessible to ordinary Americans. CivicWatch was built to change that.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>

          {/* MISSION */}
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
              Our Mission
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: S.grayLight, fontWeight: 300 }}>
              CivicWatch exists because transparency is the foundation of democracy.
              Members of Congress make laws that affect every American — and they trade
              stocks based on information the rest of us don&rsquo;t have. We built
              CivicWatch to make their financial activity visible, searchable, and
              shareable.
            </p>
          </section>

          {/* HOW IT WORKS */}
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
              How It Works
            </h2>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.9,
                color: S.grayLight,
                fontWeight: 300,
                marginBottom: 24,
              }}
            >
              CivicWatch aggregates public financial disclosure data from official
              government sources and makes it searchable in seconds. Data is updated daily.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SOURCES.map((source, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px 20px',
                    background: S.navyMid,
                    border: `1px solid ${S.border}`,
                    borderRadius: 8,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: S.gold,
                      marginTop: 7,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-source-link"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: S.gold,
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: 4,
                        letterSpacing: 0.3,
                        transition: 'color 0.2s',
                      }}
                    >
                      {source.label} ↗
                    </a>
                    <div style={{ fontSize: 13, color: S.gray, lineHeight: 1.6 }}>
                      {source.desc}
                    </div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  padding: '16px 20px',
                  background: S.navyMid,
                  border: `1px solid ${S.border}`,
                  borderRadius: 8,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4CAF50',
                    marginTop: 7,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: S.white,
                      marginBottom: 4,
                      letterSpacing: 0.3,
                    }}
                  >
                    Updated Daily
                  </div>
                  <div style={{ fontSize: 13, color: S.gray, lineHeight: 1.6 }}>
                    {stats?.filings
                      ? `${stats.filings.toLocaleString()}+ filings indexed.`
                      : '39,000+ filings indexed.'}{' '}
                    New disclosures appear within 24 hours of official filing.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STOCK ACT */}
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
              The STOCK Act
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: S.grayLight, fontWeight: 300 }}>
              The Stop Trading on Congressional Knowledge Act (2012) requires members of
              Congress and their staff to disclose stock trades within 45 days of the
              transaction. Passed after a{' '}
              <em>60 Minutes</em> investigation revealed widespread trading on
              non-public information, the law made congressional financial activity subject
              to public disclosure for the first time. CivicWatch indexes every filing and
              makes them searchable by member, ticker, trade type, and date — so any
              American can see what their representatives are buying and selling.
            </p>
          </section>

          {/* LIVE STATS */}
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
              By the Numbers
            </h2>
            <div
              className="about-stat-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 2,
              }}
            >
              {statCards.map((stat, i) => (
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
          </section>

          {/* DATA & ACCURACY */}
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
              Data &amp; Accuracy
            </h2>
            <div
              style={{
                padding: '20px 24px',
                background: 'rgba(178,34,52,0.06)',
                border: '1px solid rgba(178,34,52,0.2)',
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: S.grayLight,
                  fontWeight: 300,
                }}
              >
                We display data as filed. Delays in reporting are common — the STOCK Act
                allows 45 days. Trades shown may have occurred weeks before the filing
                date. We do not independently verify individual filings, and members
                occasionally file amendments. For the most current and authoritative
                record, consult the official sources linked above.
              </p>
            </div>
          </section>

          {/* PUBLIC RECORD DISCLAIMER */}
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
              Public Record Disclaimer
            </h2>
            <div
              style={{
                padding: '20px 24px',
                background: 'rgba(212,175,55,0.05)',
                border: `1px solid ${S.border}`,
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: S.grayLight,
                  fontWeight: 300,
                  margin: 0,
                }}
              >
                Congressional financial disclosures and voting records displayed on CivicWatch are{' '}
                <strong style={{ color: S.white }}>public record</strong>, sourced directly from official
                U.S. government databases including Congress.gov, the House of Representatives Office of
                the Clerk, and the Senate Electronic Financial Disclosure system. These records are
                required by law to be made publicly available. CivicWatch aggregates and presents this
                information to make it more accessible — we do not create, alter, or editorialize the
                underlying government data.
              </p>
            </div>
          </section>

          {/* PRESS */}
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
              Press &amp; Inquiries
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
              CivicWatch is available for press inquiries, research collaborations, and
              media interviews.
            </p>
            <a
              href="mailto:support@civicwatch.app"
              className="about-email-btn"
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

          {/* CTA */}
          <section
            style={{
              padding: '48px 40px',
              background: `linear-gradient(145deg, rgba(27,42,107,0.35), rgba(8,14,28,0.98))`,
              border: `1px solid ${S.border}`,
              borderRadius: 16,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: S.gold,
                marginBottom: 16,
              }}
            >
              Free to start · No login required
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 900,
                marginBottom: 16,
              }}
            >
              See the record for yourself.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: S.gray,
                lineHeight: 1.7,
                marginBottom: 32,
                fontWeight: 300,
                maxWidth: 440,
                margin: '0 auto 32px',
              }}
            >
              Every vote, every trade, every dollar — searchable, shareable, free.
            </p>
            <Link
              href="/dashboard"
              className="about-cta-btn"
              style={{
                display: 'inline-block',
                padding: '14px 40px',
                background: `linear-gradient(135deg, ${S.red}, #8B1A2A)`,
                borderRadius: 8,
                color: 'white',
                fontFamily: "'Playfair Display', serif",
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: 0.3,
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(178,34,52,0.35)',
              }}
            >
              Start Exploring →
            </Link>
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
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/data-deletion', label: 'Data Deletion' },
            { href: 'mailto:support@civicwatch.app', label: 'Contact' },
          ].map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="about-footer-link"
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
