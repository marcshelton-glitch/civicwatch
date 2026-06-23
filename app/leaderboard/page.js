'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  dem: '#0d2a4a',
  rep: '#4a0d0d',
}

const PARTY_COLORS = {
  Democrat:    { bg: 'rgba(13,42,74,0.9)',   text: '#5B9CFF', border: 'rgba(91,156,255,0.4)' },
  Republican:  { bg: 'rgba(74,13,13,0.9)',   text: '#FF6B6B', border: 'rgba(255,107,107,0.4)' },
  Independent: { bg: 'rgba(50,42,0,0.9)',    text: '#F0D000', border: 'rgba(240,208,0,0.4)' },
  Green:       { bg: 'rgba(10,46,24,0.9)',   text: '#4CAF76', border: 'rgba(76,175,118,0.4)' },
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'dem', label: 'Democrats' },
  { id: 'rep', label: 'Republicans' },
]

const MEDALS = ['🥇', '🥈', '🥉']

function partyColor(party) {
  return PARTY_COLORS[party] || { bg: 'rgba(27,42,107,0.5)', text: S.gray, border: S.border }
}

function photoUrl(bioguideId) {
  return `/api/rep-photo/${bioguideId}`
}


function RepPhoto({ bioguideId, name, size = 52 }) {
  const [tried, setTried] = useState(false)
  const [err, setErr] = useState(false)
  if (!bioguideId || err) {
    const initials = (name || '?').split(/[\s,]+/).filter(Boolean)
      .map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: S.navyMid, border: `2px solid ${S.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.3), color: S.gold, fontWeight: 700,
        fontFamily: 'Georgia, serif',
      }}>
        {initials}
      </div>
    )
  }
  const src = tried
    ? `https://bioguide.congress.gov/bioguide/photo/${bioguideId[0]}/${bioguideId}.jpg`
    : `/api/rep-photo/${bioguideId}`
  return (
    <img
      src={src}
      alt={name}
      onError={() => { if (!tried) setTried(true); else setErr(true) }}
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: `2px solid ${S.border}` }}
    />
  )
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json)) setData(json)
        else setError(json.error || 'Failed to load')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return data
    if (filter === 'dem') return data.filter(r => r.party?.toLowerCase().includes('democrat'))
    if (filter === 'rep') return data.filter(r => r.party?.toLowerCase().includes('republican'))
    // house/senate: we can infer from the bioguide pattern or state — without chamber in the data,
    // filter by party first; for house/senate we'd need chamber data, so skip for now
    return data
  }, [data, filter])

  const maxCount = filtered[0]?.filing_count || 1

  return (
    <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", background: S.navy, minHeight: '100vh', color: S.white }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, #0A0E1E, ${S.navyMid})`, borderBottom: `2px solid ${S.gold}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Image src="/brand/logo_civicwatch_horizontal.png" alt="CivicWatch" width={160} height={43} priority style={{display:'block'}} />
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
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: S.white, margin: '0 0 10px', letterSpacing: 1 }}>
            Most Active Traders in Congress
          </h1>
          <p style={{ color: S.gray, fontSize: 14, margin: 0 }}>
            Representatives ranked by total periodic transaction reports filed
          </p>
          <p style={{ fontSize: 11, color: S.gray, margin: '8px auto 0', letterSpacing: 0.3 }}>
            📊 Activity ranking only — counts STOCK Act PTRs filed, not net worth or wealth
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: `1px solid ${filter === f.id ? S.gold : S.border}`,
                background: filter === f.id ? `rgba(212,175,55,0.15)` : 'transparent',
                color: filter === f.id ? S.gold : S.gray,
                fontSize: 12, fontWeight: filter === f.id ? 700 : 400,
                fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: 0.5,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: S.gray }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Loading leaderboard…</div>
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
            <div style={{ fontSize: 14 }}>No data for this filter.</div>
          </div>
        )}

        {/* Ranked list */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((rep, i) => {
              const rank = i + 1
              const pc = partyColor(rep.party)
              const pct = Math.round((rep.filing_count / maxCount) * 100)
              const isTop3 = rank <= 3

              return (
                <TiltCard key={rep.bioguide_id || i} style={{ width: '100%', borderRadius: 12 }}>
                <button
                  onClick={() => rep.bioguide_id && router.push(`/dashboard?rep=${rep.bioguide_id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: isTop3
                      ? `linear-gradient(135deg, rgba(212,175,55,${0.12 - i * 0.03}), rgba(27,42,107,0.6))`
                      : `rgba(27,42,107,0.3)`,
                    border: isTop3 ? `1px solid rgba(212,175,55,${0.4 - i * 0.1})` : `1px solid ${S.border}`,
                    borderRadius: 12,
                    cursor: rep.bioguide_id ? 'pointer' : 'default', textAlign: 'left', width: '100%',
                    transition: 'all 0.15s', fontFamily: 'inherit', color: S.white,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isTop3
                    ? `linear-gradient(135deg, rgba(212,175,55,${0.18 - i * 0.03}), rgba(27,42,107,0.8))`
                    : `rgba(27,42,107,0.5)`}
                  onMouseLeave={e => e.currentTarget.style.background = isTop3
                    ? `linear-gradient(135deg, rgba(212,175,55,${0.12 - i * 0.03}), rgba(27,42,107,0.6))`
                    : `rgba(27,42,107,0.3)`}
                >
                  {/* Rank */}
                  <div style={{
                    width: 36, textAlign: 'center', flexShrink: 0,
                    fontSize: isTop3 ? 22 : 14,
                    fontWeight: isTop3 ? 900 : 600,
                    color: isTop3 ? S.gold : S.gray,
                    fontFamily: "'Playfair Display', serif",
                  }}>
                    {isTop3 ? MEDALS[i] : `#${rank}`}
                  </div>

                  {/* Photo */}
                  <RepPhoto bioguideId={rep.bioguide_id} name={rep.name} size={48} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: S.white, whiteSpace: 'nowrap' }}>
                        {rep.name || rep.bioguide_id}
                      </span>
                      {rep.party && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                          padding: '2px 7px', borderRadius: 4,
                          background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {rep.party === 'Democrat' ? 'D' : rep.party === 'Republican' ? 'R' : rep.party?.[0] || '?'}
                        </span>
                      )}
                      {rep.is_former && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                          padding: '2px 6px', borderRadius: 4,
                          background: 'rgba(136,153,170,0.12)', color: S.gray,
                          border: '1px solid rgba(136,153,170,0.25)',
                          whiteSpace: 'nowrap', textTransform: 'uppercase',
                        }}>
                          Former
                        </span>
                      )}
                      {rep.state && (
                        <span style={{ fontSize: 12, color: S.gray }}>{rep.state}</span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 2, width: `${pct}%`,
                        background: isTop3
                          ? `linear-gradient(90deg, ${S.gold}, rgba(212,175,55,0.5))`
                          : `linear-gradient(90deg, ${S.navyLight}, rgba(36,58,140,0.5))`,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>

                    <div style={{ fontSize: 11, color: S.gray }}>
                      Latest: {formatDate(rep.latest_filing)}
                    </div>
                  </div>

                  {/* Filing count */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: isTop3 ? 22 : 18, fontWeight: 900, color: isTop3 ? S.gold : S.white, fontFamily: "'Playfair Display', serif" }}>
                      {rep.filing_count}
                    </div>
                    <div style={{ fontSize: 10, color: S.gray, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      filings
                    </div>
                  </div>
                </button>
                </TiltCard>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && !error && (
          <p style={{ textAlign: 'center', color: S.gray, fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
            Financial disclosure data is sourced from public congressional records filed with the House Clerk and Senate.
            This information is publicly available under federal law (STOCK Act, 5 U.S.C. App. § 101 et seq.).{' '}
            Data sourced from House Clerk STOCK Act PTRs and Senate EFTS. Click any representative to view their full profile.
          </p>
        )}
      </main>
    </div>
  )
}
