'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TiltCard } from '../../components/TiltCard'

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

function tradeTypeLabel(type) {
  if (type === 'BUY') return 'Purchase'
  if (type === 'SELL') return 'Sale'
  if (type === 'EXCHANGE') return 'Exchange'
  return type || 'Trade'
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RepPhoto({ bioguideId, name, size = 44 }) {
  const [err, setErr] = useState(false)
  if (!bioguideId || err) {
    const initials = (name || '?').split(/[\s,]+/).filter(Boolean)
      .map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: S.navyMid, border: `2px solid ${S.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.32), color: S.gold, fontWeight: 700,
        fontFamily: 'Georgia, serif',
      }}>
        {initials}
      </div>
    )
  }
  return (
    <img
      src={`/api/rep-photo/${bioguideId}`}
      alt={name}
      onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: `2px solid ${S.border}` }}
    />
  )
}

function TradesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTicker = (searchParams.get('ticker') || '').toUpperCase()

  const [input, setInput] = useState(initialTicker)
  const [ticker, setTicker] = useState(initialTicker)
  const [result, setResult] = useState(null)
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runSearch = useCallback((t) => {
    const clean = t.trim().toUpperCase()
    if (!clean) return
    setLoading(true)
    setError(null)
    setResult(null)
    router.push(`/trades?ticker=${encodeURIComponent(clean)}`, { scroll: false })
    fetch(`/api/ticker-trades?ticker=${encodeURIComponent(clean)}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setResult(json)
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    fetch('/api/ticker-trades')
      .then(r => r.json())
      .then(json => setTrending(json.trending || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (initialTicker) runSearch(initialTicker)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: '100vh', color: S.white }}>
      <header style={{ background: `linear-gradient(135deg, #0A0E1E, ${S.navyMid})`, borderBottom: `2px solid ${S.gold}`, position: 'sticky', top: 0, zIndex: 100 }}>
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
          <button
            onClick={() => router.push('/')}
            style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.gray, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5 }}>
            ← Back
          </button>
        </div>
      </header>

      <div style={{ height: 4, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔎</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: S.white, margin: '0 0 10px', letterSpacing: 1 }}>
            Who in Congress Traded This Stock?
          </h1>
          <p style={{ color: S.gray, fontSize: 14, margin: 0 }}>
            Search any ticker across every disclosed House and Senate STOCK Act trade.
          </p>
        </div>

        {/* Search box */}
        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(input) }}
          style={{ display: 'flex', gap: 8, marginBottom: 20 }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Ticker, e.g. NVDA"
            maxLength={6}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10,
              border: `1px solid ${S.border}`, background: 'rgba(255,255,255,0.04)',
              color: S.white, fontSize: 15, fontFamily: 'inherit', letterSpacing: 1,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 22px', borderRadius: 10, border: 'none',
              background: S.gold, color: S.navy, fontWeight: 700, fontSize: 13,
              fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5,
            }}>
            Search
          </button>
        </form>

        {/* Trending chips */}
        {trending.length > 0 && !result && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
              Trending in Congress
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {trending.map(t => (
                <button
                  key={t.ticker}
                  onClick={() => { setInput(t.ticker); runSearch(t.ticker) }}
                  style={{
                    padding: '6px 14px', borderRadius: 20, border: `1px solid ${S.border}`,
                    background: 'rgba(212,175,55,0.08)', color: S.gold, fontSize: 12, fontWeight: 700,
                    fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5,
                  }}>
                  {t.ticker} <span style={{ color: S.gray, fontWeight: 400 }}>· {t.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Searching disclosures…</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14 }}>{error}</div>
          </div>
        )}

        {result && !loading && (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 18px', marginBottom: 16, borderRadius: 12,
              background: 'rgba(27,42,107,0.35)', border: `1px solid ${S.border}`,
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: S.gold }}>
                  ${result.ticker}
                </div>
                <div style={{ fontSize: 12, color: S.gray, marginTop: 2 }}>
                  {result.totalCount} disclosed trade{result.totalCount === 1 ? '' : 's'} · {result.distinctTraders} member{result.distinctTraders === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                <span style={{ color: '#4CAF50' }}>{result.buys} buys</span>
                <span style={{ color: '#f87171' }}>{result.sells} sells</span>
              </div>
            </div>

            {result.trades.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray, fontSize: 14 }}>
                No disclosed trades found for ${result.ticker}.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.trades.map((t, i) => (
                <TiltCard key={i} style={{ width: '100%', borderRadius: 10 }}>
                  <button
                    onClick={() => t.bioguideId && router.push(`/dashboard?rep=${t.bioguideId}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                      background: 'rgba(27,42,107,0.3)', border: `1px solid ${S.border}`,
                      cursor: t.bioguideId ? 'pointer' : 'default', fontFamily: 'inherit', color: S.white,
                    }}>
                    <RepPhoto bioguideId={t.bioguideId} name={t.repName} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.repName || 'Unknown Member'}</div>
                      <div style={{ fontSize: 11, color: S.gray, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                        <span style={{ color: t.type === 'BUY' ? '#4CAF50' : t.type === 'SELL' ? '#f87171' : S.gray, fontWeight: 700 }}>
                          {tradeTypeLabel(t.type)}
                        </span>
                        <span>{formatDate(t.date)}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                          padding: '1px 5px', borderRadius: 4,
                          background: t.chamber === 'senate' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                          color: t.chamber === 'senate' ? '#a78bfa' : '#60a5fa',
                        }}>
                          {t.chamber === 'senate' ? 'Senate' : 'House'}
                        </span>
                        {t.state && <span>{t.state}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.amount}</div>
                      {typeof t.returnPct === 'number' && (
                        <div
                          title="Change in price from the trade date to today — an estimate, not the member's actual realized gain or loss"
                          style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: t.returnPct >= 0 ? '#4CAF50' : '#f87171' }}>
                          {t.returnPct >= 0 ? '▲' : '▼'} {Math.abs(t.returnPct)}% since
                        </div>
                      )}
                    </div>
                  </button>
                </TiltCard>
              ))}
            </div>
          </>
        )}

        {!result && !loading && !error && (
          <p style={{ textAlign: 'center', color: S.gray, fontSize: 11, marginTop: 12, lineHeight: 1.6 }}>
            Data sourced from House Clerk STOCK Act PTRs and Senate EFTS. Returns are estimated from
            public closing prices and do not reflect a member's actual realized gain or loss.
          </p>
        )}
      </main>
    </div>
  )
}

// useSearchParams() opts the tree up to the nearest Suspense boundary into
// client-side rendering. Without one, prerendering /trades fails the build.
export default function TradesPage() {
  return (
    <Suspense fallback={
      <div style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        background: S.navy, minHeight: '100vh', color: S.gray,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
      }}>
        Loading trades…
      </div>
    }>
      <TradesContent />
    </Suspense>
  )
}
