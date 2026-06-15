'use client'
import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

const STORAGE_KEY = 'push_enabled'

export default function PushNotificationToggle({ style }) {
  const [supported, setSupported] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setSupported(true)
    setEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  async function enable() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('VAPID key not configured')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const sub = subscription.toJSON()
      const res = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys }),
      })

      if (!res.ok) throw new Error('Failed to save subscription')

      localStorage.setItem(STORAGE_KEY, 'true')
      setEnabled(true)
    } catch (err) {
      console.error('PushNotificationToggle: enable failed', err)
    } finally {
      setLoading(false)
    }
  }

  async function disable() {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      localStorage.removeItem(STORAGE_KEY)
      setEnabled(false)
    } catch (err) {
      console.error('PushNotificationToggle: disable failed', err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={enabled ? disable : enable}
      disabled={loading}
      style={{
        background: enabled ? 'rgba(61,170,110,0.15)' : 'rgba(212,175,55,0.1)',
        border: enabled ? '1px solid rgba(61,170,110,0.4)' : '1px solid rgba(212,175,55,0.3)',
        color: enabled ? '#3DAA6E' : '#D4AF37',
        borderRadius: 6,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        ...style,
      }}
    >
      {enabled ? '🔔 Alerts on' : '🔕 Enable alerts'}
    </button>
  )
}
