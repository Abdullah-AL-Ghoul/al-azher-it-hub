import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'

export default function AuthSuccessAnimation({ show, redirectingText }) {
 const prefersReduced = useReducedMotion()

 return (
  <AnimatePresence>
   {show && (
    <motion.div className="relative z-10 py-8 text-center">
     <motion.div
      initial={prefersReduced ? { opacity: 0 } : { scale: 0 }}
      animate={prefersReduced ? { opacity: 1 } : { scale: 1 }}
      transition={{ type: 'spring', damping: 8, stiffness: 100 }}
     >
      <motion.div
       className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20"
       animate={prefersReduced ? {} : { rotate: [0, 360] }}
       transition={{ duration: 1, ease: 'easeOut' }}
      >
       <FiCheckCircle size={40} className="text-white" />
      </motion.div>
     </motion.div>

     {!prefersReduced && [...Array(12)].map((_, i) => (
      <motion.div
       key={i}
       className="absolute w-2 h-2 rounded-full"
       style={{
        background: ['#06b6d4', '#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'][i % 6],
        top: '50%',
        left: '50%',
       }}
       initial={{ scale: 0, x: 0, y: 0 }}
       animate={{
        scale: [0, 1, 0],
        x: Math.cos((i / 12) * Math.PI * 2) * 100,
        y: Math.sin((i / 12) * Math.PI * 2) * 100,
       }}
       transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      />
     ))}

     <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReduced ? 0 : 0.6 }}
      className="text-slate-500 dark:text-white/50 text-sm"
     >
      {redirectingText}
     </motion.p>
    </motion.div>
   )}
  </AnimatePresence>
 )
}
