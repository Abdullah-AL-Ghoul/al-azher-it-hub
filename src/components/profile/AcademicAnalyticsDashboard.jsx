import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  FiPieChart, 
  FiTrendingUp, 
  FiTarget, 
  FiCheckCircle, 
  FiAward, 
  FiSliders, 
  FiHelpCircle,
  FiBookOpen,
  FiArrowLeft
} from 'react-icons/fi'
import { 
  calculateCategoryBreakdown, 
  calculateTargetGpaRequirement, 
  getHonorRollStanding 
} from '../../utils/academicAnalytics'

export default function AcademicAnalyticsDashboard({
  activePlan,
  curriculumProgressState = {},
  passedHours = 0,
  totalCurriculumHours = 136,
  savedGpa = null,
  isArabic = true,
  t
}) {
  // Target GPA Simulator State (default target 85% or current + 3%)
  const currentGpaNum = savedGpa ? parseFloat(savedGpa) : 80.0
  const [targetGpa, setTargetGpa] = useState(() => {
    return Math.min(95, Math.max(75, Math.round(currentGpaNum + 2)))
  })

  // 1. Calculate Breakdown across the 4 accredited requirements
  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(activePlan?.curriculum || [], curriculumProgressState)
  }, [activePlan, curriculumProgressState])

  // 2. Graduation Predictor Calculation
  const remainingHours = Math.max(0, totalCurriculumHours - passedHours)
  const gpaPrediction = useMemo(() => {
    return calculateTargetGpaRequirement(totalCurriculumHours, passedHours, currentGpaNum, targetGpa)
  }, [totalCurriculumHours, passedHours, currentGpaNum, targetGpa])

  const targetHonorStanding = useMemo(() => {
    return getHonorRollStanding(targetGpa)
  }, [targetGpa])

  const currentHonorStanding = useMemo(() => {
    return getHonorRollStanding(currentGpaNum)
  }, [currentGpaNum])

  const categories = Object.values(categoryBreakdown)

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="glass rounded-2xl p-5 md:p-6 border border-white/10 relative overflow-hidden bg-gradient-to-br from-royal-500/10 via-teal-500/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-royal-600/20">
              <FiPieChart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-base md:text-lg">
                  {isArabic ? 'لوحة تحليلات التخرج والإنجاز الأكاديمي' : 'Graduation & Academic Analytics'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400">
                  {isArabic ? activePlan?.nameAr : activePlan?.nameEn}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">
                {isArabic
                  ? 'تحليل تفصيلي لمتطلبات التخرج الأربعة، وتوقع المعدل التراكمي المستهدف في الساعات المتبقية'
                  : 'Breakdown of degree requirements and graduation target GPA predictor'}
              </p>
            </div>
          </div>

          {savedGpa && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 ${currentHonorStanding.badge}`}>
                <span>{currentHonorStanding.labelAr}</span>
              </span>
            </div>
          )}
        </div>

        {/* 1. Requirements Breakdown 4-Card Grid */}
        <div className="pt-4">
          <h4 className="text-xs font-bold text-slate-500 dark:text-white/50 mb-3 flex items-center gap-1.5">
            <FiBookOpen size={13} />
            <span>{isArabic ? 'إنجاز المتطلبات حسب التصنيف الأكاديمي المعتمد:' : 'Curriculum Completion by Requirement Category:'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {categories.map(cat => {
              const colorClasses = {
                emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                sky: { bar: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
                royal: { bar: 'bg-royal-600 dark:bg-cyan-400', text: 'text-royal-600 dark:text-cyan-400', bg: 'bg-royal-500/10' },
                amber: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
              }[cat.color] || { bar: 'bg-royal-600', text: 'text-royal-600', bg: 'bg-royal-500/10' }

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-line flex flex-col justify-between gap-3 shadow-sm hover:border-royal-500/30 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-ink truncate">
                        {isArabic ? cat.labelAr : cat.labelEn}
                      </span>
                      <span className={`text-xs font-mono font-extrabold ${colorClasses.text}`}>
                        {cat.percentage}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-lg font-bold text-ink tabular-nums">
                        {cat.passedHours}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-white/40">
                        / {cat.totalHours} {isArabic ? 'ساعة معتمدة' : 'credit hrs'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full ${colorClasses.bar} rounded-full`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-white/40 mt-1.5">
                      <span>{cat.passedCourses} {isArabic ? 'مساقات مجتازة' : 'passed'}</span>
                      <span>{cat.totalCourses} {isArabic ? 'إجمالي' : 'total'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Target Graduation GPA Simulator */}
      <div className="glass rounded-2xl p-5 md:p-6 border border-white/10 relative overflow-hidden bg-white/40 dark:bg-black/20">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FiTarget size={16} />
            </div>
            <div>
              <h4 className="font-bold text-ink text-sm sm:text-base">
                {isArabic ? 'محاكي معدل التخرج المستهدف (GPA Target Predictor)' : 'Target Graduation GPA Simulator'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-white/40">
                {isArabic
                  ? 'حدد المعدل الذي تطمح للتخرج به واكتشف متوسط الدرجات المطلوب في الساعات المتبقية'
                  : 'Calculate the required average grade needed in your remaining hours to hit graduation honors'}
              </p>
            </div>
          </div>

          <div className="text-end">
            <span className="text-[10px] text-slate-500 dark:text-white/40 block">
              {isArabic ? 'الساعات المتبقية للتخرج:' : 'Remaining Hours:'}
            </span>
            <span className="text-sm font-extrabold text-ink tabular-nums">
              {remainingHours} {isArabic ? 'ساعة' : 'hrs'}
            </span>
          </div>
        </div>

        {/* Simulator Interactive Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Slider & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-white/70 flex items-center gap-1.5">
                  <FiSliders size={13} />
                  <span>{isArabic ? 'المعدل التراكمي المستهدف عند التخرج:' : 'Target Graduation Cumulative GPA:'}</span>
                </label>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-royal-600 dark:text-cyan-400 tabular-nums">
                    {targetGpa}%
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({targetHonorStanding.labelAr.split(' ')[0]})
                  </span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="60"
                max="98"
                step="0.5"
                value={targetGpa}
                onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                className="w-full accent-royal-600 cursor-pointer h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none"
              />

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-white/30 pt-1">
                <span>60% (مقبول)</span>
                <span>75% (جيد جداً)</span>
                <span>85% (امتياز)</span>
                <span>95% (شرف)</span>
              </div>
            </div>

            {/* Quick Target Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-white/40 font-medium me-1">
                {isArabic ? 'أهداف سريعة:' : 'Quick Presets:'}
              </span>
              {[75, 80, 85, 90].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTargetGpa(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    targetGpa === val
                      ? 'bg-royal-600 text-white shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-ink'
                  }`}
                >
                  {val}% {val >= 85 ? '🎖️' : '✨'}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome Result Card (5 Cols) */}
          <div className="lg:col-span-5 p-4 rounded-xl border border-line bg-white/70 dark:bg-white/5 flex flex-col justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-slate-500 dark:text-white/50 font-medium">
                  {isArabic ? 'النتيجة والحسابات الرياضية' : 'Calculation Result'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  gpaPrediction.achievable
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}>
                  {gpaPrediction.achievable ? (isArabic ? '✓ هدف قابل للتحقيق' : 'Achievable') : (isArabic ? '⚠️ غير ممكن رياضياً' : 'Unachievable')}
                </span>
              </div>

              {gpaPrediction.achievable ? (
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {gpaPrediction.requiredGpa}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-white/50">
                      {isArabic ? 'متوسط الدرجات المطلوب' : 'required average'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-white/70 mt-1.5 leading-relaxed">
                    {isArabic ? gpaPrediction.messageAr : gpaPrediction.messageEn}
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-rose-500 tabular-nums">
                      {gpaPrediction.maxPossibleGpa}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-white/50">
                      {isArabic ? 'الحد الأقصى التراكمي الممكن' : 'max possible cumulative'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-500 mt-1.5 leading-relaxed">
                    {isArabic ? gpaPrediction.messageAr : gpaPrediction.messageEn}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 dark:text-white/40">
              <span>{isArabic ? `المعدل الحالي: ${currentGpaNum}%` : `Current: ${currentGpaNum}%`}</span>
              <span>{isArabic ? `أقصى معدل: ${gpaPrediction.maxPossibleGpa}%` : `Max: ${gpaPrediction.maxPossibleGpa}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
