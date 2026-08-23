import { useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { formSlideVariant, modalContent } from '../../utils/motionTokens'

export default function CrudForm({ show, formRef, title, onClose, children, isArabic }) {
 const prefersReduced = useReducedMotion()
 const slideTransition = prefersReduced ? { duration: 0 } : formSlideVariant.transition
 const exitVariant = prefersReduced ? { opacity: 0 } : modalContent.exit

 useEffect(() => {
  if (!show) return
  const handleKey = (e) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('keydown', handleKey)
  return () => document.removeEventListener('keydown', handleKey)
 }, [show, onClose])

 return (
  <AnimatePresence>
   {show && (
    <motion.div
     ref={formRef}
     initial={formSlideVariant.initial}
     animate={formSlideVariant.animate}
     exit={exitVariant}
     transition={slideTransition}
    >
     <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
       <h3 className="font-bold text-navy-900 dark:text-white">
        {title}
       </h3>
       <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">
        <FiX size={16} className="text-slate-500" />
       </button>
      </div>
      {children}
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 )
}
