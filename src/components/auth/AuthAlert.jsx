import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'

export default function AuthAlert({ type, message, show }) {
 const styles = {
  success: {
   container: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
   icon: <FiCheckCircle size={18} />,
   animateIcon: true,
  },
  error: {
   container: 'bg-red-500/10 border border-red-500/20 text-red-400',
   icon: null,
   animateIcon: false,
  },
 }

 const config = styles[type] || styles.error

 return (
  <AnimatePresence>
   {show && (
    <motion.div
     initial={{ opacity: 0, scale: 0.8, y: -10 }}
     animate={{ opacity: 1, scale: 1, y: 0 }}
     exit={{ opacity: 0, scale: 0.8, y: -10 }}
className={`mb-6 p-4 border rounded-2xl text-sm text-center backdrop-blur-sm flex items-center justify-center gap-2 relative z-10 ${config.container}`}
      id="auth-form-alert"
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
     >
     {config.animateIcon && (
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.6 }}>
       {config.icon}
      </motion.div>
     )}
     {!config.animateIcon && config.icon}
     {message}
    </motion.div>
   )}
  </AnimatePresence>
 )
}
