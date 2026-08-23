import { motion, useReducedMotion } from 'framer-motion'
import { revealItem, revealContainer } from '../../utils/motionTokens'
import Reveal from './Reveal'

export default function SectionHeading({ eyebrow, title, subtitle, center = true, className = '' }) {
 const prefersReduced = useReducedMotion()

 return (
  <Reveal className={`${center ? 'text-center mx-auto' : ''} max-w-2xl mb-12 ${className}`}>
   {eyebrow && (
    <span className="eyebrow mb-3">
     {eyebrow}
    </span>
   )}
   {title && (
    <h2 className="text-3xl md:text-4xl font-bold gradient-text-spatial">{title}</h2>
   )}
   {subtitle && (
    <p className="mt-3 text-slate-500 dark:text-white/60 text-lg">{subtitle}</p>
   )}
  </Reveal>
 )
}
