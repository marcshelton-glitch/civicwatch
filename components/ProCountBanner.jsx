'use client'
import { useEffect, useState } from 'react'
import { CountUp } from './CountUp'

export default function ProCountBanner() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    fetch('/api/pro-count')
      .then(r => r.json())
      .then(d => { if (d.count > 0) setCount(d.count) })
      .catch(() => {})
  }, [])

  if (count === null) return null

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      background: 'rgba(212,175,55,0.08)',
      border: '1px solid rgba(212,175,55,0.3)',
      borderRadius: 30,
      fontSize: 14,
      color: '#D4AF37',
      fontWeight: 600,
      marginBottom: 28,
    }}>
      <span style={{ fontSize: 16 }}>🇺🇸</span>
      <CountUp value={count} duration={1800} />
      <span> Americans went Pro this month</span>
    </div>
  )
}
