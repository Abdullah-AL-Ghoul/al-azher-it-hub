import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { welcomeContainer, welcomeItem, springSoft } from '../utils/motionTokens'
import { FiLogIn, FiUserPlus, FiFileText, FiLayers, FiArrowUpRight, FiSun, FiMoon, FiMonitor, FiShield, FiStar, FiDatabase, FiCpu, FiGlobe, FiCloud, FiCode, FiBookOpen, FiCheck, FiChevronDown, FiVideo, FiClock, FiAward, FiUsers, FiHelpCircle } from 'react-icons/fi'
import SiteLogo from '../components/shared/SiteLogo'
import Reveal from '../components/shared/Reveal'
import CountUp from '../components/shared/CountUp'
import SectionHeading from '../components/shared/SectionHeading'
import Lazy3DScene from '../components/three/Lazy3DScene'

function FaqItem({ q, a }) {
 const [open, setOpen] = useState(false)
 const prefersReduced = useReducedMotion()
 return (
  <div className="glass rounded-xl overflow-hidden border border-white/10 hover:border-royal-500/30 transition-colors">
   <button
    onClick={() => setOpen(!open)}
    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
    aria-expanded={open}
   >
    <span className="font-semibold text-ink text-sm flex items-center gap-2.5">
     <FiHelpCircle size={16} className="text-accent flex-shrink-0" />
     {q}
    </span>
    <motion.span animate={prefersReduced ? {} : { rotate: open ? 180 : 0 }} transition={prefersReduced ? {} : springSoft} className="flex-shrink-0">
     <FiChevronDown size={16} className="text-slate-400" />
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
      <p className="px-5 pb-4 text-sm text-slate-500 dark:text-white/60 leading-relaxed">{a}</p>
     </motion.div>
    )}
   </AnimatePresence>
  </div>
 )
}

