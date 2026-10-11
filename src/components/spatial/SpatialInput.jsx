import { memo, useState, useRef, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

function SpatialInput({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  value,
  onChange,
  placeholder,
  disabled,
  isArabic,
  showToggle,
  onToggle,
  showPassword,
  autoComplete,
  id: idProp,
  ...props
}) {
  const { t } = useLanguage()
  const prefersReduced = useReducedMotion()
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const generatedId = useId()
  const inputId = idProp || generatedId
  const errorId = `${inputId}-error`

  const padLeft = isArabic
    ? (showToggle ? '44px' : '16px')
    : (Icon ? '44px' : '16px')
  const padRight = isArabic
    ? (Icon ? '44px' : '16px')
    : (showToggle ? '44px' : '16px')

  const iconStyle = isArabic ? { right: '14px' } : { left: '14px' }
  const toggleStyle = isArabic ? { left: '14px' } : { right: '14px' }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className={`absolute top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none z-10 ${
              focused ? 'text-royal-500 dark:text-cyan-400' : 'text-slate-400 dark:text-white/40'
            }`}
            style={iconStyle}
            aria-hidden="true"
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
          className="input-spatial w-full min-h-[46px] py-3.5 rounded-xl text-sm text-ink placeholder:text-slate-400 dark:placeholder:text-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:ring-2 focus:ring-royal-400/50 dark:focus:ring-cyan-400/50 focus:outline-none"
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
            whileTap={prefersReduced ? {} : { scale: 0.92 }}
            onClick={onToggle}
            aria-label={showPassword ? t('inline.spatial-input.hide-password') : t('inline.spatial-input.show-password')}
            aria-pressed={showPassword}
            className="absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 hover:text-royal-600 dark:hover:text-cyan-300 transition-colors z-10 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            style={toggleStyle}
            disabled={disabled}
          >
            <motion.div
              key={showPassword ? 'off' : 'on'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
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
            className="absolute top-1/2 -translate-y-1/2 origin-left text-sm pointer-events-none"
            style={isArabic ? { right: Icon ? '44px' : '16px' } : { left: Icon ? '44px' : '16px' }}
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
            className="text-red-500 dark:text-red-400 text-xs mt-1.5 ms-1 font-medium"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default memo(SpatialInput)
