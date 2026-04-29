import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CivicWatch — Your Representatives. Accountable.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A1628 0%, #1B2A6B 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(212,175,55,0.12) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top gold bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #B22234, #D4AF37, #B22234)',
          }}
        />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {/* Icon */}
          <div style={{ fontSize: 96, marginBottom: 24 }}>🏛️</div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: 6,
              color: '#F8F9FF',
              marginBottom: 8,
              display: 'flex',
            }}
          >
            CIVIC
            <span style={{ color: '#D4AF37' }}>WATCH</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: '#8892A4',
              textTransform: 'uppercase',
              marginBottom: 48,
            }}
          >
            Your Representatives. Accountable.
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 16 }}>
            {['⚖️ Voting Records', '💰 Stock Trades', '📊 Wealth Tracking', '🔔 Alerts'].map(f => (
              <div
                key={f}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  borderRadius: 30,
                  color: '#D4AF37',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #B22234 33%, white 33%, white 66%, #1B2A6B 66%)',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
