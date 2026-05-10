'use client'
import { useState, useEffect } from 'react'
import CivicWatch from '@/components/CivicWatch'

// Convert Congress.gov full state names to abbreviations
const STATE_TO_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO',
  'Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH',
  'Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
  'District of Columbia':'DC',
}

const S = { navy: '#0A1628', gold: '#D4AF37', gray: '#8892A4', border: 'rgba(212,175,55,0.25)' }

export default function RepPage({ params }) {
  const { bioguideId } = params
  const [stateAbbr, setStateAbbr] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!/^[A-Z]\d{6}$/.test(bioguideId)) {
      setError('Invalid representative ID.')
      return
    }
    fetch(`/api/congress?type=member&bioguideId=${bioguideId}`)
      .then(r => r.json())
      .then(data => {
        const fullState = data.member?.state || ''
        setStateAbbr(STATE_TO_ABBR[fullState] || 'CA')
      })
      .catch(() => setStateAbbr('CA'))
  }, [bioguideId])

  if (error) {
    return (
      <div style={{ background: S.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.gray, fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontSize: 16, marginBottom: 16 }}>{error}</div>
          <a href="/" style={{ color: S.gold, textDecoration: 'none', fontSize: 13 }}>← Back to CivicWatch</a>
        </div>
      </div>
    )
  }

  if (!stateAbbr) {
    return (
      <div style={{ background: S.navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: S.gray, fontFamily: 'Georgia, serif' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${S.border}`, borderTopColor: S.gold, borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div>Loading representative…</div>
        </div>
      </div>
    )
  }

  return <CivicWatch defaultBioguideId={bioguideId} defaultState={stateAbbr} />
}
