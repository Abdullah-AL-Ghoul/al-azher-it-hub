import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getCourses, getRoadmap, saveRoadmap } from '../services'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { 
  FiBookOpen, 
  FiArrowRight, 
  FiLayers, 
  FiAward, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiLink2,
  FiSearch,
  FiFilter,
  FiCompass,
  FiZap,
  FiCheckCircle
} from 'react-icons/fi'
import ErrorState from '../components/feedback/ErrorState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import Lazy3DScene from '../components/three/Lazy3DScene'
import toast from 'react-hot-toast'
import Skeleton from '../components/shared/Skeleton'
import { ACADEMIC_CURRICULUM } from '../data/academicCurriculum'

const containerVariants = pageContainer
const itemVariants = pageItem

const YEAR_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', accent: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', accent: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', accent: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', accent: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
]

// Convert official curriculum data into roadmap items
function buildCurriculumDefaults() {
  const list = []
  ACADEMIC_CURRICULUM.forEach(yr => {
    yr.semesters.forEach(sem => {
      sem.courses.forEach((c, idx) => {
        list.push({
          id: c.id,
          code: c.code,
          nameAr: c.nameAr,
          nameEn: c.nameEn,
          year: yr.year,
          semester: sem.semester,
          order: idx,
          prerequisites: c.prereq ? [c.prereq] : [],
          type: c.type,
          hours: c.hours,
          url: `/lectures?search=${encodeURIComponent(c.nameAr)}`,
        })
      })
    })
  })
  return list
}

const TRACKS = [
  { id: 'all', labelAr: 'الخطة الشاملة (الكل)', labelEn: 'All Tracks' },
  { id: 'software', labelAr: 'تطوير البرمجيات والويب', labelEn: 'Software & Web', keywords: ['برمج', 'web', 'خوارزم', 'كائنات', 'oop', 'نظم'] },
  { id: 'ai', labelAr: 'الذكاء الاصطناعي والبيانات', labelEn: 'AI & Data Science', keywords: ['ذكاء', 'ai', 'تعلم آلي', 'بيانات', 'احتمالات'] },
  { id: 'security', labelAr: 'الأمن السيبراني والشبكات', labelEn: 'Security & Networks', keywords: ['شبكات', 'أمن', 'net', 'sec', 'سحابية'] },
]

