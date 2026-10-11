import { useState, useEffect, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import {
 getLectures, getFavorites, getUserStats, getSources,
 studentUpdateProfile, addActivity, addStudentLog, getStudentLogs,
 resetPassword, authenticateUser
} from '../services'
import { currentStreak, computeAchievements } from '../utils/achievements'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { FiUser, FiEdit2, FiSave, FiX, FiLinkedin, FiPhone, FiGlobe, FiBookOpen, FiHeart, FiEye, FiArrowLeft, FiLink, FiLock, FiActivity, FiPlay, FiAward, FiCalendar, FiCheckCircle, FiPrinter, FiExternalLink, FiCheckSquare } from 'react-icons/fi'
import toast from 'react-hot-toast'
import motivationalQuotes from '../data/quotes'
import ErrorState from '../components/feedback/ErrorState'
import Skeleton from '../components/shared/Skeleton'
import { ACADEMIC_PLANS, getAcademicPlan } from '../data/academicCurriculum'

const containerVariants = pageContainer
const itemVariants = pageItem

const BADGE_ICONS = { FiPlay, FiEye, FiAward, FiHeart, FiCalendar, FiCheckCircle }

/* Heat-cell shades, light → dark with activity intensity. */
const HEAT_LEVELS = [
 'bg-slate-200/70 dark:bg-white/5',
 'bg-royal-500/30 dark:bg-cyan-500/25',
 'bg-royal-500/60 dark:bg-cyan-500/50',
 'bg-royal-600 dark:bg-cyan-400',
]

const isoDay = (dt) =>
 `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

// Only allow http(s) links for the user's social profile fields. Anything else
// (javascript:, data:, vbscript:) is dropped to prevent stored-XSS via href.
function safeProfileUrl(value) {
  const v = (value || '').trim()
  if (!v) return ''
  return /^https?:\/\/.+/i.test(v) ? v.slice(0, 500) : ''
}

function getGpaStandingAr(pct) {
  if (pct >= 90) return 'ممتاز مرتفع (A+)'
  if (pct >= 85) return 'ممتاز (A)'
  if (pct >= 80) return 'جيد جداً مرتفع (B+)'
  if (pct >= 75) return 'جيد جداً (B)'
  if (pct >= 70) return 'جيد مرتفع (C+)'
  if (pct >= 65) return 'جيد (C)'
  if (pct >= 60) return 'مقبول مرتفع (D+)'
  if (pct >= 50) return 'مقبول (D)'
  return 'راسب (F)'
}

export default function Profile() {
 const { lang, t } = useLanguage()
 const { user, updateUser } = useAuth()
 const prefersReduced = useReducedMotion()
 const navigate = useNavigate()
 const isArabic = lang === 'ar'

  const [editing, setEditing] = useState(false)
 const [profileData, setProfileData] = useState({
  name: '',
  major: '',
  google: '',
  linkedin: '',
  whatsapp: '',
 })
 const [stats, setStats] = useState({ lectures: 0, favorites: 0, viewed: 0, sources: 0 })
 const [achievements, setAchievements] = useState([])
 const [quote, setQuote] = useState('')
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [retryCount, setRetryCount] = useState(0)
 const [showPasswordForm, setShowPasswordForm] = useState(false)
 const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
 const [pwSaving, setPwSaving] = useState(false)
 const [logDates, setLogDates] = useState([])
 const [showPrintReport, setShowPrintReport] = useState(false)

 const activePlanId = useMemo(() => {
  try {
   const saved = localStorage.getItem('al_azher_active_major_plan')
   if (saved && ACADEMIC_PLANS.some(p => p.id === saved)) return saved
  } catch {}
  return 'cse-2025'
 }, [])

 const activePlan = useMemo(() => getAcademicPlan(activePlanId), [activePlanId])

 const allCurriculumCourses = useMemo(() => {
  const list = []
  activePlan.curriculum.forEach((yr) => {
   yr.semesters.forEach((sem) => {
    sem.courses.forEach((c) => {
     list.push({ ...c, year: yr.year, semester: sem.semester })
    })
   })
  })
  return list
 }, [activePlan])

 const totalCurriculumHours = useMemo(() => {
  return allCurriculumCourses.reduce((sum, c) => sum + (c.hours || 0), 0)
 }, [allCurriculumCourses])

 const curriculumProgressState = useMemo(() => {
  try {
   const specific = localStorage.getItem(`al_azher_curriculum_progress_${activePlanId}`)
   if (specific) return JSON.parse(specific)
   if (activePlanId === 'cse-2025') {
    const legacy = localStorage.getItem('al_azher_curriculum_progress')
    if (legacy) return JSON.parse(legacy)
   }
  } catch {}
  return {}
 }, [activePlanId])

 const passedCourses = useMemo(() => {
  return allCurriculumCourses.filter((c) => curriculumProgressState[c.id] === 'passed')
 }, [allCurriculumCourses, curriculumProgressState])

 const passedHours = useMemo(() => {
  return passedCourses.reduce((sum, c) => sum + (c.hours || 0), 0)
 }, [passedCourses])

 const progressPct = totalCurriculumHours > 0
  ? Math.min(100, Math.round((passedHours / totalCurriculumHours) * 100))
  : 0

 const academicLevelText = useMemo(() => {
  if (passedHours < 34) return isArabic ? 'السنة الأولى (مستجد)' : 'First Year'
  if (passedHours < 68) return isArabic ? 'السنة الثانية' : 'Second Year'
  if (passedHours < 102) return isArabic ? 'السنة الثالثة' : 'Third Year'
  return isArabic ? 'السنة الرابعة (سنة التخرج)' : 'Fourth Year (Graduating)'
 }, [passedHours, isArabic])

 const savedGpaData = useMemo(() => {
  try {
   const raw = localStorage.getItem('al_azher_saved_gpa_calc')
   if (raw) {
    const courses = JSON.parse(raw)
    if (Array.isArray(courses) && courses.length > 0) {
     let totalHours = 0
     let totalWeighted = 0
     courses.forEach((c) => {
      const h = Number(c.hours) || 0
      totalHours += h
      totalWeighted += (Number(c.grade) || 0) * h
     })
     const gpaPct = totalHours > 0 ? (totalWeighted / totalHours).toFixed(1) : null
     const numGpa = parseFloat(gpaPct)
     return {
      count: courses.length,
      totalHours,
      gpaPct,
      standingAr: getGpaStandingAr(numGpa),
      courses,
     }
    }
   }
  } catch {}
  return null
 }, [])

 const retryLoad = () => {
  setError(null)
  setLoading(true)
  setRetryCount(c => c + 1)
 }

 // GitHub-style 12-week activity grid from student_logs timestamps
 // (real recorded activity — no synthetic dates).
 const heatmap = useMemo(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayMs = 86400000
  const start = new Date(today)
  start.setDate(start.getDate() - 77 - today.getDay()) // Sunday, 11 full weeks back
  const byDay = new Map()
  for (const day of logDates) {
   if (!day) continue
   const d = new Date(`${day}T00:00:00`)
   if (Number.isNaN(d.getTime())) continue
   const idx = Math.floor((d.getTime() - start.getTime()) / dayMs)
   if (idx >= 0 && idx < 84) byDay.set(idx, (byDay.get(idx) || 0) + 1)
  }
  const weeks = []
  for (let w = 0; w < 12; w++) {
   const col = []
   for (let d = 0; d < 7; d++) {
    const idx = w * 7 + d
    const date = new Date(start.getTime() + idx * dayMs)
    col.push({ count: byDay.get(idx) || 0, future: date.getTime() > today.getTime(), label: isoDay(date) })
   }
   weeks.push(col)
  }
  return weeks
 }, [logDates])

 useEffect(() => {
  if (!user || user.role === 'admin') return
  let mounted = true
  async function load() {
   try {
    const [lectures, favs, userStats, sources, logs] = await Promise.all([
     getLectures(),
     getFavorites(user.studentId),
     getUserStats(user.studentId),
     getSources(),
     getStudentLogs(user.studentId).catch(() => []),
    ])
    if (mounted) {
     setProfileData({
      name: user.name || '',
      major: user.major || '',
      google: user.google || '',
      linkedin: user.linkedin || '',
      whatsapp: user.whatsapp || '',
     })
     setStats({
      lectures: lectures.length,
      favorites: favs.length,
      viewed: userStats.viewed?.length || 0,
      sources: sources.length,
     })
     // Achievements: pure client-side computation over the data just fetched
     // (viewed ids + favorites + local streak + per-subject completion).
     const viewedIds = Array.isArray(userStats.viewed) ? userStats.viewed : []
     const groups = {}
     for (const lec of lectures) {
      const name = lec.subjectAr || lec.subjectEn || '—'
      if (!groups[name]) groups[name] = { total: 0, watched: 0 }
      groups[name].total++
      if (viewedIds.includes(lec.id)) groups[name].watched++
     }
     const subjectProgress = Object.values(groups)
     setAchievements(computeAchievements({
      viewed: viewedIds,
      favorites: favs,
      streak: currentStreak(user.studentId),
      subjectProgress,
     }))
     const quotes = motivationalQuotes[lang] || motivationalQuotes.en
     setQuote(quotes[Math.floor(Math.random() * quotes.length)])
     setLogDates(Array.isArray(logs) ? logs.map((l) => String(l.timestamp || '').slice(0, 10)) : [])
    }
   } catch (err) {
    if (mounted) setError(err)
   }
   if (mounted) setLoading(false)
  }
  load()
  return () => { mounted = false }
 }, [user, lang, retryCount])

 const handleSave = async () => {
  try {
   // Client-side URL scheme guard (defense in depth — the DB also enforces it
   // server-side via safe_social_url in student_update_profile).
   const clean = {
    name: profileData.name.trim(),
    major: profileData.major.trim(),
    google: safeProfileUrl(profileData.google),
    linkedin: safeProfileUrl(profileData.linkedin),
    whatsapp: profileData.whatsapp.replace(/[^0-9]/g, '').slice(0, 15),
   }
   await studentUpdateProfile(clean)
   try { await addActivity('users', 'PROFILE_UPDATE', user.studentId) } catch (e) { /* non-critical */ }
   addStudentLog({
    type: 'UPDATE_PROFILE',
    detail: '',
    device: navigator.userAgent,
   }).catch(() => {})
   updateUser(clean)
   setProfileData(clean)
   toast.success(t('inline.profile.profile-updated'))
   setEditing(false)
  } catch (e) {
   toast.error(t('inline.profile.save-error'))
  }
 }

 const handleChangePassword = async () => {
  if (!pwForm.current || !pwForm.newPw) {
   toast.error(t('inline.profile.fill-all-fields'))
   return
  }
  if (pwForm.newPw.length < 8) {
   toast.error(t('inline.profile.password-must-be-at'))
   return
  }
  if (pwForm.newPw !== pwForm.confirm) {
   toast.error(t('inline.profile.passwords-do-not-match'))
   return
  }
  setPwSaving(true)
  try {
   const auth = await authenticateUser(user.studentId, pwForm.current)
   if (!auth.ok) {
    toast.error(t('inline.profile.current-password-is-incorrect'))
    setPwSaving(false)
    return
   }
   await resetPassword(user.studentId, pwForm.newPw, { email: user.email || '' })
   toast.success(t('inline.profile.password-changed-successfully'))
   setShowPasswordForm(false)
   setPwForm({ current: '', newPw: '', confirm: '' })
  } catch (e) {
   toast.error(t('inline.profile.failed-to-change-password'))
  }
  setPwSaving(false)
 }

 const inputClass = "w-full glass rounded-xl px-4 py-3 text-sm text-ink placeholder:text-slate-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"

 if (!user || user.role === 'admin') {
  return (
   <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-spatial-page">
    <p className="text-slate-500 dark:text-white/60">{t('profile.adminOnly')}</p>
   </div>
  )
 }

 if (error) return <ErrorState error={error} onRetry={retryLoad} />

 if (loading) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
     <Skeleton className="h-48 rounded-2xl" />
     <Skeleton className="h-64 rounded-2xl" />
     <Skeleton className="h-48 rounded-2xl" />
    </div>
   </div>
  )
 }

 return (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page ">

   {/* Motivational Quote Banner */}
   <motion.div variants={itemVariants} className="py-12 mb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
      initial={prefersReduced ? {} : { scale: 0.8, opacity: 0 }}
      animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
      transition={prefersReduced ? {} : { delay: 0.2, type: 'spring', damping: 15 }}
      className="relative w-[86px] h-[86px] mx-auto mb-6 rounded-full p-[3px] bg-[conic-gradient(from_120deg,#2563EB,#06B6D4,#7C3AED,#2563EB)] shadow-lg shadow-cyan-500/25"
     >
      <div className="w-full h-full rounded-full bg-gradient-to-br from-royal-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl tracking-wide" aria-hidden="true">
       {(user.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '?'}
      </div>
     </motion.div>
      <h1 className="text-2xl md:text-3xl font-bold text-ink mb-2">
      {t('profile.greeting', { name: user.name })}
     </h1>
      <p className="text-slate-500 dark:text-white/60 text-sm mb-4">{user.studentId}</p>
     <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2">
       <span className="text-slate-500 dark:text-white/50 text-sm italic">&ldquo;{quote}&rdquo;</span>
     </div>
    </div>
   </motion.div>

   <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    {/* Stats */}
    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
     {[
      { value: stats.viewed, label: t('profile.statsWatched'), icon: FiEye, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', delay: 0 },
      { value: stats.favorites, label: t('profile.statsFavorites'), icon: FiHeart, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10', delay: 0.1 },
      { value: stats.lectures, label: t('profile.statsTotal'), icon: FiBookOpen, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10', delay: 0.2 },
      { value: stats.sources || 0, label: t('inline.profile.sources'), icon: FiLink, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', delay: 0.3 },
     ].map((stat, i) => {
      const Icon = stat.icon
      return (
       <motion.div
        key={i}
        initial={prefersReduced ? {} : { opacity: 0, x: i % 2 === 0 ? 30 : -30, y: 10 }}
        animate={prefersReduced ? {} : { opacity: 1, x: 0, y: 0 }}
        transition={prefersReduced ? {} : { duration: 0.5, delay: stat.delay, type: 'spring', stiffness: 200 }}
        className={`stat-tile p-4 hover:scale-[1.02] transition-transform`}
       >
        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
         <Icon size={20} className={stat.color} />
        </div>
        <div>
         <motion.p
          initial={prefersReduced ? {} : { opacity: 0, scale: 0.5 }}
          animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
          transition={prefersReduced ? {} : { duration: 0.6, delay: stat.delay + 0.3, type: 'spring' }}
          className="font-bold text-ink text-xl"
         >
          {stat.value}
         </motion.p>
         <p className="text-xs text-slate-500 dark:text-white/50">{stat.label}</p>
        </div>
       </motion.div>
      )
     })}
    </motion.div>

    {/* Achievements — client-side badges from viewed/favorites/local streak */}
    <motion.div variants={itemVariants} className="glass rounded-xl p-6">
     <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
      <h2 className="text-lg font-bold text-ink flex items-center gap-2">
       <FiAward size={18} className="text-amber-400" />
       {t('inline.profile.achievements')}
      </h2>
      <span className="text-xs text-slate-500 dark:text-white/50 tabular-nums">
       {achievements.filter((a) => a.achieved).length} / {achievements.length}
      </span>
     </div>
     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {achievements.map((badge, i) => {
       const Icon = BADGE_ICONS[badge.icon] || FiAward
       const pct = badge.target > 0 ? Math.min(100, Math.round((badge.progress / badge.target) * 100)) : 0
       return (
        <motion.div
         key={badge.id}
         initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
         whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ delay: i * 0.04 }}
         className={`relative rounded-xl p-4 border transition-colors ${
          badge.achieved
            ? 'bg-gradient-to-br from-amber-500/10 to-cyan-400/5 border-amber-500/30'
            : 'bg-black/[0.03] dark:bg-white/[0.03] border-black/5 dark:border-white/5'
         }`}
         title={isArabic ? badge.descAr : badge.descEn}
        >
         <div className="flex items-start justify-between mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
           badge.achieved
            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
            : 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/30'
          }`}>
           <Icon size={18} />
          </div>
          {badge.achieved && <span className="text-emerald-500" aria-hidden="true"><FiCheckCircle size={16} /></span>}
         </div>
         <p className={`text-sm font-bold ${badge.achieved ? 'text-ink' : 'text-slate-500 dark:text-white/50'}`}>
          {isArabic ? badge.titleAr : badge.titleEn}
         </p>
         <p className="text-[11px] text-slate-500 dark:text-white/40 mt-0.5 leading-snug">
          {isArabic ? badge.descAr : badge.descEn}
         </p>
         {!badge.achieved && (
          <div className="mt-2 flex items-center gap-2">
           <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
             initial={prefersReduced ? {} : { width: 0 }}
             whileInView={{ width: `${pct}%` }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
             className="h-full bg-gradient-to-r from-royal-500 to-cyan-400 rounded-full"
            />
           </div>
           <span className="text-[10px] text-slate-400 dark:text-white/30 tabular-nums">{pct}%</span>
          </div>
         )}
        </motion.div>
       )
      })}
     </div>
    </motion.div>

    {/* Academic Progress & Record Card */}
    <motion.div variants={itemVariants} className="glass rounded-xl p-6 border border-royal-500/20 relative overflow-hidden">
     <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
       <h2 className="text-lg font-bold text-ink flex items-center gap-2">
        <FiBookOpen size={18} className="text-royal-500 dark:text-cyan-400" />
        {isArabic ? 'السجل الأكاديمي والتقدم التخصصي' : 'Academic Record & Curriculum Progress'}
       </h2>
       <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
        {isArabic ? 'مزامنة مباشرة مع الخطة التخصصية (136 ساعة معتمدة) وحاسبة المعدل' : 'Synced live with curriculum plan (136 credit hours) & GPA calculator'}
       </p>
      </div>
      <div className="flex items-center gap-2">
       <button
        onClick={() => setShowPrintReport(true)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-royal-500/10 hover:bg-royal-500/20 text-royal-600 dark:text-cyan-400 border border-royal-500/30 transition-colors"
       >
        <FiPrinter size={14} />
        {isArabic ? 'تصدير / طباعة السجل' : 'Export / Print Record'}
       </button>
       <button
        onClick={() => navigate('/study-plan')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg glass text-slate-600 dark:text-white/70 hover:text-ink transition-colors"
       >
        <FiExternalLink size={13} />
        {isArabic ? 'الخطة التخصصية' : 'Study Plan'}
       </button>
      </div>
     </div>

     {/* Progress Metrics Grid */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
      {/* Degree Completion Gauge */}
      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-line">
       <span className="text-xs text-slate-500 dark:text-white/50 block mb-1">
        {isArabic ? 'نسبة إنجاز الخطة التخصصية' : 'Curriculum Completion'}
       </span>
       <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-ink tabular-nums">{progressPct}%</span>
        <span className="text-xs text-slate-400">
         ({passedHours} / {totalCurriculumHours} {isArabic ? 'ساعة' : 'hrs'})
        </span>
       </div>
       <div className="mt-2.5 h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
         initial={prefersReduced ? {} : { width: 0 }}
         animate={{ width: `${progressPct}%` }}
         transition={{ duration: 0.8, ease: 'easeOut' }}
         className="h-full bg-gradient-to-r from-royal-500 via-cyan-400 to-emerald-400 rounded-full"
        />
       </div>
       <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1.5">
        {passedCourses.length} {isArabic ? 'مساق تم اجتيازه بنجاح' : 'courses completed'}
       </p>
      </div>

      {/* Current Standing / Year */}
      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-line">
       <span className="text-xs text-slate-500 dark:text-white/50 block mb-1">
        {isArabic ? 'المرحلة الدراسية التقديرية' : 'Estimated Academic Level'}
       </span>
       <p className="text-base font-bold text-ink flex items-center gap-1.5 mt-1">
        <FiAward className="text-amber-500 shrink-0" />
        <span>{academicLevelText}</span>
       </p>
       <p className="text-[11px] text-slate-500 dark:text-white/40 mt-2">
        {totalCurriculumHours - passedHours} {isArabic ? 'ساعة متبقية لمتطلبات التخرج' : 'hours remaining for graduation'}
       </p>
      </div>

      {/* Saved GPA Calculator Standing */}
      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-line">
       <span className="text-xs text-slate-500 dark:text-white/50 block mb-1">
        {isArabic ? 'المعدل التقديري المسجل' : 'Saved Estimated GPA'}
       </span>
       {savedGpaData ? (
        <>
         <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-ink tabular-nums">
           {savedGpaData.gpaPct}%
          </span>
          <span className="text-xs px-2 py-0.5 rounded font-bold bg-royal-500/10 text-royal-600 dark:text-cyan-400">
           {savedGpaData.standingAr}
          </span>
         </div>
         <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1.5">
          {isArabic ? `مبني على ${savedGpaData.totalHours} ساعة مسجلة في الحاسبة` : `Based on ${savedGpaData.totalHours} saved hours`}
         </p>
        </>
       ) : (
        <div>
         <p className="text-sm font-semibold text-slate-600 dark:text-white/70">
          {isArabic ? 'لم يتم الحساب بعد' : 'Not calculated yet'}
         </p>
         <button
          onClick={() => navigate('/study-plan')}
          className="text-[11px] text-cyan-500 dark:text-cyan-400 hover:underline mt-1.5 inline-block"
         >
          {isArabic ? 'احسب معدلك الفصلي والتراكمي الآن ←' : 'Calculate your GPA now →'}
         </button>
        </div>
       )}
      </div>
     </div>

     {/* Passed courses chips */}
     {passedCourses.length > 0 ? (
      <div className="pt-3 border-t border-line">
       <span className="text-xs font-semibold text-slate-600 dark:text-white/60 block mb-2">
        {isArabic ? 'المساقات المجتازة المسجلة:' : 'Recorded Passed Courses:'}
       </span>
       <div className="flex flex-wrap gap-1.5">
        {passedCourses.slice(0, 8).map((c) => (
         <span key={c.id} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
          ✓ {isArabic ? c.nameAr : c.nameEn} ({c.code})
         </span>
        ))}
        {passedCourses.length > 8 && (
         <span className="text-xs px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/50">
          +{passedCourses.length - 8} {isArabic ? 'مساقات أخرى' : 'more'}
         </span>
        )}
       </div>
      </div>
     ) : (
      <div className="pt-3 border-t border-line text-xs text-slate-500 dark:text-white/50 flex items-center justify-between">
       <span>{isArabic ? 'لم تقم بتحديد مساقاتك المجتازة بعد في الخطة.' : 'You have not marked passed courses in study plan yet.'}</span>
       <button
        onClick={() => navigate('/study-plan')}
        className="text-royal-600 dark:text-cyan-400 font-semibold hover:underline"
       >
        {isArabic ? 'فتح الخطة التخصصية وتحديد المساقات ←' : 'Open Study Plan →'}
       </button>
      </div>
     )}
    </motion.div>

    {/* Activity heatmap */}
    <motion.div variants={itemVariants} className="glass rounded-xl p-6">
     <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-ink flex items-center gap-2">
       <FiActivity size={18} className="text-accent" />
       {t('inline.profile.your-activity-12-weeks')}
      </h2>
     </div>
     <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex gap-[3px]" role="img" aria-label={t('inline.profile.12-week-activity-map')}>
       {heatmap.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
         {week.map((cell, di) => (
          <span
           key={di}
           title={`${cell.label} — ${cell.count} ${t('inline.profile.events')}`}
           className={`w-3 h-3 rounded-[3px] ${cell.future ? 'opacity-0 pointer-events-none' : cell.count === 0 ? HEAT_LEVELS[0] : cell.count < 3 ? HEAT_LEVELS[1] : cell.count < 6 ? HEAT_LEVELS[2] : HEAT_LEVELS[3]}`}
          />
         ))}
        </div>
       ))}
      </div>
      <div className="flex items-center gap-1.5">
       <span className="text-xs text-slate-500 dark:text-white/50">{t('inline.profile.more')}</span>
       {HEAT_LEVELS.map((lvl) => (
        <span key={lvl} aria-hidden="true" className={`w-3 h-3 rounded-[3px] ${lvl}`} />
       ))}
      </div>
     </div>
    </motion.div>

    {/* Profile Info */}
    <motion.div variants={itemVariants} className="glass rounded-xl p-6">
     <div className="flex items-center justify-between mb-6">
       <h2 className="text-lg font-bold text-ink flex items-center gap-2">
       <FiUser size={18} />
       {t('profile.personalInfo')}
      </h2>
      {editing ? (
       <div className="flex gap-2">
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium">
         <FiSave size={14} /> {t('profile.save')}
        </button>
        <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] glass text-slate-600 dark:text-white/60 rounded-xl text-sm font-medium">
         <FiX size={14} /> {t('profile.cancel')}
        </button>
       </div>
      ) : (
       <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium">
        <FiEdit2 size={14} /> {t('profile.edit')}
       </button>
      )}
     </div>

     <div className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('profile.name')}</label>
       {editing ? (
        <input id="profile-name" name="name" autoComplete="name" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} className={inputClass} />
       ) : (
         <p className="text-ink font-medium">{profileData.name || '—'}</p>
       )}
      </div>
      <div>
        <label htmlFor="profile-major" className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('profile.major')}</label>
       {editing ? (
        <input id="profile-major" name="major" value={profileData.major} onChange={e => setProfileData(p => ({ ...p, major: e.target.value }))} placeholder={t('profile.majorPlaceholder')} className={inputClass} />
       ) : (
         <p className="text-ink font-medium">{profileData.major || '—'}</p>
       )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <div>
         <label htmlFor="profile-google" className="block text-xs text-slate-500 dark:text-white/60 mb-1 flex items-center gap-1"><FiGlobe size={12} /> Google</label>
        {editing ? (
         <input id="profile-google" name="google" type="url" autoComplete="url" value={profileData.google} onChange={e => setProfileData(p => ({ ...p, google: e.target.value }))} placeholder="https://..." className={inputClass} />
        ) : (
         profileData.google ? (
           <a href={profileData.google} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm underline">{t('profile.google')}</a>
          ) : <p className="text-slate-500 dark:text-white/50">—</p>
        )}
       </div>
       <div>
         <label htmlFor="profile-linkedin" className="block text-xs text-slate-500 dark:text-white/60 mb-1 flex items-center gap-1"><FiLinkedin size={12} /> LinkedIn</label>
        {editing ? (
         <input id="profile-linkedin" name="linkedin" type="url" autoComplete="url" value={profileData.linkedin} onChange={e => setProfileData(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." className={inputClass} />
        ) : (
         profileData.linkedin ? (
           <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm underline">LinkedIn</a>
          ) : <p className="text-slate-500 dark:text-white/50">—</p>
        )}
       </div>
       <div>
         <label htmlFor="profile-whatsapp" className="block text-xs text-slate-500 dark:text-white/60 mb-1 flex items-center gap-1"><FiPhone size={12} /> {t('profile.whatsapp')}</label>
        {editing ? (
         <input id="profile-whatsapp" name="whatsapp" type="tel" autoComplete="tel" inputMode="numeric" value={profileData.whatsapp} onChange={e => setProfileData(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+970..." className={inputClass} />
        ) : (
         profileData.whatsapp ? (
           <a href={`https://wa.me/${profileData.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm underline">{profileData.whatsapp}</a>
          ) : <p className="text-slate-500 dark:text-white/50">—</p>
        )}
       </div>
      </div>
     </div>
    </motion.div>

    {/* Password Change */}
    <motion.div variants={itemVariants} className="glass rounded-xl p-6">
     <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-ink flex items-center gap-2">
       <FiLock size={18} />
       {t('inline.profile.change-password')}
      </h2>
      {!showPasswordForm && (
       <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium">
        <FiLock size={14} /> {t('inline.profile.change')}
       </button>
      )}
     </div>
     {showPasswordForm ? (
      <div className="space-y-4">
       <div>
        <label htmlFor="profile-current-password" className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('inline.profile.current-password')}</label>
        <input id="profile-current-password" name="currentPassword" type="password" autoComplete="current-password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} className={inputClass} />
       </div>
       <div>
        <label htmlFor="profile-new-password" className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('inline.profile.new-password')}</label>
        <input id="profile-new-password" name="newPassword" type="password" autoComplete="new-password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} className={inputClass} />
        {pwForm.newPw && pwForm.newPw.length < 8 && (
         <p className="text-xs text-amber-500 mt-1">{t('inline.profile.at-least-8-characters')}</p>
        )}
       </div>
       <div>
        <label htmlFor="profile-confirm-password" className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('inline.profile.confirm-password')}</label>
        <input id="profile-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} className={inputClass} />
        {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
         <p className="text-xs text-red-500 mt-1">{t('inline.profile.passwords-do-not-match-2')}</p>
        )}
       </div>
       <div className="flex gap-2">
        <button onClick={handleChangePassword} disabled={pwSaving} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium disabled:opacity-50">
         <FiSave size={14} /> {pwSaving ? (t('inline.profile.saving')) : (t('inline.profile.save'))}
        </button>
        <button onClick={() => { setShowPasswordForm(false); setPwForm({ current: '', newPw: '', confirm: '' }) }} className="flex items-center gap-2 px-4 py-2 min-h-[44px] glass text-slate-600 dark:text-white/60 rounded-xl text-sm font-medium">
         <FiX size={14} /> {t('profile.cancel')}
        </button>
       </div>
      </div>
     ) : (
      <p className="text-sm text-slate-500 dark:text-white/60">{t('inline.profile.no-password-changes-yet')}</p>
     )}
    </motion.div>

     {/* Back button */}
    <motion.div variants={itemVariants} className="text-center">
      <button onClick={() => navigate('/home')} className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-accent hover:text-royal-600 dark:hover:text-cyan-300 font-medium text-sm transition-colors">
      <FiArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
      {t('profile.backToHome')}
     </button>
    </motion.div>
   </div>

   {/* Printable Academic Report Modal */}
   {showPrintReport && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
     <div className="bg-white dark:bg-slate-900 border border-line rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-6 print:text-black print:bg-white print:overflow-visible">
      {/* Modal Actions - Hidden when printing */}
      <div className="flex items-center justify-between pb-4 border-b border-line mb-6 print:hidden">
       <h3 className="font-bold text-lg text-ink flex items-center gap-2">
        <FiPrinter className="text-royal-500" />
        {isArabic ? 'تقرير السجل الأكاديمي الرسمي' : 'Official Academic Record Report'}
       </h3>
       <div className="flex items-center gap-2">
        <button
         onClick={() => window.print()}
         className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-royal-600 text-white font-semibold text-sm hover:bg-royal-700 shadow-md shadow-royal-600/20 transition"
        >
         <FiPrinter size={15} />
         {isArabic ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}
        </button>
        <button
         onClick={() => setShowPrintReport(false)}
         className="p-2 rounded-xl text-slate-500 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
         <FiX size={18} />
        </button>
       </div>
      </div>

      {/* Official Printable Content */}
      <div className="space-y-6 text-start">
       {/* University & College Header */}
       <div className="text-center border-b pb-4 border-slate-200 dark:border-white/10 print:border-slate-300">
        <h2 className="text-2xl font-extrabold text-royal-600 dark:text-cyan-400 print:text-blue-900">
         {isArabic ? 'جامعة الأزهر - غزة' : 'Al-Azhar University - Gaza'}
        </h2>
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 print:text-slate-800 mt-0.5">
         {isArabic ? 'كلية تكنولوجيا المعلومات والاتصالات' : 'Faculty of Information Technology'}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">
         {isArabic ? 'ملخص السجل الأكاديمي ومسار الخطة الدراسية للطالب' : 'Student Academic Plan & Record Summary'}
        </p>
       </div>

       {/* Student Profile Card */}
       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 print:bg-slate-50 border border-slate-200 dark:border-white/10 print:border-slate-300 text-xs">
        <div>
         <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block">{isArabic ? 'اسم الطالب:' : 'Student Name:'}</span>
         <span className="font-bold text-ink print:text-black text-sm">{user.name || '—'}</span>
        </div>
        <div>
         <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block">{isArabic ? 'الرقم الجامعي:' : 'Student ID:'}</span>
         <span className="font-mono font-bold text-ink print:text-black text-sm">{user.studentId}</span>
        </div>
        <div>
         <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block">{isArabic ? 'التخصص:' : 'Major:'}</span>
         <span className="font-bold text-ink print:text-black">{profileData.major || (isArabic ? activePlan.nameAr : activePlan.nameEn)}</span>
        </div>
        <div>
         <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block">{isArabic ? 'الساعات المنجزة:' : 'Passed Hours:'}</span>
         <span className="font-bold text-emerald-600 print:text-emerald-700">{passedHours} / {totalCurriculumHours} {isArabic ? 'ساعة' : 'hrs'}</span>
        </div>
        <div>
         <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block">{isArabic ? 'نسبة الإنجاز:' : 'Progress:'}</span>
         <span className="font-bold text-royal-600 print:text-blue-800">{progressPct}%</span>
        </div>
        <div>
         <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block">{isArabic ? 'المرحلة الدراسية:' : 'Standing:'}</span>
         <span className="font-medium text-slate-700 dark:text-white/80 print:text-black">{academicLevelText}</span>
        </div>
       </div>

       {/* Completed Courses Table */}
       <div>
        <h4 className="font-bold text-sm text-ink print:text-black mb-2 flex items-center gap-1.5">
         <FiCheckSquare className="text-emerald-500" />
         {isArabic ? `المساقات المجتازة من الخطة الأكاديمية (${totalCurriculumHours} ساعة - خطة ${activePlan.planNumber}):` : `Completed Curriculum Courses (${totalCurriculumHours} hrs - Plan #${activePlan.planNumber}):`}
        </h4>
        {passedCourses.length === 0 ? (
         <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed rounded-xl">
          {isArabic ? 'لم يتم تحديد مساقات مجتازة في الخطة بعد.' : 'No completed courses recorded yet.'}
         </p>
        ) : (
         <div className="border border-slate-200 dark:border-white/10 print:border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-start">
           <thead className="bg-slate-100 dark:bg-white/5 print:bg-slate-100 text-slate-600 dark:text-white/70 print:text-slate-800">
            <tr>
             <th className="p-2.5 text-start font-semibold">#</th>
             <th className="p-2.5 text-start font-semibold">{isArabic ? 'رمز المساق' : 'Code'}</th>
             <th className="p-2.5 text-start font-semibold">{isArabic ? 'اسم المساق' : 'Course Title'}</th>
             <th className="p-2.5 text-start font-semibold">{isArabic ? 'الساعات' : 'Hours'}</th>
             <th className="p-2.5 text-start font-semibold">{isArabic ? 'المستوى' : 'Level'}</th>
            </tr>
           </thead>
           <tbody className="divide-y divide-slate-200 dark:divide-white/10 print:divide-slate-200">
            {passedCourses.map((c, idx) => (
             <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
              <td className="p-2 text-slate-500">{idx + 1}</td>
              <td className="p-2 font-mono font-bold text-royal-600 dark:text-cyan-400 print:text-blue-900">{c.code}</td>
              <td className="p-2 font-medium text-ink print:text-black">{isArabic ? c.nameAr : c.nameEn}</td>
              <td className="p-2 text-slate-600 dark:text-white/70 print:text-black">{c.hours}</td>
              <td className="p-2 text-slate-500 print:text-slate-600">{isArabic ? `س${c.year} - ف${c.semester}` : `Y${c.year} - S${c.semester}`}</td>
             </tr>
            ))}
           </tbody>
          </table>
         </div>
        )}
       </div>

       {/* Saved GPA Section if available */}
       {savedGpaData && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 print:border-slate-300 bg-slate-50 dark:bg-white/5 print:bg-slate-50">
         <h5 className="font-bold text-xs text-ink print:text-black mb-1.5">
          {isArabic ? 'بيانات المعدل الفصلي التقديري المسجل:' : 'Saved Estimated Semester GPA:'}
         </h5>
         <div className="flex items-center gap-6 text-xs print:text-black">
          <span>{isArabic ? 'المعدل التقديري:' : 'GPA:'} <strong className="text-royal-600 dark:text-cyan-400 print:text-blue-900 text-sm">{savedGpaData.gpaPct}%</strong></span>
          <span>{isArabic ? 'التقدير الأكاديمي:' : 'Standing:'} <strong>{savedGpaData.standingAr}</strong></span>
          <span>{isArabic ? 'الساعات المحتسبة:' : 'Hours:'} <strong>{savedGpaData.totalHours} {isArabic ? 'ساعة' : 'hrs'}</strong></span>
         </div>
        </div>
       )}

       {/* Footer Stamp / Note */}
       <div className="pt-4 border-t border-slate-200 dark:border-white/10 print:border-slate-300 flex justify-between items-center text-[11px] text-slate-400 print:text-slate-500">
        <span>{isArabic ? 'بوابة ملتقى كلية تكنولوجيا المعلومات - جامعة الأزهر' : 'Al-Azhar IT Hub Platform'}</span>
        <span>{isArabic ? 'وثيقة دراسية إرشادية شخصية' : 'Personal Academic Guidance Record'}</span>
       </div>
      </div>
     </div>
    </div>
   )}
  </motion.div>
 )
}
