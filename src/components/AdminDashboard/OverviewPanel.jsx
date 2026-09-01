import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiBook, FiUsers, FiGrid, FiLogIn, FiUpload, FiDownload, FiActivity, FiFileText, FiVideo, FiUser } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { importAllData } from '../../services'
import { exportToJson } from '../../utils/adminShared'

export default function OverviewPanel({
  courses,
  lectures,
  activityLogs = [],
  additions = [],
  activeStudents = [],
  newStudents = [],
  overviewStats,
  isArabic,
  onNavigate,
  onCourseClick,
  onRefresh,
}) {
  const prefersReduced = useReducedMotion()
  const importFileRef = useRef(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data || typeof data !== 'object') throw new Error('bad json')
      const result = await importAllData(data)
      if (result?.ok) {
        toast.success(isArabic ? 'تم استيراد النسخة الاحتياطية بنجاح' : 'Backup imported successfully')
        if (onRefresh) onRefresh(false)
      } else {
        toast.error(isArabic ? 'فشل الاستيراد' : 'Import failed')
      }
    } catch (err) {
      toast.error(isArabic ? 'ملف غير صالح — تأكد أنه نسخة تصدير صحيحة' : 'Invalid file — please use a valid export')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} className="flex flex-wrap gap-3 mb-6 items-center">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{isArabic ? 'إجراءات سريعة:' : 'Quick actions:'}</span>
        <button onClick={() => onNavigate('lectures')} className="btn-primary flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium">
          <FiVideo size={14} /> {isArabic ? 'إدارة المحاضرات' : 'Manage lectures'}
        </button>
        <button onClick={() => onNavigate('courses')} className="btn-primary flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium">
          <FiBook size={14} /> {isArabic ? 'إدارة المواد' : 'Manage courses'}
        </button>
        <button onClick={() => onNavigate('sources')} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition">
          <FiGrid size={14} /> {isArabic ? 'إدارة المصادر' : 'Manage sources'}
        </button>
        <button onClick={() => onNavigate('users')} className="btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium">
          <FiUsers size={14} /> {isArabic ? 'الطلاب' : 'Students'}
        </button>
        <button onClick={() => {
          const t = (key) => ({
            'usersTable.exported': isArabic ? 'تم تصدير النسخة الاحتياطية' : 'Backup exported!',
            'usersTable.exportFailed': isArabic ? 'فشل تصدير النسخة الاحتياطية' : 'Backup export failed'
          })[key] || 'Exported!'
          exportToJson('al-azher-backup', t)
        }} className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition">
          <FiDownload size={14} /> {isArabic ? 'نسخة احتياطية' : 'Backup'}
        </button>
        <button
          onClick={() => importFileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <FiUpload size={14} /> {importing ? (isArabic ? 'جارٍ الاستيراد...' : 'Importing...') : (isArabic ? 'استيراد نسخة' : 'Import')}
        </button>
        <input ref={importFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { value: overviewStats.totalCourses, label: isArabic ? 'المواد' : 'Courses', icon: FiBook, gradient: 'from-emerald-500 to-emerald-600', delay: 0 },
          { value: overviewStats.totalLectures, label: isArabic ? 'المحاضرات' : 'Lectures', icon: FiActivity, gradient: 'from-violet-500 to-violet-600', delay: 0.08 },
          { value: overviewStats.totalSources, label: isArabic ? 'المصادر' : 'Sources', icon: FiGrid, gradient: 'from-cyan-500 to-cyan-600', delay: 0.16 },
          { value: overviewStats.activeUsers, label: isArabic ? 'الطلاب' : 'Students', icon: FiUsers, gradient: 'from-amber-500 to-amber-600', delay: 0.24 },
          { value: overviewStats.totalLogins, label: isArabic ? 'تسجيلات الدخول' : 'Total Logins', icon: FiLogIn, gradient: 'from-rose-500 to-rose-600', delay: 0.32 },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={prefersReduced ? {} : { opacity: 0, x: i % 2 === 0 ? 50 : -50, scale: 0.85 }}
              animate={prefersReduced ? {} : { opacity: 1, x: 0, scale: 1 }}
              transition={prefersReduced ? {} : { duration: 0.7, delay: stat.delay, type: 'spring', stiffness: 150, damping: 15 }}
              whileHover={prefersReduced ? {} : { scale: 1.04, y: -6 }}
              className="stat-tile rounded-2xl p-5 hover:border-royal-500/30 transition group cursor-default"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition duration-300`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{stat.label}</p>
                  <motion.p
                    initial={prefersReduced ? {} : { opacity: 0, scale: 0.3 }}
                    animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
                    transition={prefersReduced ? {} : { duration: 0.8, delay: stat.delay + 0.2, type: 'spring', stiffness: 120 }}
                    className="text-3xl font-extrabold text-ink tracking-tight"
                  >
                    {stat.value}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Lectures per course mini bar chart */}
      {courses.length > 0 && (
        <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stat-tile rounded-2xl p-5 mt-6">
          <h3 className="text-sm font-bold text-ink mb-4">{isArabic ? 'المحاضرات حسب المادة' : 'Lectures per course'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2 mb-3">{isArabic ? 'اضغط على مادة لعرض ملفها التعريفي (مشاهدات، تقييم، مصادر)' : 'Click a course to view its profile (views, ratings, sources)'}</p>
          <div className="space-y-2.5">
            {courses.slice(0, 8).map(c => {
              const count = lectures.filter(l => l.courseId === c.id || l.subjectAr === c.nameAr || l.subjectEn === c.nameEn).length
              const max = Math.max(1, ...courses.slice(0, 8).map(cc => lectures.filter(l => l.courseId === cc.id || l.subjectAr === cc.nameAr || l.subjectEn === cc.nameEn).length))
              const pct = Math.round((count / max) * 100)
              return (
                <button key={c.id} onClick={() => onCourseClick(c)} className="w-full flex items-center gap-3 text-left group" title={isArabic ? 'عرض ملف المادة' : 'View course profile'}>
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-28 truncate flex-shrink-0">{isArabic ? c.nameAr : c.nameEn}</span>
                  <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5, ease: [0.16,1,0.3,1] }} className="h-full rounded-full bg-gradient-to-r from-royal-500 to-cyan-500 group-hover:opacity-80" />
                  </div>
                  <span className="text-xs font-medium text-ink w-8 text-right tabular-nums">{count}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Recent activity + recent additions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="stat-tile rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">{isArabic ? 'آخر النشاطات' : 'Recent activity'}</h3>
            <FiActivity size={14} className="text-slate-400" />
          </div>
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{isArabic ? 'لا توجد نشاطات بعد' : 'No activity yet'}</p>
          ) : (
            <ul className="space-y-2.5">
              {activityLogs.slice(0, 6).map(log => (
                <li key={log.id} className="flex items-start gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.action === 'ADD' ? 'bg-emerald-400' : log.action === 'DELETE' ? 'bg-rose-400' : 'bg-cyan-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink truncate">
                      <span className="font-semibold">{log.action === 'ADD' ? (isArabic ? 'إضافة' : 'Add') : log.action === 'DELETE' ? (isArabic ? 'حذف' : 'Delete') : (isArabic ? 'تحديث' : 'Update')}</span>
                      {' '}<span className="text-slate-500 dark:text-slate-400">{log.detail}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="stat-tile rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">{isArabic ? 'آخر الإضافات' : 'Recent additions'}</h3>
            <FiFileText size={14} className="text-slate-400" />
          </div>
          {additions.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{isArabic ? 'لا توجد إضافات بعد' : 'No additions yet'}</p>
          ) : (
            <ul className="space-y-2.5">
              {additions.slice(0, 6).map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <FiFileText size={14} className="text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink truncate">{isArabic ? a.titleAr : a.titleEn}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {isArabic ? a.subjectAr : a.subjectEn}
                      {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Recently active students */}
      <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="stat-tile rounded-2xl p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink">{isArabic ? 'أحدث الطلاب النشطين' : 'Recently active students'}</h3>
          <FiUsers size={14} className="text-slate-400" />
        </div>
        {activeStudents.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{isArabic ? 'لا يوجد نشاط طلابي بعد' : 'No student activity yet'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {activeStudents.map((u) => {
              const diff = Date.now() - u.lastActivity
              const mins = Math.floor(diff / 60000)
              const hrs = Math.floor(diff / 3600000)
              const days = Math.floor(diff / 86400000)
              const ago = mins < 1 ? (isArabic ? 'الآن' : 'now') : mins < 60 ? `${mins} ${isArabic ? 'د' : 'm'}` : hrs < 24 ? `${hrs} ${isArabic ? 'س' : 'h'}` : `${days} ${isArabic ? 'ي' : 'd'}`
              return (
                <div key={u.studentId} className="flex items-center gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ink truncate">{u.name || u.studentId}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${mins < 60 ? 'bg-emerald-500' : 'bg-slate-400'}`} /> {ago}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Recently registered students */}
      <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="stat-tile rounded-2xl p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink">{isArabic ? 'أحدث المسجلين' : 'Newest registrations'}</h3>
          <FiUser size={14} className="text-slate-400" />
        </div>
        {newStudents.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{isArabic ? 'لا يوجد طلاب مسجلين' : 'No students registered yet'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {newStudents.map(u => (
              <div key={u.studentId} className="flex items-center gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink truncate">{u.name || u.studentId}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en', { day: 'numeric', month: 'short' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  )
}
