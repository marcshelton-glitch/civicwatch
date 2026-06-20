'use client'
import { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const STATES = [
  { abbrev: 'AL', name: 'Alabama' }, { abbrev: 'AK', name: 'Alaska' },
  { abbrev: 'AZ', name: 'Arizona' }, { abbrev: 'AR', name: 'Arkansas' },
  { abbrev: 'CA', name: 'California' }, { abbrev: 'CO', name: 'Colorado' },
  { abbrev: 'CT', name: 'Connecticut' }, { abbrev: 'DE', name: 'Delaware' },
  { abbrev: 'DC', name: 'District of Columbia' }, { abbrev: 'FL', name: 'Florida' },
  { abbrev: 'GA', name: 'Georgia' }, { abbrev: 'HI', name: 'Hawaii' },
  { abbrev: 'ID', name: 'Idaho' }, { abbrev: 'IL', name: 'Illinois' },
  { abbrev: 'IN', name: 'Indiana' }, { abbrev: 'IA', name: 'Iowa' },
  { abbrev: 'KS', name: 'Kansas' }, { abbrev: 'KY', name: 'Kentucky' },
  { abbrev: 'LA', name: 'Louisiana' }, { abbrev: 'ME', name: 'Maine' },
  { abbrev: 'MD', name: 'Maryland' }, { abbrev: 'MA', name: 'Massachusetts' },
  { abbrev: 'MI', name: 'Michigan' }, { abbrev: 'MN', name: 'Minnesota' },
  { abbrev: 'MS', name: 'Mississippi' }, { abbrev: 'MO', name: 'Missouri' },
  { abbrev: 'MT', name: 'Montana' }, { abbrev: 'NE', name: 'Nebraska' },
  { abbrev: 'NV', name: 'Nevada' }, { abbrev: 'NH', name: 'New Hampshire' },
  { abbrev: 'NJ', name: 'New Jersey' }, { abbrev: 'NM', name: 'New Mexico' },
  { abbrev: 'NY', name: 'New York' }, { abbrev: 'NC', name: 'North Carolina' },
  { abbrev: 'ND', name: 'North Dakota' }, { abbrev: 'OH', name: 'Ohio' },
  { abbrev: 'OK', name: 'Oklahoma' }, { abbrev: 'OR', name: 'Oregon' },
  { abbrev: 'PA', name: 'Pennsylvania' }, { abbrev: 'RI', name: 'Rhode Island' },
  { abbrev: 'SC', name: 'South Carolina' }, { abbrev: 'SD', name: 'South Dakota' },
  { abbrev: 'TN', name: 'Tennessee' }, { abbrev: 'TX', name: 'Texas' },
  { abbrev: 'UT', name: 'Utah' }, { abbrev: 'VT', name: 'Vermont' },
  { abbrev: 'VA', name: 'Virginia' }, { abbrev: 'WA', name: 'Washington' },
  { abbrev: 'WV', name: 'West Virginia' }, { abbrev: 'WI', name: 'Wisconsin' },
  { abbrev: 'WY', name: 'Wyoming' },
]

const SESSION_KEY = 'cw_exit_intent_shown'
const MOBILE_IDLE_MS = 60_000

export default function ExitIntentModal() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [searchName, setSearchName] = useState('')
  const idleTimer = useRef(null)
  const dismissed = useRef(false)

  const isPro = user?.publicMetadata?.isPro === true

  function shouldShow() {
    if (!isLoaded) return false
    if (isSignedIn) return false
    if (isPro) return false
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return false
    return true
  }

  function show() {
    if (dismissed.current) return
    if (!shouldShow()) return
    dismissed.current = true
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(true)
  }

  function dismiss() {
    setVisible(false)
  }

  // Desktop: fire on mouse leaving toward the top of the viewport
  useEffect(() => {
    if (typeof window === 'undefined') return

    function onMouseLeave(e) {
      if (e.clientY < 10) show()
    }

    document.addEventListener('mouseleave', onMouseLeave)
    return () => document.removeEventListener('mouseleave', onMouseLeave)
  }, [isLoaded, isSignedIn, isPro]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile: fire after 60 s of inactivity
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    if (!isMobile) return

    function resetTimer() {
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(show, MOBILE_IDLE_MS)
    }

    const events = ['touchstart', 'touchmove', 'scroll']
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      clearTimeout(idleTimer.current)
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [isLoaded, isSignedIn, isPro]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleStateSelect(e) {
    const abbrev = e.target.value
    if (!abbrev) return
    dismiss()
    router.push(`/dashboard?state=${abbrev}`)
  }

  function handleNameSearch(e) {
    e.preventDefault()
    const q = searchName.trim()
    if (!q) return
    dismiss()
    router.push(`/dashboard?search=${encodeURIComponent(q)}`)
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes cw-modal-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cw-exit-modal {
          animation: cw-modal-in 0.22s ease-out;
          font-family: var(--font-inter, Inter, sans-serif);
        }
        .cw-exit-select:focus, .cw-exit-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 2px rgba(212,175,55,0.25);
        }
        .cw-exit-close:hover { opacity: 1 !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-headline"
        className="cw-exit-modal"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999, width: '100%', maxWidth: 480,
          background: '#0A0F1E',
          border: '1px solid rgba(212,175,55,0.35)',
          borderRadius: 20,
          padding: '40px 36px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          boxSizing: 'border-box',
        }}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="cw-exit-close"
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8892A4', fontSize: 20, lineHeight: 1, opacity: 0.7,
            padding: 4,
          }}
        >
          ✕
        </button>

        {/* Header badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          background: 'rgba(212,175,55,0.12)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 30, fontSize: 11, fontWeight: 700,
          color: '#D4AF37', letterSpacing: 1, textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          🏛️ CivicWatch
        </div>

        {/* Headline */}
        <h2
          id="exit-modal-headline"
          style={{
            margin: '0 0 8px',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 900, fontSize: 26, lineHeight: 1.25,
            color: '#FFFFFF',
          }}
        >
          Wait — see your rep<br />before you go.
        </h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#8892A4', lineHeight: 1.6 }}>
          Find out how your representatives vote, trade stocks, and build wealth while in office.
        </p>

        {/* State dropdown */}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#B0BAC8', marginBottom: 8, letterSpacing: 0.5 }}>
          SELECT YOUR STATE
        </label>
        <select
          defaultValue=""
          onChange={handleStateSelect}
          className="cw-exit-select"
          style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(27,42,107,0.4)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 10, color: '#FFFFFF',
            fontSize: 15, cursor: 'pointer',
            marginBottom: 20,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: 40,
          }}
        >
          <option value="" disabled>Choose a state…</option>
          {STATES.map(s => (
            <option key={s.abbrev} value={s.abbrev}>{s.name}</option>
          ))}
        </select>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 12, color: '#8892A4' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Name search */}
        <form onSubmit={handleNameSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search by name…"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="cw-exit-input"
            style={{
              flex: 1, padding: '12px 14px',
              background: 'rgba(27,42,107,0.4)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 10, color: '#FFFFFF',
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 18px',
              background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
              border: 'none', borderRadius: 10,
              color: '#0A0F1E', fontWeight: 700, fontSize: 16,
              cursor: 'pointer', flexShrink: 0,
            }}
            aria-label="Search by name"
          >
            →
          </button>
        </form>

        <p style={{ marginTop: 20, marginBottom: 0, fontSize: 12, color: '#8892A4', textAlign: 'center' }}>
          Free to use · No signup required
        </p>
      </div>
    </>
  )
}
