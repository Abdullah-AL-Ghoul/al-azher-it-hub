import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { FiHome } from 'react-icons/fi'

export default function NotFound() {
 const { t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const navigate = useNavigate()
 const textRef = useRef(null)

 
 const handleMouse = useCallback((e) => {
  if (!textRef.current || prefersReduced) return
  const x = (e.clientX / window.innerWidth - 0.5) * 20
  const y = (e.clientY / window.innerHeight - 0.5) * 20
  textRef.current.style.transform = `translate(${x}px, ${y}px)`
 }, [prefersReduced])

 return (
  <motion.div
   initial={prefersReduced ? {} : { opacity: 0 }}
   animate={prefersReduced ? {} : { opacity: 1 }}
   transition={prefersReduced ? {} : { duration: 0.5 }}
   className="min-h-screen flex items-center justify-center relative overflow-hidden bg-spatial-full"
  >
   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
    <div className="relative z-10 text-center px-4" onMouseMove={handleMouse}>
     <h1 className="sr-only">{t('notFound.title')}</h1>
     <motion.div
      ref={textRef}
      initial={prefersReduced ? {} : { opacity: 0, y: 40 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={prefersReduced ? {} : { delay: 0.2, duration: 0.6 }}
      className="text-5xl sm:text-7xl md:text-9xl lg:text-[12rem] font-black gradient-text-spatial leading-none mb-4 select-none will-change-transform"
      aria-hidden="true"
     >
      404
     </motion.div>
     <motion.p
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={prefersReduced ? {} : { delay: 0.4, duration: 0.5 }}
      className="text-slate-500 dark:text-white/60 text-xl md:text-2xl mb-8 font-light"
     >
      {t('notFound.message')}
     </motion.p>
    <motion.button
     initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
     animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
     transition={prefersReduced ? {} : { delay: 0.6, duration: 0.5 }}
     onClick={() => navigate('/home')}
     className="inline-flex items-center gap-2 px-8 py-4 btn-spatial text-white rounded-xl font-semibold text-lg transition duration-300"
    >
     <FiHome size={20} />
     {t('notFound.home')}
    </motion.button>
   </div>
  </motion.div>
 )
}
