import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiVideo, FiDownload, FiExternalLink, FiCopy, FiTool, FiPlay } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { deleteLecture, updateLecture } from '../../services'
import { useLanguage } from '../../context/LanguageContext'
import usePagination from '../../hooks/usePagination'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import { lectureVideoId, lectureThumb } from '../../utils/helpers'
import { exportToJson } from '../../utils/adminShared'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'

function LecturesTable({ lectures, courses, loading, isArabic, onEdit, onAdd, onRefresh }) {
 const { t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const [search, setSearch] = useState('')
 const [filterCourse, setFilterCourse] = useState('all')
 const [confirmDeleteId, setConfirmDeleteId] = useState(null)
 const [sortBy, setSortBy] = useState('dateNew')
 const [fixing, setFixing] = useState(false)

 const filteredLectures = lectures.filter(l => {
  const q = search.toLowerCase()
  const matchesSearch = !search ||
   l.titleAr?.toLowerCase().includes(q) ||
   l.titleEn?.toLowerCase().includes(q) ||
   l.subjectAr?.toLowerCase().includes(q) ||
   l.subjectEn?.toLowerCase().includes(q) ||
   l.doctor?.toLowerCase().includes(q) ||
   l.doctorAr?.toLowerCase().includes(q) ||
   l.doctorEn?.toLowerCase().includes(q)
  const matchesCourse = filterCourse === 'all' ||
   l.courseId === filterCourse ||
   (!l.courseId && (l.subjectAr === courses.find(c => c.id === filterCourse)?.nameAr ||
            l.subjectEn === courses.find(c => c.id === filterCourse)?.nameEn))
  return matchesSearch && matchesCourse
 }).sort((a, b) => {
  if (sortBy === 'nameAr') return (a.titleAr || '').localeCompare(b.titleAr || '', 'ar')
  if (sortBy === 'nameEn') return (a.titleEn || '').localeCompare(b.titleEn || '', 'en')
  if (sortBy === 'dateNew') return (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')
  if (sortBy === 'dateOld') return (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '')
  if (sortBy === 'createdNew') return (b.createdAt || '').localeCompare(a.createdAt || '')
  if (sortBy === 'order') return (a.sortOrder || 0) - (b.sortOrder || 0) || (b.date || '').localeCompare(a.date || '')
  return (a.sortOrder || 0) - (b.sortOrder || 0) || (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || '')
 })

 const { paginatedItems, page, setPage, totalPages, totalItems } = usePagination(filteredLectures, 10)

 const handleDelete = async (id) => {
  try {
   await deleteLecture(id)
   toast.success(t('admin.deleted'))
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('admin.deleteError'))
  }
 }

 const handleCopyUrl = async (url) => {
  try {
   await navigator.clipboard.writeText(url)
   toast.success(isArabic ? 'تم نسخ الرابط' : 'URL copied')
  } catch (e) {
   toast.error(isArabic ? 'فشل النسخ' : 'Copy failed')
  }
 }

 const handleFixThumbnails = async () => {
  const missing = lectures.filter(l => !lectureVideoId(l) && l.url)
  if (missing.length === 0) {
   toast.success(isArabic ? 'لا توجد محاضرات تحتاج إصلاح' : 'No lectures need fixing')
   return
  }
  setFixing(true)
  let ok = 0
  try {
   for (const l of missing) {
    const vid = lectureVideoId(l)
    if (vid) {
     await updateLecture(l.id, { ...l, videoId: vid })
     ok += 1
    }
   }
   toast.success(isArabic
    ? `تم إصلاح ${ok} من ${missing.length} محاضرة`
    : `Fixed ${ok} of ${missing.length} lectures`)
  } catch (error) {
   toast.error(isArabic ? 'فشل إصلاح الصور المصغرة' : 'Failed to fix thumbnails')
  }
  setFixing(false)
  if (ok > 0 && onRefresh) onRefresh()
 }

 if (loading) {
  return <SkeletonRow count={6} widths={['70%']} />
 }

 return (
  <motion.div className="space-y-4" variants={prefersReduced ? pageContainerReduced : pageContainer} initial="hidden" animate="visible">
   <div className="flex justify-between items-center flex-wrap gap-3">
    <p className="text-sm text-slate-500 dark:text-slate-400 ">
     {isArabic ? `${lectures.length} محاضرة مسجلة` : `${lectures.length} lectures registered`}
    </p>
    <div className="flex gap-2 flex-wrap">
     <button
      onClick={handleFixThumbnails}
      disabled={fixing}
      className="flex items-center gap-2 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
      title={isArabic ? 'استخراج الصور المصغرة من الروابط الناقصة' : 'Backfill missing thumbnails from URLs'}
     >
      <FiTool size={14} />
      {fixing ? (isArabic ? 'جاري الإصلاح...' : 'Fixing...') : (isArabic ? 'إصلاح الصور المصغرة' : 'Fix thumbnails')}
     </button>
     <button
      onClick={() => exportToJson('lectures', t, lectures)}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
     >
      <FiDownload size={14} /> {t('admin.export') || (isArabic ? 'تصدير' : 'Export')}
     </button>
     <select
      value={filterCourse}
      onChange={e => setFilterCourse(e.target.value)}
      className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal-400/50"
     >
      <option value="all">{t('admin.allTypes')}</option>
      {courses.map(c => (
       <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.nameEn}</option>
      ))}
     </select>
     <select
      value={sortBy}
      onChange={e => setSortBy(e.target.value)}
      className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal-400/50"
     >
      <option value="order">{isArabic ? 'حسب الترتيب اليدوي' : 'Manual order'}</option>
      <option value="dateNew">{isArabic ? 'الأحدث أولاً' : 'Newest first'}</option>
      <option value="dateOld">{isArabic ? 'الأقدم أولاً' : 'Oldest first'}</option>
      <option value="createdNew">{isArabic ? 'حسب تاريخ الإضافة' : 'By added date'}</option>
      <option value="nameAr">{isArabic ? 'الاسم عربي' : 'Name (AR)'}</option>
      <option value="nameEn">{isArabic ? 'الاسم إنجليزي' : 'Name (EN)'}</option>
     </select>
      <input
       type="text"
       placeholder={isArabic ? 'بحث بالعنوان، المادة، الدكتور...' : 'Search title, subject, doctor...'}
       value={search}
       onChange={e => { setSearch(e.target.value); setPage(1) }}
       aria-label={isArabic ? 'بحث في المحاضرات' : 'Search lectures'}
       className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-48"
      />
     <button
      onClick={onAdd}
      className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition"
     >
      <FiPlus size={14} /> {t('common.add')}
     </button>
    </div>
   </div>

   {filteredLectures.length === 0 ? (
    <div className="glass rounded-xl p-12 text-center border border-white/10">
     <FiVideo className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
     <p className="text-slate-500 dark:text-slate-400 ">{t('admin.noData')}</p>
    </div>
   ) : (
    <div className="space-y-2">
     {paginatedItems.map((lecture) => {
      const videoId = lectureVideoId(lecture)
      const thumb = videoId ? lectureThumb(videoId, 'mq') : null
      return (
      <motion.div
       key={lecture.id}
       variants={prefersReduced ? pageItemReduced : pageItem}
       className="glass rounded-xl p-4 border border-white/10 hover:border-royal-500/30 transition-colors"
      >
       <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
         <div className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-black/30 flex items-center justify-center">
          {thumb ? (
           <img src={thumb} alt="" width="160" height="90" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-cyan-500/20" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-7 h-7 bg-rose-500/80 rounded-full flex items-center justify-center text-white">
            <FiPlay size={12} className="ms-0.5" />
           </div>
          </div>
         </div>
         <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy-900 dark:text-white text-sm truncate">
           {isArabic ? lecture.titleAr : lecture.titleEn}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
           {lecture.date && <span>{lecture.date}</span>}
           {(lecture.subjectAr || lecture.subjectEn) && (
            <span className="px-1.5 py-0.5 bg-royal-500/10 text-royal-500 rounded-full">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
           )}
           {!videoId && lecture.url && (
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">{isArabic ? 'بدون صورة' : 'No thumb'}</span>
           )}
          </p>
          {lecture.url && (
           <a href={lecture.url} target="_blank" rel="noopener noreferrer" className="text-xs text-royal-500 hover:underline truncate block mt-1">
            {lecture.url}
           </a>
          )}
         </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
         {lecture.url && (
          <>
           <a href={lecture.url} target="_blank" rel="noopener noreferrer" className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors" aria-label={isArabic ? 'فتح الفيديو' : 'Open video'}>
            <FiExternalLink size={14} />
           </a>
           <button onClick={() => handleCopyUrl(lecture.url)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" aria-label={isArabic ? 'نسخ الرابط' : 'Copy URL'}>
            <FiCopy size={14} />
           </button>
          </>
         )}
         <button onClick={() => onEdit(lecture)} className="p-2 text-royal-500 hover:bg-royal-500/10 rounded-lg transition-colors" aria-label={t('common.edit')}>
          <FiEdit2 size={14} />
         </button>
         <button onClick={() => setConfirmDeleteId(lecture.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" aria-label={t('common.delete')}>
          <FiTrash2 size={14} />
         </button>
        </div>
       </div>
      </motion.div>
      )
     })}
    </div>
   )}
   <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} isArabic={isArabic} />
   <ConfirmDialog
    isOpen={!!confirmDeleteId}
    onClose={() => setConfirmDeleteId(null)}
    onConfirm={() => handleDelete(confirmDeleteId)}
    title={t('admin.confirmDelete')}
    message={t('admin.confirmDeleteLecture')}
    confirmText={t('common.delete')}
    cancelText={t('common.cancel')}
    variant="danger"
   />
  </motion.div>
 )
}

export default memo(LecturesTable)
