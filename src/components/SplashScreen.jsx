import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import SiteLogo from './shared/SiteLogo'

export default function SplashScreen({ onComplete }) {
 const [show, setShow] = useState(true)
 const prefersReduced = useReducedMotion()

 useEffect(() => {
  const seen = sessionStorage.getItem('al_azher_splash')
  if (seen) {
   onComplete()
   return
  }
   let innerTimer = null
   const timer = setTimeout(() => {
    setShow(false)
    sessionStorage.setItem('al_azher_splash', '1')
    innerTimer = setTimeout(onComplete, 400)
   }, 1500)
  return () => {
   clearTimeout(timer)
   if (innerTimer) clearTimeout(innerTimer)
  }
 }, [onComplete])

 return (
  <AnimatePresence>
   {show && (
    <motion.div
     initial={prefersReduced ? {} : { opacity: 1 }}
     exit={prefersReduced ? {} : { opacity: 0 }}
     transition={prefersReduced ? {} : { duration: 0.5 }}
     className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-slate-900"
     role="status"
     aria-label="Loading"
    >
     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-royal-500/10 via-transparent to-transparent" />

     <div className="relative z-10 text-center">
      <motion.div
       initial={prefersReduced ? {} : { scale: 0, rotate: -180 }}
       animate={prefersReduced ? {} : { scale: 1, rotate: 0 }}
       transition={prefersReduced ? {} : { type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
       className="mx-auto mb-8"
      >
       <SiteLogo size="lg" />
      </motion.div>

      <motion.h1
       initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
       animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
       transition={prefersReduced ? {} : { delay: 0.5, duration: 0.6 }}
       className="text-4xl md:text-5xl font-bold text-white mb-3"
      >
       AL-Azher IT Hub
      </motion.h1>

      <motion.p
       initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
       animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
       transition={prefersReduced ? {} : { delay: 0.7, duration: 0.6 }}
       className="text-white/50 text-lg mb-12"
      >
       Educational Platform
      </motion.p>

       <motion.div
        initial={prefersReduced ? {} : { opacity: 0 }}
        animate={prefersReduced ? {} : { opacity: 1 }}
        transition={prefersReduced ? {} : { delay: 0.5 }}
        className="flex justify-center"
       >
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
         <motion.div
          initial={prefersReduced ? {} : { width: '0%' }}
          animate={prefersReduced ? {} : { width: '100%' }}
          transition={prefersReduced ? {} : { delay: 0.5, duration: 0.8, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-royal-500 to-cyan-400 rounded-full"
         />
        </div>
       </motion.div>
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 )
}
