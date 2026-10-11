import { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useLectures } from '../hooks/useLectures'
import { FiPlay, FiHeart, FiCalendar, FiFilter, FiGrid, FiList, FiCheck, FiSearch, FiInbox, FiEye, FiBookOpen, FiExternalLink } from 'react-icons/fi'
import PageHero from '../components/shared/PageHero'
import LectureThumbnail from '../components/shared/LectureThumbnail'
import EmptyState from '../components/shared/EmptyState'
import { lectureVideoId, SORT_OPTIONS } from '../utils/helpers'
import FilterBar from '../components/FilterBar'
import CustomSelect from '../components/shared/CustomSelect'
import ErrorState from '../components/feedback/ErrorState'
import StarRating from '../components/shared/StarRating'
import Skeleton from '../components/shared/Skeleton'
import usePagination from '../hooks/usePagination'
import useTilt3D from '../hooks/useTilt3D'

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

 // Progressive rendering: 24 cards per batch with "load more" (200-card
 // full lists re-render on every filter keystroke otherwise).
 const { paginatedItems: visibleLectures, totalItems: totalVisible, hasNext: hasMoreLectures, setPage: setLecturePage } = usePagination(displayList, 24)

 // Back to batch 1 when filters change — but not when watched-state updates
 // (marking a lecture viewed must not snap the grid to page 1).
 const filterKey = `${search}|${activeSubject}|${dateFrom}|${dateTo}|${sortBy}|${watchFilter}`
 const lastFilterKeyRef = useRef(filterKey)
 useEffect(() => {
  if (lastFilterKeyRef.current !== filterKey) {
   lastFilterKeyRef.current = filterKey
   setLecturePage(1)
  }
 }, [filterKey, setLecturePage])

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
   <PageHero variant="play" title={t('lectures.title')} subtitle={t('lectures.subtitle')} />

   <div className="container-page">
    {/* Stats strip */}
    {user && stats.total > 0 && (
     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
       { value: stats.total, label: t('inline.lectures.lectures'), icon: FiPlay, color: 'bg-royal-500/10 text-royal-500' },
       { value: stats.subjects, label: t('inline.lectures.subjects'), icon: FiBookOpen, color: 'bg-cyan-500/10 text-cyan-500' },
       { value: stats.watched, label: t('inline.lectures.watched'), icon: FiEye, color: 'bg-emerald-500/10 text-emerald-500' },
       { value: stats.favorites, label: t('inline.lectures.favorites'), icon: FiHeart, color: 'bg-rose-500/10 text-rose-500' },
      ].map(s => {
       const Icon = s.icon
       return (
        <div key={s.label} className="stat-tile px-4 py-3">
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
        {t('inline.lectures.continue-watching')}
       </h2>
       <Link to="/lectures" className="text-xs text-accent hover:text-royal-600 dark:hover:text-cyan-300 transition-colors">
        {t('inline.lectures.view-all')} →
       </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
       {continueWatching.slice(0, 6).map(l => {
        const vid = lectureVideoId(l)
        return (
         <Link key={l.id} to={`/lecture/${l.id}`} className="snap-start shrink-0 w-44 glass rounded-xl overflow-hidden text-start group hover:border-royal-500/30 transition-colors border border-transparent">
          <div className="relative aspect-video bg-black/30">
           <LectureThumbnail videoId={vid} alt="" width={176} height={99} />
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
         </Link>
        )
       })}
      </div>
     </motion.div>
    )}

    {/* Filters (sticky) */}
    <div className="sticky top-20 z-30 bg-spatial-page -mx-4 px-4 py-4 -mt-4 mb-4 border-b border-line">
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
         aria-label={t('inline.lectures.grid-view')}
         aria-pressed={viewMode === 'grid'}
        >
         <FiGrid size={16} />
        </button>
        <button
         onClick={() => setViewMode('list')}
         className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-accent' : 'text-slate-500 dark:text-white/60 hover:text-ink'}`}
         aria-label={t('inline.lectures.list-view')}
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
         <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label={t('inline.lectures.from-date')} className="px-3 py-2 glass rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/20" />
        </div>
        <span className="text-slate-500 dark:text-white/50 self-center">—</span>
        <div className="flex items-center gap-2">
         <FiCalendar size={14} className="text-slate-500 dark:text-white/60" />
         <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label={t('inline.lectures.to-date')} className="px-3 py-2 glass rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/20" />
        </div>
       </motion.div>
      )}
     </motion.div>
    </div>

    {/* Error / Empty / Content */}
    {error && !loading && lectures.length === 0 ? (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ErrorState error={t('inline.lectures.failed-to-load-lectures')} onRetry={reload} />
     </motion.div>
    ) : displayList.length === 0 ? (
     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <EmptyState
       icon={search || watchFilter !== 'all' ? FiSearch : FiInbox}
       title={search || watchFilter !== 'all' ? (t('inline.lectures.no-results')) : (t('inline.lectures.no-lectures-yet'))}
       description={search || watchFilter !== 'all'
        ? (t('inline.lectures.try-a-different-search'))
        : (t('inline.lectures.lectures-will-be-added'))}
       action={(search || watchFilter !== 'all') && (
        <button onClick={() => { setSearch(''); setActiveSubject('all'); setWatchFilter('all') }} className="inline-flex items-center gap-2 px-5 py-2.5 btn-primary rounded-xl text-sm font-medium">
         {t('inline.lectures.clear-filters')}
        </button>
       )}
      />
     </motion.div>
    ) : viewMode === 'grid' ? (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {visibleLectures.map(lecture => (
       <LectureCard key={lecture.id} lecture={lecture} isArabic={isArabic} user={user} localFavorites={localFavorites} localRatings={localRatings} viewedIds={viewedIds} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onWatch={handleWatch} />
      ))}
     </motion.div>
    ) : (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {visibleLectures.map(lecture => (
       <LectureListItem key={lecture.id} lecture={lecture} isArabic={isArabic} user={user} localFavorites={localFavorites} localRatings={localRatings} viewedIds={viewedIds} onToggleFavorite={handleToggleFavorite} onRate={handleRate} onWatch={handleWatch} />
      ))}
     </motion.div>
    )}

    {hasMoreLectures && (
     <div className="mt-10 text-center">
      <button
       type="button"
       onClick={() => setLecturePage(p => p + 1)}
       className="btn-spatial px-8 py-3 rounded-xl text-sm font-semibold"
      >
       {isArabic ? `تحميل المزيد (${visibleLectures.length} من ${totalVisible})` : `Load more (${visibleLectures.length} of ${totalVisible})`}
      </button>
     </div>
    )}
   </div>
  </div>
 )
}

