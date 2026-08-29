import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiBookOpen, FiSearch, FiVideo, FiFile } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { deleteCourse, addActivity } from '../../services'
import usePagination from '../../hooks/usePagination'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'

function CoursesTable({ courses, loading, isArabic, onEdit, onAdd, onRefresh }) {
  const prefersReduced = useReducedMotion()
 const [confirmDeleteId, setConfirmDeleteId] = useState(null)
 const [search, setSearch] = useState('')
 const filteredCourses = courses.filter(course => {
  if (!search) return true
  const q = search.toLowerCase()
  return (
   course.nameAr?.toLowerCase().includes(q) ||
   course.nameEn?.toLowerCase().includes(q) ||
   course.doctorAr?.toLowerCase().includes(q) ||
   course.doctorEn?.toLowerCase().includes(q)
  )
 })
 const { paginatedItems, page, setPage, totalPages, totalItems } = usePagination(filteredCourses, 10)

 const handleEditCourse = (course) => {
  onEdit(course)
 }

 const handleDeleteCourse = async (courseId) => {
  try {
   await deleteCourse(courseId)
   addActivity('courses', 'DELETE', courseId)
   toast.success(isArabic ? 'تم حذف المادة' : 'Course deleted')
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(isArabic ? 'فشل حذف المادة' : 'Failed to delete course')
  }
 }

 if (loading) {
  return <SkeletonRow count={10} widths={['70%', '90%']} />
 }

  return (
   <motion.div className="space-y-3" variants={prefersReduced ? pageContainerReduced : pageContainer} initial="hidden" animate="visible">
    <div className="flex justify-between items-center flex-wrap gap-3">
     <div className="flex items-center gap-3 flex-wrap">
      <p className="text-sm text-slate-500 dark:text-slate-400 ">
       {isArabic ? `${filteredCourses.length} / ${courses.length} مادة` : `${filteredCourses.length} / ${courses.length} courses`}
      </p>
      <div className="relative">
       <FiSearch className={`absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 start-3`} size={14} />
       <input
        type="text"
        placeholder={isArabic ? 'بحث بالاسم أو الدكتور...' : 'Search name or doctor...'}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        aria-label={isArabic ? 'بحث في المواد' : 'Search courses'}
        className={`ps-8 pe-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-48`}
       />
      </div>
     </div>
     <button
      onClick={() => onAdd && onAdd()}
      className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition">
      <FiPlus size={14} /> {isArabic ? 'إضافة مادة' : 'Add Course'}
     </button>
    </div>

    {filteredCourses.length === 0 && (
     <div className="glass rounded-xl p-12 text-center border border-white/10">
      <FiBookOpen className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
      <p className="text-slate-500 dark:text-slate-400 ">{search ? (isArabic ? 'لا توجد نتائج للبحث' : 'No search results') : (isArabic ? 'لا توجد مواد مسجلة' : 'No courses registered')}</p>
     </div>
    )}

   {paginatedItems.map((course) => (
    <motion.div
     key={course.id}
     variants={prefersReduced ? pageItemReduced : pageItem}
     className="glass rounded-xl p-4 border border-white/10 hover:border-royal-500/30 transition-colors"
    >
     <div className="flex justify-between items-start gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
       <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-900/30 flex-shrink-0">
        <FiBookOpen size={20} className="text-emerald-500 dark:text-emerald-400" />
       </div>
       <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
         <h3 className="font-semibold text-ink truncate">
          {isArabic ? course.nameAr : course.nameEn}
         </h3>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
         {isArabic ? `الدكتور: ${course.doctorAr || ''}` : `Dr: ${course.doctorEn || ''}`}
        </div>
<div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded"><FiVideo size={10} /> {course.lectures?.length || 0}</span>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded"><FiFile size={10} /> {course.sources?.length || 0}</span>
        </div>
       </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
       <button onClick={() => handleEditCourse(course)} className="p-2 text-royal-500 hover:bg-royal-500/10 rounded-lg transition-colors" aria-label={isArabic ? 'تعديل المادة' : 'Edit course'}>
        <FiEdit2 size={14} />
       </button>
       <button
        onClick={() => setConfirmDeleteId(course.id)}
        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        aria-label={isArabic ? 'حذف المادة' : 'Delete course'}
       >
        <FiTrash2 size={14} />
       </button>
      </div>
     </div>
    </motion.div>
   ))}
   <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} isArabic={isArabic} />
   <ConfirmDialog
    isOpen={!!confirmDeleteId}
    onClose={() => setConfirmDeleteId(null)}
    onConfirm={() => handleDeleteCourse(confirmDeleteId)}
    title={isArabic ? 'تأكيد الحذف' : 'Confirm Deletion'}
    message={isArabic ? 'هل أنت متأكد من حذف هذه المادة؟' : 'Are you sure you want to delete this course?'}
    confirmText={isArabic ? 'حذف' : 'Delete'}
    cancelText={isArabic ? 'إلغاء' : 'Cancel'}
    variant="danger"
   />
  </motion.div>
 )
}

export default memo(CoursesTable)