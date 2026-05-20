'use client'
import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true)
    }
  }, [])

  function accept() {
    try { localStorage.setItem('cookie_consent', '1') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(10,22,40,0.97)', borderTop: '1px solid rgba(212,175,55,0.25)',
      padding: '14px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 20, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.5 }}>
        We use cookies to improve your experience. See our{' '}
        <a href="/privacy" style={{ color: '#D4AF37', textDecoration: 'none' }}>Privacy Policy</a>.
      </span>
      <button
        onClick={accept}
        style={{
          padding: '8px 20px', background: '#B22234', border: 'none',
          borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        Accept
      </button>
    </div>
  )
}
