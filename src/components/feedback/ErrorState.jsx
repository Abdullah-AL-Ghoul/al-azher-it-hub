import { motion } from 'framer-motion'
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

export default function ErrorState({ error, onRetry, title, className = '', compact = false }) {
 const { t } = useLanguage()
 if (!error) return null

 const message = typeof error === 'string' ? error : error.message || t('common.error')

 if (compact) {
  return (
   <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 ${className}`}
    role="alert"
   >
    <FiAlertCircle size={16} className="shrink-0" />
    <span className="flex-1 truncate">{title || message}</span>
    {onRetry && (
     <button
      onClick={onRetry}
      className="p-1 hover:bg-red-500/20 rounded transition-colors"
      aria-label={t('common.retry')}
     >
      <FiRefreshCw size={14} />
     </button>
    )}
   </motion.div>
  )
 }

 return (
  <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   className={`glass rounded-2xl p-8 text-center border border-red-500/20 ${className}`}
   role="alert"
  >
   <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
    <FiAlertCircle className="text-red-400" size={28} />
   </div>
   <h3 className="text-lg font-bold text-ink mb-2">
    {title || t('errorBoundary.title')}
   </h3>
   <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
    {message}
   </p>
   {onRetry && (
    <button
     onClick={onRetry}
     className="inline-flex items-center gap-2 px-5 py-2.5 bg-royal-500 hover:bg-royal-600 text-white rounded-xl text-sm font-medium transition"
    >
     <FiRefreshCw size={16} />
     {t('errorBoundary.retry')}
    </button>
   )}
  </motion.div>
 )
}
