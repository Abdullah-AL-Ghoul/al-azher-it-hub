import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

export default function AuthAlert({ type, message, show }) {
  const isError = type === 'error'
  const styles = {
    success: {
      container: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
      icon: <FiCheckCircle size={18} className="shrink-0 text-emerald-500" aria-hidden="true" />,
      role: 'status',
      live: 'polite',
    },
    error: {
      container: 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400',
      icon: <FiAlertCircle size={18} className="shrink-0 text-rose-500" aria-hidden="true" />,
      role: 'alert',
      live: 'assertive',
    },
  }

  const config = isError ? styles.error : styles.success

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`mb-5 p-3.5 border rounded-2xl text-xs md:text-sm font-medium backdrop-blur-sm flex items-center justify-start gap-2.5 relative z-10 ${config.container}`}
          id="auth-form-alert"
          role={config.role}
          aria-live={config.live}
        >
          {config.icon}
          <span className="flex-1 text-start leading-snug">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
