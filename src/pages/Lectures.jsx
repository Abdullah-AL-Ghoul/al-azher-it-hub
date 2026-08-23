import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useLectures } from '../hooks/useLectures'
import { pageContainer, pageItem, modalOverlay, modalContent } from '../utils/motionTokens'
import FilterBar from '../components/FilterBar'
import CustomSelect from '../components/shared/CustomSelect'
import VideoPlayer from '../components/shared/VideoPlayer'
import ErrorState from '../components/feedback/ErrorState'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useScrollLock } from '../hooks/useScrollLock'
import { FiPlay, FiHeart, FiStar, FiCalendar, FiFilter, FiGrid, FiList, FiCheck, FiSearch, FiInbox, FiX } from 'react-icons/fi'
import { lectureVideoId, lectureThumb } from '../utils/helpers'

const sortOptions = [
 { value: 'date-desc', labelAr: 'الأحدث أولاً', labelEn: 'Newest first' },
 { value: 'date-asc', labelAr: 'الأقدم أولاً', labelEn: 'Oldest first' },
 { value: 'created-desc', labelAr: 'الأحدث إضافةً', labelEn: 'Recently added' },
 { value: 'title', labelAr: 'أبجدي', labelEn: 'Alphabetical' },
]

const containerVariants = pageContainer
const itemVariants = pageItem

