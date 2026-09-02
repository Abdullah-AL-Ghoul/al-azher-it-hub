import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getAdditions } from '../services'
import { modalOverlay, modalContent } from '../utils/motionTokens'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { FiSearch, FiFileText, FiGrid, FiHeart, FiArrowRight, FiX } from 'react-icons/fi'
import LectureThumbnail from './shared/LectureThumbnail'
import { lectureVideoId } from '../utils/helpers'

const navPages = [
 { to: '/home', keys: ['home', 'الرئيسية'] },
 { to: '/lectures', keys: ['lectures', 'محاضرات'] },
 { to: '/sources', keys: ['sources', 'مصادر'] },
 { to: '/study-plan', keys: ['study plan', 'خطة دراسية', 'الخطة الدراسية'] },
 { to: '/roadmap', keys: ['roadmap', 'مسار', 'المسار الدراسي'] },
 { to: '/additions', keys: ['additions', 'إضافات'] },
 { to: '/contact', keys: ['contact', 'تواصل'] },
 { to: '/profile', keys: ['profile', 'ملفي', 'الملف الشخصي'] },
]

const typeIcons = {
 lecture: FiFileText,
 source: FiGrid,
 addition: FiHeart,
 page: FiArrowRight,
}

const typeColors = {
 lecture: 'from-violet-500 to-violet-600',
 source: 'from-amber-500 to-amber-600',
 addition: 'from-emerald-500 to-emerald-600',
 page: 'from-cyan-500 to-cyan-600',
}

