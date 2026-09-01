import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getAdditions } from '../services'
import { pageContainer, pageItem, pageContainerReduced, revealItem } from '../utils/motionTokens'
import { lectureVideoId, } from '../utils/helpers'
import HeroSection from '../components/HeroSection'
import { FiFileText, FiGrid, FiArrowLeft, FiEye, FiHeart, FiClock, FiMap, FiLink, FiUser, FiMessageCircle, FiVideo, FiChevronLeft, FiPlay, FiBookOpen, FiSend, FiUsers } from 'react-icons/fi'
import LectureThumbnail from '../components/shared/LectureThumbnail'
import ErrorState from '../components/feedback/ErrorState'
import { useUserData } from '../context/UserDataContext'
import Skeleton from '../components/shared/Skeleton'

const quickLinks = [
 { to: '/lectures', icon: FiFileText, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/30', key: 'lectures', solidColor: '#3b82f6' },
 { to: '/sources', icon: FiGrid, color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50 dark:bg-amber-900/30', key: 'sources', solidColor: '#f59e0b' },
 { to: '/study-plan', icon: FiClock, color: 'from-violet-500 to-violet-600', bgLight: 'bg-violet-50 dark:bg-violet-900/30', key: 'studyPlan', solidColor: '#8b5cf6' },
 { to: '/roadmap', icon: FiMap, color: 'from-cyan-500 to-cyan-600', bgLight: 'bg-cyan-50 dark:bg-cyan-900/30', key: 'roadmap', solidColor: '#06b6d4' },
 { to: '/additions', icon: FiHeart, color: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-900/30', key: 'additions', solidColor: '#10b981' },
]

const containerVariants = pageContainer
const itemVariants = pageItem

export default function Home() {
 const { lang, t } = useLanguage()
 const { user, isAdmin } = useAuth()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 // UserDataProvider wraps the whole app; the hook is safe to call directly.
 const userData = useUserData()

 
 const [lectures, setLectures] = useState([])
 const [sources, setSources] = useState([])
 const [additions, setAdditions] = useState([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [retry, setRetry] = useState(0)

 const viewed = userData?.viewed ?? []
 const favorites = userData?.favorites ?? []
 const userStats = userData?.stats ?? { viewed: [], lastVisit: null }

 useEffect(() => {
  let mounted = true
  async function load() {
   try {
    const [l, s, a] = await Promise.all([getLectures(), getSources(), getAdditions()])
    if (!mounted) return
    setLectures(l)
    setSources(s)
    setAdditions(a)
   } catch (err) { if (mounted) setError(err) }
   if (mounted) setLoading(false)
  }
  load()
  return () => { mounted = false }
 }, [retry])

 const handleRetry = () => {
  setLoading(true)
  setError(null)
  setRetry(c => c + 1)
 }

 const latestLectures = useMemo(() => [...lectures].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4), [lectures])
 const latestAdditions = useMemo(() => [...additions].slice(0, 8), [additions])

 const continueWatching = useMemo(() => {
  if (!viewed?.length) return []
  const viewedSet = new Set(viewed)
  const lastIds = [...viewed].slice(-4)
  return lastIds
   .map(vid => lectures.find(l => l.id === vid))
   .filter(Boolean)
   .filter(l => viewedSet.has(l.id))
 }, [viewed, lectures])

 const subjectProgress = useMemo(() => {
  if (!lectures.length) return []
  const groups = {}
  lectures.forEach(l => {
   const name = l.subjectAr || l.subjectEn || '—'
   if (!groups[name]) groups[name] = { total: 0, watched: 0, subjectAr: l.subjectAr, subjectEn: l.subjectEn }
   groups[name].total++
   if (viewed?.includes(l.id)) groups[name].watched++
  })
  return Object.entries(groups).map(([name, g]) => ({ ...g, name }))
   .sort((a, b) => (b.total - b.watched) - (a.total - a.watched))
   .slice(0, 6)
 }, [lectures, viewed])
 const materialsCount = useMemo(() => {
  const set = new Set()
  lectures.forEach(l => {
   const s = l.subjectAr || l.subjectEn
   if (s) set.add(s)
  })
  return set.size
 }, [lectures])

 const additionTypeConfig = {
  post: { icon: FiMessageCircle, gradient: 'from-blue-500 to-blue-600', labelAr: 'منشور', labelEn: 'Post' },
  whatsapp: { icon: FiMessageCircle, gradient: 'from-emerald-500 to-emerald-600', labelAr: 'واتساب', labelEn: 'WhatsApp' },
  video: { icon: FiVideo, gradient: 'from-rose-500 to-rose-600', labelAr: 'فيديو', labelEn: 'Video' },
 }

 if (error) return <ErrorState error={error} onRetry={handleRetry} />

 if (loading) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="py-16 mb-12">
     <div className="container-page text-center">
      <Skeleton className="h-10 w-64 mx-auto mb-4 rounded-xl" />
      <Skeleton className="h-5 w-80 mx-auto rounded-lg" />
     </div>
    </div>
    <div className="container-page">
     <Skeleton className="h-24 rounded-2xl mb-6" />
     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
     </div>
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="glass rounded-xl p-6"><Skeleton className="h-12 w-12 rounded-xl mb-4" /><Skeleton className="h-5 w-3/4 rounded-lg mb-2" /><Skeleton className="h-3 w-1/2 rounded-full" /></div>)}
     </div>
    </div>
   </div>
  )
 }

  return (
   <motion.div variants={prefersReduced ? pageContainerReduced : containerVariants} initial="hidden" animate="visible" className="">
   <HeroSection 
    ctaLink="/lectures" 
    ctaSecondaryLink="/sources"
    lecturesCount={lectures.length}
    sourcesCount={sources.length}
    materialsCount={materialsCount}
    watchedCount={userStats.viewed?.length || 0}
   />

   {/* Welcome Card */}
   {!isAdmin && user && (
    <motion.section
     initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
     whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
     viewport={{ once: true }}
     transition={prefersReduced ? {} : { duration: 0.6, type: 'spring', stiffness: 150 }}
     className="py-6 bg-spatial-page"
    >
     <div className="container-page">
      <div className="glass rounded-2xl p-6 border border-white/10 bg-gradient-to-l from-royal-500/5 to-cyan-500/5">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-royal-500/25">
          <FiUser size={24} />
         </div>
         <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink">
           {isArabic ? `مرحباً بك، ${user.name}!` : `Welcome, ${user.name}!`}
          </h1>
          {userStats.lastVisit && (
           <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            {isArabic ? 'آخر زيارة' : 'Last visit'}: {new Date(userStats.lastVisit).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
          )}
         </div>
        </div>
        <Link
         to="/profile"
         className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl btn-spatial text-sm font-medium"
        >
         {isArabic ? 'الملف الشخصي' : 'Profile'} <FiChevronLeft size={16} className={isArabic ? '' : 'rotate-180'} />
        </Link>
       </div>
      </div>
     </div>
    </motion.section>
   )}

   {/* Continue Watching — Filmstrip */}
   {!isAdmin && continueWatching.length > 0 && (
    <motion.section
     initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
     whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
     viewport={{ once: true }}
     transition={prefersReduced ? {} : revealItem.transition}
     className="py-10 bg-spatial-page"
    >
     <div className="container-page">
      <div className="flex items-center justify-between mb-6">
       <h2 className="text-2xl md:text-3xl font-bold gradient-text-spatial flex items-center gap-2">
        <FiPlay size={24} className="text-accent" />
        {isArabic ? 'متابعة المشاهدة' : 'Continue watching'}
       </h2>
       <Link to="/lectures" className="text-accent hover:text-royal-600 dark:hover:text-cyan-300 font-medium text-sm transition-colors flex items-center gap-1">
        {isArabic ? 'عرض الكل' : 'View all'} <FiArrowLeft className={isArabic ? '' : 'rotate-180'} />
       </Link>
      </div>
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
       <div className="absolute inset-0 pointer-events-none hidden sm:block rounded-xl border border-dashed border-slate-200 dark:border-white/10" aria-hidden="true" />
       <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-thin pb-4 pt-2 px-2 sm:p-4 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {continueWatching.map((lecture) => {
         const videoId = lectureVideoId(lecture)
         return (
          <Link key={lecture.id} to={`/lecture/${lecture.id}`} className="group flex-shrink-0 w-64 sm:w-auto lg:w-auto snap-start glass glass-hover lift rounded-xl overflow-hidden block ">
           <div className="relative aspect-video bg-black/30 overflow-hidden">
            <LectureThumbnail videoId={videoId} alt="" className="group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent flex items-center justify-center">
             <div className="w-9 h-9 bg-rose-500/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
              <FiPlay size={14} className="ms-0.5" />
             </div>
            </div>
            <span className="absolute top-2 end-2 px-2 py-0.5 bg-black/55 backdrop-blur-sm rounded-full text-[10px] text-white font-medium border border-white/15">
             {isArabic ? 'أكمل' : 'Resume'}
            </span>
           </div>
           <div className="p-3">
            <p className="text-[10px] tracking-widest uppercase text-slate-500 dark:text-white/50 mb-1 tabular-nums">{isArabic ? lecture.subjectAr : lecture.subjectEn}</p>
            <h3 className="text-xs font-semibold text-ink line-clamp-1 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors">{isArabic ? lecture.titleAr : lecture.titleEn}</h3>
           </div>
          </Link>
         )
        })}
       </div>
      </div>
     </div>
    </motion.section>
   )}

   {/* Subject progress — Tape Timeline */}
   {!isAdmin && subjectProgress.length > 0 && (
    <motion.section
     initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
     whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
     viewport={{ once: true }}
     transition={prefersReduced ? {} : revealItem.transition}
     className="py-10 bg-spatial-page"
    >
     <div className="container-page">
      <div className="flex items-center gap-2 mb-8">
       <FiBookOpen size={22} className="text-emerald-500 dark:text-emerald-400" />
       <h2 className="text-2xl md:text-3xl font-bold gradient-text-spatial">{isArabic ? 'تقدمك في المواد' : 'Your subject progress'}</h2>
       <span className="ms-3 hidden sm:inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-semibold text-slate-500 dark:text-white/40">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        {isArabic ? 'شريط تقدم تفاعلي' : 'Tape timeline'}
       </span>
      </div>
      <div className="relative">
       <div className="absolute start-3 top-2 bottom-2 w-px bg-gradient-to-b from-royal-500/30 via-emerald-500/20 to-transparent hidden sm:block" aria-hidden="true" />
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:ps-8">
        {subjectProgress.map((sp, i) => {
         const pct = sp.total > 0 ? Math.round((sp.watched / sp.total) * 100) : 0
         const done = pct === 100
         return (
          <motion.div
           key={sp.name}
           initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
           whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: i * 0.04 }}
           className="group relative glass rounded-2xl p-4 border border-white/10 hover:border-royal-500/20 transition-colors overflow-hidden"
          >
           <div className="absolute -start-8 top-6 hidden sm:flex w-6 h-6 rounded-full border-2 items-center justify-center text-[10px] font-bold shadow-sm" style={{ background: done ? '#10b981' : pct > 0 ? '#2563eb' : 'var(--bg-surface)', borderColor: done ? '#10b981' : pct > 0 ? '#2563eb' : 'var(--border-default)', color: done || pct > 0 ? '#fff' : 'var(--text-muted)' }}>
            {done ? '✓' : i + 1}
           </div>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-royal-500/[0.04] to-transparent" />
           <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-ink truncate pe-2">{isArabic ? sp.subjectAr : sp.subjectEn}</span>
            <span className={`text-xs font-bold tabular-nums px-2 py-1 rounded-full ${done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : pct > 0 ? 'bg-royal-500/10 text-royal-600 dark:text-cyan-300' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>{pct}%</span>
           </div>
           <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <motion.div
             initial={{ width: 0 }}
             whileInView={{ width: `${pct}%` }}
             viewport={{ once: true }}
             transition={{ duration: 0.9, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
             className={`h-full rounded-full ${done ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-royal-500 to-cyan-400'}`}
            />
            {pct > 0 && pct < 100 && <span className="absolute inset-y-0 w-px bg-white/60" style={{ insetInlineStart: `${pct}%` }} />}
           </div>
           <p className="text-xs text-slate-500 dark:text-white/50 mt-2.5 tabular-nums">{isArabic ? `${sp.watched} من ${sp.total} محاضرة` : `${sp.watched} of ${sp.total} lectures`} {done && (isArabic ? '· مكتمل' : '· done')}</p>
          </motion.div>
         )
        })}
       </div>
      </div>
     </div>
    </motion.section>
   )}

   {/* Stats — Unified Reveal */}
   {!isAdmin && (
    <motion.section variants={prefersReduced ? {} : pageContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="py-12 bg-spatial-page">
     <div className="container-page">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
       {[
        { icon: FiFileText, value: lectures.length, label: t('home.stats.totalLectures'), gradient: 'from-violet-500 to-cyan-500' },
        { icon: FiLink, value: sources.length, label: t('home.stats.totalSources'), gradient: 'from-emerald-500 to-cyan-500' },
        { icon: FiEye, value: viewed?.length || 0, label: t('home.stats.watched'), gradient: 'from-cyan-500 to-royal-600' },
        { icon: FiHeart, value: favorites.length, label: t('home.stats.favorites'), gradient: 'from-rose-500 to-pink-500' },
        { icon: FiGrid, value: materialsCount, label: isArabic ? 'عدد المواد' : 'Materials', gradient: 'from-amber-500 to-orange-500' },
       ].map((stat, i) => {
        const Icon = stat.icon
        return (
         <motion.div
          key={i}
          variants={prefersReduced ? {} : revealItem}
          transition={{ delay: i * 0.06 }}
          whileHover={prefersReduced ? {} : { y: -4 }}
          className="stat-tile p-4 hover:border-royal-500/30 cursor-default group"
         >
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition duration-300`}>
           <Icon size={22} />
          </div>
          <div>
           <p className="font-extrabold text-ink text-2xl tracking-tight tabular-nums">
            {stat.value}
           </p>
           <p className="text-xs text-slate-500 dark:text-white/50 font-medium">{stat.label}</p>
          </div>
         </motion.div>
        )
       })}
      </div>
     </div>
    </motion.section>
   )}

   {/* Additions Strip */}
   {latestAdditions.length > 0 && (
    <motion.section
     initial={prefersReduced ? {} : { opacity: 0 }}
     whileInView={prefersReduced ? {} : { opacity: 1 }}
     viewport={{ once: true, margin: "-50px" }}
     className="py-10 bg-spatial-page overflow-hidden"
    >
     <div className="container-page mb-6">
      <div className="flex items-center justify-between">
       <h2 className="text-2xl md:text-3xl font-bold gradient-text-spatial">{isArabic ? 'آخر الإضافات' : 'Latest Additions'}</h2>
       <Link to="/additions" className="text-accent hover:text-royal-600 dark:hover:text-cyan-300 font-medium text-sm transition-colors flex items-center gap-1">
        {isArabic ? 'عرض الكل' : 'View All'} <FiArrowLeft className={isArabic ? '' : 'rotate-180'} />
       </Link>
      </div>
     </div>
      <div className="relative">
       <div tabIndex={0} role="region" aria-label={isArabic ? 'آخر الإضافات' : 'Latest additions'} className="flex gap-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500/50 rounded-xl">
       {latestAdditions.map((addition, i) => {
        const typeConf = additionTypeConfig[addition.type] || additionTypeConfig.post
        const TypeIcon = typeConf.icon
        const addDir = ['right', 'left', 'top', 'bottom'][i % 4]
        const addDirAnim = {
         right: { opacity: 0, x: 70, y: 0 },
         left: { opacity: 0, x: -70, y: 0 },
         top: { opacity: 0, x: 0, y: -70 },
         bottom: { opacity: 0, x: 0, y: 70 },
        }
         return (
          <motion.div
           key={addition.id || i}
           initial={prefersReduced ? {} : addDirAnim[addDir]}
           whileInView={prefersReduced ? {} : { opacity: 1, x: 0, y: 0 }}
           viewport={{ once: true }}
           transition={prefersReduced ? {} : { duration: 0.6, delay: i * 0.08, type: 'spring', stiffness: 160 }}
           whileHover={prefersReduced ? {} : { scale: 1.03, y: -4 }}
           className="flex-shrink-0 w-64 snap-start glass rounded-2xl p-4 border border-white/10 hover:border-royal-500/30 cursor-default group"
          >
           <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${typeConf.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
             <TypeIcon size={16} />
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-white/50 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
             {isArabic ? typeConf.labelAr : typeConf.labelEn}
            </span>
            {addition.createdAt && (
             <span className="ms-auto text-[10px] text-slate-400 dark:text-white/30">
              {new Date(addition.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
             </span>
            )}
           </div>
           <h3 className="font-semibold text-ink text-sm line-clamp-2 mb-1 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors">
            {isArabic ? addition.titleAr : addition.titleEn}
           </h4>
           {(addition.descriptionAr || addition.descriptionEn) && (
            <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2">
             {isArabic ? addition.descriptionAr : addition.descriptionEn}
            </p>
           )}
          </motion.div>
         )
       })}
      </div>
     </div>
    </motion.section>
   )}

   <motion.section variants={itemVariants} whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="py-20 bg-spatial-page relative">
    <div className="container-page">
     <motion.div className="text-center mb-16" variants={itemVariants}>
      <h2 className="text-3xl md:text-4xl font-bold gradient-text-spatial">{t('home.quickLinks.title')}</h2>
     </motion.div>
     <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" variants={containerVariants}>
       {quickLinks.map((link) => {
        const Icon = link.icon
        return (
         <motion.div key={link.key} variants={itemVariants}>
          <Link to={link.to} className="group spotlight-card lift glass rounded-xl p-6 block cursor-glow hover:border-royal-500/40 transition-colors duration-300" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
           <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-transform">
             <Icon className="text-2xl" style={{ color: link.solidColor }} />
            </div>
            <div>
             <h3 className="font-semibold text-ink group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors mb-1">{t(`home.quickLinks.${link.key}`)}</h3>
             <p className="text-sm text-slate-500 dark:text-white/60">{t(`home.quickLinks.${link.key}Desc`)}</p>
            </div>
           </div>
          </Link>
         </motion.div>
        )
       })}
     </motion.div>
    </div>
   </motion.section>

   {latestLectures.length > 0 && (
    <motion.section variants={itemVariants} whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="py-20 bg-spatial-page relative section-lazy">
     <div className="container-page">
      <div className="flex items-center justify-between mb-12">
       <h2 className="text-3xl md:text-4xl font-bold gradient-text-spatial mb-0">{t('home.latest.title')}</h2>
       <Link to="/lectures" className="text-accent hover:text-royal-600 dark:hover:text-cyan-300 font-medium text-sm transition-colors flex items-center gap-1">
        {t('home.latest.viewAll')} <FiArrowLeft className={isArabic ? '' : 'rotate-180'} />
       </Link>
      </div>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
       {latestLectures.map((lecture) => {
        const videoId = lectureVideoId(lecture)
        return (
        <motion.div key={lecture.id} variants={itemVariants}>
          <Link to={`/lecture/${lecture.id}`} className="glass glass-hover rounded-xl overflow-hidden block group">
           <div className="relative h-32 bg-black/30 overflow-hidden">
            <LectureThumbnail
             videoId={videoId}
             alt=""
             sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 3rem), calc(25vw - 3.5rem)"
             className="group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="w-11 h-11 bg-rose-500/90 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30 scale-75 group-hover:scale-100 transition-transform duration-300">
              <FiPlay size={18} className="ms-0.5" />
             </div>
            </div>
           </div>
          <div className="p-4">
           <span className="inline-block text-xs bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/10 text-slate-500 dark:text-white/60 px-2 py-0.5 rounded-full mb-2">
            {isArabic ? lecture.subjectAr : lecture.subjectEn}
           </span>
           <h3 className="font-semibold text-ink text-sm mb-1 line-clamp-2 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors">{isArabic ? lecture.titleAr : lecture.titleEn}</h4>
           <p className="text-xs text-slate-500 dark:text-white/50">{lecture.date}</p>
          </div>
         </Link>
        </motion.div>
        )
       })}
      </motion.div>
     </div>
    </motion.section>
   )}

   {/* Features / Why us */}
   <motion.section variants={itemVariants} whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="py-16 bg-spatial-page relative">
    <div className="container-page">
     <motion.div className="text-center mb-12" variants={itemVariants}>
      <h2 className="text-3xl md:text-4xl font-bold gradient-text-spatial">{t('home.features.title')}</h2>
     </motion.div>
     <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
      {[
       { icon: FiVideo, color: 'from-violet-500 to-cyan-500', titleAr: 'محاضرات فيديو منظمة', titleEn: 'Organized video lectures', descAr: 'كل المواد والسنوات في مكان واحد مع صور مصغّرة واضحة', descEn: 'Every subject and year in one place with clear thumbnails' },
       { icon: FiBookOpen, color: 'from-emerald-500 to-cyan-500', titleAr: 'مصادر وملفات PDF', titleEn: 'Sources & PDF files', descAr: 'ملخصات وملفات جاهزة للتحميل لكل مادة', descEn: 'Ready-to-download summaries and files for each subject' },
       { icon: FiClock, color: 'from-amber-500 to-rose-500', titleAr: 'خطة دراسية واضحة', titleEn: 'Clear study plan', descAr: 'اعرف ترتيب المواد والمتطلبات قبل كل مادة', descEn: 'Know course order and prerequisites in advance' },
       { icon: FiUsers, color: 'from-royal-500 to-violet-500', titleAr: 'منصة سريعة وآمنة', titleEn: 'Fast & secure platform', descAr: 'تسجيل دخول آمن وتجربة سلسة على كل الأجهزة', descEn: 'Secure login and a smooth experience on all devices' },
      ].map((f, i) => {
       const Icon = f.icon
       return (
        <motion.div key={i} variants={itemVariants} className="group spotlight-card lift glass rounded-2xl p-6 border border-white/10 hover:border-royal-500/30 transition-colors" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
         <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
          <Icon size={22} />
         </div>
         <h3 className="font-semibold text-ink mb-1">{isArabic ? f.titleAr : f.titleEn}</h3>
         <p className="text-sm text-slate-500 dark:text-white/60">{isArabic ? f.descAr : f.descEn}</p>
        </motion.div>
       )
      })}
     </motion.div>
    </div>
   </motion.section>

   {/* CTA Banner */}
   <motion.section variants={itemVariants} whileInView="visible" viewport={{ once: true }} className="py-16 bg-spatial-page">
    <div className="container-page">
     <motion.div variants={itemVariants} className="relative overflow-hidden glass rounded-3xl border border-white/10 p-10 md:p-14 text-center">
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-royal-500/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl" />
      <h2 className="relative text-2xl md:text-4xl font-bold gradient-text-spatial mb-4">{t('home.cta.title')}</h2>
      <p className="relative text-slate-500 dark:text-white/60 text-lg mb-8 max-w-2xl mx-auto">{t('home.cta.subtitle')}</p>
      <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
       <Link to="/lectures" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl btn-spatial font-semibold text-[15px] shadow-lg shadow-royal-500/20">
        <FiVideo size={16} /> {isArabic ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
       </Link>
       <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl glass font-semibold text-[15px] text-ink">
        <FiSend size={16} /> {isArabic ? 'تواصل معنا' : 'Contact Us'}
       </Link>
      </div>
     </motion.div>
    </div>
   </motion.section>
  </motion.div>
  )
 }
