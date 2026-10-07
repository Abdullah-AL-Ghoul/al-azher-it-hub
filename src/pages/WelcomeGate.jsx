import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { welcomeContainer, welcomeItem, springSoft } from '../utils/motionTokens'
import {
  FiLogIn, FiUserPlus, FiFileText, FiLayers, FiArrowUpRight, FiSun, FiMoon, FiMonitor,
  FiShield, FiStar, FiDatabase, FiCpu, FiGlobe, FiCloud, FiCode, FiBookOpen, FiCheck,
  FiChevronDown, FiVideo, FiClock, FiAward, FiUsers, FiHelpCircle, FiZap, FiCheckCircle,
  FiArrowRight, FiCompass, FiTerminal, FiPlay
} from 'react-icons/fi'
import SiteLogo from '../components/shared/SiteLogo'
import Reveal from '../components/shared/Reveal'
import CountUp from '../components/shared/CountUp'
import SectionHeading from '../components/shared/SectionHeading'
import Lazy3DScene from '../components/three/Lazy3DScene'
import useMagnetic from '../hooks/useMagnetic'

/* Primary CTA with a magnetic hover drift (desktop pointers only). */
function MagneticLink({ to, className, children }) {
  const { ref, ...magnetProps } = useMagnetic(6)
  return (
    <Link ref={ref} to={to} className={className} {...magnetProps}>
      {children}
    </Link>
  )
}

