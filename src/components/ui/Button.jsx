import { FiLoader } from 'react-icons/fi'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  spatial: 'btn-spatial',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white border border-rose-600/40 shadow-lg shadow-rose-500/25',
  ghost: 'text-navy-900 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[32px]',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
  lg: 'px-6 py-3 text-[15px] rounded-xl min-h-[48px]',
  icon: 'p-2.5 rounded-xl min-w-[44px] min-h-[44px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: legacyIcon,
  iconPosition = 'start',
  iconStart,
  iconEnd,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading

  // Resolve logical start/end icon components with backward compatibility
  const StartIcon = iconStart || ((iconPosition === 'start' || iconPosition === 'left') ? legacyIcon : null)
  const EndIcon = iconEnd || ((iconPosition === 'end' || iconPosition === 'right') ? legacyIcon : null)

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading ? (
        <FiLoader size={16} className="animate-spin flex-shrink-0" aria-hidden="true" />
      ) : (
        StartIcon && <StartIcon size={16} className="flex-shrink-0" aria-hidden="true" />
      )}
      {children}
      {!loading && EndIcon && <EndIcon size={16} className="flex-shrink-0" aria-hidden="true" />}
    </button>
  )
}

