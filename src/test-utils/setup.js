import { vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { getSupabase, authRpc } from './mockSupabase'

// globals are disabled, so React Testing Library cannot auto-register its
// cleanup hook. Unmount explicitly after every test to keep the document
// and provider state isolated between tests.
afterEach(() => {
  cleanup()
})

// Route @/services/supabase through the installable mock (see mockSupabase.js)
// for every test file, so services and AuthProvider never hit the network.
// Individual tests can swap the client via __setSupabaseMock(createMockSupabase()).
vi.mock('@/services/supabase', () => ({
  getSupabase,
  authRpc,
}))

// ---------------------------------------------------------------------------
// jsdom polyfills. jsdom lacks several browser APIs that the app uses
// (framer-motion, matchMedia, IntersectionObserver, ResizeObserver, rAF).
// These are installed globally before any test file runs. We never advertise
// them as Vitest globals — the project uses explicit imports only.
// ---------------------------------------------------------------------------

const g = globalThis

// window.matchMedia (used by ThemeContext + framer-motion)
if (!g.matchMedia) {
  g.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// ResizeObserver (used by framer-motion's layout/scroll animations)
if (!g.ResizeObserver) {
  g.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// IntersectionObserver (used by framer-motion's whileInView)
if (!g.IntersectionObserver) {
  g.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
}

// requestAnimationFrame / cancelAnimationFrame (used by useScrollManager + framer-motion)
const now = () => Date.now()
if (typeof g.requestAnimationFrame !== 'function') {
  g.requestAnimationFrame = (cb) => setTimeout(() => cb(now()), 16)
}
if (typeof g.cancelAnimationFrame !== 'function') {
  g.cancelAnimationFrame = (id) => clearTimeout(id)
}

// window.scrollTo / document.scrollTo (sometimes called on mount)
if (!g.scrollTo) g.scrollTo = () => {}
if (typeof document !== 'undefined' && !document.scrollTo) document.scrollTo = () => {}

// scrollIntoView / element click helper used by some UI libs
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
