import { motion, useReducedMotion } from 'framer-motion'

const gradByIcon = {
  blue: 'from-blue-500 to-blue-600',
  amber: 'from-amber-500 to-amber-600',
  violet: 'from-violet-500 to-violet-600',
  emerald: 'from-emerald-500 to-emerald-600',
  rose: 'from-rose-500 to-rose-600',
  cyan: 'from-cyan-500 to-cyan-600',
}

export default function EmptyState({
  icon: Icon,
  color = 'blue',
  title,
  description,
  action,
  className = '',
}) {
    const prefersReduced = useReducedMotion()
  const grad = gradByIcon[color] || gradByIcon.blue

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-8 text-center border border-white/10 ${className}`}
      role="status"
    >
      <div
        className={`w-14 h-14 bg-gradient-to-br ${grad} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
      >
        {Icon && <Icon size={26} className="text-white" />}
      </div>
      {title && (
        <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-slate-500 dark:text-white/50 mb-5 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </motion.div>
  )
}
