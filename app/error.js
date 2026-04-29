'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('CivicWatch error:', error)
  }, [error])

  return (
    <div style={{
      background: '#0A1628', minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480, textAlign: 'center', padding: '48px 40px',
        background: 'rgba(27,42,107,0.4)', border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: 20,
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🏛️</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: 24, color: '#F8F9FF', marginBottom: 12,
        }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: '#8892A4', lineHeight: 1.7, marginBottom: 32 }}>
          CivicWatch encountered an unexpected error. Your data is safe —
          please try again or reload the page.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px', background: '#B22234', border: 'none',
              borderRadius: 10, color: 'white', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            Try Again
          </button>
          <a
            href="/dashboard"
            style={{
              padding: '10px 24px', background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10,
              color: '#D4AF37', fontFamily: 'inherit', fontSize: 13,
              fontWeight: 700, textDecoration: 'none',
            }}>
            Go to Dashboard
          </a>
        </div>
        <p style={{ fontSize: 11, color: '#8892A4', marginTop: 24 }}>
          Persisting? Email{' '}
          <a href="mailto:support@civicwatch.app" style={{ color: '#D4AF37' }}>
            support@civicwatch.app
          </a>
        </p>
      </div>
    </div>
  )
}
