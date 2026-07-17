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

function formatVolume(n) {
  if (!n) return '$0'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`
  return `$${n}`
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ padding: 18, background: 'rgba(27,42,107,0.35)', border: `1px solid ${S.border}`, borderRadius: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Playfair Display', serif", color: accent || S.white }}>{value}</div>
      <div style={{ fontSize: 11, color: S.gray, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: S.gray, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function AccountabilityPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/accountability-stats')
      .then(r => r.json())
      .then(json => (json.error ? setError(json.error) : setData(json)))
      .catch(() => setError('Network error'))
  }, [])

  const maxMonthVolume = data ? Math.max(...data.monthlyVolume.map(m => m.volume), 1) : 1
  const partyTotal = data ? data.partyCounts.Democrat + data.partyCounts.Republican + data.partyCounts.Other : 1

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: '100vh', color: S.white }}>
      <header style={{ background: `linear-gradient(135deg, #0A0E1E, ${S.navyMid})`, borderBottom: `2px solid ${S.gold}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 22 }}>🏛️</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 16, letterSpacing: 2, color: S.white }}>
                CIVIC<span style={{ color: S.gold }}>WATCH</span>
              </div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: S.gray, textTransform: 'uppercase' }}>Your Representatives. Accountable.</div>
            </div>
          </button>
          <button onClick={() => router.push('/')} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${S.border}`, borderRadius: 8, color: S.gray, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 0.5 }}>
            ← Back
          </button>
        </div>
      </header>

      <div style={{ height: 4, background: `linear-gradient(90deg, ${S.red} 33%, ${S.white} 33%, ${S.white} 66%, ${S.navyMid} 66%)` }} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: S.white, margin: '0 0 10px', letterSpacing: 1 }}>
            Congressional Trading, By the Numbers
          </h1>
          <p style={{ color: S.gray, fontSize: 14, margin: '0 auto', maxWidth: 560, lineHeight: 1.6 }}>
            A live, continuously updated version of the aggregate accountability figures groups like the
            Campaign Legal Center have published as static reports — recomputed from official STOCK Act
            disclosures every time this page loads.
          </p>
        </div>

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 14 }}>{error}</div>
          </div>
        )}

        {!data && !error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Computing live figures…</div>
          </div>
        )}

        {data && (
          <>
            <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
              <StatCard label="Of Congress Has Disclosed a Trade" value={`${data.tradersPct}%`} sub={`${data.tradersCount} of ${data.totalMembers} members`} accent={S.gold} />
              <StatCard label="Disclosed Volume, This Year" value={formatVolume(data.totalVolumeYtd)} sub="midpoint of disclosed ranges" />
              <StatCard label="Trades on File" value={data.totalTradesAllTime.toLocaleString()} sub="all-time, both chambers" />
            </div>

            {/* Party split */}
            <div style={{ marginBottom: 28, padding: 18, background: 'rgba(27,42,107,0.25)', border: `1px solid ${S.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>
                Party Split of Members Who Trade
              </div>
              <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 10, marginBottom: 8 }}>
                <div style={{ background: '#5B9CFF', width: `${(data.partyCounts.Democrat / partyTotal) * 100}%` }} />
                <div style={{ background: '#FF6B6B', width: `${(data.partyCounts.Republican / partyTotal) * 100}%` }} />
                <div style={{ background: S.gray, flex: 1 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: S.gray, flexWrap: 'wrap', gap: 6 }}>
                <span><span style={{ color: '#5B9CFF' }}>●</span> Democrat — {data.partyCounts.Democrat}</span>
                <span><span style={{ color: '#FF6B6B' }}>●</span> Republican — {data.partyCounts.Republican}</span>
                <span><span style={{ color: S.gray }}>●</span> Other / Unresolved — {data.partyCounts.Other}</span>
              </div>
            </div>

            {/* Monthly volume trend */}
            <div style={{ marginBottom: 28, padding: 18, background: 'rgba(27,42,107,0.25)', border: `1px solid ${S.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 16 }}>
                Disclosed Trade Volume — Last 12 Months
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                {data.monthlyVolume.map((m) => (
                  <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`${m.key}: ${formatVolume(m.volume)}`}>
                    <div style={{
                      width: '100%', borderRadius: '3px 3px 0 0',
                      height: `${Math.max((m.volume / maxMonthVolume) * 100, 2)}%`,
                      background: `linear-gradient(180deg, ${S.gold}, rgba(212,175,55,0.3))`,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {data.monthlyVolume.map((m, i) => (
                  <div key={m.key} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: S.gray }}>
                    {i % 2 === 0 ? m.key.slice(5) : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Top tickers */}
            {data.topTickers.length > 0 && (
              <div style={{ marginBottom: 28, padding: 18, background: 'rgba(27,42,107,0.25)', border: `1px solid ${S.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: S.gray, textTransform: 'uppercase', marginBottom: 12 }}>
                  Most-Traded Tickers in Congress
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.topTickers.map(t => (
                    <button
                      key={t.ticker}
                      onClick={() => router.push(`/trades?ticker=${t.ticker}`)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, border: `1px solid ${S.border}`,
                        background: 'rgba(212,175,55,0.08)', color: S.gold, fontSize: 12, fontWeight: 700,
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}>
                      {t.ticker} <span style={{ color: S.gray, fontWeight: 400 }}>· {t.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p style={{ textAlign: 'center', color: S.gray, fontSize: 11, marginTop: 12, lineHeight: 1.7, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
              {data.methodology} Data sourced from House Clerk STOCK Act PTRs and Senate EFTS. Updated continuously as new disclosures are ingested.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
