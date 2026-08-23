import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiSearch, FiFilter, FiUser, FiLogIn, FiEye, FiHeart, FiStar, FiMessageSquare, FiCpu, FiArrowRight } from 'react-icons/fi'
import usePagination from '../../hooks/usePagination'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import SkeletonRow from './SkeletonRow'
import Pagination from './Pagination'
import StudentProfileModal from './StudentProfileModal'

const ACTION_CONFIG = {
 LOGIN: { icon: FiLogIn, bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500', badgeBg: 'bg-emerald-500/10', badgeTextLight: 'text-emerald-600', badgeTextDark: 'dark:text-emerald-400', labelAr: 'تسجيل دخول', labelEn: 'Login' },
 VIEW_LECTURE: { icon: FiEye, bgClass: 'bg-violet-500/10', textClass: 'text-violet-500', badgeBg: 'bg-violet-500/10', badgeTextLight: 'text-violet-600', badgeTextDark: 'dark:text-violet-400', labelAr: 'مشاهدة محاضرة', labelEn: 'Viewed Lecture' },
 VIEW_SOURCE: { icon: FiEye, bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-500', badgeBg: 'bg-cyan-500/10', badgeTextLight: 'text-cyan-600', badgeTextDark: 'dark:text-cyan-400', labelAr: 'مشاهدة مصدر', labelEn: 'Viewed Source' },
 ADD_FAVORITE: { icon: FiHeart, bgClass: 'bg-rose-500/10', textClass: 'text-rose-500', badgeBg: 'bg-rose-500/10', badgeTextLight: 'text-rose-600', badgeTextDark: 'dark:text-rose-400', labelAr: 'إضافة مفضلة', labelEn: 'Added Favorite' },
 RATE_LECTURE: { icon: FiStar, bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', badgeBg: 'bg-amber-500/10', badgeTextLight: 'text-amber-600', badgeTextDark: 'dark:text-amber-400', labelAr: 'تقييم محاضرة', labelEn: 'Rated Lecture' },
 ADD_COMMENT: { icon: FiMessageSquare, bgClass: 'bg-blue-500/10', textClass: 'text-blue-500', badgeBg: 'bg-blue-500/10', badgeTextLight: 'text-blue-600', badgeTextDark: 'dark:text-blue-400', labelAr: 'إضافة تعليق', labelEn: 'Added Comment' },
 USE_CHATBOT: { icon: FiCpu, bgClass: 'bg-purple-500/10', textClass: 'text-purple-500', badgeBg: 'bg-purple-500/10', badgeTextLight: 'text-purple-600', badgeTextDark: 'dark:text-purple-400', labelAr: 'استخدام الشات بوت', labelEn: 'Used Chatbot' },
 UPDATE_PROFILE: { icon: FiUser, bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', badgeBg: 'bg-amber-500/10', badgeTextLight: 'text-amber-600', badgeTextDark: 'dark:text-amber-400', labelAr: 'تحديث ملف', labelEn: 'Updated Profile' },
}

const FALLBACK_CONFIG = { icon: FiArrowRight, bgClass: 'bg-slate-500/10', textClass: 'text-slate-500', badgeBg: 'bg-slate-500/10', badgeTextLight: 'text-slate-600', badgeTextDark: 'dark:text-slate-400 ' }

function StudentLogs({ logs, users, loading, isArabic }) {
 const prefersReduced = useReducedMotion()
 const [search, setSearch] = useState('')
 const [filter, setFilter] = useState('all')
 const [profileStudent, setProfileStudent] = useState(null)

 const filteredLogs = logs.filter(log => {
  const matchesSearch = !search ||
   log.name?.toLowerCase().includes(search.toLowerCase()) ||
   log.studentId?.toLowerCase().includes(search.toLowerCase()) ||
   log.detail?.toLowerCase().includes(search.toLowerCase())
  const matchesFilter = filter === 'all' || log.type === filter
  return matchesSearch && matchesFilter
 })

 const { paginatedItems, page, setPage, totalPages, totalItems } = usePagination(filteredLogs, 20)

 if (loading) {
  return <SkeletonRow count={6} widths={['70%']} />
 }

 return (
  <>
  <motion.div
   variants={prefersReduced ? pageContainerReduced : pageContainer}
   initial="hidden"
   animate="visible"
   className="space-y-4"
  >
   <div className="flex justify-between items-center flex-wrap gap-3">
    <p className="text-sm text-slate-500 dark:text-slate-400 ">
     {isArabic ? `${logs.length} سجل مسجل` : `${logs.length} logs recorded`}
    </p>
    <div className="flex gap-2 flex-wrap">
     <div className="relative">
      <FiFilter className={`absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 ${isArabic ? 'right-3' : 'left-3'}`} size={14} />
      <select
       value={filter}
       onChange={e => setFilter(e.target.value)}
       className={`${isArabic ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal-400/50`}
      >
       <option value="all">{isArabic ? 'الكل' : 'All'}</option>
       {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
        <option key={key} value={key}>{isArabic ? cfg.labelAr : cfg.labelEn}</option>
       ))}
      </select>
     </div>
     <div className="relative">
      <FiSearch className={`absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 ${isArabic ? 'right-3' : 'left-3'}`} size={14} />
      <input
       type="text"
       placeholder={isArabic ? 'بحث...' : 'Search...'}
       value={search}
       onChange={e => setSearch(e.target.value)}
       className={`${isArabic ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-48`}
      />
     </div>
    </div>
   </div>

   {filteredLogs.length === 0 ? (
    <div className="glass rounded-xl p-12 text-center border border-white/10">
     <FiUser className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
     <p className="text-slate-500 dark:text-slate-400 ">{isArabic ? 'لا توجد سجلات' : 'No logs'}</p>
    </div>
   ) : (
    <div className="space-y-2">
     {paginatedItems.map((log) => {
      const config = ACTION_CONFIG[log.type] || { ...FALLBACK_CONFIG, labelAr: log.type, labelEn: log.type }
      const Icon = config.icon
      return (
       <div key={log.id} className="glass rounded-xl p-4 border border-white/10 hover:border-royal-500/30 transition-colors">
        <div className="flex items-center gap-3">
         <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={config.textClass} />
         </div>
         <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
           <button
            onClick={() => {
             const student = users?.find(u => u.studentId === log.studentId)
             if (student) setProfileStudent(student)
            }}
            className="font-semibold text-navy-900 dark:text-white text-sm hover:text-royal-500 dark:hover:text-royal-400 transition-colors cursor-pointer text-left"
           >
            {log.name || log.studentId}
           </button>
           <span className={`px-2 py-0.5 ${config.badgeBg} rounded text-xs ${config.badgeTextLight} ${config.badgeTextDark}`}>
            {isArabic ? config.labelAr : config.labelEn}
           </span>
          </div>
          {log.detail && (
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{log.detail}</p>
          )}
         </div>
         <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          {new Date(log.timestamp || Date.now()).toLocaleString(isArabic ? 'ar' : 'en')}
         </span>
        </div>
       </div>
      )
     })}
    </div>
   )}
  </motion.div>
   <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} isArabic={isArabic} />
   <StudentProfileModal
    student={profileStudent}
    isOpen={!!profileStudent}
    onClose={() => setProfileStudent(null)}
   />
  </>
 )
}

export default memo(StudentLogs)
