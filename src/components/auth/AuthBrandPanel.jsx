import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiBookOpen, FiFileText, FiCalendar, FiCheckCircle } from 'react-icons/fi'
import SiteLogo from '../shared/SiteLogo'

function AuthBrandPanel({ isArabic }) {
  const prefersReduced = useReducedMotion()

  const pillars = [
    {
      icon: FiBookOpen,
      titleAr: 'خطط دراسية ذكية وتتبع التخرج',
      titleEn: 'Interactive Curriculum & Degree Audit',
      descAr: 'تتبع إنجاز الساعات المعتمدة ومحاكي المعدل التراكمي الشامل.',
      descEn: 'Track degree progress, completed credits, and simulated GPA.',
      accent: 'from-blue-500 to-indigo-600',
    },
    {
      icon: FiFileText,
      titleAr: 'مستودع الامتحانات والمصادر المعتمدة',
      titleEn: 'Curated Sources & Solved Exams',
      descAr: 'نماذج اختبارات نصفية ونهائية معتمدة ومصنفة لكل مستوى دراسي.',
      descEn: 'Midterm and final past exams classified by academic level.',
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      icon: FiCalendar,
      titleAr: 'الجدول الأسبوعي والتقويم التفاعلي',
      titleEn: 'Interactive Timetable & Calendar Sync',
      descAr: 'تنظيم جدولك الأسبوعي وتصديره مباشرة لهاتفك بصيغة iCal.',
      descEn: 'Organize your weekly lectures and sync directly via iCalendar.',
      accent: 'from-cyan-500 to-blue-600',
    },
  ]

  return (
    <div className="hidden lg:flex flex-col justify-between p-8 xl:p-10 rounded-[32px] relative overflow-hidden h-full min-h-[580px] border border-slate-200/60 dark:border-white/10 bg-gradient-to-br from-slate-900/90 via-navy-900/95 to-slate-950/90 text-white shadow-2xl">
      {/* Ambient background lighting */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -start-24 w-72 h-72 bg-royal-500/20 rounded-full blur-[64px]" />
        <div className="absolute -bottom-24 -end-24 w-80 h-80 bg-cyan-400/20 rounded-full blur-[72px]" />
        <div className="absolute inset-0 spatial-grid opacity-[0.18]" />
      </div>

      {/* Header section */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <SiteLogo size="md" />
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-royal-500/20 text-cyan-300 border border-royal-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {isArabic ? 'جامعة الأزهر — غزة' : 'Al-Azhar University — Gaza'}
            </span>
            <p className="text-xs text-white/60 mt-1 font-medium">
              {isArabic ? 'كلية تكنولوجيا المعلومات' : 'Faculty of Information Technology'}
            </p>
          </div>
        </div>

        <motion.h2
          initial={prefersReduced ? {} : { opacity: 0, y: 14 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight mb-3"
        >
          {isArabic ? (
            <>
              بوابتك الأكاديمية الأولى <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-royal-300 to-indigo-300">
                للتميز البرمجي والتقني
              </span>
            </>
          ) : (
            <>
              Your Academic Gateway to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-royal-300 to-indigo-300">
                Software & Computing Excellence
              </span>
            </>
          )}
        </motion.h2>

        <p className="text-sm text-slate-300/80 leading-relaxed max-w-md">
          {isArabic
            ? 'البيئة التعليمية الرقمية المتكاملة لمتابعة مسارك الجامعي، دراسة المقررات، والوصول لأفضل المصادر الأكاديمية.'
            : 'The unified digital learning ecosystem to track your degree, master coursework, and access verified university resources.'}
        </p>
      </div>

      {/* Core Platform Pillars */}
      <div className="relative z-10 space-y-3.5 my-8">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon
          return (
            <motion.div
              key={idx}
              initial={prefersReduced ? {} : { opacity: 0, x: isArabic ? 16 : -16 }}
              animate={prefersReduced ? {} : { opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.2 + idx * 0.1 }}
              className="group flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-400/30 transition-all duration-300"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pillar.accent} flex items-center justify-center shrink-0 shadow-md shadow-black/20`}
              >
                <Icon size={18} className="text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {isArabic ? pillar.titleAr : pillar.titleEn}
                </h3>
                <p className="text-xs text-slate-300/70 mt-0.5 leading-normal">
                  {isArabic ? pillar.descAr : pillar.descEn}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Academic Term Footer Badge */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FiCheckCircle size={15} className="text-emerald-400" aria-hidden="true" />
          <span>{isArabic ? 'منصة تعليمية معتمدة' : 'Official Educational Hub'}</span>
        </div>
        <span className="font-mono text-[11px] text-cyan-400/90 font-medium">
          2025/2026
        </span>
      </div>
    </div>
  )
}

export default memo(AuthBrandPanel)
