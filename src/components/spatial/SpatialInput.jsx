import { memo, useState, useRef, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiEye, FiEyeOff } from 'react-icons/fi'

function SpatialInput({ label, error, icon: Icon, type = 'text', className = '', value, onChange, placeholder, disabled, isArabic, showToggle, onToggle, showPassword, autoComplete, id: idProp, ...props }) {
 const prefersReduced = useReducedMotion()
 const [focused, setFocused] = useState(false)
 const inputRef = useRef(null)
 const generatedId = useId()
 const inputId = idProp || generatedId
 const errorId = `${inputId}-error`

const iconPosition = isArabic ? 'right' : 'left'
  const togglePosition = isArabic ? 'left' : 'right'

  const padLeft = Icon && !isArabic ? '44px' : (showToggle && isArabic ? '44px' : '16px')
  const padRight = Icon && isArabic ? '44px' : (showToggle && !isArabic ? '44px' : '16px')

 return (
  <div className={`relative ${className}`}>
   <div className="relative">
    {Icon && (
     <Icon
      size={18}
      className={`absolute top-1/2 -translate-y-1/2 transition-colors duration-300 ${
       focused ? 'text-accent' : 'text-slate-500 dark:text-white/50'
      }`}
      style={{ [iconPosition]: '16px' }}
     />
    )}
    <input
     ref={inputRef}
     id={inputId}
     type={type}
     value={value}
     onChange={onChange}
     placeholder={placeholder}
     disabled={disabled}
     autoComplete={autoComplete}
     aria-invalid={error ? true : undefined}
     aria-describedby={error ? errorId : undefined}
     className="input-spatial w-full py-3.5 rounded-xl text-sm text-ink placeholder:text-slate-500 dark:placeholder:text-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
     style={{
      paddingLeft: padLeft,
      paddingRight: padRight,
     }}
     onFocus={() => setFocused(true)}
     onBlur={() => setFocused(false)}
     {...props}
    />
     {showToggle && (
     <motion.button
      type="button"
      whileHover={prefersReduced ? {} : { scale: 1.1 }}
      whileTap={prefersReduced ? {} : { scale: 0.9 }}
      onClick={onToggle}
      aria-label={showPassword ? (isArabic ? 'إخفاء كلمة المرور' : 'Hide password') : (isArabic ? 'إظهار كلمة المرور' : 'Show password')}
      aria-pressed={showPassword}
      className="absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/60 hover:text-slate-600 dark:hover:text-white/60 transition-colors z-10"
      style={{ [togglePosition]: '16px' }}
      disabled={disabled}
     >
      <motion.div
       key={showPassword ? 'off' : 'on'}
       initial={{ rotate: -90, opacity: 0 }}
       animate={{ rotate: 0, opacity: 1 }}
       exit={{ rotate: 90, opacity: 0 }}
       transition={{ duration: 0.2 }}
      >
       {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </motion.div>
     </motion.button>
    )}
    {label && (
     <motion.label
      htmlFor={inputId}
      initial={false}
      animate={{
       y: focused || value ? -24 : 0,
       scale: focused || value ? 0.85 : 1,
       color: focused ? 'var(--color-accent, #2563eb)' : 'rgba(100,116,139,0.8)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`absolute top-1/2 -translate-y-1/2 origin-left text-sm pointer-events-none`}
      style={{ [iconPosition]: Icon ? '44px' : '16px' }}
     >
      {label}
     </motion.label>
    )}
   </div>
   <AnimatePresence>
    {error && (
     <motion.p
      id={errorId}
      role="alert"
      initial={{ opacity: 0, y: -5, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -5, height: 0 }}
      className="text-red-400 text-xs mt-1.5 ml-1"
     >
      {error}
     </motion.p>
    )}
   </AnimatePresence>
  </div>
 )
}

export default memo(SpatialInput)
