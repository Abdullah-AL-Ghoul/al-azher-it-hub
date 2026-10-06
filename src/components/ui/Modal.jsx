import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useScrollLock } from '../../hooks/useScrollLock'
import { modalOverlay, modalContent } from '../../utils/motionTokens'
import { useLanguage } from '../../context/LanguageContext'

const SIZE_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideClose = false,
  labelledBy,
  className = '',
}) {
  const { t } = useLanguage()
  const trapRef = useFocusTrap(isOpen)
  useScrollLock(isOpen)

  const widthClass = SIZE_CLASS[size] || SIZE_CLASS.md

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...modalOverlay}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={trapRef}
            {...modalContent}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            aria-labelledby={labelledBy}
            className={`relative w-full ${widthClass} modal-spatial rounded-2xl overflow-hidden ${className}`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold text-ink" id={labelledBy}>{title}</h2>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    aria-label={t('common.close')}
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
