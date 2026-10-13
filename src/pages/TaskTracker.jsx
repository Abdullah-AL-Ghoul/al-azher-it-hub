import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import PageHero from '../components/shared/PageHero'
import {
  FiCheckCircle,
  FiCircle,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiAlertCircle,
  FiClock,
  FiDownload,
  FiShare2,
  FiFilter,
  FiCheck,
  FiList
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { toast } from 'react-hot-toast'

const DEFAULT_TASKS = [
  {
    id: 't1',
    titleAr: 'تسليم المشروع العملي لهياكل البيانات (Binary Tree Implementation)',
    titleEn: 'Data Structures Practical Project Submission',
    course: 'ITCS2301',
    category: 'project',
    priority: 'urgent',
    dueDate: '2026-10-25',
    status: 'in_progress'
  },
  {
    id: 't2',
    titleAr: 'حل شيت استعلامات SQL و JOINs المتقدمة',
    titleEn: 'Database Systems SQL & JOINs Assignment',
    course: 'ITIS2305',
    category: 'assignment',
    priority: 'medium',
    dueDate: '2026-10-28',
    status: 'todo'
  },
  {
    id: 't3',
    titleAr: 'مذاكرة لامتحان منتصف الفصل (Midterm) لهندسة البرمجيات',
    titleEn: 'Prepare for Software Engineering Midterm',
    course: 'ITSE3302',
    category: 'exam',
    priority: 'urgent',
    dueDate: '2026-11-05',
    status: 'todo'
  },
  {
    id: 't4',
    titleAr: 'مراجعة خوارزميات التوجيه في شبكات الحاسوب',
    titleEn: 'Review Routing Algorithms in Networks',
    course: 'ITCS3304',
    category: 'quiz',
    priority: 'normal',
    dueDate: '2026-10-20',
    status: 'done'
  }
]

export default function TaskTracker() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_academic_tasks')
      return saved ? JSON.parse(saved) : DEFAULT_TASKS
    } catch {
      return DEFAULT_TASKS
    }
  })

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('al_azher_academic_tasks', JSON.stringify(tasks))
    } catch {
      // ignore
    }
  }, [tasks])

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'todo' | 'in_progress' | 'done'
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newCourse, setNewCourse] = useState('ITCS2301')
  const [newCategory, setNewCategory] = useState('assignment')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDueDate, setNewDueDate] = useState('')

  // Toggle completion
  const handleToggleStatus = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = t.status === 'done' ? 'todo' : 'done'
          return { ...t, status: next }
        }
        return t
      })
    )
  }

  // Delete task
  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    toast.success(isArabic ? 'تم حذف المهمة' : 'Task removed')
  }

  // Add task
  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const task = {
      id: `task_${Date.now()}`,
      titleAr: newTitle.trim(),
      titleEn: newTitle.trim(),
      course: newCourse,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || new Date().toISOString().slice(0, 10),
      status: 'todo'
    }

    setTasks((prev) => [task, ...prev])
    setNewTitle('')
    setIsModalOpen(false)
    toast.success(isArabic ? 'تمت إضافة المهمة بنجاح' : 'Task added successfully')
  }

  // Export as iCalendar (.ics)
  const handleExportIcs = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Al-Azher IT Hub//Academic Tasks//AR',
      'CALSCALE:GREGORIAN'
    ]

    tasks.forEach((t) => {
      const title = isArabic ? t.titleAr : t.titleEn
      const dateStr = t.dueDate ? t.dueDate.replace(/-/g, '') : '20261025'
      icsContent.push(
        'BEGIN:VEVENT',
        `SUMMARY:[${t.course}] ${title}`,
        `DESCRIPTION:مهمة أكاديمية عبر منصة AL-Azher IT Hub - المساق: ${t.course}`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      )
    })

    icsContent.push('END:VCALENDAR')
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'al_azher_academic_schedule.ics'
    link.click()
    URL.revokeObjectURL(url)
    toast.success(isArabic ? 'تم تصدير ملف التقويم (.ics)' : 'Calendar file (.ics) downloaded')
  }

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const lines = tasks.map((t, idx) => {
      const statusIcon = t.status === 'done' ? '✅' : '⏳'
      return `${idx + 1}. ${statusIcon} [${t.course}] ${isArabic ? t.titleAr : t.titleEn} (الموعد: ${t.dueDate})`
    })

    const msg = isArabic
      ? `📋 مهام وتكليفات كلية IT - جامعة الأزهر:\n\n${lines.join('\n')}\n\nتم إنشاؤها عبر منصة AL-Azher IT Hub`
      : `📋 Al-Azhar IT Faculty Tasks:\n\n${lines.join('\n')}\n\nGenerated via AL-Azher IT Hub`

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Metrics
  const filteredTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks
    return tasks.filter((t) => t.status === statusFilter)
  }, [tasks, statusFilter])

  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.status === 'done').length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="min-h-screen pt-24 pb-20 bg-spatial-page"
    >
      <div className="container-page max-w-5xl">
        {/* Page Hero */}
        <PageHero
          variant="chips"
          title={isArabic ? 'مدير المهام والواجبات الأكاديمية' : 'Academic Task & Assignment Tracker'}
          subtitle={
            isArabic
              ? 'نظّم مواعيد تسليم المشاريع، واجبات المقررات، وامتحانات الكلية في مكان واحد مع ميزة المزامنة الفورية مع تقويم الهاتف ومشاركتها عبر واتساب.'
              : 'Keep track of course assignments, midterm deadlines, and milestone deliverables with calendar sync and instant sharing.'
          }
        />

        {/* Progress & Quick Stats Card */}
        <motion.div variants={pageItem} className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-lg font-bold text-ink mb-1">
                {isArabic ? 'معدل إنجاز المهام الدراسية' : 'Semester Progress Rate'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/60">
                {isArabic
                  ? `أنجزت ${completedCount} من أصل ${totalCount} تكليفاً وواجباً (${completionPercentage}%)`
                  : `Completed ${completedCount} of ${totalCount} deliverables (${completionPercentage}%)`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportIcs}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-ink border border-white/10 transition"
              >
                <FiDownload size={14} className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'تصدير للتقويم (.ics)' : 'Export to Calendar (.ics)'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                <FaWhatsapp size={14} />
                <span>{isArabic ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl btn-primary text-xs font-bold shadow-md shadow-royal-500/20"
              >
                <FiPlus size={15} />
                <span>{isArabic ? 'إضافة مهمة جديدة' : 'Add New Task'}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-royal-500 via-cyan-400 to-emerald-400 rounded-full"
            />
          </div>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'todo', labelAr: 'قيد الانتظار', labelEn: 'To Do' },
            { id: 'in_progress', labelAr: 'قيد العمل', labelEn: 'In Progress' },
            { id: 'done', labelAr: 'مكتملة', labelEn: 'Completed' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-royal-600 text-white shadow-sm'
                  : 'glass text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 border border-white/10'
              }`}
            >
              {isArabic ? f.labelAr : f.labelEn}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center text-slate-500 border border-white/10">
                <FiList size={36} className="mx-auto mb-2 opacity-50 text-royal-500" />
                <p className="text-sm font-bold text-ink">
                  {isArabic ? 'لا توجد مهام في هذا التصنيف' : 'No tasks in this category'}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'done'
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`glass rounded-2xl p-4 sm:p-5 border transition-all flex items-start sm:items-center justify-between gap-4 ${
                      isDone
                        ? 'border-emerald-500/20 bg-emerald-500/[0.02] opacity-75'
                        : 'border-white/10 hover:border-royal-500/30'
                    }`}
                  >
                    {/* Checkbox & Title */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleStatus(task.id)}
                        className={`mt-0.5 sm:mt-0 p-1.5 rounded-xl transition ${
                          isDone
                            ? 'text-emerald-500 hover:text-emerald-600'
                            : 'text-slate-400 hover:text-royal-500'
                        }`}
                      >
                        {isDone ? <FiCheckCircle size={20} /> : <FiCircle size={20} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                            {task.course}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : task.priority === 'medium'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60'
                          }`}>
                            {task.priority}
                          </span>
                        </div>

                        <p className={`text-xs sm:text-sm font-bold text-ink leading-relaxed ${
                          isDone ? 'line-through text-slate-400 dark:text-white/40' : ''
                        }`}>
                          {isArabic ? task.titleAr : task.titleEn}
                        </p>
                      </div>
                    </div>

                    {/* Due Date & Delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/60">
                        <FiCalendar size={13} className="text-royal-500" />
                        <span className="font-mono">{task.dueDate}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title={isArabic ? 'حذف المهمة' : 'Delete Task'}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Modal: Add Task */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-6 sm:p-7 border border-white/20 shadow-2xl max-w-md w-full bg-white dark:bg-slate-900"
            >
              <h3 className="text-lg font-bold text-ink mb-4">
                {isArabic ? 'إضافة مهمة أو تكليف أكاديمي جديد' : 'Add New Academic Task'}
              </h3>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1.5">
                    {isArabic ? 'عنوان المهمة أو الواجب:' : 'Task / Assignment Title:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isArabic ? 'مثال: تسليم تقرير عملي لهياكل البيانات...' : 'e.g. Data Structures Project report...'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1.5">
                      {isArabic ? 'رمز المقرر:' : 'Course Code:'}
                    </label>
                    <select
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-ink"
                    >
                      <option value="ITCS2301">ITCS2301 (هياكل البيانات)</option>
                      <option value="ITIS2305">ITIS2305 (قواعد البيانات)</option>
                      <option value="ITSE3302">ITSE3302 (هندسة البرمجيات)</option>
                      <option value="ITCS3304">ITCS3304 (شبكات الحاسوب)</option>
                      <option value="ITWD3301">ITWD3301 (تطوير الويب)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1.5">
                      {isArabic ? 'الأولوية:' : 'Priority:'}
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-bold text-ink"
                    >
                      <option value="urgent">{isArabic ? 'عاجلة (Urgent)' : 'Urgent'}</option>
                      <option value="medium">{isArabic ? 'متوسطة (Medium)' : 'Medium'}</option>
                      <option value="normal">{isArabic ? 'عادية (Normal)' : 'Normal'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1.5">
                    {isArabic ? 'تاريخ التسليم المستهدف:' : 'Due Date:'}
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-mono text-ink"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-ink"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl btn-primary text-xs font-bold shadow-md shadow-royal-500/25"
                  >
                    {isArabic ? 'حفظ المهمة' : 'Save Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
