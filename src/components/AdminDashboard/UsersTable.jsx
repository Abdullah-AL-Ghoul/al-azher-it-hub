import { useState, useEffect, memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiSearch, FiDownload, FiTrash2, FiEdit2, FiUser, FiSave, FiX, FiKey, FiExternalLink, FiMail, FiBookOpen, FiCalendar } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { deleteStudent, updateStudent, resetPassword } from '../../services'
import { useLanguage } from '../../context/LanguageContext'
import { exportToJson, exportToCsv } from '../../utils/adminShared'
import { pageContainer, pageItem, pageContainerReduced, pageItemReduced } from '../../utils/motionTokens'
import ConfirmDialog from '../shared/ConfirmDialog'
import SkeletonRow from './SkeletonRow'
import StudentProfileModal from './StudentProfileModal'

const USER_COLUMNS = [
 { label: 'Name', accessor: 'name' },
 { label: 'Student ID', accessor: 'studentId' },
 { label: 'Email', accessor: 'email' },
 { label: 'Major', accessor: 'major' },
 { label: 'Role', accessor: 'role' },
 { label: 'Created', accessor: 'createdAt' },
]

function getTimeAgo(lastVisit, isArabic) {
 if (!lastVisit) return t('inline.users-table.never-logged-in')
 const diff = Date.now() - new Date(lastVisit).getTime()
 const minutes = Math.floor(diff / 60000)
 const hours = Math.floor(diff / 3600000)
 const days = Math.floor(diff / 86400000)
 
 if (minutes < 1) return t('inline.users-table.active-now')
 if (minutes < 60) return `${minutes} ${t('inline.users-table.min-ago')}`
 if (hours < 24) return `${hours} ${t('inline.users-table.hours-ago')}`
 return `${days} ${t('inline.users-table.days-ago')}`
}

function UsersTable({ users, loading, onRefresh, isArabic }) {
 const { t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const [search, setSearch] = useState('')
 const [page, setPage] = useState(1)
 const [editingId, setEditingId] = useState(null)
 const [editForm, setEditForm] = useState({ name: '', email: '', role: 'student' })
 const [confirmDeleteId, setConfirmDeleteId] = useState(null)
 const [passwordForm, setPasswordForm] = useState({ studentId: '', password: '', confirm: '' })
 const [profileStudent, setProfileStudent] = useState(null)
 const [selectedIds, setSelectedIds] = useState(new Set())
 const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
 const USERS_PER_PAGE = 10

 const filteredUsers = users.filter(user =>
  (search === '' ||
   user.name?.toLowerCase().includes(search.toLowerCase()) ||
   user.studentId?.toLowerCase().includes(search.toLowerCase()) ||
   user.email?.toLowerCase().includes(search.toLowerCase()) ||
   user.major?.toLowerCase().includes(search.toLowerCase())) &&
  (user.role ?? 'student') === 'student'
 )

 const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE)

 const handleEdit = (user) => {
  setEditingId(user.studentId)
  setEditForm({ name: user.name || '', email: user.email || '', role: user.role || 'student' })
 }

 const handleSaveEdit = async (studentId) => {
  try {
   await updateStudent(studentId, { name: editForm.name, email: editForm.email, role: editForm.role })
   setEditingId(null)
   toast.success(t('usersTable.studentUpdated'))
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('usersTable.updateFailed'))
  }
 }

 const handleDelete = async (studentId) => {
  try {
   await deleteStudent(studentId)
   toast.success(t('usersTable.studentDeleted'))
   if (onRefresh) onRefresh()
  } catch (error) {
   toast.error(t('usersTable.deleteFailed'))
  }
 }

 const handlePasswordChange = async (studentId) => {
  if (!passwordForm.password || passwordForm.password.length < 8) {
   toast.error(t('inline.users-table.password-too-short-min'))
   return
  }
  if (passwordForm.password !== passwordForm.confirm) {
   toast.error(t('inline.users-table.passwords-do-not-match'))
   return
  }
  try {
   const result = await resetPassword(studentId, passwordForm.password, { asAdmin: true })
   if (result) {
    setPasswordForm({ studentId: '', password: '', confirm: '' })
    toast.success(t('inline.users-table.password-changed'))
   } else {
    toast.error(t('inline.users-table.student-not-found'))
   }
  } catch (error) {
   toast.error(t('inline.users-table.failed-to-change-password'))
  }
 }

 const handleExport = () => exportToJson('users', t, filteredUsers)

 const handleExportCsv = () => exportToCsv(filteredUsers, USER_COLUMNS, 'users', t)

 useEffect(() => {
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  if (totalPages > 0 && page > totalPages) setPage(totalPages)
 }, [filteredUsers.length])

 const toggleSelect = (id) => {
  setSelectedIds(prev => {
   const next = new Set(prev)
   if (next.has(id)) next.delete(id)
   else next.add(id)
   return next
  })
 }

 const toggleSelectAll = () => {
  if (selectedIds.size === paginatedUsers.length) {
   setSelectedIds(new Set())
  } else {
   setSelectedIds(new Set(paginatedUsers.map(u => u.studentId)))
  }
 }

