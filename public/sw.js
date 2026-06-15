const CACHE_NAME = 'civicwatch-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only cache same-origin /_next/static/* assets — they have content hashes
  // and never go stale. Never intercept HTML navigation, API calls, or
  // cross-origin requests (Clerk, CDNs, etc.) so fresh content is always served.
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith('/_next/static/')) return

  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
      })
    ).catch(() => fetch(request))
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: 'CivicWatch', body: event.data.text() } }

  const options = {
    body: data.body || 'New activity from your tracked representatives',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { url: data.url || '/' },
    requireInteraction: false,
    tag: data.tag || 'civicwatch-alert',
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'CivicWatch Alert', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
