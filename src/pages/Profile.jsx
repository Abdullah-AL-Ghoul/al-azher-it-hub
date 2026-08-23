import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import {
 getLectures, getFavorites, getUserStats, getSources,
 studentUpdateProfile, addActivity, addStudentLog, resetPassword, authenticateUser
} from '../services'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { FiUser, FiEdit2, FiSave, FiX, FiLinkedin, FiMail, FiPhone, FiGlobe, FiBookOpen, FiHeart, FiEye, FiArrowLeft, FiLink, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import motivationalQuotes from '../data/quotes'
import ErrorState from '../components/feedback/ErrorState'

const containerVariants = pageContainer
const itemVariants = pageItem

export default function Profile() {
 const { lang, t } = useLanguage()
 const { user } = useAuth()
 const prefersReduced = useReducedMotion()
 const navigate = useNavigate()
 const isArabic = lang === 'ar'

 useEffect(() => {
  document.title = isArabic ? 'الملف الشخصي - AL-Azher IT Hub' : 'Profile - AL-Azher IT Hub'
 }, [isArabic])
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

 const retryLoad = () => {
  setError(null)
  setLoading(true)
  setRetryCount(c => c + 1)
 }

 useEffect(() => {
  if (!user || user.role === 'admin') return
  let mounted = true
  async function load() {
   try {
    const [lectures, favs, userStats, sources] = await Promise.all([
     getLectures(),
     getFavorites(user.studentId),
     getUserStats(user.studentId),
     getSources(),
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
   await studentUpdateProfile({
    name: profileData.name,
    major: profileData.major,
    google: profileData.google,
    linkedin: profileData.linkedin,
    whatsapp: profileData.whatsapp,
   })
   try { await addActivity('users', 'PROFILE_UPDATE', user.studentId) } catch (e) { /* non-critical */ }
   addStudentLog({
    studentId: user.studentId,
    name: user.name,
    type: 'UPDATE_PROFILE',
    detail: 'تحديث الملف الشخصي',
    ip: '',
    device: navigator.userAgent,
   }).catch(() => {})
   toast.success(isArabic ? 'تم حفظ المعلومات' : 'Profile updated')
   setEditing(false)
  } catch (e) {
   toast.error(isArabic ? 'خطأ في الحفظ' : 'Save error')
  }
 }

 const handleChangePassword = async () => {
  if (!pwForm.current || !pwForm.newPw) {
   toast.error(isArabic ? 'املأ جميع الحقول' : 'Fill all fields')
   return
  }
  if (pwForm.newPw.length < 6) {
   toast.error(isArabic ? 'كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters')
   return
  }
  if (pwForm.newPw !== pwForm.confirm) {
   toast.error(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
   return
  }
  setPwSaving(true)
  try {
   const auth = await authenticateUser(user.studentId, pwForm.current)
   if (!auth.ok) {
    toast.error(isArabic ? 'كلمة المرور الحالية خاطئة' : 'Current password is incorrect')
    setPwSaving(false)
    return
   }
   await resetPassword(user.studentId, pwForm.newPw, { email: user.email || '' })
   toast.success(isArabic ? 'تم تغيير كلمة المرور' : 'Password changed successfully')
   setShowPasswordForm(false)
   setPwForm({ current: '', newPw: '', confirm: '' })
  } catch (e) {
   toast.error(isArabic ? 'خطأ في تغيير كلمة المرور' : 'Failed to change password')
  }
  setPwSaving(false)
 }

 const inputClass = "w-full glass rounded-xl px-4 py-3 text-sm text-navy-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"

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
     <div className="skeleton h-48 rounded-2xl" />
     <div className="skeleton h-64 rounded-2xl" />
     <div className="skeleton h-48 rounded-2xl" />
    </div>
   </div>
  )
 }

 return (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page grain">

   {/* Motivational Quote Banner */}
   <motion.div variants={itemVariants} className="py-12 mb-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
     <motion.div
      initial={prefersReduced ? {} : { scale: 0.8, opacity: 0 }}
      animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
      transition={prefersReduced ? {} : { delay: 0.2, type: 'spring', damping: 15 }}
      className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-lg shadow-cyan-500/20"
     >
      {user.name?.charAt(0)?.toUpperCase()}
     </motion.div>
      <h1 className="text-2xl md:text-3xl font-bold text-navy-900 dark:text-white mb-2">
      {t('profile.greeting', { name: user.name })}
     </h1>
      <p className="text-slate-500 dark:text-white/60 text-sm mb-4">{user.studentId}</p>
     <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2">
       <span className="text-slate-500 dark:text-white/50 text-sm italic">"{quote}"</span>
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
      { value: stats.sources || 0, label: isArabic ? 'المصادر' : 'Sources', icon: FiLink, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', delay: 0.3 },
     ].map((stat, i) => {
      const Icon = stat.icon
      return (
       <motion.div
        key={i}
        initial={prefersReduced ? {} : { opacity: 0, x: i % 2 === 0 ? 30 : -30, y: 10 }}
        animate={prefersReduced ? {} : { opacity: 1, x: 0, y: 0 }}
        transition={prefersReduced ? {} : { duration: 0.5, delay: stat.delay, type: 'spring', stiffness: 200 }}
        className={`glass rounded-xl p-4 border ${stat.border} flex items-center gap-3 hover:scale-[1.02] transition-transform`}
       >
        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
         <Icon size={20} className={stat.color} />
        </div>
        <div>
         <motion.p
          initial={prefersReduced ? {} : { opacity: 0, scale: 0.5 }}
          animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
          transition={prefersReduced ? {} : { duration: 0.6, delay: stat.delay + 0.3, type: 'spring' }}
          className="font-bold text-navy-900 dark:text-white text-xl"
         >
          {stat.value}
         </motion.p>
         <p className="text-xs text-slate-500 dark:text-white/50">{stat.label}</p>
        </div>
       </motion.div>
      )
     })}
    </motion.div>

    {/* Profile Info */}
    <motion.div variants={itemVariants} className="glass rounded-xl p-6">
     <div className="flex items-center justify-between mb-6">
       <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
       <FiUser size={18} />
       {t('profile.personalInfo')}
      </h2>
      {editing ? (
       <div className="flex gap-2">
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium">
         <FiSave size={14} /> {t('profile.save')}
        </button>
        <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-white/60 rounded-xl text-sm font-medium">
         <FiX size={14} /> {t('profile.cancel')}
        </button>
       </div>
      ) : (
       <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium">
        <FiEdit2 size={14} /> {t('profile.edit')}
       </button>
      )}
     </div>

     <div className="space-y-4">
      <div>
        <label className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('profile.name')}</label>
       {editing ? (
        <input value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} className={inputClass} />
       ) : (
         <p className="text-navy-900 dark:text-white font-medium">{profileData.name || '—'}</p>
       )}
      </div>
      <div>
        <label className="block text-xs text-slate-500 dark:text-white/60 mb-1">{t('profile.major')}</label>
       {editing ? (
        <input value={profileData.major} onChange={e => setProfileData(p => ({ ...p, major: e.target.value }))} placeholder={t('profile.majorPlaceholder')} className={inputClass} />
       ) : (
         <p className="text-navy-900 dark:text-white font-medium">{profileData.major || '—'}</p>
       )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <div>
         <label className="block text-xs text-slate-500 dark:text-white/60 mb-1 flex items-center gap-1"><FiGlobe size={12} /> Google</label>
        {editing ? (
         <input value={profileData.google} onChange={e => setProfileData(p => ({ ...p, google: e.target.value }))} placeholder="https://..." className={inputClass} />
        ) : (
         profileData.google ? (
           <a href={profileData.google} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm underline">{t('profile.google')}</a>
          ) : <p className="text-slate-500 dark:text-white/50">—</p>
        )}
       </div>
       <div>
         <label className="block text-xs text-slate-500 dark:text-white/60 mb-1 flex items-center gap-1"><FiLinkedin size={12} /> LinkedIn</label>
        {editing ? (
         <input value={profileData.linkedin} onChange={e => setProfileData(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." className={inputClass} />
        ) : (
         profileData.linkedin ? (
           <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm underline">LinkedIn</a>
          ) : <p className="text-slate-500 dark:text-white/50">—</p>
        )}
       </div>
       <div>
         <label className="block text-xs text-slate-500 dark:text-white/60 mb-1 flex items-center gap-1"><FiPhone size={12} /> {t('profile.whatsapp')}</label>
        {editing ? (
         <input value={profileData.whatsapp} onChange={e => setProfileData(p => ({ ...p, whatsapp: e.target.value }))} placeholder="+970..." className={inputClass} />
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
      <h2 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
       <FiLock size={18} />
       {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
      </h2>
      {!showPasswordForm && (
       <button onClick={() => setShowPasswordForm(true)} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium">
        <FiLock size={14} /> {isArabic ? 'تغيير' : 'Change'}
       </button>
      )}
     </div>
     {showPasswordForm ? (
      <div className="space-y-4">
       <div>
        <label className="block text-xs text-slate-500 dark:text-white/60 mb-1">{isArabic ? 'كلمة المرور الحالية' : 'Current Password'}</label>
        <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} className={inputClass} />
       </div>
       <div>
        <label className="block text-xs text-slate-500 dark:text-white/60 mb-1">{isArabic ? 'كلمة المرور الجديدة' : 'New Password'}</label>
        <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} className={inputClass} />
        {pwForm.newPw && pwForm.newPw.length < 6 && (
         <p className="text-xs text-amber-500 mt-1">{isArabic ? '6 أحرف على الأقل' : 'At least 6 characters'}</p>
        )}
       </div>
       <div>
        <label className="block text-xs text-slate-500 dark:text-white/60 mb-1">{isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
        <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} className={inputClass} />
        {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
         <p className="text-xs text-red-500 mt-1">{isArabic ? 'غير متطابقة' : 'Passwords do not match'}</p>
        )}
       </div>
       <div className="flex gap-2">
        <button onClick={handleChangePassword} disabled={pwSaving} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium disabled:opacity-50">
         <FiSave size={14} /> {pwSaving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
        </button>
        <button onClick={() => { setShowPasswordForm(false); setPwForm({ current: '', newPw: '', confirm: '' }) }} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-white/60 rounded-xl text-sm font-medium">
         <FiX size={14} /> {t('profile.cancel')}
        </button>
       </div>
      </div>
     ) : (
      <p className="text-sm text-slate-500 dark:text-white/60">{isArabic ? 'لم يتم تغيير كلمة المرور بعد' : 'No password changes yet'}</p>
     )}
    </motion.div>

    {/* Back button */}
    <motion.div variants={itemVariants} className="text-center">
      <button onClick={() => navigate('/home')} className="inline-flex items-center gap-2 text-royal-500 dark:text-cyan-400 hover:text-royal-600 dark:hover:text-cyan-300 font-medium text-sm transition-colors">
      <FiArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
      {t('profile.backToHome')}
     </button>
    </motion.div>
   </div>
  </motion.div>
 )
}
