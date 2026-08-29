import { useEffect, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiBookOpen, FiVideo, FiFile, FiEye, FiStar, FiUsers } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import { useScrollLock } from '../../hooks/useScrollLock'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { getAllUserStats, getAllRatings } from '../../services/adminStats'
import { computeCourseStats } from '../../utils/courseStats'

function CourseProfileModal({ course, lectures = [], sources = [], isOpen, onClose }) {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [stats, setStats] = useState({ courseLectures: [], courseSources: [], views: 0, ratings: [], perLecture: [], ratingsCount: 0, avgRating: '—', topViews: 0 })

  useEffect(() => {
    if (!isOpen || !course) return
    let cancelled = false
    setStats({ courseLectures: [], courseSources: [], views: 0, ratings: [], perLecture: [], ratingsCount: 0, avgRating: '—', topViews: 0 })
    Promise.all([getAllUserStats().catch(() => []), getAllRatings().catch(() => [])])
      .then(([userStats, allRatings]) => {
        if (cancelled) return
        setStats(computeCourseStats(course, lectures, sources, userStats, allRatings))
      })
    return () => { cancelled = true }
  }, [isOpen, course, lectures, sources])

  useScrollLock(isOpen)

  const trapRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const { courseLectures, courseSources, views, ratings, perLecture, ratingsCount, avgRating, topViews } = stats

  return (
    <AnimatePresence>
      {isOpen && course && (
        <motion.div
          key="course-profile-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={course.nameAr || course.nameEn}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            ref={trapRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-200 dark:border-slate-700"
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-navy-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FiBookOpen size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-bold text-ink">{isArabic ? course.nameAr : course.nameEn}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isArabic ? `الدكتور: ${course.doctorAr || '—'}` : `Doctor: ${course.doctorEn || '—'}`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-72px)] p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <FiVideo size={20} className="mx-auto text-violet-500 mb-1" />
                  <p className="text-xl font-bold text-ink">{courseLectures.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isArabic ? 'المحاضرات' : 'Lectures'}</p>
                </div>
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <FiFile size={20} className="mx-auto text-cyan-500 mb-1" />
                  <p className="text-xl font-bold text-ink">{courseSources.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isArabic ? 'المصادر' : 'Sources'}</p>
                </div>
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <FiEye size={20} className="mx-auto text-royal-500 mb-1" />
                  <p className="text-xl font-bold text-ink">{views}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isArabic ? 'إجمالي المشاهدات' : 'Total views'}</p>
                </div>
                <div className="glass rounded-xl p-3 border border-white/10 text-center">
                  <FiUsers size={20} className="mx-auto text-amber-500 mb-1" />
                  <p className="text-xl font-bold text-ink">{topViews}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{isArabic ? 'أعلى مشاهدات' : 'Top views'}</p>
                </div>
              </div>

              {ratingsCount > 0 && (
                <div className="glass rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{isArabic ? 'متوسط التقييم' : 'Average Rating'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-amber-500">{avgRating}</span>
                      <FiStar size={16} className="text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[5, 4, 3, 2, 1].map(s => {
                      const count = ratings.filter(v => Math.round(v) === s).length
                      const pct = ratingsCount ? Math.round((count / ratingsCount) * 100) : 0
                      return (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <span className="w-8 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <FiStar size={11} className="text-amber-500" /> {s}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-slate-500 tabular-nums">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {courseLectures.length > 0 && (
                <div className="glass rounded-xl p-4 border border-white/10">
                  <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                    <FiVideo size={14} className="text-royal-500" />
                    {isArabic ? 'المشاهدات لكل محاضرة' : 'Views per lecture'}
                  </h3>
                  <div className="space-y-2">
                    {[...perLecture].sort((a, b) => b.views - a.views).slice(0, 8).map(p => {
                      const lecture = courseLectures.find(l => l.id === p.id)
                      const max = Math.max(1, ...perLecture.map(x => x.views))
                      const pct = Math.round((p.views / max) * 100)
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-32 truncate flex-shrink-0">
                            {isArabic ? lecture?.titleAr : lecture?.titleEn}
                          </span>
                          <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-royal-500 to-cyan-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-ink w-8 text-right tabular-nums">{p.views}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(CourseProfileModal)