export default function CourseRoadmap() {
  const { lang, t } = useLanguage()
  const { isAdmin } = useAuth()
  const isArabic = lang === 'ar'
  const canEdit = isAdmin

  const [courses, setCourses] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [roadmap, setRoadmap] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourseKey, setSelectedCourseKey] = useState(null)
  const [activeCourseHover, setActiveCourseHover] = useState(null)
  const [selectedTrack, setSelectedTrack] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const prefersReduced = useReducedMotion()

  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    year: 1,
    semester: 1,
    order: 0,
    prerequisites: [],
    url: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)

  const mountedRef = useRef(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [c, r] = await Promise.all([getCourses(), getRoadmap()])
      if (!mountedRef.current) return
      setCourses(c || [])
      const initial = (Array.isArray(r) && r.length > 0) ? r : buildCurriculumDefaults()
      setRoadmap(initial)
      setEditData(initial)
      setError(null)
    } catch (e) {
      if (mountedRef.current) {
        // Fallback to curriculum defaults gracefully on network glitch
        const fallback = buildCurriculumDefaults()
        setRoadmap(fallback)
        setEditData(fallback)
        setError(null)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    loadData()
    return () => { mountedRef.current = false }
  }, [])

  const handleRetry = () => {
    loadData()
  }

  const years = [1, 2, 3, 4]
  const semesters = [1, 2]

  const getCourseByName = useMemo(() => {
    const map = new Map(courses.map(c => [(isArabic ? c.nameAr : c.nameEn), c]))
    return (name) => map.get(name)
  }, [courses, isArabic])

  // Filtered courses based on Track and Search Query
  const displayedCourses = useMemo(() => {
    return editData.filter(c => {
      // Search
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch = !q ||
        (c.nameAr && c.nameAr.toLowerCase().includes(q)) ||
        (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))

      // Track
      let matchesTrack = true
      if (selectedTrack !== 'all') {
        const trackDef = TRACKS.find(tr => tr.id === selectedTrack)
        if (trackDef?.keywords) {
          const haystack = `${c.nameAr || ''} ${c.nameEn || ''} ${c.code || ''}`.toLowerCase()
          matchesTrack = trackDef.keywords.some(kw => haystack.includes(kw.toLowerCase()))
        }
      }

      return matchesSearch && matchesTrack
    })
  }, [editData, searchQuery, selectedTrack])

  const getCoursesForSlot = (year, semester) => {
    return displayedCourses
      .filter(c => c.year === year && c.semester === semester)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  // Active highlighted course (either selected by click or hovered)
  const activeHighlighted = useMemo(() => {
    if (activeCourseHover) return activeCourseHover
    if (selectedCourseKey) {
      return editData.find(c => `${c.year}-${c.semester}-${c.nameAr}` === selectedCourseKey) || null
    }
    return null
  }, [activeCourseHover, selectedCourseKey, editData])

  // Calculate dependency relations: who is a prerequisite, and who is unlocked
  const dependencyMap = useMemo(() => {
    if (!activeHighlighted) return { prerequisites: new Set(), unlocks: new Set() }

    const targetCode = (activeHighlighted.code || '').trim().toLowerCase()
    const targetNameAr = (activeHighlighted.nameAr || '').trim().toLowerCase()

    const prerequisites = new Set()
    const unlocks = new Set()

    // 1. Prerequisites of the active course
    if (Array.isArray(activeHighlighted.prerequisites)) {
      activeHighlighted.prerequisites.forEach(p => {
        prerequisites.add(p.trim().toLowerCase())
      })
    }

    // 2. Courses that depend on the active course
    editData.forEach(c => {
      if (Array.isArray(c.prerequisites)) {
        c.prerequisites.forEach(cp => {
          const cleanCp = cp.trim().toLowerCase()
          if ((targetCode && cleanCp === targetCode) || (targetNameAr && cleanCp === targetNameAr)) {
            unlocks.add((c.code || c.nameAr).trim().toLowerCase())
          }
        })
      }
    })

    return { prerequisites, unlocks }
  }, [activeHighlighted, editData])

  const resetForm = () => {
    setFormData({ code: '', nameAr: '', nameEn: '', year: 1, semester: 1, order: 0, prerequisites: [], url: '' })
    setEditingId(null)
    setEditingIndex(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditCourse = (course) => {
    setFormData({
      code: course.code || '',
      nameAr: course.nameAr || '',
      nameEn: course.nameEn || '',
      year: course.year || 1,
      semester: course.semester || 1,
      order: course.order || 0,
      prerequisites: course.prerequisites || [],
      url: course.url || '',
    })
    setEditingId(course.nameAr || course.nameEn)
    setEditingIndex(editData.indexOf(course))
    setShowForm(true)
  }

  const handleSaveCourse = async () => {
    if (!formData.nameAr.trim() && !formData.nameEn.trim()) {
      toast.error(t('inline.course-roadmap.enter-course-name'))
      return
    }

    const next = [...editData]
    if (editingIndex != null && editingIndex >= 0) {
      next[editingIndex] = { ...formData }
    } else {
      next.push({ ...formData })
    }
    setEditData(next)
    resetForm()
    try {
      await saveRoadmap(next)
      setRoadmap(next)
      toast.success(t('inline.course-roadmap.saved'))
    } catch (e) {
      toast.error(t('inline.course-roadmap.save-failed'))
    }
  }

  const handleDeleteCourse = (course) => {
    const next = editData.filter(c => !(c.nameAr === course.nameAr && c.nameEn === course.nameEn))
    setEditData(next)
    setRoadmap(next)
    saveRoadmap(next).catch(() => {})
  }

  const handleSaveAll = async () => {
    try {
      await saveRoadmap(editData)
      setRoadmap(editData)
      setEditing(false)
      toast.success(t('inline.course-roadmap.saved'))
    } catch (e) {
      toast.error(t('inline.course-roadmap.save-failed'))
    }
  }

  const handleCancelEdit = () => {
    setEditData(roadmap)
    setEditing(false)
    resetForm()
  }

  const inputClass = "w-full glass rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/20"

  if (error) return <ErrorState error={error} onRetry={handleRetry} />

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
        <div className="py-16 mb-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4 rounded-xl" />
            <Skeleton className="h-5 w-80 mx-auto rounded-lg" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass p-6 rounded-xl">
                <Skeleton className="h-6 w-3/4 rounded-lg mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map(j => <div key={j} className="skeleton h-16 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page">
      <div className="py-16 mb-8 page-hero">
        <Lazy3DScene
          className="absolute inset-0 opacity-60"
          scene={() => import('../components/three/RoadmapScene')}
          sceneProps={{ theme: 'dark' }}
          fallbackLabel={t('inline.course-roadmap.3d-learning-path')}
          fallback={
            <div className="absolute inset-0" aria-hidden="true">
              <div className="floating-motif top-[18%] left-[8%] w-12 h-12" />
              <div className="floating-motif m2 top-[55%] left-[22%] w-8 h-8" />
              <div className="floating-motif m3 top-[30%] right-[12%] w-10 h-10" />
              <div className="floating-motif m2 top-[65%] right-[25%] w-6 h-6" />
            </div>
          }
        />
        <div className="container-page text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-4">
            <FiLayers size={14} className="text-accent" />
            <span className="text-slate-600 dark:text-white/60 text-xs font-semibold">{t('roadmap.interactivePlan')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{t('roadmap.title')}</h1>
          <p className="text-slate-500 dark:text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
            {isArabic
              ? 'شجرة المسار التفاعلية لتسجيل المواد وفهم سلاسل المتطلبات السابقة لـ 4 سنوات دراسية.'
              : 'Interactive 4-year prerequisite tree to plan seamless course registration without conflicts.'}
          </p>
        </div>
      </div>

      <div className="container-page">
        {/* Controls Bar: Tracks Filter, Search, and Dependency Guide */}
        <div className="glass rounded-2xl p-4 sm:p-5 mb-8 border border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Track Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-white/50 me-1">
                {isArabic ? 'المسار الأكاديمي:' : 'Academic Track:'}
              </span>
              {TRACKS.map(tr => (
                <button
                  key={tr.id}
                  type="button"
                  onClick={() => setSelectedTrack(tr.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedTrack === tr.id
                      ? 'bg-royal-600 text-white shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-ink'
                  }`}
                >
                  {isArabic ? tr.labelAr : tr.labelEn}
                </button>
              ))}
            </div>

            {/* Course Search */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <FiSearch className="absolute inset-y-0 start-3 my-auto text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في الشجرة برمز المادة أو اسمها...' : 'Search course or code...'}
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

          {/* Interactive Legend & Instruction */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5 text-xs text-slate-500 dark:text-white/50 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/30" />
                <span className="font-medium">{isArabic ? 'متطلب سابق مطلوب' : 'Required Prerequisite'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block ring-2 ring-amber-500/30" />
                <span className="font-medium">{isArabic ? 'يفتح مساقات لاحقة' : 'Unlocks Courses'}</span>
              </span>
            </div>

            {activeHighlighted ? (
              <div className="flex items-center gap-2">
                <span className="text-accent font-semibold">
                  {isArabic ? `المساق المحدد: ${activeHighlighted.nameAr}` : `Selected: ${activeHighlighted.nameEn || activeHighlighted.nameAr}`}
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedCourseKey(null); setActiveCourseHover(null) }}
                  className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 hover:text-rose-500 transition text-[11px]"
                >
                  {isArabic ? 'إلغاء التحديد' : 'Clear selection'}
                </button>
              </div>
            ) : (
              <span>{isArabic ? '💡 انقر على أي مساق لإضاءة متطلباته والمواد التي يفتحها' : 'Click any course to highlight prerequisites and unlocks'}</span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end gap-2 mb-6">
            {editing ? (
              <>
                <button onClick={handleSaveAll} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition">
                  <FiSave size={16} /> {t('common.save')}
                </button>
                <button onClick={handleCancelEdit} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
                  <FiX size={16} /> {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition">
                  <FiPlus size={16} /> {t('inline.course-roadmap.add-course')}
                </button>
                <button onClick={() => { setEditing(true); setEditData(roadmap) }} className="flex items-center gap-2 px-4 py-2 btn-spatial rounded-xl text-sm font-medium transition">
                  <FiEdit2 size={16} /> {t('common.edit')}
                </button>
              </>
            )}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-ink mb-4">
                  {editingId ? (t('inline.course-roadmap.edit-course')) : (t('inline.course-roadmap.add-new-course'))}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رمز المساق (Code)</label>
                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="CS 101" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.name-ar')}</label>
                    <input value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} placeholder={t('inline.course-roadmap.course-name')} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.name-en')}</label>
                    <input value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} placeholder="Course name" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.year')}</label>
                    <select value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} className={inputClass}>
                      {[1, 2, 3, 4].map(y => <option key={y} value={y}>{isArabic ? `السنة ${y}` : `Year ${y}`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.semester')}</label>
                    <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: parseInt(e.target.value) })} className={inputClass}>
                      {[1, 2].map(s => <option key={s} value={s}>{isArabic ? `الفصل ${s}` : `Semester ${s}`}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.order')}</label>
                    <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.link')}</label>
                    <input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." className={inputClass} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('inline.course-roadmap.prerequisites')}</label>
                  <input value={formData.prerequisites.join(', ')} onChange={e => setFormData({ ...formData, prerequisites: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder={t('inline.course-roadmap.comma-separated')} className={inputClass} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveCourse} className="flex items-center gap-2 px-4 py-2 bg-royal-500 hover:bg-royal-600 text-white rounded-xl text-sm font-medium transition">
                    <FiSave size={16} /> {editingId ? t('common.save') : (t('inline.course-roadmap.add'))}
                  </button>
                  <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
                    <FiX size={16} /> {t('common.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {displayedCourses.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl p-8 max-w-md mx-auto">
            <FiBookOpen className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="font-bold text-ink text-base mb-2">{t('roadmap.noData')}</h3>
            <p className="text-slate-500 dark:text-white/50 text-xs mb-4">{t('roadmap.noDataDesc')}</p>
            <button
              type="button"
              onClick={() => { setSelectedTrack('all'); setSearchQuery('') }}
              className="px-4 py-2 rounded-xl bg-royal-600 text-white text-xs font-semibold"
            >
              {isArabic ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {years.map(year => {
              const yearCourses = displayedCourses.filter(c => c.year === year)
              if (yearCourses.length === 0) return null
              const colors = YEAR_COLORS[year - 1] || YEAR_COLORS[0]

              return (
                <motion.div key={year} variants={itemVariants} className="relative rounded-2xl glass border border-line p-6 overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl ${colors.dot} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                      {year}
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${colors.accent}`}>{isArabic ? `السنة الدراسية ${year}` : `Year ${year}`}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{yearCourses.length} {t('roadmap.coursesLabel')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {semesters.map(sem => {
                      const semCourses = getCoursesForSlot(year, sem)
                      if (semCourses.length === 0) return null

                      return (
                        <div key={sem} className="rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-line p-4">
                          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
                            {isArabic ? `الفصل الدراسي ${sem}` : `Semester ${sem}`}
                          </h3>
                          <div className="space-y-2.5">
                            {semCourses.map((rc, idx) => {
                              const courseData = getCourseByName(rc.nameAr) || getCourseByName(rc.nameEn)
                              const hasPrereq = rc.prerequisites && rc.prerequisites.length > 0
                              const itemKey = `${year}-${sem}-${rc.nameAr}`

                              // Check if this course is highlighted as prerequisite or as unlock
                              const myCode = (rc.code || '').trim().toLowerCase()
                              const myName = (rc.nameAr || '').trim().toLowerCase()

                              const isPrereqOfActive = dependencyMap.prerequisites.has(myCode) || dependencyMap.prerequisites.has(myName)
                              const isUnlockedByActive = dependencyMap.unlocks.has(myCode) || dependencyMap.unlocks.has(myName)
                              const isSelfActive = activeHighlighted && (activeHighlighted.nameAr === rc.nameAr)

                              let highlightStyle = 'border-line hover:border-royal-300 dark:hover:border-royal-700'
                              if (isSelfActive) {
                                highlightStyle = 'border-royal-500 bg-royal-500/15 shadow-xl shadow-royal-500/10 ring-2 ring-royal-500'
                              } else if (isPrereqOfActive) {
                                highlightStyle = 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/80 animate-pulse'
                              } else if (isUnlockedByActive) {
                                highlightStyle = 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/80 animate-pulse'
                              }

                              return (
                                <motion.div
                                  key={idx}
                                  whileHover={prefersReduced ? {} : { scale: 1.01, x: 3 }}
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={selectedCourseKey === itemKey}
                                  aria-label={isArabic ? `عرض تفاصيل ${rc.nameAr}` : `Show details for ${rc.nameEn || rc.nameAr}`}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      setSelectedCourseKey(selectedCourseKey === itemKey ? null : itemKey)
                                    }
                                  }}
                                  onMouseEnter={() => setActiveCourseHover(rc)}
                                  onMouseLeave={() => setActiveCourseHover(null)}
                                  className={`relative p-3.5 rounded-xl border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-500 ${highlightStyle}`}
                                  onClick={() => setSelectedCourseKey(selectedCourseKey === itemKey ? null : itemKey)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                                      {rc.code && (
                                        <span className="font-mono text-[10px] font-bold text-accent dark:text-cyan-400 px-1.5 py-0.5 rounded bg-royal-500/10 shrink-0">
                                          {rc.code}
                                        </span>
                                      )}
                                      <span className="font-semibold text-sm text-ink truncate">
                                        {isArabic ? rc.nameAr : rc.nameEn}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ms-2">
                                      {isPrereqOfActive && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500 text-white">
                                          {isArabic ? 'متطلب سابق ✓' : 'Prereq'}
                                        </span>
                                      )}
                                      {isUnlockedByActive && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white">
                                          {isArabic ? 'يفتح بعده 🔓' : 'Unlocks'}
                                        </span>
                                      )}
                                      {rc.url && (
                                        <a href={rc.url} onClick={e => e.stopPropagation()} className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 rounded-lg transition-colors" title={isArabic ? 'تصفح شروحات المساق' : 'View course lectures'}>
                                          <FiLink2 size={14} />
                                        </a>
                                      )}
                                      {hasPrereq && (
                                        <FiArrowRight size={14} className={`text-slate-400 ${isArabic ? 'rotate-180' : ''}`} />
                                      )}
                                      {editing && (
                                        <>
                                          <button onClick={(e) => { e.stopPropagation(); handleEditCourse(rc) }} className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-royal-500 rounded-lg transition">
                                            <FiEdit2 size={14} />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(rc) }} className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-red-500 rounded-lg transition">
                                            <FiTrash2 size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {courseData && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 me-4">
                                      {isArabic ? courseData.doctorAr : courseData.doctorEn}
                                    </p>
                                  )}

                                  {/* Expandable prerequisites box */}
                                  {(selectedCourseKey === itemKey || isSelfActive) && hasPrereq && (
                                    <motion.div
                                      initial={prefersReduced ? {} : { opacity: 0, height: 0 }}
                                      animate={prefersReduced ? {} : { opacity: 1, height: 'auto' }}
                                      className="mt-3 pt-3 border-t border-black/5 dark:border-white/10"
                                    >
                                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                        <FiAward size={12} />
                                        <span className="font-bold">{t('roadmap.prerequisites')}:</span>
                                      </div>
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {rc.prerequisites.map((p, pi) => (
                                          <span key={pi} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">
                                            {p}
                                          </span>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) handleDeleteCourse(confirmDelete) }}
        title={t('inline.course-roadmap.delete-course')}
        message={t('inline.course-roadmap.are-you-sure-you')}
      />
    </motion.div>
  )
}
