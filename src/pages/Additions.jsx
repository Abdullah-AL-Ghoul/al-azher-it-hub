import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { getAdditions, saveAdditions, addComment, deleteComment, getCommentsForAddition, addActivity, addStudentLog } from '../services'
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiSend, FiVideo, FiLink2, FiFileText, FiMessageCircle, FiUsers, FiChevronDown } from 'react-icons/fi'
import toast from 'react-hot-toast'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'

const containerVariants = pageContainer
const itemVariants = pageItem

const types = [
 { key: 'post', icon: FiFileText, color: 'bg-blue-500' },
 { key: 'whatsapp', icon: FiLink2, color: 'bg-emerald-500' },
 { key: 'video', icon: FiVideo, color: 'bg-rose-500' },
]

export default function Additions() {
 const { lang, t } = useLanguage()
 const { user, isAdmin } = useAuth()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'

 useEffect(() => {
  document.title = t('additions.documentTitle')
 }, [t])
 const [additions, setAdditions] = useState([])
 const [loading, setLoading] = useState(true)
 const [editing, setEditing] = useState(false)
 const [editData, setEditData] = useState([])
 const [expandedId, setExpandedId] = useState(null)
 const [comments, setComments] = useState({})
 const [commentTexts, setCommentTexts] = useState({})
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

 const loadData = async () => {
  try {
   const a = await getAdditions()
   setAdditions(a)
   setError(null)
   // Load comment counts for all additions
   const counts = {}
   await Promise.all(a.map(async (item) => {
    try {
     const c = await getCommentsForAddition(item.id)
     counts[item.id] = c
    } catch (e) { /* silent */ }
   }))
   setComments(counts)
  } catch (err) {
   setError(err)
  } finally {
   setLoading(false)
  }
 }

 useEffect(() => {
  loadData()
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

 const filteredAdditions = useMemo(() => {
  if (filter === 'all') return additions
  return additions.filter(a => a.type === filter)
 }, [additions, filter])

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
   id: a.id || Date.now().toString() + Math.random().toString(36).slice(2, 6),
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
   id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
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
    detail: `تعليق على إضافة`,
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
   loadComments(id)
  }
 }

 const displayData = editing ? editData : filteredAdditions

 const inputClass = "w-full glass rounded-xl px-3 py-2 text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"

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
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="skeleton h-10 w-48 mx-auto mb-4 rounded-xl" />
      <div className="skeleton h-5 w-64 mx-auto rounded-lg" />
     </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
     {[1,2,3].map(i => (
      <div key={i} className="glass rounded-xl p-5">
       <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1">
         <div className="skeleton h-4 w-1/4 rounded-full mb-2" />
         <div className="skeleton h-5 w-3/4 rounded-lg mb-2" />
         <div className="skeleton h-3 w-1/2 rounded-full" />
        </div>
       </div>
      </div>
     ))}
    </div>
   </div>
  )
 }

  return (
   <div className="min-h-screen bg-spatial-page pt-24 pb-16 grain">
   <div className="py-16 mb-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
     <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{t('additions.title')}</h1>
     <p className="text-slate-500 dark:text-white/50 text-lg">{t('additions.subtitle')}</p>
    </div>
   </div>
   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div initial={prefersReduced ? {} : { opacity: 0, y: 20 }} animate={prefersReduced ? {} : { opacity: 1, y: 0 }}>
     <div className="flex items-center justify-between mb-8">
      {isAdmin && (
       <div className="flex gap-2">
        {editing ? (
         <>
          <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium transition">
           <FiSave size={16} /> {t('additions.save')}
          </button>
          <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
           <FiX size={16} /> {t('additions.cancel')}
          </button>
         </>
        ) : (
         <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium transition">
          <FiEdit2 size={16} /> {t('additions.edit')}
         </button>
        )}
       </div>
      )}
     </div>

     <div className="flex gap-2 mb-6 flex-wrap">
      <button
       onClick={() => setFilter('all')}
       className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'all' ? 'btn-spatial text-white' : 'glass text-slate-600 dark:text-white/70 hover:text-navy-900 dark:hover:text-white'}`}
      >
       {t('additions.all')}
      </button>
      {types.map(type => (
       <button
        key={type.key}
        onClick={() => setFilter(type.key)}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${filter === type.key ? 'btn-spatial text-white' : 'glass text-slate-600 dark:text-white/70 hover:text-navy-900 dark:hover:text-white'}`}
       >
        <type.icon size={14} /> {typeLabels[type.key]}
       </button>
      ))}
     </div>

     {error && !editing && additions.length === 0 && (
      <ErrorState error={error} onRetry={handleRetry} title={t('additions.failedToLoad')} />
     )}

      {!error && displayData.length === 0 && !editing && (
       <EmptyState
        icon={FiUsers}
        color="violet"
        title={t('additions.noAdditionsYet')}
        description={t('additions.subtitle')}
        action={isAdmin ? (
         <button onClick={startEdit} className="inline-flex items-center gap-2 px-6 py-3 btn-spatial text-white rounded-xl font-medium transition">
          <FiEdit2 size={16} /> {t('additions.edit')}
         </button>
        ) : null}
        className="max-w-md mx-auto"
       />
      )}

     {editing && (
      <div className="mb-6 flex gap-2 flex-wrap">
       {types.map(type => {
        const Icon = type.icon
        return (
         <button
          key={type.key}
          onClick={() => addNew(type.key)}
          className={`flex items-center gap-2 px-4 py-2 ${type.color} text-white rounded-xl text-sm font-medium hover:opacity-90 transition`}
         >
          <FiPlus size={16} /> {t('additions.addPrefix')} {typeLabels[type.key]}
         </button>
        )
       })}
      </div>
     )}

      <motion.div className="space-y-4" variants={prefersReduced ? { hidden: {}, visible: {} } : containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible">
       {displayData.map((item) => (
        <motion.div key={item.id} variants={itemVariants} layout className="glass lift overflow-hidden rounded-xl border border-white/10 hover:border-royal-500/30 transition-colors">
        {editing ? (
         <div className="p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
           <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${types.find(t => t.key === item.type)?.color || 'bg-slate-500'}`}>
            {typeLabels[item.type]}
           </span>
           <button onClick={() => removeItem(item.id)} aria-label={isArabic ? 'حذف' : 'Delete'} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
            <FiTrash2 size={14} />
           </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
           <input value={item.titleAr} onChange={e => updateItem(item.id, 'titleAr', e.target.value)} placeholder="العنوان بالعربي" className={inputClass} />
           <input value={item.titleEn} onChange={e => updateItem(item.id, 'titleEn', e.target.value)} placeholder="Title (EN)" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
           <textarea value={item.descriptionAr} onChange={e => updateItem(item.id, 'descriptionAr', e.target.value)} placeholder="الوصف بالعربي" className={inputClass + ' h-20 resize-none'} />
           <textarea value={item.descriptionEn} onChange={e => updateItem(item.id, 'descriptionEn', e.target.value)} placeholder="Description (EN)" className={inputClass + ' h-20 resize-none'} />
          </div>
          <input value={item.url} onChange={e => updateItem(item.id, 'url', e.target.value)}           placeholder={item.type === 'whatsapp' ? t('additions.whatsappPlaceholder') : item.type === 'video' ? t('additions.youtubePlaceholder') : t('additions.urlOptionalPlaceholder')} className={inputClass} />
         </div>
        ) : (
         <>
          <div className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors" onClick={() => toggleExpand(item.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(item.id) } }}>
           <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${types.find(t => t.key === item.type)?.color || 'bg-slate-500'} text-white shrink-0`}>
             {(() => { const Ic = types.find(t => t.key === item.type)?.icon; return Ic ? <Ic size={20} /> : null })()}
            </div>
            <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${types.find(t => t.key === item.type)?.color || 'bg-slate-500'}`}>
               {typeLabels[item.type]}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
             </div>
             <h3 className={`font-semibold text-navy-900 dark:text-white mb-1 ${expandedId !== item.id ? 'line-clamp-1' : ''}`}>{isArabic ? item.titleAr : item.titleEn}</h3>
             {(item.descriptionAr || item.descriptionEn) && (
              <p className={`text-sm text-slate-500 dark:text-slate-400 ${expandedId !== item.id ? 'line-clamp-2' : 'whitespace-pre-wrap'}`}>{isArabic ? item.descriptionAr : item.descriptionEn}</p>
             )}
             {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-royal-500 hover:text-royal-600 mt-1 inline-flex items-center gap-1">
               <FiLink2 size={12} /> {t('additions.openLink')}
              </a>
             )}
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
             <FiMessageCircle size={16} />
             <span className="text-xs">{(comments[item.id] || []).length}</span>
            </div>
           </div>
          </div>

          <AnimatePresence>
           {expandedId === item.id && (
            <motion.div
             initial={prefersReduced ? {} : { opacity: 0, y: -10 }}
             animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={prefersReduced ? {} : { duration: 0.2 }}
             className="border-t border-slate-100 dark:border-slate-700"
            >
             <div className="p-5">
              <h4 className="text-sm font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-2">
               <FiMessageCircle size={14} />
               {t('additions.comments')}
               <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">({(comments[item.id] || []).length})</span>
              </h4>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
               {(comments[item.id] || []).length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                 {t('additions.noCommentsYet')}
                </p>
               )}
               {(comments[item.id] || []).map(c => (
                <div key={c.id} className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-navy-700/50 rounded-lg">
                 <div className="w-7 h-7 bg-royal-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {c.userName?.charAt(0)?.toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                   <span className="text-xs font-semibold text-navy-900 dark:text-white">{c.userName}</span>
                   <span className="text-xs text-slate-500 dark:text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{c.text}</p>
                 </div>
                  {(user?.studentId === c.userId || isAdmin) && (
                  <button onClick={() => handleDeleteComment(item.id, c.id)} aria-label={isArabic ? 'حذف التعليق' : 'Delete comment'} className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-400 hover:text-red-500 transition-colors shrink-0">
                   <FiTrash2 size={12} />
                  </button>
                 )}
                </div>
               ))}
              </div>

               {user && (
                <div className="flex gap-2">
                 <input
                  value={commentTexts[item.id] || ''}
                  onChange={e => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleComment(item.id)}
                  placeholder={t('additions.writeComment')}
                  className={inputClass + ' flex-1'}
                  aria-label={t('additions.addCommentLabel')}
                 />
                 <button
                  onClick={() => handleComment(item.id)}
                  disabled={!(commentTexts[item.id] || '').trim()}
                  className="px-4 py-2 bg-royal-500 hover:bg-royal-600 disabled:opacity-40 text-white rounded-lg transition"
                  aria-label={t('additions.submitCommentLabel')}
                 >
                  <FiSend size={16} />
                 </button>
                </div>
               )}
             </div>
            </motion.div>
           )}
          </AnimatePresence>
         </>
        )}
       </motion.div>
       ))}
      </motion.div>
     </motion.div>
    </div>
   </div>
  )
}
