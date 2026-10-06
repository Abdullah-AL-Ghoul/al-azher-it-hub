if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(function (err) {
      console.warn('[SW] registration failed:', err && err.message ? err.message : err)
    })
  })
}
