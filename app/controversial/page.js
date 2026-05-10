'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const S = {
  navy: '#0A1628',
  navyMid: '#1B2A6B',
  navyLight: '#243A8C',
  gold: '#D4AF37',
  white: '#F5F0E8',
  gray: '#8899AA',
  border: 'rgba(212,175,55,0.2)',
  red: '#8B1A1A',
}

const PARTY_COLORS = {
  Democrat: { bg: 'rgba(13,42,74,0.9)', text: '#6BA3D6', border: 'rgba(107,163,214,0.4)' },
  Republican: { bg: 'rgba(74,13,13,0.9)', text: '#D66B6B', border: 'rgba(214,107,107,0.4)' },
  Independent: { bg: 'rgba(42,58,26,0.9)', text: '#9BC46B', border: 'rgba(155,196,107,0.4)' },
}

function partyColor(party) {
  return PARTY_COLORS[party] || { bg: 'rgba(27,42,107,0.5)', text: S.gray, border: S.border }
}

function fmtAmount(max) {
  if (!max) return '—'
  if (max >= 1e9) return `$${(max / 1e9).toFixed(1)}B+`
  if (max >= 1e6) return `$${(max / 1e6).toFixed(1)}M+`
  return `$${(max / 1e3).toFixed(0)}K+`
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RepPhoto({ bioguideId, name, size = 48 }) {
  const [err, setErr] = useState(false)
  if (!bioguideId || err) {
    const initials = (name || '?').split(/[\s,]+/).filter(Boolean).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: S.navyMid, border: `2px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.3), color: S.gold, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
        {initials}
      </div>
    )
  }
  return (
    <img
      src={`https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`}
      alt={name}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: `2px solid ${S.border}` }}
    />
  )
}

const TYPE_COLORS = { Purchase: '#4ade80', Sale: '#f87171', Exchange: S.gold }

export default function ControversialPage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/controversial')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json)) setData(json)
        else setError(json.error || 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? data
    : filter === 'buy' ? data.filter(t => /purchase/i.test(t.transaction_type))
    : filter === 'sell' ? data.filter(t => /sale/i.test(t.transaction_type))
    : filter === 'dem' ? data.filter(t => t.party?.toLowerCase().includes('democrat'))
    : filter === 'rep' ? data.filter(t => t.party?.toLowerCase().includes('republican'))
    : data

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: '100vh', color: S.white }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, #0A0E1E, ${S.navyMid})`, borderBottom: `2px solid rgba(248,113,113,0.5)`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 22 }}>🏛️</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 16, letterSpacing: 2, color: S.white }}>
                CIVIC<span style={{ color: S.gold }}>WATCH</span>
              </div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: S.gray, textTransform: 'uppercase' }}>Your Representatives. Accountable.</div>
            </div>
          </button>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => router.push('/leaderboard')}
              style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.gold, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5 }}>
              🏆 Leaderboard
            </button>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.gray, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5 }}>
              ← Back
            </button>
          </div>
        </div>
      </header>

      <div style={{ height: 4, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔥</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: S.white, margin: '0 0 10px', letterSpacing: 1 }}>
            Most Notable Trades
          </h1>
          <p style={{ color: S.gray, fontSize: 14, margin: 0 }}>
            Largest single stock transactions disclosed by members of Congress under the STOCK Act
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'buy', label: '📈 Buys' },
            { id: 'sell', label: '📉 Sells' },
            { id: 'dem', label: 'Democrats' },
            { id: 'rep', label: 'Republicans' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${filter === f.id ? 'rgba(248,113,113,0.6)' : S.border}`, background: filter === f.id ? 'rgba(248,113,113,0.12)' : 'transparent', color: filter === f.id ? '#f87171' : S.gray, fontSize: 12, fontWeight: filter === f.id ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: 0.5 }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Loading notable trades…</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14 }}>{error}</div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 14 }}>No trades for this filter.</div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((trade, i) => {
              const pc = partyColor(trade.party)
              const isTop3 = i < 3
              const typeLower = (trade.transaction_type || '').toLowerCase()
              const isBuy = /purchase/.test(typeLower)
              const isSell = /sale/.test(typeLower)
              const typeColor = isBuy ? '#4ade80' : isSell ? '#f87171' : S.gold

              return (
                <div
                  key={i}
                  onClick={() => trade.bioguide_id && router.push(`/rep/${trade.bioguide_id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: isTop3
                      ? `linear-gradient(135deg, rgba(248,113,113,${0.10 - i * 0.02}), rgba(27,42,107,0.6))`
                      : 'rgba(27,42,107,0.3)',
                    border: isTop3 ? `1px solid rgba(248,113,113,${0.35 - i * 0.07})` : `1px solid ${S.border}`,
                    borderRadius: 12,
                    cursor: trade.bioguide_id ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (trade.bioguide_id) e.currentTarget.style.background = isTop3 ? `linear-gradient(135deg, rgba(248,113,113,${0.16 - i * 0.02}), rgba(27,42,107,0.8))` : 'rgba(27,42,107,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isTop3 ? `linear-gradient(135deg, rgba(248,113,113,${0.10 - i * 0.02}), rgba(27,42,107,0.6))` : 'rgba(27,42,107,0.3)' }}
                >
                  {/* Rank */}
                  <div style={{ width: 30, textAlign: 'center', flexShrink: 0, fontSize: isTop3 ? 20 : 13, fontWeight: 700, color: isTop3 ? '#f87171' : S.gray, fontFamily: "'Playfair Display', serif" }}>
                    {isTop3 ? ['🔥', '💥', '⚡'][i] : `#${i + 1}`}
                  </div>

                  {/* Photo */}
                  <RepPhoto bioguideId={trade.bioguide_id} name={trade.name} size={46} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: S.white, whiteSpace: 'nowrap' }}>
                        {trade.name || 'Unknown'}
                      </span>
                      {trade.party && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 4, background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, whiteSpace: 'nowrap' }}>
                          {trade.party === 'Democrat' ? 'D' : trade.party === 'Republican' ? 'R' : trade.party?.[0] || '?'}
                        </span>
                      )}
                      {trade.state && <span style={{ fontSize: 12, color: S.gray }}>{trade.state}</span>}
                      <span style={{ fontSize: 10, fontWeight: 700, color: typeColor, background: `${typeColor}18`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap', marginLeft: 2 }}>
                        {isBuy ? '📈 BUY' : isSell ? '📉 SELL' : trade.transaction_type}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: '#CDD2E0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trade.ticker ? <span style={{ color: S.gold, fontWeight: 700, marginRight: 6 }}>{trade.ticker}</span> : null}
                      {trade.asset}
                    </div>

                    <div style={{ fontSize: 11, color: S.gray }}>
                      {formatDate(trade.filing_date)}
                      {trade.chamber && (
                        <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', padding: '1px 5px', borderRadius: 3, background: trade.chamber === 'senate' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', color: trade.chamber === 'senate' ? '#a78bfa' : '#60a5fa' }}>
                          {trade.chamber === 'senate' ? 'Senate' : 'House'}
                        </span>
                      )}
                      {trade.doc_url && (
                        <a href={trade.doc_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          style={{ marginLeft: 10, color: S.gold, textDecoration: 'none', fontSize: 11 }}>
                          PDF →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: isTop3 ? 20 : 16, fontWeight: 900, color: isTop3 ? '#f87171' : S.white, fontFamily: "'Playfair Display', serif" }}>
                      {fmtAmount(trade.amount_max)}
                    </div>
                    <div style={{ fontSize: 10, color: S.gray, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {trade.amount_str}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !error && (
          <p style={{ textAlign: 'center', color: S.gray, fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
            Data sourced from House Financial Disclosure PTRs and Senate EFTS filings (STOCK Act).
            Amounts reflect the maximum reported range from each disclosure. Click any row to view that member's full profile.
          </p>
        )}
      </main>
    </div>
  )
}