export default function Lectures() {
 const { lang, t } = useLanguage()
 const { user } = useAuth()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 const [activeLecture, setActiveLecture] = useState(null)

 useEffect(() => {
  document.title = t('lectures.pageTitle')
 }, [isArabic, t])

 const {
  activeSubject, setActiveSubject,
  search, setSearch,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  showAdvanced, setShowAdvanced,
  sortBy, setSortBy,
   viewMode, setViewMode,
   lectures, subjects, filtered,
   localFavorites, localRatings, viewedIds,
   loading, error, reload,
   handleToggleFavorite, handleRate, handleWatch,
  } = useLectures(user, isArabic)

 if (loading) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="py-16 mb-12">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="skeleton h-10 w-48 mx-auto mb-4 rounded-xl" />
      <div className="skeleton h-5 w-64 mx-auto rounded-lg" />
     </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1,2,3,4,5,6].map(i => (
       <div key={i} className="glass rounded-xl overflow-hidden">
        <div className="skeleton h-40 w-full" />
        <div className="p-5">
         <div className="skeleton h-4 w-1/3 rounded-full mb-2" />
         <div className="skeleton h-5 w-3/4 rounded-lg mb-2" />
         <div className="skeleton h-3 w-1/4 rounded-full" />
        </div>
       </div>
      ))}
     </div>
    </div>
   </div>
  )
 }

 return (
   <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page grain">
   <div className="py-16 mb-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
     <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{t('lectures.title')}</h1>
     <p className="text-slate-500 dark:text-white/50 text-lg">{t('lectures.subtitle')}</p>
    </div>
   </div>

   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div variants={itemVariants} className="mb-10">
     <FilterBar
      subjects={subjects}
      activeSubject={activeSubject}
      onSubjectChange={setActiveSubject}
      searchQuery={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('lectures.search')}
      allLabel={t('lectures.allSubjects')}
      resultCount={filtered.length}
     />
     <div className="mt-4 flex items-center gap-3 flex-wrap">
      <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-medium text-slate-600 dark:text-white/60 hover:text-navy-900 dark:hover:text-white transition">
       <FiFilter size={14} /> {t('lectures.advanced')}
      </button>
      <CustomSelect value={sortBy} options={sortOptions} onChange={setSortBy} isArabic={isArabic} label={t('lectures.sortLabel')} />
       <div className="flex items-center glass rounded-xl overflow-hidden">
        <button
         onClick={() => setViewMode('grid')}
         className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-royal-500 dark:text-cyan-300' : 'text-slate-500 dark:text-white/60 hover:text-navy-900 dark:hover:text-white'}`}
         aria-label={isArabic ? 'عرض شبكي' : 'Grid view'}
         aria-pressed={viewMode === 'grid'}
        >
         <FiGrid size={16} />
        </button>
        <button
         onClick={() => setViewMode('list')}
         className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-royal-500 dark:text-cyan-300' : 'text-slate-500 dark:text-white/60 hover:text-navy-900 dark:hover:text-white'}`}
         aria-label={isArabic ? 'عرض قائمة' : 'List view'}
         aria-pressed={viewMode === 'list'}
        >
         <FiList size={16} />
        </button>
       </div>
     </div>
     <AnimatePresence>
      {showAdvanced && (
       <motion.div initial={prefersReduced ? {} : { opacity: 0, height: 0 }} animate={prefersReduced ? {} : { opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
         <FiCalendar size={14} className="text-slate-500 dark:text-white/60" />
         <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 glass rounded-xl text-sm text-navy-900 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-royal-500/20 dark:focus:ring-cyan-500/20" />
        </div>
        <span className="text-slate-500 dark:text-white/50 self-center">—</span>
        <div className="flex items-center gap-2">
         <FiCalendar size={14} className="text-slate-500 dark:text-white/60" />
         <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 glass rounded-xl text-sm text-navy-900 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-royal-500/20 dark:focus:ring-cyan-500/20" />
        </div>
       </motion.div>
      )}
     </AnimatePresence>
    </motion.div>

    {error && !loading && lectures.length === 0 ? (
     <motion.div variants={itemVariants}>
      <ErrorState
       error={isArabic ? 'تعذر تحميل المحاضرات. تحقق من اتصالك وحاول مجدداً.' : 'Failed to load lectures. Check your connection and try again.'}
       onRetry={reload}
      />
     </motion.div>
    ) : filtered.length === 0 ? (
     <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 glass rounded-2xl border border-white/10"
     >
      <div className="w-16 h-16 bg-royal-500/10 dark:bg-cyan-500/10 border border-royal-500/20 dark:border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
       {search ? <FiSearch className="text-royal-400 dark:text-cyan-400" size={28} /> : <FiInbox className="text-royal-400 dark:text-cyan-400" size={28} />}
      </div>
      <h2 className="text-lg font-bold text-navy-900 dark:text-white mb-2">
       {search ? (isArabic ? 'لا توجد نتائج للبحث' : 'No search results') : (isArabic ? 'لا توجد محاضرات بعد' : 'No lectures yet')}
      </h2>
       <p className="text-sm text-slate-500 dark:text-white/50 max-w-md mx-auto mb-6">
        {search
         ? (isArabic ? 'جرّب كلمة بحث مختلفة أو افحص الفلاتر' : 'Try a different search term or check your filters')
         : (isArabic ? 'سيتم إضافة المحاضرات قريباً من المدير' : 'Lectures will be added by the admin soon')}
       </p>
       {search && (
        <button
         onClick={() => { setSearch(''); setActiveSubject('all') }}
         className="inline-flex items-center gap-2 px-5 py-2.5 bg-royal-500 hover:bg-royal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-xl text-sm font-medium transition"
        >
         {isArabic ? 'مسح البحث' : 'Clear search'}
        </button>
       )}
      </motion.div>
      ) : viewMode === 'grid' ? (
     <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants}>
      {filtered.map(lecture => (
       <LectureCard key={lecture.id} lecture={lecture} isArabic={isArabic} user={user} localFavorites={localFavorites} localRatings={localRatings} viewedIds={viewedIds} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onWatch={handleWatch} onPlay={setActiveLecture} />
      ))}
     </motion.div>
    ) : (
     <motion.div className="space-y-4" variants={containerVariants}>
      {filtered.map(lecture => (
       <LectureListItem key={lecture.id} lecture={lecture} isArabic={isArabic} user={user} localFavorites={localFavorites} localRatings={localRatings} viewedIds={viewedIds} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onWatch={handleWatch} onPlay={setActiveLecture} />
      ))}
     </motion.div>
    )}
   </div>

   <VideoPlayerModal lecture={activeLecture} onClose={() => setActiveLecture(null)} isArabic={isArabic} onWatch={handleWatch} />
  </motion.div>
 )
}