const handleBulkDelete = async () => {
   const ids = [...selectedIds]
   const results = await Promise.allSettled(ids.map(id => deleteStudent(id)))
   const count = results.filter(r => r.status === 'fulfilled').length
   setSelectedIds(new Set())
   setConfirmBulkDelete(false)
   toast.success(isArabic ? `تم حذف ${count} طالب` : `${count} students deleted`)
   if (onRefresh) onRefresh()
  }

 if (loading) {
  return <SkeletonRow count={5} widths={['60%']} />
 }

 return (
  <>
  <motion.div
   variants={prefersReduced ? pageContainerReduced : pageContainer}
   initial="hidden"
   animate="visible"
   className="space-y-4"
  >
   <div className="flex justify-between items-center flex-wrap gap-4">
    <div className="relative">
     <FiSearch className={`absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 start-3`} size={16} />
     <input
      type="text"
      placeholder={t('inline.users-table.search-by-name-id')}
      value={search}
      onChange={(e) => { setSearch(e.target.value); setPage(1) }}
      aria-label={t('inline.users-table.search-students')}
      className={`ps-9 pe-4 py-2 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 w-64`}
     />
    </div>
    <div className="flex items-center gap-3">
     <span className="text-sm text-slate-500 dark:text-slate-400 ">
      {isArabic ? `${filteredUsers.length} طالب` : `${filteredUsers.length} students`}
     </span>
     {selectedIds.size > 0 && (
      <button onClick={() => setConfirmBulkDelete(true)} className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition">
       <FiTrash2 size={14} /> {isArabic ? `حذف ${selectedIds.size}` : `Delete ${selectedIds.size}`}
      </button>
     )}
     <button onClick={handleExportCsv} className="flex items-center gap-2 px-3 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs font-medium transition">
      <FiDownload size={14} /> CSV
     </button>
     <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs font-medium transition">
      <FiDownload size={14} /> JSON
     </button>
    </div>
   </div>

   {filteredUsers.length === 0 ? (
    <div className="glass rounded-xl p-12 text-center border border-white/10">
     <FiUser className="mx-auto text-5xl text-slate-300 dark:text-slate-600 mb-4" />
     <p className="text-slate-500 dark:text-slate-400 ">
      {t('inline.users-table.no-students-registered')}
     </p>
    </div>
   ) : (
    <>
     <div className="space-y-3" role="list" aria-label={t('inline.users-table.students')}>
      <label className="flex items-center gap-3 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
       <input
        type="checkbox"
        checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
        onChange={toggleSelectAll}
        className="w-4 h-4 rounded border-slate-300 text-royal-500 focus:ring-royal-400"
       />
       {t('inline.users-table.select-all')}
      </label>
      {paginatedUsers.map((user) => {
       const isActive = user.lastVisit && (Date.now() - new Date(user.lastVisit).getTime()) < 3600000
       return (
        <motion.div
         key={user.studentId}
         variants={prefersReduced ? pageItemReduced : pageItem}
         className="glass rounded-xl p-4 border border-white/10 hover:border-royal-500/30 transition"
        >
         {editingId === user.studentId ? (
          <div className="space-y-3">
           <div className="flex items-center gap-2 flex-wrap">
            <input
             value={editForm.name}
             onChange={e => setEditForm({ ...editForm, name: e.target.value })}
             className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 flex-1 min-w-[150px]"
             placeholder={t('inline.users-table.name')}
            />
            <input
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 flex-1 min-w-[150px]"
              placeholder={t('inline.users-table.email')}
             />
             <select
              value={editForm.role}
              onChange={e => setEditForm({ ...editForm, role: e.target.value })}
              className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50"
              aria-label={t('inline.users-table.role')}
             >
              <option value="student">{t('inline.users-table.student')}</option>
              <option value="admin">{t('inline.users-table.admin')}</option>
             </select>
             <button onClick={() => handleSaveEdit(user.studentId)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" aria-label={t('common.save')}>
             <FiSave size={14} />
            </button>
            <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors" aria-label={t('common.cancel')}>
             <FiX size={14} />
            </button>
           </div>
          </div>
         ) : (
          <div className="flex items-start gap-4">
           <div className="flex items-center gap-3 pt-2 flex-shrink-0">
            <input
             type="checkbox"
             checked={selectedIds.has(user.studentId)}
             onChange={() => toggleSelect(user.studentId)}
             className="w-4 h-4 rounded border-slate-300 text-royal-500 focus:ring-royal-400"
            />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
             {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
           </div>
           <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
             <h3 className="font-semibold text-ink text-sm">{user.name || user.studentId}</h3>
             <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <span className={`text-xs ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 '}`}>
               {getTimeAgo(user.lastVisit, isArabic)}
              </span>
             </div>
            </div>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
             <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ">
              <FiUser size={12} /> {user.studentId}
             </span>
             {user.email && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ">
               <FiMail size={12} /> {user.email}
              </span>
             )}
             {user.major && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ">
               <FiBookOpen size={12} /> {user.major}
              </span>
             )}
             {user.createdAt && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ">
               <FiCalendar size={12} /> {new Date(user.createdAt).toLocaleDateString(t('inline.users-table.en'))}
              </span>
             )}
            </div>
           </div>
           <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setProfileStudent(user)} className="p-2 text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors" aria-label={t('inline.users-table.view-profile')}>
             <FiExternalLink size={14} />
            </button>
            <button onClick={() => handleEdit(user)} className="p-2 text-royal-500 hover:bg-royal-500/10 rounded-lg transition-colors" aria-label={t('common.edit')}>
             <FiEdit2 size={14} />
            </button>
            <button
             onClick={() => setPasswordForm(passwordForm.studentId === user.studentId ? { studentId: '', password: '', confirm: '' } : { studentId: user.studentId, password: '', confirm: '' })}
             className={`p-2 rounded-lg transition-colors ${passwordForm.studentId === user.studentId ? 'text-amber-500 bg-amber-500/10' : 'text-amber-500 hover:bg-amber-500/10'}`}
             aria-label={t('inline.users-table.change-password')}
            >
             <FiKey size={14} />
            </button>
            <button onClick={() => setConfirmDeleteId(user.studentId)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" aria-label={t('common.delete')}>
             <FiTrash2 size={14} />
            </button>
           </div>
          </div>
         )}
         {passwordForm.studentId === user.studentId && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('inline.users-table.change-password')}
           </p>
           <div className="flex items-center gap-2 flex-wrap">
            <input
             type="password"
             value={passwordForm.password}
             onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
             className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 flex-1 min-w-[150px]"
             placeholder={t('inline.users-table.new-password')}
            />
            <input
             type="password"
             value={passwordForm.confirm}
             onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
             onKeyDown={e => e.key === 'Enter' && handlePasswordChange(user.studentId)}
             className="px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-400/50 flex-1 min-w-[150px]"
             placeholder={t('inline.users-table.confirm-password')}
            />
            <button onClick={() => handlePasswordChange(user.studentId)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" aria-label={t('inline.users-table.save-password')}>
             <FiSave size={14} />
            </button>
            <button onClick={() => setPasswordForm({ studentId: '', password: '', confirm: '' })} className="p-2 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors" aria-label={t('common.cancel')}>
             <FiX size={14} />
            </button>
           </div>
          </div>
         )}
        </motion.div>
       )
      })}
     </div>
     <ConfirmDialog
      isOpen={!!confirmDeleteId}
      onClose={() => setConfirmDeleteId(null)}
      onConfirm={() => handleDelete(confirmDeleteId)}
      title={t('admin.confirmDelete')}
      message={t('inline.users-table.are-you-sure-you')}
      confirmText={t('common.delete')}
      cancelText={t('common.cancel')}
      variant="danger"
     />
     <ConfirmDialog
      isOpen={confirmBulkDelete}
      onClose={() => setConfirmBulkDelete(false)}
      onConfirm={handleBulkDelete}
      title={t('inline.users-table.bulk-delete')}
      message={isArabic ? `هل أنت متأكد من حذف ${selectedIds.size} طالب؟` : `Are you sure you want to delete ${selectedIds.size} students?`}
      confirmText={t('common.delete')}
      cancelText={t('common.cancel')}
      variant="danger"
     />

     {filteredUsers.length > USERS_PER_PAGE && (
      <div className="flex justify-center gap-2 mt-6">
       <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
       >
        {t('usersTable.prev')}
       </button>
       <span className="px-4 py-2 text-slate-600 dark:text-slate-400 text-sm">
        {page} / {Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
       </span>
       <button
        onClick={() => setPage(p => p + 1)}
        disabled={page >= Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
        className="px-4 py-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
       >
        {t('common.next')}
       </button>
      </div>
     )}
    </>
   )}
  </motion.div>
   <StudentProfileModal
    student={profileStudent}
    isOpen={!!profileStudent}
    onClose={() => setProfileStudent(null)}
   />
  </>
 )
}

export default memo(UsersTable)
