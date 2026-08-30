'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import CivicWatch from '@/components/CivicWatch'
import { trackPurchase } from '@/lib/funnel-track'

const PRO_MONTHLY_PRICE_USD = 9.99

function UpgradeBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()
  const status = searchParams.get('upgrade')
  const [visible, setVisible] = useState(!!status)

  // On successful checkout, the browser lands here before Stripe's webhook
  // has necessarily finished updating Clerk publicMetadata.isPro — and even
  // once it has, this client's cached `user` object won't reflect it until
  // something forces a refetch. Without this, the banner claims Pro is
  // active while every isPro-gated section in CivicWatch still renders the
  // free-tier paywall, which reads as "did I get charged for nothing."
  // Poll a few times with backoff rather than a single reload(): the webhook
  // is usually fast but not guaranteed to have landed the instant Stripe
  // redirects the browser back.
  useEffect(() => {
    if (status !== 'success' || !user) return
    let cancelled = false
    let attempt = 0
    const maxAttempts = 5

    async function poll() {
      if (cancelled) return
      try {
        await user.reload()
      } catch (err) {
        console.error('UpgradeBanner: user.reload() failed:', err.message)
      }
      if (cancelled) return
      attempt += 1
      if (user.publicMetadata?.isPro === true || attempt >= maxAttempts) return
      setTimeout(poll, 1500 * attempt) // 1.5s, 3s, 4.5s, 6s
    }

    poll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (!status) return
    const t = setTimeout(() => {
      setVisible(false)
      router.replace('/dashboard', { scroll: false })
    }, 6000)
    return () => clearTimeout(t)
  }, [status, router])

  // Fire Meta + TikTok Purchase pixels on landing here from a completed
  // checkout — this is the only point both the Stripe Checkout and
  // wallet (Apple Pay/Google Pay) subscribe flows converge on. Guarded by
  // sessionStorage, not just the `status` param, because router.replace()
  // above doesn't fire synchronously with the timeout — a refresh in that
  // 6s window would otherwise resend Purchase for the same subscription.
  useEffect(() => {
    if (status !== 'success') return
    try {
      if (sessionStorage.getItem('cw_purchase_pixel_fired') === '1') return
      sessionStorage.setItem('cw_purchase_pixel_fired', '1')
    } catch {
      // sessionStorage unavailable (private mode, etc.) — fire once anyway
      // rather than silently dropping the event.
    }
    trackPurchase(PRO_MONTHLY_PRICE_USD, { plan: 'pro_monthly' })
  }, [status])

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
