'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

const S = {
  navy: '#0A1628', navyMid: '#1B2A6B', red: '#B22234',
  gold: '#D4AF37', white: '#F8F9FF', gray: '#8892A4',
}

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.push('/dashboard')
  }, [isLoaded, isSignedIn, router])

  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: 'Georgia, serif', color: S.white }}>
      <style>{`
        .hero-btn:hover { opacity:0.88; transform:translateY(-2px); }
        .feature-card:hover { border-color:rgba(212,175,55,0.4); }
        .star-bg { background-image:radial-gradient(rgba(212,175,55,0.06) 1px,transparent 1px); background-size:28px 28px; }
      `}</style>
      <header style={{ borderBottom:'1px solid rgba(212,175,55,0.2)', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, background:'rgba(10,22,40,0.97)', backdropFilter:'blur(10px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:26 }}>🦅</span>
          <span style={{ fontWeight:900, fontSize:20, letterSpacing:2 }}>CIVIC<span style={{ color:S.gold }}>WATCH</span></span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <Link href="/sign-in" style={{ padding:'8px 20px', border:'1px solid rgba(212,175,55,0.4)', borderRadius:8, color:S.gold, fontSize:13, fontWeight:600 }}>Sign In</Link>
          <Link href="/sign-up" style={{ padding:'8px 20px', background:S.red, borderRadius:8, color:'white', fontSize:13, fontWeight:600 }}>Get Started Free</Link>
        </div>
      </header>
      <div style={{ height:4, background:`linear-gradient(90deg,${S.red} 33%,white 33%,white 66%,${S.navyMid} 66%)` }} />
      <section className="star-bg" style={{ padding:'80px 24px', textAlign:'center', maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'inline-block', padding:'6px 16px', background:'rgba(178,34,52,0.15)', border:'1px solid rgba(178,34,52,0.4)', borderRadius:20, fontSize:12, color:'#FF6B7A', letterSpacing:1.5, textTransform:'uppercase', marginBottom:24 }}>
          Government Accountability Platform
        </div>
        <h1 style={{ fontWeight:900, fontSize:'clamp(32px,6vw,56px)', lineHeight:1.15, marginBottom:20 }}>
          Your Representatives.<br />
          <span style={{ color:S.gold }}>Fully Accountable.</span>
        </h1>
        <p style={{ fontSize:16, color:S.gray, lineHeight:1.8, maxWidth:580, margin:'0 auto 36px' }}>
          Track every vote, trade disclosure, net worth change, and town hall event for every elected official — from your city council to the U.S. Senate.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/sign-up" className="hero-btn" style={{ padding:'14px 32px', background:`linear-gradient(135deg,${S.red},${S.navyMid})`, borderRadius:10, color:'white', fontSize:15, fontWeight:700, transition:'all 0.2s', display:'inline-block' }}>
            Start Tracking Free →
          </Link>
          <Link href="/sign-in" className="hero-btn" style={{ padding:'14px 32px', border:'1px solid rgba(212,175,55,0.4)', borderRadius:10, color:S.gold, fontSize:15, fontWeight:600, transition:'all 0.2s', display:'inline-block' }}>
            Sign In
          </Link>
        </div>
        <p style={{ marginTop:16, fontSize:12, color:S.gray }}>Free plan available · Pro at $9.99/month · Cancel anytime</p>
      </section>
      <section style={{ padding:'50px 24px', maxWidth:1100, margin:'0 auto' }}>
        <h2 style={{ textAlign:'center', fontWeight:700, fontSize:28, marginBottom:32 }}>Everything You Need to Hold Power Accountable</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:18 }}>
          {[
            ['⚖️','Voting Records','Every vote cast with bill outcome and a direct link to the full bill text.'],
            ['💰','Wealth & Trades','Net worth before and after office. All STOCK Act disclosures in one timeline.'],
            ['🔔','Track My Rep™ Alerts','Get notified the moment your rep votes, trades, or appears on a new docket.'],
            ['🗺️','District Map','Interactive map from municipal to federal for any location.'],
            ['📋',"Today's Docket","Live view of each rep's legislative schedule for the current day."],
            ['📜','U.S. Constitution','All articles and amendments in original text and plain English.'],
            ['🏛️','Town Halls','Upcoming public events and community priority polls per rep.'],
            ['📊','Peer Comparison','Compare your rep to direct peers on key issues side by side.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="feature-card" style={{ padding:22, background:'rgba(27,42,107,0.25)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:14, transition:'all 0.25s' }}>
              <div style={{ fontSize:26, marginBottom:10 }}>{icon}</div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:6, color:S.gold }}>{title}</div>
              <div style={{ fontSize:13, color:S.gray, lineHeight:1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding:'50px 24px', maxWidth:760, margin:'0 auto', textAlign:'center' }}>
        <h2 style={{ fontWeight:700, fontSize:28, marginBottom:32 }}>Simple, Transparent Pricing</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ padding:26, background:'rgba(27,42,107,0.3)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:16 }}>
            <div style={{ fontWeight:700, fontSize:20, marginBottom:6 }}>Free</div>
            <div style={{ fontSize:34, fontWeight:700, color:S.gold, marginBottom:18 }}>$0</div>
            {['Federal representatives','Basic voting records','Constitution reference','District map'].map(f => (
              <div key={f} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:S.gray, textAlign:'left' }}>
                <span style={{ color:'#4CAF50' }}>✓</span>{f}
              </div>
            ))}
            <Link href="/sign-up" style={{ display:'block', marginTop:18, padding:'10px 0', border:'1px solid rgba(212,175,55,0.4)', borderRadius:8, color:S.gold, fontSize:13, fontWeight:600 }}>
              Get Started
            </Link>
          </div>
          <div style={{ padding:26, background:'linear-gradient(145deg,rgba(178,34,52,0.15),rgba(27,42,107,0.5))', border:`2px solid ${S.gold}`, borderRadius:16, position:'relative' }}>
            <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:S.gold, color:S.navy, padding:'3px 14px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
              MOST POPULAR
            </div>
            <div style={{ fontWeight:700, fontSize:20, marginBottom:6 }}>Pro</div>
            <div style={{ fontSize:34, fontWeight:700, color:S.gold, marginBottom:4 }}>$9.99<span style={{ fontSize:13, color:S.gray }}>/mo</span></div>
            <div style={{ fontSize:12, color:S.gray, marginBottom:14 }}>Cancel anytime · 7-day free trial</div>
            {['Everything in Free','All government levels','Track My Rep™ alerts','Trade & wealth history','Town Hall notifications','Peer comparisons','Data export'].map(f => (
              <div key={f} style={{ display:'flex', gap:10, marginBottom:8, fontSize:13, color:'#CDD2E0', textAlign:'left' }}>
                <span style={{ color:S.gold }}>★</span>{f}
              </div>
            ))}
            <Link href="/sign-up" style={{ display:'block', marginTop:18, padding:'12px 0', background:`linear-gradient(135deg,${S.red},${S.navyMid})`, borderRadius:8, color:'white', fontSize:14, fontWeight:700 }}>
              Start Free Trial →
            </Link>
          </div>
        </div>
      </section>
      <footer style={{ borderTop:'1px solid rgba(212,175,55,0.15)', padding:'24px', textAlign:'center', marginTop:40 }}>
        <div style={{ color:S.gold, fontSize:13, marginBottom:6 }}>CivicWatch™ · Democracy Accountability Platform</div>
        <div style={{ fontSize:11, color:S.gray, marginBottom:10 }}>Data sourced from Congress.gov, OpenSecrets, SEC EDGAR, and official government records.</div>
        <div style={{ display:'flex', gap:20, justifyContent:'center', fontSize:12 }}>
          <Link href="/privacy" style={{ color:S.gray }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color:S.gray }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}