import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import SiteLogo from '../shared/SiteLogo'

function AuthLogo({ title, subtitle, showMobileLogo = true }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={prefersReduced ? {} : { opacity: 0, scale: 0.96, y: -10 }}
      animate={prefersReduced ? {} : { opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-6 relative z-10"
    >
      {showMobileLogo && (
        <div className="mx-auto mb-3.5 lg:hidden flex justify-center">
          <SiteLogo size="md" />
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-extrabold text-ink mb-1.5 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-500 dark:text-white/60 text-xs md:text-sm max-w-sm mx-auto font-normal">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

export default memo(AuthLogo)
