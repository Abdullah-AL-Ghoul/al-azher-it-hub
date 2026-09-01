import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getCourses, getRoadmap, saveRoadmap } from '../services'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { FiBookOpen, FiArrowRight, FiLayers, FiAward, FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiLink2 } from 'react-icons/fi'
import ErrorState from '../components/feedback/ErrorState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import Lazy3DScene from '../components/three/Lazy3DScene'
import toast from 'react-hot-toast'
import Skeleton from '../components/shared/Skeleton'

const containerVariants = pageContainer
const itemVariants = pageItem

const YEAR_COLORS = [
 { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', accent: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
 { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', accent: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
 { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', accent: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
 { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', accent: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
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
 const [selectedCourse, setSelectedCourse] = useState(null)
 const [error, setError] = useState(null)
 const prefersReduced = useReducedMotion()

 const [editing, setEditing] = useState(false)
 const [editData, setEditData] = useState([])
 const [showForm, setShowForm] = useState(false)
 const [formData, setFormData] = useState({
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
   setCourses(c)
   setRoadmap(r)
   setEditData(r)
   setError(null)
  } catch (e) {
   if (mountedRef.current) setError(e)
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

 const getCoursesForSlot = (year, semester) => {
  return editData.filter(c => c.year === year && c.semester === semester)
   .sort((a, b) => (a.order || 0) - (b.order || 0))
 }

 const getCourseByName = useMemo(() => {
  const map = new Map(courses.map(c => [(isArabic ? c.nameAr : c.nameEn), c]))
  return (name) => map.get(name)
 }, [courses, isArabic])

 const resetForm = () => {
  setFormData({ nameAr: '', nameEn: '', year: 1, semester: 1, order: 0, prerequisites: [], url: '' })
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
   toast.error(isArabic ? 'أدخل اسم المادة' : 'Enter course name')
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
   toast.success(isArabic ? 'تم الحفظ' : 'Saved')
  } catch (e) {
   toast.error(isArabic ? 'فشل الحفظ' : 'Save failed')
  }
 }

 const handleDeleteCourse = (course) => {
  setEditData(editData.filter(c => !(c.nameAr === course.nameAr && c.nameEn === course.nameEn)))
 }

 const handleSaveAll = async () => {
  try {
   await saveRoadmap(editData)
   setRoadmap(editData)
   setEditing(false)
   toast.success(isArabic ? 'تم الحفظ' : 'Saved')
  } catch (e) {
   toast.error(isArabic ? 'فشل الحفظ' : 'Save failed')
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
       {[1,2,3,4].map(i => (
        <div key={i} className="glass p-6 rounded-xl">
         <Skeleton className="h-6 w-3/4 rounded-lg mb-4" />
         <div className="space-y-3">
          {[1,2,3].map(j => <div key={j} className="skeleton h-16 rounded-xl" />)}
         </div>
        </div>
       ))}
      </div>
    </div>
   </div>
  )
 }

 return (
   <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page ">
    <div className="py-16 mb-12 page-hero">
     {/* 3D winding path behind the header (desktop) / floating motifs */}
     <Lazy3DScene
      className="absolute inset-0 opacity-60"
      scene={() => import('../components/three/RoadmapScene')}
      sceneProps={{ theme: 'dark' }}
      fallbackLabel={isArabic ? 'مسار ثلاثي الأبعاد' : '3D learning path'}
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
       <span className="text-slate-600 dark:text-white/60 text-xs font-medium">{t('roadmap.interactivePlan')}</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{t('roadmap.title')}</h1>
      <p className="text-slate-500 dark:text-white/50 text-lg max-w-2xl mx-auto">{t('roadmap.subtitle')}</p>
     </div>
    </div>

   <div className="container-page">
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
         <FiPlus size={16} /> {isArabic ? 'إضافة مادة' : 'Add Course'}
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
         {editingId ? (isArabic ? 'تعديل المادة' : 'Edit Course') : (isArabic ? 'إضافة مادة جديدة' : 'Add New Course')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الاسم بالعربي' : 'Name (AR)'}</label>
          <input value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} placeholder={isArabic ? 'اسم المادة' : 'Course name'} className={inputClass} />
         </div>
         <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الاسم بالإنجليزي' : 'Name (EN)'}</label>
          <input value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} placeholder="Course name" className={inputClass} />
         </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
         <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'السنة' : 'Year'}</label>
          <select value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} className={inputClass}>
           {[1,2,3,4].map(y => <option key={y} value={y}>{isArabic ? `السنة ${y}` : `Year ${y}`}</option>)}
          </select>
         </div>
         <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الفصل' : 'Semester'}</label>
          <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: parseInt(e.target.value) })} className={inputClass}>
           {[1,2].map(s => <option key={s} value={s}>{isArabic ? `الفصل ${s}` : `Semester ${s}`}</option>)}
          </select>
         </div>
         <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'الترتيب' : 'Order'}</label>
          <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className={inputClass} />
         </div>
         <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'رابط' : 'Link'}</label>
          <input value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." className={inputClass} />
         </div>
        </div>
        <div className="mb-4">
         <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{isArabic ? 'المتطلبات السابقة' : 'Prerequisites'}</label>
         <input value={formData.prerequisites.join(', ')} onChange={e => setFormData({ ...formData, prerequisites: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder={isArabic ? 'مفصل بفاصلة' : 'Comma separated'} className={inputClass} />
        </div>
        <div className="flex gap-2">
         <button onClick={handleSaveCourse} className="flex items-center gap-2 px-4 py-2 bg-royal-500 hover:bg-royal-600 text-white rounded-xl text-sm font-medium transition">
          <FiSave size={16} /> {editingId ? t('common.save') : (isArabic ? 'إضافة' : 'Add')}
         </button>
         <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
          <FiX size={16} /> {t('common.cancel')}
         </button>
        </div>
       </div>
      </motion.div>
     )}
    </AnimatePresence>

    {editData.length === 0 ? (
     <div className="text-center py-20">
      <FiBookOpen className="mx-auto text-6xl text-slate-300 dark:text-slate-600 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">{t('roadmap.noData')}</p>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{t('roadmap.noDataDesc')}</p>
     </div>
    ) : (
     <div className="space-y-8">
      {years.map(year => {
       const yearCourses = editData.filter(c => c.year === year)
       if (yearCourses.length === 0) return null
       const colors = YEAR_COLORS[year - 1] || YEAR_COLORS[0]

       return (
        <motion.div key={year} variants={itemVariants} className={`relative rounded-2xl glass border border-line p-6 overflow-hidden`}>
         <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl ${colors.dot} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
           {year}
          </div>
          <div>
           <h2 className={`text-xl font-bold ${colors.accent}`}>{isArabic ? `السنة الدراسية ${year}` : `Year ${year}`}</h2>
           <p className="text-xs text-slate-500 dark:text-slate-400 ">{yearCourses.length} {t('roadmap.coursesLabel')}</p>
          </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {semesters.map(sem => {
           const semCourses = getCoursesForSlot(year, sem)
           if (semCourses.length === 0) return null

           return (
            <div key={sem} className="rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-line p-4">
             <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
              {isArabic ? `الفصل ${sem}` : `Semester ${sem}`}
             </h3>
             <div className="space-y-2">
              {semCourses.map((rc, idx) => {
               const courseData = getCourseByName(rc.nameAr) || getCourseByName(rc.nameEn)
               const hasPrereq = rc.prerequisites && rc.prerequisites.length > 0

               return (
                <motion.div
                 key={idx}
                 whileHover={prefersReduced ? {} : { scale: 1.02, x: 4 }}
                 role="button"
                 tabIndex={0}
                 aria-expanded={selectedCourse === `${year}-${sem}-${idx}`}
                 aria-label={isArabic ? `عرض تفاصيل ${rc.nameAr}` : `Show details for ${rc.nameEn || rc.nameAr}`}
                 onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                   e.preventDefault()
                   setSelectedCourse(selectedCourse === `${year}-${sem}-${idx}` ? null : `${year}-${sem}-${idx}`)
                  }
                 }}
                 className={`relative p-3 rounded-xl border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-500 ${
                  selectedCourse === `${year}-${sem}-${idx}`
                   ? 'border-royal-500 bg-royal-500/10 shadow-lg shadow-royal-500/10'
                   : 'border-line hover:border-royal-300 dark:hover:border-royal-700'
                 }`}
                 onClick={() => setSelectedCourse(selectedCourse === `${year}-${sem}-${idx}` ? null : `${year}-${sem}-${idx}`)}
                >
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                   <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                   <span className="font-medium text-sm text-ink truncate">
                    {isArabic ? rc.nameAr : rc.nameEn}
                   </span>
                  </div>
                   <div className="flex items-center gap-1 shrink-0 ms-2">
                   {rc.url && (
                    <a href={rc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 rounded-lg transition-colors">
                     <FiLink2 size={14} />
                    </a>
                   )}
                   {hasPrereq && (
                    <FiArrowRight size={14} className={`text-slate-500 dark:text-slate-400 ${isArabic ? 'rotate-180' : ''}`} />
                   )}
                   {editing && (
                    <>
                     <button onClick={(e) => { e.stopPropagation(); handleEditCourse(rc) }} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-royal-500 hover:bg-royal-50 dark:hover:bg-royal-900/20 rounded-lg transition">
                      <FiEdit2 size={14} />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(rc) }} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
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

                 {selectedCourse === `${year}-${sem}-${idx}` && hasPrereq && (
                  <motion.div
                   initial={prefersReduced ? {} : { opacity: 0, height: 0 }}
                   animate={prefersReduced ? {} : { opacity: 1, height: 'auto' }}
                   className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700"
                  >
                   <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <FiAward size={12} />
                    <span className="font-medium">{t('roadmap.prerequisites')}:</span>
                   </div>
                   <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {rc.prerequisites.map((p, pi) => (
                     <span key={pi} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs">
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
    title={isArabic ? 'حذف المادة' : 'Delete course'}
    message={isArabic ? 'هل أنت متأكد من حذف هذه المادة من المسار الدراسي؟' : 'Are you sure you want to remove this course from the roadmap?'}
   />
  </motion.div>
 )
}
