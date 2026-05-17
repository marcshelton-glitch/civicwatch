'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const CapitolScene = dynamic(() => import('@/components/CapitolScene'), { ssr: false })

const STATS = [
  { prefix: '$', num: 174, suffix: 'K', label: 'Average congressional salary' },
  { prefix: '$', num: 1.9, suffix: 'M', decimals: 1, label: 'Average member net worth' },
  { prefix: '', num: 3847, suffix: '', label: 'STOCK Act trades in 2024' },
  { prefix: '', num: 535, suffix: '', label: 'Members tracked' },
]

const FEATURES = [
  {
    icon: '⚖️',
    title: 'Voting Records',
    desc: 'Every vote, every bill. See exactly where your representative stood — and how it compares to their campaign promises.',
  },
  {
    icon: '💰',
    title: 'Stock Trade Disclosures',
    desc: 'STOCK Act filings made readable. Cross-referenced against committee assignments and legislative activity.',
  },
  {
    icon: '📈',
    title: 'Wealth Trajectory',
    desc: 'Net worth before and after office. The numbers that the financial disclosure forms bury in fine print.',
  },
  {
    icon: '🤖',
    title: 'AI Accountability Reports',
    desc: "Nonpartisan AI analysis of each member's full record — trades, votes, wealth, and peer standing — in plain English.",
  },
  {
    icon: '🔔',
    title: 'Track My Rep™ Alerts',
    desc: 'Get notified the moment your representative votes, discloses a trade, or schedules a town hall.',
  },
  {
    icon: '🗺️',
    title: 'District Map',
    desc: 'Find every federal and local representative for any state. Click to explore their full profile.',
  },
]

const FALLBACK_TICKER = [
  'Sen. Warren · NVDA BUY · $15,001–$50,000',
  'Rep. Pelosi · AAPL BUY · $500,001–$1M',
  'Sen. Tuberville · TSLA SELL · $50,001–$100,000',
  'Rep. McCaul · MSFT BUY · $100,001–$250,000',
  'Sen. Manchin · JPM SELL · $15,001–$50,000',
]

function fmtTrade(t) {
  const type = (t.type || '').toUpperCase()
  const isBuy = type.includes('PURCHASE') || type.includes('BUY')
  const isSell = type.includes('SALE') || type.includes('SELL')
  const label = isBuy ? 'BUY' : isSell ? 'SELL' : type || 'TRADE'
  const name = t.name || 'Member'
  const ticker = t.ticker ? ` · ${t.ticker}` : ''
  const amount = t.amount ? ` · ${t.amount}` : ''
  return { text: `${name}${ticker} ${label}${amount}`, isBuy, isSell }
}

function TiltCard({ children, style, className, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onMove(e) {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.transform = `perspective(900px) rotateX(${(y - 0.5) * 10}deg) rotateY(${(x - 0.5) * -10}deg) scale3d(1.02,1.02,1.02)`
      el.style.setProperty('--gx', `${x * 100}%`)
      el.style.setProperty('--gy', `${y * 100}%`)
      el.style.setProperty('--go', '1')
    }
    function onLeave() {
      el.style.transform = ''
      el.style.setProperty('--go', '0')
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        transition: 'transform 0.15s ease',
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...rest}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(124,124,255,0.18) 0%, transparent 55%)',
        opacity: 'var(--go, 0)',
        transition: 'opacity 0.3s',
      }} />
      {children}
    </div>
  )
}

