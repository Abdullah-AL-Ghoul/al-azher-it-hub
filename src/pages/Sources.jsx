import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getSources, addSource, addStudentLog } from '../services'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useFileUpload } from '../hooks/useFileUpload'
import { useScrollLock } from '../hooks/useScrollLock'
import { formatBytes } from '../services/sourceStorage'
import { signSourceForFetch } from '../services/sourceStorage'
import useSecureSourceFile from '../hooks/useSecureSourceFile'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { SORT_OPTIONS, getSourceFiles, storagePathFromUrl } from '../utils/helpers'
import { isSafeUrl } from '../utils/sanitize'
import toast from 'react-hot-toast'
import PageHero from '../components/shared/PageHero'
import FilterBar from '../components/FilterBar'
import CustomSelect from '../components/shared/CustomSelect'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import FilePreviewModal from '../components/shared/FilePreviewModal'
import { 
  FiExternalLink, 
  FiFile, 
  FiLink, 
  FiFileText, 
  FiImage, 
  FiVideo, 
  FiUpload, 
  FiX, 
  FiLoader, 
  FiTrash2, 
  FiCheck, 
  FiAlertCircle, 
  FiSearch, 
  FiDownload, 
  FiFolder,
  FiAward,
  FiBookOpen,
  FiEye,
  FiShare2,
  FiHelpCircle,
  FiLayers,
  FiStar,
  FiBookmark
} from 'react-icons/fi'
import Skeleton from '../components/shared/Skeleton'
import { SOURCE_CATEGORIES, EXAM_SUB_TYPES, ACADEMIC_YEAR_FILTERS, classifySource } from '../data/sourceCategories'

const sortOptions = SORT_OPTIONS
const containerVariants = pageContainer
const itemVariants = pageItem

function getFileIcon(url, fileName) {
  const name = fileName || url || ''
  if (!name) return <FiFile size={20} />
  const ext = name.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext)) return <FiFileText size={20} className="text-red-400" />
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FiImage size={20} className="text-green-400" />
  if (['mp4', 'mkv', 'avi'].includes(ext)) return <FiVideo size={20} className="text-purple-400" />
  if (['doc', 'docx'].includes(ext)) return <FiFileText size={20} className="text-blue-400" />
  if (name.includes('youtube') || name.includes('youtu.be')) return <FiVideo size={20} className="text-rose-400" />
  if (name.includes('drive.google')) return <FiFileText size={20} className="text-blue-400" />
  return <FiLink size={20} className="text-cyan-400" />
}

function isRecentlyAdded(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  return diff < 7 * 24 * 60 * 60 * 1000
}

