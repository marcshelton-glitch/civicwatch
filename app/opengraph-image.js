import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CivicWatch — See What Congress Is Buying';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0A1628',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow top-right */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(79,110,247,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Radial glow bottom-left */}
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* US Flag stripe top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 7,
          background: 'linear-gradient(90deg, #B22234 33%, #F5F0E8 33%, #F5F0E8 66%, #1B2A6B 66%)',
          display: 'flex',
        }} />

        {/* LEFT — Main message */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '55px 48px 55px 60px',
          width: 580,
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <span style={{ fontSize: 26 }}>🏛️</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#F5F0E8', fontFamily: 'serif' }}>
              Civic<span style={{ color: '#D4AF37' }}>Watch</span>
            </span>
            <div style={{
              marginLeft: 8,
              background: 'rgba(212,175,55,0.15)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 20,
              padding: '3px 10px',
              display: 'flex',
            }}>
              <span style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, letterSpacing: 1 }}>FREE</span>
            </div>
          </div>

          {/* Big provocative headline */}
          <div style={{
            fontFamily: 'serif',
            fontWeight: 900,
            lineHeight: 1.05,
            color: '#F5F0E8',
            marginBottom: 18,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 58 }}>YOUR REPS ARE</span>
            <span style={{ fontSize: 58, color: '#D4AF37' }}>TRADING STOCKS.</span>
          </div>

          <div style={{
            fontSize: 20,
            color: '#8892A4',
            lineHeight: 1.45,
            marginBottom: 36,
            display: 'flex',
          }}>
            Track every trade. Know every vote.{'\n'}Follow every dollar. Free.
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36 }}>
            {[['40K+', 'Filings Tracked'], ['535', 'Members Monitored'], ['Real-Time', 'Disclosures']].map(([n, l]) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#D4AF37' }}>{n}</span>
                <span style={{ fontSize: 12, color: '#8892A4', letterSpacing: 0.3 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Mock trade feed */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '55px 60px 55px 20px',
          gap: 14,
          flex: 1,
        }}>
          {/* Header label */}
          <div style={{
            fontSize: 11,
            color: '#4F6EF7',
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 4,
            display: 'flex',
          }}>
            ● LIVE DISCLOSURES
          </div>

          {/* Trade cards */}
          {[
            { name: 'Nancy Pelosi', chamber: 'House · CA-11', ticker: 'NVDA Call Options', amount: '$1M – $5M', dir: 'BUY', color: '#27AE60' },
            { name: 'Dan Crenshaw', chamber: 'House · TX-02', ticker: 'Microsoft (MSFT)', amount: '$50K – $100K', dir: 'BUY', color: '#27AE60' },
            { name: 'Tommy Tuberville', chamber: 'Senate · AL', ticker: 'iShares MSCI ETF', amount: '$250K – $500K', dir: 'SELL', color: '#E05252' },
            { name: 'Ro Khanna', chamber: 'House · CA-17', ticker: 'Alphabet Inc (GOOGL)', amount: '$15K – $50K', dir: 'BUY', color: '#27AE60' },
          ].map((t, i) => (
            <div key={i} style={{
              background: i === 0 ? 'rgba(79,110,247,0.1)' : 'rgba(255,255,255,0.04)',
              border: i === 0 ? '1px solid rgba(79,110,247,0.3)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '13px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F5F0E8' }}>{t.name}</span>
                <span style={{ fontSize: 11, color: '#8892A4' }}>{t.chamber} · {t.ticker}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37' }}>{t.amount}</span>
                <div style={{
                  background: t.dir === 'BUY' ? 'rgba(39,174,96,0.15)' : 'rgba(224,82,82,0.15)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  display: 'flex',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: 0.5 }}>{t.dir}</span>
                </div>
              </div>
            </div>
          ))}

          {/* CTA bar */}
          <div style={{
            background: 'linear-gradient(135deg, #4F6EF7, #3A56D4)',
            borderRadius: 10,
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 4,
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>
              See what your rep is trading → civicwatch.app
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