function StatCounter({ prefix, num, suffix, decimals = 0, label, started }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!started) return
    const duration = 1800
    const t0 = performance.now()
    let raf

    function tick(now) {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(eased * num)
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, num])

  const display = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString()

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 'clamp(36px,4vw,52px)',
        fontWeight: 800,
        letterSpacing: '-1px',
        color: '#7c7cff',
        lineHeight: 1,
        marginBottom: 12,
      }}>
        {prefix}{display}{suffix}
      </div>
      <div style={{
        fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#64748b', lineHeight: 1.5,
      }}>
        {label}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [statsStarted, setStatsStarted] = useState(false)
  const statsRef = useRef(null)
  const featuresRef = useRef(null)
  const [tickerItems, setTickerItems] = useState(
    FALLBACK_TICKER.map(t => ({ text: t, isBuy: t.includes('BUY'), isSell: t.includes('SELL') }))
  )

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/dashboard')
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    fetch('/api/public-feed')
      .then(r => r.json())
      .then(data => {
        if (data.trades && data.trades.length >= 4) setTickerItems(data.trades.map(fmtTrade))
      })
      .catch(() => {})
  }, [])

  // Scroll parallax
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Stats counter trigger
  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsStarted(true)
        obs.disconnect()
      }
    }, { threshold: 0.3 })
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  // Feature card staggered reveal
  useEffect(() => {
    if (!featuresRef.current) return
    const cards = featuresRef.current.querySelectorAll('[data-card]')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0')
          setTimeout(() => {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          }, delay)
          obs.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    cards.forEach(c => obs.observe(c))
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#07070f',
      color: '#e2e8f0',
      overflowX: 'hidden',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #07070f;
          --accent: #7c7cff;
          --accent-dim: rgba(124,124,255,0.1);
          --accent-border: rgba(124,124,255,0.18);
          --card-bg: rgba(255,255,255,0.03);
          --card-border: rgba(255,255,255,0.07);
          --text: #e2e8f0;
          --dim: #94a3b8;
          --dimmer: #64748b;
          --green: #4ade80;
          --red: #f87171;
        }

        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px;
          background: rgba(7,7,15,0.75);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid var(--accent-border);
        }

        .lp-logo {
          font-size: 15px; font-weight: 800; letter-spacing: 0.12em;
          color: #fff; text-decoration: none; text-transform: uppercase;
        }
        .lp-logo span { color: var(--accent); }

        .lp-nav-actions { display: flex; gap: 10px; align-items: center; }

        .btn-ghost {
          padding: 7px 18px;
          background: transparent;
          border: 1px solid var(--card-border);
          border-radius: 8px;
          color: var(--dim); font-size: 13px; font-weight: 500;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

        .btn-accent {
          padding: 7px 18px;
          background: var(--accent);
          border: none; border-radius: 8px;
          color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-accent:hover { opacity: 0.85; transform: translateY(-1px); }

        /* HERO */
        .lp-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          overflow: hidden;
        }

        .lp-hero-content {
          position: relative; z-index: 10;
          max-width: 1200px; margin: 0 auto;
          padding: 100px 48px 80px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }

        .lp-hero-left { display: flex; flex-direction: column; gap: 28px; }

        .lp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 5px 14px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-border);
          border-radius: 100px;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--accent); width: fit-content;
          animation: fadeSlideUp 0.7s ease both;
        }

        .lp-live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px #4ade80;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .lp-headline {
          font-size: clamp(36px, 4.5vw, 62px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: #fff;
          animation: fadeSlideUp 0.7s 0.1s ease both;
        }

        .lp-headline .acc { color: var(--accent); }

        .lp-sub {
          font-size: clamp(15px, 1.6vw, 18px);
          color: var(--dim);
          line-height: 1.7;
          font-weight: 400;
          max-width: 480px;
          animation: fadeSlideUp 0.7s 0.2s ease both;
        }

        .lp-ctas {
          display: flex; gap: 12px; flex-wrap: wrap;
          animation: fadeSlideUp 0.7s 0.3s ease both;
        }

        .btn-hero-primary {
          padding: 13px 28px;
          background: var(--accent);
          border: none; border-radius: 10px;
          color: #fff; font-size: 15px; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(124,124,255,0.35);
        }
        .btn-hero-primary:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124,124,255,0.5); }

        .btn-hero-ghost {
          padding: 13px 28px;
          background: transparent;
          border: 1px solid var(--card-border);
          border-radius: 10px;
          color: var(--dim); font-size: 15px; font-weight: 500;
          cursor: pointer; text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-hero-ghost:hover { border-color: var(--accent); color: var(--accent); }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* TICKER */
        .lp-ticker-wrap {
          width: 100%; overflow: hidden;
          background: rgba(124,124,255,0.04);
          border-top: 1px solid var(--accent-border);
          border-bottom: 1px solid var(--accent-border);
          padding: 11px 0;
        }

        .lp-ticker-track {
          display: flex;
          animation: ticker 40s linear infinite;
          width: max-content;
        }
        .lp-ticker-track:hover { animation-play-state: paused; }

        .lp-ticker-item {
          display: flex; align-items: center; gap: 8px;
          padding: 0 28px;
          font-size: 12px; letter-spacing: 0.04em;
          color: var(--dimmer);
          border-right: 1px solid var(--card-border);
          white-space: nowrap;
        }

        .ticker-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* STATS */
        .lp-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--card-border);
          border-bottom: 1px solid var(--card-border);
        }

        .lp-stat-cell {
          border-right: 1px solid var(--card-border);
          transition: background 0.3s;
        }
        .lp-stat-cell:last-child { border-right: none; }
        .lp-stat-cell:hover { background: var(--accent-dim); }

        /* FEATURES */
        .lp-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--card-border);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .lp-feature-card {
          padding: 32px 28px;
          background: var(--bg);
          cursor: default;
          opacity: 0;
          transform: translateY(28px);
          transition: background 0.3s, opacity 0.5s ease, transform 0.5s ease;
          position: relative;
          overflow: hidden;
        }
        .lp-feature-card:hover { background: rgba(124,124,255,0.04); }

        .lp-feat-icon { font-size: 26px; margin-bottom: 14px; }
        .lp-feat-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .lp-feat-desc { font-size: 13px; color: var(--dimmer); line-height: 1.65; }

        /* SECTION HEADERS */
        .lp-section-label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 14px; text-align: center;
        }
        .lp-section-title {
          font-size: clamp(26px, 3.5vw, 44px); font-weight: 800;
          letter-spacing: -0.02em; line-height: 1.1;
          color: #fff; text-align: center; margin-bottom: 14px;
        }
        .lp-section-sub {
          font-size: 16px; color: var(--dim); line-height: 1.7;
          text-align: center; max-width: 520px; margin: 0 auto 52px;
        }

        /* PREVIEW CARD */
        .lp-preview-card {
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--card-border);
          background: rgba(255,255,255,0.02);
          transition: transform 0.15s ease;
          position: relative;
        }
        .lp-preview-header {
          padding: 14px 22px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid var(--card-border);
          display: flex; align-items: center; gap: 10px;
        }
        .lp-dot { width: 10px; height: 10px; border-radius: 50%; }
        .lp-preview-body {
          padding: 28px;
          display: grid; grid-template-columns: repeat(3,1fr); gap: 14px;
        }
        .lp-mock-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--card-border);
          border-radius: 10px; padding: 16px;
        }
        .lp-mock-label {
          font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--dimmer); margin-bottom: 10px;
        }
        .lp-mock-value { font-size: 22px; font-weight: 700; }
        .lp-mock-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 11px;
        }
        .lp-mock-row:last-child { border-bottom: none; }

        /* PRICING */
        .lp-pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .lp-pricing-card {
          border-radius: 14px; padding: 36px 32px;
          border: 1px solid var(--card-border);
          background: rgba(255,255,255,0.02);
          position: relative; overflow: hidden;
          transition: transform 0.15s ease;
        }
        .lp-pricing-card.featured {
          border-color: var(--accent-border);
          background: rgba(124,124,255,0.06);
        }

        .lp-pricing-badge {
          position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
          background: var(--accent);
          color: #fff; font-size: 10px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 3px 16px; border-radius: 0 0 10px 10px; white-space: nowrap;
        }
        .lp-pricing-tier { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--dimmer); margin-bottom: 10px; }
        .lp-pricing-price { font-size: 52px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; margin-bottom: 6px; }
        .lp-pricing-desc { font-size: 13px; color: var(--dim); margin-bottom: 24px; line-height: 1.6; }
        .lp-pricing-features { list-style: none; margin-bottom: 28px; }
        .lp-pricing-features li {
          padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 13px; color: var(--dimmer);
          display: flex; align-items: center; gap: 10px;
        }
        .lp-pricing-features li:last-child { border-bottom: none; }
        .lp-pricing-features li::before { content: '✓'; color: var(--accent); font-weight: 700; }

        .btn-plan-free {
          width: 100%; padding: 12px; border-radius: 8px;
          background: transparent; border: 1px solid var(--card-border);
          color: var(--dim); font-size: 14px; font-weight: 600;
          cursor: pointer; text-decoration: none; display: block; text-align: center;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-plan-free:hover { border-color: var(--accent); color: var(--accent); }

        .btn-plan-pro {
          width: 100%; padding: 12px; border-radius: 8px;
          background: var(--accent); border: none;
          color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; text-decoration: none; display: block; text-align: center;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 20px rgba(124,124,255,0.35);
        }
        .btn-plan-pro:hover { opacity: 0.85; transform: translateY(-1px); }

        /* CTA */
        .lp-cta {
          padding: 120px 24px; text-align: center;
          position: relative; overflow: hidden;
        }
        .lp-cta-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(124,124,255,0.08) 0%, transparent 70%);
        }

        /* FOOTER */
        .lp-footer {
          border-top: 1px solid var(--card-border);
          padding: 40px 24px; text-align: center;
        }
        .lp-footer-logo {
          font-size: 14px; font-weight: 800; letter-spacing: 0.12em;
          color: var(--accent); margin-bottom: 16px;
        }
        .lp-footer-links {
          display: flex; gap: 24px; justify-content: center;
          flex-wrap: wrap; margin-bottom: 20px;
        }
        .lp-footer-links a {
          font-size: 12px; color: var(--dimmer);
          text-decoration: none; transition: color 0.2s;
        }
        .lp-footer-links a:hover { color: var(--accent); }
        .lp-footer-copy { font-size: 11px; color: var(--dimmer); line-height: 1.7; max-width: 700px; margin: 0 auto; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .lp-hero-content { grid-template-columns: 1fr; }
          .lp-hero-right { display: none; }
          .lp-stats { grid-template-columns: repeat(2,1fr); }
          .lp-features-grid { grid-template-columns: 1fr; }
          .lp-preview-body { grid-template-columns: 1fr; }
          .lp-pricing-grid { grid-template-columns: 1fr; }
          .lp-nav { padding: 0 16px; }
          .lp-hero-content { padding: 90px 20px 60px; }
        }

        @media (max-width: 600px) {
          .lp-stats { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <Link href="/" className="lp-logo">CIVIC<span>WATCH</span></Link>
        <div className="lp-nav-actions">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-accent">Dashboard →</Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost">Sign In</Link>
              <Link href="/dashboard" className="btn-accent">Explore Free →</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        {/* Three.js canvas — fills full hero, parallax on scroll */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translateY(${scrollY * 0.25}px)`,
          willChange: 'transform',
        }}>
          <CapitolScene />
        </div>

        {/* Left-side gradient fade for text legibility */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(100deg, #07070f 42%, rgba(7,7,15,0.7) 62%, transparent 80%)',
        }} />
        {/* Bottom fade into ticker */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent, #07070f)',
        }} />

        {/* Hero content grid */}
        <div className="lp-hero-content" style={{ transform: `translateY(${scrollY * -0.06}px)` }}>
          <div className="lp-hero-left">
            <div className="lp-eyebrow">
              <span className="lp-live-dot" />
              Live · Congress.gov · STOCK Act Disclosures
            </div>

            <h1 className="lp-headline">
              See exactly how your<br />
              Elected Representatives<br />
              <span className="acc">voted, traded,</span><br />
              and got rich.
            </h1>

            <p className="lp-sub">
              CivicWatch pulls live voting records, STOCK Act trade disclosures,
              and financial filings — then puts them in plain English.
              No spin. No party line. Just the record.
            </p>

            <div className="lp-ctas">
              <Link href="/dashboard" className="btn-hero-primary">
                {isSignedIn ? 'Go to Dashboard →' : 'Explore Live Data — No Login →'}
              </Link>
              {!isSignedIn && (
                <Link href="/sign-in" className="btn-hero-ghost">Sign In</Link>
              )}
            </div>
          </div>

          {/* Right column is just empty — Capitol fills that space via canvas */}
          <div className="lp-hero-right" />
        </div>
      </section>

      {/* TICKER */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className="lp-ticker-item">
              <span className="ticker-dot" style={{
                background: item.isBuy ? '#4ade80' : item.isSell ? '#f87171' : '#7c7cff',
              }} />
              <span style={{ color: item.isBuy ? '#4ade80' : item.isSell ? '#f87171' : '#94a3b8' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section ref={statsRef} className="lp-stats">
        {STATS.map((s, i) => (
          <div key={i} className="lp-stat-cell">
            <StatCounter {...s} started={statsStarted} />
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="lp-section-label">What CivicWatch Tracks</div>
        <h2 className="lp-section-title">
          Everything they'd rather<br />you didn't know
        </h2>
        <p className="lp-section-sub">
          Six layers of accountability data, aggregated from official government sources
          and made searchable in seconds.
        </p>

        <div className="lp-features-grid" ref={featuresRef}>
          {FEATURES.map((f, i) => (
            <TiltCard
              key={i}
              className="lp-feature-card"
              data-card
              data-delay={i * 80}
            >
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="lp-feat-icon">{f.icon}</div>
                <div className="lp-feat-title">{f.title}</div>
                <div className="lp-feat-desc">{f.desc}</div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* LIVE PREVIEW */}
      <section style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="lp-section-label">Live Data Preview</div>
        <h2 className="lp-section-title" style={{ marginBottom: 40 }}>The record, unfiltered</h2>

        <TiltCard className="lp-preview-card">
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="lp-preview-header">
              <div className="lp-dot" style={{ background: '#FF5F57' }} />
              <div className="lp-dot" style={{ background: '#FFBD2E' }} />
              <div className="lp-dot" style={{ background: '#28CA41' }} />
              <span style={{ fontSize: 12, color: 'var(--dimmer)', marginLeft: 8 }}>
                CivicWatch — Representative Profile
              </span>
            </div>

            <div className="lp-preview-body">
              {/* Wealth */}
              <div className="lp-mock-card">
                <div className="lp-mock-label">Wealth Change in Office</div>
                <div className="lp-mock-value" style={{ color: '#f87171', marginBottom: 8 }}>+625%</div>
                <div style={{ fontSize: 11, color: 'var(--dimmer)', marginBottom: 12 }}>$1.2M → $8.7M · 15 years</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '85%', background: 'linear-gradient(90deg,#7c7cff,#f87171)', borderRadius: 2 }} />
                </div>
              </div>
              {/* Votes */}
              <div className="lp-mock-card">
                <div className="lp-mock-label">Recent Votes</div>
                {[
                  { bill: 'Inflation Reduction Act', vote: 'YEA' },
                  { bill: 'Healthcare Expansion', vote: 'YEA' },
                  { bill: 'Border Security Act', vote: 'NAY' },
                  { bill: 'Defense Appropriations', vote: 'YEA' },
                ].map((v, i) => (
                  <div key={i} className="lp-mock-row">
                    <span style={{ color: 'var(--dimmer)', fontSize: 11 }}>{v.bill}</span>
                    <span style={{ color: v.vote === 'YEA' ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 11 }}>{v.vote}</span>
                  </div>
                ))}
              </div>
              {/* Trades */}
              <div className="lp-mock-card">
                <div className="lp-mock-label">STOCK Act Disclosures</div>
                {[
                  { asset: 'NVDA', type: 'BUY', amount: '$45K' },
                  { asset: 'ETH',  type: 'BUY', amount: '$22K' },
                  { asset: 'PFE',  type: 'SELL', amount: '$31K' },
                  { asset: 'TSLA', type: 'BUY', amount: '$18K' },
                ].map((t, i) => (
                  <div key={i} className="lp-mock-row">
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{t.asset}</span>
                    <span style={{ color: t.type === 'BUY' ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: 11 }}>{t.type}</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 11 }}>{t.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blurred AI teaser */}
            <div style={{
              margin: '0 28px 28px', padding: 18,
              background: 'rgba(124,124,255,0.04)',
              border: '1px solid var(--accent-border)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                  🤖 AI Accountability Report
                </div>
                <div style={{ fontSize: 13, color: 'var(--dim)', filter: 'blur(4px)', userSelect: 'none' }}>
                  This member's trading activity shows a notable pattern of purchasing technology stocks within weeks of serving on the Senate Commerce Committee...
                </div>
              </div>
              <Link href="/sign-up" style={{
                padding: '10px 20px', background: 'var(--accent)',
                borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700,
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(124,124,255,0.35)',
              }}>
                Unlock Full Report →
              </Link>
            </div>
          </div>
        </TiltCard>
      </section>

      {/* PRICING */}
      <section style={{ padding: '0 24px 100px', maxWidth: 900, margin: '0 auto' }}>
        <div className="lp-section-label">Pricing</div>
        <h2 className="lp-section-title">Accountability shouldn't<br />cost a fortune</h2>
        <p className="lp-section-sub">Start free. Upgrade when you want the full picture.</p>

        <div className="lp-pricing-grid">
          <TiltCard className="lp-pricing-card">
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div className="lp-pricing-tier">Free</div>
              <div className="lp-pricing-price">$0</div>
              <div className="lp-pricing-desc">Everything you need to start holding your representatives accountable.</div>
              <ul className="lp-pricing-features">
                {['Browse all 535 representatives','Full voting records','STOCK Act trade disclosures','District map','Constitution reference','AI analysis preview'].map((f,i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <Link href="/dashboard" className="btn-plan-free">Explore Free — No Login Needed</Link>
            </div>
          </TiltCard>

          <TiltCard className="lp-pricing-card featured">
            <div className="lp-pricing-badge">★ Most Popular</div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div className="lp-pricing-tier" style={{ color: 'var(--accent)' }}>Pro</div>
              <div className="lp-pricing-price" style={{ color: 'var(--accent)' }}>
                $9<span style={{ fontSize: 28, fontWeight: 400, color: 'var(--dim)' }}>.99<span style={{ fontSize: 16 }}>/mo</span></span>
              </div>
              <div className="lp-pricing-desc">The full accountability picture, powered by AI.</div>
              <ul className="lp-pricing-features">
                {['Everything in Free','Full AI accountability reports','Trade conflict analysis','Wealth trajectory deep-dive','Peer standing breakdown','Track My Rep™ alerts','Priority support'].map((f,i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <Link href="/sign-up" className="btn-plan-pro">Start Pro — $9.99/mo</Link>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-glow" />
        <div className="lp-eyebrow" style={{ display: 'inline-flex', marginBottom: 28 }}>
          🏛️ Free to start · No credit card required
        </div>
        <h2 className="lp-section-title" style={{ marginBottom: 16, position: 'relative' }}>
          Your representatives work<br />
          for <span style={{ color: 'var(--accent)' }}>you.</span><br />
          Start holding them to it.
        </h2>
        <p className="lp-section-sub" style={{ position: 'relative' }}>
          Join thousands of Americans who use CivicWatch to stay informed
          and hold power accountable — at every level of government.
        </p>
        <div style={{ position: 'relative', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-hero-primary">
            Explore Live Data — No Login →
          </Link>
          {!isSignedIn && (
            <Link href="/sign-up" className="btn-hero-ghost">Create Free Account</Link>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">CIVICWATCH™</div>
        <div className="lp-footer-links">
          <Link href="/sign-up">Sign Up</Link>
          <Link href="/sign-in">Sign In</Link>
          <Link href="/about">About</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://congress.gov" target="_blank" rel="noreferrer noopener">Congress.gov</a>
          <a href="https://disclosures-clerk.house.gov" target="_blank" rel="noreferrer noopener">House Disclosures</a>
        </div>
        <div className="lp-footer-copy">
          Data sourced from Congress.gov, House Clerk STOCK Act Disclosures, Senate Financial Disclosures, and LegiScan LLC (CC BY 4.0).<br />
          CivicWatch is an independent accountability platform. Not affiliated with any government agency or political party.<br />
          © {new Date().getFullYear()} CivicWatch. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
