/* eslint-disable no-undef */
// CACHE_NAME uses __BUILD_DATE__ when injected at build time via Vite define;
// fallback to v1 for dev or when served as static public asset (Vite does not process public/).
// To enable build-date versioning for the SW itself, configure Vite to copy/transform it via publicDir hook.
const CACHE_NAME = (typeof __BUILD_DATE__ !== 'undefined' && __BUILD_DATE__) ? `al-azher-shell-${__BUILD_DATE__}` : 'al-azher-shell-v1'
// Minimal app shell only. Heavy/social assets (og-image) and secondary font
// subsets stream from the network into the runtime cache on first use —
// precaching them delayed install, and one 404 used to fail cache.addAll
// and block activation entirely.
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/favicon.svg', '/boot.js', '/sw-register.js', '/fonts/fonts.css', '/fonts/cairo-400-arabic.woff2', '/fonts/cairo-400-latin.woff2', '/fonts/cairo-700-arabic.woff2', '/fonts/inter-400-latin.woff2', '/fonts/inter-700-latin.woff2']
const RUNTIME_CACHE_MAX = 400

self.addEventListener('install', (event) => {
  // Per-URL add: one bad response no longer rejects the whole install.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
    })()
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable() } catch (_) { /* navigationPreload not supported */ }
      }
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    })()
  )
  self.clients.claim()
})

function cacheResponse(cacheName, request, response) {
  const clone = response.clone()
  return caches.open(cacheName).then(async (cache) => {
    await cache.put(request, clone)
    // Bound the runtime cache: once over the cap, drop the oldest entries.
    if (cacheName === CACHE_NAME) {
      const keys = await cache.keys()
      if (keys.length > RUNTIME_CACHE_MAX) {
        await Promise.all(keys.slice(0, keys.length - RUNTIME_CACHE_MAX).map((k) => cache.delete(k)))
      }
    }
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  // YouTube thumbnails are immutable per video id — cache-first so repeat
  // visits (and offline) load them instantly.
  if (request.method === 'GET' && request.url.startsWith('https://img.youtube.com/')) {
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
  // Supabase and other cross-origin: early return — let browser handle.
  // Data layer uses stale-while-revalidate (UserDataContext / useLectures) instead of SW cache
  // to avoid staling auth or user data.
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Use navigation preload response if available (faster TTFB when enabled in activate)
          const preload = await event.preloadResponse
          if (preload) {
            if (preload.ok) event.waitUntil(cacheResponse(CACHE_NAME, '/index.html', preload.clone()))
            return preload
          }
          const res = await fetch(request)
          if (res.ok) event.waitUntil(cacheResponse(CACHE_NAME, '/index.html', res.clone()))
          return res
        } catch (_) {
          const cached = await caches.match('/index.html')
          return cached || caches.match('/')
        }
      })()
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
