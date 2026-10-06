const TONES = {
  default: 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-600 dark:text-white/70',
  accent: 'bg-royal-500/10 dark:bg-cyan-500/10 border-royal-500/20 dark:border-cyan-500/20 text-accent',
  success: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/10 border-rose-500/25 text-rose-500',
}

export default function Badge({ children, tone = 'default', className = '' }) {
  const tones = TONES

 return (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${tones[tone] || tones.default} ${className}`}>
   {children}
  </span>
 )
}
