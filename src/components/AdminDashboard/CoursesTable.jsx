import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiBookOpen, FiSearch, FiVideo, FiFile, FiCheckSquare, FiSquare, FiExternalLink } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { deleteCourse, addActivity } from '../../services'
import usePagination from '../../hooks/usePagination'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'
import { useLanguage } from '../../context/LanguageContext'

function CoursesTable({ courses, loading, isArabic, onEdit, onAdd, onRefresh }) {
  const { t } = useLanguage()
  const prefersReduced = useReducedMotion()
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
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
      toast.success(t('inline.courses-table.course-deleted'))
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error(t('inline.courses-table.failed-to-delete-course'))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length && paginatedItems.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedItems.map(c => c.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    let count = 0
    for (const id of selectedIds) {
      try {
        await deleteCourse(id)
        addActivity('courses', 'DELETE', id)
        count++
      } catch (_e) {}
    }
    toast.success(isArabic ? `تم حذف ${count} مادة بنجاح` : `Deleted ${count} courses`)
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
    if (onRefresh) onRefresh()
  }

  if (loading) {
    return <SkeletonRow count={10} widths={['70%', '90%']} />
  }

  return (
    <motion.div className="space-y-3" variants={prefersReduced ? pageContainerReduced : pageContainer} initial="hidden" animate="visible">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-navy-700 text-xs font-semibold text-ink hover:border-royal-500 transition shadow-sm"
            title={isArabic ? 'تحديد الكل في هذه الصفحة' : 'Select all on this page'}
          >
            {selectedIds.size === paginatedItems.length && paginatedItems.length > 0 ? (
              <FiCheckSquare className="text-royal-500" size={15} />
            ) : (
              <FiSquare className="text-slate-400" size={15} />
            )}
            <span>{isArabic ? `تحديد الكل (${selectedIds.size})` : `Select (${selectedIds.size})`}</span>
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm animate-pulse"
            >
              <FiTrash2 size={13} />
              <span>{isArabic ? `حذف المحدد (${selectedIds.size})` : `Delete (${selectedIds.size})`}</span>
            </button>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {isArabic ? `${filteredCourses.length} / ${courses.length} مادة` : `${filteredCourses.length} / ${courses.length} courses`}
          </p>

          <div className="relative">
            <FiSearch className="absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 start-3" size={14} />
            <input
              type="text"
              placeholder={t('inline.courses-table.search-name-or-doctor')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              aria-label={t('inline.courses-table.search-courses')}
              className="ps-8 pe-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-48"
            />
          </div>
        </div>

        <button
          onClick={() => onAdd && onAdd()}
          className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition shadow-sm"
        >
          <FiPlus size={14} /> {t('inline.courses-table.add-course')}
        </button>
      </div>

      {filteredCourses.length === 0 && (
        <div className="glass rounded-xl p-12 text-center border border-white/10">
          <FiBookOpen className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{search ? (t('inline.courses-table.no-search-results')) : (t('inline.courses-table.no-courses-registered'))}</p>
        </div>
      )}

      {paginatedItems.map((course) => {
        const isSelected = selectedIds.has(course.id)
        return (
          <motion.div
            key={course.id}
            variants={prefersReduced ? pageItemReduced : pageItem}
            className={`glass rounded-xl p-4 border transition-colors ${
              isSelected ? 'border-royal-500/80 bg-royal-500/5 dark:bg-royal-500/10' : 'border-white/10 hover:border-royal-500/30'
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleSelect(course.id)}
                  className="mt-2.5 p-1 text-slate-400 hover:text-royal-500 transition-colors"
                  title={isSelected ? (isArabic ? 'إلغاء التحديد' : 'Deselect') : (isArabic ? 'تحديد' : 'Select')}
                >
                  {isSelected ? (
                    <FiCheckSquare className="text-royal-500" size={18} />
                  ) : (
                    <FiSquare size={18} />
                  )}
                </button>

                <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-900/30 flex-shrink-0">
                  <FiBookOpen size={20} className="text-emerald-500 dark:text-emerald-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-ink truncate text-sm">
                      {isArabic ? course.nameAr : course.nameEn}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {isArabic ? `الدكتور: ${course.doctorAr || ''}` : `Dr: ${course.doctorEn || ''}`}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 rounded">
                      <FiVideo size={11} className="text-royal-500" /> {course.lectures?.length || 0}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 rounded">
                      <FiFile size={11} className="text-cyan-500" /> {course.sources?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEditCourse(course)}
                  className="p-2 text-royal-500 hover:bg-royal-500/10 rounded-lg transition-colors"
                  aria-label={t('inline.courses-table.edit-course')}
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(course.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  aria-label={t('inline.courses-table.delete-course')}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} isArabic={isArabic} />

      {/* Delete Course Confirm */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => handleDeleteCourse(confirmDeleteId)}
        title={t('inline.courses-table.confirm-deletion')}
        message={t('inline.courses-table.are-you-sure-you')}
        confirmText={t('inline.courses-table.delete')}
        cancelText={t('inline.courses-table.cancel')}
        variant="danger"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title={isArabic ? `حذف ${selectedIds.size} مادة` : `Delete ${selectedIds.size} courses`}
        message={
          isArabic
            ? `هل أنت متأكد من حذف ${selectedIds.size} مادة محددة؟ سيتم حذف جميع المحاضرات المرتبطة بها أيضاً.`
            : `Are you sure you want to delete ${selectedIds.size} selected courses? Associated lectures will also be affected.`
        }
        confirmText={isArabic ? 'حذف الكل المحدد' : 'Delete Selected'}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </motion.div>
  )
}

export default memo(CoursesTable)