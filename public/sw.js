const CACHE_NAME = 'al-azher-shell-v1'
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

function cacheResponse(cacheName, request, response) {
  const clone = response.clone()
  return caches.open(cacheName).then((cache) => cache.put(request, clone))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) event.waitUntil(cacheResponse(CACHE_NAME, '/index.html', res))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    )
    return
  }

  const url = new URL(request.url)
  // Hashed, immutable build output: serve from cache immediately when present.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/js/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) event.waitUntil(cacheResponse(CACHE_NAME, request, res))
            return res
          })
      )
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) event.waitUntil(cacheResponse(CACHE_NAME, request, res))
        return res
      })
      .catch(() => caches.match(request))
  )
})
