import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getSources, addSource, addStudentLog } from '../services'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useFileUpload } from '../hooks/useFileUpload'
import { useScrollLock } from '../hooks/useScrollLock'
import { formatBytes } from '../services/sourceStorage'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { SORT_OPTIONS, downloadFile, getSourceFiles, storagePathFromUrl } from '../utils/helpers'
import { getSignedSourceUrls } from '../services/sourceStorage'
import { resolveFileUrl } from '../hooks/useSignedSources'
import toast from 'react-hot-toast'
import PageHero from '../components/shared/PageHero'
import FilterBar from '../components/FilterBar'
import CustomSelect from '../components/shared/CustomSelect'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import { FiExternalLink, FiFile, FiLink, FiFileText, FiImage, FiVideo, FiUpload, FiX, FiLoader, FiTrash2, FiCheck, FiAlertCircle, FiSearch, FiDownload, FiFolder } from 'react-icons/fi'
import Skeleton from '../components/shared/Skeleton'

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

async function downloadAllFiles(files, isArabic) {
 for (let i = 0; i < files.length; i++) {
  const f = files[i]
  try {
   await downloadFile(f.url, f.name)
  } catch (e) { /* keep going */ }
  if (i < files.length - 1) {
   await new Promise(r => setTimeout(r, 500))
  }
 }
 if (files.length > 1) {
  toast.success(isArabic ? `بدأ تحميل ${files.length} ملفات` : `Started downloading ${files.length} files`)
 }
}

