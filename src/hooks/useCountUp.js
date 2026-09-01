import { useEffect, useRef, useState } from 'react'

// Count-up animation shared by hero stat tiles and profile stats.
// Starts when `start` flips true (pass an useInView result), eases out over
// `duration` ms, respects reduced motion (jumps straight to the target).
export default function useCountUp(target, { duration = 1200, start = true, reduced = false } = {}) {
  const [value, setValue] = useState(reduced ? target : 0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }
    if (!start) {
      setValue(0)
      return
    }
    const from = 0
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, start, reduced])

  return value
}
