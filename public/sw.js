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
