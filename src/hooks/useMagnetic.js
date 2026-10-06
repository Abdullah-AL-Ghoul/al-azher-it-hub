import { useRef, useCallback } from 'react'

/**
 * Magnetic hover: the element drifts up to `strength` px toward the cursor.
 * Desktop pointers only (hover + fine); disabled for reduced motion via CSS
 * by the consumer — the transform is inline, so we gate on matchMedia here.
 */
export default function useMagnetic(strength = 6) {
 const ref = useRef(null)
 const rafRef = useRef(0)

 const enabled = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

 const onPointerMove = useCallback((e) => {
  const el = ref.current
  if (!el || !enabled()) return
  const r = el.getBoundingClientRect()
  const dx = e.clientX - (r.left + r.width / 2)
  const dy = e.clientY - (r.top + r.height / 2)
  cancelAnimationFrame(rafRef.current)
  rafRef.current = requestAnimationFrame(() => {
   el.style.transform = `translate(${(dx / r.width) * strength * 2}px, ${(dy / r.height) * strength * 2}px)`
  })
 }, [strength])

 const reset = useCallback(() => {
  cancelAnimationFrame(rafRef.current)
  const el = ref.current
  if (el) el.style.transform = ''
 }, [])

 return { ref, onPointerMove, onPointerLeave: reset, onPointerDown: reset }
}