export default function WelcomeGate() {
 const { lang, toggleLang } = useLanguage()
 const { theme, toggle } = useTheme()
 const prefersReduced = useReducedMotion()
 const { user } = useAuth()
 const navigate = useNavigate()
 const containerVariants = prefersReduced ? { hidden: {}, visible: {} } : welcomeContainer
 const itemVariants = prefersReduced ? { hidden: {}, visible: {} } : welcomeItem
 const isArabic = lang === 'ar'

  useEffect(() => { if (user) navigate('/home', { replace: true }) }, [user, navigate])
 if (user) return null

 const features = [
  { icon: FiVideo, labelAr: 'محاضرات فيديو', labelEn: 'Video Lectures', descAr: 'جميع محاضرات المواد في مكان واحد مع صور مصغّرة واضحة', descEn: 'All subject lectures in one place with clear thumbnails', grad: 'from-violet-500 to-indigo-500' },
  { icon: FiFileText, labelAr: 'ملخصات ذكية', labelEn: 'Smart Summaries', descAr: 'ملخصات مركزة وملفات PDF جاهزة للتحميل', descEn: 'Concise summaries and ready-to-download PDF files', grad: 'from-cyan-500 to-teal-500' },
  { icon: FiLayers, labelAr: 'مصادر منظمة', labelEn: 'Organized Sources', descAr: 'ملفات وروابط مرتبة تحت كل مادة', descEn: 'Files and links organized under each subject', grad: 'from-amber-500 to-orange-500' },
  { icon: FiClock, labelAr: 'خطة دراسية', labelEn: 'Study Plan', descAr: 'اعرف ترتيب المواد والمتطلبات قبل كل مادة', descEn: 'Know course order and prerequisites in advance', grad: 'from-emerald-500 to-teal-500' },
  { icon: FiAward, labelAr: 'تتبع تقدمك', labelEn: 'Track Progress', descAr: 'متابعة المشاهدة ونسبة إنجاز كل مادة', descEn: 'Continue watching and per-subject progress', grad: 'from-rose-500 to-pink-500' },
  { icon: FiUsers, labelAr: 'مجتمع داعم', labelEn: 'Supportive Community', descAr: 'تواصل مباشر مع مشرفين عبر واتساب', descEn: 'Direct contact with admins via WhatsApp', grad: 'from-sky-500 to-blue-500' },
 ]

 const steps = [
  { num: '01', icon: FiUserPlus, titleAr: 'أنشئ حسابك', titleEn: 'Create account', descAr: 'سجّل في ثوانٍ برقمك الجامعي', descEn: 'Sign up in seconds with your university ID' },
  { num: '02', icon: FiVideo, titleAr: 'تصفح المحاضرات', titleEn: 'Browse lectures', descAr: 'اختر مادتك وشاهد المحاضرات بالترتيب', descEn: 'Pick your subject and watch lectures in order' },
  { num: '03', icon: FiAward, titleAr: 'تعلّم وتفوّق', titleEn: 'Learn & excel', descAr: 'تابع تقدمك وقيّم وحمّل المصادر', descEn: 'Track progress, rate, and download sources' },
 ]

 const testimonials = [
  { name: 'أحمد محمود', role: 'سنة ثانية', textAr: 'المنصة نظمت لي كل المواد، أصبحت أجد المحاضرة والمصادر تحت بعض مباشرة.', textEn: 'The platform organized everything — lectures and sources are right under each other.' },
  { name: 'سارة خالد', role: 'سنة ثالثة', textAr: 'متابعة المشاهدة والتقدم ساعدوني أعرف وين وقفت وما فاتني شي.', textEn: 'Continue watching and progress helped me never lose track.' },
  { name: 'محمد عوض', role: 'سنة أولى', textAr: 'أفضل شيء إنو كل محاضرة معها مصدرها وملخصها، ما بضيع وقت.', textEn: 'Best part is every lecture has its sources and summary — no wasted time.' },
 ]

 const faqs = [
  { q: isArabic ? 'كيف أسجّل في المنصة؟' : 'How do I sign up?', a: isArabic ? 'اضغط "إنشاء حساب جديد" وأدخل رقمك الجامعي وكلمة المرور. التسجيل يستغرق ثوانٍ قليلة.' : 'Click "Create account", enter your university ID and password. Signup takes seconds.' },
  { q: isArabic ? 'هل المنصة مجانية؟' : 'Is the platform free?', a: isArabic ? 'نعم، المنصة مجانية بالكامل لجميع طلبة تكنولوجيا المعلومات — المحاضرات والمصادر متاحة للجميع.' : 'Yes, it is completely free for all IT students — lectures and sources are available to everyone.' },
  { q: isArabic ? 'كيف أجد مصادر المادة؟' : 'How do I find subject sources?', a: isArabic ? 'افتح أي محاضرة وستجد قسم "مصادر المادة" يظهر المصادر المرتبطة بنفس المادة مباشرة.' : 'Open any lecture and the "Subject sources" section shows sources for that subject directly.' },
  { q: isArabic ? 'هل يمكنني تتبع تقدمي؟' : 'Can I track my progress?', a: isArabic ? 'نعم! في الصفحة الرئيسية تجد قسم "تقدمك في المواد" مع أشرطة تقدم ونسبة إنجاز لكل مادة.' : 'Yes! On the home page you will find "Your subject progress" with progress bars and completion per subject.' },
 ]

 const heroStats = [
  { end: 60, suffix: '+', labelAr: 'محاضرة', labelEn: 'Lectures' },
  { end: 300, suffix: '+', labelAr: 'مصدر', labelEn: 'Sources' },
  { end: 4, suffix: '', labelAr: 'دفعات', labelEn: 'Cohorts' },
 ]

 return (
  <div className="relative min-h-screen overflow-hidden bg-spatial-full ">
   {/* Background depth */}
   <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    <div className="absolute inset-0 spatial-grid opacity-[0.35]" />
    <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-royal-500/[0.08] rounded-full blur-[48px]" />
    <div className="absolute top-[30%] -right-24 w-[560px] h-[560px] bg-cyan-400/[0.07] rounded-full blur-[48px]" />
    <div className="absolute bottom-0 left-[30%] w-[640px] h-[360px] bg-violet-500/[0.06] rounded-full blur-[56px]" />
   </div>

   {/* Top bar */}
   <div className="relative z-20 container-page">
    <div className="flex items-center justify-between h-16 md:h-20">
     <div className="flex items-center gap-2">
      <SiteLogo size="sm" />
      <span className="hidden sm:inline font-bold text-ink tracking-tight">AL-Azher IT Hub</span>
      <span className="hidden md:inline-flex items-center gap-1.5 ms-3 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold tracking-widest uppercase">
       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {isArabic ? 'متاح الآن' : 'Live'}
      </span>
     </div>
     <div className="flex items-center gap-2">
       <button onClick={toggleLang} className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-slate-600 dark:text-white/70 hover:text-ink transition" aria-label={isArabic ? 'تبديل اللغة: EN' : 'Switch language: عربي'}>
        {isArabic ? 'EN' : 'عربي'}
       </button>
      <button onClick={toggle} className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-slate-600 dark:text-white/70 hover:text-ink transition" aria-label={isArabic ? 'تبديل المظهر' : 'Toggle theme'}>
       {theme === 'light' ? <FiMoon size={16} /> : theme === 'dark' ? <FiMonitor size={16} /> : <FiSun size={16} />}
      </button>
      <Link to="/login" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-semibold">
       <FiLogIn size={14} className={isArabic ? 'rotate-180' : ''} /> {isArabic ? 'دخول' : 'Sign in'}
      </Link>
     </div>
    </div>
   </div>

   {/* ===== HERO ===== */}
   <div className="relative z-10 container-page">
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-12 items-center pt-6 lg:pt-10 pb-10 lg:min-h-[calc(100vh-140px)]">
     {/* Left — Editorial */}
     <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center lg:text-start">
      <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-slate-600 dark:text-white/70 mb-6">
       <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-royal-500 text-white"><FiShield size={12} /></span>
       {isArabic ? 'منصة تعليمية موثوقة لطلبة تكنولوجيا المعلومات' : 'Trusted platform for IT students'}
       <span className="hidden sm:inline-flex items-center gap-1 text-amber-500 dark:text-amber-400"><FiStar size={12} className="fill-amber-400 text-amber-400" /> 4.9/5</span>
      </motion.div>

      <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[0.95] text-ink">
       {isArabic ? 'تعلّم أذكى،' : 'Learn smarter,'}
       <br />
       <span className="gradient-text-spatial">{isArabic ? 'وتفوّق في موادك.' : 'excel in your courses.'}</span>
      </motion.h1>

      <motion.p variants={itemVariants} className="mt-5 text-[15px] md:text-lg leading-relaxed text-slate-600 dark:text-white/60 max-w-xl mx-auto lg:mx-0">
       {isArabic
        ? 'محاضرات فيديو منظمة، ملخصات مركزة، ومصادر مرتبة تحت كل مادة — كل ما تحتاجه للتفوق في تكنولوجيا المعلومات في منصة واحدة.'
        : 'Organized video lectures, concise summaries, and curated sources under every subject — everything you need to excel in IT, all in one place.'}
      </motion.p>

      {/* CTA */}
      <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
       <Link to="/signup" className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-primary font-semibold text-[15px] min-h-[48px]">
        <FiUserPlus size={18} className={isArabic ? 'rotate-180' : ''} />
        {isArabic ? 'أنشئ حسابك مجاناً' : 'Create your free account'}
        <FiArrowUpRight size={16} className="opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
       </Link>
       <Link to="/login" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl btn-secondary font-semibold text-[15px] min-h-[48px]">
        <FiLogIn size={18} className={isArabic ? 'rotate-180' : ''} />
        {isArabic ? 'تسجيل الدخول' : 'Sign in'}
       </Link>
      </motion.div>

      {/* Trust row */}
      <motion.div variants={itemVariants} className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start text-xs text-slate-500 dark:text-white/50">
       <div className="flex -space-x-2">
        {[0, 1, 2].map(i => <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-navy-900 bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center text-white text-[10px] font-bold">{String.fromCharCode(65 + i)}</div>)}
        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-navy-900 bg-slate-900 dark:bg-white text-white dark:text-navy-900 flex items-center justify-center text-[10px] font-bold">+500</div>
       </div>
       <span>{isArabic ? 'يثق بنا طلاب من 4 دفعات · وصول سريع وآمن' : 'Trusted by 4 cohorts · Fast & secure access'}</span>
      </motion.div>

      {/* Hero stats */}
      <motion.div variants={itemVariants} className="mt-7 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
       {heroStats.map(s => (
        <div key={s.labelEn} className="glass rounded-2xl px-3 py-3.5 text-center">
         <div className="text-xl md:text-2xl font-extrabold gradient-text-spatial"><CountUp end={s.end} suffix={s.suffix} /></div>
         <div className="text-[11px] text-slate-500 dark:text-white/50 font-medium mt-0.5">{isArabic ? s.labelAr : s.labelEn}</div>
        </div>
       ))}
      </motion.div>
     </motion.div>

     {/* Right — 3D knowledge cluster (WebGL on desktop, CSS art fallback) */}
     <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 24, scale: 0.98 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="relative flex items-center justify-center"
     >
      <div ref={heroClusterRef} className="relative w-full max-w-[520px] aspect-square">
       <div className="absolute -inset-6 bg-gradient-to-br from-royal-500/15 via-cyan-400/10 to-violet-500/10 rounded-[32px] blur-2xl" />
       <div className="relative glass-panel gradient-border rounded-[28px] shadow-2xl overflow-hidden w-full h-full">
        <div className="absolute inset-0 spatial-grid opacity-[0.12] pointer-events-none" />
        <div className="absolute -top-6 -right-6 w-24 h-24 hero-orbit opacity-40 pointer-events-none hidden md:block" aria-hidden="true" />
        <Lazy3DScene
         className="absolute inset-0"
         scene={() => import('../components/three/KnowledgeScene')}
         fallbackLabel={isArabic ? 'مشهد ثلاثي الأبعاد لتكوين معرفي' : '3D knowledge cluster scene'}
         fallback={
          <div className="absolute inset-0">
           <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-royal-500/40 to-cyan-400/30 blur-md animate-depth-breathe" />
           <div className="absolute top-[20%] left-[18%] w-10 h-10 rounded-full border-2 border-cyan-400/50 animate-float-slow" />
           <div className="absolute top-[55%] right-[15%] w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/40 to-royal-500/30 rotate-12 animate-float-slow" style={{ animationDelay: '-2s' }} />
           <div className="absolute top-[18%] right-[22%] w-6 h-6 rounded-lg bg-cyan-400/40 rotate-6 animate-float-slow" style={{ animationDelay: '-4s' }} />
          </div>
         }
        />
       </div>

       <motion.div
        animate={prefersReduced || !heroClusterInView ? {} : { y: [0, -6, 0] }}
        transition={prefersReduced ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-3 -right-2 md:-right-4 glass rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shadow-xl"
       >
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center"><FiFileText size={14} /></span>
        <div>
         <div className="text-xs font-bold text-ink leading-none">{isArabic ? 'ملخص جديد' : 'New summary'}</div>
         <div className="text-[11px] text-slate-500 dark:text-white/50">{isArabic ? 'تمت الإضافة اليوم' : 'Added today'}</div>
        </div>
       </motion.div>

       <motion.div
        animate={prefersReduced || !heroClusterInView ? {} : { y: [0, 8, 0] }}
        transition={prefersReduced ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute -bottom-4 -left-2 md:-left-6 glass rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shadow-xl"
       >
        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center"><FiCheck size={14} /></span>
        <div>
         <div className="text-xs font-bold text-ink leading-none">{isArabic ? 'تمت المتابعة' : 'Progress tracked'}</div>
         <div className="text-[11px] text-slate-500 dark:text-white/50">{isArabic ? 'تتبع تلقائي لتقدمك' : 'Your progress, tracked'}</div>
        </div>
       </motion.div>
      </div>
     </motion.div>
    </div>
   </div>

   {/* ===== SOCIAL PROOF / STATS BAR ===== */}
   <Reveal className="relative z-10 py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="glass rounded-2xl px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
     {[
      { value: 60, suffix: '+', label: isArabic ? 'محاضرة مسجلة' : 'Lectures recorded' },
      { value: 300, suffix: '+', label: isArabic ? 'مصدر متاح' : 'Sources available' },
      { value: 8, suffix: '+', label: isArabic ? 'مادة دراسية' : 'Subjects' },
      { value: 4, suffix: '', label: isArabic ? 'دفعات يستخدمونها' : 'Cohorts using it' },
     ].map(s => (
      <div key={s.label}>
       <div className="text-2xl md:text-3xl font-extrabold gradient-text-spatial"><CountUp end={s.value} suffix={s.suffix} /></div>
       <div className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{s.label}</div>
      </div>
     ))}
    </div>
   </Reveal>

   {/* ===== FEATURES ===== */}
   <div className="relative z-10 py-16 container-page">
    <SectionHeading
     eyebrow={isArabic ? 'لماذا نحن' : 'Why us'}
     title={isArabic ? 'كل ما يحتاجه طالب تكنولوجيا المعلومات' : 'Everything an IT student needs'}
     subtitle={isArabic ? 'ميزات مصممة لتبسيط تعلمك وتنظيم موادك' : 'Features designed to simplify your learning and organize your subjects'}
    />
    <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
     {features.map((f) => {
      const Icon = f.icon
      return (
       <div key={f.labelEn} className="group spotlight-card lift glass rounded-2xl p-6 border border-white/10 hover:border-royal-500/30 transition-colors" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.grad} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
         <Icon size={22} />
        </div>
        <h3 className="font-semibold text-ink mb-1">{isArabic ? f.labelAr : f.labelEn}</h3>
        <p className="text-sm text-slate-500 dark:text-white/60">{isArabic ? f.descAr : f.descEn}</p>
       </div>
      )
     })}
    </Reveal>
   </div>

   {/* ===== HOW IT WORKS ===== */}
   <div className="relative z-10 py-16 container-page">
    <SectionHeading
     eyebrow={isArabic ? 'كيف تعمل المنصة' : 'How it works'}
     title={isArabic ? 'ابدأ في 3 خطوات بسيطة' : 'Start in 3 simple steps'}
     subtitle={isArabic ? 'من إنشاء الحساب إلى التفوق — بدون تعقيد' : 'From signup to success — no complexity'}
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     {steps.map((s, i) => {
      const Icon = s.icon
      return (
       <Reveal key={s.num} delay={i * 0.1} className="relative">
        <div className="glass rounded-2xl p-6 text-center h-full">
         <div className="text-4xl font-extrabold gradient-text-spatial opacity-30 mb-3">{s.num}</div>
         <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${i === 0 ? 'from-royal-500 to-cyan-500' : i === 1 ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500'} flex items-center justify-center text-white shadow-lg`}>
          <Icon size={24} />
         </div>
         <h3 className="font-semibold text-ink mb-1">{isArabic ? s.titleAr : s.titleEn}</h3>
         <p className="text-sm text-slate-500 dark:text-white/60">{isArabic ? s.descAr : s.descEn}</p>
        </div>
        {i < steps.length - 1 && (
         <div className="hidden md:block absolute top-1/2 -right-3 text-slate-300 dark:text-white/20 text-2xl" aria-hidden="true">
          {isArabic ? '←' : '→'}
         </div>
        )}
       </Reveal>
      )
     })}
    </div>
    <Reveal className="text-center mt-8">
     <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl btn-primary font-semibold text-[15px] min-h-[48px]">
      <FiUserPlus size={18} className={isArabic ? 'rotate-180' : ''} />
      {isArabic ? 'ابدأ الآن مجاناً' : 'Get started free'}
     </Link>
    </Reveal>
   </div>

   {/* ===== TESTIMONIALS ===== */}
   <div className="relative z-10 py-16 container-page">
    <SectionHeading
     eyebrow={isArabic ? 'آراء الطلاب' : 'Student voices'}
     title={isArabic ? 'ماذا يقول طلابنا' : 'What our students say'}
     subtitle={isArabic ? 'تجارب حقيقية من طلبة يستخدمون المنصة' : 'Real experiences from students using the platform'}
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
     {testimonials.map((tm, i) => (
      <Reveal key={tm.name} delay={i * 0.08} className="glass rounded-2xl p-6 border border-white/10 hover:border-royal-500/30 transition-colors">
       <div className="flex items-center gap-1 mb-4 text-amber-400">
        {[1, 2, 3, 4, 5].map(star => <FiStar key={star} size={14} className="fill-amber-400" />)}
       </div>
       <p className="text-sm text-navy-900 dark:text-white/80 leading-relaxed mb-5">&ldquo;{isArabic ? tm.textAr : tm.textEn}&rdquo;</p>
       <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
         {tm.name.charAt(0)}
        </div>
        <div>
         <p className="text-sm font-semibold text-ink">{tm.name}</p>
         <p className="text-xs text-slate-500 dark:text-white/50">{tm.role}</p>
        </div>
       </div>
      </Reveal>
     ))}
    </div>
   </div>

   {/* ===== FAQ ===== */}
   <div className="relative z-10 py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeading
     eyebrow={isArabic ? 'الأسئلة الشائعة' : 'FAQ'}
     title={isArabic ? 'لديك سؤال؟' : 'Have a question?'}
     subtitle={isArabic ? 'إجابات لأكثر الأسئلة شيوعاً' : 'Answers to the most common questions'}
    />
    <div className="space-y-3">
     {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} isArabic={isArabic} />)}
    </div>
   </div>

   {/* ===== FINAL CTA ===== */}
   <Reveal className="relative z-10 py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="relative overflow-hidden glass rounded-3xl border border-white/10 p-10 md:p-14 text-center">
     <div className="absolute -top-20 -left-20 w-64 h-64 bg-royal-500/15 rounded-full blur-3xl" />
     <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl" />
     <h2 className="relative text-2xl md:text-4xl font-bold gradient-text-spatial mb-4">{isArabic ? 'جاهز تبدأ رحلتك؟' : 'Ready to start?'}</h2>
     <p className="relative text-slate-500 dark:text-white/60 text-lg mb-8 max-w-xl mx-auto">{isArabic ? 'انضم إلى زملائك وتابع المحاضرات والمصادر والخطط الدراسية من مكان واحد.' : 'Join your classmates and follow lectures, sources, and study plans all in one place.'}</p>
     <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
      <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl btn-primary font-semibold text-[15px] min-h-[48px]">
       <FiUserPlus size={18} className={isArabic ? 'rotate-180' : ''} /> {isArabic ? 'أنشئ حسابك مجاناً' : 'Create your free account'}
      </Link>
      <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl btn-secondary font-semibold text-[15px] min-h-[48px]">
       <FiLogIn size={18} className={isArabic ? 'rotate-180' : ''} /> {isArabic ? 'تسجيل الدخول' : 'Sign in'}
      </Link>
     </div>
    </div>
   </Reveal>

   {/* ===== SUBJECTS MARQUEE ===== */}
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
        { icon: FiCpu, ar: 'برمجة', en: 'Programming' },
        { icon: FiGlobe, ar: 'شبكات', en: 'Networks' },
        { icon: FiCloud, ar: 'الحوسبة السحابية', en: 'Cloud Computing' },
        { icon: FiCode, ar: 'تطوير ويب', en: 'Web Development' },
        { icon: FiBookOpen, ar: 'هياكل بيانات', en: 'Data Structures' },
        { icon: FiShield, ar: 'أمن المعلومات', en: 'Cyber Security' },
        { icon: FiFileText, ar: 'تحليل وتصميم', en: 'System Analysis' },
       ].map((s) => {
        const Icon = s.icon
        return (
         <span key={s.en} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-slate-600 dark:text-white/60 font-medium">
          <Icon size={14} className="text-accent" />
          {isArabic ? s.ar : s.en}
         </span>
        )
       })}
      </div>
     ))}
    </div>
   </div>

   {/* ===== FOOTER ===== */}
   <footer className="relative z-10 text-center py-6 text-slate-500 dark:text-white/30 text-xs">
    AL-Azher IT Hub © {new Date().getFullYear()} · {isArabic ? 'صُنع لطلبة الأزهر' : 'Built for Al-Azhar students'}
   </footer>
  </div>
 )
}