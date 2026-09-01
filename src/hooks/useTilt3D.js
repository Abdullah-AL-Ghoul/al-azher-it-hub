import { useCallback, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

const MAX_TILT_DEG = 8

/**
 * 3D card tilt driven by mouse position. Writes CSS vars consumed by the
 * .tilt-card utility (rotateX/rotateY), so React never re-renders on move.
 * Disabled for touch/coarse pointers and prefers-reduced-motion.
 */
export function useTilt3D({ max = MAX_TILT_DEG, scale = 1.02 } = {}) {
  const ref = useRef(null)
  const prefersReduced = useReducedMotion()
  const rafRef = useRef(null)

  const onMouseMove = useCallback(
    (e) => {
      if (prefersReduced) return
      if (e.pointerType === 'touch') return
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        el.style.setProperty('--tilt-x', `${(-py * max).toFixed(2)}deg`)
        el.style.setProperty('--tilt-y', `${(px * max).toFixed(2)}deg`)
        el.style.setProperty('--tilt-z', '10px')
        el.classList.add('is-tilting')
      })
    },
    [max, prefersReduced]
  )

  const onMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const el = ref.current
    if (!el) return
    el.classList.remove('is-tilting')
    el.style.setProperty('--tilt-x', '0deg')
    el.style.setProperty('--tilt-y', '0deg')
    el.style.setProperty('--tilt-z', '0px')
  }, [])

  // Spread onto the tilting element alongside className "tilt-card perspective-mid".
  const tiltHandlers = prefersReduced
    ? {}
    : { onMouseMove, onMouseLeave, ref, style: { transformStyle: 'preserve-3d' } }

  return { ref, tiltHandlers, scale }
}

export default useTilt3D