export default function GlobalSearch({ autoOpen = false }) {
 const { lang, t } = useLanguage()
 const { user } = useAuth()
 const navigate = useNavigate()
 const isArabic = lang === 'ar'

  const [open, setOpen] = useState(autoOpen && !!user)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const allItems = useRef([])
  const searchSeq = useRef(0)
  const datasetRef = useRef(null)
  const panelRef = useFocusTrap(open)

  const openModal = useCallback(() => {
   if (!user) return
   setOpen(true)
   setQuery('')
   setResults([])
   setActiveIndex(0)
   setLoading(false)
   datasetRef.current = null
  }, [user])

  const closeModal = useCallback(() => {
   setOpen(false)
   setQuery('')
   setResults([])
   setActiveIndex(0)
   setLoading(false)
   searchSeq.current += 1
   datasetRef.current = null
  }, [])

  useEffect(() => {
   const handler = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
     e.preventDefault()
     if (open) closeModal()
     else openModal()
    }
   }
   window.addEventListener('keydown', handler)
   return () => window.removeEventListener('keydown', handler)
  }, [open, openModal, closeModal])

  useEffect(() => {
   if (!open) return
   setTimeout(() => inputRef.current?.focus(), 100)
   const prev = document.body.style.overflow
   document.body.style.overflow = 'hidden'
   const onKey = (e) => {
    if (e.key === 'Escape') closeModal()
   }
   document.addEventListener('keydown', onKey)
   return () => {
    document.body.style.overflow = prev
    document.removeEventListener('keydown', onKey)
   }
  }, [open, closeModal])

  const performSearch = useCallback(async (q) => {
   const seq = ++searchSeq.current
   if (!q.trim()) { setResults([]); setActiveIndex(0); setLoading(false); return }
   setLoading(true)
   try {
    const lower = q.toLowerCase()
    let { lectures, sources, additions } = datasetRef.current || {}
    if (!lectures) {
     ;[lectures, sources, additions] = await Promise.all([
      getLectures().catch(() => []),
      getSources().catch(() => []),
      getAdditions().catch(() => []),
     ])
     if (seq !== searchSeq.current) return
     datasetRef.current = { lectures, sources, additions }
    }

    const items = []

    lectures.forEach(l => {
     const title = isArabic ? l.titleAr : l.titleEn
     const subject = isArabic ? l.subjectAr : l.subjectEn
     if (title?.toLowerCase().includes(lower) || subject?.toLowerCase().includes(lower)) {
      items.push({ type: 'lecture', title: title || '', subtitle: subject || '', id: l.id, videoId: lectureVideoId(l) })
     }
    })

    sources.forEach(s => {
     const title = isArabic ? s.titleAr : s.titleEn
     const subject = isArabic ? s.subjectAr : s.subjectEn
     if (title?.toLowerCase().includes(lower) || subject?.toLowerCase().includes(lower)) {
      items.push({ type: 'source', title: title || '', subtitle: subject || '', id: s.id })
     }
    })

    additions.forEach(a => {
     const title = isArabic ? a.titleAr : a.titleEn
     if (title?.toLowerCase().includes(lower)) {
      items.push({ type: 'addition', title: title || '', subtitle: '', id: a.id })
     }
    })

    navPages.forEach(p => {
     if (p.keys.some(k => k.toLowerCase().includes(lower))) {
      items.push({ type: 'page', title: isArabic ? (p.keys[1] || p.keys[0]) : p.keys[0], subtitle: '', to: p.to })
     }
    })

    if (seq !== searchSeq.current) return
    allItems.current = items
    setResults(items.slice(0, 12))
    setActiveIndex(0)
   } catch {
    if (seq === searchSeq.current) setResults([])
   }
   if (seq === searchSeq.current) setLoading(false)
  }, [isArabic])

 useEffect(() => {
  const timer = setTimeout(() => performSearch(query), 200)
  return () => clearTimeout(timer)
 }, [query, performSearch])

  const handleSelect = useCallback((item) => {
   if (item.type === 'page') {
    navigate(item.to)
   } else if (item.type === 'lecture') {
    // Navigate to the actual lecture detail page, not the generic list.
    navigate(item.id ? `/lecture/${item.id}` : '/lectures')
   } else if (item.type === 'source') {
    navigate('/sources')
   } else if (item.type === 'addition') {
    navigate('/additions')
   }
   closeModal()
  }, [navigate, closeModal])

  const handleKeyDown = (e) => {
   if (e.key === 'ArrowDown') {
    e.preventDefault()
    setActiveIndex(i => Math.min(i + 1, results.length - 1))
   } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    setActiveIndex(i => Math.max(i - 1, 0))
   } else if (e.key === 'Enter' && results[activeIndex]) {
    e.preventDefault()
    handleSelect(results[activeIndex])
   }
  }

 const scrollToItem = (index) => {
  const el = listRef.current?.children?.[index]
  el?.scrollIntoView({ block: 'nearest' })
 }

 useEffect(() => { scrollToItem(activeIndex) }, [activeIndex])

 if (!user) return null

 return (
  <>
   <button
    onClick={openModal}
    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-white/60 hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 transition"
    title={t('inline.global-search.search-ctrl-k')}
    aria-label={t('inline.global-search.global-search')}
   >
    <FiSearch size={18} />
   </button>

   <AnimatePresence>
    {open && (
     <motion.div
      {...modalOverlay}
      className="fixed inset-0 z-[200] bg-black/50 dark:bg-black/70 flex items-start justify-center pt-[10vh] p-4"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-label={t('inline.global-search.global-search')}
     >
      <motion.div
       {...modalContent}
       ref={panelRef}
       className="modal-spatial rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
       onClick={e => e.stopPropagation()}
      >
       <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10">
        <FiSearch size={18} className="text-slate-400 dark:text-white/40 shrink-0" />
        <input
         ref={inputRef}
         value={query}
         onChange={e => setQuery(e.target.value)}
         onKeyDown={handleKeyDown}
         placeholder={t('inline.global-search.search-lectures-sources-pages')}
         className="flex-1 bg-transparent text-ink placeholder-slate-400 dark:placeholder-white/40 text-sm outline-none"
         autoComplete="off"
         role="combobox"
         aria-expanded="true"
         aria-controls="global-search-results"
         aria-autocomplete="list"
         aria-label={t('inline.global-search.global-search')}
        />
        <button onClick={closeModal} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label={t('common.close')}>
         <FiX size={16} className="text-slate-400 dark:text-white/40" />
        </button>
       </div>

       <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain">
        {loading && query.trim() && (
         <div className="py-10 text-center text-sm text-slate-400 dark:text-white/40">
          {t('inline.global-search.searching')}
         </div>
        )}

        {!loading && query.trim() && results.length === 0 && (
         <div className="py-10 text-center">
          <FiSearch size={32} className="mx-auto mb-3 text-slate-300 dark:text-white/20" />
          <p className="text-sm text-slate-400 dark:text-white/40">
           {t('inline.global-search.no-results-found')}
          </p>
         </div>
        )}

        {!loading && !query.trim() && (
         <div className="py-10 text-center">
          <FiSearch size={32} className="mx-auto mb-3 text-slate-300 dark:text-white/20" />
          <p className="text-sm text-slate-400 dark:text-white/40">
           {t('inline.global-search.start-typing-to-search')}
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-400 dark:text-white/30">
           <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded text-[10px] font-mono">Ctrl+K</kbd>
           <span>{t('inline.global-search.to-open')}</span>
          </div>
         </div>
        )}

        {results.length > 0 && (
         <div id="global-search-results" role="listbox" aria-label={t('inline.global-search.search-results')} className="py-2">
          {results.map((item, i) => {
           const Icon = typeIcons[item.type]
           return (
            <button
             key={`${item.type}-${item.id || item.to}-${i}`}
             onClick={() => handleSelect(item)}
             onMouseEnter={() => setActiveIndex(i)}
             className={`w-full flex items-center gap-3 px-4 py-3 text-start transition-colors ${
              i === activeIndex
               ? 'bg-royal-500/10 dark:bg-cyan-500/10'
               : 'hover:bg-black/5 dark:hover:bg-white/5'
             }`}
             role="option"
             aria-selected={i === activeIndex}
            >
             {item.type === 'lecture' && item.videoId ? (
              <div className="relative w-14 h-8 rounded-lg overflow-hidden bg-black/30 shrink-0">
               <LectureThumbnail videoId={item.videoId} alt="" width={56} height={32} />
              </div>
             ) : (
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[item.type]} flex items-center justify-center text-white shrink-0`}>
               <Icon size={14} />
              </div>
             )}
             <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{item.title}</p>
              {item.subtitle && (
               <p className="text-xs text-slate-400 dark:text-white/40 truncate">{item.subtitle}</p>
              )}
             </div>
             <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-white/30 font-medium shrink-0">
              {item.type === 'lecture' ? (t('inline.global-search.lecture')) : item.type === 'source' ? (t('inline.global-search.source')) : item.type === 'addition' ? (t('inline.global-search.addition')) : (t('inline.global-search.page'))}
             </span>
            </button>
           )
          })}
         </div>
        )}
       </div>

       <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-500 dark:text-white/50">
        <div className="flex items-center gap-2">
         <span><kbd className="px-1 py-0.5 bg-black/5 dark:bg-white/5 rounded font-mono">↑↓</kbd> {t('inline.global-search.navigate')}</span>
         <span><kbd className="px-1 py-0.5 bg-black/5 dark:bg-white/5 rounded font-mono">↵</kbd> {t('inline.global-search.select')}</span>
         <span><kbd className="px-1 py-0.5 bg-black/5 dark:bg-white/5 rounded font-mono">esc</kbd> {t('inline.global-search.close')}</span>
        </div>
        {results.length > 0 && (
         <span>{results.length} {t('inline.global-search.results')}</span>
        )}
       </div>
      </motion.div>
     </motion.div>
    )}
   </AnimatePresence>
  </>
 )
}
