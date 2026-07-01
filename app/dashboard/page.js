'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CivicWatch from '@/components/CivicWatch'

function UpgradeBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const status = searchParams.get('upgrade')
  const [visible, setVisible] = useState(!!status)

  useEffect(() => {
    if (!status) return
    const t = setTimeout(() => {
      setVisible(false)
      router.replace('/dashboard', { scroll: false })
    }, 6000)
    return () => clearTimeout(t)
  }, [status, router])

  if (!visible || !status) return null

  const isSuccess = status === 'success'

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      padding: '14px 24px',
      borderRadius: 12,
      fontFamily: "'Source Serif 4', Georgia, serif",
      fontSize: 14,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap',
      ...(isSuccess ? {
        background: 'linear-gradient(135deg, #1a3a1a, #0d2a0d)',
        border: '1px solid #4CAF50',
        color: '#4CAF50',
      } : {
        background: 'rgba(27,42,107,0.95)',
        border: '1px solid rgba(212,175,55,0.3)',
        color: '#CDD2E0',
      }),
    }}>
      {isSuccess ? '★ Welcome to CivicWatch Pro! Your subscription is now active.' : 'No problem — your free account is ready whenever you are.'}
      <button
        onClick={() => { setVisible(false); router.replace('/dashboard', { scroll: false }) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: 16, padding: 0, lineHeight: 1, marginLeft: 4 }}
        aria-label="Dismiss"
      >✕</button>
    </div>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const repParam = searchParams.get('rep')
  return (
    <>
      <UpgradeBanner />
      <CivicWatch defaultBioguideId={repParam ? null : 'K000401'} defaultState="CA" />
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
