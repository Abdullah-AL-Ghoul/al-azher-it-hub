import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCalendar, 
  FiPlus, 
  FiTrash2, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiPrinter, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiRotateCcw,
  FiBookOpen,
  FiX,
  FiEdit2,
  FiDownload
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const DAYS = [
  { id: 'sat', nameAr: 'السبت', nameEn: 'Saturday', shortAr: 'س', shortEn: 'Sat' },
  { id: 'sun', nameAr: 'الأحد', nameEn: 'Sunday', shortAr: 'ح', shortEn: 'Sun' },
  { id: 'mon', nameAr: 'الإثنين', nameEn: 'Monday', shortAr: 'ن', shortEn: 'Mon' },
  { id: 'tue', nameAr: 'الثلاثاء', nameEn: 'Tuesday', shortAr: 'ث', shortEn: 'Tue' },
  { id: 'wed', nameAr: 'الأربعاء', nameEn: 'Wednesday', shortAr: 'ر', shortEn: 'Wed' },
  { id: 'thu', nameAr: 'الخميس', nameEn: 'Thursday', shortAr: 'خ', shortEn: 'Thu' },
]

const TIME_SLOTS = [
  { id: '08:00 - 09:30', labelAr: '08:00 - 09:30 ص', labelEn: '08:00 - 09:30 AM' },
  { id: '09:30 - 11:00', labelAr: '09:30 - 11:00 ص', labelEn: '09:30 - 11:00 AM' },
  { id: '11:00 - 12:30', labelAr: '11:00 - 12:30 م', labelEn: '11:00 - 12:30 PM' },
  { id: '12:30 - 14:00', labelAr: '12:30 - 02:00 م', labelEn: '12:30 - 02:00 PM' },
  { id: '14:00 - 15:30', labelAr: '02:00 - 03:30 م', labelEn: '02:00 - 03:30 PM' },
  { id: '15:30 - 17:00', labelAr: '03:30 - 05:00 م', labelEn: '03:30 - 05:00 PM' },
]

