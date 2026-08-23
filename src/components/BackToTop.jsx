import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowUp } from 'react-icons/fi'
import { useScrollManager } from '../hooks/useScrollManager.jsx'
import { useLanguage } from '../context/LanguageContext'

export default function BackToTop() {
const { lang, t } = useLanguage()
  const isArabic = lang === 'ar'
  const prefersReduced = useReducedMotion()
 const { scrolled, progress } = useScrollManager()

 const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

 const r = 20
 const c = 2 * Math.PI * r
 const offset = c - (progress / 100) * c

 return (
  <AnimatePresence>
   {scrolled && (
    <motion.button
     initial={prefersReduced ? {} : { opacity: 0, scale: 0.5 }}
     animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
     exit={{ opacity: 0, scale: 0.5 }}
     onClick={scrollToTop}
     aria-label={t('common.backToTop')}
      className={`fixed bottom-6 z-50 w-12 h-12 rounded-full bg-navy-800 border border-white/20 shadow-xl flex items-center justify-center hover:bg-navy-700 transition-colors duration-300 ${isArabic ? 'right-6' : 'left-6'}`}
    >
    <svg className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
     <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
     <circle
       cx="24" cy="24" r={r} fill="none" stroke="#06b6d4" strokeWidth="3"
       strokeDasharray={c} strokeDashoffset={offset}
       strokeLinecap="round" className="transition duration-150"
      />
    </svg>
   <FiArrowUp size={18} className="text-white relative z-10" />
  </motion.button>
   )}
  </AnimatePresence>
 )
}
