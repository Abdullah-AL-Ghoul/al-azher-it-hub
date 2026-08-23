import { memo, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiAlertTriangle } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { modalOverlay, modalContent } from '../../utils/motionTokens'

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, variant = 'danger' }) {
 const { t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const trapRef = useFocusTrap(isOpen)

 useEffect(() => {
  if (!isOpen) return
  const prev = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = prev }
 }, [isOpen])

 useEffect(() => {
  if (!isOpen) return
  const onKey = (e) => { if (e.key === 'Escape') onClose() }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
 }, [isOpen, onClose])

 return (
  <AnimatePresence>
   {isOpen && (
    <motion.div
     {...(prefersReduced ? {} : modalOverlay)}
     className="fixed inset-0 z-[100] flex items-center justify-center p-4"
     onClick={onClose}
    >
     <motion.div
      {...(prefersReduced ? {} : modalOverlay)}
      className="absolute inset-0 bg-black/60 backdrop-blur-md"
     />
      <motion.div
       ref={trapRef}
       {...(prefersReduced ? {} : modalContent)}
       className="relative w-full max-w-sm modal-spatial rounded-2xl p-6"
       onClick={(e) => e.stopPropagation()}
       role="alertdialog"
       aria-modal="true"
       aria-label={title || t('common.confirm')}
      >
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
       background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 30%, transparent 70%, rgba(6, 182, 212, 0.1) 100%)',
       mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
       maskComposite: 'xor',
       WebkitMaskComposite: 'xor',
       padding: '1px',
      }} />
      <div className="text-center">
       <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
        <FiAlertTriangle size={24} className={variant === 'danger' ? 'text-red-500' : 'text-yellow-500'} />
       </div>
       <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">{title}</h3>
       <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
       <div className="flex gap-3 justify-center">
        <button
         onClick={onClose}
         className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-500 dark:text-white/70 rounded-lg text-sm font-medium transition"
         autoFocus
        >
         {cancelText || t('common.cancel')}
        </button>
        <button
         onClick={() => { onConfirm(); onClose() }}
         className={`px-4 py-2 rounded-lg text-sm font-medium transition text-white ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
        >
         {confirmText || t('common.confirm')}
        </button>
       </div>
      </div>
     </motion.div>
    </motion.div>
   )}
  </AnimatePresence>
 )
}

export default memo(ConfirmDialog)
