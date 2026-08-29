import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useLectures } from '../hooks/useLectures'
import { FiPlay, FiHeart, FiCalendar, FiFilter, FiGrid, FiList, FiCheck, FiSearch, FiInbox, FiEye, FiBookOpen, FiExternalLink } from 'react-icons/fi'
import { lectureVideoId, lectureThumb, SORT_OPTIONS } from '../utils/helpers'
import FilterBar from '../components/FilterBar'
import CustomSelect from '../components/shared/CustomSelect'
import VideoPlayer from '../components/shared/VideoPlayer'
import ErrorState from '../components/feedback/ErrorState'
import Modal from '../components/ui/Modal'
import StarRating from '../components/shared/StarRating'
import Skeleton from '../components/shared/Skeleton'

const sortOptions = SORT_OPTIONS

const watchFilterOptions = [
 { value: 'all', labelAr: 'الكل', labelEn: 'All' },
 { value: 'unwatched', labelAr: 'غير مشاهد', labelEn: 'Unwatched' },
 { value: 'watched', labelAr: 'مشاهد', labelEn: 'Watched' },
]

export default function Lectures() {
 const { lang, t } = useLanguage()
 const { user } = useAuth()
 const isArabic = lang === 'ar'
 const [searchParams, setSearchParams] = useSearchParams()
 const [activeLecture, setActiveLecture] = useState(null)
 const [watchFilter, setWatchFilter] = useState('all')
 const initRef = useRef(false)

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

 // ― URL sync ―
 useEffect(() => {
  if (initRef.current) return
  initRef.current = true
  const p = new URLSearchParams(searchParams)
  if (p.get('subject')) setActiveSubject(p.get('subject'))
  if (p.get('q')) setSearch(p.get('q'))
  if (p.get('sort')) setSortBy(p.get('sort'))
  if (p.get('view')) setViewMode(p.get('view'))
  if (p.get('watch')) setWatchFilter(p.get('watch'))
 }, [searchParams, setActiveSubject, setSearch, setSortBy, setViewMode])

 useEffect(() => {
  const p = new URLSearchParams()
  if (activeSubject !== 'all') p.set('subject', activeSubject)
  if (search) p.set('q', search)
  if (sortBy !== 'date-desc') p.set('sort', sortBy)
  if (viewMode !== 'grid') p.set('view', viewMode)
  if (watchFilter !== 'all') p.set('watch', watchFilter)
  const qs = p.toString()
  setSearchParams(qs ? `?${qs}` : '', { replace: true })
 }, [activeSubject, search, sortBy, viewMode, watchFilter, setSearchParams])

 
 // ― computed data ―
 const displayList = useMemo(() => {
  if (watchFilter === 'watched') return filtered.filter(l => viewedIds.includes(l.id))
  if (watchFilter === 'unwatched') return filtered.filter(l => !viewedIds.includes(l.id))
  return filtered
 }, [filtered, watchFilter, viewedIds])

 const subjectCounts = useMemo(() => {
  const map = {}
  lectures.forEach(l => {
   const name = isArabic ? l.subjectAr : l.subjectEn
   map[name] = (map[name] || 0) + 1
  })
  return map
 }, [lectures, isArabic])

 const continueWatching = useMemo(() => {
  const lastIds = viewedIds.slice(-4).reverse()
  return lastIds.map(vid => lectures.find(l => l.id === vid)).filter(Boolean)
 }, [viewedIds, lectures])

 const stats = useMemo(() => ({
  total: lectures.length,
  subjects: subjects.length,
  watched: viewedIds.length,
  favorites: localFavorites.length,
 }), [lectures, subjects, viewedIds, localFavorites])

 // ― loading state ―
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
       <div key={i} className="glass rounded-xl overflow-hidden">
        <Skeleton className="h-40 w-full" />
        <div className="p-5">
         <Skeleton className="h-4 w-1/3 rounded-full mb-2" />
         <Skeleton className="h-5 w-3/4 rounded-lg mb-2" />
         <Skeleton className="h-3 w-1/4 rounded-full" />
        </div>
       </div>
      ))}
     </div>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen pt-24 pb-16 bg-spatial-page ">
   {/* Page header */}
   <div className="py-16 mb-8">
    <div className="container-page text-center">
     <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{t('lectures.title')}</h1>
     <p className="text-slate-500 dark:text-white/50 text-lg">{t('lectures.subtitle')}</p>
    </div>
   </div>

   <div className="container-page">
    {/* Stats strip */}
    {user && stats.total > 0 && (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
       { value: stats.total, label: isArabic ? 'محاضرة' : 'Lectures', icon: FiPlay, color: 'bg-royal-500/10 text-royal-500' },
       { value: stats.subjects, label: isArabic ? 'مادة' : 'Subjects', icon: FiBookOpen, color: 'bg-cyan-500/10 text-cyan-500' },
       { value: stats.watched, label: isArabic ? 'مُشاهد' : 'Watched', icon: FiEye, color: 'bg-emerald-500/10 text-emerald-500' },
       { value: stats.favorites, label: isArabic ? 'مُفضّل' : 'Favorites', icon: FiHeart, color: 'bg-rose-500/10 text-rose-500' },
      ].map(s => {
       const Icon = s.icon
       return (
        <div key={s.label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
         <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
          <Icon size={18} />
         </div>
         <div>
          <p className="text-lg font-bold text-ink leading-tight">{s.value}</p>
          <p className="text-xs text-slate-500 dark:text-white/50">{s.label}</p>
         </div>
        </div>
       )
      })}
     </motion.div>
    )}

    {/* Continue watching */}
    {user && continueWatching.length > 0 && (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <div className="flex items-center justify-between mb-3">
       <h2 className="text-sm font-bold text-ink flex items-center gap-2">
        <FiEye size={16} className="text-accent" />
        {isArabic ? 'متابعة المشاهدة' : 'Continue watching'}
       </h2>
       <Link to="/lectures" className="text-xs text-accent hover:text-royal-600 dark:hover:text-cyan-300 transition-colors">
        {isArabic ? 'عرض الكل' : 'View all'} →
       </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
       {continueWatching.slice(0, 6).map(l => {
        const vid = lectureVideoId(l)
        return (
         <button key={l.id} onClick={() => setActiveLecture(l)} className="snap-start shrink-0 w-44 glass rounded-xl overflow-hidden text-start group hover:border-royal-500/30 transition-colors border border-transparent">
          <div className="relative h-20 bg-black/30">
           {vid && <img src={lectureThumb(vid, 'mq')} alt="" width="176" height="80" loading="lazy" className="w-full h-full object-cover" />}
           <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 bg-rose-500/90 rounded-full flex items-center justify-center text-white">
             <FiPlay size={14} className="ms-0.5" />
            </div>
           </div>
          </div>
          <div className="px-3 py-2">
           <p className="text-[10px] text-slate-500 dark:text-white/50 truncate">{isArabic ? l.subjectAr : l.subjectEn}</p>
           <p className="text-xs font-semibold text-ink truncate">{isArabic ? l.titleAr : l.titleEn}</p>
          </div>
         </button>
        )
       })}
      </div>
     </motion.div>
    )}

    {/* Filters (sticky) */}
    <div className="sticky top-20 z-30 bg-spatial-page/90 backdrop-blur-md -mx-4 px-4 py-4 -mt-4 mb-4 border-b border-line">
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FilterBar
       subjects={subjects}
       subjectCounts={subjectCounts}
       activeSubject={activeSubject}
       onSubjectChange={setActiveSubject}
       searchQuery={search}
       onSearchChange={setSearch}
       searchPlaceholder={t('lectures.search')}
       allLabel={t('lectures.allSubjects')}
       resultCount={displayList.length}
      />
      <div className="mt-3 flex items-center gap-3 flex-wrap">
       {/* Watched filter */}
       {user && (
        <div className="flex items-center glass rounded-xl overflow-hidden">
         {watchFilterOptions.map(w => (
          <button
           key={w.value}
           onClick={() => setWatchFilter(w.value)}
           aria-pressed={watchFilter === w.value}
           className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            watchFilter === w.value
             ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-accent'
             : 'text-slate-500 dark:text-white/60 hover:text-ink'
           }`}
          >
           {isArabic ? w.labelAr : w.labelEn}
          </button>
         ))}
        </div>
       )}
       <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-medium text-slate-600 dark:text-white/60 hover:text-ink transition">
        <FiFilter size={14} /> {t('lectures.advanced')}
       </button>
       <CustomSelect value={sortBy} options={sortOptions} onChange={setSortBy} isArabic={isArabic} label={t('lectures.sortLabel')} />
       <div className="flex items-center glass rounded-xl overflow-hidden ms-auto">
        <button
         onClick={() => setViewMode('grid')}
         className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-accent' : 'text-slate-500 dark:text-white/60 hover:text-ink'}`}
         aria-label={isArabic ? 'عرض شبكي' : 'Grid view'}
         aria-pressed={viewMode === 'grid'}
        >
         <FiGrid size={16} />
        </button>
        <button
         onClick={() => setViewMode('list')}
         className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-accent' : 'text-slate-500 dark:text-white/60 hover:text-ink'}`}
         aria-label={isArabic ? 'عرض قائمة' : 'List view'}
         aria-pressed={viewMode === 'list'}
        >
         <FiList size={16} />
        </button>
       </div>
      </div>
      {showAdvanced && (
       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
         <FiCalendar size={14} className="text-slate-500 dark:text-white/60" />
         <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 glass rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/20" />
        </div>
        <span className="text-slate-500 dark:text-white/50 self-center">—</span>
        <div className="flex items-center gap-2">
         <FiCalendar size={14} className="text-slate-500 dark:text-white/60" />
         <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 glass rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/20" />
        </div>
       </motion.div>
      )}
     </motion.div>
    </div>

    {/* Error / Empty / Content */}
    {error && !loading && lectures.length === 0 ? (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ErrorState error={isArabic ? 'تعذر تحميل المحاضرات. تحقق من اتصالك وحاول مجدداً.' : 'Failed to load lectures. Check your connection and try again.'} onRetry={reload} />
     </motion.div>
    ) : displayList.length === 0 ? (
     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 glass rounded-2xl border border-white/10">
      <div className="w-16 h-16 bg-royal-500/10 dark:bg-cyan-500/10 border border-royal-500/20 dark:border-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
       {search || watchFilter !== 'all' ? <FiSearch className="text-royal-400 dark:text-cyan-400" size={28} /> : <FiInbox className="text-royal-400 dark:text-cyan-400" size={28} />}
      </div>
      <h2 className="text-lg font-bold text-ink mb-2">
       {search || watchFilter !== 'all' ? (isArabic ? 'لا توجد نتائج' : 'No results') : (isArabic ? 'لا توجد محاضرات بعد' : 'No lectures yet')}
      </h2>
      <p className="text-sm text-slate-500 dark:text-white/50 max-w-md mx-auto mb-6">
       {search || watchFilter !== 'all'
        ? (isArabic ? 'جرّب كلمة بحث مختلفة أو عدّل الفلاتر' : 'Try a different search or adjust your filters')
        : (isArabic ? 'سيتم إضافة المحاضرات قريباً من المدير' : 'Lectures will be added by the admin soon')}
      </p>
      {(search || watchFilter !== 'all') && (
       <button onClick={() => { setSearch(''); setActiveSubject('all'); setWatchFilter('all') }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-royal-500 hover:bg-royal-600 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white rounded-xl text-sm font-medium transition">
        {isArabic ? 'مسح الفلاتر' : 'Clear filters'}
       </button>
      )}
     </motion.div>
    ) : viewMode === 'grid' ? (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {displayList.map(lecture => (
       <LectureCard key={lecture.id} lecture={lecture} isArabic={isArabic} user={user} localFavorites={localFavorites} localRatings={localRatings} viewedIds={viewedIds} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onWatch={handleWatch} onPlay={setActiveLecture} />
      ))}
     </motion.div>
    ) : (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {displayList.map(lecture => (
       <LectureListItem key={lecture.id} lecture={lecture} isArabic={isArabic} user={user} localFavorites={localFavorites} localRatings={localRatings} viewedIds={viewedIds} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onWatch={handleWatch} onPlay={setActiveLecture} />
      ))}
     </motion.div>
    )}

    {/* Video modal */}
    <VideoPlayerModal
     lecture={activeLecture}
     onClose={() => setActiveLecture(null)}
     isArabic={isArabic}
     onWatch={handleWatch}
     localFavorites={localFavorites}
     localRatings={localRatings}
     onToggleFavorite={handleToggleFavorite}
     onRate={handleRate}
    />
   </div>
  </div>
 )
}

function VideoPlayerModal({ lecture, onClose, isArabic, onWatch, localFavorites, localRatings, onToggleFavorite, onRate }) {
 const isFavorite = lecture ? localFavorites.includes(lecture.id) : false
 const rating = lecture ? localRatings[lecture.id] || 0 : 0

 return (
  <Modal isOpen={!!lecture} onClose={onClose} size="lg" className="p-4 sm:p-6">
   {lecture && (
    <>
     <div className="flex items-center justify-between gap-3 mb-4">
      <div className="min-w-0 flex-1">
       <h2 className="text-base sm:text-lg font-bold text-ink truncate">{isArabic ? lecture.titleAr : lecture.titleEn}</h2>
       <span className="text-xs text-accent">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
      </div>
      <Link to={`/lecture/${lecture.id}`} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 glass rounded-lg text-xs font-medium text-ink hover:text-accent transition-colors" onClick={onClose}>
       {isArabic ? 'الصفحة الكاملة' : 'Full page'} <FiExternalLink size={12} />
      </Link>
     </div>

     <VideoPlayer
      videoId={lectureVideoId(lecture)}
      url={lecture.url}
      title={isArabic ? lecture.titleAr : lecture.titleEn}
      isArabic={isArabic}
      onWatch={onWatch ? () => onWatch(lecture.id, lecture) : undefined}
      autoPlay
     />

     {/* Quick actions */}
     <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
      <StarRating value={rating} onRate={(star) => onRate?.(lecture.id, star, lecture)} target="sm" />
      <button onClick={() => onToggleFavorite?.(lecture.id, lecture)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5" aria-label={isFavorite ? (isArabic ? 'إزالة من المفضلة' : 'Unfavorite') : (isArabic ? 'إضافة للمفضلة' : 'Favorite')}>
       <FiHeart size={16} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-500'} />
       <span className="text-slate-500 dark:text-white/60">{isArabic ? 'مفضلة' : 'Favorite'}</span>
      </button>
     </div>
    </>
   )}
  </Modal>
 )
}

function LectureCard({ lecture, isArabic, user, localFavorites, localRatings, viewedIds, onToggleFavorite, onRate, onWatch, onPlay }) {
  const { t } = useLanguage()
  const isViewed = viewedIds.includes(lecture.id)
  const videoId = lectureVideoId(lecture)
  const title = isArabic ? lecture.titleAr : lecture.titleEn
  return (
     <div className="relative group glass-panel gradient-border spotlight-card lift rounded-xl overflow-hidden" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
      <Link to={`/lecture/${lecture.id}`} onClick={() => onWatch(lecture.id, lecture)} className="absolute inset-0 z-0 rounded-xl" aria-label={title} />
      <div className="relative aspect-video pointer-events-none bg-black/30 flex items-center justify-center overflow-hidden">
      {videoId ? (
        <img src={lectureThumb(videoId, 'mq')} srcSet={`${lectureThumb(videoId, 'mq')} 320w, ${lectureThumb(videoId, 'hq')} 480w`} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" alt="" width="320" height="180" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform" />
      ) : (
       <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
     )}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <button type="button" onClick={(e) => { e.preventDefault(); onPlay(lecture) }} className="pointer-events-auto relative z-10 w-16 h-16 bg-rose-500/80 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition duration-300 group-hover:scale-110 shadow-xl shadow-rose-500/20 backdrop-blur-sm" aria-label={isArabic ? 'تشغيل داخل الموقع' : 'Play inside the site'}>
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
      <button onClick={(e) => { e.preventDefault(); onToggleFavorite(lecture.id, lecture) }} className="pointer-events-auto absolute top-3 right-3 z-10 p-2 bg-black/30 backdrop-blur-sm rounded-full transition hover:bg-black/50" aria-label={localFavorites.includes(lecture.id) ? t('lectures.unfavorite') : t('lectures.favorite')}>
       <FiHeart size={16} className={localFavorites.includes(lecture.id) ? 'fill-rose-500 text-rose-500' : 'text-white'} />
      </button>
     )}
    </div>
    <div className="relative p-5 pointer-events-none">
     <div className="flex items-center gap-2 mb-2">
      <span className="eyebrow text-[10px] !mb-0 !gap-1.5">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
      <span className="ms-auto text-[10px] tracking-widest uppercase font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-500 dark:text-white/60 tabular-nums">{lecture.date || '—'}</span>
     </div>
     <h2 className="font-semibold text-ink mb-1 group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors line-clamp-2">{title}</h2>
     <div className="flex items-center justify-between mt-3">
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-white/50"><FiCalendar size={12} /> {isArabic ? 'محاضرة' : 'Lecture'}</span>
      <span className="text-sm font-medium text-accent group-hover:text-royal-600 dark:group-hover:text-cyan-300 transition-colors inline-flex items-center gap-1">{t('lectures.viewLink')} <span aria-hidden="true">→</span></span>
     </div>
      {user && (
       <div className="relative z-10 pointer-events-auto mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center gap-1">
        <StarRating value={localRatings[lecture.id] || 0} onRate={(star) => onRate(lecture.id, star, lecture)} />
       </div>
       )}
     </div>
    </div>
  )
 }

function LectureListItem({ lecture, isArabic, user, localFavorites, localRatings, viewedIds, onToggleFavorite, onRate, onWatch, onPlay }) {
  const { t } = useLanguage()
  const isViewed = viewedIds.includes(lecture.id)
  const videoId = lectureVideoId(lecture)
  const title = isArabic ? lecture.titleAr : lecture.titleEn
  return (
    <div className="relative group glass glass-hover flex items-center gap-4 p-4 rounded-xl">
     <Link to={`/lecture/${lecture.id}`} onClick={() => onWatch(lecture.id, lecture)} className="absolute inset-0 z-0 rounded-xl" aria-label={title} />
      <div className="pointer-events-none relative w-32 h-20 flex-shrink-0 bg-black/30 rounded-xl overflow-hidden flex items-center justify-center">
      {videoId ? (
         <img src={lectureThumb(videoId, 'mq')} srcSet={`${lectureThumb(videoId, 'mq')} 320w, ${lectureThumb(videoId, 'hq')} 480w`} sizes="128px" alt="" width="320" height="180" loading="lazy" decoding="async" fetchPriority="low" className="w-full h-full object-cover" />
      ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
     )}
     <div className="absolute inset-0 flex items-center justify-center">
      <button type="button" onClick={(e) => { e.preventDefault(); onPlay(lecture) }} className="pointer-events-auto relative z-10 w-10 h-10 bg-rose-500/80 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-sm" aria-label={isArabic ? 'تشغيل داخل الموقع' : 'Play inside the site'}>
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
     <h2 className="font-semibold text-ink text-sm group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors truncate">{title}</h2>
     <span className="text-xs text-slate-500 dark:text-white/50">{lecture.date}</span>
    </div>
    <div className="relative z-10 pointer-events-auto flex items-center gap-1.5 flex-shrink-0 flex-wrap">
     {user && (
      <>
       <button onClick={(e) => { e.preventDefault(); onToggleFavorite(lecture.id, lecture) }} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label={localFavorites.includes(lecture.id) ? t('lectures.unfavorite') : t('lectures.favorite')}>
        <FiHeart size={16} className={localFavorites.includes(lecture.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-white/60'} />
       </button>
       <StarRating value={localRatings[lecture.id] || 0} onRate={(star) => onRate(lecture.id, star, lecture)} size={14} />
      </>
     )}
    </div>
   </div>
  )
 }