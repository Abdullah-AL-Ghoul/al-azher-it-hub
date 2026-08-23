import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { modalOverlay, modalContent } from '../utils/motionTokens'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { FiBookOpen, FiArrowLeft, FiStar } from 'react-icons/fi'
import motivationalQuotes from '../data/quotes'

export default function WelcomeModal() {
 const { lang, t } = useLanguage()
 const { user, isAdmin } = useAuth()
 const isArabic = lang === 'ar'
 const [show, setShow] = useState(false)
 const prefersReduced = useReducedMotion()
 const [quote, setQuote] = useState('')
 const trapRef = useFocusTrap(show)

 useEffect(() => {
  if (!user || isAdmin) return
  const key = `welcome_shown_${user.studentId}`
  if (typeof sessionStorage === 'undefined' || !sessionStorage.getItem(key)) {
   setShow(true)
   setQuote(getRandomQuote())
   const timer = setTimeout(() => {
    handleDismiss()
   }, 5000)
   return () => clearTimeout(timer)
  }
 }, [user, isAdmin])
 useEffect(() => {
  if (!show) return
  const prev = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = prev }
 }, [show])

 useEffect(() => {
  const handleEscape = (e) => {
   if (e.key === 'Escape' && show) {
    handleDismiss()
   }
  }
  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
 }, [show])

 const getRandomQuote = () => {
  const quotes = motivationalQuotes[lang] || motivationalQuotes.en
  return quotes[Math.floor(Math.random() * quotes.length)]
 }

 const handleDismiss = () => {
  if (user && typeof sessionStorage !== 'undefined') {
   sessionStorage.setItem(`welcome_shown_${user.studentId}`, '1')
  }
  setShow(false)
 }

 if (!user || isAdmin) return null

 return (
  <AnimatePresence>
   {show && (
    <motion.div
     {...modalOverlay}
     className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
     onClick={handleDismiss}
     role="dialog"
     aria-modal="true"
     aria-label={isArabic ? 'رسالة ترحيب' : 'Welcome message'}
    >
     <motion.div
      ref={trapRef}
      {...modalContent}
      className="modal-spatial rounded-2xl p-8 md:p-10 w-full max-w-md text-center relative overflow-hidden"
      onClick={e => e.stopPropagation()}
     >
      <div className="absolute inset-0 bg-gradient-to-br from-royal-500/5 via-transparent to-cyan-400/5 pointer-events-none" />

      <motion.div
       initial={prefersReduced ? {} : { scale: 0, rotate: -10 }}
       animate={prefersReduced ? {} : { scale: 1, rotate: 0 }}
       transition={prefersReduced ? {} : { delay: 0.2, type: 'spring', damping: 12, stiffness: 200 }}
       className="relative w-20 h-20 bg-gradient-to-br from-royal-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-royal-500/30"
      >
       <FiStar size={36} />
      </motion.div>

      <motion.h2
       initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
       animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
       transition={prefersReduced ? {} : { delay: 0.3, duration: 0.4 }}
       className="relative text-2xl md:text-3xl font-bold text-navy-900 dark:text-white mb-3"
      >
       {t('welcome.title', { name: user.name })}
      </motion.h2>

      <motion.div
       initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
       animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
       transition={prefersReduced ? {} : { delay: 0.4, duration: 0.4 }}
       className="relative mb-8"
      >
       <div className="inline-flex items-center gap-2 glass rounded-2xl px-5 py-4">
        <FiBookOpen className="text-royal-400 shrink-0" size={18} />
        <p className="text-royal-400 dark:text-royal-300 text-sm italic leading-relaxed">
         "{quote}"
        </p>
       </div>
      </motion.div>

      <motion.button
       initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
       animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
       transition={prefersReduced ? {} : { delay: 0.5, duration: 0.4 }}
       whileHover={prefersReduced ? {} : { scale: 1.03 }}
       whileTap={prefersReduced ? {} : { scale: 0.97 }}
       onClick={handleDismiss}
       className="relative btn-spatial text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 mx-auto"
      >
       {t('welcome.getStarted')}
       <FiArrowLeft size={18} className={isArabic ? '' : 'rotate-180'} />
      </motion.button>
     </motion.div>
    </motion.div>
   )}
  </AnimatePresence>
 )
}
