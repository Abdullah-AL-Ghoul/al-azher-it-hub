import { motion, useReducedMotion } from 'framer-motion'
import { revealContainer, revealItem, revealItemLeft, revealItemRight, revealItemScale } from '../../utils/motionTokens'

const VARIANTS = { up: revealItem, left: revealItemLeft, right: revealItemRight, scale: revealItemScale }

export default function Reveal({ children, direction = 'up', delay = 0, className = '', as = 'div', once = true, amount = 0.15 }) {
 const prefersReduced = useReducedMotion()
 const MotionTag = motion[as] || motion.div
 const variant = VARIANTS[direction] || revealItem

 return (
  <MotionTag
   className={className}
   variants={prefersReduced ? { hidden: {}, visible: {} } : { hidden: variant.hidden, visible: { ...variant.visible, transition: { ...variant.visible.transition, delay } } }}
   initial="hidden"
   whileInView="visible"
   viewport={{ once, amount }}
  >
   {children}
  </MotionTag>
 )
}
