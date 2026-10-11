import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiUser, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiSun, 
  FiCoffee 
} from 'react-icons/fi'

const DAY_MAP = {
  0: { id: 'sun', nameAr: 'الأحد', nameEn: 'Sunday' },
  1: { id: 'mon', nameAr: 'الإثنين', nameEn: 'Monday' },
  2: { id: 'tue', nameAr: 'الثلاثاء', nameEn: 'Tuesday' },
  3: { id: 'wed', nameAr: 'الأربعاء', nameEn: 'Wednesday' },
  4: { id: 'thu', nameAr: 'الخميس', nameEn: 'Thursday' },
  5: { id: 'fri', nameAr: 'الجمعة', nameEn: 'Friday' }, // Weekend
  6: { id: 'sat', nameAr: 'السبت', nameEn: 'Saturday' },
}

export default function TodayScheduleWidget({ isArabic, t }) {
  const [scheduleEntries, setScheduleEntries] = useState([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('al_azher_weekly_schedule')
      if (saved) setScheduleEntries(JSON.parse(saved))
    } catch {}
  }, [])

  const currentDayInfo = useMemo(() => {
    const dayIndex = new Date().getDay()
    return DAY_MAP[dayIndex] || DAY_MAP[0]
  }, [])

  const isFriday = currentDayInfo.id === 'fri'

  // Filter lectures that fall on today
  const todayLectures = useMemo(() => {
    if (isFriday) return []
    const list = scheduleEntries.filter(entry => 
      Array.isArray(entry.days) && entry.days.includes(currentDayInfo.id)
    )
    // Sort chronologically by time slot start
    return list.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''))
  }, [scheduleEntries, currentDayInfo, isFriday])

  return (
    <div className="glass rounded-2xl p-5 md:p-6 border border-white/10 relative overflow-hidden bg-gradient-to-br from-royal-500/5 via-teal-500/5 to-transparent">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-royal-600/20">
            <FiCalendar size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink text-sm sm:text-base">
                {isArabic ? `محاضرات اليوم (${currentDayInfo.nameAr})` : `Today's Schedule (${currentDayInfo.nameEn})`}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400">
                {todayLectures.length} {isArabic ? 'محاضرات' : 'classes'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-white/40">
              {isArabic ? 'مواعيد وقاعات محاضراتك لليوم مباشرة من جدولك الدراسي' : 'Live daily class schedule from your timetable'}
            </p>
          </div>
        </div>

        <Link
          to="/study-plan?tab=schedule"
          className="text-xs font-bold text-royal-600 dark:text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>{isArabic ? 'الجدول الكامل' : 'Full Timetable'}</span>
          <FiArrowLeft size={13} className={isArabic ? '' : 'rotate-180'} />
        </Link>
      </div>

      {/* Main Content */}
      <div className="pt-4">
        {isFriday ? (
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-line text-center flex items-center justify-center gap-3">
            <FiCoffee className="text-amber-500" size={24} />
            <div className="text-start">
              <p className="text-xs font-bold text-ink">
                {isArabic ? 'اليوم الجمعة، عطلة نهاية الأسبوع الرسمية!' : 'Happy Friday! Official Weekend Holiday.'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-white/40">
                {isArabic ? 'لا توجد محاضرات جامعية اليوم. استمتع بوقتك أو راجع مقرراتك.' : 'No university lectures scheduled today.'}
              </p>
            </div>
          </div>
        ) : todayLectures.length === 0 ? (
          <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <FiSun size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">
                  {isArabic ? 'ليس لديك أي محاضرات مقررة اليوم!' : 'No lectures scheduled for today!'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-white/40">
                  {scheduleEntries.length === 0
                    ? (isArabic ? 'لم تقم بإضافة محاضراتك إلى الجدول الأسبوعي بعد.' : 'You have not populated your weekly schedule yet.')
                    : (isArabic ? 'اليوم يوم فراغ دراسي حسب جدولك المعتمد.' : 'Today is an off day according to your timetable.')}
                </p>
              </div>
            </div>

            <Link
              to="/study-plan?tab=schedule"
              className="px-3.5 py-1.5 rounded-xl bg-royal-600 text-white text-xs font-semibold hover:bg-royal-500 transition shadow-sm shrink-0"
            >
              {scheduleEntries.length === 0 ? (isArabic ? 'تجهيز جدولي الآن' : 'Setup Schedule') : (isArabic ? 'تعديل الجدول' : 'Edit Schedule')}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayLectures.map(lecture => (
              <div
                key={lecture.id}
                className="p-3.5 rounded-xl bg-white/70 dark:bg-white/5 border border-line shadow-sm flex flex-col justify-between gap-2.5 hover:border-royal-500/30 transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    {lecture.courseCode && (
                      <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                        {lecture.courseCode}
                      </span>
                    )}
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-white/60 flex items-center gap-1">
                      <FiClock size={11} className="text-slate-400" />
                      <span>{lecture.timeSlot}</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-ink leading-snug">
                    {lecture.courseName}
                  </h4>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50">
                  {lecture.room ? (
                    <span className="flex items-center gap-1 truncate font-medium">
                      <FiMapPin size={11} className="text-royal-500" />
                      <span className="truncate">{lecture.room}</span>
                    </span>
                  ) : <span />}

                  {lecture.instructor && (
                    <span className="flex items-center gap-1 truncate text-slate-400">
                      <FiUser size={11} />
                      <span className="truncate">{lecture.instructor}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
