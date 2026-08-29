import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiLink, FiFile, FiUpload } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { deleteSource } from '../../services'
import { useLanguage } from '../../context/LanguageContext'
import usePagination from '../../hooks/usePagination'
import { pageContainer, pageContainerReduced } from '../../utils/motionTokens'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'

function SourcesTable({ sources, loading, isArabic, onEdit, onAdd, onRefresh }) {
 const { t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const [search, setSearch] = useState('')
 const [confirmDeleteId, setConfirmDeleteId] = useState(null)
 const [sortBy, setSortBy] = useState('default')

 const filteredSources = sources.filter(s => {
  return !search ||
   s.titleAr?.toLowerCase().includes(search.toLowerCase()) ||
   s.titleEn?.toLowerCase().includes(search.toLowerCase()) ||
   s.subjectAr?.toLowerCase().includes(search.toLowerCase()) ||
   s.subjectEn?.toLowerCase().includes(search.toLowerCase())
 }).sort((a, b) => {
  if (sortBy === 'nameAr') return (a.titleAr || '').localeCompare(b.titleAr || '', 'ar')
  if (sortBy === 'nameEn') return (a.titleEn || '').localeCompare(b.titleEn || '', 'en')
  return 0
 })

 const { paginatedItems, page, setPage, totalPages, totalItems } = usePagination(filteredSources, 10)

 const handleDelete = async (id) => {
  try {
   await deleteSource(id)
   toast.success(t('admin.deleted'))
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('admin.deleteError'))
  }
 }

 if (loading) {
  return <SkeletonRow count={6} widths={['70%']} />
 }

 return (
  <motion.div
   variants={prefersReduced ? pageContainerReduced : pageContainer}
   initial="hidden"
   animate="visible"
   className="space-y-4"
  >
   <div className="flex justify-between items-center flex-wrap gap-3">
    <p className="text-sm text-slate-500 dark:text-slate-400 ">
     {isArabic ? `${sources.length} مصدر مسجل` : `${sources.length} sources registered`}
    </p>
    <div className="flex gap-2">
     <select
      value={sortBy}
      onChange={e => setSortBy(e.target.value)}
      className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
     >
      <option value="default">{isArabic ? 'بدون ترتيب' : 'Default'}</option>
      <option value="nameAr">{isArabic ? 'الاسم عربي' : 'Name (AR)'}</option>
      <option value="nameEn">{isArabic ? 'الاسم إنجليزي' : 'Name (EN)'}</option>
     </select>
     <input
      type="text"
      placeholder={t('admin.search')}
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-48"
     />
     <button
      onClick={onAdd}
      className="flex items-center gap-2 px-3 py-1.5 bg-royal-500 hover:bg-royal-600 text-white rounded-lg text-sm font-medium transition"
     >
      <FiPlus size={14} /> {t('common.add')}
     </button>
    </div>
   </div>

   {filteredSources.length === 0 ? (
    <div className="glass rounded-xl p-12 text-center border border-white/10">
     <FiLink className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
     <p className="text-slate-500 dark:text-slate-400 ">{t('admin.noData')}</p>
    </div>
   ) : (
    <div className="space-y-2">
     {paginatedItems.map((source) => (
      <div
       key={source.id}
       className="glass rounded-xl p-4 border border-white/10 hover:border-royal-500/30 transition"
      >
       <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
         <div className={`p-3 rounded-xl flex-shrink-0 ${source.fileData ? 'bg-emerald-500/10' : 'bg-cyan-500/10'}`}>
          {source.fileData ? <FiFile size={20} className="text-emerald-500" /> : <FiLink size={20} className="text-cyan-500" />}
         </div>
         <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink text-sm truncate">
           {isArabic ? source.titleAr : source.titleEn}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
           {isArabic ? source.subjectAr : source.subjectEn}
          </p>
          {source.fileData ? (
           <span className="inline-flex items-center gap-1 text-xs text-emerald-500 mt-1">
            <FiUpload size={10} /> {source.fileName || (isArabic ? 'ملف مرفوع' : 'Uploaded file')}
           </span>
          ) : source.url ? (
           <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-royal-500 hover:underline truncate block mt-1">
            {source.url}
           </a>
          ) : null}
          {Array.isArray(source.files) && source.files.length > 1 && (
           <div className="flex flex-wrap gap-1 mt-2">
            {source.files.slice(0, 3).map((f, i) => (
             <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-500/20 truncate max-w-[120px]">
              <FiFile size={9} /> {f.name}
             </a>
            ))}
            {source.files.length > 3 && (
             <span className="text-[10px] px-2 py-0.5 bg-slate-500/10 text-slate-500 rounded-full">
              +{source.files.length - 3}
             </span>
            )}
           </div>
          )}
         </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
         <button onClick={() => onEdit(source)} className="p-2 text-royal-500 hover:bg-royal-500/10 rounded-lg transition-colors" aria-label={t('common.edit')}>
          <FiEdit2 size={14} />
         </button>
         <button onClick={() => setConfirmDeleteId(source.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" aria-label={t('common.delete')}>
          <FiTrash2 size={14} />
         </button>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}
   <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} isArabic={isArabic} />
   <ConfirmDialog
    isOpen={!!confirmDeleteId}
    onClose={() => setConfirmDeleteId(null)}
    onConfirm={() => handleDelete(confirmDeleteId)}
    title={t('admin.confirmDelete')}
    message={t('admin.confirmDeleteSource')}
    confirmText={t('common.delete')}
    cancelText={t('common.cancel')}
    variant="danger"
   />
  </motion.div>
 )
}

export default memo(SourcesTable)
