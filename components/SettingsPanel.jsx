'use client'
import { useEffect, useRef } from 'react'
import { useClerk } from '@clerk/nextjs'

const S = {
  navy:      '#0A0E1E',
  navyMid:   '#111827',
  navyLight: '#1B2A6B',
  gold:      '#D4AF37',
  red:       '#B22234',
  white:     '#FFFFFF',
  offWhite:  '#F0EDE4',
  gray:      '#8892A4',
  grayLight: '#B0BAC8',
  cardBg:    'rgba(27,42,107,0.35)',
  border:    'rgba(212,175,55,0.15)',
  green:     '#4CAF50',
}

export default function SettingsPanel({
  isOpen,
  onClose,
  user,
  isPro,
  tracked,
  liveReps,
  toggleTrack,
  prefs,
  updatePref,
  prefsSaved,
  handleBillingPortal,
}) {
  const { openUserProfile } = useClerk()
  const overlayRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const trackedRepObjects = tracked
    .map(id => liveReps.find(r => r.id === id))
    .filter(Boolean)

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.primaryEmailAddress?.emailAddress || 'Account'
    : 'Account'
  const email = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <>
      <style>{`
        .settings-drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 380px;
          max-width: 95vw;
          background: linear-gradient(180deg, #0D1325 0%, #0A0E1E 100%);
          border-left: 1px solid ${S.border};
          z-index: 9999;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: -8px 0 40px rgba(0,0,0,0.5);
        }
        .settings-drawer.open {
          transform: translateX(0);
        }
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0);
          z-index: 9998;
          transition: background 0.28s ease;
          pointer-events: none;
        }
        .settings-overlay.open {
          background: rgba(0,0,0,0.55);
          pointer-events: all;
        }
        .settings-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          scrollbar-width: thin;
          scrollbar-color: rgba(212,175,55,0.2) transparent;
        }
        .settings-section {
          background: ${S.cardBg};
          border: 1px solid ${S.border};
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 14px;
        }
        .settings-section-label {
          font-size: 10px;
          letter-spacing: 2px;
          color: ${S.gray};
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .tracked-rep-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          margin-bottom: 6px;
        }
        .tracked-rep-row:last-child { margin-bottom: 0; }
        .untrack-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: ${S.gray};
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 2px 6px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .untrack-btn:hover { color: #FF6B6B; background: rgba(255,107,107,0.1); }
        .settings-pref-row {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .settings-pref-row:last-child { margin-bottom: 0; }
        .pref-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 2px solid ${S.border};
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .pref-checkbox.checked {
          border-color: ${S.gold};
          background: rgba(212,175,55,0.2);
        }
        .settings-action-btn {
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          letter-spacing: 0.3px;
        }
        .settings-action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        @media (max-width: 480px) {
          .settings-drawer { width: 100vw; max-width: 100vw; }
        }
      `}</style>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`settings-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`settings-drawer${isOpen ? ' open' : ''}`} role="dialog" aria-label="Account settings">

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 16, color: S.white }}>
            Account Settings
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: S.gray, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="settings-body">

          {/* User info */}
          <div className="settings-section">
            <div className="settings-section-label">Your Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={displayName}
                  style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${S.gold}`, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: S.navyLight, border: `2px solid ${S.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 18, color: S.gold }}>
                  {displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: S.offWhite, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                {email && (
                  <div style={{ fontSize: 12, color: S.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email}
                  </div>
                )}
              </div>
            </div>

            {/* Plan badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: S.gray }}>Plan:</span>
              {isPro ? (
                <span style={{ padding: '3px 10px', background: 'rgba(212,175,55,0.15)', border: `1px solid ${S.gold}`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: S.gold }}>
                  ★ Pro Member
                </span>
              ) : (
                <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, fontSize: 11, fontWeight: 600, color: S.grayLight }}>
                  Free
                </span>
              )}
            </div>

            <button
              onClick={() => openUserProfile()}
              className="settings-action-btn"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, color: S.offWhite }}
            >
              Manage Account →
            </button>
          </div>

          {/* Tracked reps */}
          <div className="settings-section">
            <div className="settings-section-label">
              Tracked Representatives {tracked.length > 0 && `(${tracked.length})`}
            </div>

            {trackedRepObjects.length === 0 ? (
              <div style={{ fontSize: 13, color: S.gray, textAlign: 'center', padding: '12px 0' }}>
                {tracked.length === 0
                  ? 'No representatives tracked yet.'
                  : 'Representative data loading…'}
              </div>
            ) : (
              trackedRepObjects.map(rep => {
                const nameParts = (rep.name || '').split(', ')
                const shortName = nameParts.length >= 2
                  ? `${nameParts[1]?.split(' ')[0] || ''} ${nameParts[0]}`
                  : rep.name
                const partyColor = rep.party === 'Democrat' ? '#5B9CFF'
                  : rep.party === 'Republican' ? S.red
                  : S.gray
                return (
                  <div key={rep.id} className="tracked-rep-row">
                    {rep.photo ? (
                      <img
                        src={rep.photo}
                        alt={shortName}
                        referrerPolicy="no-referrer"
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${partyColor}`, flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${partyColor}22`, border: `2px solid ${partyColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: partyColor }}>
                        {shortName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: S.offWhite, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shortName}
                      </div>
                      <div style={{ fontSize: 11, color: S.gray }}>
                        {rep.party === 'Democrat' ? 'D' : rep.party === 'Republican' ? 'R' : 'I'} · {rep.state}
                      </div>
                    </div>
                    <button
                      className="untrack-btn"
                      onClick={() => toggleTrack(rep)}
                      title={`Stop tracking ${shortName}`}
                      aria-label={`Stop tracking ${shortName}`}
                    >
                      ✕
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Pro: Email notification preferences */}
          {isPro && prefs && (
            <div className="settings-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="settings-section-label" style={{ marginBottom: 0 }}>Email Alerts</div>
                {prefsSaved && (
                  <span style={{ fontSize: 11, color: S.green, fontWeight: 600 }}>Saved ✓</span>
                )}
              </div>

              {/* Frequency */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: S.grayLight, marginBottom: 8, fontWeight: 600 }}>Frequency</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { value: 'daily',   label: 'Daily' },
                    { value: 'weekly',  label: 'Weekly' },
                    { value: 'instant', label: 'Instant' },
                  ].map(({ value, label }) => {
                    const active = prefs.alert_frequency === value
                    return (
                      <button
                        key={value}
                        onClick={() => updatePref('alert_frequency', value)}
                        style={{ padding: '6px 12px', background: active ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? S.gold : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: active ? S.gold : S.gray, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Alert types */}
              <div>
                <div style={{ fontSize: 11, color: S.grayLight, marginBottom: 8, fontWeight: 600 }}>Alert Types</div>
                {[
                  { key: 'alert_trades',     label: 'Trade disclosures (PTR filings)' },
                  { key: 'alert_networth',   label: 'Net worth updates' },
                  { key: 'alert_legislation', label: 'Sponsored legislation' },
                  { key: 'alert_committees', label: 'Committee assignments' },
                ].map(({ key, label }) => {
                  const checked = prefs[key]
                  return (
                    <div key={key} className="settings-pref-row" onClick={() => updatePref(key, !checked)}>
                      <div className={`pref-checkbox${checked ? ' checked' : ''}`}>
                        {checked && <span style={{ color: S.gold, fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 12, color: checked ? S.grayLight : S.gray }}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pro: Manage Billing */}
          {isPro && (
            <div className="settings-section">
              <div className="settings-section-label">Billing</div>
              <button
                onClick={handleBillingPortal}
                className="settings-action-btn"
                style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${S.gold}`, color: S.gold }}
              >
                ★ Manage Billing & Subscription →
              </button>
            </div>
          )}

          {/* Upgrade CTA for free users */}
          {!isPro && (
            <div style={{ padding: '16px', background: `linear-gradient(135deg, rgba(178,34,52,0.15), rgba(27,42,107,0.3))`, border: `1px solid rgba(178,34,52,0.3)`, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.offWhite, marginBottom: 6 }}>Upgrade to Pro</div>
              <div style={{ fontSize: 12, color: S.gray, marginBottom: 12, lineHeight: 1.6 }}>Full AI reports, wealth tracking, and email alerts for your reps.</div>
              <a
                href="/pro"
                style={{ display: 'inline-block', padding: '9px 22px', background: `linear-gradient(135deg, ${S.gold}, #B8960C)`, borderRadius: 8, color: S.navy, fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: 0.5 }}
              >
                ★ Go Pro · $9.99/mo
              </a>
            </div>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  )
}
