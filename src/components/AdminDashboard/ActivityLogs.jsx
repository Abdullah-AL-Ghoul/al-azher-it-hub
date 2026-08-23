import { useState, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { FiUser, FiLoader, FiFilter, FiTrash2, FiDownload, FiSearch, FiLogIn, FiEye, FiEdit2, FiMessageSquare, FiChevronRight } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { clearActivity } from '../../services'
import usePagination from '../../hooks/usePagination'
import { exportToJson, exportToCsv } from '../../utils/adminShared'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced, springSoft } from '../../utils/motionTokens'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'

function ActivityLogs({ logs, loading, isArabic, onRefresh }) {
 const { t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const [search, setSearch] = useState('')
 const [filter, setFilter] = useState('all')
 const [expandedLog, setExpandedLog] = useState(null)
 const [confirmClear, setConfirmClear] = useState(false)

 const filteredLogs = logs.filter((log) => {
  const matchesSearch =
   !search ||
   log.detail?.toLowerCase().includes(search.toLowerCase()) ||
   log.studentId?.toLowerCase().includes(search.toLowerCase())

  const matchesFilter = filter === 'all' || log.type === filter

  return matchesSearch && matchesFilter
 })

 const { paginatedItems, page, setPage, totalPages, totalItems } = usePagination(filteredLogs, 20)

 const handleExport = () => exportToJson('activity', t, logs)
 const handleExportCsv = () => exportToCsv(logs, [
   { label: 'Name', accessor: 'name' },
   { label: 'Student ID', accessor: 'studentId' },
   { label: 'Type', accessor: 'type' },
   { label: 'Detail', accessor: 'detail' },
   { label: 'Time', accessor: 'timestamp' },
 ], 'activity', t)

 const handleClearActivity = async () => {
  try {
   await clearActivity()
   toast.success(t('activityLogs.clearSuccess') || 'Activity cleared')
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('activityLogs.clearFailed'))
  }
 }

 if (loading) {
  return <SkeletonRow count={8} widths={['70%']} />
 }

 return (
  <motion.div className="space-y-4" variants={prefersReduced ? pageContainerReduced : pageContainer} initial="hidden" animate="visible">
   <div className="flex justify-between items-center flex-wrap gap-4">
    <div className="relative">
     <FiFilter className={`absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 ${isArabic ? 'right-3' : 'left-3'}`} size={16} />
     <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className={`${isArabic ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-400/50`}
     >
      <option value="all">{t('common.all')}</option>
      <option value="LOGIN">{t('activityLogs.filterLogin')}</option>
      <option value="VIEW_LECTURE">{t('activityLogs.filterViewLecture')}</option>
      <option value="UPDATE_PROFILE">{t('activityLogs.filterUpdateProfile')}</option>
      <option value="ADD_COMMENT">{t('activityLogs.filterAddComment')}</option>
      <option value="ADDITION_DELETE">{t('activityLogs.filterDeleteAddition')}</option>
     </select>
    </div>
    <div className="relative">
     <FiSearch className={`absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 ${isArabic ? 'right-3' : 'left-3'}`} size={16} />
     <input
      type="text"
      placeholder={t('activityLogs.searchPlaceholder')}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className={`${isArabic ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-64`}
     />
    </div>
    <div className="flex gap-2">
      <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition">
       <FiDownload size={14} /> JSON
      </button>
      <button onClick={handleExportCsv} className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition">
       <FiDownload size={14} /> CSV
      </button>
      <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition">
       <FiTrash2 size={14} /> {t('activityLogs.clearAll')}
      </button>
     </div>
   </div>

   {logs.length === 0 ? (
    <div className="glass rounded-xl p-12 text-center border border-white/10">
     <FiLoader className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
     <p className="text-slate-500 dark:text-slate-400 ">{t('activityLogs.noLogs')}</p>
    </div>
   ) : (
    <motion.div className="space-y-2" variants={prefersReduced ? pageContainerReduced : pageContainer} initial="hidden" animate="visible">
     {paginatedItems.map((log) => (
      <motion.div
       key={log.id}
       variants={pageItem}
       className="glass rounded-xl p-4 border border-white/10 hover:border-royal-500/30 transition-colors cursor-pointer"
       onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
      >
       <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
         <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
           log.type === 'LOGIN'
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            : log.type === 'VIEW_LECTURE'
            ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400'
            : log.type === 'UPDATE_PROFILE'
             ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
             : log.type === 'ADD_COMMENT'
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 '
          }`}
         >
          {log.type === 'LOGIN' ? <FiLogIn size={16} /> : log.type === 'VIEW_LECTURE' ? <FiEye size={16} /> : log.type === 'UPDATE_PROFILE' ? <FiEdit2 size={16} /> : log.type === 'ADD_COMMENT' ? <FiMessageSquare size={16} /> : log.type === 'ADDITION_DELETE' ? <FiTrash2 size={16} /> : <FiLoader size={16} />}
         </div>
         <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
           <span className="font-semibold text-navy-900 dark:text-white text-xs">{log.name || log.studentId || t('activityLogs.unknown')}</span>
           <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400 ">{log.type}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
           {log.detail || ''}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ">
           <span className="text-xs text-slate-500 dark:text-slate-400 ">
            {new Date(log.timestamp || Date.now()).toLocaleString()}
           </span>
          </div>
         </div>
        </div>
        <FiChevronRight size={16} className={`text-slate-300 dark:text-slate-400 flex-shrink-0 mt-1 transition-transform duration-300 ${expandedLog === log.id ? (isArabic ? '-rotate-90' : 'rotate-90') : ''}`} />
       </div>
       <AnimatePresence>
        {expandedLog === log.id && (
         <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={prefersReduced ? { duration: 0 } : springSoft}
          className="overflow-hidden"
         >
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 space-y-1">
           <p><span className="font-medium">{t('activityLogs.filterLogin')}:</span> {log.name || log.studentId || '—'}</p>
           <p><span className="font-medium">{isArabic ? 'النوع:' : 'Type:'}</span> {log.type}</p>
           {log.detail && <p><span className="font-medium">{isArabic ? 'التفاصيل:' : 'Detail:'}</span> {log.detail}</p>}
           <p><span className="font-medium">{isArabic ? 'الوقت:' : 'Time:'}</span> {new Date(log.timestamp || Date.now()).toLocaleString()}</p>
          </div>
         </motion.div>
        )}
       </AnimatePresence>
      </motion.div>
     ))}
    </motion.div>
   )}
   <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} isArabic={isArabic} />
   <ConfirmDialog
    isOpen={confirmClear}
    onClose={() => setConfirmClear(false)}
    onConfirm={handleClearActivity}
    title={t('admin.confirmDelete')}
    message={t('activityLogs.clearConfirm')}
    confirmText={t('common.delete')}
    cancelText={t('common.cancel')}
    variant="danger"
   />
  </motion.div>
 )
}

export default memo(ActivityLogs)