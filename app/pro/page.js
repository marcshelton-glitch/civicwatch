'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useUser, useClerk } from '@clerk/nextjs'
import { useState } from 'react'
import { getUserTier } from '@/lib/tier-utils'

const S = {
  navy:      '#0A0E1E',
  navyMid:   '#111827',
  navyLight: '#1B2A6B',
  gold:      '#D4AF37',
  red:       '#B22234',
  white:     '#FFFFFF',
  offWhite:  '#F0EDE4',
  gray:      '#8892A4',
  grayLight: '#B0BAC8',
  cardBg:    'rgba(27,42,107,0.25)',
  border:    'rgba(212,175,55,0.15)',
}

const FREE_FEATURES = [
  { icon: '🏛️', label: 'Browse all federal representatives' },
  { icon: '⚖️', label: 'Full voting record history' },
  { icon: '💰', label: 'STOCK Act trade disclosures' },
  { icon: '📋', label: "Today's congressional docket" },
  { icon: '📍', label: 'Town halls & scheduled events' },
  { icon: '🏦', label: 'Nonprofit affiliations (ProPublica)' },
  { icon: '🤖', label: 'AI Analysis — 3 free previews/hr' },
  { icon: '🗺️', label: 'Interactive congressional map' },
  { icon: '📜', label: 'U.S. Constitution reference' },
]

const VOTER_PRO_FEATURES = [
  { icon: '📊', label: 'Net worth & wealth timeline' },
  { icon: '🔔', label: 'Email alerts — votes, trades, town halls' },
  { icon: '⭐', label: 'Track any representative (watchlist)' },
  { icon: '💼', label: 'Full financial disclosure data' },
  { icon: '🤖', label: 'AI previews — 10K tokens/day' },
]

const CIVIC_PACK_FEATURES = [
  { icon: '🤖', label: 'Full AI accountability reports (20/hr)' },
  { icon: '🔍', label: 'Trade conflict scoring vs. committee roles' },
  { icon: '📈', label: 'Wealth trajectory vs. congressional peers' },
  { icon: '🏆', label: 'Overall accountability rating per rep' },
  { icon: '⚡', label: '50K AI tokens/day — highest cap' },
]

const FAQS = [
  {
    q: 'What is the difference between Voter Pro and Civic Pack?',
    a: 'Voter Pro ($3.99/mo) unlocks net worth data, email alerts, and your representative watchlist. Civic Pack ($9.99/mo) adds full AI accountability reports with conflict scoring, wealth trajectory analysis, and peer comparisons — the complete picture on every rep.',
  },
  {
    q: 'What do the one-time payment options give me?',
    a: 'One-time payments give you lifetime access to that tier — no recurring charge, ever. Voter Pro one-time is $9.99; Civic Pack one-time is $19.99. Subscription prices are lower if you plan to stay long-term.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. Cancel anytime from the billing portal — no fees, no gotchas. Your access continues until the end of the billing period you already paid for.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your tracked representatives, alert history, and account are preserved. You simply lose access to paid features. Everything is waiting if you resubscribe.',
  },
  {
    q: 'Is CivicWatch nonpartisan?',
    a: 'Yes. Data comes from official government sources — congressional APIs, STOCK Act filings, FEC data, and financial disclosures. AI reports are explicitly prompted for nonpartisan framing and cover all representatives equally.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major credit/debit cards via Stripe. Apple Pay and Google Pay are supported where available.',
  },
]

