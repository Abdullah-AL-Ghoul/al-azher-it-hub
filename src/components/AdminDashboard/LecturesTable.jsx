import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiVideo, FiDownload, FiExternalLink, FiCopy, FiTool, FiPlay, FiCpu, FiCheckSquare, FiSquare, FiEye } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { deleteLecture, updateLecture } from '../../services'
import { useLanguage } from '../../context/LanguageContext'
import usePagination from '../../hooks/usePagination'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import { lectureVideoId, lectureThumb, extractYouTubeId } from '../../utils/helpers'
import { exportToJson } from '../../utils/adminShared'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'
import LectureThumbnail from '../shared/LectureThumbnail'
import VideoPlayer from '../shared/VideoPlayer'
import Modal from '../ui/Modal'

function LecturesTable({ lectures, courses, loading, isArabic, onEdit, onAdd, onOpenSmart, onRefresh }) {
  const { t } = useLanguage()
  const prefersReduced = useReducedMotion()
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [sortBy, setSortBy] = useState('dateNew')
  const [fixing, setFixing] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [previewLecture, setPreviewLecture] = useState(null)

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
    if (sortBy === 'dateOld') return (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(a.createdAt || '')
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
      toast.success(t('inline.lectures-table.url-copied'))
    } catch (e) {
      toast.error(t('inline.lectures-table.copy-failed'))
    }
  }

  const handleFixThumbnails = async () => {
    const missing = lectures.filter(l => !l.videoId && extractYouTubeId(l.url))
    if (missing.length === 0) {
      toast.success(t('inline.lectures-table.no-lectures-need-fixing'))
      return
    }
    setFixing(true)
    let ok = 0
    try {
      for (const l of missing) {
        const vid = extractYouTubeId(l.url)
        if (vid) {
          await updateLecture(l.id, { videoId: vid })
          ok += 1
        }
      }
      toast.success(isArabic
        ? `تم إصلاح ${ok} من ${missing.length} محاضرة`
        : `Fixed ${ok} of ${missing.length} lectures`)
    } catch (error) {
      toast.error(t('inline.lectures-table.failed-to-fix-thumbnails'))
    }
    setFixing(false)
    if (ok > 0 && onRefresh) onRefresh()
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
      setSelectedIds(new Set(paginatedItems.map(l => l.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    let count = 0
    for (const id of selectedIds) {
      try {
        await deleteLecture(id)
        count++
      } catch (_e) {}
    }
    toast.success(isArabic ? `تم حذف ${count} محاضرة بنجاح` : `Deleted ${count} lectures`)
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
    if (onRefresh) onRefresh()
  }

  if (loading) {
    return <SkeletonRow count={6} widths={['70%']} />
  }

  return (
    <motion.div className="space-y-4" variants={prefersReduced ? pageContainerReduced : pageContainer} initial="hidden" animate="visible">
      {/* Top Action Bar */}
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
            {isArabic ? `${lectures.length} محاضرة مسجلة` : `${lectures.length} lectures registered`}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleFixThumbnails}
            disabled={fixing}
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            title={t('inline.lectures-table.backfill-missing-thumbnails-from')}
          >
            <FiTool size={14} />
            {fixing ? (t('inline.lectures-table.fixing')) : (t('inline.lectures-table.fix-thumbnails'))}
          </button>
          <button
            onClick={() => exportToJson('lectures', t, lectures)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
          >
            <FiDownload size={14} /> {t('admin.export') || (t('inline.lectures-table.export'))}
          </button>
          <select
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
          >
            <option value="all">{t('admin.allTypes')}</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.nameEn}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
          >
            <option value="order">{t('inline.lectures-table.manual-order')}</option>
            <option value="dateNew">{t('inline.lectures-table.newest-first')}</option>
            <option value="dateOld">{t('inline.lectures-table.oldest-first')}</option>
            <option value="createdNew">{t('inline.lectures-table.by-added-date')}</option>
            <option value="nameAr">{t('inline.lectures-table.name-ar')}</option>
            <option value="nameEn">{t('inline.lectures-table.name-en')}</option>
          </select>
          <input
            type="text"
            placeholder={t('inline.lectures-table.search-title-subject-doctor')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            aria-label={t('inline.lectures-table.search-lectures')}
            className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-48"
          />
          {onOpenSmart && (
            <button
              onClick={onOpenSmart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-academic-primary to-royal-600 hover:from-royal-700 hover:to-royal-800 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-royal-600/20"
              title={isArabic ? 'توليد مادة ومحاضرات تلقائياً بالذكاء الاصطناعي' : 'Auto-Generate Course & Lectures with AI'}
            >
              <FiCpu size={14} className="text-amber-300" />
              <span>{isArabic ? 'توليد ذكي (AI)' : 'AI Generator'}</span>
            </button>
          )}
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
          <p className="text-slate-500 dark:text-slate-400">{t('admin.noData')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedItems.map((lecture) => {
            const videoId = lectureVideoId(lecture)
            const isSelected = selectedIds.has(lecture.id)
            return (
              <motion.div
                key={lecture.id}
                variants={prefersReduced ? pageItemReduced : pageItem}
                className={`glass rounded-xl p-3 sm:p-4 border transition-colors ${
                  isSelected ? 'border-royal-500/80 bg-royal-500/5 dark:bg-royal-500/10' : 'border-white/10 hover:border-royal-500/30'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(lecture.id)}
                      className="mt-3 p-1 text-slate-400 hover:text-royal-500 transition-colors"
                      title={isSelected ? (isArabic ? 'إلغاء التحديد' : 'Deselect') : (isArabic ? 'تحديد' : 'Select')}
                    >
                      {isSelected ? (
                        <FiCheckSquare className="text-royal-500" size={18} />
                      ) : (
                        <FiSquare size={18} />
                      )}
                    </button>

                    {/* Thumbnail & Quick Play */}
                    <div
                      onClick={() => setPreviewLecture(lecture)}
                      role="button"
                      tabIndex={0}
                      className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer group"
                      title={isArabic ? 'معاينة فورية للمحاضرة' : 'Quick preview lecture'}
                    >
                      <LectureThumbnail
                        videoId={videoId}
                        thumbnail={lecture.thumbnail || lecture.thumbUrl}
                        alt={isArabic ? lecture.titleAr : lecture.titleEn}
                        width={120}
                        height={68}
                        sizes="96px"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                        <div className="w-7 h-7 bg-rose-500/90 group-hover:bg-rose-500 rounded-full flex items-center justify-center text-white shadow-md transform group-hover:scale-110 transition-transform">
                          <FiPlay size={12} className="ms-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-ink text-sm truncate">
                          {isArabic ? lecture.titleAr : lecture.titleEn}
                        </h3>
                        {videoId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                            HD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        {lecture.date && <span>{lecture.date}</span>}
                        {(lecture.subjectAr || lecture.subjectEn) && (
                          <span className="px-1.5 py-0.5 bg-royal-500/10 text-royal-500 rounded-full">
                            {isArabic ? lecture.subjectAr : lecture.subjectEn}
                          </span>
                        )}
                        {!videoId && lecture.url && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                            {t('inline.lectures-table.no-thumb')}
                          </span>
                        )}
                      </p>
                      {lecture.url && (
                        <a
                          href={lecture.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-royal-500 hover:underline truncate block mt-1"
                        >
                          {lecture.url}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setPreviewLecture(lecture)}
                      className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      title={isArabic ? 'معاينة الفيديو' : 'Preview video'}
                      aria-label="Preview video"
                    >
                      <FiEye size={15} />
                    </button>
                    {lecture.url && (
                      <>
                        <a
                          href={lecture.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          aria-label={t('inline.lectures-table.open-video')}
                        >
                          <FiExternalLink size={14} />
                        </a>
                        <button
                          onClick={() => handleCopyUrl(lecture.url)}
                          className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          aria-label={t('inline.lectures-table.copy-url')}
                        >
                          <FiCopy size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onEdit(lecture)}
                      className="p-2 text-royal-500 hover:bg-royal-500/10 rounded-lg transition-colors"
                      aria-label={t('common.edit')}
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(lecture.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label={t('common.delete')}
                    >
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

      {/* Delete Single Lecture Confirm */}
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

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title={isArabic ? `حذف ${selectedIds.size} محاضرة` : `Delete ${selectedIds.size} lectures`}
        message={
          isArabic
            ? `هل أنت متأكد من حذف ${selectedIds.size} محاضرة محددة؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete ${selectedIds.size} selected lectures? This action cannot be undone.`
        }
        confirmText={isArabic ? 'حذف الكل المحدد' : 'Delete Selected'}
        cancelText={t('common.cancel')}
        variant="danger"
      />

      {/* Quick In-Dashboard Video Preview Modal */}
      {previewLecture && (
        <Modal
          isOpen={!!previewLecture}
          onClose={() => setPreviewLecture(null)}
          title={isArabic ? previewLecture.titleAr || previewLecture.titleEn : previewLecture.titleEn || previewLecture.titleAr}
          size="lg"
        >
          <div className="space-y-4">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
              <VideoPlayer
                videoId={lectureVideoId(previewLecture)}
                url={previewLecture.url}
                thumbnail={previewLecture.thumbnail || previewLecture.thumbUrl}
                title={isArabic ? previewLecture.titleAr : previewLecture.titleEn}
                lectureId={previewLecture.id}
                autoPlay={true}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/50 pt-3">
              <div>
                <span>{isArabic ? previewLecture.subjectAr : previewLecture.subjectEn}</span>
                {previewLecture.doctor && <span className="ms-2">· {previewLecture.doctor}</span>}
              </div>
              {previewLecture.url && (
                <a
                  href={previewLecture.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-royal-500 hover:underline"
                >
                  <FiExternalLink size={12} />
                  <span>{isArabic ? 'فتح في يوتيوب' : 'Open in YouTube'}</span>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}

export default memo(LecturesTable)
