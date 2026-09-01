import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { pageContainerSlow, pageItemSlow } from '../utils/motionTokens'
import { FiArrowDown, FiArrowUpRight, FiPlay } from 'react-icons/fi'
import Lazy3DScene from './three/Lazy3DScene'
import useParallax from '../hooks/useParallax'
import CountUp from './shared/CountUp'

export default function HeroSection({ ctaLink, ctaSecondaryLink, lecturesCount = 50, sourcesCount = 15, watchedCount = 200, materialsCount = 15 }) {
 const { lang, t } = useLanguage()
 const { theme } = useTheme()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 // The 3D layer drifts up as the user scrolls — depth cue, GPU-cheap.
 const { ref: parallaxRef, style: parallaxStyle } = useParallax({ distance: 70 })

  const stats = useMemo(() => ({
   lectures: lecturesCount,
   sources: sourcesCount,
   materials: materialsCount,
   watched: watchedCount,
  }), [lecturesCount, sourcesCount, watchedCount, materialsCount])

 const scrollToContent = () => {
  window.scrollTo({ top: window.innerHeight - 100, behavior: 'smooth' })
 }

 return (
  <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center overflow-hidden bg-spatial-page">
   {/* 3D star field (desktop WebGL) with CSS-orb fallback, parallax on scroll */}
   <motion.div ref={parallaxRef} style={parallaxStyle} className="absolute inset-0">
    <Lazy3DScene
    className="absolute inset-0"
    scene={() => import('./three/ParticlesScene')}
    sceneProps={{ theme: theme === 'light' ? 'light' : 'dark' }}
    fallbackLabel={isArabic ? 'حقل جسيمات متحرك' : 'Animated particle field'}
    fallback={
     <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute top-20 left-10 w-64 h-64 bg-royal-500/20 rounded-full blur-3xl animate-depth-breathe" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl animate-depth-breathe" style={{ animationDelay: '-2.5s' }} />
      <div className="absolute top-1/3 right-[25%] w-3 h-3 bg-cyan-400/40 rounded-full animate-float-slow" />
      <div className="absolute bottom-1/3 left-[33%] w-1.5 h-1.5 bg-violet-400/40 rounded-full animate-float-slow" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-2/3 right-[33%] w-2 h-2 bg-royal-500/40 rounded-full animate-float-slow" style={{ animationDelay: '-4s' }} />
      <div className="absolute bottom-[20%] right-[15%] w-2.5 h-2.5 bg-cyan-400/30 rounded-full animate-float-slow" style={{ animationDelay: '-5s' }} />
     </div>
    }
   />
   </motion.div>

   {/* Blueprint grid (static, cheap) */}
   <div className="spatial-grid" aria-hidden="true" />

   <motion.div variants={prefersReduced ? { hidden: {}, visible: {} } : pageContainerSlow} initial="hidden" animate="visible" className="relative z-10 text-center px-4 max-w-4xl mx-auto">
    <motion.div variants={pageItemSlow} className="inline-flex items-center gap-2 glass px-5 py-2 mb-8">
     <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
     <span className="text-slate-600 dark:text-white/80 text-sm font-medium">{t('home.hero.subtitle')}</span>
    </motion.div>

    <motion.h1 variants={pageItemSlow} className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
     <motion.span
      className="gradient-text-spatial animate-gradient-pan bg-[length:200%_auto] inline-block"
      initial={prefersReduced ? {} : { backgroundPosition: '0% 50%' }}
      animate={prefersReduced ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={prefersReduced ? {} : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
     >
      {t('home.hero.title')}
     </motion.span>
    </motion.h1>

    <motion.p variants={pageItemSlow} className="text-lg md:text-xl text-slate-500 dark:text-white/60 mb-8 max-w-2xl mx-auto">
      {t('home.hero.description')}
     </motion.p>

     <motion.div variants={pageItemSlow} className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
       <Link to={ctaLink || '/lectures'} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl btn-primary font-semibold text-[15px]">
        <FiPlay size={16} />
        {t('home.hero.cta')}
        <FiArrowUpRight size={14} className="opacity-60" />
       </Link>
       <Link to={ctaSecondaryLink || '/sources'} className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl btn-secondary font-semibold text-[15px]">
        {t('home.hero.ctaSecondary')}
       </Link>
     </motion.div>

     {/* Animated Counters */}
     <motion.div variants={pageItemSlow} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
      {[
       { value: stats.lectures, suffix: '+', labelAr: 'محاضرة', labelEn: 'Lectures', gradient: 'from-violet-500 to-cyan-500' },
       { value: stats.materials, suffix: '+', labelAr: 'مادة', labelEn: 'Materials', gradient: 'from-emerald-500 to-cyan-500' },
       { value: stats.sources, suffix: '+', labelAr: 'مصدر', labelEn: 'Sources', gradient: 'from-amber-500 to-orange-500' },
       { value: stats.watched, suffix: '', labelAr: 'مشاهدة', labelEn: 'Watched', gradient: 'from-rose-500 to-pink-500' },
      ].map((stat, i) => (
       <motion.div
        key={i}
        initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
        animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
        transition={prefersReduced ? {} : { duration: 0.5, delay: 0.6 + i * 0.08, ease: [0.16,1,0.3,1] }}
        whileHover={prefersReduced ? {} : { y: -4 }}
        className="text-center glass rounded-2xl px-3 py-5 cursor-default border border-white/10 hover:border-royal-500/20"
       >
        <div className={`text-3xl md:text-4xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1 tabular-nums`}>
         <CountUp end={stat.value} suffix={stat.suffix} />
        </div>
        <div className="text-xs text-slate-500 dark:text-white/50 font-medium tracking-wide">{lang === 'ar' ? stat.labelAr : stat.labelEn}</div>
       </motion.div>
      ))}
    </motion.div>
   </motion.div>

   {/* Interactive scroll arrow */}
    <motion.button
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ delay: 1.2 }}
     onClick={scrollToContent}
     className="absolute bottom-10 left-1/2 -translate-x-1/2 group cursor-pointer"
     aria-label={isArabic ? 'التمرير للأسفل' : 'Scroll down'}
    >
    <div className="relative">
     <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-full blur-xl group-hover:bg-royal-500/15 transition-colors duration-500 scale-150" />
     <div className="relative w-12 h-12 glass rounded-full flex items-center justify-center group-hover:bg-white/15 transition duration-500 group-hover:scale-110">
      <FiArrowDown className="text-slate-500 dark:text-white/50 group-hover:text-navy-900 dark:group-hover:text-white transition-colors animate-bounce" size={20} />
     </div>
    </div>
   </motion.button>
  </div>
 )
}