function FaqItem({ q, a, isArabic }) {
  const [open, setOpen] = useState(false)
  const prefersReduced = useReducedMotion()
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-royal-500/30 transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-start hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
        aria-expanded={open}
      >
        <span className="font-semibold text-ink text-sm sm:text-base flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-royal-500/10 dark:bg-cyan-500/10 flex items-center justify-center flex-shrink-0 text-royal-600 dark:text-cyan-400">
            <FiHelpCircle size={16} />
          </div>
          {q}
        </span>
        <motion.span
          animate={prefersReduced ? {} : { rotate: open ? 180 : 0 }}
          transition={prefersReduced ? {} : springSoft}
          className="flex-shrink-0 text-slate-400"
        >
          <FiChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={prefersReduced ? {} : { height: 0, opacity: 0 }}
            animate={prefersReduced ? {} : { height: 'auto', opacity: 1 }}
            exit={prefersReduced ? {} : { height: 0, opacity: 0 }}
            transition={prefersReduced ? {} : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 pt-1 text-sm text-slate-600 dark:text-white/70 leading-relaxed border-t border-slate-100 dark:border-white/5">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function WelcomeGate() {
  const { t, lang, toggleLang } = useLanguage()
  const { theme, toggle } = useTheme()
  const prefersReduced = useReducedMotion()
  const { user } = useAuth()
  const navigate = useNavigate()
  const containerVariants = prefersReduced ? { hidden: {}, visible: {} } : welcomeContainer
  const itemVariants = prefersReduced ? { hidden: {}, visible: {} } : welcomeItem
  const isArabic = lang === 'ar'

  // Freeze the infinite hero animations once they leave the viewport
  const heroClusterRef = useRef(null)
  const heroClusterInView = useInView(heroClusterRef, { margin: '80px' })
  const marqueeRef = useRef(null)
  const marqueeInView = useInView(marqueeRef, { margin: '80px' })

  useEffect(() => {
    if (user) navigate('/home', { replace: true })
  }, [user, navigate])

  if (user) return null

  const features = [
    {
      icon: FiVideo,
      labelAr: 'محاضرات فيديو مرتبة',
      labelEn: 'Organized Video Lectures',
      descAr: 'شروحات دكاترة القسم مصنفة فصلياً مع صور مصغرة ودقة عالية لكل مساق.',
      descEn: 'Faculty video lectures categorized by semester with crisp HD thumbnails.',
      grad: 'from-violet-500 to-indigo-600'
    },
    {
      icon: FiFileText,
      labelAr: 'ملخصات وامتحانات سابقة',
      labelEn: 'Summaries & Past Exams',
      descAr: 'ملفات PDF و DOCX جاهزة للتحميل الفوري ونماذج امتحانات نصفية ونهائية.',
      descEn: 'Instant PDF/DOCX downloads with midterms and finals archive.',
      grad: 'from-cyan-500 to-teal-600'
    },
    {
      icon: FiLayers,
      labelAr: 'مصادر ومراجع منظمة',
      labelEn: 'Curated Course Sources',
      descAr: 'كتب، سلايدات رسمية، وروابط إثرائية مجمعة بدقة تحت كل مادة.',
      descEn: 'Textbooks, official slides, and enrichment links organized per subject.',
      grad: 'from-amber-500 to-orange-600'
    },
    {
      icon: FiClock,
      labelAr: 'خطة شجرية تفاعلية',
      labelEn: 'Interactive Roadmap & Plan',
      descAr: 'شجرة متطلبات المواد لـ 4 سنوات لتسجيل فصلي خالٍ من التعارضات.',
      descEn: 'Prerequisite dependency tree across 4 academic years for smooth registration.',
      grad: 'from-emerald-500 to-teal-600'
    },
    {
      icon: FiAward,
      labelAr: 'تتبع التقدم ومعدل الإنجاز',
      labelEn: 'Progress & Streak Tracking',
      descAr: 'متابعة المحاضرات المشاهدة، الساعات المنجزة، وحساب استمرارية الدراسة اليومية.',
      descEn: 'Completed lectures tracker, watched percentage, and daily learning streaks.',
      grad: 'from-rose-500 to-pink-600'
    },
    {
      icon: FiUsers,
      labelAr: 'مساعد ذكي ومجتمع طلابي',
      labelEn: 'AI Assistant & Community',
      descAr: 'مساعد رقمي يجيب فوراً عن أسئلة المواد والمعدل والتواصل المباشر مع المشرفين.',
      descEn: 'Smart chatbot for instant course lookup, GPA advice, and student support.',
      grad: 'from-sky-500 to-blue-600'
    },
  ]

  const steps = [
    {
      num: '01',
      icon: FiUserPlus,
      titleAr: 'أنشئ حسابك الجامعي',
      titleEn: 'Create University Account',
      descAr: 'سجّل في ثوانٍ برقمك الجامعي وبريدك الإلكتروني لتفعيل ملفك الشخصي.',
      descEn: 'Sign up in seconds with your university ID to access your tailored dashboard.'
    },
    {
      num: '02',
      icon: FiVideo,
      titleAr: 'اختر مادتك وتابع شروحاتها',
      titleEn: 'Select Subject & Watch',
      descAr: 'تصفح المحاضرات بالترتيب المنطقي مع تحميل الملخصات وحفظ الملاحظات.',
      descEn: 'Watch video lectures in syllabus order while downloading slides & notes.'
    },
    {
      num: '03',
      icon: FiAward,
      titleAr: 'تتبع إنجازك وتفوق',
      titleEn: 'Track Milestones & Excel',
      descAr: 'احفظ موادك المفضلة، قيّم المحاضرات، واضمن أعلى الدرجات في امتحاناتك.',
      descEn: 'Keep track of favorites, rate lectures, and secure top grades in exams.'
    },
  ]

  const testimonials = [
    {
      name: 'أحمد محمود',
      role: 'سنة ثانية — هندسة برمجيات',
      textAr: 'المنصة وفّرت عليّ ساعات من التشتت بين روابط اليوتيوب والجروبات. كل محاضرة تجد تحتها سلايداتها وتلخيصها فوراً.',
      textEn: 'Saved me countless hours searching through scattered links. Every lecture has its slides and notes right underneath.'
    },
    {
      name: 'سارة خالد',
      role: 'سنة ثالثة — ذكاء اصطناعي',
      textAr: 'خاصية تتبع التقدم والـ Streaks خلتني ملتزمة يومياً قبل الامتحانات النصفية، ومحتوى المواد منظم بشكل أكاديمي ممتاز.',
      textEn: 'Progress tracking and learning streaks kept me consistent through midterms. The academic organization is top tier.'
    },
    {
      name: 'محمد عوض',
      role: 'سنة أولى — علوم حاسوب',
      textAr: 'كمبتدئ في الكلية، الشجرة الدراسية والمساعد الذكي في الموقع ساعدوني أعرف كيف أدرس كل مادة وما هي متطلباتها.',
      textEn: 'As a freshman, the degree roadmap and chatbot guided me on course requirements and studying best practices.'
    },
  ]

  const faqs = [
    { q: t('inline.welcome-gate.how-do-i-sign'), a: t('inline.welcome-gate.click-create-account-enter') },
    { q: t('inline.welcome-gate.is-the-platform-free'), a: t('inline.welcome-gate.yes-it-is-completely') },
    { q: t('inline.welcome-gate.how-do-i-find'), a: t('inline.welcome-gate.open-any-lecture-and') },
    { q: t('inline.welcome-gate.can-i-track-my'), a: t('inline.welcome-gate.yes-on-the-home') },
  ]

  const heroStats = [
    { end: 60, suffix: '+', labelAr: 'محاضرة مسجلة', labelEn: 'HD Lectures' },
    { end: 300, suffix: '+', labelAr: 'مصدر وملخص', labelEn: 'Study Sources' },
    { end: 4, suffix: ' سنين', labelAr: 'سنوات دراسية', labelEn: 'Academic Years' },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-spatial-full selection:bg-royal-500/20 selection:text-royal-600">
      {/* Background depth & ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 spatial-grid opacity-[0.25]" />
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-royal-500/[0.10] rounded-full blur-[64px]" />
        <div className="absolute top-[25%] -right-24 w-[600px] h-[600px] bg-cyan-400/[0.08] rounded-full blur-[64px]" />
        <div className="absolute bottom-0 left-[25%] w-[700px] h-[400px] bg-violet-500/[0.07] rounded-full blur-[72px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 container-page">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <SiteLogo size="sm" />
            <span className="font-extrabold text-ink tracking-tight text-base sm:text-lg">
              AL-Azher <span className="text-royal-600 dark:text-cyan-400">IT Hub</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 ms-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('inline.welcome-gate.live')}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleLang}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md text-slate-700 dark:text-white/80 hover:text-ink hover:border-royal-500/40 transition shadow-sm"
              aria-label={t('inline.welcome-gate.switch-language-عربي')}
            >
              {t('inline.welcome-gate.عربي')}
            </button>
            <button
              onClick={toggle}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md text-slate-700 dark:text-white/80 hover:text-ink hover:border-royal-500/40 transition shadow-sm"
              aria-label={t('inline.welcome-gate.toggle-theme')}
            >
              {theme === 'light' ? <FiMoon size={16} /> : theme === 'dark' ? <FiMonitor size={16} /> : <FiSun size={16} />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl btn-primary text-xs font-semibold shadow-md shadow-royal-500/20"
            >
              <FiLogIn size={14} className={isArabic ? 'rotate-180' : ''} />
              {t('inline.welcome-gate.sign-in')}
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 container-page">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-14 items-center pt-6 lg:pt-12 pb-12 lg:min-h-[calc(100vh-140px)]">
          {/* Left Hero Content */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center lg:text-start">
            {/* Top Quality Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-medium text-slate-700 dark:text-white/80 mb-6 border border-slate-200/80 dark:border-white/10 shadow-sm">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-royal-600 text-white shadow-sm">
                <FiShield size={12} />
              </span>
              <span>{t('inline.welcome-gate.trusted-platform-for-it')}</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold ms-1">
                <FiStar size={12} className="fill-amber-500 text-amber-600 dark:text-amber-300" /> 4.9/5
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold tracking-tight leading-[1.05] text-ink">
              {t('inline.welcome-gate.learn-smarter')}
              <br />
              <span className="gradient-text-spatial">
                {t('inline.welcome-gate.excel-in-your-courses')}
              </span>
            </motion.h1>

            {/* Sub-paragraph */}
            <motion.p variants={itemVariants} className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-white/70 max-w-xl mx-auto lg:mx-0">
              {t('inline.welcome-gate.organized-video-lectures-concise')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
              <MagneticLink
                to="/signup"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-primary font-bold text-base min-h-[50px] shadow-lg shadow-royal-600/25 hover:shadow-royal-600/35 transition-all"
              >
                <FiUserPlus size={18} className={isArabic ? 'rotate-180' : ''} />
                <span>{t('inline.welcome-gate.create-your-free-account')}</span>
                <FiArrowUpRight size={17} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </MagneticLink>

              <MagneticLink
                to="/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-secondary font-bold text-base min-h-[50px] border border-slate-300/80 dark:border-white/10"
              >
                <FiLogIn size={18} className={isArabic ? 'rotate-180' : ''} />
                <span>{t('inline.welcome-gate.sign-in-2')}</span>
              </MagneticLink>
            </motion.div>

            {/* Social Trust row */}
            <motion.div variants={itemVariants} className="mt-7 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start text-xs text-slate-500 dark:text-white/60">
              <div className="flex -space-x-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-navy-900 bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-7 h-7 rounded-full border-2 border-white dark:border-navy-900 bg-slate-900 dark:bg-white text-white dark:text-navy-900 flex items-center justify-center text-[10px] font-bold shadow-sm">
                  +500
                </div>
              </div>
              <span className="font-medium">{t('inline.welcome-gate.trusted-by-4-cohorts')}</span>
            </motion.div>

            {/* Quick Hero Statistics Grid */}
            <motion.div variants={itemVariants} className="mt-8 grid grid-cols-3 gap-3.5 max-w-md mx-auto lg:mx-0">
              {heroStats.map(s => (
                <div key={s.labelEn} className="glass rounded-2xl p-3.5 text-center border border-white/10 shadow-sm hover:border-royal-500/30 transition-colors">
                  <div className="text-xl sm:text-2xl font-extrabold gradient-text-spatial">
                    <CountUp end={s.end} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/60 font-medium mt-0.5">
                    {isArabic ? s.labelAr : s.labelEn}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — 3D Knowledge Scene with Float Cards */}
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 24, scale: 0.98 }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div ref={heroClusterRef} className="relative w-full max-w-[500px] aspect-square">
              <div className="absolute -inset-6 bg-gradient-to-br from-royal-500/20 via-cyan-400/15 to-violet-500/15 rounded-[36px] blur-3xl opacity-80" />
              
              <div className="relative glass-panel gradient-border rounded-[28px] shadow-2xl overflow-hidden w-full h-full border border-white/20">
                <div className="absolute inset-0 spatial-grid opacity-[0.15] pointer-events-none" />
                <Lazy3DScene
                  className="absolute inset-0"
                  scene={() => import('../components/three/KnowledgeScene')}
                  fallbackLabel={t('inline.welcome-gate.3d-knowledge-cluster-scene')}
                  fallback={
                    <div className="absolute inset-0">
                      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-44 h-44 rounded-full bg-gradient-to-br from-royal-500/40 to-cyan-400/30 blur-md animate-depth-breathe" />
                      <div className="absolute top-[20%] left-[18%] w-12 h-12 rounded-full border-2 border-cyan-400/50 animate-float-slow" />
                      <div className="absolute top-[55%] right-[15%] w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/40 to-royal-500/30 rotate-12 animate-float-slow" style={{ animationDelay: '-2s' }} />
                      <div className="absolute top-[18%] right-[22%] w-7 h-7 rounded-lg bg-cyan-400/40 rotate-6 animate-float-slow" style={{ animationDelay: '-4s' }} />
                    </div>
                  }
                />
              </div>

              {/* Floating Badge 1 - Top Right */}
              <motion.div
                animate={prefersReduced || !heroClusterInView ? {} : { y: [0, -7, 0] }}
                transition={prefersReduced ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-3 -right-2 md:-right-4 glass rounded-2xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xl border border-white/20 backdrop-blur-xl"
              >
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <FiFileText size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold text-ink leading-none">{t('inline.welcome-gate.new-summary')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1">{t('inline.welcome-gate.added-today')}</div>
                </div>
              </motion.div>

              {/* Floating Badge 2 - Bottom Left */}
              <motion.div
                animate={prefersReduced || !heroClusterInView ? {} : { y: [0, 8, 0] }}
                transition={prefersReduced ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute -bottom-4 -left-2 md:-left-6 glass rounded-2xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xl border border-white/20 backdrop-blur-xl"
              >
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
                  <FiCheckCircle size={16} />
                </span>
                <div>
                  <div className="text-xs font-bold text-ink leading-none">{t('inline.welcome-gate.progress-tracked')}</div>
                  <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1">{t('inline.welcome-gate.your-progress-tracked')}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="relative z-10 py-16 container-page">
        <SectionHeading
          eyebrow={t('inline.welcome-gate.why-us')}
          title={t('inline.welcome-gate.everything-an-it-student')}
          subtitle={t('inline.welcome-gate.features-designed-to-simplify')}
        />
        <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.labelEn}
                className="group spotlight-card lift glass rounded-2xl p-6 sm:p-7 border border-white/10 hover:border-royal-500/40 transition-all duration-300"
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`)
                  e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`)
                }}
              >
                <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${f.grad} flex items-center justify-center text-white shadow-lg mb-5 group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-ink text-base sm:text-lg mb-2">{isArabic ? f.labelAr : f.labelEn}</h3>
                <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">{isArabic ? f.descAr : f.descEn}</p>
              </div>
            )
          })}
        </Reveal>
      </section>

      {/* ===== HOW IT WORKS (3 SIMPLE STEPS) ===== */}
      <section className="relative z-10 py-16 container-page">
        <SectionHeading
          eyebrow={t('inline.welcome-gate.how-it-works')}
          title={t('inline.welcome-gate.start-in-3-simple')}
          subtitle={t('inline.welcome-gate.from-signup-to-success')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <Reveal key={s.num} delay={i * 0.1} className="relative">
                <div className="glass rounded-2xl p-7 text-center h-full border border-white/10 hover:border-royal-500/30 transition-all">
                  <div className="text-4xl font-extrabold gradient-text-spatial opacity-25 mb-3">{s.num}</div>
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${
                    i === 0 ? 'from-royal-500 to-cyan-500' : i === 1 ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500'
                  } flex items-center justify-center text-white shadow-lg`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-ink text-base mb-2">{isArabic ? s.titleAr : s.titleEn}</h3>
                  <p className="text-sm text-slate-600 dark:text-white/65 leading-relaxed">{isArabic ? s.descAr : s.descEn}</p>
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal className="text-center mt-10">
          <MagneticLink
            to="/signup"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl btn-primary font-bold text-[15px] min-h-[48px] shadow-lg shadow-royal-600/20"
          >
            <FiUserPlus size={18} className={isArabic ? 'rotate-180' : ''} />
            <span>{t('inline.welcome-gate.get-started-free')}</span>
          </MagneticLink>
        </Reveal>
      </section>

      {/* ===== STUDENT TESTIMONIALS ===== */}
      <section className="relative z-10 py-16 container-page">
        <SectionHeading
          eyebrow={t('inline.welcome-gate.student-voices')}
          title={t('inline.welcome-gate.what-our-students-say')}
          subtitle={t('inline.welcome-gate.real-experiences-from-students')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((tm, i) => (
            <Reveal
              key={tm.name}
              delay={i * 0.08}
              className="glass rounded-2xl p-7 border border-white/10 hover:border-royal-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FiStar key={star} size={14} className="fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-slate-700 dark:text-white/80 leading-relaxed mb-6 italic">
                  &ldquo;{isArabic ? tm.textAr : tm.textEn}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {tm.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">{tm.name}</p>
                  <p className="text-xs text-slate-500 dark:text-white/50">{tm.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FREQUENTLY ASKED QUESTIONS ===== */}
      <section className="relative z-10 py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t('inline.welcome-gate.faq')}
          title={t('inline.welcome-gate.have-a-question')}
          subtitle={t('inline.welcome-gate.answers-to-the-most')}
        />
        <div className="space-y-3.5">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} isArabic={isArabic} />
          ))}
        </div>
      </section>

      {/* ===== FINAL CALL TO ACTION ===== */}
      <Reveal className="relative z-10 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden glass rounded-3xl border border-white/15 p-10 md:p-14 text-center shadow-2xl">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-royal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="relative text-3xl md:text-5xl font-extrabold gradient-text-spatial mb-4 leading-tight">
            {t('inline.welcome-gate.ready-to-start')}
          </h2>
          <p className="relative text-slate-600 dark:text-white/70 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {t('inline.welcome-gate.join-your-classmates-and')}
          </p>

          <div className="relative flex flex-col sm:flex-row gap-3.5 justify-center">
            <MagneticLink
              to="/signup"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-primary font-bold text-base min-h-[50px] shadow-lg shadow-royal-600/30"
            >
              <FiUserPlus size={18} className={isArabic ? 'rotate-180' : ''} />
              <span>{t('inline.welcome-gate.create-your-free-account')}</span>
            </MagneticLink>

            <MagneticLink
              to="/login"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-secondary font-bold text-base min-h-[50px]"
            >
              <FiLogIn size={18} className={isArabic ? 'rotate-180' : ''} />
              <span>{t('inline.welcome-gate.sign-in-2')}</span>
            </MagneticLink>
          </div>
        </div>
      </Reveal>

      {/* ===== SUBJECTS TICKER MARQUEE ===== */}
      <div className="relative z-10 py-6 border-t border-black/5 dark:border-white/5 overflow-hidden">
        <div
          ref={marqueeRef}
          className="marquee-track items-center"
          style={{ ['--marquee-duration']: '38s', animationPlayState: marqueeInView ? 'running' : 'paused' }}
        >
          {[...Array(2)].map((_, rep) => (
            <div key={rep} className="flex gap-4 items-center shrink-0" aria-hidden={rep === 1}>
              {[
                { icon: FiDatabase, ar: 'قواعد البيانات', en: 'Databases' },
                { icon: FiCpu, ar: 'برمجة وتطوير', en: 'Programming' },
                { icon: FiGlobe, ar: 'شبكات الحاسوب', en: 'Computer Networks' },
                { icon: FiCloud, ar: 'الحوسبة السحابية', en: 'Cloud Computing' },
                { icon: FiCode, ar: 'تطوير الويب الحديث', en: 'Modern Web Dev' },
                { icon: FiBookOpen, ar: 'هياكل البيانات', en: 'Data Structures' },
                { icon: FiShield, ar: 'الأمن السيبراني', en: 'Cyber Security' },
                { icon: FiFileText, ar: 'تحليل وتصميم النظم', en: 'Systems Analysis' },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <span key={s.en} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-slate-600 dark:text-white/60 font-medium border border-white/10">
                    <Icon size={14} className="text-royal-500 dark:text-cyan-400" />
                    <span>{isArabic ? s.ar : s.en}</span>
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 text-center py-6 text-slate-500 dark:text-white/40 text-xs border-t border-black/5 dark:border-white/5">
        AL-Azher IT Hub © {new Date().getFullYear()} · {t('inline.welcome-gate.built-for-al-azhar-students')}
      </footer>
    </div>
  )
}