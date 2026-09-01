import { memo } from 'react'

/**
 * Shared animated page header. Gives every page its own identity via
 * floating gradient motifs (page-hero CSS) instead of the plain
 * "gradient text on empty background" repeated across pages.
 *
 * `variant` controls the motif pattern: play | file | path | chips.
 */
const MOTIFS = {
  play: [
    'top-[16%] left-[10%] w-12 h-12',
    'm2 top-[62%] left-[20%] w-8 h-8',
    'm3 top-[24%] right-[12%] w-10 h-10',
    'm2 top-[58%] right-[24%] w-6 h-6',
  ],
  file: [
    'top-[20%] left-[14%] w-10 h-12 !rounded-xl',
    'm2 top-[58%] left-[24%] w-8 h-8',
    'm3 top-[22%] right-[16%] w-8 h-11 !rounded-xl',
    'm2 top-[60%] right-[26%] w-6 h-6',
  ],
  path: [
    'top-[18%] left-[12%] w-10 h-10',
    'm2 top-[54%] left-[26%] w-6 h-6',
    'm3 top-[26%] right-[14%] w-8 h-8',
    'm2 top-[62%] right-[20%] w-10 h-10',
  ],
  chips: [
    'top-[22%] left-[16%] w-12 h-6 !rounded-full',
    'm2 top-[60%] left-[22%] w-8 h-5 !rounded-full',
    'm3 top-[24%] right-[18%] w-9 h-5 !rounded-full',
    'm2 top-[56%] right-[14%] w-6 h-4 !rounded-full',
  ],
}

function PageHero({ variant = 'play', title, subtitle, children }) {
  const motifs = MOTIFS[variant] || MOTIFS.play
  return (
    <div className="py-16 mb-10 page-hero">
      <div className="absolute inset-0" aria-hidden="true">
        {motifs.map((cls, i) => (
          <div key={i} className={`floating-motif ${cls}`} />
        ))}
      </div>
      <div className="container-page text-center relative">
        <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-white/50 text-lg">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export default memo(PageHero)
