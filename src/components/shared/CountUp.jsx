import { useRef } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import useCountUp from '../../hooks/useCountUp'

// Viewport-triggered count-up built on the shared useCountUp hook.
// (One implementation site — HeroSection previously had its own copy.)
export default function CountUp({ end, duration = 1400, suffix = '' }) {
 const ref = useRef(null)
 const inView = useInView(ref, { once: true, amount: 0.4 })
 const prefersReduced = useReducedMotion()
 const value = useCountUp(end, { duration, start: inView, reduced: prefersReduced })

 return <span ref={ref} className="tabular-nums">{value.toLocaleString()}{suffix}</span>
}
