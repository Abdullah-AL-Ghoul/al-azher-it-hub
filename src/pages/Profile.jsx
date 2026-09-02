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
import { pageContainer, pageItem } from '../utils/motionTokens'
import { FiUser, FiEdit2, FiSave, FiX, FiLinkedin, FiPhone, FiGlobe, FiBookOpen, FiHeart, FiEye, FiArrowLeft, FiLink, FiLock, FiActivity } from 'react-icons/fi'
import toast from 'react-hot-toast'
import motivationalQuotes from '../data/quotes'
import ErrorState from '../components/feedback/ErrorState'
import Skeleton from '../components/shared/Skeleton'

const containerVariants = pageContainer
const itemVariants = pageItem

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
 const [quote, setQuote] = useState('')
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [retryCount, setRetryCount] = useState(0)
 const [showPasswordForm, setShowPasswordForm] = useState(false)
 const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
 const [pwSaving, setPwSaving] = useState(false)
 const [logDates, setLogDates] = useState([])

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
  </motion.div>
 )
}
