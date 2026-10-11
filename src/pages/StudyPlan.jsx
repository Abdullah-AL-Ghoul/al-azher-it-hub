import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getStudyPlan, saveStudyPlan } from '../services'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { uid } from '../utils/helpers'
import { 
  FiExternalLink, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiBookOpen, 
  FiLayers, 
  FiCheckCircle, 
  FiClock, 
  FiSearch, 
  FiFilter, 
  FiRotateCcw,
  FiAward
} from 'react-icons/fi'
import { FaCalculator } from 'react-icons/fa'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import toast from 'react-hot-toast'
import PageHero from '../components/shared/PageHero'
import Skeleton from '../components/shared/Skeleton'
import GpaCalculator from '../components/studyPlan/GpaCalculator'
import { ACADEMIC_CURRICULUM, COURSE_TYPES } from '../data/academicCurriculum'

const containerVariants = pageContainer
const itemVariants = pageItem

export default function StudyPlan() {
  const { lang, t } = useLanguage()
  const { isAdmin } = useAuth()
  const isArabic = lang === 'ar'
  const canEdit = isAdmin
  const prefersReduced = useReducedMotion()

  // Tabs: 'curriculum' (مسار الخطة التخصصية), 'calculator' (حاسبة المعدل), 'links' (الروابط الرسمية)
  const [activeTab, setActiveTab] = useState('curriculum')

  // --- Curriculum Tracker State ---
  const [selectedYear, setSelectedYear] = useState('all') // 'all' | 1 | 2 | 3 | 4
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'university' | 'college' | 'major' | 'elective'
  const [searchQuery, setSearchQuery] = useState('')

  // Course status: { [courseId]: 'passed' | 'enrolled' | 'remaining' }
  const [courseProgress, setCourseProgress] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_curriculum_progress')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {}
  })

  const saveProgress = (newProgress) => {
    setCourseProgress(newProgress)
    try {
      localStorage.setItem('al_azher_curriculum_progress', JSON.stringify(newProgress))
    } catch {}
  }

  const toggleCourseStatus = (courseId, status) => {
    const current = courseProgress[courseId] || 'remaining'
    const next = current === status ? 'remaining' : status
    const updated = { ...courseProgress, [courseId]: next }
    saveProgress(updated)
  }

  const setSemesterStatus = (semesterCourses, targetStatus) => {
    const updated = { ...courseProgress }
    semesterCourses.forEach(c => {
      updated[c.id] = targetStatus
    })
    saveProgress(updated)
    toast.success(
      targetStatus === 'passed'
        ? (isArabic ? 'تم تحديد جميع مساقات الفصل كناجحة ✓' : 'Semester courses marked as passed')
        : (isArabic ? 'تمت إعادة ضبط مساقات الفصل' : 'Semester courses reset')
    )
  }

  const resetAllProgress = () => {
    saveProgress({})
    toast.success(isArabic ? 'تمت إعادة ضبط الخطة بالكامل' : 'All curriculum progress reset')
  }

  // Calculate degree statistics
  const curriculumStats = useMemo(() => {
    let totalHours = 0
    let passedHours = 0
    let enrolledHours = 0
    let totalCourses = 0
    let passedCourses = 0

    ACADEMIC_CURRICULUM.forEach(yr => {
      yr.semesters.forEach(sem => {
        sem.courses.forEach(c => {
          totalHours += c.hours
          totalCourses += 1
          const st = courseProgress[c.id] || 'remaining'
          if (st === 'passed') {
            passedHours += c.hours
            passedCourses += 1
          } else if (st === 'enrolled') {
            enrolledHours += c.hours
          }
        })
      })
    })

    const pct = totalHours > 0 ? Math.round((passedHours / totalHours) * 100) : 0
    const remainingHours = Math.max(0, totalHours - passedHours)

    return {
      totalHours,
      passedHours,
      enrolledHours,
      remainingHours,
      totalCourses,
      passedCourses,
      pct,
    }
  }, [courseProgress])

  // --- Official Links / Admin CRUD State ---
  const [links, setLinks] = useState([])
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState([])

  const mountedRef = useRef(true)

  const loadPlan = async () => {
    setLoading(true)
    try {
      const data = await getStudyPlan()
      if (!mountedRef.current) return
      setLinks(data.links || [])
      setError(null)
    } catch (err) {
      if (mountedRef.current) setError(err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    loadPlan()
    return () => { mountedRef.current = false }
  }, [])

  const handleRetry = () => {
    setError(null)
    loadPlan()
  }

  const startEdit = () => {
    setEditData(JSON.parse(JSON.stringify(links)))
    setEditing(true)
  }

  const startEditWithNew = () => {
    setEditData([...JSON.parse(JSON.stringify(links)), {
      id: uid(),
      titleAr: '',
      titleEn: '',
      url: '',
    }])
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditData([])
  }

  const saveEdit = async () => {
    const cleaned = editData.filter(l => (l.titleAr || '').trim() || (l.titleEn || '').trim()).map(l => ({
      ...l,
      id: l.id || uid(),
    }))
    try {
      await saveStudyPlan({ links: cleaned })
      setLinks(cleaned)
      setEditing(false)
      setEditData([])
      toast.success(t('studyPlan.saved'))
    } catch (e) {
      toast.error(t('studyPlan.saveError'))
    }
  }

  const addNew = () => {
    setEditData([...editData, {
      id: uid(),
      titleAr: '',
      titleEn: '',
      url: '',
    }])
  }

  const removeItem = (id) => {
    setEditData(editData.filter(l => l.id !== id))
  }

  const persistDelete = async (id) => {
    const newLinks = links.filter(l => l.id !== id)
    try {
      await saveStudyPlan({ links: newLinks })
      setLinks(newLinks)
      toast.success(t('studyPlan.saved'))
    } catch (e) {
      toast.error(t('studyPlan.saveError'))
    }
  }

  const updateItem = (id, field, value) => {
    setEditData(editData.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const displayData = editing ? editData : links
  const inputClass = "w-full glass rounded-xl px-3 py-3 min-h-[44px] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cyan-500/20"

  // Filter curriculum courses
  const filteredCurriculum = useMemo(() => {
    return ACADEMIC_CURRICULUM
      .filter(yr => selectedYear === 'all' || yr.year === selectedYear)
      .map(yr => ({
        ...yr,
        semesters: yr.semesters.map(sem => ({
          ...sem,
          courses: sem.courses.filter(c => {
            const matchesType = selectedType === 'all' || c.type === selectedType
            const q = searchQuery.trim().toLowerCase()
            const matchesQuery = !q ||
              c.code.toLowerCase().includes(q) ||
              c.nameAr.toLowerCase().includes(q) ||
              c.nameEn.toLowerCase().includes(q)
            return matchesType && matchesQuery
          })
        })).filter(sem => sem.courses.length > 0)
      })).filter(yr => yr.semesters.length > 0)
  }, [selectedYear, selectedType, searchQuery])

  if (error) return <ErrorState error={error} onRetry={handleRetry} />

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
        <div className="py-16 mb-12">
          <div className="container-page text-center">
            <Skeleton className="h-10 w-48 mx-auto mb-4 rounded-xl" />
            <Skeleton className="h-5 w-64 mx-auto rounded-lg" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="glass rounded-xl p-5">
              <Skeleton className="h-5 w-2/3 rounded-lg mb-2" />
              <Skeleton className="h-3 w-1/4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page">
      <PageHero
        variant="path"
        title={isArabic ? 'الخطة الأكاديمية وحاسبة المعدل' : 'Academic Curriculum & GPA Hub'}
        subtitle={isArabic ? 'تتبع إنجازك الأكاديمي، خطة التخصص الشجرية، وحساب المعدل التراكمي بدقة' : 'Track degree progress, explore interactive curriculum, and compute cumulative GPA'}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs Bar */}
        <div className="glass rounded-2xl p-2 mb-8 border border-white/10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeTab === 'curriculum'
                  ? 'bg-royal-600 text-white shadow-lg shadow-royal-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FiLayers size={16} />
              <span>{isArabic ? 'مسار الخطة التخصصية' : 'Curriculum Tracker'}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'curriculum' ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                %{curriculumStats.pct}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeTab === 'calculator'
                  ? 'bg-royal-600 text-white shadow-lg shadow-royal-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FaCalculator size={14} />
              <span>{isArabic ? 'حاسبة المعدل الأكاديمي' : 'GPA Calculator'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeTab === 'links'
                  ? 'bg-royal-600 text-white shadow-lg shadow-royal-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FiExternalLink size={15} />
              <span>{isArabic ? 'الوثائق والروابط الرسمية' : 'Official Links'}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === 'links' ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                {links.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: CURRICULUM TRACKER */}
        {activeTab === 'curriculum' && (
          <div className="space-y-8">
            {/* Degree Progress Dashboard */}
            <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-royal-500 via-cyan-400 to-emerald-400" />
              
              <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                    <FiAward className="text-accent" />
                    <span>{isArabic ? 'مستوى الإنجاز الأكاديمي للدرجة الجامعية' : 'Degree Academic Completion'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                    {isArabic
                      ? 'حدد المساقات المنجزة والمُسجّلة لحساب الساعات المكتملة والمتبقية لتخرجك تلقائياً.'
                      : 'Mark passed and enrolled courses to track completed and remaining graduation hours automatically.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetAllProgress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:text-rose-500 text-xs font-semibold text-slate-500 dark:text-white/60 transition"
                  >
                    <FiRotateCcw size={13} />
                    <span>{isArabic ? 'إعادة ضبط الخطة' : 'Reset Progress'}</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar & Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span>{isArabic ? 'نسبة التقدم الكلي' : 'Overall Progress'}</span>
                  <span className="text-royal-600 dark:text-cyan-400 text-sm font-extrabold tabular-nums">
                    %{curriculumStats.pct} ({curriculumStats.passedHours} / {curriculumStats.totalHours} {isArabic ? 'ساعة' : 'hrs'})
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-royal-600 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${curriculumStats.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
                  <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-1">
                    {isArabic ? 'الساعات المنجزة' : 'Passed Hours'}
                  </span>
                  <span className="text-xl font-black text-emerald-500 tabular-nums">
                    {curriculumStats.passedHours}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
                  <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-1">
                    {isArabic ? 'قيد الدراسة حالياً' : 'In Progress'}
                  </span>
                  <span className="text-xl font-black text-amber-500 tabular-nums">
                    {curriculumStats.enrolledHours}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
                  <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-1">
                    {isArabic ? 'الساعات المتبقية' : 'Remaining Hours'}
                  </span>
                  <span className="text-xl font-black text-slate-600 dark:text-white/70 tabular-nums">
                    {curriculumStats.remainingHours}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
                  <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-1">
                    {isArabic ? 'المساقات المنجزة' : 'Passed Courses'}
                  </span>
                  <span className="text-xl font-black text-accent tabular-nums">
                    {curriculumStats.passedCourses} / {curriculumStats.totalCourses}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="glass rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="flex items-center gap-3 flex-wrap justify-between">
                {/* Year filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-white/50 font-semibold me-1">
                    {isArabic ? 'السنة:' : 'Year:'}
                  </span>
                  {[
                    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                    { id: 1, labelAr: 'السنة الأولى', labelEn: 'Year 1' },
                    { id: 2, labelAr: 'السنة الثانية', labelEn: 'Year 2' },
                    { id: 3, labelAr: 'السنة الثالثة', labelEn: 'Year 3' },
                    { id: 4, labelAr: 'السنة الرابعة', labelEn: 'Year 4' },
                  ].map(y => (
                    <button
                      key={y.id}
                      type="button"
                      onClick={() => setSelectedYear(y.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        selectedYear === y.id
                          ? 'bg-royal-600 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-ink'
                      }`}
                    >
                      {isArabic ? y.labelAr : y.labelEn}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <FiSearch className="absolute inset-y-0 start-3 my-auto text-slate-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isArabic ? 'بحث بالمساق أو الرمز...' : 'Search course or code...'}
                    className="input-spatial w-full ps-9 pe-3 py-1.5 rounded-xl text-xs text-ink placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 end-2.5 my-auto text-slate-400 hover:text-ink"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement Type Filter */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-xs text-slate-500 dark:text-white/50 font-semibold me-1">
                  {isArabic ? 'نوع المتطلب:' : 'Requirement:'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedType('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    selectedType === 'all'
                      ? 'bg-royal-600 text-white'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-ink'
                  }`}
                >
                  {isArabic ? 'جميع المتطلبات' : 'All Requirements'}
                </button>
                {Object.entries(COURSE_TYPES).map(([typeKey, typeInfo]) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setSelectedType(typeKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                      selectedType === typeKey
                        ? `${typeInfo.color} font-bold ring-1 ring-royal-500/30`
                        : 'border-transparent bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-ink'
                    }`}
                  >
                    {isArabic ? typeInfo.labelAr : typeInfo.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Curriculum Years & Semesters Grid */}
            <div className="space-y-8">
              {filteredCurriculum.map(yr => (
                <div key={yr.year} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-royal-500/15 text-accent dark:text-cyan-400 flex items-center justify-center font-black text-sm">
                      {yr.year}
                    </span>
                    <h3 className="text-lg font-bold text-ink">
                      {isArabic ? yr.yearNameAr : yr.yearNameEn}
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {yr.semesters.map(sem => {
                      const allPassed = sem.courses.every(c => courseProgress[c.id] === 'passed')
                      const semesterHours = sem.courses.reduce((sum, c) => sum + c.hours, 0)

                      return (
                        <div key={sem.semester} className="glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
                          <div>
                            {/* Semester Header */}
                            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-black/5 dark:border-white/5">
                              <div>
                                <h4 className="font-bold text-ink text-sm sm:text-base">
                                  {isArabic ? sem.semesterNameAr : sem.semesterNameEn}
                                </h4>
                                <span className="text-[11px] text-slate-500 dark:text-white/50">
                                  {sem.courses.length} {isArabic ? 'مساقات' : 'courses'} • {semesterHours} {isArabic ? 'ساعة معتمدة' : 'credit hours'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSemesterStatus(sem.courses, allPassed ? 'remaining' : 'passed')}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition border flex items-center gap-1 ${
                                  allPassed
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-black/5 dark:bg-white/5 border-line text-slate-600 dark:text-white/60 hover:text-ink'
                                }`}
                              >
                                <FiCheckCircle size={13} />
                                <span>{allPassed ? (isArabic ? 'مكتمل بالكامل' : 'Completed') : (isArabic ? 'تحديد الكل كناجح' : 'Mark All Passed')}</span>
                              </button>
                            </div>

                            {/* Courses List */}
                            <div className="space-y-3">
                              {sem.courses.map(course => {
                                const st = courseProgress[course.id] || 'remaining'
                                const typeMeta = COURSE_TYPES[course.type] || COURSE_TYPES.major

                                return (
                                  <div
                                    key={course.id}
                                    className={`p-3.5 rounded-xl border transition-all ${
                                      st === 'passed'
                                        ? 'bg-emerald-500/5 border-emerald-500/30 dark:border-emerald-500/20'
                                        : st === 'enrolled'
                                        ? 'bg-amber-500/5 border-amber-500/30 dark:border-amber-500/20'
                                        : 'bg-black/5 dark:bg-white/5 border-line'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-mono text-xs font-bold text-accent dark:text-cyan-400 px-2 py-0.5 rounded-md bg-royal-500/10">
                                            {course.code}
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${typeMeta.color}`}>
                                            {isArabic ? typeMeta.labelAr : typeMeta.labelEn}
                                          </span>
                                          <span className="text-[11px] text-slate-500 dark:text-white/50 font-semibold">
                                            {course.hours} {isArabic ? 'ساعات' : 'hrs'}
                                          </span>
                                        </div>

                                        <h5 className="font-semibold text-ink text-sm leading-snug">
                                          {isArabic ? course.nameAr : course.nameEn}
                                        </h5>

                                        {course.prereq && (
                                          <p className="text-[11px] text-slate-400 dark:text-white/40">
                                            {isArabic ? `المتطلب السابق: ` : `Prerequisite: `}
                                            <span className="font-medium text-slate-600 dark:text-white/70">{course.prereq}</span>
                                          </p>
                                        )}
                                      </div>

                                      {/* Quick Status Buttons */}
                                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => toggleCourseStatus(course.id, 'passed')}
                                          title={isArabic ? 'ناجح' : 'Passed'}
                                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                            st === 'passed'
                                              ? 'bg-emerald-600 text-white shadow-sm'
                                              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'
                                          }`}
                                        >
                                          <FiCheckCircle size={15} />
                                          <span className="text-[11px] hidden sm:inline">{isArabic ? 'ناجح' : 'Passed'}</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => toggleCourseStatus(course.id, 'enrolled')}
                                          title={isArabic ? 'قيد الدراسة' : 'Enrolled'}
                                          className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                            st === 'enrolled'
                                              ? 'bg-amber-500 text-white shadow-sm'
                                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                                          }`}
                                        >
                                          <FiClock size={15} />
                                          <span className="text-[11px] hidden sm:inline">{isArabic ? 'قيد الدراسة' : 'Enrolled'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GPA CALCULATOR */}
        {activeTab === 'calculator' && (
          <GpaCalculator isArabic={isArabic} t={t} />
        )}

        {/* TAB 3: OFFICIAL DOCUMENTS & ADMIN LINKS */}
        {activeTab === 'links' && (
          <div>
            {canEdit && (
              <div className="flex justify-end gap-2 mb-6">
                {editing ? (
                  <>
                    <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
                      <FiSave size={16} /> {t('common.save')}
                    </button>
                    <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 min-h-[44px] glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
                      <FiX size={16} /> {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEditWithNew} className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition">
                      <FiPlus size={16} /> {t('studyPlan.addLink')}
                    </button>
                    <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
                      <FiEdit2 size={16} /> {t('common.edit')}
                    </button>
                  </>
                )}
              </div>
            )}

            {editing && (
              <div className="mb-6">
                <button onClick={addNew} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
                  <FiPlus size={16} /> {t('studyPlan.addLink')}
                </button>
              </div>
            )}

            {displayData.length === 0 && !editing && (
              <EmptyState
                icon={FiBookOpen}
                color="blue"
                title={t('studyPlan.noLinks')}
                description={t('studyPlan.noLinksDesc')}
                action={canEdit ? (
                  <button onClick={startEditWithNew} className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
                    <FiPlus size={16} /> {t('studyPlan.addLink')}
                  </button>
                ) : null}
                className="max-w-md mx-auto"
              />
            )}

            {editing ? (
              <div className="space-y-3">
                {editData.map(item => (
                  <div key={item.id} className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('studyPlan.newLink')}</span>
                      <button onClick={() => removeItem(item.id)} aria-label={t('inline.study-plan.delete')} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label htmlFor={`sp-title-ar-${item.id}`} className="sr-only">العنوان بالعربي</label>
                        <input id={`sp-title-ar-${item.id}`} value={item.titleAr} onChange={e => updateItem(item.id, 'titleAr', e.target.value)} placeholder="العنوان بالعربي" className={inputClass} />
                      </div>
                      <div>
                        <label htmlFor={`sp-title-en-${item.id}`} className="sr-only">Title (EN)</label>
                        <input id={`sp-title-en-${item.id}`} value={item.titleEn} onChange={e => updateItem(item.id, 'titleEn', e.target.value)} placeholder="Title (EN)" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`sp-url-${item.id}`} className="sr-only">URL</label>
                      <input id={`sp-url-${item.id}`} value={item.url} onChange={e => updateItem(item.id, 'url', e.target.value)} placeholder="https://..." className={inputClass} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div className="space-y-4" variants={containerVariants}>
                {links.map(link => (
                  <motion.div key={link.id} variants={itemVariants} whileHover={prefersReduced ? {} : { y: -3 }}>
                    <div className="glass glass-hover lift rounded-xl p-5 flex items-center gap-4 group transition">
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-royal-500/20 group-hover:scale-105 group-hover:rotate-3 transition-transform" aria-hidden="true">
                        <FiBookOpen size={20} />
                      </span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                        <h2 className="font-semibold text-ink group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors text-base truncate">{isArabic ? link.titleAr : link.titleEn}</h2>
                        <p className="text-xs text-slate-500 dark:text-white/40 truncate mt-0.5" dir="ltr">{link.url}</p>
                      </a>
                      <div className="flex items-center gap-2 ms-2">
                        {canEdit && (
                          <button onClick={() => setConfirmDeleteId(link.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" aria-label={t('common.delete')}>
                            <FiTrash2 size={16} />
                          </button>
                        )}
                        <span className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 border border-line flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-royal-500 dark:group-hover:text-cyan-300 group-hover:border-royal-500/40 transition-colors" aria-hidden="true">
                          <FiExternalLink size={16} />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) persistDelete(confirmDeleteId) }}
        title={t('common.delete')}
        message={t('inline.study-plan.are-you-sure-you')}
      />
    </motion.div>
  )
}