function VideoPlayerModal({ lecture, onClose, isArabic, onWatch }) {
 const prefersReduced = useReducedMotion()
 const trapRef = useFocusTrap(!!lecture)
 useScrollLock(!!lecture)

 useEffect(() => {
  if (!lecture) return
  const onKey = (e) => { if (e.key === 'Escape') onClose() }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
 }, [lecture, onClose])

 return (
  <AnimatePresence>
   {lecture && (
    <motion.div
     {...(prefersReduced ? {} : modalOverlay)}
     className="fixed inset-0 z-[100] flex items-center justify-center p-4"
     onClick={onClose}
     role="dialog"
     aria-modal="true"
     aria-label={isArabic ? (lecture.titleAr || 'فيديو المحاضرة') : (lecture.titleEn || 'Lecture video')}
    >
     <motion.div {...(prefersReduced ? {} : modalOverlay)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
     <motion.div
      ref={trapRef}
      {...(prefersReduced ? {} : modalContent)}
      className="relative w-full max-w-3xl modal-spatial rounded-2xl p-4 sm:p-6"
      onClick={(e) => e.stopPropagation()}
     >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white truncate">{isArabic ? lecture.titleAr : lecture.titleEn}</h2>
       <button onClick={onClose} className="p-2 flex-shrink-0 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 dark:text-white/70 transition-colors" aria-label={isArabic ? 'إغلاق' : 'Close'}>
        <FiX size={20} />
       </button>
      </div>
      <VideoPlayer
       videoId={lectureVideoId(lecture)}
       url={lecture.url}
       title={isArabic ? lecture.titleAr : lecture.titleEn}
       isArabic={isArabic}
       onWatch={onWatch ? () => onWatch(lecture.id, lecture) : undefined}
      />
     </motion.div>
    </motion.div>
   )}
  </AnimatePresence>
 )
}

function LectureCard({ lecture, isArabic, user, localFavorites, localRatings, viewedIds, onToggleFavorite, onRate, onWatch, onPlay }) {
  const { t } = useLanguage()
  const isViewed = viewedIds.includes(lecture.id)
  const videoId = lectureVideoId(lecture)
  const title = isArabic ? lecture.titleAr : lecture.titleEn
  return (
    <motion.div variants={itemVariants} className="relative group glass glass-hover lift rounded-xl overflow-hidden">
      <Link to={`/lecture/${lecture.id}`} onClick={() => onWatch(lecture.id, lecture)} className="absolute inset-0 z-0 rounded-xl" aria-label={title} />
      <div className="pointer-events-none relative aspect-video bg-black/30 flex items-center justify-center overflow-hidden">
      {videoId ? (
        <img src={lectureThumb(videoId, 'mq')} srcSet={`${lectureThumb(videoId, 'mq')} 320w, ${lectureThumb(videoId, 'hq')} 480w`} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" alt="" width="320" height="180" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
     )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
     <div className="absolute inset-0 flex items-center justify-center">
      <button type="button" onClick={() => onPlay(lecture)} className="pointer-events-auto relative z-10 w-16 h-16 bg-rose-500/80 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition duration-300 group-hover:scale-110 shadow-xl shadow-rose-500/20 backdrop-blur-sm" aria-label={isArabic ? 'تشغيل داخل الموقع' : 'Play inside the site'}>
       <FiPlay size={28} className="ms-0.5" />
      </button>
     </div>
     {isViewed && (
      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-emerald-500/80 backdrop-blur-sm rounded-full text-white text-xs font-medium">
       <FiCheck size={12} />
       <span>{t('lectures.watched')}</span>
      </div>
     )}
     {user && (
      <button onClick={() => onToggleFavorite(lecture.id, lecture)} className="pointer-events-auto absolute top-3 right-3 z-10 p-2 bg-black/30 backdrop-blur-sm rounded-full transition hover:bg-black/50" aria-label={localFavorites.includes(lecture.id) ? t('lectures.unfavorite') : t('lectures.favorite')}>
       <FiHeart size={16} className={localFavorites.includes(lecture.id) ? 'fill-rose-500 text-rose-500' : 'text-white'} />
      </button>
     )}
    </div>
    <div className="relative p-5">
     <span className="inline-block text-xs bg-royal-500/10 dark:bg-cyan-500/10 border border-royal-500/20 dark:border-cyan-500/20 text-royal-500 dark:text-cyan-400 px-2.5 py-1 rounded-full mb-2">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
     <h2 className="font-semibold text-navy-900 dark:text-white mb-1 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors">{title}</h2>
     <div className="flex items-center justify-between mt-3">
      <span className="text-xs text-slate-500 dark:text-slate-400">{lecture.date}</span>
      <span className="text-sm font-medium text-royal-500 dark:text-cyan-400 group-hover:text-royal-600 dark:group-hover:text-cyan-300 transition-colors">{t('lectures.viewLink')} →</span>
     </div>
     {user && (
      <div className="relative z-10 mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-1">
       {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={() => onRate(lecture.id, star, lecture)} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-125" aria-label={`${t('lectures.rate')} ${star}`}>
         <FiStar size={16} className={(localRatings[lecture.id] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/60'} />
        </button>
       ))}
       </div>
      )}
     </div>
    </motion.div>
  )
 }

function LectureListItem({ lecture, isArabic, user, localFavorites, localRatings, viewedIds, onToggleFavorite, onRate, onWatch, onPlay }) {
  const { t } = useLanguage()
  const isViewed = viewedIds.includes(lecture.id)
  const videoId = lectureVideoId(lecture)
  const title = isArabic ? lecture.titleAr : lecture.titleEn
  return (
    <motion.div variants={itemVariants} className="relative group glass glass-hover flex items-center gap-4 p-4 rounded-xl">
     <Link to={`/lecture/${lecture.id}`} onClick={() => onWatch(lecture.id, lecture)} className="absolute inset-0 z-0 rounded-xl" aria-label={title} />
      <div className="pointer-events-none relative w-32 h-20 flex-shrink-0 bg-black/30 rounded-xl overflow-hidden flex items-center justify-center">
      {videoId ? (
         <img src={lectureThumb(videoId, 'mq')} srcSet={`${lectureThumb(videoId, 'mq')} 320w, ${lectureThumb(videoId, 'hq')} 480w`} sizes="128px" alt="" width="320" height="180" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />
      ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
     )}
     <div className="absolute inset-0 flex items-center justify-center">
      <button type="button" onClick={() => onPlay(lecture)} className="pointer-events-auto relative z-10 w-10 h-10 bg-rose-500/80 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-sm" aria-label={isArabic ? 'تشغيل داخل الموقع' : 'Play inside the site'}>
        <FiPlay size={18} className="ms-0.5" />
      </button>
     </div>
     {isViewed && (
      <div className="absolute top-1 left-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
       <FiCheck size={12} className="text-white" />
      </div>
     )}
    </div>
    <div className="relative flex-1 min-w-0 pointer-events-none">
     <span className="inline-block text-xs bg-royal-500/10 dark:bg-white/5 border border-royal-500/20 dark:border-white/10 text-royal-500 dark:text-white/60 px-2 py-0.5 rounded-full mb-1">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
     <h2 className="font-semibold text-navy-900 dark:text-white text-sm group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors truncate">{title}</h2>
     <span className="text-xs text-slate-500 dark:text-white/50">{lecture.date}</span>
    </div>
    <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0 flex-wrap">
     {user && (
      <>
       <button onClick={() => onToggleFavorite(lecture.id, lecture)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label={localFavorites.includes(lecture.id) ? t('lectures.unfavorite') : t('lectures.favorite')}>
        <FiHeart size={16} className={localFavorites.includes(lecture.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-white/60'} />
       </button>
<div className="flex items-center gap-0.5 flex-wrap">
          {[1,2,3,4,5].map(star => (
           <button key={star} onClick={() => onRate(lecture.id, star, lecture)} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label={`${t('lectures.rate')} ${star}`}>
            <FiStar size={14} className={(localRatings[lecture.id] || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/60'} />
           </button>
          ))}
       </div>
       </>
      )}
     </div>
    </motion.div>
  )
 }