export default function ProPage() {
  const { user, isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const tier = getUserTier(user)
  const isVoterProPlus = tier !== 'free'
  const isCivicPack = tier === 'civic_pack'
  const [openFaq, setOpenFaq] = useState(null)
  const [loading, setLoading] = useState(null)  // tracks which button is loading

  const handleUpgrade = async (targetTier, paymentType = 'subscription') => {
    if (!isSignedIn) { openSignIn(); return }
    const key = `${targetTier}_${paymentType}`
    setLoading(key)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, paymentType }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else console.error('No checkout URL returned:', data)
    } catch (e) {
      console.error('Subscribe error:', e)
    } finally {
      setLoading(null)
    }
  }

  const handleBillingPortal = async () => {
    setLoading('portal')
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error('Billing portal error:', e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: '100vh', color: S.white, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        .star-pattern { background-image: radial-gradient(circle, rgba(212,175,55,0.08) 1px, transparent 1px); background-size: 24px 24px; }
        .tier-card { background: linear-gradient(145deg, rgba(27,42,107,0.5), rgba(10,14,30,0.9)); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; display: flex; flex-direction: column; }
        .tier-card.highlighted { border-color: ${S.gold}; background: linear-gradient(145deg, rgba(27,42,107,0.7), rgba(10,14,30,0.95)); }
        .faq-item { border-bottom: 1px solid ${S.border}; }
        .faq-q { width: 100%; background: none; border: none; color: ${S.white}; font-family: inherit; font-size: 15px; font-weight: 600; text-align: left; padding: 20px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .faq-a { font-size: 14px; color: ${S.grayLight}; line-height: 1.8; padding-bottom: 20px; }
        .cta-btn { padding: 13px 24px; background: linear-gradient(135deg, ${S.gold}, #B8960C); border: none; border-radius: 10px; color: ${S.navy}; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px; transition: opacity 0.2s, transform 0.15s; width: 100%; }
        .cta-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .cta-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .cta-btn-secondary { padding: 11px 24px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: ${S.grayLight}; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; width: 100%; }
        .cta-btn-secondary:hover { opacity: 0.8; }
        .cta-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .check { color: #4CAF50; font-size: 14px; flex-shrink: 0; }
        .gold-star { color: ${S.gold}; font-size: 14px; flex-shrink: 0; }
        .popular-badge { display: inline-block; padding: 3px 10px; background: rgba(212,175,55,0.15); border: 1px solid ${S.gold}; border-radius: 20px; font-size: 10px; font-weight: 700; color: ${S.gold}; letter-spacing: 1px; text-transform: uppercase; }
        .price-toggle { display: flex; gap: 0; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 3px; }
        .price-tab { padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; font-family: inherit; border: none; cursor: pointer; transition: background 0.15s, color 0.15s; }
        .price-tab.active { background: ${S.gold}; color: ${S.navy}; }
        .price-tab.inactive { background: transparent; color: ${S.gray}; }
        @media (max-width: 900px) {
          .tiers-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <header style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: `rgba(10,14,30,0.95)`, backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          <Image src="/brand/logo_civicwatch_horizontal.png" alt="CivicWatch" width={160} height={43} priority style={{display:'block'}} />
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: S.gray, textDecoration: 'none' }}>← Back to Dashboard</Link>
          {isVoterProPlus && (
            <button onClick={handleBillingPortal} disabled={loading === 'portal'} style={{ padding: '7px 14px', background: `rgba(212,175,55,0.12)`, border: `1px solid ${S.gold}`, borderRadius: 8, color: S.gold, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
              ★ Manage Billing
            </button>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: '72px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="star-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 48, lineHeight: 1.15, margin: '0 0 16px' }}>
            Accountability at the<br />depth it deserves.
          </h1>
          <p style={{ fontSize: 17, color: S.grayLight, lineHeight: 1.7, margin: '0 0 8px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            Choose the level of transparency that works for you.
          </p>
          <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>No ads · No data brokering · Stripe-secured checkout</p>
        </div>
      </section>

      {/* ── 3-TIER PRICING ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div className="tiers-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* ── FREE ── */}
            <div className="tier-card">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: S.gray, marginBottom: 6 }}>Free</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700 }}>$0</div>
                <div style={{ fontSize: 12, color: S.gray, marginTop: 4 }}>No credit card required</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {FREE_FEATURES.map(f => (
                  <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className="check">✓</span>
                    <span style={{ fontSize: 13, color: S.grayLight }}>{f.icon} {f.label}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" style={{ display: 'block', textAlign: 'center', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 10, color: S.offWhite, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Open Dashboard →
              </Link>
            </div>

            {/* ── VOTER PRO ── */}
            <div className="tier-card">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: S.grayLight, marginBottom: 6 }}>Voter Pro</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700 }}>
                  $3.99<span style={{ fontSize: 14, fontWeight: 400, color: S.gray }}>/mo</span>
                </div>
                <div style={{ fontSize: 12, color: S.gray, marginTop: 4 }}>or $9.99 one-time · Cancel anytime</div>
              </div>
              <div style={{ fontSize: 12, color: S.gray, marginBottom: 10 }}>Everything in Free, plus:</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {VOTER_PRO_FEATURES.map(f => (
                  <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className="check">✓</span>
                    <span style={{ fontSize: 13, color: S.offWhite }}>{f.icon} {f.label}</span>
                  </div>
                ))}
              </div>
              {tier === 'voter_pro' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 10, color: '#4caf50', fontSize: 13, fontWeight: 700 }}>
                    ✓ Your current plan
                  </div>
                  <button onClick={handleBillingPortal} disabled={loading === 'portal'} className="cta-btn-secondary">
                    Manage Billing →
                  </button>
                </div>
              ) : tier === 'civic_pack' ? (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 10, color: S.gray, fontSize: 13 }}>
                  Included in Civic Pack
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="cta-btn" onClick={() => handleUpgrade('voter_pro', 'subscription')} disabled={!!loading}>
                    {loading === 'voter_pro_subscription' ? 'Redirecting…' : '★ Subscribe — $3.99/mo'}
                  </button>
                  <button className="cta-btn-secondary" onClick={() => handleUpgrade('voter_pro', 'onetime')} disabled={!!loading}>
                    {loading === 'voter_pro_onetime' ? 'Redirecting…' : 'One-time — $9.99 lifetime'}
                  </button>
                </div>
              )}
            </div>

            {/* ── CIVIC PACK ── */}
            <div className="tier-card highlighted" style={{ position: 'relative', overflow: 'hidden' }}>
              <div className="star-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.25 }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: S.gold, marginBottom: 6 }}>Civic Pack</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700 }}>
                      $9.99<span style={{ fontSize: 14, fontWeight: 400, color: S.gray }}>/mo</span>
                    </div>
                    <div style={{ fontSize: 12, color: S.gray, marginTop: 4 }}>or $19.99 one-time · Cancel anytime</div>
                  </div>
                  <span className="popular-badge">Most Popular</span>
                </div>
                <div style={{ fontSize: 12, color: S.gray, marginBottom: 10 }}>Everything in Voter Pro, plus:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {CIVIC_PACK_FEATURES.map(f => (
                    <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span className="gold-star">★</span>
                      <span style={{ fontSize: 13, color: S.offWhite }}>{f.icon} {f.label}</span>
                    </div>
                  ))}
                </div>
                {isCivicPack ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 10, color: S.gold, fontSize: 13, fontWeight: 700 }}>
                      ★ Your current plan
                    </div>
                    <button onClick={handleBillingPortal} disabled={loading === 'portal'} className="cta-btn-secondary">
                      Manage Billing →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="cta-btn" onClick={() => handleUpgrade('civic_pack', 'subscription')} disabled={!!loading}>
                      {loading === 'civic_pack_subscription' ? 'Redirecting…' : '★ Subscribe — $9.99/mo'}
                    </button>
                    <button className="cta-btn-secondary" onClick={() => handleUpgrade('civic_pack', 'onetime')} disabled={!!loading}>
                      {loading === 'civic_pack_onetime' ? 'Redirecting…' : 'One-time — $19.99 lifetime'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section style={{ padding: '60px 24px', background: `rgba(27,42,107,0.15)`, textAlign: 'center' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🇺🇸</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 26, marginBottom: 14, marginTop: 0 }}>
            Why CivicWatch Pro exists
          </h2>
          <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, marginBottom: 16 }}>
            Government financial disclosures are public record — but they're buried in PDFs, scattered across systems, and nearly impossible to cross-reference at scale. CivicWatch aggregates all of it and runs AI analysis so you don't have to spend hours doing it yourself.
          </p>
          <p style={{ fontSize: 14, color: S.grayLight, lineHeight: 1.85, margin: 0 }}>
            No ads, no data brokering, no sponsored content — just the data.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 30, textAlign: 'center', marginBottom: 40, marginTop: 0 }}>
            Frequently asked questions
          </h2>
          <div>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span style={{ color: S.gold, fontSize: 18, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="faq-a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      {!isVoterProPlus && (
        <section style={{ padding: '72px 24px', background: `linear-gradient(135deg, rgba(27,42,107,0.6), rgba(10,14,30,0.95))`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="star-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 34, marginBottom: 12, marginTop: 0 }}>
              Ready to go deeper?
            </h2>
            <p style={{ fontSize: 14, color: S.grayLight, marginBottom: 28, lineHeight: 1.7 }}>
              Start with Voter Pro at $3.99/mo — net worth data, alerts, and your rep watchlist. Upgrade to Civic Pack anytime for full AI reports.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => handleUpgrade('voter_pro', 'subscription')} disabled={!!loading} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 10, color: S.offWhite, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {loading === 'voter_pro_subscription' ? 'Redirecting…' : 'Voter Pro — $3.99/mo'}
              </button>
              <button onClick={() => handleUpgrade('civic_pack', 'subscription')} disabled={!!loading} style={{ padding: '14px 28px', background: `linear-gradient(135deg, ${S.gold}, #B8960C)`, border: 'none', borderRadius: 10, color: S.navy, fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 0.5 }}>
                {loading === 'civic_pack_subscription' ? 'Redirecting…' : '★ Civic Pack — $9.99/mo'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${S.border}`, padding: '24px', textAlign: 'center', fontSize: 12, color: S.gray }}>
        <div style={{ marginBottom: 12 }}>
          <Link href="/dashboard" style={{ color: S.gray, textDecoration: 'none', marginRight: 20 }}>Dashboard</Link>
          <Link href="/privacy" style={{ color: S.gray, textDecoration: 'none', marginRight: 20 }}>Privacy</Link>
          <Link href="/terms" style={{ color: S.gray, textDecoration: 'none', marginRight: 20 }}>Terms</Link>
          <Link href="/refund-policy" style={{ color: S.gray, textDecoration: 'none', marginRight: 20 }}>Refund Policy</Link>
          <Link href="/privacy#ccpa" style={{ color: S.gray, textDecoration: 'none' }}>Do Not Sell My Personal Information</Link>
        </div>
        <div>© {new Date().getFullYear()} CivicWatch · For informational purposes only · Not legal or financial advice</div>
      </footer>
    </div>
  )
}
