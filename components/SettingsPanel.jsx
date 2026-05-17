'use client'
import { useUser, useClerk } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

export default function SettingsPanel({ isOpen, onClose, trackedReps, onUntrack, isPro }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [prefs, setPrefs] = useState({ alert_frequency: 'daily', alert_trades: true, alert_networth: true, alert_legislation: false, alert_committees: false })

  useEffect(() => {
    if (isOpen && isPro) {
      fetch('/api/preferences').then(r => r.json()).then(d => { if (d && !d.error) setPrefs(d) })
    }
  }, [isOpen, isPro])

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
          <span style={{ background: isPro ? '#1a3a1a' : '#1e2a3a', color: isPro ? '#4caf50' : '#8899aa', fontSize: 11, padding: '2px 8px', borderRadius: 10, border: `1px solid ${isPro ? '#4caf50' : '#334466'}` }}>{isPro ? '★ Pro Member' : 'Free Plan'}</span>
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

        {/* Pro: notification prefs */}
        {isPro && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Email Notifications</div>
            {[['alert_trades','Trade Disclosures'],['alert_committees','Committee Assignments'],['alert_networth','Net Worth Updates'],['alert_legislation','Sponsored Legislation']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={prefs[key] || false} onChange={e => { const updated = { ...prefs, [key]: e.target.checked }; setPrefs(updated); fetch('/api/preferences', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updated) }) }} />
                <span style={{ color: '#e8e8e8', fontSize: 13 }}>{label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Pro: billing */}
        {isPro && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Billing</div>
            <button onClick={() => fetch('/api/billing-portal').then(r=>r.json()).then(d=>{ if(d.url) window.location.href=d.url })} style={{ background: '#1e3a5f', color: '#e8e8e8', border: '1px solid #2a5f9e', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%' }}>Manage Billing & Subscription →</button>
          </div>
        )}

        {/* Free: upgrade CTA */}
        {!isPro && (
          <a href="/pro" style={{ display: 'block', background: 'linear-gradient(135deg, #1a3a1a, #0d2a0d)', border: '1px solid #c9a84c', borderRadius: 8, padding: 16, textDecoration: 'none', textAlign: 'center' }}>
            <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: 4 }}>★ Upgrade to Pro</div>
            <div style={{ color: '#8899aa', fontSize: 12 }}>AI Analysis, email alerts, and more</div>
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
