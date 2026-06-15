'use client'
import { useState, useEffect, useCallback } from 'react'
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
  green:     '#3DAA6E',
}

function StatusBadge({ status }) {
  const styles = {
    pending:  { background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.4)' },
    approved: { background: 'rgba(61,170,110,0.15)', color: '#3DAA6E', border: '1px solid rgba(61,170,110,0.4)' },
    denied:   { background: 'rgba(178,34,52,0.15)',  color: '#FF6B6B', border: '1px solid rgba(178,34,52,0.4)' },
  }
  const s = styles[status] || styles.pending
  return (
    <span style={{ ...s, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {status}
    </span>
  )
}

function ActionModal({ req, onClose, onDone }) {
  const [action, setAction] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/refund-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: req.id, action, notes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      onDone()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: S.navyCard, border: `1px solid ${S.border}`, borderRadius: 12, padding: 32, maxWidth: 480, width: '100%' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: S.white, fontSize: 20, margin: '0 0 8px' }}>
          Review Request
        </h3>
        <p style={{ fontSize: 13, color: S.gray, margin: '0 0 20px' }}>
          <strong style={{ color: S.grayLight }}>{req.name}</strong> · {req.email} · {req.plan}
        </p>
        <p style={{ fontSize: 13, color: S.grayLight, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 12px', margin: '0 0 20px', lineHeight: 1.7 }}>
          {req.reason}
        </p>

        {!action ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setAction('approve')} style={{ flex: 1, background: S.green, color: S.white, border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Approve
            </button>
            <button onClick={() => setAction('deny')} style={{ flex: 1, background: S.red, color: S.white, border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              Deny
            </button>
            <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: S.gray, border: `1px solid ${S.border}`, borderRadius: 6, padding: '10px 0', cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: S.grayLight, marginBottom: 6 }}>
                Notes {action === 'approve' ? '(optional)' : '(reason for denial)'}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder={action === 'approve' ? 'Internal notes…' : 'Explain why this request was denied…'}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, borderRadius: 6, padding: '8px 12px', color: S.white, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            {error && <p style={{ fontSize: 13, color: '#FF6B6B', margin: '0 0 12px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={submit}
                disabled={loading}
                style={{
                  flex: 1,
                  background: action === 'approve' ? S.green : S.red,
                  color: S.white, border: 'none', borderRadius: 6, padding: '10px 0',
                  fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Processing…' : `Confirm ${action === 'approve' ? 'Approval' : 'Denial'}`}
              </button>
              <button onClick={() => { setAction(null); setError('') }} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', color: S.gray, border: `1px solid ${S.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminRefundsPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedReq, setSelectedReq] = useState(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/refund-approve')
      if (res.status === 403) { setAccessDenied(true); return }
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load requests.'); return }
      setRequests(data.requests || [])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in')
      return
    }
    if (isLoaded && isSignedIn) {
      fetchRequests()
    }
  }, [isLoaded, isSignedIn, router, fetchRequests])

  if (!isLoaded || loading) {
    return (
      <div style={{ background: S.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: S.gold, fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Loading…</div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div style={{ background: S.navy, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Source Serif 4', Georgia, serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');`}</style>
        <div style={{ fontSize: 40 }}>🚫</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: S.white, fontSize: 26, margin: 0 }}>Access Denied</h1>
        <p style={{ color: S.gray, fontSize: 14, margin: 0 }}>You don&rsquo;t have permission to view this page.</p>
        <Link href="/dashboard" style={{ color: S.gold, textDecoration: 'underline', fontSize: 14 }}>← Back to Dashboard</Link>
      </div>
    )
  }

  const pending = requests.filter(r => r.status === 'pending')
  const others = requests.filter(r => r.status !== 'pending')

  return (
    <div style={{ background: S.navy, minHeight: '100vh', fontFamily: "'Source Serif 4', Georgia, serif", color: S.grayLight }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
        * { box-sizing: border-box; }
        .refund-row:hover { background: rgba(212,175,55,0.04) !important; }
      `}</style>

      <nav style={{ borderBottom: `1px solid ${S.border}`, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,22,40,0.97)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, color: S.white, textDecoration: 'none', letterSpacing: 0.5 }}>
          🏛️ Civic<span style={{ color: S.gold }}>Watch</span>
        </Link>
        <span style={{ fontSize: 12, color: S.gold, background: 'rgba(212,175,55,0.1)', border: `1px solid ${S.border}`, borderRadius: 4, padding: '2px 8px' }}>Staff</span>
      </nav>

      <div style={{ height: 3, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
        <header style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 28, color: S.white, margin: '0 0 6px' }}>
              Refund Requests
            </h1>
            <p style={{ fontSize: 13, color: S.gray, margin: 0 }}>
              {pending.length} pending · {requests.length} total
            </p>
          </div>
          <button onClick={fetchRequests} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${S.border}`, color: S.gray, borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
            Refresh
          </button>
        </header>

        {error && (
          <div style={{ background: 'rgba(178,34,52,0.12)', border: '1px solid rgba(178,34,52,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#FF6B6B' }}>
            {error}
          </div>
        )}

        <RefundTable
          title="Pending"
          rows={pending}
          showActions
          onAction={setSelectedReq}
        />

        {others.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <RefundTable title="Reviewed" rows={others} showActions={false} onAction={setSelectedReq} />
          </div>
        )}

        {requests.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: S.gray, fontSize: 14, padding: '60px 0' }}>
            No refund requests yet.
          </div>
        )}
      </main>

      {selectedReq && (
        <ActionModal
          req={selectedReq}
          onClose={() => setSelectedReq(null)}
          onDone={() => { setSelectedReq(null); fetchRequests() }}
        />
      )}
    </div>
  )
}

function RefundTable({ title, rows, showActions, onAction }) {
  if (!rows.length) return null

  const S = {
    navy:      '#0A1628',
    navyCard:  '#0D1E35',
    gold:      '#D4AF37',
    white:     '#F5F0E8',
    gray:      '#8892A4',
    grayLight: '#CDD2E0',
    border:    'rgba(212,175,55,0.2)',
    green:     '#3DAA6E',
    red:       '#B22234',
  }

  const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: S.gray, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${S.border}` }
  const TD = { padding: '12px 14px', fontSize: 13, color: S.grayLight, borderBottom: `1px solid rgba(212,175,55,0.08)`, verticalAlign: 'top' }

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: S.gold, margin: '0 0 16px', fontWeight: 700 }}>{title}</h2>
      <div style={{ background: '#0D1E35', border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={TH}>Date</th>
                <th style={TH}>Name</th>
                <th style={TH}>Email</th>
                <th style={TH}>Plan</th>
                <th style={TH}>Reason</th>
                <th style={TH}>Status</th>
                {showActions && <th style={{ ...TH, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="refund-row" style={{ cursor: 'default' }}>
                  <td style={TD}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ ...TD, color: S.white, fontWeight: 600 }}>{r.name}</td>
                  <td style={TD}>{r.email}</td>
                  <td style={TD}>{r.plan === 'pro_monthly' ? 'Pro Monthly' : 'Pro Annual'}</td>
                  <td style={{ ...TD, maxWidth: 260 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.reason}
                    </span>
                  </td>
                  <td style={TD}><StatusBadge status={r.status} /></td>
                  {showActions && (
                    <td style={{ ...TD, textAlign: 'right' }}>
                      <button
                        onClick={() => onAction(r)}
                        style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${S.border}`, color: S.gold, borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                      >
                        Review
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
