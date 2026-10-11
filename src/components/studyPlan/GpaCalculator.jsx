import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2, FiRotateCcw, FiSave, FiCheck, FiAward, FiInfo, FiPercent } from 'react-icons/fi'
import { FaCalculator } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

const LETTER_GRADES = [
  { letter: 'A+', points: 4.0, minPct: 90, labelAr: 'ممتاز مرتفع' },
  { letter: 'A',  points: 3.75, minPct: 85, labelAr: 'ممتاز' },
  { letter: 'B+', points: 3.5, minPct: 80, labelAr: 'جيد جداً مرتفع' },
  { letter: 'B',  points: 3.0, minPct: 75, labelAr: 'جيد جداً' },
  { letter: 'C+', points: 2.5, minPct: 70, labelAr: 'جيد مرتفع' },
  { letter: 'C',  points: 2.0, minPct: 65, labelAr: 'جيد' },
  { letter: 'D+', points: 1.5, minPct: 60, labelAr: 'مقبول مرتفع' },
  { letter: 'D',  points: 1.0, minPct: 50, labelAr: 'مقبول' },
  { letter: 'F',  points: 0.0, minPct: 0, labelAr: 'راسب' },
]

export default function GpaCalculator({ isArabic, t }) {
  // Mode: 'percentage' (النظام المئوي من 100%) or 'gpa4' (نظام النقاط من 4.0)
  const [scaleMode, setScaleMode] = useState('percentage')
  const [includePrevious, setIncludePrevious] = useState(false)
  const [prevGpa, setPrevGpa] = useState('')
  const [prevHours, setPrevHours] = useState('')

  const defaultCourses = useMemo(() => [
    { id: '1', name: isArabic ? 'نظم قواعد البيانات' : 'Database Systems', hours: 3, grade: 88, letter: 'A' },
    { id: '2', name: isArabic ? 'تراكيب البيانات' : 'Data Structures', hours: 3, grade: 82, letter: 'B+' },
    { id: '3', name: isArabic ? 'شبكات الحاسوب (1)' : 'Computer Networks I', hours: 3, grade: 91, letter: 'A+' },
    { id: '4', name: isArabic ? 'هندسة البرمجيات' : 'Software Engineering', hours: 3, grade: 85, letter: 'A' },
    { id: '5', name: isArabic ? 'احتمالات وإحصاء' : 'Probability & Statistics', hours: 3, grade: 78, letter: 'B' },
  ], [isArabic])

  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_saved_gpa_calc')
      if (saved) return JSON.parse(saved)
    } catch {}
    return defaultCourses
  })

  // Add course row
  const addCourse = () => {
    const newCourse = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: isArabic ? `مساق جديد ${courses.length + 1}` : `Course ${courses.length + 1}`,
      hours: 3,
      grade: 80,
      letter: 'B+',
    }
    setCourses([...courses, newCourse])
  }

  // Remove course row
  const removeCourse = (id) => {
    if (courses.length <= 1) {
      toast.error(isArabic ? 'يجب أن يحتوي الفصل على مساق واحد على الأقل' : 'Must keep at least one course')
      return
    }
    setCourses(courses.filter(c => c.id !== id))
  }

  // Update course field
  const updateCourse = (id, field, value) => {
    setCourses(courses.map(c => {
      if (c.id !== id) return c
      if (field === 'hours') {
        const val = Math.max(1, Math.min(12, parseInt(value, 10) || 1))
        return { ...c, hours: val }
      }
      if (field === 'grade') {
        const val = Math.max(0, Math.min(100, parseFloat(value) || 0))
        const found = LETTER_GRADES.find(lg => val >= lg.minPct) || LETTER_GRADES[LETTER_GRADES.length - 1]
        return { ...c, grade: val, letter: found.letter }
      }
      if (field === 'letter') {
        const found = LETTER_GRADES.find(lg => lg.letter === value)
        return { ...c, letter: value, grade: found ? found.minPct + 2 : c.grade }
      }
      return { ...c, [field]: value }
    }))
  }

  // Reset to initial
  const resetAll = () => {
    setCourses(defaultCourses)
    setPrevGpa('')
    setPrevHours('')
    setIncludePrevious(false)
    try { localStorage.removeItem('al_azher_saved_gpa_calc') } catch {}
    toast.success(isArabic ? 'تمت إعادة ضبط الحاسبة' : 'Calculator reset')
  }

  // Save to storage
  const saveCalculation = () => {
    try {
      localStorage.setItem('al_azher_saved_gpa_calc', JSON.stringify(courses))
      toast.success(isArabic ? 'تم حفظ بيانات المساقات بنجاح' : 'Courses saved locally')
    } catch {}
  }

  // Calculate Semester GPA
  const semesterStats = useMemo(() => {
    let totalHours = 0
    let totalWeightedPoints = 0
    let totalWeightedPct = 0

    courses.forEach(c => {
      const h = Number(c.hours) || 0
      totalHours += h

      if (scaleMode === 'percentage') {
        totalWeightedPct += (Number(c.grade) || 0) * h
      } else {
        const gradeObj = LETTER_GRADES.find(lg => lg.letter === c.letter) || { points: 0 }
        totalWeightedPoints += gradeObj.points * h
      }
    })

    const semPct = totalHours > 0 ? (totalWeightedPct / totalHours) : 0
    const semPoints = totalHours > 0 ? (totalWeightedPoints / totalHours) : 0

    return {
      totalHours,
      semGpa: scaleMode === 'percentage' ? semPct : semPoints,
      semPct,
      semPoints,
    }
  }, [courses, scaleMode])

  // Calculate Cumulative GPA
  const cumulativeStats = useMemo(() => {
    if (!includePrevious) {
      return {
        cumGpa: semesterStats.semGpa,
        totalCombinedHours: semesterStats.totalHours,
      }
    }

    const pGpa = parseFloat(prevGpa) || 0
    const pHours = parseFloat(prevHours) || 0
    const totalCombinedHours = pHours + semesterStats.totalHours

    if (totalCombinedHours === 0) {
      return { cumGpa: 0, totalCombinedHours: 0 }
    }

    let cum = 0
    if (scaleMode === 'percentage') {
      cum = ((pGpa * pHours) + (semesterStats.semPct * semesterStats.totalHours)) / totalCombinedHours
    } else {
      cum = ((pGpa * pHours) + (semesterStats.semPoints * semesterStats.totalHours)) / totalCombinedHours
    }

    return {
      cumGpa: cum,
      totalCombinedHours,
    }
  }, [includePrevious, prevGpa, prevHours, semesterStats, scaleMode])

  // Academic Standing Rating
  const standing = useMemo(() => {
    const val = scaleMode === 'percentage'
      ? (includePrevious ? cumulativeStats.cumGpa : semesterStats.semPct)
      : (includePrevious ? (cumulativeStats.cumGpa / 4.0 * 100) : (semesterStats.semPoints / 4.0 * 100))

    if (val >= 90) return { labelAr: 'ممتاز مع مرتبة الشرف 🏆', labelEn: 'Excellent with Honors', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' }
    if (val >= 85) return { labelAr: 'ممتاز ⭐', labelEn: 'Excellent', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' }
    if (val >= 75) return { labelAr: 'جيد جداً 👍', labelEn: 'Very Good', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' }
    if (val >= 65) return { labelAr: 'جيد 📘', labelEn: 'Good', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' }
    if (val >= 60) return { labelAr: 'مقبول ⚠️', labelEn: 'Pass / Satisfactory', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' }
    return { labelAr: 'إنذار أكاديمي / بحاجة للتحسين 🚨', labelEn: 'Academic Warning', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' }
  }, [scaleMode, includePrevious, cumulativeStats, semesterStats])

  return (
    <div className="space-y-6">
      {/* Top Controls Bar: Scales & Options */}
      <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-royal-500/15 dark:bg-cyan-500/15 text-accent dark:text-cyan-400 flex items-center justify-center">
            <FaCalculator size={18} />
          </div>
          <div>
            <h2 className="font-bold text-ink text-sm sm:text-base">
              {isArabic ? 'حاسبة المعدل الأكاديمي' : 'Academic GPA Calculator'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-white/50">
              {isArabic ? 'احسب معدلك الفصلي والتراكمي المتوقع بدقة متناهية.' : 'Calculate your semester and cumulative GPA accurately.'}
            </p>
          </div>
        </div>

        {/* Scale Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-line">
          <button
            type="button"
            onClick={() => setScaleMode('percentage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scaleMode === 'percentage'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-ink'
            }`}
          >
            {isArabic ? 'النظام المئوي (100%)' : 'Percentage (100%)'}
          </button>
          <button
            type="button"
            onClick={() => setScaleMode('gpa4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              scaleMode === 'gpa4'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-ink'
            }`}
          >
            {isArabic ? 'نظام النقاط (4.0)' : 'Points Scale (4.0)'}
          </button>
        </div>
      </div>

      {/* Main Grid: Courses Table + Results Summary */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Courses List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-5 border border-white/10">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FiAward className="text-amber-500" />
                <span>{isArabic ? `مساقات الفصل الدراسي (${courses.length})` : `Semester Courses (${courses.length})`}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addCourse}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <FiPlus size={14} />
                  <span>{isArabic ? 'إضافة مساق' : 'Add Course'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                  title={isArabic ? 'إعادة ضبط' : 'Reset'}
                  aria-label={isArabic ? 'إعادة ضبط' : 'Reset'}
                >
                  <FiRotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Courses Rows */}
            <div className="space-y-2.5">
              {courses.map((c, index) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-line flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap"
                >
                  <span className="w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 text-slate-500 dark:text-white/60 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Course Name */}
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCourse(c.id, 'name', e.target.value)}
                    placeholder={isArabic ? 'اسم المساق...' : 'Course name...'}
                    className="input-spatial flex-1 min-w-[140px] px-3 py-1.5 rounded-xl text-xs text-ink placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none"
                  />

                  {/* Credit Hours */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-white/40 hidden sm:inline">{isArabic ? 'ساعات:' : 'Hrs:'}</span>
                    <select
                      value={c.hours}
                      onChange={(e) => updateCourse(c.id, 'hours', e.target.value)}
                      className="input-spatial px-2 py-1.5 rounded-xl text-xs text-ink font-semibold focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map(h => (
                        <option key={h} value={h}>{h} {isArabic ? 'ساعة' : 'hr'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade Input depending on scale */}
                  {scaleMode === 'percentage' ? (
                    <div className="flex items-center gap-1 shrink-0 w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={c.grade}
                        onChange={(e) => updateCourse(c.id, 'grade', e.target.value)}
                        className="input-spatial w-16 px-2 py-1.5 rounded-xl text-xs text-ink font-bold text-center focus:outline-none tabular-nums"
                      />
                      <span className="text-xs text-slate-400 font-bold">%</span>
                    </div>
                  ) : (
                    <div className="shrink-0 w-24">
                      <select
                        value={c.letter}
                        onChange={(e) => updateCourse(c.id, 'letter', e.target.value)}
                        className="input-spatial w-full px-2 py-1.5 rounded-xl text-xs text-ink font-bold focus:outline-none"
                      >
                        {LETTER_GRADES.map(lg => (
                          <option key={lg.letter} value={lg.letter}>
                            {lg.letter} ({lg.points})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Delete Course */}
                  <button
                    type="button"
                    onClick={() => removeCourse(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition shrink-0"
                    aria-label={isArabic ? 'حذف المساق' : 'Remove course'}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
              <span className="text-xs text-slate-500 dark:text-white/50">
                {isArabic ? `مجموع ساعات الفصل: ${semesterStats.totalHours} ساعة` : `Semester Total Hours: ${semesterStats.totalHours} hrs`}
              </span>
              <button
                type="button"
                onClick={saveCalculation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-royal-500/10 hover:bg-royal-500/20 text-accent text-xs font-semibold transition"
              >
                <FiSave size={13} />
                <span>{isArabic ? 'حفظ الحسابات' : 'Save Calculation'}</span>
              </button>
            </div>
          </div>

          {/* Optional Cumulative GPA Section */}
          <div className="glass rounded-2xl p-5 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includePrevious}
                onChange={(e) => setIncludePrevious(e.target.checked)}
                className="w-4 h-4 rounded text-royal-600 focus:ring-royal-500 border-line"
              />
              <span className="text-xs sm:text-sm font-semibold text-ink">
                {isArabic ? 'دمج الحساب مع المعدل التراكمي السابق (لحساب التراكمي الجديد)' : 'Include Previous Cumulative GPA (Calculate New Cumulative)'}
              </span>
            </label>

            {includePrevious && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">
                    {scaleMode === 'percentage'
                      ? (isArabic ? 'المعدل التراكمي السابق (%)' : 'Previous Cumulative GPA (%)')
                      : (isArabic ? 'المعدل التراكمي السابق (من 4.0)' : 'Previous Cumulative GPA (out of 4.0)')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={scaleMode === 'percentage' ? '100' : '4'}
                    value={prevGpa}
                    onChange={(e) => setPrevGpa(e.target.value)}
                    placeholder={scaleMode === 'percentage' ? '82.5' : '3.45'}
                    className="input-spatial w-full px-3 py-2 rounded-xl text-sm text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">
                    {isArabic ? 'عدد الساعات السابقة المنجزة' : 'Previous Completed Hours'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={prevHours}
                    onChange={(e) => setPrevHours(e.target.value)}
                    placeholder="45"
                    className="input-spatial w-full px-3 py-2 rounded-xl text-sm text-ink focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Instant Live Result Card */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal-500 via-cyan-400 to-emerald-400" />
            
            <h3 className="text-sm font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{isArabic ? 'النتيجة الأكاديمية' : 'GPA Standing'}</span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${standing.color}`}>
                {isArabic ? standing.labelAr : standing.labelEn}
              </span>
            </h3>

            {/* Semester GPA Box */}
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-line mb-3">
              <span className="block text-xs text-slate-500 dark:text-white/50 mb-1">
                {isArabic ? 'المعدل الفصلي المتوقع' : 'Expected Semester GPA'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-ink tabular-nums">
                  {scaleMode === 'percentage'
                    ? semesterStats.semPct.toFixed(2)
                    : semesterStats.semPoints.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  {scaleMode === 'percentage' ? '%' : '/ 4.00'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {isArabic ? `محسوب على ${semesterStats.totalHours} ساعة فصلية` : `Based on ${semesterStats.totalHours} semester hours`}
              </span>
            </div>

            {/* Cumulative GPA Box (if enabled) */}
            {includePrevious ? (
              <div className="p-4 rounded-xl bg-royal-500/10 dark:bg-cyan-500/10 border border-royal-500/20 dark:border-cyan-500/20 mb-3">
                <span className="block text-xs text-accent dark:text-cyan-400 font-semibold mb-1">
                  {isArabic ? 'المعدل التراكمي الجديد الشامل' : 'New Cumulative GPA'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-accent dark:text-cyan-300 tabular-nums">
                    {cumulativeStats.cumGpa.toFixed(2)}
                  </span>
                  <span className="text-sm font-bold text-accent/60">
                    {scaleMode === 'percentage' ? '%' : '/ 4.00'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-white/50 mt-1 block">
                  {isArabic
                    ? `إجمالي الساعات المعتمدة: ${cumulativeStats.totalCombinedHours} ساعة`
                    : `Total Combined Hours: ${cumulativeStats.totalCombinedHours} hrs`}
                </span>
              </div>
            ) : null}

            {/* Scale legend */}
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 text-[11px] text-slate-400 dark:text-white/40 space-y-1">
              <div className="flex items-center justify-between">
                <span>{isArabic ? 'المرتبة' : 'Grade'}:</span>
                <span className="font-semibold text-ink">{isArabic ? standing.labelAr : standing.labelEn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{isArabic ? 'معيار الحساب' : 'Calculation'}:</span>
                <span>{scaleMode === 'percentage' ? (isArabic ? 'مئوي (0 - 100%)' : 'Percentage') : '4.0 Scale'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
