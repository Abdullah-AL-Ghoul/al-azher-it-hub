import { lazy } from 'react'

// Lazy import with one-shot auto-recovery. After a production deploy a stale
// tab can request pruned hashed chunks — with immutable asset caching that is
// a network 404, which would otherwise blank the whole app behind an error
// boundary. Reload once per session to pick up the fresh shell, then give up.
const RELOAD_KEY = 'al_azher_chunk_reload'

export function lazyWithRecovery(factory) {
  return lazy(() =>
    factory().catch((error) => {
      try {
        if (typeof window !== 'undefined' && !sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1')
          window.location.reload()
        }
      } catch (_e) { /* storage unavailable */ }
      throw error
    })
  )
}
