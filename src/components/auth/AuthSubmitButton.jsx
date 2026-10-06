import { motion } from 'framer-motion'
import { FiLoader, FiArrowLeft, FiArrowRight } from 'react-icons/fi'

export default function AuthSubmitButton({ loading, loadingText, buttonText, isArabic, delay = 0.85 }) {
 return (
  <motion.div
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
   className="pt-2"
  >
   <motion.button
    type="submit"
    whileHover={!loading ? { scale: 1.02 } : {}}
    whileTap={!loading ? { scale: 0.97 } : {}}
    disabled={loading}
    className="w-full relative overflow-hidden btn-spatial py-4 rounded-2xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
   >
    {!loading && (
     <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 3, ease: 'linear' }}
     />
    )}
    {loading ? (
     <>
      <FiLoader size={18} className="animate-spin" />
      {loadingText}
     </>
    ) : (
     <>
      <span className="relative z-10">{buttonText}</span>
      <motion.span
       className="relative z-10"
       animate={{ x: [0, 4, 0] }}
       transition={{ duration: 1.5, ease: 'easeInOut', repeatDelay: 4 }}
      >
       {isArabic ? <FiArrowLeft size={18} /> : <FiArrowRight size={18} />}
      </motion.span>
     </>
    )}
   </motion.button>
  </motion.div>
 )
}
