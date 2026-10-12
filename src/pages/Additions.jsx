import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { uid } from '../utils/helpers'
import { isSafeUrl } from '../utils/sanitize'
import { getAdditions, saveAdditions, addComment, deleteComment, getCommentsForAddition, addActivity, addStudentLog } from '../services'
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiSend, FiVideo, FiLink2, FiFileText, FiMessageCircle, FiUsers, FiSearch, FiExternalLink, FiLayers, FiChevronDown, FiCalendar } from 'react-icons/fi'
import toast from 'react-hot-toast'
import PageHero from '../components/shared/PageHero'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import Skeleton from '../components/shared/Skeleton'

const containerVariants = pageContainer
const itemVariants = pageItem

const types = [
 { key: 'post', icon: FiFileText, color: 'bg-gradient-to-br from-royal-500 to-cyan-500' },
 { key: 'whatsapp', icon: FiLink2, color: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
 { key: 'video', icon: FiVideo, color: 'bg-gradient-to-br from-rose-500 to-violet-500' },
]

export default function Additions() {
 const { lang, t } = useLanguage()
 const { user, isAdmin } = useAuth()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'

 const [additions, setAdditions] = useState([])
 const [loading, setLoading] = useState(true)
 const [editing, setEditing] = useState(false)
 const [editData, setEditData] = useState([])
 const [expandedId, setExpandedId] = useState(null)
 const [comments, setComments] = useState({})
 const [commentTexts, setCommentTexts] = useState({})
 const [filter, setFilter] = useState('all')
 const [searchQuery, setSearchQuery] = useState('')
 const [error, setError] = useState(null)
 const [confirmDelete, setConfirmDelete] = useState(null)

 const mountedRef = useRef(true)

 const loadData = async () => {
  try {
   const a = await getAdditions()
   if (!mountedRef.current) return
   setAdditions(a)
   setError(null)
   // Prefetch comment counts for badges, but only for the first 40 items so a
   // long list never triggers an N+1 storm of one query per addition.
   const counts = {}
   await Promise.all(a.slice(0, 40).map(async (item) => {
    try {
     const c = await getCommentsForAddition(item.id)
     if (mountedRef.current) counts[item.id] = c
    } catch (e) { /* silent */ }
   }))
   if (mountedRef.current) setComments(counts)
  } catch (err) {
   if (mountedRef.current) setError(err)
  } finally {
   if (mountedRef.current) setLoading(false)
  }
 }

 useEffect(() => {
  mountedRef.current = true
  loadData()
  return () => { mountedRef.current = false }
 }, [])

 const handleRetry = () => {
  setLoading(true)
  loadData()
 }

 const loadComments = async (additionId) => {
  try {
   const c = await getCommentsForAddition(additionId)
   setComments(prev => ({ ...prev, [additionId]: c }))
  } catch (e) {
   toast.error(t('additions.failedToLoadComments'))
  }
 }

 const stats = useMemo(() => ({
  total: additions.length,
  posts: additions.filter(a => a.type === 'post').length,
  whatsapp: additions.filter(a => a.type === 'whatsapp').length,
  video: additions.filter(a => a.type === 'video').length,
 }), [additions])

 const filteredAdditions = useMemo(() => {
  let list = additions
  if (filter !== 'all') {
   list = list.filter(a => a.type === filter)
  }
  if (searchQuery.trim()) {
   const q = searchQuery.toLowerCase().trim()
   list = list.filter(a =>
    (a.titleAr || '').toLowerCase().includes(q) ||
    (a.titleEn || '').toLowerCase().includes(q) ||
    (a.descriptionAr || '').toLowerCase().includes(q) ||
    (a.descriptionEn || '').toLowerCase().includes(q)
   )
  }
  return list
 }, [additions, filter, searchQuery])

 const startEdit = () => {
  setEditData(JSON.parse(JSON.stringify(additions)))
  setEditing(true)
 }

 const cancelEdit = () => {
  setEditing(false)
  setEditData([])
 }

 const saveEdit = async () => {
  const cleaned = editData.filter(a => (a.titleAr || '').trim() || (a.titleEn || '').trim()).map(a => ({
   ...a,
   id: a.id || uid(),
   createdAt: a.createdAt || new Date().toISOString(),
  }))
  try {
   const saved = await saveAdditions(cleaned)
   setAdditions(saved)
   addActivity('additions', 'UPDATE', `${saved.length} additions`)
   setEditing(false)
   setEditData([])
   toast.success(t('additions.saved'))
  } catch (err) {
   toast.error(t('additions.saveError'))
  }
 }

 const addNew = (type) => {
  const item = {
   id: uid(),
   type,
   titleAr: '',
   titleEn: '',
   descriptionAr: '',
   descriptionEn: '',
   url: '',
   createdAt: new Date().toISOString(),
  }
  setEditData([...editData, item])
 }

 const removeItem = (id) => {
  setEditData(editData.filter(a => a.id !== id))
 }

 const updateItem = (id, field, value) => {
  setEditData(editData.map(a => a.id === id ? { ...a, [field]: value } : a))
 }

 const handleComment = async (additionId) => {
  const text = commentTexts[additionId] || ''
  if (!text.trim()) return
  try {
   await addComment(additionId, user, text.trim())
   setCommentTexts(prev => ({ ...prev, [additionId]: '' }))
   await loadComments(additionId)
   toast.success(t('additions.commentAdded'))
   addStudentLog({
    studentId: user.studentId,
    name: user.name,
    type: 'ADD_COMMENT',
    detail: '',
    ip: '',
    device: navigator.userAgent,
   }).catch(() => {})
  } catch (e) {
   toast.error(t('additions.failedToAddComment'))
  }
 }

 const handleDeleteComment = async (additionId, commentId) => {
  setConfirmDelete({ additionId, commentId })
 }

 const performDeleteComment = async () => {
  if (!confirmDelete) return
  const { additionId, commentId } = confirmDelete
  try {
   await deleteComment(additionId, commentId, user?.studentId, isAdmin)
   await loadComments(additionId)
   toast.success(t('additions.commentDeleted'))
  } catch (e) {
   toast.error(t('additions.failedToDeleteComment'))
  }
  setConfirmDelete(null)
 }

 const toggleExpand = (id) => {
  if (expandedId === id) {
   setExpandedId(null)
  } else {
   setExpandedId(id)
  }
  loadComments(id)
 }

 const displayData = editing ? editData : filteredAdditions

 const inputClass = "w-full glass rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cyan-500/20"

 const typeLabels = {
  post: t('additions.post'),
  whatsapp: t('additions.whatsapp'),
  video: t('additions.video'),
 }

 if (error) {
  return (
   <ErrorState error={error} onRetry={handleRetry} />
  )
 }

 if (loading) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="py-16 mb-12">
     <div className="container-page text-center">
      <Skeleton className="h-10 w-48 mx-auto mb-4 rounded-xl" />
      <Skeleton className="h-5 w-64 mx-auto rounded-lg" />
     </div>
    </div>
    <div className="container-page space-y-4">
     {[1,2,3].map(i => (
      <div key={i} className="glass rounded-xl p-5">
       <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1">
         <Skeleton className="h-4 w-1/4 rounded-full mb-2" />
         <Skeleton className="h-5 w-3/4 rounded-lg mb-2" />
         <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
       </div>
      </div>
     ))}
    </div>
   </div>
  )
 }

 return (<>
  <div className="min-h-screen bg-spatial-page pt-24 pb-16 ">
   <PageHero variant="chips" title={t('additions.title')} subtitle={t('additions.subtitle')} />
   <div className="container-page">
    <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }}>
     
     {/* Stat ribbon */}
     <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
      <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <FiLayers size={18} />
        </div>
        <div>
          <div className="text-xl font-bold text-ink">{stats.total}</div>
          <div className="text-xs text-slate-500 dark:text-white/60">{isArabic ? 'إجمالي الإضافات' : 'Total Resources'}</div>
        </div>
      </div>
      <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <FiLink2 size={18} />
        </div>
        <div>
          <div className="text-xl font-bold text-ink">{stats.whatsapp}</div>
          <div className="text-xs text-slate-500 dark:text-white/60">{isArabic ? 'مجموعات واتساب' : 'WhatsApp Groups'}</div>
        </div>
      </div>
      <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <FiVideo size={18} />
        </div>
        <div>
          <div className="text-xl font-bold text-ink">{stats.video}</div>
          <div className="text-xs text-slate-500 dark:text-white/60">{isArabic ? 'شروحات وفيديوهات' : 'Video Guides'}</div>
        </div>
      </div>
      <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <FiFileText size={18} />
        </div>
        <div>
          <div className="text-xl font-bold text-ink">{stats.posts}</div>
          <div className="text-xs text-slate-500 dark:text-white/60">{isArabic ? 'منشورات وملخصات' : 'Community Posts'}</div>
        </div>
      </div>
     </div>

     {/* Controls & Search Toolbar */}
     <div className="glass rounded-2xl p-4 border border-white/10 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Category Filter Chips */}
      <div className="flex gap-2 flex-wrap items-center">
       <button
        onClick={() => setFilter('all')}
        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${filter === 'all' ? 'btn-spatial shadow-sm' : 'glass text-slate-600 dark:text-white/70 hover:text-ink'}`}
       >
        {t('additions.all')} ({stats.total})
       </button>
       {types.map(type => (
        <button
         key={type.key}
         onClick={() => setFilter(type.key)}
         className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${filter === type.key ? 'btn-spatial shadow-sm' : 'glass text-slate-600 dark:text-white/70 hover:text-ink'}`}
        >
         <type.icon size={14} /> {typeLabels[type.key]} ({stats[type.key] || 0})
        </button>
       ))}
      </div>

      {/* Real-time search + Admin Controls */}
      <div className="flex items-center gap-2.5">
       <div className="relative flex-1 md:w-64">
        <FiSearch size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isArabic ? 'بحث في الإضافات والمجموعات...' : 'Search resources...'}
          className="w-full ps-9 pe-8 py-2 text-xs sm:text-sm rounded-xl glass border border-white/10 text-ink placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-royal-400/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink p-1"
            title={isArabic ? 'مسح البحث' : 'Clear search'}
          >
            <FiX size={14} />
          </button>
        )}
       </div>

       {isAdmin && (
        <div className="flex gap-2 shrink-0">
         {editing ? (
          <>
           <button onClick={saveEdit} className="flex items-center gap-1.5 px-3.5 py-2 btn-spatial rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm">
            <FiSave size={15} /> {t('additions.save')}
           </button>
           <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3.5 py-2 glass text-slate-600 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition">
            <FiX size={15} /> {t('additions.cancel')}
           </button>
          </>
         ) : (
          <button onClick={startEdit} className="flex items-center gap-1.5 px-3.5 py-2 btn-spatial rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm">
           <FiEdit2 size={15} /> {t('additions.edit')}
          </button>
         )}
        </div>
       )}
      </div>
     </div>

     {!error && displayData.length === 0 && !editing && (
      <EmptyState
       icon={FiUsers}
       color="violet"
       title={searchQuery ? (isArabic ? 'لم يتم العثور على نتائج للبحث' : 'No matching resources found') : t('additions.noAdditionsYet')}
       description={searchQuery ? (isArabic ? 'جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر.' : 'Try different keywords or select another filter.') : t('additions.subtitle')}
       action={
        searchQuery ? (
          <button onClick={() => setSearchQuery('')} className="inline-flex items-center gap-2 px-5 py-2.5 btn-spatial rounded-xl text-xs sm:text-sm font-semibold transition">
            <FiX size={15} /> {isArabic ? 'إلغاء البحث' : 'Clear Filter'}
          </button>
        ) : (isAdmin ? (
         <button onClick={startEdit} className="inline-flex items-center gap-2 px-6 py-3 btn-spatial rounded-xl font-medium transition">
          <FiEdit2 size={16} /> {t('additions.edit')}
         </button>
        ) : null)
       }
       className="max-w-md mx-auto my-12"
      />
     )}

     {editing && (
      <div className="mb-6 flex gap-2 flex-wrap">
       {types.map(type => (
        <button
          key={type.key}
          onClick={() => addNew(type.key)}
          className={`flex items-center gap-2 px-4 py-2 ${type.color} text-white rounded-xl text-sm font-medium hover:opacity-90 transition`}
         >
          <FiPlus size={16} /> {t('additions.addPrefix')} {typeLabels[type.key]}
         </button>
       ))}
      </div>
     )}

      <motion.div className="space-y-4" variants={prefersReduced ? { hidden: {}, visible: {} } : containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible">
       {displayData.map((item) => (
        <motion.div key={item.id} variants={itemVariants} layout className="glass lift overflow-hidden rounded-2xl border border-white/10 hover:border-royal-500/30 transition-all shadow-sm">
        {editing ? (
         <div className="p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
           <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${types.find(t => t.key === item.type)?.color || 'bg-slate-500'}`}>
            {typeLabels[item.type]}
           </span>
           <button onClick={() => removeItem(item.id)} aria-label={t('inline.additions.delete')} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
            <FiTrash2 size={14} />
           </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
           <input value={item.titleAr} onChange={e => updateItem(item.id, 'titleAr', e.target.value)} placeholder="العنوان بالعربي" aria-label="العنوان بالعربي" className={inputClass} />
           <input value={item.titleEn} onChange={e => updateItem(item.id, 'titleEn', e.target.value)} placeholder="Title (EN)" aria-label="Title (EN)" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
           <textarea value={item.descriptionAr} onChange={e => updateItem(item.id, 'descriptionAr', e.target.value)} placeholder="الوصف بالعربي" aria-label="الوصف بالعربي" className={inputClass + ' h-20 resize-none'} />
           <textarea value={item.descriptionEn} onChange={e => updateItem(item.id, 'descriptionEn', e.target.value)} placeholder="Description (EN)" aria-label="Description (EN)" className={inputClass + ' h-20 resize-none'} />
          </div>
          <input value={item.url} onChange={e => updateItem(item.id, 'url', e.target.value)} placeholder={item.type === 'whatsapp' ? t('additions.whatsappPlaceholder') : item.type === 'video' ? t('additions.youtubePlaceholder') : t('additions.urlOptionalPlaceholder')} aria-label={item.type === 'whatsapp' ? t('additions.whatsappPlaceholder') : item.type === 'video' ? t('additions.youtubePlaceholder') : t('additions.urlOptionalPlaceholder')} className={inputClass} />
         </div>
        ) : (() => {
          const title = (isArabic ? item.titleAr : item.titleEn) || item.titleAr || item.titleEn || (isArabic ? 'إضافة بدون عنوان' : 'Untitled Resource')
          const rawDesc = (isArabic ? item.descriptionAr : item.descriptionEn) || item.descriptionAr || item.descriptionEn || ''
          const description = (rawDesc.trim() === '--' || rawDesc.trim() === '-') ? '' : rawDesc.trim()
          const subject = (isArabic ? item.subjectAr : item.subjectEn) || item.subjectAr || item.subjectEn || ''
          const typeCfg = types.find(t => t.key === item.type) || types[0]
          const isExpanded = expandedId === item.id
          const itemComments = comments[item.id] || []

          return (
            <>
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  {/* Category Type Icon */}
                  <div className={`p-3.5 rounded-2xl ${typeCfg.color} text-white shrink-0 shadow-md`}>
                    <typeCfg.icon size={22} />
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0">
                    {/* Top Metadata Ribbon */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs ${typeCfg.color}`}>
                        {typeLabels[item.type] || item.type}
                      </span>
                      {subject && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-royal-500/10 text-royal-600 dark:text-cyan-400 border border-royal-500/20">
                          {subject}
                        </span>
                      )}
                      {item.createdAt && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <FiCalendar size={12} className="opacity-70" />
                          <span>{new Date(item.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                        </span>
                      )}
                    </div>

                    {/* Title with dir="auto" */}
                    <h3 dir="auto" className="text-base sm:text-lg font-bold text-ink mb-2 leading-snug">
                      {title}
                    </h3>

                    {/* Description with dir="auto" */}
                    {description && (
                      <p dir="auto" className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                        {description}
                      </p>
                    )}

                    {/* Footer Actions: Resource Links + Comments Trigger */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                      {item.url && isSafeUrl(item.url) ? (
                        <div>
                          {item.type === 'whatsapp' ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02]"
                            >
                              <FiLink2 size={14} />
                              <span>{isArabic ? 'الانضمام لمجموعة واتساب' : 'Join WhatsApp Group'}</span>
                              <FiExternalLink size={12} className="opacity-80" />
                            </a>
                          ) : item.type === 'video' ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 hover:scale-[1.02]"
                            >
                              <FiVideo size={14} />
                              <span>{isArabic ? 'مشاهدة الفيديو / الشرح' : 'Watch Video Guide'}</span>
                              <FiExternalLink size={12} className="opacity-80" />
                            </a>
                          ) : (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-royal-600 to-cyan-600 hover:from-royal-700 hover:to-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-royal-600/20 hover:scale-[1.02]"
                            >
                              <FiExternalLink size={14} />
                              <span>{isArabic ? 'زيارة الرابط / المورد التعليمي' : 'Open Resource Link'}</span>
                            </a>
                          )}
                        </div>
                      ) : <div />}

                      {/* Dedicated Comments Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isExpanded
                            ? 'bg-royal-600 text-white shadow-sm'
                            : 'bg-slate-100/90 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10'
                        }`}
                        aria-expanded={isExpanded}
                        aria-label={isArabic ? 'عرض التعليقات' : 'Toggle comments'}
                      >
                        <FiMessageCircle size={14} />
                        <span>{itemComments.length}</span>
                        <span className="hidden sm:inline">{isArabic ? 'تعليقات' : 'Comments'}</span>
                        <FiChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Comments Drawer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={prefersReduced ? {} : { opacity: 0, height: 0 }}
                    animate={prefersReduced ? {} : { opacity: 1, height: 'auto' }}
                    exit={prefersReduced ? {} : { opacity: 0, height: 0 }}
                    transition={prefersReduced ? {} : { duration: 0.25 }}
                    className="border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Drawer Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-ink">
                          <FiMessageCircle size={15} className="text-royal-500 dark:text-cyan-400" />
                          <span>{isArabic ? 'التعليقات والمناقشات' : 'Comments & Discussion'}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                            {itemComments.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-200/50 dark:hover:bg-white/10 transition"
                          title={isArabic ? 'إغلاق التعليقات' : 'Close comments'}
                        >
                          <FiX size={15} />
                        </button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pe-1">
                        {itemComments.length === 0 ? (
                          <div className="py-6 text-center">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-white/40 mx-auto mb-2">
                              <FiMessageCircle size={18} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-white/60">
                              {isArabic ? 'لا توجد تعليقات بعد، كن أول من يشارك برأيه!' : 'No comments yet. Be the first to join the conversation!'}
                            </p>
                          </div>
                        ) : (
                          itemComments.map(c => (
                            <div key={c.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 shadow-xs">
                              <div className="w-7 h-7 bg-gradient-to-br from-royal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                                {c.userName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-ink">{c.userName}</span>
                                  <span className="text-[11px] text-slate-400 dark:text-white/40">
                                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US') : ''}
                                  </span>
                                </div>
                                <p dir="auto" className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                                  {c.text}
                                </p>
                              </div>
                              {(c.isMine || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(item.id, c.id)}
                                  aria-label={t('inline.additions.delete-comment')}
                                  className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                                  title={isArabic ? 'حذف التعليق' : 'Delete comment'}
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input or Sign-In Prompt */}
                      {user ? (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={commentTexts[item.id] || ''}
                            onChange={e => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleComment(item.id)}
                            placeholder={isArabic ? 'اكتب تعليقك أو استفسارك هنا...' : 'Write your comment or question...'}
                            className="flex-1 glass rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-royal-500/30 placeholder:text-slate-400 dark:placeholder:text-white/40"
                            aria-label={t('additions.addCommentLabel')}
                          />
                          <button
                            type="button"
                            onClick={() => handleComment(item.id)}
                            disabled={!(commentTexts[item.id] || '').trim()}
                            className="px-4 py-2.5 bg-gradient-to-r from-royal-600 to-cyan-600 hover:from-royal-700 hover:to-cyan-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
                            aria-label={t('additions.submitCommentLabel')}
                          >
                            <FiSend size={14} />
                            <span className="hidden sm:inline">{isArabic ? 'إرسال' : 'Send'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-royal-500/10 border border-royal-500/20 text-xs">
                          <span className="text-royal-700 dark:text-cyan-300">
                            {isArabic ? 'سجل الدخول لتتمكن من إضافة تعليق والتفاعل مع الإضافة' : 'Sign in to leave a comment on this addition'}
                          </span>
                          <Link to="/login" className="font-bold underline text-royal-700 dark:text-cyan-200 ms-2 whitespace-nowrap">
                            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )
        })()}
       </motion.div>
       ))}
      </motion.div>
     </motion.div>
    </div>
   </div>

   <ConfirmDialog
    isOpen={!!confirmDelete}
    onClose={() => setConfirmDelete(null)}
    onConfirm={performDeleteComment}
    title={t('inline.additions.delete-comment')}
    message={t('inline.additions.are-you-sure-you')}
   />
  </>
 )
}