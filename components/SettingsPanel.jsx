'use client'
import { useUser, useClerk } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { getUserTier, TIER_LABELS } from '@/lib/tier-utils'
import PushNotificationToggle from './PushNotificationToggle'
import { trackUpgradeClick } from '@/lib/funnel-track'

export default function SettingsPanel({ isOpen, onClose, trackedReps, onUntrack, isPro, tier: tierProp }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [prefs, setPrefs] = useState({ alert_frequency: 'daily', alert_trades: true, alert_networth: true, alert_legislation: false, alert_committees: false })

  // Derive tier from prop (passed by CivicWatch) or fall back to reading user directly
  const tier = tierProp ?? getUserTier(user)
  const isPaid = tier !== 'free'
  const tierLabel = TIER_LABELS[tier] || 'Free'

  useEffect(() => {
    if (isOpen && isPaid) {
      fetch('/api/preferences').then(r => r.json()).then(d => { if (d && !d.error) setPrefs(d) })
    }
  }, [isOpen, isPaid])

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: 320, height: '100vh', background: '#0d1f35', borderLeft: '1px solid #1e3a5f', zIndex: 9999, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.5)', transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e3a5f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#e8e8e8', fontWeight: 600, fontSize: 16 }}>Account Settings</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
        {/* User info */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Account</div>
          <div style={{ color: '#e8e8e8', fontSize: 14 }}>{user?.fullName || user?.firstName || 'User'}</div>
          <div style={{ color: '#8899aa', fontSize: 12, marginBottom: 8 }}>{user?.primaryEmailAddress?.emailAddress}</div>
          <span style={{ background: isPaid ? '#1a3a1a' : '#1e2a3a', color: isPaid ? '#4caf50' : '#8899aa', fontSize: 11, padding: '2px 8px', borderRadius: 10, border: `1px solid ${isPaid ? '#4caf50' : '#334466'}` }}>
            {isPaid ? `★ ${tierLabel}` : 'Free Plan'}
          </span>
        </div>

        {/* Tracked reps */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tracked Representatives ({trackedReps.length})</div>
          {trackedReps.length === 0 ? <div style={{ color: '#8899aa', fontSize: 13 }}>No reps tracked yet.</div> : trackedReps.map(r => (
            <div key={r.bioguide_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1e2a3a' }}>
              <span style={{ color: '#e8e8e8', fontSize: 13 }}>{r.rep_name || r.bioguide_id}</span>
              <button onClick={() => onUntrack(r.bioguide_id)} style={{ background: 'none', border: 'none', color: '#cc2020', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Voter Pro+: notification prefs */}
        {isPaid && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Email Notifications</div>
            {[['alert_trades','Trade Disclosures'],['alert_committees','Committee Assignments'],['alert_networth','Net Worth Updates'],['alert_legislation','Sponsored Legislation']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={prefs[key] || false} onChange={e => { const updated = { ...prefs, [key]: e.target.checked }; setPrefs(updated); fetch('/api/preferences', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updated) }) }} />
                <span style={{ color: '#e8e8e8', fontSize: 13 }}>{label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Voter Pro+: push notifications */}
        {isPaid && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Push Notifications</div>
            <div style={{ color: '#8899aa', fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>Get a browser notification the moment a tracked rep files a new trade.</div>
            <PushNotificationToggle style={{ width: '100%', justifyContent: 'center' }} />
          </div>
        )}

        {/* Voter Pro+: billing */}
        {isPaid && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Billing</div>
            <button onClick={() => fetch('/api/billing-portal', { method: 'POST' }).then(r=>r.json()).then(d=>{ if(d.url) window.location.href=d.url })} style={{ background: '#1e3a5f', color: '#e8e8e8', border: '1px solid #2a5f9e', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%' }}>Manage Billing & Subscription →</button>
          </div>
        )}

        {/* Free: upgrade CTA. CivicWatch sells one paid plan — Pro, $9.99/mo.
            This block previously advertised "from $3.99/mo" and a Civic Pack
            upsell, both carried over from the California Candidate Calculator's
            pricing. Free users saw $3.99 here and $9.99 on /pro.

            "Stock trade conflict analysis" was pulled from this list on
            2026-08-20 (see docs/paywall-funnel-audit.md, Finding 5) because
            fd_trades.bioguide_id was NULL on ~52% of rows, including sitting
            Ways & Means/Appropriations members with real trade volume
            (Doggett, Chu, Lee). Restored 2026-08-26: bioguide_id coverage is
            now ~96%, /pro's comingSoon flag is off, and /api/conflict-score
            now returns an explicit "No trade data on file" tier for the
            remaining gap instead of a misleading "None flagged" — so the
            claim below is honest even for the small slice still unresolved. */}
        {!isPaid && (
          <a href="/pro" onClick={() => trackUpgradeClick('settings_upsell')} style={{ display: 'block', background: 'linear-gradient(135deg, #1a3a1a, #0d2a0d)', border: '1px solid #c9a84c', borderRadius: 8, padding: 16, textDecoration: 'none' }}>
            <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>★ Upgrade to Pro — $9.99/mo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                '📊 Net worth & financial disclosures',
                '🔔 Real-time alerts for tracked reps',
                '🤖 Full AI accountability reports',
                '📈 Stock trade conflict analysis',
                '⭐ Track any representative',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#b0bac8' }}>
                  <span style={{ color: '#c9a84c', fontSize: 10 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, textAlign: 'center', color: '#c9a84c', fontSize: 12, fontWeight: 600 }}>See all plans →</div>
          </a>
        )}
      </div>

      {/* Sign out footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1e3a5f' }}>
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          style={{ background: 'none', border: '1px solid #3a1a1a', borderRadius: 6, color: '#cc4444', fontSize: 13, cursor: 'pointer', width: '100%', padding: '8px 0', letterSpacing: '0.03em' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
