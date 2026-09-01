import { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getStudyPlan, saveStudyPlan } from '../services'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { uid } from '../utils/helpers'
import { FiExternalLink, FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiBookOpen } from 'react-icons/fi'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import toast from 'react-hot-toast'
import PageHero from '../components/shared/PageHero'
import Skeleton from '../components/shared/Skeleton'

const containerVariants = pageContainer
const itemVariants = pageItem

export default function StudyPlan() {
 const { lang, t } = useLanguage()
 const { isAdmin } = useAuth()
 const isArabic = lang === 'ar'
 const canEdit = isAdmin

  const [links, setLinks] = useState([])
 const [confirmDeleteId, setConfirmDeleteId] = useState(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [editing, setEditing] = useState(false)
 const [editData, setEditData] = useState([])
 const prefersReduced = useReducedMotion()

 const mountedRef = useRef(true)

 const loadPlan = async () => {
  setLoading(true)
  try {
   const data = await getStudyPlan()
   if (!mountedRef.current) return
   setLinks(data.links || [])
   setError(null)
  } catch (err) {
   if (mountedRef.current) setError(err)
  } finally {
   if (mountedRef.current) setLoading(false)
  }
 }

 useEffect(() => {
  mountedRef.current = true
  loadPlan()
  return () => { mountedRef.current = false }
 }, [])

 const handleRetry = () => {
  setError(null)
  loadPlan()
 }

 const startEdit = () => {
  setEditData(JSON.parse(JSON.stringify(links)))
  setEditing(true)
 }

 const startEditWithNew = () => {
  setEditData([...JSON.parse(JSON.stringify(links)), {
   id: uid(),
   titleAr: '',
   titleEn: '',
   url: '',
  }])
  setEditing(true)
 }

 const cancelEdit = () => {
  setEditing(false)
  setEditData([])
 }

 const saveEdit = async () => {
  const cleaned = editData.filter(l => (l.titleAr || '').trim() || (l.titleEn || '').trim()).map(l => ({
   ...l,
   id: l.id || uid(),
  }))
  try {
   await saveStudyPlan({ links: cleaned })
   setLinks(cleaned)
   setEditing(false)
   setEditData([])
   toast.success(t('studyPlan.saved'))
  } catch (e) {
   toast.error(t('studyPlan.saveError'))
  }
 }

 const addNew = () => {
  setEditData([...editData, {
   id: uid(),
   titleAr: '',
   titleEn: '',
   url: '',
  }])
 }

 const removeItem = (id) => {
  setEditData(editData.filter(l => l.id !== id))
 }

 const persistDelete = async (id) => {
  const newLinks = links.filter(l => l.id !== id)
  try {
   await saveStudyPlan({ links: newLinks })
   setLinks(newLinks)
   toast.success(t('studyPlan.saved'))
  } catch (e) {
   toast.error(t('studyPlan.saveError'))
  }
 }

 const updateItem = (id, field, value) => {
  setEditData(editData.map(l => l.id === id ? { ...l, [field]: value } : l))
 }

 const displayData = editing ? editData : links

 const inputClass = "w-full glass rounded-xl px-3 py-3 min-h-[44px] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-cyan-500/20"

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
     {[1,2,3].map(i => (
      <div key={i} className="glass rounded-xl p-5">
       <Skeleton className="h-5 w-2/3 rounded-lg mb-2" />
       <Skeleton className="h-3 w-1/4 rounded-full" />
      </div>
     ))}
    </div>
   </div>
  )
 }

 return (
  <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page ">
   <PageHero variant="path" title={t('studyPlan.title')} subtitle={t('studyPlan.subtitle')} />

   <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    {canEdit && (
     <div className="flex justify-end gap-2 mb-6">
      {editing ? (
       <>
        <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
         <FiSave size={16} /> {t('common.save')}
        </button>
        <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 min-h-[44px] glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
         <FiX size={16} /> {t('common.cancel')}
        </button>
       </>
      ) : (
       <>
        <button onClick={startEditWithNew} className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition">
         <FiPlus size={16} /> {t('studyPlan.addLink')}
        </button>
        <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
         <FiEdit2 size={16} /> {t('common.edit')}
        </button>
       </>
      )}
     </div>
    )}

    {editing && (
     <div className="mb-6">
      <button onClick={addNew} className="flex items-center gap-2 px-4 py-2 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
       <FiPlus size={16} /> {t('studyPlan.addLink')}
      </button>
     </div>
    )}

    {displayData.length === 0 && !editing && (
     <EmptyState
      icon={FiBookOpen}
      color="blue"
      title={t('studyPlan.noLinks')}
      description={t('studyPlan.noLinksDesc')}
      action={canEdit ? (
       <button onClick={startEditWithNew} className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] btn-spatial rounded-xl text-sm font-medium transition">
        <FiPlus size={16} /> {t('studyPlan.addLink')}
       </button>
      ) : null}
      className="max-w-md mx-auto"
     />
    )}

    {editing ? (
     <div className="space-y-3">
      {editData.map(item => (
       <div key={item.id} className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
         <span className="text-xs text-slate-500 dark:text-slate-400">{t('studyPlan.newLink')}</span>
         <button onClick={() => removeItem(item.id)} aria-label={isArabic ? 'حذف' : 'Delete'} className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
          <FiTrash2 size={14} />
         </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
         <div>
          <label htmlFor={`sp-title-ar-${item.id}`} className="sr-only">العنوان بالعربي</label>
          <input id={`sp-title-ar-${item.id}`} value={item.titleAr} onChange={e => updateItem(item.id, 'titleAr', e.target.value)} placeholder="العنوان بالعربي" className={inputClass} />
         </div>
         <div>
          <label htmlFor={`sp-title-en-${item.id}`} className="sr-only">Title (EN)</label>
          <input id={`sp-title-en-${item.id}`} value={item.titleEn} onChange={e => updateItem(item.id, 'titleEn', e.target.value)} placeholder="Title (EN)" className={inputClass} />
         </div>
        </div>
        <div>
         <label htmlFor={`sp-url-${item.id}`} className="sr-only">URL</label>
         <input id={`sp-url-${item.id}`} value={item.url} onChange={e => updateItem(item.id, 'url', e.target.value)} placeholder="https://..." className={inputClass} />
        </div>
       </div>
      ))}
     </div>
    ) : (
     <motion.div className="space-y-4" variants={containerVariants}>
      {links.map(link => (
       <motion.div key={link.id} variants={itemVariants} whileHover={prefersReduced ? {} : { y: -3 }}>
         <div className="glass glass-hover lift rounded-xl p-5 flex items-center gap-4 group transition">
          <span className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-royal-500/20 group-hover:scale-105 group-hover:rotate-3 transition-transform" aria-hidden="true">
           <FiBookOpen size={20} />
          </span>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
           <h2 className="font-semibold text-ink group-hover:text-royal-500 dark:group-hover:text-cyan-300 transition-colors text-base truncate">{isArabic ? link.titleAr : link.titleEn}</h2>
           <p className="text-xs text-slate-500 dark:text-white/40 truncate mt-0.5" dir="ltr">{link.url}</p>
          </a>
          <div className="flex items-center gap-2 ms-2">
           {canEdit && (
            <button onClick={() => setConfirmDeleteId(link.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" aria-label={t('common.delete')}>
             <FiTrash2 size={16} />
            </button>
           )}
           <span className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/5 border border-line flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-royal-500 dark:group-hover:text-cyan-300 group-hover:border-royal-500/40 transition-colors" aria-hidden="true">
            <FiExternalLink size={16} />
           </span>
         </div>
        </div>
       </motion.div>
      ))}
     </motion.div>
    )}
   </div>

   <ConfirmDialog
    isOpen={!!confirmDeleteId}
    onClose={() => setConfirmDeleteId(null)}
    onConfirm={() => { if (confirmDeleteId) persistDelete(confirmDeleteId) }}
    title={t('common.delete')}
    message={isArabic ? 'هل أنت متأكد من حذف هذا الرابط من الخطة الدراسية؟' : 'Are you sure you want to remove this link from the study plan?'}
   />
  </motion.div>
 )
}