const COLOR_PALETTES = [
  { id: 'blue', name: 'أزرق ملكي', bg: 'bg-royal-500/15 border-royal-500/40 text-royal-700 dark:text-cyan-300', dot: 'bg-royal-500' },
  { id: 'emerald', name: 'زمردي', bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { id: 'violet', name: 'بنفسجي', bg: 'bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  { id: 'amber', name: 'كهرماني', bg: 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { id: 'rose', name: 'وردي', bg: 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { id: 'teal', name: 'فيروزي', bg: 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
]

export default function WeeklyScheduleBuilder({ activePlan, isArabic, t }) {
  // Saved Schedule slots
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_weekly_schedule')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      {
        id: 'init_1',
        courseCode: 'ITCS1401',
        courseName: isArabic ? 'مقدمة في الحوسبة' : 'Intro to Computing',
        room: isArabic ? 'قاعة 302' : 'Room 302',
        instructor: isArabic ? 'د. أحمد' : 'Dr. Ahmed',
        days: ['sun', 'tue'],
        timeSlot: '09:30 - 11:00',
        color: 'blue',
        hours: 4,
      },
      {
        id: 'init_2',
        courseCode: 'MATH1320',
        courseName: isArabic ? 'تفاضل وتكامل (1)' : 'Calculus (1)',
        room: isArabic ? 'مدرج القدس' : 'Al-Quds Hall',
        instructor: isArabic ? 'د. محمود' : 'Dr. Mahmoud',
        days: ['mon', 'wed'],
        timeSlot: '11:00 - 12:30',
        color: 'emerald',
        hours: 3,
      },
      {
        id: 'init_3',
        courseCode: 'ITCC1301',
        courseName: isArabic ? 'دوائر كهربائية (1)' : 'Electric Circuits (1)',
        room: isArabic ? 'مختبر هندسة 2' : 'Engineering Lab 2',
        instructor: isArabic ? 'م. خليل' : 'Eng. Khalil',
        days: ['sun', 'tue'],
        timeSlot: '12:30 - 14:00',
        color: 'violet',
        hours: 3,
      }
    ]
  })

  // Modal State for Adding/Editing an Entry
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form State
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formRoom, setFormRoom] = useState('')
  const [formInstructor, setFormInstructor] = useState('')
  const [formDays, setFormDays] = useState(['sun', 'tue'])
  const [formTimeSlot, setFormTimeSlot] = useState('09:30 - 11:00')
  const [formColor, setFormColor] = useState('blue')
  const [formHours, setFormHours] = useState(3)

  // Save to localStorage whenever entries change
  useEffect(() => {
    try {
      localStorage.setItem('al_azher_weekly_schedule', JSON.stringify(entries))
    } catch {}
  }, [entries])

  // Flat catalog of courses from activePlan for autocomplete / fast pick
  const planCourses = useMemo(() => {
    const list = []
    activePlan.curriculum.forEach(yr => {
      yr.semesters.forEach(sem => {
        sem.courses.forEach(c => {
          list.push({
            code: c.code,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            hours: c.hours,
            label: `${c.code} — ${isArabic ? c.nameAr : c.nameEn} (${c.hours}h)`
          })
        })
      })
    })
    return list
  }, [activePlan, isArabic])

  // Open modal for new entry
  const openNewEntry = () => {
    setEditingId(null)
    setFormCode('')
    setFormName('')
    setFormRoom('')
    setFormInstructor('')
    setFormDays(['sun', 'tue'])
    setFormTimeSlot('09:30 - 11:00')
    setFormColor('blue')
    setFormHours(3)
    setModalOpen(true)
  }

  // Open modal for editing
  const openEditEntry = (entry) => {
    setEditingId(entry.id)
    setFormCode(entry.courseCode)
    setFormName(entry.courseName)
    setFormRoom(entry.room)
    setFormInstructor(entry.instructor)
    setFormDays(entry.days)
    setFormTimeSlot(entry.timeSlot)
    setFormColor(entry.color || 'blue')
    setFormHours(entry.hours || 3)
    setModalOpen(true)
  }

  // Handle plan course quick pick
  const handleSelectPlanCourse = (e) => {
    const code = e.target.value
    if (!code) return
    const match = planCourses.find(c => c.code === code)
    if (match) {
      setFormCode(match.code)
      setFormName(isArabic ? match.nameAr : match.nameEn)
      setFormHours(match.hours)
    }
  }

  // Toggle single day
  const toggleDay = (dayId) => {
    setFormDays(prev => {
      if (prev.includes(dayId)) {
        if (prev.length <= 1) return prev // keep at least 1 day
        return prev.filter(d => d !== dayId)
      }
      return [...prev, dayId]
    })
  }

  // Set day preset
  const setDayPreset = (preset) => {
    if (preset === 'sun_tue') setFormDays(['sun', 'tue'])
    else if (preset === 'mon_wed') setFormDays(['mon', 'wed'])
    else if (preset === 'sun_tue_thu') setFormDays(['sun', 'tue', 'thu'])
    else if (preset === 'sat') setFormDays(['sat'])
  }

  // Save entry
  const handleSaveEntry = (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error(isArabic ? 'يرجى كتابة اسم المساق' : 'Please provide course name')
      return
    }

    if (editingId) {
      setEntries(prev => prev.map(item => item.id === editingId ? {
        ...item,
        courseCode: formCode.trim().toUpperCase(),
        courseName: formName.trim(),
        room: formRoom.trim(),
        instructor: formInstructor.trim(),
        days: formDays,
        timeSlot: formTimeSlot,
        color: formColor,
        hours: Number(formHours) || 3,
      } : item))
      toast.success(isArabic ? 'تم تحديث المحاضرة بنجاح' : 'Lecture updated')
    } else {
      const newEntry = {
        id: `slot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        courseCode: formCode.trim().toUpperCase(),
        courseName: formName.trim(),
        room: formRoom.trim(),
        instructor: formInstructor.trim(),
        days: formDays,
        timeSlot: formTimeSlot,
        color: formColor,
        hours: Number(formHours) || 3,
      }
      setEntries(prev => [...prev, newEntry])
      toast.success(isArabic ? 'تمت إضافة المحاضرة إلى الجدول' : 'Lecture added to timetable')
    }

    setModalOpen(false)
  }

  // Delete entry
  const handleDeleteEntry = (id) => {
    setEntries(prev => prev.filter(item => item.id !== id))
    toast.success(isArabic ? 'تم حذف المحاضرة من الجدول' : 'Lecture removed')
  }

  // Clear all
  const handleClearAll = () => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من تفريغ الجدول بالكامل؟' : 'Clear entire weekly schedule?')) {
      setEntries([])
      toast.success(isArabic ? 'تم تفريغ الجدول الأسبوعي' : 'Schedule cleared')
    }
  }

  // Conflict detection: map of `${day}-${timeSlot}` -> count
  const slotOccupancy = useMemo(() => {
    const map = new Map()
    entries.forEach(entry => {
      entry.days.forEach(day => {
        const key = `${day}-${entry.timeSlot}`
        const current = map.get(key) || []
        current.push(entry)
        map.set(key, current)
      })
    })
    return map
  }, [entries])

  // Count conflicts
  const totalConflicts = useMemo(() => {
    let count = 0
    slotOccupancy.forEach(items => {
      if (items.length > 1) count += 1
    })
    return count
  }, [slotOccupancy])

  // Stats
  const scheduleStats = useMemo(() => {
    const uniqueCourses = new Set(entries.map(e => e.courseCode || e.courseName)).size
    const totalCreditHours = entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0)
    
    // Attending days
    const activeDays = new Set()
    entries.forEach(e => e.days.forEach(d => activeDays.add(d)))
    const offDaysCount = DAYS.length - activeDays.size

    return {
      uniqueCourses,
      totalCreditHours,
      activeDaysCount: activeDays.size,
      offDaysCount,
    }
  }, [entries])

  return (
    <div className="space-y-8">
      {/* Schedule Top Hero & Quick Stats */}
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-royal-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-royal-500/20">
              <FiCalendar size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                <span>{isArabic ? 'صانع ومخطط الجدول الدراسي الأسبوعي' : 'Interactive Weekly Timetable Builder'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                  {scheduleStats.uniqueCourses} {isArabic ? 'مساقات' : 'courses'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                {isArabic
                  ? 'قم ببناء وتوزيع جدول محاضراتك الأسبوعي، فحص التعارض الزمني في القاعات، وتنزيل أو طباعة نسختك الرسمية.'
                  : 'Design your weekly timetable, prevent room or time clashes, and print or export your schedule.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={openNewEntry}
              className="flex items-center gap-1.5 px-4 py-2 bg-royal-600 hover:bg-royal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-royal-600/20 transition cursor-pointer"
            >
              <FiPlus size={15} />
              <span>{isArabic ? 'إضافة محاضرة جديدة' : 'Add Lecture'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 transition cursor-pointer"
            >
              <FiPrinter size={14} />
              <span>{isArabic ? 'طباعة / PDF' : 'Print / PDF'}</span>
            </button>

            {entries.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                title={isArabic ? 'تفريغ الجدول' : 'Clear schedule'}
              >
                <FiRotateCcw size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Conflict Warning if present */}
        {totalConflicts > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 text-xs font-bold animate-pulse">
            <FiAlertTriangle size={18} className="shrink-0" />
            <span>
              {isArabic
                ? `تنبيه: تم اكتشاف ${totalConflicts} تعارض في مواعيد المحاضرات بالقاعات! يرجى مراجعة الخانات المميزة باللون الأحمر.`
                : `Warning: Detected ${totalConflicts} lecture time/room clash! Please inspect highlighted red slots.`}
            </span>
          </div>
        )}

        {/* Schedule Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
            <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-0.5">
              {isArabic ? 'المساقات المسجلة' : 'Registered Courses'}
            </span>
            <span className="text-lg font-black text-ink tabular-nums">
              {scheduleStats.uniqueCourses}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
            <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-0.5">
              {isArabic ? 'الساعات المعتمدة' : 'Credit Hours'}
            </span>
            <span className="text-lg font-black text-emerald-500 tabular-nums">
              {scheduleStats.totalCreditHours} {isArabic ? 'ساعة' : 'hrs'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
            <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-0.5">
              {isArabic ? 'أيام الدوام الأسبوعي' : 'Weekly Study Days'}
            </span>
            <span className="text-lg font-black text-royal-600 dark:text-cyan-400 tabular-nums">
              {scheduleStats.activeDaysCount} {isArabic ? 'أيام' : 'days'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-line text-center">
            <span className="text-[11px] text-slate-500 dark:text-white/50 block mb-0.5">
              {isArabic ? 'أيام العطلة / الفراغ' : 'Off Days'}
            </span>
            <span className="text-lg font-black text-amber-500 tabular-nums">
              {scheduleStats.offDaysCount} {isArabic ? 'أيام' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Weekly Timetable Grid */}
      <div className="glass rounded-2xl border border-white/10 shadow-xl overflow-hidden p-3 sm:p-5">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse min-w-[700px] text-start">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="p-3 text-start text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider w-28">
                  {isArabic ? 'الفترة / اليوم' : 'Time / Day'}
                </th>
                {DAYS.map(day => (
                  <th key={day.id} className="p-3 text-center text-xs font-bold text-ink border-s border-slate-200 dark:border-white/5">
                    <span className="block text-xs sm:text-sm font-extrabold">{isArabic ? day.nameAr : day.nameEn}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({day.id.toUpperCase()})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
              {TIME_SLOTS.map(slot => (
                <tr key={slot.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                  {/* Time Header Column */}
                  <td className="p-2 sm:p-3 font-mono font-bold text-[11px] text-slate-500 dark:text-white/60 bg-slate-50/70 dark:bg-white/[0.02] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FiClock size={12} className="text-slate-400" />
                      <span>{isArabic ? slot.labelAr : slot.labelEn}</span>
                    </div>
                  </td>

                  {/* Days Columns */}
                  {DAYS.map(day => {
                    const key = `${day.id}-${slot.id}`
                    const slotEntries = slotOccupancy.get(key) || []
                    const hasConflict = slotEntries.length > 1

                    return (
                      <td
                        key={day.id}
                        className={`p-1.5 sm:p-2 border-s border-slate-200 dark:border-white/5 align-top min-h-[90px] transition-colors ${
                          hasConflict ? 'bg-rose-500/10' : ''
                        }`}
                      >
                        {slotEntries.length === 0 ? (
                          <div className="h-full min-h-[70px] rounded-xl border border-dashed border-transparent hover:border-slate-300 dark:hover:border-white/10 flex items-center justify-center group transition cursor-pointer"
                            onClick={() => {
                              openNewEntry()
                              setFormDays([day.id])
                              setFormTimeSlot(slot.id)
                            }}
                          >
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-semibold flex items-center gap-1 transition">
                              <FiPlus size={12} />
                              {isArabic ? 'إضافة' : 'Add'}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {hasConflict && (
                              <div className="p-1 rounded bg-rose-500 text-white text-[9px] font-bold text-center flex items-center justify-center gap-1">
                                <FiAlertTriangle size={10} />
                                {isArabic ? 'تعارض زمني!' : 'Clash!'}
                              </div>
                            )}

                            {slotEntries.map(entry => {
                              const palette = COLOR_PALETTES.find(p => p.id === entry.color) || COLOR_PALETTES[0]

                              return (
                                <div
                                  key={entry.id}
                                  className={`p-2 sm:p-2.5 rounded-xl border shadow-sm transition hover:shadow-md relative group flex flex-col justify-between gap-1 ${palette.bg}`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      {entry.courseCode && (
                                        <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                                          {entry.courseCode}
                                        </span>
                                      )}
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                          type="button"
                                          onClick={() => openEditEntry(entry)}
                                          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-white"
                                          title={isArabic ? 'تعديل' : 'Edit'}
                                        >
                                          <FiEdit2 size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteEntry(entry.id)}
                                          className="p-1 rounded hover:bg-rose-500/20 text-rose-500"
                                          title={isArabic ? 'حذف' : 'Delete'}
                                        >
                                          <FiTrash2 size={11} />
                                        </button>
                                      </div>
                                    </div>

                                    <h4 className="font-bold text-xs leading-snug line-clamp-2">
                                      {entry.courseName}
                                    </h4>
                                  </div>

                                  <div className="space-y-0.5 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] opacity-80">
                                    {entry.room && (
                                      <div className="flex items-center gap-1">
                                        <FiMapPin size={10} className="shrink-0" />
                                        <span className="truncate">{entry.room}</span>
                                      </div>
                                    )}
                                    {entry.instructor && (
                                      <div className="flex items-center gap-1">
                                        <FiUser size={10} className="shrink-0" />
                                        <span className="truncate">{entry.instructor}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Lecture Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-line rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                    <FiCalendar size={18} />
                  </span>
                  <h3 className="font-bold text-ink text-base">
                    {editingId ? (isArabic ? 'تعديل المحاضرة' : 'Edit Lecture') : (isArabic ? 'إضافة محاضرة جديدة للجدول' : 'Add New Lecture')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-ink transition"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-4 text-start">
                {/* Fast Course Select from Plan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">
                    {isArabic ? 'اختيار سريع من مساقات خطتك المعتمدة:' : 'Pick from your study plan:'}
                  </label>
                  <select
                    onChange={handleSelectPlanCourse}
                    className="input-spatial w-full px-3 py-2 rounded-xl text-xs text-ink cursor-pointer focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {isArabic ? '-- اختر مساقاً لملء البيانات تلقائياً --' : '-- Select course to autofill --'}
                    </option>
                    {planCourses.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Name & Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">
                      {isArabic ? 'اسم المساق *' : 'Course Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={isArabic ? 'مثال: معمارية الحاسوب' : 'e.g. Computer Architecture'}
                      className="input-spatial w-full px-3 py-2 rounded-xl text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">
                      {isArabic ? 'كود المساق' : 'Code'}
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="ITCS2301"
                      className="input-spatial w-full px-3 py-2 rounded-xl text-xs text-ink font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Room & Instructor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">
                      {isArabic ? 'القاعة / المختبر' : 'Room / Lab'}
                    </label>
                    <input
                      type="text"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      placeholder={isArabic ? 'قاعة 204 / مختبر 3' : 'Room 204 / Lab 3'}
                      className="input-spatial w-full px-3 py-2 rounded-xl text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">
                      {isArabic ? 'المحاضر / الدكتور' : 'Instructor'}
                    </label>
                    <input
                      type="text"
                      value={formInstructor}
                      onChange={(e) => setFormInstructor(e.target.value)}
                      placeholder={isArabic ? 'د. فلان' : 'Dr. Smith'}
                      className="input-spatial w-full px-3 py-2 rounded-xl text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1">
                    {isArabic ? 'فترة المحاضرة (الوقت) *' : 'Lecture Time Slot *'}
                  </label>
                  <select
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value)}
                    className="input-spatial w-full px-3 py-2 rounded-xl text-xs text-ink font-bold cursor-pointer focus:outline-none"
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {isArabic ? slot.labelAr : slot.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days Selection & Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-white/70">
                      {isArabic ? 'أيام المحاضرة *' : 'Lecture Days *'}
                    </label>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDayPreset('sun_tue')}
                        className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:text-royal-500 transition"
                      >
                        {isArabic ? 'ح / ث' : 'Sun/Tue'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayPreset('mon_wed')}
                        className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:text-royal-500 transition"
                      >
                        {isArabic ? 'ن / ر' : 'Mon/Wed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayPreset('sun_tue_thu')}
                        className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:text-royal-500 transition"
                      >
                        {isArabic ? 'ح / ث / خ' : 'Sun/Tue/Thu'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-1.5">
                    {DAYS.map(day => {
                      const isSelected = formDays.includes(day.id)
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 border ${
                            isSelected
                              ? 'bg-royal-600 text-white border-royal-600 shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 border-transparent text-slate-600 dark:text-white/60 hover:bg-black/10'
                          }`}
                        >
                          <span>{isArabic ? day.shortAr : day.shortEn}</span>
                          <span className="text-[9px] font-normal opacity-80">{isArabic ? day.nameAr.slice(0, 3) : day.id.slice(0, 2)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color Badge Palette */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">
                    {isArabic ? 'لون تمييز المحاضرة في الجدول:' : 'Badge Color Tag:'}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PALETTES.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormColor(p.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${p.dot} ${
                          formColor === p.id ? 'ring-2 ring-offset-2 ring-royal-500 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={p.name}
                      >
                        {formColor === p.id && <span className="text-white text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-royal-600 hover:bg-royal-500 text-white shadow-md shadow-royal-600/20 transition cursor-pointer"
                  >
                    {editingId ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إضافة إلى الجدول' : 'Add to Schedule')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
