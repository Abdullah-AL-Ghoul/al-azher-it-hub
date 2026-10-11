import { useState } from 'react'
import { 
  FiPrinter, 
  FiX, 
  FiCheckCircle, 
  FiClock, 
  FiAward, 
  FiLayers,
  FiBookOpen,
  FiFilter
} from 'react-icons/fi'

export default function PrintableCurriculumReport({
  activePlan,
  courseProgress,
  curriculumStats,
  user,
  isArabic,
  onClose
}) {
  const [filterMode, setFilterMode] = useState('all') // 'all' | 'remaining' | 'passed'
  const [studentCustomName, setStudentCustomName] = useState(user?.name || '')
  const [studentCustomId, setStudentCustomId] = useState(user?.studentId || '')

  // Filter courses based on mode
  const filteredYears = activePlan.curriculum.map(yr => ({
    ...yr,
    semesters: yr.semesters.map(sem => ({
      ...sem,
      courses: sem.courses.filter(c => {
        const status = courseProgress[c.id] || 'remaining'
        if (filterMode === 'passed') return status === 'passed'
        if (filterMode === 'remaining') return status === 'remaining' || status === 'enrolled'
        return true
      })
    })).filter(sem => sem.courses.length > 0)
  })).filter(yr => yr.semesters.length > 0)

  const currentDate = new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-slate-900 border border-line rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-8 shadow-2xl print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-6 print:text-black print:bg-white print:overflow-visible">
        
        {/* Modal Actions - Hidden when printing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-royal-500/10 text-royal-600 dark:text-cyan-400 flex items-center justify-center">
              <FiPrinter size={18} />
            </div>
            <div>
              <h3 className="font-bold text-ink text-sm sm:text-base">
                {isArabic ? 'معاينة وطباعة كشف الخطة الأكاديمية الرسمي' : 'Printable Official Curriculum Audit'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-white/40">
                {isArabic ? 'وثيقة مجهزة للطباعة أو الحفظ كملف PDF معتمد' : 'Ready for printing or export to PDF'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterMode === 'all'
                    ? 'bg-royal-600 text-white'
                    : 'text-slate-600 dark:text-white/60 hover:text-ink'
                }`}
              >
                {isArabic ? 'كامل الخطة' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('remaining')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterMode === 'remaining'
                    ? 'bg-royal-600 text-white'
                    : 'text-slate-600 dark:text-white/60 hover:text-ink'
                }`}
              >
                {isArabic ? 'المتبقية فقط' : 'Remaining'}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('passed')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterMode === 'passed'
                    ? 'bg-royal-600 text-white'
                    : 'text-slate-600 dark:text-white/60 hover:text-ink'
                }`}
              >
                {isArabic ? 'المنجزة فقط' : 'Passed'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-royal-600 hover:bg-royal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-royal-600/25 transition cursor-pointer"
            >
              <FiPrinter size={15} />
              <span>{isArabic ? 'طباعة / حفظ PDF' : 'Print / Save PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="space-y-6 text-start">
          
          {/* Official University Header */}
          <div className="text-center border-b pb-5 border-slate-200 dark:border-white/10 print:border-slate-300">
            <h2 className="text-xl sm:text-2xl font-black text-royal-700 dark:text-cyan-400 print:text-blue-950 font-serif">
              {isArabic ? 'جامعة الأزهر - غزة' : 'Al-Azhar University - Gaza'}
            </h2>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 print:text-slate-900 mt-1">
              {isArabic ? 'كلية تكنولوجيا المعلومات والاتصالات' : 'Faculty of Information Technology'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1 font-medium">
              {isArabic ? 'كشف تدقيق الخطة الدراسية الأكاديمية المعتمدة' : 'Official Academic Curriculum Degree Audit'}
            </p>
          </div>

          {/* Program & Student Metadata Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/5 print:bg-slate-50 border border-slate-200 dark:border-white/10 print:border-slate-300 text-xs">
            <div>
              <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block text-[10px]">
                {isArabic ? 'البرنامج / التخصص:' : 'Degree / Major:'}
              </span>
              <span className="font-bold text-ink print:text-black text-sm">
                {isArabic ? activePlan.nameAr : activePlan.nameEn}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block text-[10px]">
                {isArabic ? 'رقم الخطة وسنة الاعتماد:' : 'Plan # & Year:'}
              </span>
              <span className="font-bold text-ink print:text-black text-sm font-mono">
                #{activePlan.planNumber} ({activePlan.year})
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block text-[10px]">
                {isArabic ? 'اسم الطالب:' : 'Student Name:'}
              </span>
              <span className="font-bold text-ink print:text-black text-sm">
                {studentCustomName || (isArabic ? 'طالب منتظم' : 'Enrolled Student')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-white/50 print:text-slate-600 block text-[10px]">
                {isArabic ? 'تاريخ التوليد:' : 'Issue Date:'}
              </span>
              <span className="font-medium text-slate-700 dark:text-white/80 print:text-slate-800 text-xs">
                {currentDate}
              </span>
            </div>
          </div>

          {/* Degree Audit Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-royal-50/60 dark:bg-white/5 print:bg-slate-100 border border-royal-100 dark:border-white/10 print:border-slate-300 text-xs text-center">
            <div>
              <span className="text-slate-500 print:text-slate-600 block text-[10px]">
                {isArabic ? 'إجمالي ساعات الخطة' : 'Total Required'}
              </span>
              <span className="text-base font-black text-ink print:text-black">
                {curriculumStats.totalHours} {isArabic ? 'ساعة' : 'hrs'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 print:text-slate-600 block text-[10px]">
                {isArabic ? 'الساعات المنجزة' : 'Passed Hours'}
              </span>
              <span className="text-base font-black text-emerald-600 print:text-emerald-700">
                {curriculumStats.passedHours} ({curriculumStats.pct}%)
              </span>
            </div>

            <div>
              <span className="text-slate-500 print:text-slate-600 block text-[10px]">
                {isArabic ? 'قيد الدراسة حالياً' : 'In Progress'}
              </span>
              <span className="text-base font-black text-amber-600 print:text-amber-700">
                {curriculumStats.enrolledHours} {isArabic ? 'ساعة' : 'hrs'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 print:text-slate-600 block text-[10px]">
                {isArabic ? 'الساعات المتبقية' : 'Remaining Hours'}
              </span>
              <span className="text-base font-black text-rose-600 print:text-rose-700">
                {curriculumStats.remainingHours} {isArabic ? 'ساعة' : 'hrs'}
              </span>
            </div>
          </div>

          {/* Curriculum Tables Grouped by Years and Semesters */}
          <div className="space-y-6">
            {filteredYears.map(yr => (
              <div key={yr.year} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 print:border-slate-300 pb-1.5">
                  <span className="w-6 h-6 rounded-md bg-royal-600 text-white flex items-center justify-center font-bold text-xs print:bg-blue-900">
                    {yr.year}
                  </span>
                  <h4 className="font-bold text-sm text-ink print:text-black">
                    {isArabic ? yr.yearNameAr : yr.yearNameEn}
                  </h4>
                </div>

                <div className="space-y-4">
                  {yr.semesters.map(sem => (
                    <div key={sem.semester} className="space-y-2">
                      <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 print:text-slate-800">
                        {isArabic ? sem.semesterNameAr : sem.semesterNameEn}
                      </h5>

                      <div className="border border-slate-200 dark:border-white/10 print:border-slate-300 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-slate-100 dark:bg-white/5 print:bg-slate-200 text-slate-600 dark:text-white/70 print:text-slate-900">
                            <tr>
                              <th className="p-2 text-start font-bold">#</th>
                              <th className="p-2 text-start font-bold">{isArabic ? 'رمز المساق' : 'Code'}</th>
                              <th className="p-2 text-start font-bold">{isArabic ? 'اسم المساق' : 'Course Title'}</th>
                              <th className="p-2 text-center font-bold">{isArabic ? 'الساعات' : 'Hours'}</th>
                              <th className="p-2 text-start font-bold">{isArabic ? 'المتطلب السابق' : 'Prerequisite'}</th>
                              <th className="p-2 text-center font-bold">{isArabic ? 'حالة الإنجاز' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/10 print:divide-slate-200">
                            {sem.courses.map((c, idx) => {
                              const st = courseProgress[c.id] || 'remaining'
                              return (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 print:bg-white">
                                  <td className="p-2 text-slate-400 print:text-slate-600">{idx + 1}</td>
                                  <td className="p-2 font-mono font-bold text-royal-600 dark:text-cyan-400 print:text-blue-900">{c.code}</td>
                                  <td className="p-2 font-semibold text-ink print:text-black">{isArabic ? c.nameAr : c.nameEn}</td>
                                  <td className="p-2 text-center font-bold text-slate-700 dark:text-slate-300 print:text-black">{c.hours}</td>
                                  <td className="p-2 text-slate-500 print:text-slate-600 font-mono text-[11px]">{c.prereq || '—'}</td>
                                  <td className="p-2 text-center">
                                    {st === 'passed' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 print:text-emerald-800 print:border print:border-emerald-500">
                                        ✓ {isArabic ? 'ناجح' : 'Passed'}
                                      </span>
                                    ) : st === 'enrolled' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 print:text-amber-800 print:border print:border-amber-500">
                                        ⏳ {isArabic ? 'قيد الدراسة' : 'In Progress'}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-400 print:text-slate-600">
                                        — {isArabic ? 'متبقي' : 'Remaining'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Academic Endorsement & Signatures Block */}
          <div className="pt-8 mt-8 border-t border-slate-200 dark:border-white/10 print:border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <p className="font-bold text-slate-600 dark:text-white/60 print:text-slate-800 mb-10">
                {isArabic ? 'المرشد الأكاديمي' : 'Academic Advisor'}
              </p>
              <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
            </div>

            <div>
              <p className="font-bold text-slate-600 dark:text-white/60 print:text-slate-800 mb-10">
                {isArabic ? 'رئيس القسم الأكاديمي' : 'Head of Department'}
              </p>
              <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
            </div>

            <div>
              <p className="font-bold text-slate-600 dark:text-white/60 print:text-slate-800 mb-10">
                {isArabic ? 'عميد الكلية / الختم الرسمي' : 'Dean / Official Seal'}
              </p>
              <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
            </div>
          </div>

          {/* Note */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 print:border-slate-300 flex justify-between items-center text-[10px] text-slate-400 print:text-slate-600">
            <span>{isArabic ? 'بوابة ملتقى كلية تكنولوجيا المعلومات - جامعة الأزهر' : 'Al-Azhar IT Hub Platform'}</span>
            <span>{isArabic ? 'نسخة تدقيق أكاديمية إرشادية' : 'Curriculum Academic Guidance Audit'}</span>
          </div>

        </div>

      </div>
    </div>
  )
}
