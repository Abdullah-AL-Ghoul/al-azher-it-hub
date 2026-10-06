import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GOTO = {
  h: '/home',
  l: '/lectures',
  s: '/sources',
  a: '/additions',
  r: '/roadmap',
  p: '/profile',
}
const SEQ_WINDOW_MS = 900

function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

/**
 * App-wide keyboard shortcuts (Phase 4d):
 * - `?` opens the shortcuts guide
 * - `/` opens global search (same as Ctrl+K, which it deliberately
 *   coexists with — different keys, no conflict)
 * - `g` then h/l/s/a/r/p navigates
 * Everything no-ops while typing in a field, with modifiers held, or while
 * the guide itself is open (Escape closes it via the shared Modal).
 */
export function useAppShortcuts({ onOpenGuide, onOpenSearch, guideOpen }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const seqRef = useRef({ key: null, at: 0 })

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (guideOpen) return

      if (e.key === '?') {
        e.preventDefault()
        onOpenGuide()
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        onOpenSearch()
        return
      }
      // g-prefix navigation
      const now = Date.now()
      if (seqRef.current.key === 'g' && now - seqRef.current.at < SEQ_WINDOW_MS) {
        const target = GOTO[e.key.toLowerCase()]
        seqRef.current = { key: null, at: 0 }
        if (target) {
          e.preventDefault()
          navigate(target)
        }
        return
      }
      if (e.key.toLowerCase() === 'g') {
        seqRef.current = { key: 'g', at: now }
      } else {
        seqRef.current = { key: null, at: 0 }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, onOpenGuide, onOpenSearch, guideOpen, user])
}
