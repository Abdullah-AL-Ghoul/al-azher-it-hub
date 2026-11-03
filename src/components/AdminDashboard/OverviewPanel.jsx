import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { FiBook, FiUsers, FiGrid, FiLogIn, FiUpload, FiDownload, FiActivity, FiFileText, FiVideo, FiUser, FiCpu, FiCheckCircle, FiTrendingUp, FiRadio, FiFlag, FiCheck, FiTrash2, FiExternalLink, FiClock } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { importAllData, getContentReports, updateContentReportStatus, deleteContentReport, REPORT_TYPES } from '../../services'
import { exportToJson } from '../../utils/adminShared'
import { useLanguage } from '../../context/LanguageContext'

function fmtReportTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

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
  const { t } = useLanguage()
  const prefersReduced = useReducedMotion()
  const importFileRef = useRef(null)
  const [importing, setImporting] = useState(false)
  const [reports, setReports] = useState([])

  useEffect(() => {
    getContentReports().then(setReports).catch(() => {})
  }, [])

  const handleResolveReport = async (reportId) => {
    await updateContentReportStatus(reportId, 'resolved')
    const updated = await getContentReports()
    setReports(updated)
    toast.success(isArabic ? 'تم تحديث حالة البلاغ إلى (تم الحل)' : 'Report marked as resolved')
  }

  const handleDeleteReport = async (reportId) => {
    await deleteContentReport(reportId)
    const updated = await getContentReports()
    setReports(updated)
    toast.success(isArabic ? 'تم حذف البلاغ' : 'Report deleted')
  }

  // System Health Metrics
  const lecturesWithVideoId = lectures.filter(l => l.videoId).length
  const coursesWithLectures = courses.filter(c => 
    lectures.some(l => l.courseId === c.id || l.subjectAr === c.nameAr || l.subjectEn === c.nameEn)
  ).length

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
        toast.success(t('inline.overview-panel.backup-imported-successfully'))
        if (onRefresh) onRefresh(false)
      } else {
        toast.error(t('inline.overview-panel.import-failed'))
      }
    } catch {
      toast.error(t('inline.overview-panel.invalid-file-please-use'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      {/* Top Quick Actions Bar */}
      <motion.div
        initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
        animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2.5 mb-6 items-center"
      >
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 me-1">
          {t('inline.overview-panel.quick-actions')}:
        </span>

        <button
          onClick={() => onNavigate('analytics')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-royal-600 to-indigo-600 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:opacity-95"
        >
          <FiTrendingUp size={14} /> {isArabic ? 'إحصائيات الطلبة' : 'Student Analytics'}
        </button>

        <button
          onClick={() => onNavigate('broadcast')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:opacity-95"
        >
          <FiRadio size={14} /> {isArabic ? 'البث والإعلانات' : 'Broadcast'}
        </button>

        <button
          onClick={() => onNavigate('lectures')}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
        >
          <FiVideo size={14} /> {t('inline.overview-panel.manage-lectures')}
        </button>

        <button
          onClick={() => onNavigate('courses')}
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
        >
          <FiBook size={14} /> {t('inline.overview-panel.manage-courses')}
        </button>

        <button
          onClick={() => onNavigate('sources')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <FiGrid size={14} /> {t('inline.overview-panel.manage-sources')}
        </button>

        <button
          onClick={() => onNavigate('users')}
          className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm"
        >
          <FiUsers size={14} /> {t('inline.overview-panel.students')}
        </button>

        <button
          onClick={() => {
            const msgMap = (key) => ({
              'usersTable.exported': t('inline.overview-panel.backup-exported'),
              'usersTable.exportFailed': t('inline.overview-panel.backup-export-failed')
            })[key] || 'Exported!'
            exportToJson('al-azher-backup', msgMap)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <FiDownload size={14} /> {t('inline.overview-panel.backup')}
        </button>

        <button
          onClick={() => importFileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm"
        >
          <FiUpload size={14} /> {importing ? (t('inline.overview-panel.importing')) : (t('inline.overview-panel.import'))}
        </button>
        <input ref={importFileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { value: overviewStats.totalCourses, label: t('inline.overview-panel.courses'), icon: FiBook, gradient: 'from-emerald-500 to-emerald-600', delay: 0 },
          { value: overviewStats.totalLectures, label: t('inline.overview-panel.lectures'), icon: FiActivity, gradient: 'from-violet-500 to-violet-600', delay: 0.08 },
          { value: overviewStats.totalSources, label: t('inline.overview-panel.sources'), icon: FiGrid, gradient: 'from-cyan-500 to-cyan-600', delay: 0.16 },
          { value: overviewStats.activeUsers, label: t('inline.overview-panel.students'), icon: FiUsers, gradient: 'from-amber-500 to-amber-600', delay: 0.24 },
          { value: overviewStats.totalLogins, label: t('inline.overview-panel.total-logins'), icon: FiLogIn, gradient: 'from-rose-500 to-rose-600', delay: 0.32 },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={prefersReduced ? {} : { opacity: 0, x: i % 2 === 0 ? 50 : -50, scale: 0.85 }}
              animate={prefersReduced ? {} : { opacity: 1, x: 0, scale: 1 }}
              transition={prefersReduced ? {} : { duration: 0.7, delay: stat.delay, type: 'spring', stiffness: 150, damping: 15 }}
              whileHover={prefersReduced ? {} : { scale: 1.04, y: -6 }}
              className="stat-tile p-5 hover:border-royal-500/30 transition group cursor-default"
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

      {/* Database & Media Health Panel */}
      <motion.div
        initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
        animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
      >
        <div className="stat-tile p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isArabic ? 'محاضرات بصور مصغرة نشطة' : 'Lectures with Valid Thumbnails'}
            </span>
            <p className="text-xl font-bold text-ink mt-1">
              {lecturesWithVideoId} <span className="text-xs text-slate-400 font-normal">/ {lectures.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="stat-tile p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isArabic ? 'مواد تحتوي على محاضرات' : 'Courses with Active Lectures'}
            </span>
            <p className="text-xl font-bold text-ink mt-1">
              {coursesWithLectures} <span className="text-xs text-slate-400 font-normal">/ {courses.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <FiBook size={20} />
          </div>
        </div>

        <div className="stat-tile p-4 flex items-center justify-between border-l-4 border-l-violet-500">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isArabic ? 'محرك الذكاء الاصطناعي (AI)' : 'AI Generation Engine'}
            </span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isArabic ? 'نشط وجاهز للربط' : 'Active & Connected'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
            <FiCpu size={20} />
          </div>
        </div>
      </motion.div>

      {/* Lectures per course mini bar chart */}
      {courses.length > 0 && (
        <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stat-tile p-5 mt-6">
          <h3 className="text-sm font-bold text-ink mb-4">{t('inline.overview-panel.lectures-per-course')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2 mb-3">{t('inline.overview-panel.click-a-course-to')}</p>
          <div className="space-y-2.5">
            {courses.slice(0, 8).map(c => {
              const count = lectures.filter(l => l.courseId === c.id || l.subjectAr === c.nameAr || l.subjectEn === c.nameEn).length
              const max = Math.max(1, ...courses.slice(0, 8).map(cc => lectures.filter(l => l.courseId === cc.id || l.subjectAr === cc.nameAr || l.subjectEn === cc.nameEn).length))
              const pct = Math.round((count / max) * 100)
              return (
                <button key={c.id} onClick={() => onCourseClick(c)} className="w-full flex items-center gap-3 text-left group" title={t('inline.overview-panel.view-course-profile')}>
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
        <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="stat-tile p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">{t('inline.overview-panel.recent-activity')}</h3>
            <FiActivity size={14} className="text-slate-400" />
          </div>
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{t('inline.overview-panel.no-activity-yet')}</p>
          ) : (
            <ul className="space-y-2.5">
              {activityLogs.slice(0, 6).map(log => (
                <li key={log.id} className="flex items-start gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.action === 'ADD' ? 'bg-emerald-400' : log.action === 'DELETE' ? 'bg-rose-400' : 'bg-cyan-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink truncate">
                      <span className="font-semibold">{log.action === 'ADD' ? (t('inline.overview-panel.add')) : log.action === 'DELETE' ? (t('inline.overview-panel.delete')) : (t('inline.overview-panel.update'))}</span>
                      {' '}<span className="text-slate-500 dark:text-slate-400">{log.detail}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString(t('inline.overview-panel.en-us'), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="stat-tile p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">{t('inline.overview-panel.recent-additions')}</h3>
            <FiFileText size={14} className="text-slate-400" />
          </div>
          {additions.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{t('inline.overview-panel.no-additions-yet')}</p>
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
                      {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleDateString(t('inline.overview-panel.en-us'), { day: 'numeric', month: 'short' })}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Recently active students */}
      <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="stat-tile p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink">{t('inline.overview-panel.recently-active-students')}</h3>
          <FiUsers size={14} className="text-slate-400" />
        </div>
        {activeStudents.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{t('inline.overview-panel.no-student-activity-yet')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {activeStudents.map((u) => {
              const diff = Date.now() - u.lastActivity
              const mins = Math.floor(diff / 60000)
              const hrs = Math.floor(diff / 3600000)
              const days = Math.floor(diff / 86400000)
              const ago = mins < 1 ? (t('inline.overview-panel.now')) : mins < 60 ? `${mins} ${t('inline.overview-panel.m')}` : hrs < 24 ? `${hrs} ${t('inline.overview-panel.h')}` : `${days} ${t('inline.overview-panel.d')}`
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
      <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="stat-tile p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-ink">{t('inline.overview-panel.newest-registrations')}</h3>
          <FiUser size={14} className="text-slate-400" />
        </div>
        {newStudents.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">{t('inline.overview-panel.no-students-registered-yet')}</p>
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
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString(t('inline.overview-panel.en'), { day: 'numeric', month: 'short' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Student Content Issue Reports */}
      <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="stat-tile p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiFlag size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-ink">
              {isArabic ? 'بلاغات وملاحظات الطلاب على المحتوى' : 'Student Content Issue Reports'}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold tabular-nums">
              {reports.filter(r => r.status !== 'resolved').length}
            </span>
          </div>
        </div>
        {reports.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
            {isArabic ? 'لا توجد بلاغات معلقة من الطلاب حالياً' : 'No student content reports submitted yet'}
          </p>
        ) : (
          <div className="space-y-2.5">
            {reports.slice(0, 10).map((rep) => {
              const typeMeta = REPORT_TYPES.find(rt => rt.id === rep.reportType)
              const typeLabel = typeMeta ? (isArabic ? typeMeta.labelAr : typeMeta.labelEn) : rep.reportType
              const isResolved = rep.status === 'resolved'
              const timeBadge = fmtReportTime(rep.timestampSeconds)
              const targetHref = rep.itemType === 'lecture' && rep.itemId
                ? `/lecture/${rep.itemId}${rep.timestampSeconds > 0 ? `?t=${rep.timestampSeconds}` : ''}`
                : ''
              return (
                <div key={rep.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${isResolved ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
                        {isResolved ? (isArabic ? 'تم الحل' : 'Resolved') : (isArabic ? 'قيد المراجعة' : 'Open')}
                      </span>
                      {targetHref ? (
                        <Link
                          to={targetHref}
                          className="text-xs font-bold text-ink hover:text-royal-500 dark:hover:text-cyan-400 truncate inline-flex items-center gap-1 transition-colors"
                        >
                          <span className="truncate">{rep.itemTitle}</span>
                          <FiExternalLink size={11} className="shrink-0 opacity-70" />
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-ink truncate">{rep.itemTitle}</span>
                      )}
                      {rep.subject && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-royal-500/10 text-royal-600 dark:text-cyan-400 font-semibold">
                          {rep.subject}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">({typeLabel})</span>
                      {timeBadge && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-500">
                          <FiClock size={10} />
                          <span>{timeBadge}</span>
                        </span>
                      )}
                    </div>
                    {rep.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">{rep.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {rep.reporterName} · {rep.createdAt ? new Date(rep.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US') : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <FiCheck size={12} />
                        <span>{isArabic ? 'تم الحل' : 'Resolve'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteReport(rep.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition"
                      aria-label={isArabic ? 'حذف البلاغ' : 'Delete report'}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </>
  )
}