function UploadModal({ isOpen, onClose, onSubmit, isArabic, t }) {
  const prefersReduced = useReducedMotion()
  const [titleAr, setTitleAr] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [subjectAr, setSubjectAr] = useState('')
  const [subjectEn, setSubjectEn] = useState('')
  const [category, setCategory] = useState('summary')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const upload = useFileUpload()
  const modalRef = useFocusTrap(isOpen)

  const processFiles = async (fileList) => {
    if (!fileList?.length) return
    const res = await upload.uploadFiles(fileList, isArabic)
    const uploaded = res?.uploaded || []
    if (uploaded.length > 0 && !titleAr) setTitleAr(uploaded[0].name.replace(/\.[^/.]+$/, ''))
    if (uploaded.length > 0 && !titleEn) setTitleEn(uploaded[0].name.replace(/\.[^/.]+$/, ''))
  }

  const handleFileSelect = async (e) => {
    await processFiles(e.target.files)
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    await processFiles(e.dataTransfer.files)
  }

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titleAr.trim() && !titleEn.trim()) {
      toast.error(t('inline.sources.enter-source-title'))
      return
    }
    if (upload.files.length === 0 && !url.trim()) {
      toast.error(t('inline.sources.upload-a-file-or'))
      return
    }
    if (upload.uploading) {
      toast.error(t('inline.sources.please-wait-for-uploads'))
      return
    }

    setSubmitting(true)
    try {
      const uploadedFiles = upload.files || []
      const now = new Date().toISOString()
      await addSource({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        subjectAr: subjectAr.trim(),
        subjectEn: subjectEn.trim(),
        category,
        url: url.trim(),
        files: uploadedFiles,
        fileData: uploadedFiles[0]?.url || null,
        fileName: uploadedFiles[0]?.name || null,
        filePath: uploadedFiles[0]?.path || null,
        date: now,
      })

      toast.success(t('sources.uploadSuccess'))
      setTitleAr('')
      setTitleEn('')
      setSubjectAr('')
      setSubjectEn('')
      setCategory('summary')
      setUrl('')
      upload.reset()
      onClose()
      onSubmit()
    } catch (err) {
      toast.error(t('sources.uploadError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          {...(prefersReduced
            ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
            : { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 } })}
          role="dialog"
          aria-modal="true"
          aria-label={t('inline.sources.upload-file')}
          className="modal-spatial rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-ink">{t('sources.uploadFile')}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" aria-label={t('inline.sources.close')}>
              <FiX size={18} className="text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sources-title-ar" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('inline.sources.title-ar')}</label>
                <input
                  id="sources-title-ar"
                  value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
                  placeholder={t('inline.sources.source-title')}
                />
              </div>
              <div>
                <label htmlFor="sources-title-en" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('inline.sources.title-en')}</label>
                <input
                  id="sources-title-en"
                  value={titleEn}
                  onChange={e => setTitleEn(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
                  placeholder="Source title"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sources-subject-ar" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('inline.sources.subject-ar')}</label>
                <input
                  id="sources-subject-ar"
                  value={subjectAr}
                  onChange={e => setSubjectAr(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
                  placeholder={t('inline.sources.subject-name')}
                />
              </div>
              <div>
                <label htmlFor="sources-subject-en" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('inline.sources.subject-en')}</label>
                <input
                  id="sources-subject-en"
                  value={subjectEn}
                  onChange={e => setSubjectEn(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
                  placeholder="Subject name"
                />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label htmlFor="sources-category" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                {isArabic ? 'تصنيف المادة الأكاديمية' : 'Material Academic Category'}
              </label>
              <select
                id="sources-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 font-medium"
              >
                <option value="summary">{isArabic ? 'ملخص ومذكرة دراسية 📑' : 'Summary & Notes'}</option>
                <option value="midterm">{isArabic ? 'نموذج امتحان نصفي (Midterm) 📝' : 'Midterm Exam'}</option>
                <option value="final">{isArabic ? 'نموذج امتحان نهائي (Final) 🏆' : 'Final Exam'}</option>
                <option value="quiz">{isArabic ? 'كويز أو اختبار قصير ⏱️' : 'Quiz / Assignment'}</option>
                <option value="slides">{isArabic ? 'سلايدات وتفريغات رسمية 📊' : 'Lecture Slides'}</option>
                <option value="reference">{isArabic ? 'مرجع أو كتاب إثرائي 📘' : 'Reference / Book'}</option>
              </select>
            </div>

            <div>
              <label htmlFor="sources-url" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('inline.sources.url-optional')}</label>
              <input
                id="sources-url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-slate-50 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
                placeholder="https://..."
                type="url"
                inputMode="url"
                disabled={upload.files.length > 0}
              />
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 transition-colors ${isDragging ? 'border-royal-400 bg-royal-500/5' : 'border-slate-300 dark:border-slate-600 hover:border-royal-400'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {upload.uploading && (
                <div className="flex items-center gap-2 mb-3 text-royal-500 text-sm justify-center">
                  <FiLoader size={14} className="animate-spin" />
                  {t('inline.sources.uploading')}
                </div>
              )}

              {upload.files.length > 0 ? (
                <div className="space-y-2">
                  {upload.files.map((f, idx) => {
                    const p = upload.progress[f.name]
                    const status = p?.status || 'success'
                    const pct = p?.progress || 100
                    return (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                        <FiFile size={16} className="text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-emerald-700 dark:text-emerald-400 truncate">{f.name}</span>
                            <span className="text-xs text-slate-500 flex-shrink-0">{formatBytes(f.size || 0)}</span>
                          </div>
                          {status === 'uploading' && (
                            <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-royal-500 transition" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                        {status === 'success' && <FiCheck size={14} className="text-emerald-500 flex-shrink-0" />}
                        {status === 'failed' && <FiAlertCircle size={14} className="text-rose-500 flex-shrink-0" />}
                        <button
                          type="button"
                          onClick={() => upload.removeFile(idx)}
                          aria-label={t('inline.sources.remove-file')}
                          className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded text-rose-500 flex-shrink-0"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={upload.uploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-royal-400 hover:text-royal-500 transition-colors text-sm disabled:opacity-50"
                  >
                    <FiUpload size={14} /> {t('inline.sources.add-another-file')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2"
                >
                  <FiUpload size={24} className="text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t('sources.uploadHint')}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('inline.sources.pdf-jpg-png-zip')}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {t('inline.sources.or-drag-drop-a')}
                  </span>
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 min-h-[44px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('inline.sources.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || upload.uploading || (upload.files.length === 0 && !url.trim())}
                className="flex-1 px-4 py-3 min-h-[44px] bg-gradient-to-r from-royal-500 to-cyan-500 hover:from-royal-600 hover:to-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                {submitting || upload.uploading ? <><FiLoader size={16} className="animate-spin" /> {t('sources.uploading')}</> : <><FiUpload size={16} /> {t('sources.uploadFile')}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Sources() {
  const { lang, t } = useLanguage()
  const { user, isAdmin } = useAuth()
  const isArabic = lang === 'ar'

  // Navigation mode: 'all' | 'exams' | 'summaries' | 'favorites'
  const [activeMainTab, setActiveMainTab] = useState('all')
  // Sub-filter for exams: 'all_exams' | 'midterm' | 'final' | 'quiz'
  const [selectedExamType, setSelectedExamType] = useState('all_exams')
  // Sub-filter for academic year: 'all' | '1' | '2' | '3' | '4'
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all')
  // Solved papers filter
  const [onlySolvedExams, setOnlySolvedExams] = useState(false)

  // Student Favorites / Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_bookmarked_sources')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const toggleBookmark = (sourceId) => {
    setBookmarkedIds(prev => {
      const isAlready = prev.includes(sourceId)
      const next = isAlready ? prev.filter(id => id !== sourceId) : [...prev, sourceId]
      try {
        localStorage.setItem('al_azher_bookmarked_sources', JSON.stringify(next))
      } catch {}
      if (isAlready) {
        toast.success(isArabic ? 'تمت إزالة المرجع من المفضلة' : 'Removed from bookmarks')
      } else {
        toast.success(isArabic ? 'تم حفظ المرجع في مفضلتك للرجوع السريع ⭐' : 'Saved to bookmarks ⭐')
      }
      return next
    })
  }

  const [activeSubject, setActiveSubject] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const prefersReduced = useReducedMotion()
  const secureFile = useSecureSourceFile()

  // In-app Document/PDF Preview Modal
  const [previewFile, setPreviewFile] = useState(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Authenticated signer handed to the secure-file hook
  const signer = (path, opts) => signSourceForFetch(path, { download: opts?.download === true, name: opts?.name })

  const mountedRef = useRef(true)

  const loadSources = async () => {
    setLoading(true)
    try {
      const s = await getSources(true)
      if (!mountedRef.current) return
      setSources(s)
      setError(null)
    } catch (err) {
      if (mountedRef.current) setError(err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    loadSources()
    return () => { mountedRef.current = false }
  }, [])

  const handleRetry = () => {
    setError(null)
    loadSources()
  }

  // Pre-classify all sources
  const classifiedSources = useMemo(() => {
    return sources.map(s => {
      const meta = classifySource(s)
      return { ...s, _meta: meta }
    })
  }, [sources])

  // Count metrics for tabs
  const tabCounts = useMemo(() => {
    let totalExams = 0
    let totalSummaries = 0
    let totalFavorites = 0
    classifiedSources.forEach(s => {
      if (s._meta.category === 'exams') totalExams += 1
      if (s._meta.category === 'summaries') totalSummaries += 1
      if (bookmarkedIds.includes(s.id)) totalFavorites += 1
    })
    return {
      all: classifiedSources.length,
      exams: totalExams,
      summaries: totalSummaries,
      favorites: totalFavorites,
    }
  }, [classifiedSources, bookmarkedIds])

  const subjects = useMemo(() => {
    const set = new Set(sources.map(s => isArabic ? s.subjectAr : s.subjectEn).filter(Boolean))
    return Array.from(set)
  }, [sources, isArabic])

  const filtered = useMemo(() => {
    let result = classifiedSources.filter(s => {
      const subject = isArabic ? s.subjectAr : s.subjectEn
      const title = isArabic ? s.titleAr : s.titleEn
      const matchSubject = activeSubject === 'all' || subject === activeSubject
      const matchSearch = !search || title?.toLowerCase().includes(search.toLowerCase()) || subject?.toLowerCase().includes(search.toLowerCase())

      // Main Tab Filter
      let matchTab = true
      if (activeMainTab === 'exams') {
        matchTab = s._meta.category === 'exams'
        if (matchTab && selectedExamType !== 'all_exams') {
          matchTab = s._meta.examType === selectedExamType
        }
        if (matchTab && onlySolvedExams) {
          matchTab = Boolean(s._meta.hasSolution)
        }
      } else if (activeMainTab === 'summaries') {
        matchTab = s._meta.category === 'summaries'
      } else if (activeMainTab === 'favorites') {
        matchTab = bookmarkedIds.includes(s.id)
      }

      // Academic Year Filter
      let matchYear = true
      if (selectedAcademicYear !== 'all') {
        matchYear = String(s._meta.academicYear) === selectedAcademicYear
      }

      return matchSubject && matchSearch && matchTab && matchYear
    })

    const sortLocale = t('inline.sources.en')
    result.sort((a, b) => {
      const titleA = (isArabic ? a.titleAr : a.titleEn) || ''
      const titleB = (isArabic ? b.titleAr : b.titleEn) || ''
      const byDate = (dir) => {
        const cmp = (a.date || '').localeCompare(b.date || '')
        if (cmp !== 0) return cmp * dir
        return (a.createdAt || '').localeCompare(b.createdAt || '') * dir
      }
      switch (sortBy) {
        case 'date-asc': return byDate(1)
        case 'date-desc': return byDate(-1)
        case 'title': return titleA.localeCompare(titleB, sortLocale, { sensitivity: 'base', numeric: true }) || byDate(-1)
        case 'created-desc': return (b.createdAt || '').localeCompare(a.createdAt || '') || byDate(-1)
        default: return byDate(-1)
      }
    })
    return result
  }, [classifiedSources, activeMainTab, selectedExamType, activeSubject, search, sortBy, isArabic, t])

  const handleOpenPreview = async (f, sourceTitle) => {
    const fileName = f.name || sourceTitle || 'ملف دراسي'
    if (f.url) {
      setPreviewFile({
        name: fileName,
        url: f.url,
        path: f.path || null,
      })
      setPreviewModalOpen(true)
      return
    }
    if (f.path) {
      try {
        const { data } = (await signer(f.path, { download: false })) || {}
        if (data?.signedUrl) {
          setPreviewFile({
            name: fileName,
            url: data.signedUrl,
            path: f.path,
          })
          setPreviewModalOpen(true)
          return
        }
      } catch {}
      await secureFile.open(f.path, { name: fileName, mode: 'view', signIn: signer })
    }
  }

  const handleCopySource = (s) => {
    const url = s.url || window.location.href
    navigator.clipboard.writeText(url)
    toast.success(isArabic ? 'تم نسخ رابط المرجع' : 'Source link copied')
  }

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
        <div className="container-page">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass rounded-xl p-6">
                <Skeleton className="h-4 w-1/3 rounded-full mb-3" />
                <Skeleton className="h-5 w-3/4 rounded-lg mb-3" />
                <Skeleton className="h-3 w-1/4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page">
      <PageHero
        variant="file"
        title={isArabic ? 'أرشيف المصادر والامتحانات السابقة' : 'Study Sources & Past Exams'}
        subtitle={isArabic ? 'نماذج امتحانات نصفية ونهائية، ملخصات وسلايدات معتمدة لجميع مساقات تكنولوجيا المعلومات' : 'Midterm & final exams, lecture slides, and summaries for all IT subjects'}
      />

      <div className="container-page">
        {/* Academic Navigation Mode Tabs */}
        <div className="glass rounded-2xl p-2 mb-8 border border-white/10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveMainTab('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeMainTab === 'all'
                  ? 'bg-royal-600 text-white shadow-lg shadow-royal-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FiFolder size={16} />
              <span>{isArabic ? 'جميع المصادر والمراجع' : 'All Study Sources'}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeMainTab === 'all' ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                {tabCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('exams')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeMainTab === 'exams'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FiAward size={16} />
              <span>{isArabic ? 'أرشيف الامتحانات السابقة' : 'Past Exams Archive'}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeMainTab === 'exams' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-500'}`}>
                {tabCounts.exams}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('summaries')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeMainTab === 'summaries'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FiBookOpen size={16} />
              <span>{isArabic ? 'الملخصات والتفريغات' : 'Summaries & Notes'}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeMainTab === 'summaries' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-500'}`}>
                {tabCounts.summaries}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap min-h-[44px] ${
                activeMainTab === 'favorites'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                  : 'text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <FiStar size={16} />
              <span>{isArabic ? 'المفضلة والمحفوظات' : 'Saved & Bookmarks'}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeMainTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-500'}`}>
                {tabCounts.favorites}
              </span>
            </button>
          </div>
        </div>

        {/* Academic Year Level Pill Bar */}
        <div className="glass rounded-2xl p-3 mb-6 border border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <FiLayers size={14} className="text-royal-500" />
              <span>{isArabic ? 'المستوى الدراسي:' : 'Academic Level:'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ACADEMIC_YEAR_FILTERS.map(y => (
              <button
                key={y.id}
                type="button"
                onClick={() => setSelectedAcademicYear(y.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap min-h-[34px] ${
                  selectedAcademicYear === y.id
                    ? 'bg-royal-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-ink'
                }`}
              >
                {isArabic ? y.labelAr : y.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Exams Sub-Filters (When in Exams Archive mode) */}
        {activeMainTab === 'exams' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-6 border border-rose-500/20 bg-rose-500/5 flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-bold">
                <FiAward size={16} />
              </span>
              <div>
                <h3 className="font-bold text-ink text-sm">
                  {isArabic ? 'تصنيف نماذج الامتحانات' : 'Exam Papers Type'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-white/50">
                  {isArabic ? 'اختر تصنيف الامتحان للتصفية السريعة (نصفي، نهائي، كويزات)' : 'Filter by exam type'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setOnlySolvedExams(!onlySolvedExams)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  onlySolvedExams
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 border-line text-slate-600 dark:text-white/70 hover:text-ink'
                }`}
              >
                <span>✓</span>
                <span>{isArabic ? 'النماذج مع الحل فقط' : 'Solved Only'}</span>
              </button>

              {EXAM_SUB_TYPES.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedExamType(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedExamType === sub.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-ink'
                  }`}
                >
                  {isArabic ? sub.labelAr : sub.labelEn}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Filters & Search Bar */}
        <motion.div variants={itemVariants} className="mb-10">
          <FilterBar
            subjects={subjects}
            activeSubject={activeSubject}
            onSubjectChange={setActiveSubject}
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder={isArabic ? 'بحث في أسماء الملفات، المواد، أو الامتحانات...' : 'Search files, subjects, or exams...'}
            allLabel={t('sources.allSubjects')}
            resultCount={filtered.length}
          />
          <div className="mt-4 flex items-center gap-3 flex-wrap justify-between">
            <CustomSelect value={sortBy} options={sortOptions} onChange={setSortBy} isArabic={isArabic} label={t('sources.sortLabel')} />
            {isAdmin && (
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-gradient-to-r from-royal-500 to-cyan-500 hover:from-royal-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <FiUpload size={16} /> {t('sources.uploadFile')}
              </button>
            )}
          </div>
        </motion.div>

        {/* Sources Cards Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={search ? FiSearch : FiFolder}
            color="amber"
            title={
              search
                ? t('inline.sources.no-search-results')
                : activeMainTab === 'favorites'
                ? (isArabic ? 'قائمة المفضلة فارغة حالياً' : 'No bookmarked sources yet')
                : activeMainTab === 'exams'
                ? (isArabic ? 'لا توجد نماذج امتحانات مطابقة للفلتر' : 'No matching exam papers')
                : t('inline.sources.no-sources-yet')
            }
            description={
              search
                ? t('inline.sources.try-a-different-search')
                : activeMainTab === 'favorites'
                ? (isArabic ? 'اضغط على رمز النجمة ⭐ في بطاقة أي ملف أو نموذج امتحان لحفظه هنا للمراجعة السريعة.' : 'Click the star icon ⭐ on any file to bookmark it for revision.')
                : (isArabic ? 'سيتم إضافة ملفات ومصادر جديدة قريباً لهذا التخصص أو الفلتر المحدد.' : t('inline.sources.sources-will-be-added'))
            }
            action={
              (search || selectedAcademicYear !== 'all' || onlySolvedExams || activeMainTab === 'favorites') ? (
                <button
                  onClick={() => { 
                    setSearch('')
                    setActiveSubject('all')
                    setSelectedExamType('all_exams')
                    setSelectedAcademicYear('all')
                    setOnlySolvedExams(false)
                    if (activeMainTab === 'favorites') setActiveMainTab('all')
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] btn-secondary rounded-xl text-sm font-medium"
                >
                  {isArabic ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </button>
              ) : isAdmin ? (
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-gradient-to-r from-royal-500 to-cyan-500 hover:from-royal-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium transition"
                >
                  <FiUpload size={16} /> {t('sources.uploadFile')}
                </button>
              ) : null
            }
            className="max-w-md mx-auto"
          />
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={containerVariants}>
            {filtered.map(source => {
              const allFiles = getSourceFiles(source)
              const meta = source._meta || classifySource(source)

              const openSecure = async (f, mode) => {
                if (!f.path) {
                  if (f.url && isSafeUrl(f.url)) {
                    window.open(f.url, '_blank', 'noopener,noreferrer')
                  } else if (f.url) {
                    toast.error(t('inline.sources.file-open-failed'))
                  }
                  return
                }
                try {
                  await secureFile.open(f.path, { name: f.name || 'file', mode, signIn: signer })
                } catch {
                  toast.error(t('inline.sources.file-open-failed'))
                }
              }

              return (
                <motion.div key={source.id} variants={itemVariants}>
                  <div className="group glass glass-hover lift rounded-2xl p-6 block relative overflow-hidden flex flex-col justify-between h-full border border-white/10">
                    <div>
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block text-xs bg-royal-50 dark:bg-cyan-900/20 border border-royal-200/30 dark:border-cyan-400/20 text-royal-600 dark:text-cyan-300 px-2.5 py-1 rounded-full font-semibold">
                            {isArabic ? source.subjectAr : source.subjectEn}
                          </span>
                          {/* Academic Category Badge */}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${meta.color}`}>
                            {isArabic ? meta.labelAr : meta.labelEn}
                          </span>

                          {/* Academic Year Level Badge */}
                          {meta.academicYear && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-royal-500/10 text-royal-600 dark:text-cyan-400 border border-royal-500/20">
                              {isArabic ? `السنة ${meta.academicYear}` : `Year ${meta.academicYear}`}
                            </span>
                          )}

                          {/* Exam Year Badge */}
                          {meta.examYear && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white/80 border border-line">
                              {meta.examYear}
                            </span>
                          )}

                          {/* Solution Badge */}
                          {meta.hasSolution && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                              <FiCheck size={10} />
                              <span>{isArabic ? 'متوفر الحل' : 'Solved'}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isRecentlyAdded(source.date) && (
                            <div className="px-2 py-0.5 bg-emerald-500/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-full animate-pulse">
                              {t('sources.newBadge')}
                            </div>
                          )}

                          {/* Bookmark Star Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleBookmark(source.id)
                            }}
                            className={`p-1.5 rounded-xl transition ${
                              bookmarkedIds.includes(source.id)
                                ? 'text-amber-500 bg-amber-500/15 hover:bg-amber-500/20'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10'
                            }`}
                            title={bookmarkedIds.includes(source.id) ? (isArabic ? 'إزالة من المحفوظات' : 'Remove bookmark') : (isArabic ? 'حفظ في المفضلة' : 'Save bookmark')}
                            aria-label={bookmarkedIds.includes(source.id) ? 'Remove bookmark' : 'Save bookmark'}
                          >
                            <FiStar size={15} fill={bookmarkedIds.includes(source.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="font-bold text-ink mb-3 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors text-base leading-snug">
                        {isArabic ? source.titleAr : source.titleEn}
                      </h2>

                      {/* Files list or external link container */}
                      {allFiles.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {allFiles.slice(0, 4).map((f, fi) => (
                            <div key={fi} className="flex items-center gap-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-line">
                              <span className="shrink-0">
                                {getFileIcon('', f.name)}
                              </span>
                              <span className="flex-1 min-w-0 text-xs text-ink font-medium truncate" title={f.name}>
                                {f.name || 'file'}
                              </span>

                              {/* Preview Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (user) {
                                    addStudentLog({ studentId: user.studentId, name: user.name, type: 'VIEW_SOURCE', detail: `${source.titleAr || source.titleEn} — ${f.name}`, ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '' }).catch(() => {})
                                  }
                                  handleOpenPreview(f, source.titleAr || source.titleEn)
                                }}
                                disabled={Boolean(secureFile.busyPath && secureFile.busyPath === f.path)}
                                className="p-1.5 rounded-lg text-cyan-500 hover:bg-cyan-500/10 transition min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-50"
                                title={isArabic ? 'معاينة المستند' : 'Preview document'}
                                aria-label={isArabic ? `معاينة ${f.name}` : `Preview ${f.name}`}
                              >
                                <FiEye size={14} />
                              </button>

                              {/* Download Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (user) {
                                    addStudentLog({ studentId: user.studentId, name: user.name, type: 'VIEW_SOURCE', detail: `${source.titleAr || source.titleEn} — ${f.name}`, ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '' }).catch(() => {})
                                  }
                                  openSecure(f, 'download')
                                }}
                                disabled={Boolean(secureFile.busyPath && secureFile.busyPath === f.path)}
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition min-w-[36px] min-h-[36px] flex items-center justify-center disabled:opacity-50"
                                title={t('inline.sources.download')}
                                aria-label={isArabic ? `تحميل ${f.name}` : `Download ${f.name}`}
                              >
                                {secureFile.busyPath === f.path ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}
                              </button>
                            </div>
                          ))}

                          {allFiles.length > 4 && (
                            <p className="text-xs text-slate-500 dark:text-white/50">
                              +{allFiles.length - 4} {t('inline.sources.more-files')}
                            </p>
                          )}

                          {allFiles.length > 1 && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (user) {
                                  addStudentLog({ studentId: user.studentId, name: user.name, type: 'VIEW_SOURCE', detail: `${source.titleAr || source.titleEn} — download all`, ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '' }).catch(() => {})
                                }
                                for (const f of allFiles.filter(x => x.path)) {
                                  try { await secureFile.open(f.path, { name: f.name || 'file', mode: 'download', signIn: signer }) } catch {}
                                  await new Promise(r => setTimeout(r, 400))
                                }
                              }}
                              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-semibold transition min-h-[38px]"
                            >
                              <FiDownload size={13} /> {isArabic ? `تحميل جميع المرفقات (${allFiles.length})` : `Download all (${allFiles.length})`}
                            </button>
                          )}
                        </div>
                      ) : source.url && isSafeUrl(source.url) ? (
                        <div className="mb-4">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs text-accent hover:underline break-all"
                          >
                            <FiExternalLink size={13} />
                            <span>{source.url}</span>
                          </a>
                        </div>
                      ) : null}
                    </div>

                    {/* Card Footer Bar */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-white/50">
                      <span>{source.date?.split('T')[0] || (isArabic ? 'حديث' : 'Recent')}</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopySource(source)}
                          className="p-1 rounded-lg text-slate-400 hover:text-ink transition"
                          title={isArabic ? 'نسخ الرابط' : 'Copy link'}
                          aria-label={isArabic ? 'نسخ الرابط' : 'Copy link'}
                        >
                          <FiShare2 size={13} />
                        </button>
                        <span className="font-semibold text-accent">
                          {allFiles.length > 0 ? `${allFiles.length} ${isArabic ? 'ملف' : 'files'}` : (isArabic ? 'رابط' : 'Link')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* In-app Document & PDF Preview Modal */}
      <FilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        file={previewFile}
        onDownload={() => {
          if (previewFile?.path) {
            secureFile.open(previewFile.path, { name: previewFile.name, mode: 'download', signIn: signer })
          }
        }}
        isArabic={isArabic}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onSubmit={loadSources}
        isArabic={isArabic}
        t={t}
      />
    </motion.div>
  )
}
