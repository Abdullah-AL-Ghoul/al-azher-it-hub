import { motion, useReducedMotion } from 'framer-motion'
import { FiArrowLeft, FiArrowRight, FiSun, FiMoon, FiGlobe } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import AuthBrandPanel from './AuthBrandPanel'

export default function AuthLayout({ children, isArabic, onBack, showBrand = true }) {
  const { lang, toggleLang, t } = useLanguage()
  const { dark, toggle: toggleTheme } = useTheme()
  const prefersReduced = useReducedMotion()

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-spatial-full px-4 py-6 md:py-10">
      {/* Background ambient mesh */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 spatial-grid opacity-[0.22] dark:opacity-[0.28]" />
        <div className="absolute -top-32 -start-32 w-96 h-96 bg-royal-500/[0.08] dark:bg-royal-500/[0.12] rounded-full blur-[64px] animate-orb-float-1" />
        <div className="absolute -bottom-32 -end-32 w-[520px] h-[520px] bg-cyan-400/[0.07] dark:bg-cyan-400/[0.10] rounded-full blur-[72px] animate-orb-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[400px] bg-indigo-500/[0.04] dark:bg-violet-500/[0.06] rounded-full blur-[80px] animate-orb-float-3" />
      </div>

      {/* Top Utility Bar: Back Button, Language Switcher, Theme Switcher */}
      <header className="relative z-20 w-full max-w-6xl mx-auto flex items-center justify-between mb-4 md:mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium text-slate-600 dark:text-white/70 hover:text-royal-600 dark:hover:text-cyan-300 bg-white/60 dark:bg-white/[0.06] hover:bg-white/90 dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 backdrop-blur-md transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-royal-400/50"
          aria-label={t('inline.auth-layout.back') || 'الرجوع للرئيسية'}
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">
            {isArabic ? <FiArrowRight size={15} /> : <FiArrowLeft size={15} />}
          </span>
          <span>{t('inline.auth-layout.back') || 'الرئيسية'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white/80 bg-white/60 dark:bg-white/[0.06] hover:bg-white/90 dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 backdrop-blur-md transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            title={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
            aria-label={lang === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
          >
            <FiGlobe size={14} className="text-royal-500 dark:text-cyan-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-700 dark:text-white/80 bg-white/60 dark:bg-white/[0.06] hover:bg-white/90 dark:hover:bg-white/[0.12] border border-slate-200/80 dark:border-white/10 backdrop-blur-md transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-royal-400/50"
            title={dark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
            aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {dark ? (
              <FiSun size={15} className="text-amber-400" />
            ) : (
              <FiMoon size={15} className="text-royal-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto flex items-center justify-center">
        <div className={`w-full ${showBrand ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch' : 'max-w-md mx-auto'}`}>
          {/* Brand Showcase Panel (Visible on Desktop) */}
          {showBrand && (
            <div className="hidden lg:block lg:col-span-5 xl:col-span-5 h-full">
              <AuthBrandPanel isArabic={isArabic} />
            </div>
          )}

          {/* Authentication Form Card */}
          <div className={`w-full ${showBrand ? 'lg:col-span-7 xl:col-span-7 flex flex-col justify-center' : ''}`}>
            <motion.div
              initial={prefersReduced ? {} : { opacity: 0, y: 22, scale: 0.98 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
              transition={prefersReduced ? {} : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl mx-auto"
            >
              {/* Card outline glow */}
              <div
                className="absolute -inset-[1px] rounded-[30px] opacity-40 blur-[0.5px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.55) 0%, rgba(37,99,235,0.45) 50%, rgba(168,85,247,0.35) 100%)',
                }}
              />
              <div className="absolute -inset-4 bg-gradient-to-br from-royal-500/10 via-transparent to-cyan-400/10 rounded-[34px] blur-xl pointer-events-none" />

              {/* Glass container */}
              <div className="relative glass rounded-[28px] p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.06)_inset] overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0 rounded-[28px]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.45), transparent 20%)',
                    opacity: 0.4,
                  }}
                />
                <div className="relative">{children}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 w-full text-center mt-6 text-slate-400 dark:text-white/40 text-xs">
        <p>Al-Azher IT Hub © {new Date().getFullYear()} • جامعة الأزهر — غزة</p>
      </footer>
    </div>
  )
}
