import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  FiGitCommit, 
  FiCheckCircle, 
  FiBookOpen, 
  FiLayers, 
  FiAlertCircle,
  FiZap,
  FiX
} from 'react-icons/fi'
import { Link } from 'react-router-dom'

const YEAR_NAMES = [
  { year: 1, nameAr: 'السنة الأولى (المستوى 1)', nameEn: 'Year 1 (Freshman)', color: 'from-blue-600/10 to-transparent border-blue-500/20' },
  { year: 2, nameAr: 'السنة الثانية (المستوى 2)', nameEn: 'Year 2 (Sophomore)', color: 'from-emerald-600/10 to-transparent border-emerald-500/20' },
  { year: 3, nameAr: 'السنة الثالثة (المستوى 3)', nameEn: 'Year 3 (Junior)', color: 'from-violet-600/10 to-transparent border-violet-500/20' },
  { year: 4, nameAr: 'السنة الرابعة (المستوى 4)', nameEn: 'Year 4 (Senior)', color: 'from-amber-600/10 to-transparent border-amber-500/20' },
]

export default function InteractivePrerequisiteTree({
  courses = [],
  activePlan,
  isArabic = true,
  selectedCourseKey,
  onSelectCourse,
}) {
  // Inspect drawer
  const [inspectedCourse, setInspectedCourse] = useState(null)

  // Group courses by Year
  const yearGroups = useMemo(() => {
    const map = { 1: [], 2: [], 3: [], 4: [] }
    courses.forEach((c) => {
      const yr = c.year || 1
      if (!map[yr]) map[yr] = []
      map[yr].push(c)
    })
    return map
  }, [courses])

  // Normalize helper
  const norm = (str) => (str || '').trim().toLowerCase()

  // Active highlighted dependencies
  const activeHighlighted = useMemo(() => {
    if (!selectedCourseKey) return null
    return courses.find(
      (c) => norm(c.code) === norm(selectedCourseKey) || norm(c.nameAr) === norm(selectedCourseKey) || norm(c.nameEn) === norm(selectedCourseKey)
    )
  }, [selectedCourseKey, courses])

  // Compute full upstream prerequisites and downstream unlocks
  const { prerequisites, unlocks } = useMemo(() => {
    const prereqs = new Set()
    const unlks = new Set()
    if (!activeHighlighted) return { prerequisites: prereqs, unlocks: unlks }

    const targetCode = norm(activeHighlighted.code)
    const targetNameAr = norm(activeHighlighted.nameAr)

    // 1. Upstream prerequisites (direct and chained)
    const tracePrereqs = (course) => {
      if (!course || !course.prerequisites) return
      course.prerequisites.forEach((p) => {
        const pNorm = norm(p)
        if (!prereqs.has(pNorm)) {
          prereqs.add(pNorm)
          const parentCourse = courses.find((c) => norm(c.code) === pNorm || norm(c.nameAr) === pNorm)
          if (parentCourse) tracePrereqs(parentCourse)
        }
      })
    }
    tracePrereqs(activeHighlighted)

    // 2. Downstream unlocks (courses that list this course as prereq)
    const traceUnlocks = (code, nameAr) => {
      courses.forEach((c) => {
        if (c.prerequisites && c.prerequisites.length > 0) {
          const hasMatch = c.prerequisites.some((p) => norm(p) === code || norm(p) === nameAr)
          if (hasMatch) {
            const cCode = norm(c.code)
            if (!unlks.has(cCode)) {
              unlks.add(cCode)
              traceUnlocks(cCode, norm(c.nameAr))
            }
          }
        }
      })
    }
    traceUnlocks(targetCode, targetNameAr)

    return { prerequisites: prereqs, unlocks: unlks }
  }, [activeHighlighted, courses])

  const handleCardClick = (c) => {
    const key = c.code || c.nameAr
    if (selectedCourseKey === key) {
      onSelectCourse(null)
      setInspectedCourse(null)
    } else {
      onSelectCourse(key)
      setInspectedCourse(c)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner Guide */}
      <div className="glass rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FiZap className="text-royal-500 dark:text-cyan-400" size={16} />
          <span className="text-ink">
            {isArabic 
              ? 'تتبع سلسلة المتطلبات (Prerequisite DAG Flow): انقر على أي مساق لتتبع شجرته بالكامل' 
              : 'Interactive Prerequisite DAG Flow: Click any course to trace its complete tree'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-amber-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-500/20" />
            <span>{isArabic ? 'متطلب سابق (Prerequisite)' : 'Prerequisite'}</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/20" />
            <span>{isArabic ? 'يفتح مساقاً (Unlocks)' : 'Unlocks Course'}</span>
          </span>
        </div>
      </div>

      {/* 4-Year Columns Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {YEAR_NAMES.map((yrInfo) => {
          const yearCourses = yearGroups[yrInfo.year] || []
          return (
            <div
              key={yrInfo.year}
              className={`glass rounded-3xl p-4 border border-white/10 bg-gradient-to-b ${yrInfo.color} space-y-3.5`}
            >
              {/* Year Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5">
                <div>
                  <h3 className="text-xs font-extrabold text-ink">
                    {isArabic ? yrInfo.nameAr : yrInfo.nameEn}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {yearCourses.length} {isArabic ? 'مساق' : 'courses'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-slate-500">
                  Y{yrInfo.year}
                </span>
              </div>

              {/* Course Nodes in this Year */}
              <div className="space-y-2">
                {yearCourses.map((c) => {
                  const cCode = norm(c.code)
                  const cName = norm(c.nameAr)
                  const isTarget = activeHighlighted && (norm(activeHighlighted.code) === cCode || norm(activeHighlighted.nameAr) === cName)
                  const isPrereq = prerequisites.has(cCode) || prerequisites.has(cName)
                  const isUnlock = unlocks.has(cCode) || unlocks.has(cName)
                  const isDimmed = activeHighlighted && !isTarget && !isPrereq && !isUnlock

                  let borderClass = 'border-black/5 dark:border-white/10'
                  let bgClass = 'bg-white/70 dark:bg-slate-900/70'

                  if (isTarget) {
                    borderClass = 'border-royal-500 ring-2 ring-royal-500/40 shadow-lg shadow-royal-500/20'
                    bgClass = 'bg-royal-500/10 dark:bg-royal-500/20'
                  } else if (isPrereq) {
                    borderClass = 'border-amber-500 ring-2 ring-amber-500/40'
                    bgClass = 'bg-amber-500/10 dark:bg-amber-500/20'
                  } else if (isUnlock) {
                    borderClass = 'border-emerald-500 ring-2 ring-emerald-500/40'
                    bgClass = 'bg-emerald-500/10 dark:bg-emerald-500/20'
                  }

                  return (
                    <motion.div
                      key={c.id || c.code}
                      layout
                      onClick={() => handleCardClick(c)}
                      className={`p-3 rounded-2xl border ${borderClass} ${bgClass} cursor-pointer transition-all duration-200 select-none ${
                        isDimmed ? 'opacity-35 hover:opacity-80' : 'hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className="text-[10px] font-mono font-bold text-accent dark:text-cyan-400">
                          {c.code || 'CODE'}
                        </span>
                        <div className="flex items-center gap-1">
                          {c.hours && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-500">
                              {c.hours} {isArabic ? 'س' : 'h'}
                            </span>
                          )}
                          <span className="text-[9px] font-semibold text-slate-400">
                            F{c.semester || 1}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-ink leading-snug line-clamp-2">
                        {isArabic ? c.nameAr : c.nameEn}
                      </h4>

                      {/* Prerequisite Footnote */}
                      {c.prerequisites && c.prerequisites.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center gap-1 text-[10px] text-slate-400 truncate">
                          <FiGitCommit size={11} className="shrink-0 text-amber-500" />
                          <span className="truncate">{c.prerequisites.join(', ')}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Course Detail Inspector Modal/Drawer */}
      {inspectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/10 space-y-5 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                  {inspectedCourse.code}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {isArabic ? `السنة ${inspectedCourse.year} • الفصل ${inspectedCourse.semester}` : `Year ${inspectedCourse.year} • Semester ${inspectedCourse.semester}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCourse(null)}
                className="p-1 text-slate-400 hover:text-ink transition"
              >
                <FiX size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-ink mb-1">
                {isArabic ? inspectedCourse.nameAr : inspectedCourse.nameEn}
              </h3>
              <p className="text-xs text-slate-500">
                {isArabic ? activePlan?.nameAr : activePlan?.nameEn}
              </p>
            </div>

            {/* Dependency Tree Analysis */}
            <div className="space-y-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                  <FiAlertCircle size={13} />
                  <span>{isArabic ? 'المتطلبات السابقة المطلوب اجتيازها أولاً:' : 'Prerequisites required to take this course:'}</span>
                </span>
                {prerequisites.size > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.from(prerequisites).map((p) => (
                      <span key={p} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold">
                        {p.toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{isArabic ? 'لا توجد متطلبات سابقة (متاح للتسجيل مباشرة).' : 'No prerequisites required.'}</p>
                )}
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                  <FiCheckCircle size={13} />
                  <span>{isArabic ? 'المساقات التي يفتحها هذا المساق مستقبلاً:' : 'Courses this prerequisite unlocks:'}</span>
                </span>
                {unlocks.size > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {Array.from(unlocks).map((u) => (
                      <span key={u} className="text-xs font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold">
                        {u.toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{isArabic ? 'مساق نهائي في خطته (لا يفتح مساقات أخرى).' : 'Terminal course in this path.'}</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Link
                to={`/lectures?search=${encodeURIComponent(inspectedCourse.nameAr)}`}
                className="flex-1 py-2 px-3 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FiBookOpen size={14} />
                <span>{isArabic ? 'مشاهدة المحاضرات' : 'View Lectures'}</span>
              </Link>
              <Link
                to={`/sources?search=${encodeURIComponent(inspectedCourse.nameAr)}`}
                className="flex-1 py-2 px-3 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 text-ink text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <FiLayers size={14} />
                <span>{isArabic ? 'بنك الامتحانات' : 'Exam Bank'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
