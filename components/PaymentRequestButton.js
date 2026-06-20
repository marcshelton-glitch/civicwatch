'use client'
import { useEffect, useRef, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function PaymentRequestButton({ onUnavailable }) {
  const { user, isSignedIn, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const router = useRouter()
  const mountRef = useRef(null)
  const prRef = useRef(null)
  const btnRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let unmounted = false

    async function init() {
      const stripe = await stripePromise
      if (!stripe || unmounted) return

      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: { label: 'CivicWatch Pro (monthly)', amount: 999 },
        requestPayerName: true,
        requestPayerEmail: true,
      })

      const canPay = await pr.canMakePayment()
      if (!canPay) {
        onUnavailable?.()
        return
      }

      if (unmounted) return
      prRef.current = pr
      setReady(true)

      pr.on('paymentmethod', async (ev) => {
        if (!isSignedIn) {
          ev.complete('fail')
          openSignIn()
          return
        }

        setProcessing(true)
        setError(null)

        try {
          const res = await fetch('/api/subscribe-instant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethodId: ev.paymentMethod.id }),
          })
          const data = await res.json()

          if (!res.ok) {
            ev.complete('fail')
            setError(data.error || 'Payment failed. Please try again.')
            setProcessing(false)
            return
          }

          // If the subscription requires payment confirmation (e.g. 3DS)
          if (data.clientSecret) {
            const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret)
            if (confirmError) {
              ev.complete('fail')
              setError(confirmError.message || 'Payment failed. Please try again.')
              setProcessing(false)
              return
            }
          }

          ev.complete('success')
          router.push('/dashboard?upgrade=success')
        } catch {
          ev.complete('fail')
          setError('Something went wrong. Please try again.')
          setProcessing(false)
        }
      })
    }

    if (isLoaded) init()

    return () => {
      unmounted = true
      btnRef.current?.unmount()
    }
  }, [isLoaded, isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mount the Stripe Payment Request Button element once PR is ready and div is in the DOM
  useEffect(() => {
    if (!ready || !mountRef.current || !prRef.current) return

    async function mountBtn() {
      const stripe = await stripePromise
      if (!stripe) return

      const elements = stripe.elements()
      const btn = elements.create('paymentRequestButton', {
        paymentRequest: prRef.current,
        style: {
          paymentRequestButton: {
            theme: 'dark',
            height: '50px',
            type: 'default',
          },
        },
      })
      btn.mount(mountRef.current)
      btnRef.current = btn
    }

    mountBtn()
  }, [ready])

  if (!ready) return null

  return (
    <div style={{ width: '100%' }}>
      {/* Stripe injects the Apple Pay / Google Pay button here */}
      <div ref={mountRef} style={{ width: '100%', borderRadius: 12, overflow: 'hidden', opacity: processing ? 0.6 : 1 }} />
      {processing && (
        <p style={{ marginTop: 8, fontSize: 13, color: '#B0BAC8', textAlign: 'center' }}>
          Processing…
        </p>
      )}
      {error && (
        <p style={{ marginTop: 8, fontSize: 13, color: '#e57373', textAlign: 'center' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.2)' }} />
        <span style={{ fontSize: 12, color: '#8892A4', fontFamily: 'Inter, sans-serif' }}>or pay with card</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(212,175,55,0.2)' }} />
      </div>
    </div>
  )
}
