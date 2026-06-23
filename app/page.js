'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'


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
    desc: 'Nonpartisan AI analysis of each member\'s full record — trades, votes, wealth, and peer standing — in plain English.',
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

const HOW_IT_WORKS = [
  {
    icon: '🔍',
    title: 'Search for your representatives',
    desc: 'Find any member of Congress by name or state. Our full database covers all 535 members of the Senate and House of Representatives.',
  },
  {
    icon: '📊',
    title: 'Track their trades',
    desc: 'See real-time stock trade disclosures required by the STOCK Act — every buy and sell, cross-referenced against committee assignments.',
  },
  {
    icon: '🗳️',
    title: 'Monitor their votes',
    desc: 'Follow how your reps vote on legislation that affects you — from healthcare and defense to taxes and climate policy.',
  },
  {
    icon: '🔔',
    title: 'Set alerts',
    desc: 'Get notified the moment a tracked representative makes a new trade disclosure or casts a key vote. Stay informed without the noise.',
  },
]

const FALLBACK_TICKER = [
  'Fetching live trade disclosures…',
  'Loading STOCK Act activity…',
  'Connecting to disclosure feed…',
  'Live congressional trades loading…',
  'Fetching recent activity…',
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

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)
  const tickerRef = useRef(null)
  const [tickerItems, setTickerItems] = useState(FALLBACK_TICKER.map(t => ({ text: t, isBuy: t.includes('BUY'), isSell: t.includes('SELL') })))
  const [tradeCount, setTradeCount] = useState('5,000+')

  useEffect(() => {
    const rep = new URLSearchParams(window.location.search).get('rep')
    if (rep) {
      router.replace(`/dashboard?rep=${rep}`)
    }
  }, [router])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const repParam = new URLSearchParams(window.location.search).get('rep')
      router.replace(repParam ? `/dashboard?rep=${repParam}` : '/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => { if (d.trades > 0) setTradeCount(d.trades.toLocaleString()) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/public-feed')
      .then(r => r.json())
      .then(data => {
        if (data.trades && data.trades.length >= 4) {
          setTickerItems(data.trades.map(fmtTrade))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const STATS = [
    { value: '$174K', label: 'Average congressional salary' },
    { value: '$1.9M', label: 'Average member net worth' },
    { value: tradeCount, label: 'STOCK Act Trades Tracked' },
    { value: '535', label: 'Members tracked' },
  ]

  return (
    <div style={{
      fontFamily: "'Source Serif 4', Georgia, serif",
      background: '#080E1C',
      color: '#F0F2FF',
      overflowX: 'hidden',
      minHeight: '100vh',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #080E1C;
          --navy-mid: #0F1A35;
          --navy-light: #1B2A6B;
          --red: #B22234;
          --red-bright: #D42B42;
          --gold: #D4AF37;
          --gold-dim: rgba(212,175,55,0.15);
          --white: #F0F2FF;
          --gray: #7A8499;
          --border: rgba(212,175,55,0.2);
        }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 1;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .nav { 
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 32px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
          background: rgba(8,14,28,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }

        .nav-logo {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }

        .nav-actions { display: flex; gap: 12px; align-items: center; }

        .btn-ghost {
          padding: 8px 20px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--gray);
          font-family: inherit; font-size: 13px;
          cursor: pointer; text-decoration: none;
          transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

        .btn-primary {
          padding: 8px 20px;
          background: linear-gradient(135deg, var(--red), #8B1A2A);
          border: none; border-radius: 6px;
          color: white; font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(178,34,52,0.5); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          justify-content: center; align-items: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
        }

        /* ── Animated hero background glows — 15s cycle, 5s per color ── */
        .hero-bg {
          position: absolute; inset: 0;
          overflow: hidden; pointer-events: none;
        }

        /* Red: visible 0–5s */
        .hero-glow-red {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 140%; height: 120%;
          background: radial-gradient(ellipse 60% 55% at 50% 30%,
            rgba(178,34,52,0.52) 0%,
            rgba(178,34,52,0.18) 45%,
            transparent 70%);
          animation: glowRed 15s ease-in-out infinite;
          will-change: opacity, transform;
        }

        /* Blue: visible 5–10s */
        .hero-glow-blue {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 140%; height: 120%;
          background: radial-gradient(ellipse 60% 55% at 50% 30%,
            rgba(27,82,180,0.52) 0%,
            rgba(36,58,140,0.18) 45%,
            transparent 70%);
          animation: glowBlue 15s ease-in-out infinite;
          will-change: opacity, transform;
        }

        /* Gold: visible 10–15s */
        .hero-glow-gold {
          position: absolute;
          top: -20%; left: 50%;
          transform: translateX(-50%);
          width: 140%; height: 120%;
          background: radial-gradient(ellipse 60% 55% at 50% 30%,
            rgba(212,175,55,0.48) 0%,
            rgba(212,175,55,0.14) 45%,
            transparent 70%);
          animation: glowGold 15s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @keyframes glowRed {
          0%   { opacity: 0;   transform: translateX(-50%) scale(1); }
          4%   { opacity: 1;   transform: translateX(-50%) scale(1.06); }
          25%  { opacity: 1;   transform: translateX(-50%) scale(1.14); }
          33%  { opacity: 0;   transform: translateX(-50%) scale(1.00); }
          100% { opacity: 0;   transform: translateX(-50%) scale(1); }
        }

        @keyframes glowBlue {
          0%   { opacity: 0;   transform: translateX(-50%) scale(1); }
          33%  { opacity: 0;   transform: translateX(-50%) scale(1); }
          37%  { opacity: 1;   transform: translateX(-50%) scale(1.06); }
          58%  { opacity: 1;   transform: translateX(-50%) scale(1.14); }
          66%  { opacity: 0;   transform: translateX(-50%) scale(1.00); }
          100% { opacity: 0;   transform: translateX(-50%) scale(1); }
        }

        @keyframes glowGold {
          0%   { opacity: 0;   transform: translateX(-50%) scale(1); }
          66%  { opacity: 0;   transform: translateX(-50%) scale(1); }
          70%  { opacity: 1;   transform: translateX(-50%) scale(1.06); }
          91%  { opacity: 1;   transform: translateX(-50%) scale(1.14); }
          100% { opacity: 0;   transform: translateX(-50%) scale(0.98); }
        }

        .hero-stripe {
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--red) 33%, #F0F2FF 33%, #F0F2FF 66%, var(--navy-light) 66%);
        }

        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px;
          background: rgba(212,175,55,0.08);
          border: 1px solid var(--border);
          border-radius: 30px;
          font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase;
          color: var(--gold); margin-bottom: 32px;
          animation: fadeUp 0.6s ease forwards;
        }

        .hero-headline {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: clamp(42px, 7vw, 88px);
          line-height: 1.05;
          letter-spacing: -1px;
          max-width: 900px;
          margin-bottom: 12px;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .hero-headline .accent { 
          color: var(--gold);
          font-style: italic;
        }

        .hero-headline .red { color: var(--red-bright); }

        .hero-sub {
          font-size: clamp(16px, 2vw, 20px);
          color: var(--gray);
          max-width: 560px;
          line-height: 1.7;
          margin-bottom: 40px;
          font-weight: 300;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .hero-ctas {
          display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
          margin-bottom: 64px;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .btn-hero {
          padding: 15px 36px;
          background: linear-gradient(135deg, var(--red), #8B1A2A);
          border: none; border-radius: 8px;
          color: white; font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 700;
          cursor: pointer; text-decoration: none;
          transition: all 0.25s;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 24px rgba(178,34,52,0.4);
        }
        .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(178,34,52,0.55); }

        .btn-hero-ghost {
          padding: 15px 36px;
          background: transparent;
          border: 1px solid rgba(212,175,55,0.4);
          border-radius: 8px;
          color: var(--gold); font-family: inherit;
          font-size: 16px; font-weight: 400;
          cursor: pointer; text-decoration: none;
          transition: all 0.25s;
        }
        .btn-hero-ghost:hover { background: var(--gold-dim); border-color: var(--gold); }

        /* TICKER */
        .ticker-wrap {
          width: 100%; overflow: hidden;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: rgba(15,26,53,0.8);
          padding: 12px 0;
          animation: fadeUp 0.6s 0.4s ease both;
        }

        .ticker-track {
          display: flex; gap: 0;
          animation: ticker 40s linear infinite;
          width: max-content;
        }
        .ticker-track:hover { animation-play-state: paused; }

        .ticker-item {
          display: flex; align-items: center; gap: 8px;
          padding: 0 32px;
          font-size: 12px; letter-spacing: 0.5px;
          color: var(--gray);
          border-right: 1px solid var(--border);
          white-space: nowrap;
        }

        .ticker-dot {
          width: 6px; height: 6px; border-radius: 50%;
          flex-shrink: 0;
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* STATS */
        .stats-section {
          padding: 80px 24px;
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2px;
          position: relative;
        }

        .stat-card {
          padding: 40px 32px;
          background: rgba(15,26,53,0.5);
          border: 1px solid var(--border);
          text-align: center;
          position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--red), var(--gold));
          opacity: 0;
          transition: opacity 0.3s;
        }
        .stat-card:hover::before { opacity: 1; }

        .stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 48px; font-weight: 900;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 12px; letter-spacing: 1px; text-transform: uppercase;
          color: var(--gray); line-height: 1.5;
        }

        /* SECTION LABEL */
        .section-label {
          text-align: center;
          font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
          color: var(--gold); margin-bottom: 16px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 4vw, 48px);
          font-weight: 900; text-align: center;
          margin-bottom: 16px; line-height: 1.1;
        }

        .section-sub {
          text-align: center; color: var(--gray);
          font-size: 16px; line-height: 1.7;
          max-width: 540px; margin: 0 auto 56px;
          font-weight: 300;
        }

        /* FEATURES */
        .features-section {
          padding: 80px 24px;
          max-width: 1100px; margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .feature-card {
          padding: 36px 32px;
          background: #080E1C;
          transition: background 0.3s;
          position: relative;
        }
        .feature-card:hover { background: rgba(15,26,53,0.9); }

        .feature-icon {
          font-size: 28px; margin-bottom: 16px; display: block;
        }

        .feature-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          margin-bottom: 10px; color: var(--white);
        }

        .feature-desc {
          font-size: 14px; color: var(--gray);
          line-height: 1.7; font-weight: 300;
        }

        /* MOCKUP / PREVIEW */
        .preview-section {
          padding: 80px 24px;
          max-width: 1100px; margin: 0 auto;
        }

        .preview-card {
          background: linear-gradient(145deg, rgba(27,42,107,0.4), rgba(8,14,28,0.95));
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
        }

        .preview-header {
          padding: 16px 24px;
          background: rgba(15,26,53,0.8);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; gap: 12px;
        }

        .preview-dot { width: 10px; height: 10px; border-radius: 50%; }

        .preview-body {
          padding: 32px;
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .mock-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
        }

        .mock-label {
          font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
          color: var(--gray); margin-bottom: 10px;
        }

        .mock-value {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700;
        }

        .mock-row {
          display: flex; justify-content: space-between;
          align-items: center; padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 12px;
        }
        .mock-row:last-child { border-bottom: none; }

        .yea { color: #4CAF50; font-weight: 700; }
        .nay { color: var(--red-bright); font-weight: 700; }
        .buy { color: #4CAF50; font-weight: 700; }
        .sell { color: var(--red-bright); font-weight: 700; }

        /* PRICING */
        .pricing-section {
          padding: 80px 24px;
          max-width: 900px; margin: 0 auto;
        }

        .pricing-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }

        .pricing-card {
          border-radius: 16px;
          padding: 40px 36px;
          border: 1px solid var(--border);
          background: rgba(15,26,53,0.4);
          position: relative;
        }

        .pricing-card.featured {
          background: linear-gradient(145deg, rgba(27,42,107,0.6), rgba(8,14,28,0.95));
          border-color: var(--gold);
        }

        .pricing-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--gold), #B8960C);
          color: #080E1C; font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          padding: 4px 16px; border-radius: 20px; white-space: nowrap;
        }

        .pricing-tier {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: var(--gray); margin-bottom: 12px;
        }

        .pricing-price {
          font-family: 'Playfair Display', serif;
          font-size: 52px; font-weight: 900;
          line-height: 1; margin-bottom: 6px;
        }

        .pricing-price span {
          font-size: 18px; font-weight: 400; color: var(--gray);
        }

        .pricing-desc {
          font-size: 13px; color: var(--gray);
          margin-bottom: 28px; line-height: 1.6;
        }

        .pricing-features { list-style: none; margin-bottom: 32px; }
        .pricing-features li {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13px; color: var(--gray);
          display: flex; align-items: center; gap: 10px;
        }
        .pricing-features li:last-child { border-bottom: none; }
        .pricing-features li::before { content: '✓'; color: var(--gold); font-weight: 700; }

        .btn-plan {
          width: 100%; padding: 14px;
          border-radius: 8px; border: none;
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; text-decoration: none;
          display: block; text-align: center;
          transition: all 0.2s;
        }

        .btn-plan.free {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--gray);
        }
        .btn-plan.free:hover { border-color: var(--gold); color: var(--gold); }

        .btn-plan.pro {
          background: linear-gradient(135deg, var(--gold), #B8960C);
          color: #080E1C;
        }
        .btn-plan.pro:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(212,175,55,0.4); }

        /* CTA */
        .cta-section {
          padding: 100px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(178,34,52,0.1) 0%, transparent 70%);
        }

        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 5vw, 60px);
          font-weight: 900; line-height: 1.1;
          max-width: 700px; margin: 0 auto 20px;
          position: relative;
        }

        .cta-sub {
          font-size: 16px; color: var(--gray);
          max-width: 440px; margin: 0 auto 40px;
          line-height: 1.7; font-weight: 300;
          position: relative;
        }

        /* FOOTER */
        footer {
          border-top: 1px solid var(--border);
          padding: 40px 24px;
          text-align: center;
        }

        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-weight: 900; font-size: 18px; letter-spacing: 2px;
          color: var(--gold); margin-bottom: 16px;
        }

        .footer-links {
          display: flex; gap: 24px; justify-content: center;
          flex-wrap: wrap; margin-bottom: 20px;
        }

        .footer-links a {
          font-size: 12px; color: var(--gray);
          text-decoration: none; letter-spacing: 0.5px;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--gold); }

        .footer-copy {
          font-size: 11px; color: rgba(122,132,153,0.6);
          line-height: 1.6;
        }

        /* DIVIDER */
        .flag-stripe {
          height: 3px;
          background: linear-gradient(90deg, var(--red) 33%, #F0F2FF 33%, #F0F2FF 66%, var(--navy-light) 66%);
        }

        /* HOW IT WORKS */
        .hiw-section {
          padding: 80px 24px;
          max-width: 1100px; margin: 0 auto;
        }

        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
        }

        .hiw-step {
          padding: 32px;
          background: rgba(15,26,53,0.5);
          border: 1px solid var(--border);
          border-radius: 16px;
          position: relative;
          transition: border-color 0.3s, background 0.3s;
        }
        .hiw-step:hover { border-color: rgba(124,124,255,0.5); background: rgba(15,26,53,0.8); }

        .hiw-number {
          font-family: 'Playfair Display', serif;
          font-size: 56px; font-weight: 900;
          color: rgba(124,124,255,0.18);
          line-height: 1; margin-bottom: 16px;
        }

        .hiw-icon {
          font-size: 26px; margin-bottom: 12px; display: block;
        }

        .hiw-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          margin-bottom: 10px; color: var(--white);
        }

        .hiw-desc {
          font-size: 14px; color: var(--gray);
          line-height: 1.7; font-weight: 300;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .preview-body { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .nav { padding: 0 16px; }
          .hero { padding: 100px 16px 60px; }
          .hiw-steps { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Grain overlay */}
      <div className="grain" />

      {/* NAV */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <Image src="/brand/logo_civicwatch_horizontal.png" alt="CivicWatch" width={180} height={49} priority style={{display:'block'}} />
        </Link>
        <div className="nav-actions">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-primary">Go to Dashboard →</Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost">Sign In</Link>
              <Link href="/dashboard" className="btn-primary">Explore Free →</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-glow-red" />
          <div className="hero-glow-blue" />
          <div className="hero-glow-gold" />
        </div>
        <div className="hero-stripe" />

        <div className="eyebrow" style={{ position: 'relative' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
          Live · Congress.gov · STOCK Act Disclosures
        </div>

        <h1 className="hero-headline" style={{ position: 'relative' }}>
        See exactly how your<br />
Elected Representatives<br />
<span className="accent">voted, traded,</span><br />
and got <span className="red">rich.</span>
        </h1>

        <p className="hero-sub" style={{ position: 'relative' }}>
          CivicWatch pulls live voting records, STOCK Act trade disclosures,
          and financial filings — then puts them in plain English.
          No spin. No party line. Just the record.
        </p>

        <div className="hero-ctas" style={{ position: 'relative' }}>
          <Link href="/dashboard" className="btn-hero">
            {isSignedIn ? "Go to Dashboard →" : "Explore Live Data — No Login Required →"}
          </Link>
          {!isSignedIn && (
            <Link href="/sign-in" className="btn-hero-ghost">
              Sign In
            </Link>
          )}
          <button
            className="btn-hero-ghost"
            style={{ fontFamily: 'inherit' }}
            onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
          >
            See How It Works ↓
          </button>
        </div>

      </section>

      {/* TICKER — live congressional trade feed */}
      <div className="ticker-wrap" ref={tickerRef}>
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => {
            const dotColor = item.isBuy ? '#4CAF50' : item.isSell ? '#D42B42' : '#D4AF37'
            return (
              <div key={i} className="ticker-item">
                <span className="ticker-dot" style={{ background: dotColor }} />
                <span style={{ color: item.isBuy ? '#4CAF50' : item.isSell ? '#D42B42' : '#CDD2E0' }}>
                  {item.text}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* STATS */}
      <section style={{ background: 'rgba(15,26,53,0.3)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="stats-section">
          {STATS.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-label">What CivicWatch Tracks</div>
        <h2 className="section-title">
          Everything they'd rather<br />you didn't know
        </h2>
        <p className="section-sub">
          Six layers of accountability data, aggregated from official government sources
          and made searchable in seconds.
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flag-stripe" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* APP PREVIEW */}
      <section className="preview-section">
        <div className="section-label">Live Data Preview</div>
        <h2 className="section-title" style={{ marginBottom: 40 }}>
          The record, unfiltered
        </h2>
        <div className="preview-card">
          <div className="preview-header">
            <div className="preview-dot" style={{ background: '#FF5F57' }} />
            <div className="preview-dot" style={{ background: '#FFBD2E' }} />
            <div className="preview-dot" style={{ background: '#28CA41' }} />
            <span style={{ fontSize: 12, color: 'var(--gray)', marginLeft: 8 }}>CivicWatch — Representative Profile</span>
          </div>
          <div className="preview-body">
            {/* Wealth card */}
            <div className="mock-card">
              <div className="mock-label">Wealth Change in Office</div>
              <div className="mock-value" style={{ color: '#FF6B6B', marginBottom: 8 }}>+625%</div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>$1.2M → $8.7M · 15 years</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '85%', background: 'linear-gradient(90deg, #D4AF37, #B22234)', borderRadius: 2 }} />
              </div>
            </div>
            {/* Votes card */}
            <div className="mock-card">
              <div className="mock-label">Recent Votes</div>
              {[
                { bill: 'Inflation Reduction Act', vote: 'YEA' },
                { bill: 'Healthcare Expansion', vote: 'YEA' },
                { bill: 'Border Security Act', vote: 'NAY' },
                { bill: 'Defense Appropriations', vote: 'YEA' },
              ].map((v, i) => (
                <div key={i} className="mock-row">
                  <span style={{ color: 'var(--gray)', fontSize: 11 }}>{v.bill}</span>
                  <span className={v.vote === 'YEA' ? 'yea' : 'nay'}>{v.vote}</span>
                </div>
              ))}
            </div>
            {/* Trades card */}
            <div className="mock-card">
              <div className="mock-label">STOCK Act Disclosures</div>
              {[
                { asset: 'NVDA', type: 'BUY', amount: '$45K' },
                { asset: 'ETH', type: 'BUY', amount: '$22K' },
                { asset: 'PFE', type: 'SELL', amount: '$31K' },
                { asset: 'TSLA', type: 'BUY', amount: '$18K' },
              ].map((t, i) => (
                <div key={i} className="mock-row">
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{t.asset}</span>
                  <span className={t.type === 'BUY' ? 'buy' : 'sell'}>{t.type}</span>
                  <span style={{ color: 'var(--gray)', fontSize: 11 }}>{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Blur overlay teasing Pro */}
          <div style={{
            margin: '0 32px 32px',
            padding: 20,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>🤖 AI Accountability Report</div>
              <div style={{ fontSize: 13, color: 'var(--gray)', filter: 'blur(4px)', userSelect: 'none' }}>
                This member's trading activity shows a notable pattern of purchasing technology stocks within weeks of serving on the Senate Commerce Committee...
              </div>
            </div>
            <Link href="/sign-up" style={{
              padding: '10px 22px', background: 'linear-gradient(135deg, var(--gold), #B8960C)',
              borderRadius: 8, color: '#080E1C', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Unlock Full Report →
            </Link>
          </div>
        </div>
      </section>

      <div className="flag-stripe" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="hiw-section">
        <div className="section-label">How It Works</div>
        <h2 className="section-title">
          Follow the money.<br />Track the votes.
        </h2>
        <p className="section-sub">
          Four steps to hold your representatives accountable — no expertise required.
        </p>
        <div className="hiw-steps">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="hiw-step">
              <div className="hiw-number">{String(i + 1).padStart(2, '0')}</div>
              <span className="hiw-icon">{step.icon}</span>
              <div className="hiw-title">{step.title}</div>
              <div className="hiw-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="flag-stripe" style={{ maxWidth: 1100, margin: '0 auto' }} />

      {/* PRICING */}
      <section className="pricing-section">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">
          Accountability shouldn't<br />cost a fortune
        </h2>
        <p className="section-sub">
          Start free. Upgrade when you want the full picture.
        </p>
        <div className="pricing-grid">
          {/* Free */}
          <div className="pricing-card">
            <div className="pricing-tier">Free</div>
            <div className="pricing-price">$0</div>
            <div className="pricing-desc">Everything you need to start holding your representatives accountable.</div>
            <ul className="pricing-features">
              <li>Browse all 535 representatives</li>
              <li>Full voting records</li>
              <li>STOCK Act trade disclosures</li>
              <li>District map</li>
              <li>Constitution reference</li>
              <li>AI analysis preview</li>
            </ul>
            <Link href="/dashboard" className="btn-plan free">Explore Free — No Login Needed</Link>
          </div>
          {/* Pro */}
          <div className="pricing-card featured">
            <div className="pricing-badge">★ Most Popular</div>
            <div className="pricing-tier" style={{ color: 'var(--gold)' }}>Pro</div>
            <div className="pricing-price" style={{ color: 'var(--gold)' }}>
              $9.<span style={{ fontSize: 28, color: 'var(--gold)' }}>99</span>
              <span style={{ fontSize: 14 }}>/mo</span>
            </div>
            <div className="pricing-desc">The full accountability picture, powered by AI.</div>
            <ul className="pricing-features">
              <li>Everything in Free</li>
              <li>Full AI accountability reports</li>
              <li>Trade conflict analysis</li>
              <li>Wealth trajectory deep-dive</li>
              <li>Peer standing breakdown</li>
              <li>Track My Rep™ alerts</li>
              <li>Priority support</li>
            </ul>
            <Link href="/sign-up" className="btn-plan pro">Start Pro — $9.99/mo</Link>
          </div>
        </div>
      </section>

      <div className="flag-stripe" />

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div className="eyebrow" style={{ position: 'relative', display: 'inline-flex' }}>
          🏛️ Free to start · No credit card required
        </div>
        <h2 className="cta-title" style={{ position: 'relative' }}>
          Your representatives work<br />
          for <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>you.</span><br />
          Start holding them to it.
        </h2>
        <p className="cta-sub" style={{ position: 'relative' }}>
          Join thousands of Americans who use CivicWatch to stay informed
          and hold power accountable — at every level of government.
        </p>
        <div style={{ position: 'relative', display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-hero">
            Explore Live Data — No Login →
          </Link>
          {!isSignedIn && (
            <Link href="/sign-up" className="btn-hero-ghost">
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="flag-stripe" style={{ marginBottom: 40 }} />
        <div className="footer-logo">CIVIC<span style={{ color: '#D4AF37' }}>WATCH</span>™</div>
        <div className="footer-links">
          <Link href="/sign-up" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Sign Up</Link>
          <Link href="/sign-in" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/about" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>About</Link>
          <Link href="/privacy" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/data-deletion" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Data Deletion</Link>
          <Link href="/refund-policy" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Refund Policy</Link>
          <Link href="/privacy#ccpa" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Do Not Sell My Personal Information</Link>
          <a href="mailto:support@civicwatch.app" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Contact</a>
          <a href="https://congress.gov" target="_blank" rel="noreferrer noopener" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>Congress.gov</a>
          <a href="https://disclosures-clerk.house.gov" target="_blank" rel="noreferrer noopener" style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none' }}>House Disclosures</a>
        </div>
        <div className="footer-copy">
          Congressional financial disclosures and voting records are public record sourced from official U.S. government databases.<br />
          Data sourced from Congress.gov, House Clerk STOCK Act Disclosures, Senate Financial Disclosures, and LegiScan LLC (CC BY 4.0).<br />
          CivicWatch is an independent accountability platform. Not affiliated with any government agency or political party.<br />
          © {new Date().getFullYear()} CivicWatch. All rights reserved.
        </div>
      </footer>
    </div>
  )
}