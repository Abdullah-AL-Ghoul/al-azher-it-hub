import { FiLoader } from 'react-icons/fi'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  spatial: 'btn-spatial',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white border border-rose-600/40 shadow-lg shadow-rose-500/25',
  ghost: 'text-navy-900 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-[15px] rounded-xl',
  icon: 'p-2 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading
  return (
    <button
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-500 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <FiLoader size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={16} aria-hidden="true" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={16} aria-hidden="true" />}
    </button>
  )
}
