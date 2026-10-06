import { useRef } from 'react'
import { useScroll, useTransform, useReducedMotion } from 'framer-motion'

/**
 * Scroll-linked parallax over framer-motion's useScroll/useTransform.
 * Attach `ref` to a relatively-positioned section; use the returned style
 * object on the layer you want to drift as the page scrolls.
 *
 *   const { ref, style } = useParallax({ distance: 60 })
 *   <section ref={ref}> <div style={style} className="absolute ..." /> </section>
 *
 * Returns an empty style for prefers-reduced-motion.
 */
export function useParallax({ distance = 60, direction = 'up' } = {}) {
  const ref = useRef(null)
  const prefersReduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' ? [distance, -distance] : [-distance, distance]
  )
  return { ref, style: prefersReduced ? {} : { y } }
}

export default useParallax
