import { useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowUp } from 'react-icons/fi'
import { useScrollManager, useScrollFrame } from '../hooks/useScrollManager.jsx'
import { useLanguage } from '../context/LanguageContext'

export default function BackToTop() {
const { t } = useLanguage()
    const prefersReduced = useReducedMotion()
 const { scrolled } = useScrollManager()
 const circleRef = useRef(null)

 // Ring fill is written straight to the DOM per scroll frame (no re-render
 // per step); the listener only runs while the button is on screen.
 useScrollFrame(({ progress }) => {
  const el = circleRef.current
  if (!el) return
  const c = 2 * Math.PI * 20
  el.style.strokeDashoffset = c - (Math.min(progress, 100) / 100) * c
 })

 const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

 const r = 20
 const c = 2 * Math.PI * r

 return (
  <AnimatePresence>
   {scrolled && (
    <motion.button
     initial={prefersReduced ? {} : { opacity: 0, scale: 0.5 }}
     animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
     exit={{ opacity: 0, scale: 0.5 }}
     onClick={scrollToTop}
     aria-label={t('common.backToTop')}
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 w-12 h-12 rounded-full bg-navy-800 border border-white/20 shadow-xl flex items-center justify-center hover:bg-navy-700 transition-colors duration-300 end-6"
    >
    <svg className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
     <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
     <circle
       ref={circleRef}
       cx="24" cy="24" r={r} fill="none" stroke="#06b6d4" strokeWidth="3"
       strokeDasharray={c} strokeLinecap="round"
       className="transition duration-150"
      />
    </svg>
   <FiArrowUp size={18} className="text-white relative z-10" />
  </motion.button>
   )}
  </AnimatePresence>
 )
}
