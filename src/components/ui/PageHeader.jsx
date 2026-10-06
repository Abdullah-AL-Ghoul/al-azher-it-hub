
export default function PageHeader({ eyebrow, title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <span className="eyebrow mb-2">{eyebrow}</span>}
        <h1 className="text-3xl md:text-4xl font-bold gradient-text-spatial">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-slate-500 dark:text-white/60 text-base max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
