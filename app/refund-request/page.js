'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const S = {
  navy:      '#0A1628',
  navyCard:  '#0D1E35',
  navyMid:   '#1B2A6B',
  gold:      '#D4AF37',
  white:     '#F5F0E8',
  gray:      '#8892A4',
  grayLight: '#CDD2E0',
  border:    'rgba(212,175,55,0.2)',
  red:       '#B22234',
  errorRed:  '#FF6B6B',
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${S.border}`,
  borderRadius: 6,
  padding: '10px 14px',
  color: S.white,
  fontSize: 14,
  fontFamily: "'Source Serif 4', Georgia, serif",
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  color: S.grayLight,
  marginBottom: 6,
  fontWeight: 600,
}

export default function RefundRequestPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    email: '',
    paymentDate: '',
    plan: '',
    reason: '',
    evidence: '',
    confirmed: false,
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in?redirect_url=/refund-request')
    }
    if (isLoaded && isSignedIn && user) {
      setForm(f => ({
        ...f,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || '',
      }))
    }
  }, [isLoaded, isSignedIn, user, router])

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.paymentDate) { setError('Please enter the date of your original payment.'); return }
    if (!form.plan) { setError('Please select your subscription plan.'); return }
    if (form.reason.trim().length < 50) { setError('Please describe the service issue in at least 50 characters.'); return }
    if (!form.confirmed) { setError('Please confirm that the site was not functioning correctly.'); return }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return }
      router.push('/refund-request/success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div style={{ background: S.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: S.gold, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${S.gold} !important; }
        input::placeholder, textarea::placeholder { color: ${S.gray}; }
        select option { background: #0D1E35; }
      `}</style>

      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.97)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: S.white, textDecoration: 'none', letterSpacing: 0.5 }}>
          🏛️ Civic<span style={{ color: S.gold }}>Watch</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 13, color: S.gray, textDecoration: 'none' }}>← Back to Dashboard</Link>
      </nav>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 620, margin: '0 auto', padding: '56px 24px 96px' }}>
        <header style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 32, color: S.white, margin: '0 0 10px' }}>
            Request a Refund
          </h1>
          <p style={{ fontSize: 14, color: S.gray, margin: 0 }}>
            Refunds are available within 14 days of payment if you experienced a loss of service.{' '}
            <a href="/refund-policy" style={{ color: S.gold, textDecoration: 'underline' }}>Read our policy</a>
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Date of Original Payment</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={set('paymentDate')}
                required
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Subscription Plan</label>
              <select
                value={form.plan}
                onChange={set('plan')}
                required
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select plan…</option>
                <option value="pro_monthly">Pro Monthly</option>
                <option value="pro_annual">Pro Annual</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Description of Service Loss
              <span style={{ color: S.gray, fontWeight: 400, marginLeft: 8 }}>({Math.max(0, 50 - form.reason.trim().length)} more chars required)</span>
            </label>
            <textarea
              value={form.reason}
              onChange={set('reason')}
              required
              rows={5}
              placeholder="Describe what was broken or unavailable — include dates, error messages, and how it affected your use of CivicWatch…"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
            />
          </div>

          <div>
            <label style={labelStyle}>Supporting Evidence (optional)</label>
            <textarea
              value={form.evidence}
              onChange={set('evidence')}
              rows={3}
              placeholder="Describe any screenshots, error codes, or other evidence you have. You may also email attachments to support@civicwatch.app."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.confirmed}
              onChange={set('confirmed')}
              style={{ marginTop: 2, accentColor: S.gold, width: 16, height: 16, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: S.grayLight, lineHeight: 1.6 }}>
              I confirm that CivicWatch was <strong style={{ color: S.white }}>not functioning correctly</strong> during
              the period described above, and that this refund request is accurate to the best of my knowledge.
            </span>
          </label>

          {error && (
            <div style={{ background: 'rgba(178,34,52,0.15)', border: `1px solid rgba(178,34,52,0.4)`, borderRadius: 6, padding: '10px 14px', fontSize: 13, color: S.errorRed }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? 'rgba(212,175,55,0.3)' : S.gold,
              color: submitting ? S.gray : '#0A1628',
              border: 'none',
              borderRadius: 6,
              padding: '13px 24px',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              cursor: submitting ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5,
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Refund Request'}
          </button>

          <p style={{ fontSize: 12, color: S.gray, margin: 0, textAlign: 'center' }}>
            Prefer to cancel without a refund?{' '}
            <a href="/dashboard" style={{ color: S.gold, textDecoration: 'underline' }}>Manage your subscription</a>
          </p>
        </form>
      </main>
    </div>
  )
}
