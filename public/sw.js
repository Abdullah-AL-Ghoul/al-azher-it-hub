/* eslint-disable no-undef */
// CACHE_NAME uses __BUILD_DATE__ when injected at build time via Vite define;
// fallback to v1 for dev or when served as static public asset (Vite does not process public/).
// To enable build-date versioning for the SW itself, configure Vite to copy/transform it via publicDir hook.
const CACHE_NAME = (typeof __BUILD_DATE__ !== 'undefined' && __BUILD_DATE__) ? `al-azher-shell-${__BUILD_DATE__}` : 'al-azher-shell-v1'
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/favicon.svg', '/boot.js', '/sw-register.js', '/fonts/fonts.css', '/fonts/cairo-400-arabic.woff2', '/fonts/cairo-400-latin.woff2', '/fonts/cairo-400-latin-ext.woff2', '/fonts/inter-400-latin.woff2', '/fonts/inter-400-latin-ext.woff2', '/og-image.png', '/sitemap.xml', '/robots.txt']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)))
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
  return caches.open(cacheName).then((cache) => cache.put(request, clone))
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
