'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { hasDecided, writeConsent, DENIED, GRANTED, REOPEN_EVENT } from '@/lib/consent'

const S = {
  surface: 'rgba(10,22,40,0.97)',
  rim: 'rgba(212,175,55,0.25)',
  gold: '#D4AF37',
  body: '#8892A4',      // 5.9:1 on the surface — passes AA
  strong: '#E6ECF5',
  acceptBg: '#B22234',  // white on this is 6.6:1
  rejectBg: '#1E2A40',
  rejectRim: '#46536B',
}

// Accept and Reject are deliberately identical in size, weight and padding.
// Making reject quieter than accept is a dark pattern, and a consent record
// obtained that way is not valid.
const BTN = {
  minHeight: 44,
  minWidth: 132,
  padding: '11px 22px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}

export default function CookieBanner() {
  // Never render on the server: the decision lives in localStorage, and
  // guessing it would either flash the banner at people who already chose
  // or hide it from people who have not.
  const [visible, setVisible] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!hasDecided()) setVisible(true)
    const reopen = () => setVisible(true)
    window.addEventListener(REOPEN_EVENT, reopen)
    return () => window.removeEventListener(REOPEN_EVENT, reopen)
  }, [])

  // Move focus to the banner so keyboard and screen-reader users meet the
  // choice instead of tabbing past it.
  useEffect(() => {
    if (visible) panelRef.current?.focus()
  }, [visible])

  const decide = useCallback((choice) => {
    writeConsent(choice)
    setVisible(false)
  }, [])

  // Escape resolves to reject: dismissing must never be read as agreement.
  useEffect(() => {
    if (!visible) return
    const onKey = (e) => {
      if (e.key === 'Escape') decide(DENIED)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, decide])

  if (!visible) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      tabIndex={-1}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: S.surface,
        borderTop: `1px solid ${S.rim}`,
        padding: '16px 24px calc(16px + env(safe-area-inset-bottom))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, flexWrap: 'wrap',
        outline: 'none',
      }}
    >
      <h2 id="cookie-banner-title" style={{
        position: 'absolute', width: 1, height: 1, overflow: 'hidden',
        clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)', whiteSpace: 'nowrap',
      }}>
        Cookie choices
      </h2>

      <p id="cookie-banner-desc" style={{
        fontSize: 13, color: S.body, lineHeight: 1.5, margin: 0,
        maxWidth: '58ch', flex: '1 1 320px',
      }}>
        We use cookies that are <strong style={{ color: S.strong, fontWeight: 600 }}>necessary</strong> to
        sign you in and take payment. With your permission we also use{' '}
        <strong style={{ color: S.strong, fontWeight: 600 }}>analytics</strong> (how the site is used) and{' '}
        <strong style={{ color: S.strong, fontWeight: 600 }}>advertising</strong> cookies from Meta and TikTok.
        Nothing optional runs until you choose. See our{' '}
        <a
          href="/privacy"
          className="cw-cookie-link"
          style={{ color: S.gold, textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          Privacy Policy
        </a>.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: '0 0 auto' }}>
        <button
          type="button"
          onClick={() => decide(DENIED)}
          className="cw-cookie-btn"
          style={{ ...BTN, background: S.rejectBg, color: S.strong, border: `1px solid ${S.rejectRim}` }}
        >
          Reject optional
        </button>
        <button
          type="button"
          onClick={() => decide(GRANTED)}
          className="cw-cookie-btn"
          style={{ ...BTN, background: S.acceptBg, color: '#FFFFFF', border: '1px solid transparent' }}
        >
          Accept all
        </button>
      </div>

      <style>{`
        .cw-cookie-btn:focus-visible,
        .cw-cookie-link:focus-visible {
          outline: 3px solid ${S.gold};
          outline-offset: 2px;
        }
        .cw-cookie-btn {
          transition: filter 160ms ease-out;
        }
        .cw-cookie-btn:hover {
          filter: brightness(1.12);
        }
        @media (prefers-reduced-motion: reduce) {
          .cw-cookie-btn { transition: none; }
        }
      `}</style>
    </div>
  )
}
