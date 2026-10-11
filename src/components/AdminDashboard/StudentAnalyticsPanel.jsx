import { useState, useMemo, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  FiUsers,
  FiActivity,
  FiAward,
  FiClock,
  FiBookOpen,
  FiEye,
  FiHeart,
  FiStar,
  FiMessageSquare,
  FiCpu,
  FiTrendingUp,
  FiDownload,
  FiUserCheck,
  FiAlertCircle,
  FiExternalLink,
} from 'react-icons/fi'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import StudentProfileModal from './StudentProfileModal'
import { exportToJson, exportToCsv } from '../../utils/adminShared'

// Standard IT faculty majors mapping
const KNOWN_MAJORS = [
  { key: 'se', labelAr: 'هندسة البرمجيات', labelEn: 'Software Engineering', color: 'from-blue-500 to-indigo-600', text: 'text-blue-500' },
  { key: 'cs', labelAr: 'علوم الحاسوب', labelEn: 'Computer Science', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-500' },
  { key: 'it', labelAr: 'تكنولوجيا المعلومات', labelEn: 'Information Technology', color: 'from-cyan-500 to-blue-600', text: 'text-cyan-500' },
  { key: 'is', labelAr: 'نظم المعلومات الحاسوبية', labelEn: 'Computer Information Systems', color: 'from-purple-500 to-violet-600', text: 'text-purple-500' },
  { key: 'cyber', labelAr: 'الأمن السيبراني', labelEn: 'Cybersecurity', color: 'from-rose-500 to-red-600', text: 'text-rose-500' },
  { key: 'ai', labelAr: 'الذكاء الاصطناعي وعلم البيانات', labelEn: 'AI & Data Science', color: 'from-amber-500 to-orange-600', text: 'text-amber-500' },
  { key: 'other', labelAr: 'غير محدد / أخرى', labelEn: 'Unspecified / Other', color: 'from-slate-400 to-slate-600', text: 'text-slate-400' },
]

function normalizeMajor(majorStr) {
  if (!majorStr) return 'other'
  const m = majorStr.toLowerCase().trim()
  if (m.includes('برمج') || m.includes('software')) return 'se'
  if (m.includes('علوم') || m.includes('computer science') || m === 'cs') return 'cs'
  if (m.includes('تكنولوجيا') || m.includes('it') || m.includes('تقنية')) return 'it'
  if (m.includes('نظم') || m.includes('cis') || m.includes('is')) return 'is'
  if (m.includes('أمن') || m.includes('سيبران') || m.includes('cyber')) return 'cyber'
  if (m.includes('ذكاء') || m.includes('بيانات') || m.includes('ai')) return 'ai'
  return 'other'
}

function StudentAnalyticsPanel({ users = [], studentLogs = [], isArabic }) {
  const prefersReduced = useReducedMotion()
  const [profileStudent, setProfileStudent] = useState(null)
  const [timeFilter, setTimeFilter] = useState('all') // 'all', '7d', '30d'

  // Filter logs by timeframe if selected
  const filteredLogs = useMemo(() => {
    if (timeFilter === 'all') return studentLogs
    const now = Date.now()
    const limitMs = timeFilter === '7d' ? 7 * 86400000 : 30 * 86400000
    return studentLogs.filter(log => {
      if (!log.timestamp) return false
      return (now - new Date(log.timestamp).getTime()) <= limitMs
    })
  }, [studentLogs, timeFilter])

  // Students list (exclude pure admins from student stats)
  const studentsList = useMemo(() => {
    return users.filter(u => (u.role ?? 'student') === 'student')
  }, [users])

  // Comprehensive analytics calculations
  const analytics = useMemo(() => {
    const totalStudents = studentsList.length
    const now = Date.now()
    const oneDayMs = 24 * 3600000
    const sevenDaysMs = 7 * 86400000

    let activeTodayCount = 0
    let activeWeekCount = 0
    let newThisWeekCount = 0
    let oauthCount = 0

    // Major frequency
    const majorCounts = { se: 0, cs: 0, it: 0, is: 0, cyber: 0, ai: 0, other: 0 }

    studentsList.forEach(s => {
      const lastVisitTime = s.lastVisit ? new Date(s.lastVisit).getTime() : 0
      if (now - lastVisitTime <= oneDayMs) activeTodayCount++
      if (now - lastVisitTime <= sevenDaysMs) activeWeekCount++

      const createdTime = s.createdAt ? new Date(s.createdAt).getTime() : 0
      if (now - createdTime <= sevenDaysMs) newThisWeekCount++

      if (s.studentId && s.studentId.startsWith('oauth_')) oauthCount++

      const majorKey = normalizeMajor(s.major)
      majorCounts[majorKey] = (majorCounts[majorKey] || 0) + 1
    })

    // Action breakdown from logs
    const actionCounts = {
      VIEW_LECTURE: 0,
      VIEW_SOURCE: 0,
      ADD_FAVORITE: 0,
      RATE_LECTURE: 0,
      ADD_COMMENT: 0,
      USE_CHATBOT: 0,
      LOGIN: 0,
    }

    // Hourly study time distribution (0..23)
    const hourlyCounts = new Array(24).fill(0)
    // 4 dayparts: Morning (6-12), Afternoon (12-18), Evening (18-24), Night (0-6)
    const dayparts = {
      morning: 0,   // 6 to 11
      afternoon: 0, // 12 to 17
      evening: 0,   // 18 to 23
      night: 0,     // 0 to 5
    }

    // Per-student engagement score aggregation
    const studentEngagement = {}

    filteredLogs.forEach(log => {
      if (log.type && actionCounts[log.type] !== undefined) {
        actionCounts[log.type]++
      }

      if (log.timestamp) {
        const h = new Date(log.timestamp).getHours()
        if (h >= 0 && h < 24) {
          hourlyCounts[h]++
          if (h >= 6 && h < 12) dayparts.morning++
          else if (h >= 12 && h < 18) dayparts.afternoon++
          else if (h >= 18 && h < 24) dayparts.evening++
          else dayparts.night++
        }
      }

      const sId = log.studentId
      if (sId) {
        if (!studentEngagement[sId]) {
          studentEngagement[sId] = {
            studentId: sId,
            name: log.name || sId,
            actionsCount: 0,
            views: 0,
            favorites: 0,
            ratings: 0,
            comments: 0,
            aiChats: 0,
            score: 0,
          }
        }
        studentEngagement[sId].actionsCount++
        if (log.type === 'VIEW_LECTURE' || log.type === 'VIEW_SOURCE') {
          studentEngagement[sId].views++
          studentEngagement[sId].score += 3
        } else if (log.type === 'ADD_FAVORITE') {
          studentEngagement[sId].favorites++
          studentEngagement[sId].score += 2
        } else if (log.type === 'RATE_LECTURE') {
          studentEngagement[sId].ratings++
          studentEngagement[sId].score += 2
        } else if (log.type === 'ADD_COMMENT') {
          studentEngagement[sId].comments++
          studentEngagement[sId].score += 4
        } else if (log.type === 'USE_CHATBOT') {
          studentEngagement[sId].aiChats++
          studentEngagement[sId].score += 2
        } else if (log.type === 'LOGIN') {
          studentEngagement[sId].score += 1
        }
      }
    })

    // Rank top engaged students
    const rankedStudents = Object.values(studentEngagement)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(entry => {
        const fullUser = studentsList.find(u => u.studentId === entry.studentId)
        return {
          ...entry,
          name: fullUser?.name || entry.name,
          major: fullUser?.major || '',
          lastVisit: fullUser?.lastVisit || null,
          fullUser,
        }
      })

    // Find peak study hour
    let peakHour = 0
    let peakHourVal = 0
    hourlyCounts.forEach((cnt, hr) => {
      if (cnt > peakHourVal) {
        peakHourVal = cnt
        peakHour = hr
      }
    })

    const totalActions = Object.values(actionCounts).reduce((a, b) => a + b, 0)
    const engagementRate = totalStudents > 0 ? Math.round((activeWeekCount / totalStudents) * 100) : 0

    return {
      totalStudents,
      activeTodayCount,
      activeWeekCount,
      newThisWeekCount,
      oauthCount,
      engagementRate,
      majorCounts,
      actionCounts,
      totalActions,
      hourlyCounts,
      dayparts,
      peakHour,
      rankedStudents,
    }
  }, [studentsList, filteredLogs])

  const handleExportSummary = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeframe: timeFilter,
      overview: {
        totalStudents: analytics.totalStudents,
        activeToday: analytics.activeTodayCount,
        activeWeek: analytics.activeWeekCount,
        newThisWeek: analytics.newThisWeekCount,
        oauthAccounts: analytics.oauthCount,
        engagementRatePercent: analytics.engagementRate,
        totalActionsRecorded: analytics.totalActions,
        peakStudyHour: `${analytics.peakHour}:00`,
      },
      majorsDistribution: analytics.majorCounts,
      actionsBreakdown: analytics.actionCounts,
      topStudents: analytics.rankedStudents.map(s => ({
        studentId: s.studentId,
        name: s.name,
        major: s.major,
        score: s.score,
        actionsCount: s.actionsCount,
      })),
    }
    exportToJson('student-analytics-report', isArabic ? (k => k) : (k => k), report)
  }

  return (
    <>
      <motion.div
        variants={prefersReduced ? pageContainerReduced : pageContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Top Controls Bar */}
        <motion.div
          variants={prefersReduced ? pageItemReduced : pageItem}
          className="glass rounded-2xl p-5 border border-white/10 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <FiTrendingUp className="text-royal-500" />
              <span>{isArabic ? 'مركز التحليلات الاستراتيجية وسلوك الطلبة' : 'Student Intelligence & Analytics Suite'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isArabic
                ? 'رؤى دقيقة حول أوقات الدراسة، تفاعل التخصصات، ولوحة شرف أكثر الطلبة نشاطاً'
                : 'Deep insights into study hours, major distribution, and student engagement'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Timeframe pill filter */}
            <div className="flex items-center p-1 bg-white/40 dark:bg-navy-700/60 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition ${timeFilter === 'all' ? 'bg-royal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink'}`}
              >
                {isArabic ? 'كافة الفترات' : 'All Time'}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('30d')}
                className={`px-3 py-1.5 rounded-lg transition ${timeFilter === '30d' ? 'bg-royal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink'}`}
              >
                {isArabic ? 'آخر 30 يوم' : 'Last 30 Days'}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1.5 rounded-lg transition ${timeFilter === '7d' ? 'bg-royal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-ink'}`}
              >
                {isArabic ? 'آخر 7 أيام' : 'Last 7 Days'}
              </button>
            </div>

            <button
              onClick={handleExportSummary}
              className="flex items-center gap-2 px-3.5 py-2 glass text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-xs font-semibold transition"
            >
              <FiDownload size={14} />
              <span>{isArabic ? 'تصدير تقرير تحليلي' : 'Export Report'}</span>
            </button>
          </div>
        </motion.div>

        {/* 4 Core KPIs Cards */}
        <motion.div
          variants={prefersReduced ? pageItemReduced : pageItem}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="glass rounded-2xl p-5 border border-white/10 hover:border-royal-500/30 transition shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isArabic ? 'إجمالي الطلبة' : 'Total Students'}
              </span>
              <span className="p-2 rounded-xl bg-royal-500/10 text-royal-500">
                <FiUsers size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-ink">{analytics.totalStudents}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span>+{analytics.newThisWeekCount} {isArabic ? 'جديد هذا الأسبوع' : 'new this week'}</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isArabic ? 'نشطون خلال 24 ساعة' : 'Active Past 24h'}
              </span>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <FiUserCheck size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-ink">{analytics.activeTodayCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isArabic ? `من أصل ${analytics.activeWeekCount} نشط هذا الأسبوع` : `Out of ${analytics.activeWeekCount} active this week`}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isArabic ? 'معدل التفاعل الأسبوعي' : 'Engagement Rate'}
              </span>
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <FiActivity size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {analytics.engagementRate}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isArabic ? `${analytics.activeWeekCount} طالب نشط أسبوعياً` : `${analytics.activeWeekCount} weekly active`}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isArabic ? 'ساعة الذروة الدراسية' : 'Peak Study Time'}
              </span>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <FiClock size={18} />
              </span>
            </div>
            <div className="text-2xl font-black text-ink">
              {`${analytics.peakHour}:00`}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {isArabic ? 'أكثر وقت يشهد تفاعلاً ودراسة' : 'Highest concurrent study time'}
            </div>
          </div>
        </motion.div>

        {/* Section 2: Major Distribution & Study Dayparts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Majors Breakdown */}
          <motion.div
            variants={prefersReduced ? pageItemReduced : pageItem}
            className="glass rounded-2xl p-6 border border-white/10 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FiBookOpen className="text-royal-500" />
                <span>{isArabic ? 'توزيع الطلاب حسب التخصص الأكاديمي' : 'Students Distribution by Major'}</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 ">
                {analytics.totalStudents} {isArabic ? 'طالب مسجل' : 'students'}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {KNOWN_MAJORS.map(m => {
                const count = analytics.majorCounts[m.key] || 0
                const pct = analytics.totalStudents > 0 ? Math.round((count / analytics.totalStudents) * 100) : 0
                return (
                  <div key={m.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{isArabic ? m.labelAr : m.labelEn}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                        style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Study Dayparts & Activity Patterns */}
          <motion.div
            variants={prefersReduced ? pageItemReduced : pageItem}
            className="glass rounded-2xl p-6 border border-white/10 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FiClock className="text-amber-500" />
                <span>{isArabic ? 'فترات الذروة الدراسية (أنماط اليوم)' : 'Study Time Patterns (Dayparts)'}</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 ">
                {analytics.totalActions} {isArabic ? 'عملية مسجلة' : 'actions'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/40 dark:bg-white/5 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                  <span>{isArabic ? 'الصباح (06:00 - 12:00)' : 'Morning (6am - 12pm)'}</span>
                  <span className="text-amber-500">🌅</span>
                </div>
                <div className="text-xl font-bold text-ink font-mono">{analytics.dayparts.morning}</div>
                <div className="text-[11px] text-slate-500">
                  {analytics.totalActions > 0 ? Math.round((analytics.dayparts.morning / analytics.totalActions) * 100) : 0}% {isArabic ? 'من النشاط' : 'of activity'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/40 dark:bg-white/5 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                  <span>{isArabic ? 'بعد الظهر (12:00 - 18:00)' : 'Afternoon (12pm - 6pm)'}</span>
                  <span className="text-cyan-500">☀️</span>
                </div>
                <div className="text-xl font-bold text-ink font-mono">{analytics.dayparts.afternoon}</div>
                <div className="text-[11px] text-slate-500">
                  {analytics.totalActions > 0 ? Math.round((analytics.dayparts.afternoon / analytics.totalActions) * 100) : 0}% {isArabic ? 'من النشاط' : 'of activity'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/40 dark:bg-white/5 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                  <span>{isArabic ? 'المساء (18:00 - 24:00)' : 'Evening (6pm - 12am)'}</span>
                  <span className="text-royal-500">🌙</span>
                </div>
                <div className="text-xl font-bold text-ink font-mono">{analytics.dayparts.evening}</div>
                <div className="text-[11px] text-slate-500">
                  {analytics.totalActions > 0 ? Math.round((analytics.dayparts.evening / analytics.totalActions) * 100) : 0}% {isArabic ? 'من النشاط' : 'of activity'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/40 dark:bg-white/5 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
                  <span>{isArabic ? 'ساعات الفجر (00:00 - 06:00)' : 'Late Night (12am - 6am)'}</span>
                  <span className="text-purple-500">✨</span>
                </div>
                <div className="text-xl font-bold text-ink font-mono">{analytics.dayparts.night}</div>
                <div className="text-[11px] text-slate-500">
                  {analytics.totalActions > 0 ? Math.round((analytics.dayparts.night / analytics.totalActions) * 100) : 0}% {isArabic ? 'من النشاط' : 'of activity'}
                </div>
              </div>
            </div>

            {/* Behavioral Action Breakdown Chips */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
                {isArabic ? 'تفصيل نوع التفاعل الأكاديمي:' : 'Action Breakdown:'}
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FiEye className="mx-auto mb-1" size={14} />
                  <div className="font-bold text-xs font-mono">{analytics.actionCounts.VIEW_LECTURE}</div>
                  <div className="text-[10px]">{isArabic ? 'محاضرات' : 'Lectures'}</div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <FiBookOpen className="mx-auto mb-1" size={14} />
                  <div className="font-bold text-xs font-mono">{analytics.actionCounts.VIEW_SOURCE}</div>
                  <div className="text-[10px]">{isArabic ? 'مصادر' : 'Sources'}</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <FiHeart className="mx-auto mb-1" size={14} />
                  <div className="font-bold text-xs font-mono">{analytics.actionCounts.ADD_FAVORITE}</div>
                  <div className="text-[10px]">{isArabic ? 'مفضلات' : 'Favorites'}</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <FiCpu className="mx-auto mb-1" size={14} />
                  <div className="font-bold text-xs font-mono">{analytics.actionCounts.USE_CHATBOT}</div>
                  <div className="text-[10px]">{isArabic ? 'شات بوت' : 'Chatbot'}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section 3: Honor Board of Top Engaged Students */}
        <motion.div
          variants={prefersReduced ? pageItemReduced : pageItem}
          className="glass rounded-2xl p-6 border border-white/10 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <FiAward className="text-amber-500" />
                <span>{isArabic ? 'لوحة شرف أكثر الطلاب تفاعلاً وإنجازاً' : 'Student Engagement Honor Board'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isArabic
                  ? 'يتم احتساب النقاط بناءً على مشاهدة المحاضرات، قراءة المراجع، وإنجاز المهام'
                  : 'Computed live from lecture views, source reads, favorites, and academic activities'}
              </p>
            </div>
          </div>

          {analytics.rankedStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              {isArabic ? 'لا توجد سجلات تفاعل كافية بعد لعرض لوحة الشرف' : 'No activity records found to populate honor board yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 dark:text-slate-400 text-[11px] uppercase">
                    <th className="py-2.5 px-3 text-start">{isArabic ? 'الترتيب' : 'Rank'}</th>
                    <th className="py-2.5 px-3 text-start">{isArabic ? 'الطالب' : 'Student'}</th>
                    <th className="py-2.5 px-3 text-start">{isArabic ? 'الرقم الجامعي' : 'Student ID'}</th>
                    <th className="py-2.5 px-3 text-start">{isArabic ? 'التخصص' : 'Major'}</th>
                    <th className="py-2.5 px-3 text-start">{isArabic ? 'إجمالي الأنشطة' : 'Actions'}</th>
                    <th className="py-2.5 px-3 text-start">{isArabic ? 'نقاط التفاعل' : 'Score'}</th>
                    <th className="py-2.5 px-3 text-end">{isArabic ? 'الملف' : 'Profile'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.rankedStudents.map((st, index) => {
                    const isFirst = index === 0
                    const isSecond = index === 1
                    const isThird = index === 2
                    return (
                      <tr key={st.studentId} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3 font-bold">
                          {isFirst && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black">🥇 1</span>}
                          {isSecond && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-300/40 text-slate-700 dark:text-slate-200 font-bold">🥈 2</span>}
                          {isThird && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-300 font-bold">🥉 3</span>}
                          {!isFirst && !isSecond && !isThird && <span className="text-slate-400 font-mono ps-2">#{index + 1}</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-ink">{st.name}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 text-xs">
                          {st.studentId}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {st.major || (isArabic ? 'غير محدد' : 'Unspecified')}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-royal-600 dark:text-royal-400">
                          {st.actionsCount}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {st.score} {isArabic ? 'نقطة' : 'pts'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-end">
                          <button
                            type="button"
                            onClick={() => setProfileStudent(st.fullUser || { studentId: st.studentId, name: st.name, major: st.major })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium glass text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition"
                          >
                            <span>{isArabic ? 'عرض' : 'View'}</span>
                            <FiExternalLink size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Profile Modal when student is clicked */}
      <StudentProfileModal
        student={profileStudent}
        isOpen={Boolean(profileStudent)}
        onClose={() => setProfileStudent(null)}
      />
    </>
  )
}

export default memo(StudentAnalyticsPanel)
