import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getStudyPlan, saveStudyPlan } from '../services'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { FiExternalLink, FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiBookOpen } from 'react-icons/fi'
import ErrorState from '../components/feedback/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import toast from 'react-hot-toast'

const containerVariants = pageContainer
const itemVariants = pageItem

export default function StudyPlan() {
 const { lang, t } = useLanguage()
 const { user, isAdmin } = useAuth()
 const isArabic = lang === 'ar'
 const canEdit = isAdmin

 useEffect(() => {
  document.title = t('studyPlan.pageTitle')
 }, [isArabic])
 const [links, setLinks] = useState([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(null)
 const [editing, setEditing] = useState(false)
 const [editData, setEditData] = useState([])
 const prefersReduced = useReducedMotion()

 const loadPlan = async () => {
  setLoading(true)
  try {
   const data = await getStudyPlan()
   setLinks(data.links || [])
   setError(null)
  } catch (err) {
   setError(err)
  } finally {
   setLoading(false)
  }
 }

 useEffect(() => {
  loadPlan()
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
   id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
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
   id: l.id || Date.now().toString() + Math.random().toString(36).slice(2, 6),
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
   id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
   titleAr: '',
   titleEn: '',
   url: '',
  }])
 }

 const removeItem = (id) => {
  setEditData(editData.filter(l => l.id !== id))
 }

 const updateItem = (id, field, value) => {
  setEditData(editData.map(l => l.id === id ? { ...l, [field]: value } : l))
 }

 const displayData = editing ? editData : links

 const inputClass = "w-full glass rounded-xl px-3 py-2 text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"

 if (error) return <ErrorState error={error} onRetry={handleRetry} />

 if (loading) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="py-16 mb-12">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="skeleton h-10 w-48 mx-auto mb-4 rounded-xl" />
      <div className="skeleton h-5 w-64 mx-auto rounded-lg" />
     </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
     {[1,2,3].map(i => (
      <div key={i} className="glass rounded-xl p-5">
       <div className="skeleton h-5 w-2/3 rounded-lg mb-2" />
       <div className="skeleton h-3 w-1/4 rounded-full" />
      </div>
     ))}
    </div>
   </div>
  )
 }

 if (error && links.length === 0) {
  return (
   <div className="min-h-screen pt-24 pb-16 bg-spatial-page">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
     <ErrorState
      error={error}
      onRetry={handleRetry}
      title={t('studyPlan.title')}
      className="max-w-md mx-auto"
     />
    </div>
   </div>
  )
 }

 return (
  <motion.div variants={containerVariants} initial={prefersReduced ? false : "hidden"} animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page grain">
   <div className="py-16 mb-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
     <h1 className="text-3xl md:text-5xl font-bold gradient-text-spatial mb-4">{t('studyPlan.title')}</h1>
     <p className="text-slate-500 dark:text-white/50 text-lg">{t('studyPlan.subtitle')}</p>
    </div>
   </div>

   <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    {canEdit && (
     <div className="flex justify-end gap-2 mb-6">
      {editing ? (
       <>
        <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium transition">
         <FiSave size={16} /> {t('common.save')}
        </button>
        <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 glass text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition">
         <FiX size={16} /> {t('common.cancel')}
        </button>
       </>
      ) : (
       <>
        <button onClick={startEditWithNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition">
         <FiPlus size={16} /> {t('studyPlan.addLink')}
        </button>
        <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium transition">
         <FiEdit2 size={16} /> {t('common.edit')}
        </button>
       </>
      )}
     </div>
    )}

    {editing && (
     <div className="mb-6">
      <button onClick={addNew} className="flex items-center gap-2 px-4 py-2 btn-spatial text-white rounded-xl text-sm font-medium transition">
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
       <button onClick={startEditWithNew} className="inline-flex items-center gap-2 px-5 py-2.5 btn-spatial text-white rounded-xl text-sm font-medium transition">
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
         <input value={item.titleAr} onChange={e => updateItem(item.id, 'titleAr', e.target.value)} placeholder="العنوان بالعربي" className={inputClass} />
         <input value={item.titleEn} onChange={e => updateItem(item.id, 'titleEn', e.target.value)} placeholder="Title (EN)" className={inputClass} />
        </div>
        <input value={item.url} onChange={e => updateItem(item.id, 'url', e.target.value)} placeholder="https://..." className={inputClass} />
       </div>
      ))}
     </div>
    ) : (
     <motion.div className="space-y-4" variants={containerVariants}>
      {links.map(link => (
       <motion.div key={link.id} variants={itemVariants} whileHover={prefersReduced ? {} : { y: -3 }}>
        <div className="glass glass-hover rounded-xl p-5 flex items-center justify-between group transition">
         <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy-900 dark:text-white group-hover:text-royal-500 transition-colors">{isArabic ? link.titleAr : link.titleEn}</h3>
         </a>
         <div className="flex items-center gap-2 ms-4">
          {canEdit && (
           <button onClick={async () => {
            const newLinks = links.filter(l => l.id !== link.id)
            try {
             await saveStudyPlan({ links: newLinks })
             setLinks(newLinks)
             toast.success(t('studyPlan.saved'))
            } catch (e) {
             toast.error(t('studyPlan.saveError'))
            }
           }} className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" aria-label={t('common.delete')}>
            <FiTrash2 size={16} />
           </button>
          )}
          <FiExternalLink className="text-slate-500 dark:text-slate-400 group-hover:text-royal-500 transition-colors" size={20} />
         </div>
        </div>
       </motion.div>
      ))}
     </motion.div>
    )}
   </div>
  </motion.div>
 )
}