function UploadModal({ isOpen, onClose, onSubmit, isArabic, t }) {
 const [titleAr, setTitleAr] = useState('')
 const [titleEn, setTitleEn] = useState('')
 const [subjectAr, setSubjectAr] = useState('')
 const [subjectEn, setSubjectEn] = useState('')
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
     initial={{ opacity: 0, scale: 0.95, y: 20 }}
     animate={{ opacity: 1, scale: 1, y: 0 }}
     exit={{ opacity: 0, scale: 0.95, y: 20 }}
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
         <span className="text-sm text-slate-500 dark:text-slate-400 ">{t('sources.uploadHint')}</span>
         <span className="text-xs text-slate-500 dark:text-slate-400 ">
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

 const [activeSubject, setActiveSubject] = useState('all')
 const [search, setSearch] = useState('')
 const [sortBy, setSortBy] = useState('date-desc')
 const [sources, setSources] = useState([])
 const [signed, setSigned] = useState({})
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [showUpload, setShowUpload] = useState(false)
 const prefersReduced = useReducedMotion()

 
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

 // Storage files are private: resolve short-lived signed URLs after load.
 useEffect(() => {
  let active = true
  const paths = [...new Set(sources.flatMap(s => getSourceFiles(s).map(f => f.path).filter(Boolean)))]
  if (paths.length === 0) { setSigned({}); return }
  getSignedSourceUrls(paths).then(map => { if (active) setSigned(map) }).catch(() => {})
  return () => { active = false }
 }, [sources])

 const subjects = useMemo(() => {
  const set = new Set(sources.map(s => isArabic ? s.subjectAr : s.subjectEn).filter(Boolean))
  return Array.from(set)
 }, [sources, isArabic])

 const filtered = useMemo(() => {
  let result = sources.filter(s => {
   const subject = isArabic ? s.subjectAr : s.subjectEn
   const title = isArabic ? s.titleAr : s.titleEn
   const matchSubject = activeSubject === 'all' || subject === activeSubject
   const matchSearch = !search || title?.toLowerCase().includes(search.toLowerCase()) || subject?.toLowerCase().includes(search.toLowerCase())
   return matchSubject && matchSearch
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
 }, [sources, activeSubject, search, sortBy, isArabic])

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
   <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page ">
   <PageHero variant="file" title={t('sources.title')} subtitle={t('sources.subtitle')} />

   <div className="container-page">
    <motion.div variants={itemVariants} className="mb-10">
     <FilterBar
      subjects={subjects}
      activeSubject={activeSubject}
      onSubjectChange={setActiveSubject}
      searchQuery={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('sources.search')}
      allLabel={t('sources.allSubjects')}
      resultCount={filtered.length}
     />
      <div className="mt-4 flex items-center gap-3 flex-wrap">
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

    {filtered.length === 0 ? (
     <EmptyState
      icon={search ? FiSearch : FiFolder}
      color="amber"
      title={search ? (t('inline.sources.no-search-results')) : (t('inline.sources.no-sources-yet'))}
      description={search ? (t('inline.sources.try-a-different-search')) : (t('inline.sources.sources-will-be-added'))}
       action={
        search ? (
         <button
          onClick={() => { setSearch(''); setActiveSubject('all') }}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] btn-secondary rounded-xl text-sm font-medium"
         >
          {t('inline.sources.clear-search')}
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
      {filtered.map(source => (
       <motion.div key={source.id} variants={itemVariants}>
         {source.fileData ? (
          <div className="group glass glass-hover lift rounded-xl p-6 block relative overflow-hidden">
           {isRecentlyAdded(source.date) && (
            <div className={`absolute top-3 end-3 px-2 py-0.5 bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-medium rounded-full animate-pulse`}>
             {t('sources.newBadge')}
            </div>
           )}
          <div className="flex items-start gap-3 mb-3">
           <div className="p-2 bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-lg">
            {getFileIcon('', source.fileName)}
           </div>
           <span className="inline-block text-xs bg-royal-50 dark:bg-cyan-900/20 border border-royal-200/30 dark:border-cyan-400/20 text-royal-600 dark:text-cyan-300 px-2.5 py-1 rounded-full">{isArabic ? source.subjectAr : source.subjectEn}</span>
          </div>
           <h2 className="font-semibold text-ink mb-3 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors text-base">{isArabic ? source.titleAr : source.titleEn}</h2>

           {(() => {
            const allFiles = getSourceFiles(source)
            if (allFiles.length === 0) return null
            return (
             <div className="space-y-2 mb-4">
              {allFiles.slice(0, 6).map((f, fi) => {
               const fileUrl = resolveFileUrl(f, signed)
               return (
               <div key={fi} className="flex items-center gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <FiFile size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="flex-1 min-w-0 text-xs text-navy-900 dark:text-white/80 truncate">{f.name || 'file'}</span>
                <a
                 href={fileUrl}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={() => { if (user) { addStudentLog({ studentId: user.studentId, name: user.name, type: 'VIEW_SOURCE', detail: `${source.titleAr || source.titleEn} — ${f.name}`, ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '' }).catch(() => {}); } }}
                 className="p-1.5 rounded-lg text-cyan-500 hover:bg-cyan-500/10 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                 title={t('inline.sources.open')}
                 aria-label={isArabic ? `فتح ${f.name}` : `Open ${f.name}`}
                >
                 <FiExternalLink size={14} />
                </a>
                <button
                 onClick={() => downloadFile(fileUrl, f.name)}
                 className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                 title={t('inline.sources.download')}
                 aria-label={isArabic ? `تحميل ${f.name}` : `Download ${f.name}`}
                >
                 <FiDownload size={14} />
               </button>
               </div>
               )
              })}
              {allFiles.length > 6 && (
               <p className="text-xs text-slate-500 dark:text-white/50">+{allFiles.length - 6} {t('inline.sources.more-files')}</p>
              )}
              {allFiles.length > 1 && (
               <button
                onClick={() => { downloadAllFiles(allFiles.map(f => ({ ...f, url: resolveFileUrl(f, signed) })), isArabic); if (user) { addStudentLog({ studentId: user.studentId, name: user.name, type: 'VIEW_SOURCE', detail: `${source.titleAr || source.titleEn} — download all`, ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '' }).catch(() => {}); } }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-medium transition min-h-[44px]"
               >
                <FiDownload size={13} /> {isArabic ? `تحميل الكل (${allFiles.length})` : `Download all (${allFiles.length})`}
               </button>
              )}
             </div>
            )
           })()}

           <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-white/50">{source.date?.split('T')[0]}</span>
            <span className="flex items-center gap-1 text-sm font-medium text-accent transition-colors">
             {(() => { const n = getSourceFiles(source).length; return n > 0 ? (isArabic ? `${n} ملف` : `${n} files`) : t('sources.downloadFile') })()} <FiFolder size={14} />
            </span>
           </div>
          </div>
         ) : (
          <a href={source.fileData ? (resolveFileUrl({ path: source.filePath || storagePathFromUrl(source.fileData), url: source.fileData }, signed)) : source.url} target="_blank" rel="noopener noreferrer" className="group glass glass-hover rounded-xl p-6 block relative overflow-hidden" onClick={() => { if (user) { addStudentLog({ studentId: user.studentId, name: user.name, type: 'VIEW_SOURCE', detail: source.titleAr || source.titleEn || source.id, ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '' }).catch(() => {}); } }}>
           {isRecentlyAdded(source.date) && (
            <div className={`absolute top-3 end-3 px-2 py-0.5 bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-medium rounded-full animate-pulse`}>
             {t('sources.newBadge')}
            </div>
           )}
           <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-lg">
             {getFileIcon(source.url)}
            </div>
            <span className="inline-block text-xs bg-royal-50 dark:bg-cyan-900/20 border border-royal-200/30 dark:border-cyan-400/20 text-royal-600 dark:text-cyan-300 px-2.5 py-1 rounded-full">{isArabic ? source.subjectAr : source.subjectEn}</span>
           </div>
           <h2 className="font-semibold text-ink mb-3 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors text-base">{isArabic ? source.titleAr : source.titleEn}</h2>
          <div className="flex items-center justify-between">
           <span className="text-xs text-slate-500 dark:text-white/50">{source.date?.split('T')[0]}</span>
           <span className="flex items-center gap-1 text-sm font-medium text-accent group-hover:text-royal-600 dark:group-hover:text-cyan-300 transition-colors">
            {t('sources.view')} <FiExternalLink size={14} />
           </span>
          </div>
         </a>
        )}
       </motion.div>
      ))}
     </motion.div>
    )}
   </div>

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