// Pointer-tracked spotlight vars, coalesced to one getBoundingClientRect per
// frame (unthrottled handlers × 200 cards jank on filter keystrokes).
function useSpotlightVars() {
  const rafRef = useRef(null)
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])
  return useCallback((e) => {
    const el = e.currentTarget
    const { clientX, clientY } = e
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mouse-x', `${((clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--mouse-y', `${((clientY - r.top) / r.height) * 100}%`)
    })
  }, [])
}

const LectureCard = memo(function LectureCard({ lecture, isArabic, user, localFavorites, localRatings, viewedIds, onToggleFavorite, onRate, onWatch }) {
  const { t } = useLanguage()
  const onSpotlightMove = useSpotlightVars()
  const { ref: tiltRef, tiltHandlers } = useTilt3D({ max: 6 })
  const isViewed = viewedIds.includes(lecture.id)
  const videoId = lectureVideoId(lecture)
  const title = isArabic ? lecture.titleAr : lecture.titleEn
  const lectureUrl = `/lecture/${lecture.id}`

  return (
    <div
      ref={tiltRef}
      {...tiltHandlers}
      className="relative group glass-panel gradient-border spotlight-card tilt-card lift rounded-2xl overflow-hidden card-shine flex flex-col"
      onMouseMove={onSpotlightMove}
    >
      {/* Thumbnail Area - Click goes directly to lecture detail page */}
      <Link
        to={lectureUrl}
        onClick={() => onWatch(lecture.id, lecture)}
        className="relative block aspect-video bg-black/40 overflow-hidden cursor-pointer"
        aria-label={`${t('inline.lectures.play-inside-the-site')}: ${title}`}
      >
        <LectureThumbnail
          videoId={videoId}
          thumbnail={lecture.thumbnail || lecture.thumbUrl}
          alt={title || ''}
          sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(50vw - 2.5rem), calc(33.333vw - 2.7rem)"
          className="group-hover:scale-[1.06] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
        />
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Play button indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-rose-600/90 group-hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:scale-110 transition-all duration-300 backdrop-blur-xs">
            <FiPlay size={28} className="ms-1" />
          </div>
        </div>

        {isViewed && (
          <div className="absolute top-3 start-3 flex items-center gap-1 px-2.5 py-1 bg-emerald-500/90 backdrop-blur-md rounded-full text-white text-xs font-semibold shadow-md">
            <FiCheck size={12} />
            <span>{t('lectures.watched')}</span>
          </div>
        )}

        {user && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(lecture.id, lecture)
            }}
            className="absolute top-3 end-3 z-10 p-2.5 bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition text-white"
            aria-label={localFavorites.includes(lecture.id) ? t('lectures.unfavorite') : t('lectures.favorite')}
          >
            <FiHeart size={16} className={localFavorites.includes(lecture.id) ? 'fill-rose-500 text-rose-500' : 'text-white'} />
          </button>
        )}
      </Link>

      {/* Info Body */}
      <div className="relative p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow text-[10px] !mb-0 !gap-1.5">{isArabic ? lecture.subjectAr : lecture.subjectEn}</span>
            <span className="ms-auto text-[10px] tracking-widest uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-500 dark:text-white/60 tabular-nums">
              {lecture.date || '—'}
            </span>
          </div>
          <Link
            to={lectureUrl}
            onClick={() => onWatch(lecture.id, lecture)}
            className="font-bold text-ink hover:text-accent transition-colors line-clamp-2 text-base leading-snug"
          >
            {title}
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5 dark:border-white/5">
            <Link
              to={lectureUrl}
              onClick={() => onWatch(lecture.id, lecture)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
            >
              <FiPlay size={13} />
              <span>{isArabic ? 'مشاهدة المحاضرة' : 'Watch Lecture'}</span>
            </Link>
            <Link
              to={lectureUrl}
              onClick={() => onWatch(lecture.id, lecture)}
              className="text-xs font-medium text-accent hover:text-royal-600 dark:hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
            >
              <span>{t('lectures.viewLink')}</span>
              <FiExternalLink size={12} />
            </Link>
          </div>

          {user && (
            <div className="relative z-10 mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1">
              <StarRating value={localRatings[lecture.id] || 0} onRate={(star) => onRate(lecture.id, star, lecture)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

const LectureListItem = memo(function LectureListItem({ lecture, isArabic, user, localFavorites, localRatings, viewedIds, onToggleFavorite, onRate, onWatch }) {
  const { t } = useLanguage()
  const isViewed = viewedIds.includes(lecture.id)
  const videoId = lectureVideoId(lecture)
  const title = isArabic ? lecture.titleAr : lecture.titleEn
  const lectureUrl = `/lecture/${lecture.id}`

  return (
    <div className="relative group glass glass-hover flex items-center gap-4 p-4 rounded-xl">
      <Link
        to={lectureUrl}
        onClick={() => onWatch(lecture.id, lecture)}
        className="relative w-36 h-24 flex-shrink-0 bg-black/40 rounded-xl overflow-hidden cursor-pointer block"
        aria-label={`${t('inline.lectures.play-inside-the-site')}: ${title}`}
      >
        <LectureThumbnail videoId={videoId} thumbnail={lecture.thumbnail || lecture.thumbUrl} alt={title || ''} width={144} height={96} sizes="144px" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-rose-600/90 group-hover:bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-xs transition transform group-hover:scale-110">
            <FiPlay size={18} className="ms-0.5" />
          </div>
        </div>
        {isViewed && (
          <div className="absolute top-1 start-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
            <FiCheck size={12} className="text-white" />
          </div>
        )}
      </Link>

      <div className="relative flex-1 min-w-0">
        <span className="inline-block text-xs bg-royal-500/10 dark:bg-white/5 border border-royal-500/20 dark:border-white/10 text-royal-500 dark:text-white/60 px-2 py-0.5 rounded-full mb-1">
          {isArabic ? lecture.subjectAr : lecture.subjectEn}
        </span>
        <Link
          to={lectureUrl}
          onClick={() => onWatch(lecture.id, lecture)}
          className="block font-semibold text-ink text-sm hover:text-accent transition-colors truncate"
        >
          {title}
        </Link>
        <span className="text-xs text-slate-500 dark:text-white/50">{lecture.date || '—'}</span>
      </div>

      <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
        <Link
          to={lectureUrl}
          onClick={() => onWatch(lecture.id, lecture)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition"
        >
          <FiPlay size={12} />
          <span className="hidden sm:inline">{isArabic ? 'مشاهدة' : 'Watch'}</span>
        </Link>

        {user && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite(lecture.id, lecture)
              }}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              aria-label={localFavorites.includes(lecture.id) ? t('lectures.unfavorite') : t('lectures.favorite')}
            >
              <FiHeart size={16} className={localFavorites.includes(lecture.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-white/60'} />
            </button>
            <StarRating value={localRatings[lecture.id] || 0} onRate={(star) => onRate(lecture.id, star, lecture)} size={14} />
          </>
        )}
      </div>
    </div>
  )
})