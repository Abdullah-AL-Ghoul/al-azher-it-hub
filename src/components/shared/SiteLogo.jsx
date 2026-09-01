import { memo } from 'react'
import { useLanguage } from '../../context/LanguageContext'

const sizes = {
 sm: { box: 'w-9 h-9', svg: 22, radius: 'rounded-lg', shadow: 'shadow-lg shadow-royal-500/20 dark:shadow-royal-500/30' },
 md: { box: 'w-20 h-20', svg: 48, radius: 'rounded-2xl', shadow: 'shadow-xl shadow-royal-500/20' },
 lg: { box: 'w-24 h-24', svg: 58, radius: 'rounded-3xl', shadow: 'shadow-2xl shadow-royal-500/30' },
}

/**
 * Brand mark: a graduation cap over an open knowledge network — drawn with
 * animated strokes on first paint (logo-draw CSS class). Replaces the old
 * FiUser placeholder; used across Navbar, Footer, auth screens and splash.
 */
function LogoMark({ size }) {
 return (
  <svg
   viewBox="0 0 48 48"
   width={size}
   height={size}
   fill="none"
   aria-hidden="true"
   className="logo-draw"
  >
   {/* Graduation cap (mortarboard) */}
   <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 10 L40 17 L24 24 L8 17 Z" fill="rgba(255,255,255,0.14)" />
    <path d="M15 20.5 V29 C15 31.5 19 34 24 34 C29 34 33 31.5 33 29 V20.5" />
    <path d="M40 17 V26" />
    <circle cx="40" cy="28" r="1.6" fill="currentColor" stroke="none" />
   </g>
   {/* Knowledge network node beneath */}
   <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
    <circle cx="24" cy="40.5" r="1.4" fill="currentColor" stroke="none" />
    <path d="M17 37.5 C19 39 22 40 24 40.5" />
    <path d="M31 37.5 C29 39 26 40 24 40.5" />
   </g>
  </svg>
 )
}

function SiteLogo({ size = 'sm', showText = false, className = '' }) {
 const { t } = useLanguage()
 const s = sizes[size] || sizes.sm

 return (
  <div className={`flex items-center gap-2 ${className}`}>
   <div className={`${s.box} bg-gradient-to-br from-royal-500 to-cyan-400 ${s.radius} flex items-center justify-center text-white shrink-0 ${s.shadow}`}>
    <LogoMark size={s.svg} />
   </div>
   {showText && (
    <span className="font-bold text-lg text-ink">
     {t('site.title')}
    </span>
   )}
  </div>
 )
}

export default memo(SiteLogo)
