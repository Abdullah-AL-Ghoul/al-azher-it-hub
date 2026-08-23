import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUser, FiEye, FiHeart, FiStar, FiClock, FiLinkedin, FiArrowRight, FiLogIn, FiMessageSquare, FiCpu } from 'react-icons/fi'
import { getUserStats, getFavorites, getRatings, getStudentLogs } from '../../services'
import { useLanguage } from '../../context/LanguageContext'
import { useScrollLock } from '../../hooks/useScrollLock'
import { useFocusTrap } from '../../hooks/useFocusTrap'

const ACTION_CONFIG = {
 LOGIN: { icon: FiLogIn, color: 'text-emerald-500', bg: 'bg-emerald-500/10', labelAr: 'تسجيل دخول', labelEn: 'Login' },
 VIEW_LECTURE: { icon: FiEye, color: 'text-violet-500', bg: 'bg-violet-500/10', labelAr: 'مشاهدة محاضرة', labelEn: 'Viewed Lecture' },
 VIEW_SOURCE: { icon: FiEye, color: 'text-cyan-500', bg: 'bg-cyan-500/10', labelAr: 'مشاهدة مصدر', labelEn: 'Viewed Source' },
 ADD_FAVORITE: { icon: FiHeart, color: 'text-rose-500', bg: 'bg-rose-500/10', labelAr: 'إضافة مفضلة', labelEn: 'Added Favorite' },
 RATE_LECTURE: { icon: FiStar, color: 'text-amber-500', bg: 'bg-amber-500/10', labelAr: 'تقييم محاضرة', labelEn: 'Rated Lecture' },
 ADD_COMMENT: { icon: FiMessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', labelAr: 'إضافة تعليق', labelEn: 'Added Comment' },
 USE_CHATBOT: { icon: FiCpu, color: 'text-purple-500', bg: 'bg-purple-500/10', labelAr: 'استخدام الشات بوت', labelEn: 'Used Chatbot' },
 UPDATE_PROFILE: { icon: FiUser, color: 'text-amber-500', bg: 'bg-amber-500/10', labelAr: 'تحديث ملف', labelEn: 'Updated Profile' },
}

function StudentProfileModal({ student, isOpen, onClose }) {
 const { lang } = useLanguage()
 const isArabic = lang === 'ar'
 const [stats, setStats] = useState({ viewed: [], lastVisit: null })
 const [favorites, setFavorites] = useState([])
 const [ratings, setRatings] = useState({})
 const [logs, setLogs] = useState([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  if (!isOpen || !student?.studentId) return
  let cancelled = false
  setLoading(true)
  Promise.all([
   getUserStats(student.studentId).catch(() => ({ viewed: [], lastVisit: null })),
   getFavorites(student.studentId).catch(() => []),
   getRatings(student.studentId).catch(() => ({})),
   getStudentLogs(student.studentId).catch(() => []),
  ]).then(([s, f, r, l]) => {
   if (cancelled) return
   setStats(s)
   setFavorites(f)
   setRatings(r)
   setLogs(l)
   setLoading(false)
  })
  return () => { cancelled = true }
 }, [isOpen, student?.studentId])

 useScrollLock(isOpen)

 const trapRef = useFocusTrap(isOpen)

 useEffect(() => {
  if (!isOpen) return
  const onKey = (e) => { if (e.key === 'Escape') onClose() }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
 }, [isOpen, onClose])

  const ratingsMap = ratings || {}
  const ratingsValues = Object.values(ratingsMap)
  const ratingsCount = ratingsValues.length
  const avgRating = ratingsCount ? (ratingsValues.reduce((a, b) => a + b, 0) / ratingsCount).toFixed(1) : '—'

  return (
   <AnimatePresence>
    {isOpen && student && (
    <motion.div
     key="student-profile-modal"
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     className="fixed inset-0 z-50 flex items-center justify-center p-4"
     role="dialog"
     aria-modal="true"
     aria-label={student.name || student.studentId}
    >
     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
     <motion.div
      ref={trapRef}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
     className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700"
    >
     {/* Header */}
     <div className="sticky top-0 z-10 bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-xl bg-royal-500/10 flex items-center justify-center">
        <FiUser size={20} className="text-royal-500" />
       </div>
       <div>
        <h2 className="font-bold text-navy-900 dark:text-white">{student.name || student.studentId}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 ">{student.studentId}</p>
       </div>
      </div>
      <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
       <FiX size={20} />
      </button>
     </div>

     <div className="overflow-y-auto max-h-[calc(85vh-72px)] p-6 space-y-6">
      {loading ? (
       <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-royal-500 border-t-transparent rounded-full animate-spin" />
       </div>
      ) : (
       <>
        {/* Account Info */}
        <div className="glass rounded-xl p-4 border border-white/10">
         <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
          <FiUser size={14} className="text-royal-500" />
          {isArabic ? 'معلومات الحساب' : 'Account Info'}
         </h3>
         <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
           <span className="text-slate-500 dark:text-slate-400 ">{isArabic ? 'الاسم' : 'Name'}</span>
           <p className="text-navy-900 dark:text-white font-medium">{student.name || '—'}</p>
          </div>
          <div>
           <span className="text-slate-500 dark:text-slate-400 ">{isArabic ? 'الرقم الجامعي' : 'Student ID'}</span>
           <p className="text-navy-900 dark:text-white font-medium">{student.studentId}</p>
          </div>
          <div>
           <span className="text-slate-500 dark:text-slate-400 ">{isArabic ? 'التخصص' : 'Major'}</span>
           <p className="text-navy-900 dark:text-white font-medium">{student.major || '—'}</p>
          </div>
          <div>
           <span className="text-slate-500 dark:text-slate-400 ">{isArabic ? 'البريد الإلكتروني' : 'Email'}</span>
           <p className="text-navy-900 dark:text-white font-medium">{student.email || '—'}</p>
          </div>
          {student.linkedin && (
           <div className="col-span-2">
            <a href={student.linkedin} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-600 text-sm flex items-center gap-1">
             <FiLinkedin size={14} /> LinkedIn
            </a>
           </div>
          )}
          {student.createdAt && (
           <div className="col-span-2">
            <span className="text-slate-500 dark:text-slate-400 ">{isArabic ? 'تاريخ التسجيل' : 'Registered'}</span>
            <p className="text-navy-900 dark:text-white font-medium">{new Date(student.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en')}</p>
           </div>
          )}
         </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
         <div className="glass rounded-xl p-3 border border-white/10 text-center">
          <FiEye size={20} className="mx-auto text-violet-500 mb-1" />
          <p className="text-xl font-bold text-navy-900 dark:text-white">{stats.viewed?.length || 0}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 ">{isArabic ? 'مشاهدة' : 'Viewed'}</p>
         </div>
         <div className="glass rounded-xl p-3 border border-white/10 text-center">
          <FiHeart size={20} className="mx-auto text-rose-500 mb-1" />
          <p className="text-xl font-bold text-navy-900 dark:text-white">{favorites.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 ">{isArabic ? 'مفضلة' : 'Favorites'}</p>
         </div>
         <div className="glass rounded-xl p-3 border border-white/10 text-center">
          <FiStar size={20} className="mx-auto text-amber-500 mb-1" />
          <p className="text-xl font-bold text-navy-900 dark:text-white">{ratingsCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 ">{isArabic ? 'تقييم' : 'Ratings'}</p>
         </div>
         <div className="glass rounded-xl p-3 border border-white/10 text-center">
          <FiClock size={20} className="mx-auto text-cyan-500 mb-1" />
          <p className="text-sm font-bold text-navy-900 dark:text-white">
           {stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString(isArabic ? 'ar' : 'en') : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 ">{isArabic ? 'آخر زيارة' : 'Last Visit'}</p>
         </div>
        </div>

        {/* Average Rating */}
        {ratingsCount > 0 && (
         <div className="glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
           <span className="text-sm text-slate-500 dark:text-slate-400 ">{isArabic ? 'متوسط التقييم' : 'Average Rating'}</span>
           <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-500">{avgRating}</span>
            <FiStar size={16} className="text-amber-500 fill-amber-500" />
           </div>
          </div>
          <div className="mt-2 flex gap-1">
           {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
             <div
              className="h-full bg-amber-500 rounded-full"
              style={{
               width: `${ratingsCount > 0 ? (ratingsValues.filter(v => v === s).length / ratingsCount) * 100 : 0}%`
              }}
             />
            </div>
           ))}
          </div>
         </div>
        )}

        {/* Activity Timeline */}
        <div className="glass rounded-xl p-4 border border-white/10">
         <h3 className="text-sm font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
          <FiClock size={14} className="text-royal-500" />
          {isArabic ? 'سجل النشاط' : 'Activity Log'}
         </h3>
         {logs.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">{isArabic ? 'لا يوجد نشاط' : 'No activity yet'}</p>
         ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
           {logs.slice(0, 30).map((log) => {
            const config = ACTION_CONFIG[log.type] || { icon: FiArrowRight, color: 'text-slate-500', bg: 'bg-slate-500/10', labelAr: log.type, labelEn: log.type }
            const Icon = config.icon
            return (
             <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
               <Icon size={14} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
               <p className="text-sm text-navy-900 dark:text-white">{isArabic ? config.labelAr : config.labelEn}</p>
               {log.detail && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.detail}</p>}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
               {new Date(log.timestamp).toLocaleString(isArabic ? 'ar' : 'en')}
              </span>
             </div>
            )
           })}
          </div>
         )}
        </div>
       </>
      )}
      </div>
     </motion.div>
    </motion.div>
    )}
   </AnimatePresence>
  )
}

export default memo(StudentProfileModal)
