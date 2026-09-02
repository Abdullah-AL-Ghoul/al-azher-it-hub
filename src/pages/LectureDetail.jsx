import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getFavorites, getRatings, getViewed, toggleFavorite, setRating, markViewed, addStudentLog } from '../services'
import { useScrollFrame } from '../hooks/useScrollManager.jsx'
import { pageContainer, pageItem, revealItem } from '../utils/motionTokens'
import { lectureVideoId, lectureThumb, downloadFile, getSourceFiles } from '../utils/helpers'
import VideoPlayer from '../components/shared/VideoPlayer'
import StarRating from '../components/shared/StarRating'
import { FiPlay, FiHeart, FiCheck, FiExternalLink, FiBookOpen, FiFileText, FiClock, FiUser, FiArrowRight, FiArrowLeft, FiLink, FiCopy, FiCheckCircle, FiDownload, FiFile } from 'react-icons/fi'
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa'
import ErrorState from '../components/feedback/ErrorState'
import { toast } from 'react-hot-toast'
import Skeleton from '../components/shared/Skeleton'

export default function LectureDetail() {
 const { id } = useParams()
 const { lang, t } = useLanguage()
 const { user } = useAuth()
 const isArabic = lang === 'ar'
 const prefersReduced = useReducedMotion()

 const [lectures, setLectures] = useState([])
 const [sources, setSources] = useState([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [localFavorites, setLocalFavorites] = useState([])
 const [localRatings, setLocalRatings] = useState({})
 const [viewedIds, setViewedIds] = useState([])
 const [note, setNote] = useState('')
 const [noteSaved, setNoteSaved] = useState(false)

 const lecture = useMemo(() => lectures.find(l => l.id === id), [lectures, id])
 const videoId = lectureVideoId(lecture)
 const isViewed = viewedIds.includes(id)
 const isFavorite = localFavorites.includes(id)

 useEffect(() => {
  if (!lecture) return
  try {
   const saved = localStorage.getItem(`lecture_note_${lecture.id}`)
   if (saved) setNote(saved)
  } catch (e) { /* silent */ }
 }, [lecture])

 const saveNote = useCallback(() => {
  if (!lecture) return
  try {
   const trimmed = note.trim()
   localStorage.setItem(`lecture_note_${lecture.id}`, trimmed)
   setNoteSaved(true)
   const t = setTimeout(() => setNoteSaved(false), 2500)
   return () => clearTimeout(t)
  } catch (e) { /* silent */ }
 }, [lecture, note])

 // Auto-save with debounce
 useEffect(() => {
  if (!lecture || !note) return
  const timer = setTimeout(() => {
   try {
    localStorage.setItem(`lecture_note_${lecture.id}`, note.trim())
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2500)
   } catch (e) { /* silent */ }
  }, 2000)
  return () => clearTimeout(timer)
 }, [lecture, note])

 const shareLink = useCallback((channel) => {
  if (!lecture) return
  const title = encodeURIComponent(`${isArabic ? lecture.titleAr : lecture.titleEn} — AL-Azher IT Hub`)
  const url = encodeURIComponent(`${window.location.origin}/lecture/${lecture.id}`)
  if (channel === 'whatsapp') {
   window.open(`https://wa.me/?text=${title}%0A${url}`, '_blank', 'noopener,noreferrer')
  } else if (channel === 'telegram') {
   window.open(`https://t.me/share/url?url=${url}&text=${title}`, '_blank', 'noopener,noreferrer')
  } else if (channel === 'copy') {
   navigator.clipboard?.writeText(`${window.location.origin}/lecture/${lecture.id}`).then(() => {
    toast.success(t('inline.lecture-detail.link-copied'))
   }).catch(() => {
    toast.error(t('inline.lecture-detail.copy-failed'))
   })
  }
 }, [lecture, isArabic])

 
 useEffect(() => {
  let mounted = true
  async function load() {
   try {
    const [l, s] = await Promise.all([getLectures(), getSources()])
    if (!mounted) return
    setLectures(l)
    setSources(s)
    if (user) {
     const [favs, rats, viewed] = await Promise.all([
      getFavorites(user.studentId),
      getRatings(user.studentId),
      getViewed(user.studentId).catch(() => []),
     ])
     if (mounted) {
      setLocalFavorites(favs)
      setLocalRatings(rats)
      setViewedIds(Array.isArray(viewed) ? viewed : [])
     }
    }
   } catch (err) { if (mounted) setError(err) }
   if (mounted) setLoading(false)
  }
   load()
   return () => { mounted = false }
  }, [user])

  useEffect(() => {
   if (!lecture) return
  try {
   sessionStorage.setItem('al_azher_current_lecture', JSON.stringify({
    id: lecture.id,
    titleAr: lecture.titleAr || '',
    titleEn: lecture.titleEn || '',
   }))
  } catch (e) { /* silent */ }
  return () => { try { sessionStorage.removeItem('al_azher_current_lecture') } catch (e) { /* silent */ } }
 }, [lecture])

 const relatedSources = useMemo(() => {
  if (!lecture) return []
  return sources.filter(s =>
   (s.subjectAr && lecture.subjectAr && s.subjectAr === lecture.subjectAr) ||
   (s.subjectEn && lecture.subjectEn && s.subjectEn === lecture.subjectEn)
  )
 }, [sources, lecture])

 const subjectLectures = useMemo(() => {
  if (!lecture) return []
  return lectures
   .filter(l => (
    (l.subjectAr && lecture.subjectAr && l.subjectAr === lecture.subjectAr) ||
    (l.subjectEn && lecture.subjectEn && l.subjectEn === lecture.subjectEn)
   ))
   .sort((a, b) => {
    const orderA = a.sortOrder ?? 0
    const orderB = b.sortOrder ?? 0
    if (orderA !== orderB) return orderA - orderB
    return (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || '')
   })
 }, [lectures, lecture])

 const prevNext = useMemo(() => {
  if (!lecture) return { prev: null, next: null }
  const idx = subjectLectures.findIndex(l => l.id === lecture.id)
  return {
   prev: idx > 0 ? subjectLectures[idx - 1] : null,
   next: idx >= 0 && idx < subjectLectures.length - 1 ? subjectLectures[idx + 1] : null,
  }
 }, [subjectLectures, lecture])

 const handleToggleFavorite = useCallback(async () => {
  if (!user || !lecture) return
  try {
   const newFavs = await toggleFavorite(user.studentId, id)
   setLocalFavorites(newFavs)
   addStudentLog({
    type: 'ADD_FAVORITE',
    detail: lecture.titleAr || lecture.titleEn || id,
    device: typeof navigator !== 'undefined' ? navigator.userAgent : '',
   }).catch(() => {})
  } catch (e) { /* silent */ }
 }, [user, lecture, id])

 const handleRate = useCallback(async (rating) => {
  if (!user || !lecture) return
  try {
   const newRatings = await setRating(user.studentId, id, rating)
   setLocalRatings(newRatings)
   addStudentLog({
    studentId: user.studentId, name: user.name, type: 'RATE_LECTURE',
    detail: `${rating}/5 · ${lecture.titleAr || lecture.titleEn || id}`,
    ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '',
   }).catch(() => {})
  } catch (e) { /* silent */ }
 }, [user, lecture, id])

 const handleWatch = useCallback(() => {
  if (!user || !lecture) return
  if (!viewedIds.includes(id)) {
   setViewedIds(prev => [...prev, id])
   markViewed(user.studentId, id)
   addStudentLog({
    studentId: user.studentId, name: user.name, type: 'VIEW_LECTURE',
    detail: lecture.titleAr || lecture.titleEn || id,
    ip: '', device: typeof navigator !== 'undefined' ? navigator.userAgent : '',
   }).catch(() => {})
  }
 }, [user, lecture, id, viewedIds])

 if (loading) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
     <Skeleton className="h-6 w-64 rounded-lg mb-6" />
     <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
     </div>
    </div>
   </div>
  )
 }

 if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />

 if (!lecture) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page  flex items-center justify-center">
    <div className="glass rounded-2xl p-10 text-center max-w-md mx-4">
     <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
      <FiFileText className="text-rose-400" size={28} />
     </div>
     <h1 className="text-xl font-bold text-ink mb-2">{t('inline.lecture-detail.lecture-not-found')}</h1>
     <p className="text-sm text-slate-500 dark:text-white/50 mb-6">{t('inline.lecture-detail.this-lecture-may-have')}</p>
     <Link to="/lectures" className="inline-flex items-center gap-2 px-6 py-3 btn-primary rounded-xl font-semibold text-sm">
      <FiArrowRight className={isArabic ? 'rotate-180' : ''} /> {t('inline.lecture-detail.back-to-lectures')}
     </Link>
    </div>
   </div>
  )
 }

 return (
  <motion.div variants={prefersReduced ? { hidden: {}, visible: {} } : pageContainer} initial="hidden" animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page ">
   {/* Reading progress — DOM-written per scroll frame, no re-renders */}
   <ReadingProgress reduced={prefersReduced} />
   <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

    {/* Breadcrumb */}
    <motion.nav variants={pageItem} aria-label={t('inline.lecture-detail.breadcrumb')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/50 mb-6 flex-wrap">
     <Link to="/lectures" className="hover:text-royal-500 dark:hover:text-cyan-400 transition-colors">{t('lectures.title')}</Link>
     <span>›</span>
     <span className="text-navy-900 dark:text-white/80">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
    </motion.nav>

    <div className="grid lg:grid-cols-3 gap-6 items-start">
     {/* Video / thumbnail */}
     <motion.div variants={revealItem} className="lg:col-span-2">
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
       <VideoPlayer
        videoId={videoId}
        url={lecture.url}
        title={isArabic ? lecture.titleAr : lecture.titleEn}
        isArabic={isArabic}
        onWatch={handleWatch}
       />
      </div>

      {/* Related sources for this subject */}
      {relatedSources.length > 0 && (
       <motion.div variants={revealItem} className="glass rounded-2xl p-5 border border-white/10 mt-6">
        <div className="flex items-center gap-2 mb-4">
         <FiBookOpen size={18} className="text-amber-500" />
         <h2 className="font-bold text-ink">{t('inline.lecture-detail.subject-sources')}</h2>
         <span className="text-xs text-slate-500 dark:text-white/50 ms-auto">{relatedSources.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
         {relatedSources.slice(0, 6).map(src => {
          const files = getSourceFiles(src)
          return (
           <div key={src.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-royal-500/10 dark:hover:bg-royal-500/10 border border-transparent hover:border-royal-500/30 transition group">
            <div className={`p-2 rounded-lg flex-shrink-0 ${src.fileData ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
             {src.fileData ? <FiFileText size={16} /> : <FiLink size={16} />}
            </div>
            <div className="min-w-0 flex-1">
             <p className="text-sm font-medium text-ink truncate group-hover:text-royal-500 dark:group-hover:text-cyan-400 transition-colors">{isArabic ? src.titleAr : src.titleEn}</p>
             {files.length > 0 ? (
              <div className="mt-1.5 space-y-1">
               {files.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                 <FiFile size={10} className="text-emerald-500 flex-shrink-0" />
                 <span className="text-slate-600 dark:text-white/60 truncate flex-1">{f.name}</span>
                 <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-0.5 rounded text-cyan-500 hover:bg-cyan-500/10" aria-label={isArabic ? `فتح ${f.name}` : `Open ${f.name}`}><FiExternalLink size={11} /></a>
                 <button onClick={() => downloadFile(f.url, f.name)} className="p-0.5 rounded text-emerald-500 hover:bg-emerald-500/10" aria-label={isArabic ? `تحميل ${f.name}` : `Download ${f.name}`}><FiDownload size={11} /></button>
                </div>
               ))}
               {files.length > 3 && <p className="text-[10px] text-slate-500 dark:text-white/40">+{files.length - 3} {t('inline.lecture-detail.files')}</p>}
              </div>
             ) : src.url ? (
              <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-1">{t('inline.lecture-detail.open-link')} <FiExternalLink size={10} /></a>
             ) : null}
            </div>
           </div>
          )
         })}
        </div>
        {relatedSources.length > 6 && (
         <Link to="/sources" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-3">
          {isArabic ? `عرض كل ${relatedSources.length} مصادر` : `View all ${relatedSources.length} sources`} <FiArrowRight className={isArabic ? 'rotate-180' : ''} size={12} />
         </Link>
        )}
       </motion.div>
      )}
     </motion.div>

     {/* Sidebar info */}
     <motion.div variants={revealItem} className="space-y-4">
      <div className="glass rounded-2xl p-6 border border-white/10">
       <div className="flex items-start justify-between gap-3 mb-3">
        <span className="inline-block text-xs bg-royal-500/10 dark:bg-cyan-500/10 border border-royal-500/20 dark:border-cyan-500/20 text-accent px-2.5 py-1 rounded-full">
         {isArabic ? lecture.subjectAr : lecture.subjectEn}
        </span>
        <div className="flex items-center gap-1">
         {user && (
          <button onClick={handleToggleFavorite} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label={isFavorite ? t('lectures.unfavorite') : t('lectures.favorite')}>
           <FiHeart size={18} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400 dark:text-white/50'} />
          </button>
         )}
        </div>
       </div>

       <h1 className="text-xl md:text-2xl font-bold text-ink mb-4">{isArabic ? lecture.titleAr : lecture.titleEn}</h1>

       <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3">
         <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 flex-shrink-0"><FiUser size={14} /></span>
         <div>
          <p className="text-xs text-slate-500 dark:text-white/50">{t('inline.lecture-detail.subject')}</p>
          <p className="text-ink font-medium">{isArabic ? lecture.subjectAr : lecture.subjectEn}</p>
         </div>
        </div>
        <div className="flex items-center gap-3">
         <span className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 flex-shrink-0"><FiClock size={14} /></span>
         <div>
          <p className="text-xs text-slate-500 dark:text-white/50">{t('inline.lecture-detail.date')}</p>
          <p className="text-ink font-medium">{lecture.date || '—'}</p>
         </div>
        </div>
        {lecture.doctorAr || lecture.doctorEn ? (
         <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0"><FiUser size={14} /></span>
          <div>
           <p className="text-xs text-slate-500 dark:text-white/50">{t('inline.lecture-detail.doctor')}</p>
           <p className="text-ink font-medium">{isArabic ? lecture.doctorAr : lecture.doctorEn}</p>
          </div>
         </div>
        ) : null}
       </div>

       {isViewed && (
        <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium">
         <FiCheck size={12} /> {t('lectures.watched')}
        </div>
       )}

        <div className="mt-5 space-y-3">
         {lecture.url && (
          <a href={lecture.url} target="_blank" rel="noopener noreferrer" onClick={handleWatch} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 btn-secondary rounded-xl font-semibold text-sm">
           <FiExternalLink size={16} /> {t('inline.lecture-detail.open-on-youtube')}
          </a>
         )}
         <Link to="/lectures" className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 btn-secondary rounded-xl font-semibold text-sm">
           <FiArrowRight className={isArabic ? 'rotate-180' : ''} size={16} /> {t('inline.lecture-detail.all-lectures')}
         </Link>
        </div>

        {/* Share */}
        <div className="mt-5">
         <p className="text-xs font-medium text-slate-500 dark:text-white/50 mb-2">{t('inline.lecture-detail.share-lecture')}</p>
         <div className="flex items-center gap-2">
          <button onClick={() => shareLink('whatsapp')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 transition" aria-label={t('inline.lecture-detail.share-on-whatsapp')}>
           <FaWhatsapp size={16} />
          </button>
          <button onClick={() => shareLink('telegram')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/25 transition" aria-label={t('inline.lecture-detail.share-on-telegram')}>
           <FaTelegramPlane size={16} />
          </button>
          <button onClick={() => shareLink('copy')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-royal-500/10 hover:bg-royal-500/20 text-accent border border-royal-500/25 dark:border-cyan-500/25 transition" aria-label={t('inline.lecture-detail.copy-link')}>
           <FiCopy size={16} />
          </button>
         </div>
        </div>
       </div>

       {/* Notes */}
       {user && (
        <div className="glass rounded-2xl p-5 border border-white/10">
         <div className="flex items-center gap-2 mb-3">
          <FiFileText size={16} className="text-amber-500" />
          <h2 className="text-sm font-bold text-ink">{t('inline.lecture-detail.my-notes')}</h2>
          <span className="ms-auto flex items-center gap-1.5">
           {noteSaved && <FiCheckCircle size={14} className="text-emerald-500" />}
           <span className={`text-[10px] font-medium ${noteSaved ? 'text-emerald-500' : 'text-slate-400 dark:text-white/40'}`}>
            {noteSaved ? (t('inline.lecture-detail.auto-saved')) : (t('inline.lecture-detail.auto-saves'))}
           </span>
          </span>
         </div>
         <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows="4"
          placeholder={t('inline.lecture-detail.write-your-notes-about')}
          className="input-spatial w-full rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none resize-none"
          dir={t('inline.lecture-detail.ltr')}
          onKeyDown={(e) => {
           if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            saveNote()
           }
          }}
         />
         <p className="mt-1 text-[10px] text-slate-400 dark:text-white/40 text-end">
          {note.length} {t('inline.lecture-detail.chars')}
         </p>
         <button onClick={saveNote} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition">
          <FiCheck size={14} /> {t('inline.lecture-detail.save-note')}
         </button>
        </div>
       )}

      {/* Rating */}
      {user && (
       <div className="glass rounded-2xl p-6 border border-white/10">
        <h2 className="text-sm font-bold text-ink mb-3">{t('inline.lecture-detail.rate-this-lecture')}</h2>
        <StarRating value={localRatings[id] || 0} onRate={handleRate} size={22} />
        <p className="text-xs text-slate-500 dark:text-white/50 mt-2">{t('inline.lecture-detail.tap-the-stars-to')}</p>
       </div>
      )}
     </motion.div>
    </div>

    {/* Related lectures - full playlist for this subject */}
    {subjectLectures.length > 1 && (
     <motion.div variants={revealItem} className="mt-8">
      <div className="flex items-center justify-between mb-4">
       <h2 className="text-lg md:text-xl font-bold text-ink">{isArabic ? `محاضرات المادة (${subjectLectures.length})` : `Subject lectures (${subjectLectures.length})`}</h2>
       {subjectLectures.length > 1 && (
        <div className="flex items-center gap-1.5">
         {prevNext.prev && (
          <Link to={`/lecture/${prevNext.prev.id}`} className="flex items-center gap-1 px-3 py-1.5 btn-secondary rounded-lg text-xs font-medium">
           <FiArrowRight className={isArabic ? '' : 'rotate-180'} size={14} /> {t('inline.lecture-detail.prev')}
          </Link>
         )}
         {prevNext.next && (
          <Link to={`/lecture/${prevNext.next.id}`} className="flex items-center gap-1 px-3 py-1.5 btn-primary rounded-lg text-xs font-medium">
            {t('inline.lecture-detail.next')} <FiArrowLeft className={isArabic ? '' : 'rotate-180'} size={14} />
          </Link>
         )}
        </div>
       )}
      </div>
      <div className="glass rounded-2xl border border-white/10 overflow-hidden divide-y divide-black/5 dark:divide-white/5">
       {subjectLectures.map((sl, i) => {
        const isCurrent = sl.id === lecture.id
        const slVideoId = lectureVideoId(sl)
        return (
         <Link
          key={sl.id}
          to={`/lecture/${sl.id}`}
          aria-current={isCurrent ? 'page' : undefined}
          className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-colors ${isCurrent ? 'bg-royal-500/10 dark:bg-cyan-500/10 border-s-2 border-s-royal-500 dark:border-s-cyan-400' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
         >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? 'bg-royal-500 text-white' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/50'}`}>
           {i + 1}
          </span>
          <div className="relative w-20 h-12 sm:w-24 sm:h-14 flex-shrink-0 rounded-lg overflow-hidden bg-black/30">
           {slVideoId ? (
            <img src={lectureThumb(slVideoId, 'mq')} alt="" width="160" height="90" loading="lazy" decoding="async" className="w-full h-full object-cover" />
           ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
           )}
           <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 bg-rose-500/80 rounded-full flex items-center justify-center text-white">
             <FiPlay size={12} className="ms-0.5" />
            </div>
           </div>
          </div>
          <div className="flex-1 min-w-0">
           <p className={`text-sm font-medium truncate ${isCurrent ? 'text-royal-600 dark:text-cyan-400' : 'text-ink group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors'}`}>
            {isArabic ? sl.titleAr : sl.titleEn}
           </p>
           <p className="text-xs text-slate-500 dark:text-white/50">{sl.date || ''}</p>
          </div>
          {isCurrent && (
           <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-royal-500/15 dark:bg-cyan-500/15 text-royal-600 dark:text-cyan-400 text-xs font-medium">
            {t('inline.lecture-detail.now-playing')}
           </span>
          )}
         </Link>
        )
       })}
      </div>
     </motion.div>
    )}
   </div>
  </motion.div>
 )
}
// Thin fixed progress bar (top of viewport) filled by scroll depth —
// written straight to the DOM per frame via useScrollFrame.
function ReadingProgress({ reduced }) {
 const barRef = useRef(null)
 useScrollFrame(({ progress }) => {
  if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(progress, 100) / 100})`
 })
 return (
  <div className="fixed top-0 inset-x-0 z-[60] h-[3px] pointer-events-none" aria-hidden="true">
   {/* dir=ltr keeps the fill anchored to the scroll direction in both locales */}
   <div
    ref={barRef}
    dir="ltr"
    className="h-full origin-left bg-gradient-to-r from-royal-500 to-cyan-400"
    style={{ transform: 'scaleX(0)', transition: reduced ? 'none' : 'transform 0.1s linear' }}
   />
  </div>
 )
}
