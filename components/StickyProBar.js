'use client'

const PROMO_MODE = process.env.NEXT_PUBLIC_PROMO_MODE === 'true'
const CHECKOUT_URL = process.env.NEXT_PUBLIC_PROMO_CHECKOUT_URL || '/pro'

export default function StickyProBar() {
  if (!PROMO_MODE) return null

  return (
    <>
      <style>{`
        .sticky-pro-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .sticky-pro-bar {
            display: flex;
          }
        }
      `}</style>
      <a
        href={CHECKOUT_URL}
        className="sticky-pro-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#0A0E1E',
          borderTop: '1px solid rgba(212,175,55,0.4)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 16px',
          textDecoration: 'none',
          color: '#D4AF37',
          fontFamily: "'Source Serif 4', Georgia, serif",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 0.5,
          gap: 8,
        }}
      >
        GO PRO — first month $1 →
      </a>
    </>
  )
}
