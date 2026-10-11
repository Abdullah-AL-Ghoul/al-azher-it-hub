import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCompass, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiChevronDown, 
  FiChevronUp,
  FiBookOpen,
  FiCheck,
  FiPlusCircle
} from 'react-icons/fi'
import { COURSE_TYPES } from '../../data/academicCurriculum'

export default function EligibleCoursesAdvisor({ 
  activePlan, 
  courseProgress, 
  onStatusChange, 
  isArabic 
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [plannedCourseIds, setPlannedCourseIds] = useState(new Set())

  // Create a fast lookup map for all courses in this active plan
  const courseLookup = useMemo(() => {
    const map = new Map()
    activePlan.curriculum.forEach(yr => {
      yr.semesters.forEach(sem => {
        sem.courses.forEach(c => {
          map.set(c.code.trim().toUpperCase(), { ...c, year: yr.year, semester: sem.semester })
          map.set(c.id, { ...c, year: yr.year, semester: sem.semester })
        })
      })
    })
    return map
  }, [activePlan])

  // Compute courses that unlocked their prerequisites and are not passed yet
  const eligibleCourses = useMemo(() => {
    const list = []

    activePlan.curriculum.forEach(yr => {
      yr.semesters.forEach(sem => {
        sem.courses.forEach(course => {
          const status = courseProgress[course.id] || 'remaining'
          // If already passed, it is completed, not eligible for new enrollment
          if (status === 'passed') return

          let canTake = true
          const prereqCodes = []

          if (course.prereq && course.prereq.trim() && course.prereq !== '—') {
            // Split by comma, slash, plus, or space
            const rawTokens = course.prereq.split(/[,/+\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
            
            rawTokens.forEach(token => {
              if (token.length >= 4) { // typical course code like MATH1320 or ITCS1401
                prereqCodes.push(token)
                const prereqCourse = courseLookup.get(token)
                if (prereqCourse) {
                  const prereqStatus = courseProgress[prereqCourse.id] || 'remaining'
                  if (prereqStatus !== 'passed') {
                    canTake = false
                  }
                }
              }
            })
          }

          if (canTake) {
            // Check if this course unlocks any future courses
            const unlocks = []
            activePlan.curriculum.forEach(otherYr => {
              otherYr.semesters.forEach(otherSem => {
                otherSem.courses.forEach(otherC => {
                  if (otherC.prereq && otherC.prereq.toUpperCase().includes(course.code.toUpperCase())) {
                    unlocks.push(otherC.code)
                  }
                })
              })
            })

            list.push({
              ...course,
              year: yr.year,
              semester: sem.semester,
              status,
              prereqCodes,
              unlocks,
            })
          }
        })
      })
    })

    // Sort by year, semester ascending (foundation courses first)
    return list.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.semester - b.semester
    })
  }, [activePlan, courseProgress, courseLookup])

  // Total selected hours for registration planning
  const plannedHours = useMemo(() => {
    let total = 0
    eligibleCourses.forEach(c => {
      if (plannedCourseIds.has(c.id)) {
        total += c.hours
      }
    })
    return total
  }, [eligibleCourses, plannedCourseIds])

  const togglePlannedCourse = (courseId) => {
    setPlannedCourseIds(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  const markAllPlannedAsEnrolled = () => {
    plannedCourseIds.forEach(id => {
      onStatusChange(id, 'enrolled')
    })
  }

  return (
    <div className="glass rounded-2xl border border-white/10 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-royal-500 to-indigo-500" />

      {/* Header */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-500 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-royal-500/20">
            <FiCompass size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-ink">
                {isArabic ? 'مرشد التسجيل الأكاديمي الذكي (المساقات المتاحة)' : 'Smart Registration Advisor (Unlocked Courses)'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-sky-500/15 text-sky-600 dark:text-sky-400">
                {eligibleCourses.length} {isArabic ? 'مساق مؤهل' : 'unlocked'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
              {isArabic 
                ? 'المساقات التي اكتملت متطلباتها السابقة وتستطيع تسجيلها رسمياً في الفصل القادم'
                : 'Courses with satisfied prerequisites available for your upcoming registration'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-semibold text-slate-600 dark:text-white/70 hover:text-ink transition cursor-pointer"
          >
            <span>{isOpen ? (isArabic ? 'طي القائمة' : 'Collapse') : (isArabic ? 'عرض القائمة' : 'Expand')}</span>
            {isOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5 sm:p-6 space-y-6"
          >
            {/* Planner Summary Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <span>{isArabic ? 'مخطط ساعات الفصل القادم المختارة:' : 'Planned Upcoming Term Load:'}</span>
                  <span className={`text-sm font-extrabold tabular-nums ${plannedHours > 18 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {plannedHours} / 18 {isArabic ? 'ساعة معتمدة' : 'credit hrs'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-white/40">
                  {plannedHours > 18
                    ? (isArabic ? '⚠️ تجاوزت الحد الأقصى للعبء الفصلي العادي (18 ساعة). يرجى مراجعة إرشادك الأكاديمي.' : '⚠️ Exceeded standard 18 credit hour load.')
                    : (isArabic ? 'اختر المساقات التي تنوي تسجيلها لتجهيز جدولك ومراقبة مجموع الساعات.' : 'Select courses you intend to register to gauge your study load.')}
                </p>
              </div>

              {plannedHours > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={markAllPlannedAsEnrolled}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-royal-600 text-white shadow-md shadow-royal-600/20 hover:bg-royal-500 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiClock size={14} />
                    <span>{isArabic ? `تسجيل ${plannedCourseIds.size} مساقات (قيد الدراسة)` : `Enroll Selected (${plannedCourseIds.size})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlannedCourseIds(new Set())}
                    className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:text-rose-500 transition cursor-pointer"
                  >
                    {isArabic ? 'إلغاء التحديد' : 'Clear'}
                  </button>
                </div>
              )}
            </div>

            {/* Courses Grid */}
            {eligibleCourses.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <FiCheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-bold text-ink">
                  {isArabic ? 'رائع! لا توجد مساقات متبقية معلقة' : 'Great! No pending unlocked courses'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isArabic ? 'لقد أنجزت أو سجلت كافة المساقات المتاحة حتى هذه اللحظة.' : 'All unlocked courses are either completed or currently in progress.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {eligibleCourses.map(course => {
                  const isPlanned = plannedCourseIds.has(course.id)
                  const isEnrolled = course.status === 'enrolled'
                  const typeMeta = COURSE_TYPES[course.type] || COURSE_TYPES.major

                  return (
                    <div
                      key={course.id}
                      onClick={() => togglePlannedCourse(course.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                        isPlanned
                          ? 'bg-royal-500/10 border-royal-500/40 ring-2 ring-royal-500/30'
                          : isEnrolled
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-black/5 dark:bg-white/5 border-line hover:border-royal-400/30'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-accent dark:text-cyan-400 px-2 py-0.5 rounded-md bg-royal-500/10">
                            {course.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold text-slate-500 dark:text-white/60 bg-black/5 dark:bg-white/10">
                              {isArabic ? `س${course.year} - ف${course.semester}` : `Y${course.year} - S${course.semester}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                              {course.hours} {isArabic ? 'ساعات' : 'hrs'}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-ink text-sm leading-snug">
                          {isArabic ? course.nameAr : course.nameEn}
                        </h4>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${typeMeta.color}`}>
                            {isArabic ? typeMeta.labelAr : typeMeta.labelEn}
                          </span>
                          {course.prereqCodes.length > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <FiCheck size={11} />
                              <span>{isArabic ? `المتطلب مكتمل (${course.prereqCodes.join(', ')})` : `Prereq passed`}</span>
                            </span>
                          )}
                          {!course.prereq && (
                            <span className="text-[10px] text-slate-400 dark:text-white/40">
                              {isArabic ? 'بدون متطلب سابق' : 'No prerequisite'}
                            </span>
                          )}
                        </div>

                        {course.unlocks.length > 0 && (
                          <p className="text-[10px] text-sky-600 dark:text-cyan-400 pt-1 border-t border-black/5 dark:border-white/5">
                            {isArabic ? `🔑 يفتح مستقبلاً: ` : `🔑 Unlocks: `}
                            <span className="font-mono font-semibold">{course.unlocks.slice(0, 3).join(', ')}</span>
                            {course.unlocks.length > 3 && ` +${course.unlocks.length - 3}`}
                          </p>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-white/70 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isPlanned}
                            onChange={() => togglePlannedCourse(course.id)}
                            className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4 cursor-pointer"
                          />
                          <span>{isArabic ? 'تخطيط للتسجيل' : 'Plan course'}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => onStatusChange(course.id, isEnrolled ? 'remaining' : 'enrolled')}
                          title={isEnrolled ? (isArabic ? 'إلغاء التسجيل' : 'Unenroll') : (isArabic ? 'تسجيل كقيد الدراسة' : 'Mark Enrolled')}
                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            isEnrolled
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                          }`}
                        >
                          <FiClock size={13} />
                          <span className="text-[11px]">{isEnrolled ? (isArabic ? 'مُسجّل' : 'Enrolled') : (isArabic ? 'تسجيل' : 'Enroll')}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
