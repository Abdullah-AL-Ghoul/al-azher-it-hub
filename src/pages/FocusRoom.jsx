import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { ambientAudio } from '../utils/ambientAudio'
import { getAcademicPlan } from '../data/academicCurriculum'
import { 
  FiPlay, 
  FiPause, 
  FiRotateCcw, 
  FiVolume2, 
  FiVolumeX, 
  FiMaximize2, 
  FiMinimize2, 
  FiCheckCircle, 
  FiPlus, 
  FiTrash2, 
  FiClock, 
  FiHeadphones, 
  FiCheck,
  FiBookOpen,
  FiZap
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const TIMER_MODES = {
  pomodoro: { id: 'pomodoro', minutes: 25, labelAr: 'جلسة تركيز', labelEn: 'Focus Session', color: 'from-royal-600 to-cyan-500' },
  shortBreak: { id: 'shortBreak', minutes: 5, labelAr: 'استراحة قصيرة', labelEn: 'Short Break', color: 'from-emerald-600 to-teal-500' },
  longBreak: { id: 'longBreak', minutes: 15, labelAr: 'استراحة طويلة', labelEn: 'Long Break', color: 'from-violet-600 to-indigo-500' },
}

const SOUNDSCAPES = [
  { id: 'off', labelAr: 'صامت', labelEn: 'Muted', icon: FiVolumeX },
  { id: 'rain', labelAr: 'مطر هادئ', labelEn: 'Gentle Rain', icon: FiHeadphones },
  { id: 'whitenoise', labelAr: 'هدوء المكتبة', labelEn: 'Library Silence', icon: FiBookOpen },
  { id: 'waves', labelAr: 'أمواج البحر', labelEn: 'Ocean Waves', icon: FiZap },
]

export default function FocusRoom() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  // Timer state
  const [activeMode, setActiveMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [activeSound, setActiveSound] = useState('off')
  const [volume, setVolume] = useState(0.5)
  const [isZenMode, setIsZenMode] = useState(false)

  // Associated course
  const activePlanId = useMemo(() => {
    try {
      return localStorage.getItem('al_azher_active_major_plan') || 'cse-2025'
    } catch {
      return 'cse-2025'
    }
  }, [])

  const plan = useMemo(() => getAcademicPlan(activePlanId), [activePlanId])
  const courseOptions = useMemo(() => {
    const list = []
    plan.curriculum?.forEach((yr) => {
      yr.semesters?.forEach((sem) => {
        sem.courses?.forEach((c) => {
          list.push({ id: c.id, code: c.code, name: isArabic ? c.nameAr : c.nameEn })
        })
      })
    })
    return list
  }, [plan, isArabic])

  const [selectedCourse, setSelectedCourse] = useState('')

  // Tasks state
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_focus_tasks')
      return saved ? JSON.parse(saved) : [
        { id: '1', text: isArabic ? 'مراجعة شيت الأسئلة والأمثلة البرمجية' : 'Review exercise sheet and code samples', done: false },
        { id: '2', text: isArabic ? 'تدوين الملاحظات الهامة في دفتر المساق' : 'Summarize key lecture takeaways in notes', done: true },
      ]
    } catch {
      return []
    }
  })
  const [newTaskInput, setNewTaskInput] = useState('')

  // Stats state
  const [stats, setStats] = useState(() => {
    try {
      const key = `al_azher_focus_stats_${new Date().toISOString().slice(0, 10)}`
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : { completedSessions: 0, totalMinutes: 0 }
    } catch {
      return { completedSessions: 0, totalMinutes: 0 }
    }
  })

  // Sync tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('al_azher_focus_tasks', JSON.stringify(tasks))
    } catch (_e) {
      // ignore
    }
  }, [tasks])

  // Timer interval
  useEffect(() => {
    let interval = null
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      // Completed session
      setIsRunning(false)
      ambientAudio.playChime()

      if (activeMode === 'pomodoro') {
        const addedMinutes = Math.round(duration / 60)
        setStats((prev) => {
          const next = {
            completedSessions: prev.completedSessions + 1,
            totalMinutes: prev.totalMinutes + addedMinutes,
          }
          try {
            const key = `al_azher_focus_stats_${new Date().toISOString().slice(0, 10)}`
            localStorage.setItem(key, JSON.stringify(next))
          } catch (_e) {
            // ignore
          }
          return next
        })
        toast.success(
          isArabic
            ? '🎉 أحسنت! انتهت جلسة التركيز بنجاح. خذ استراحة قصيرة الآن.'
            : '🎉 Great job! Focus session completed. Take a short break.'
        )
      } else {
        toast.success(
          isArabic
            ? 'انتهت الاستراحة! هل أنت مستعد للعودة إلى جلسة التركيز التالية؟'
            : 'Break is over! Ready for your next focus session?'
        )
      }
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft, activeMode, duration, isArabic])

  // Soundscape switcher
  useEffect(() => {
    if (activeSound === 'off' || !isRunning) {
      ambientAudio.stop()
    } else {
      ambientAudio.play(activeSound)
      ambientAudio.setVolume(volume)
    }
    return () => ambientAudio.stop()
  }, [activeSound, isRunning, volume])

  const switchMode = (modeId) => {
    const mode = TIMER_MODES[modeId]
    setActiveMode(modeId)
    setIsRunning(false)
    const secs = mode.minutes * 60
    setDuration(secs)
    setTimeLeft(secs)
  }

  const toggleTimer = () => {
    setIsRunning((prev) => !prev)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(duration)
  }

  const addTask = () => {
    if (!newTaskInput.trim()) return
    const newTask = {
      id: Date.now().toString(),
      text: newTaskInput.trim(),
      done: false,
    }
    setTasks((prev) => [newTask, ...prev])
    setNewTaskInput('')
  }

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // Format time mm:ss
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progressPct = ((duration - timeLeft) / duration) * 100

  return (
    <div className={`min-h-screen py-10 transition-colors duration-500 ${isZenMode ? 'fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-center px-4 overflow-y-auto' : 'pt-24'}`}>
      <div className="container-page max-w-5xl mx-auto space-y-8">
        
        {/* Header Banner */}
        {!isZenMode && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-500/10 text-royal-600 dark:text-cyan-400 text-xs font-bold mb-2">
                <FiZap size={14} />
                <span>{isArabic ? 'غرفة التركيز وبومودورو الجامعي' : 'Academic Focus & Pomodoro Room'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {isArabic ? 'مقر المذاكرة والإنتاجية' : 'Study & Productivity Hub'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
                {isArabic 
                  ? 'نظّم وقت دراستك مع مؤقت بومودورو الذكي وأصوات الطبيعة المحيطية دون تشتيت.' 
                  : 'Boost your focus with smart intervals and calming synthesizers.'}
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-royal-500/15 text-accent dark:text-cyan-400 flex items-center justify-center font-bold">
                  <FiClock size={18} />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-white/50">{isArabic ? 'جلسات اليوم' : "Today's Sessions"}</div>
                  <div className="text-sm font-extrabold text-ink tabular-nums">
                    {stats.completedSessions} <span className="text-[11px] font-normal text-slate-400">({stats.totalMinutes} {isArabic ? 'دقيقة' : 'mins'})</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsZenMode(true)}
                className="p-3 rounded-2xl glass hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 transition"
                title={isArabic ? 'وضع التركيز الكامل (Zen Mode)' : 'Fullscreen Zen Mode'}
                aria-label="Zen Mode"
              >
                <FiMaximize2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Zen Mode Exit button */}
        {isZenMode && (
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs text-white/50">{isArabic ? 'وضع التركيز الخالي من التشتيت (Zen)' : 'Distraction-free Zen Mode'}</span>
            <button
              type="button"
              onClick={() => setIsZenMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              <FiMinimize2 size={14} />
              <span>{isArabic ? 'خروج من الوضع الكامل' : 'Exit Zen Mode'}</span>
            </button>
          </div>
        )}

        {/* Grid Layout: Timer Center + Controls & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Timer Display (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass rounded-3xl p-6 sm:p-10 border border-white/10 text-center relative overflow-hidden shadow-2xl">
              
              {/* Radial background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-royal-500/10 via-transparent to-cyan-500/5 pointer-events-none" />

              {/* Mode Switcher Tabs */}
              <div className="inline-flex p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-8 relative z-10 max-w-full overflow-x-auto">
                {Object.values(TIMER_MODES).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => switchMode(mode.id)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      activeMode === mode.id
                        ? 'bg-royal-600 text-white shadow-lg shadow-royal-600/30'
                        : 'text-slate-600 dark:text-white/70 hover:text-ink'
                    }`}
                  >
                    {isArabic ? mode.labelAr : mode.labelEn}
                  </button>
                ))}
              </div>

              {/* Large Clock Counter */}
              <div className="relative my-4 z-10 flex flex-col items-center justify-center">
                <div className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-ink tabular-nums select-none drop-shadow-sm">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>

                {/* Linear Progress Bar */}
                <div className="w-full max-w-md h-2 rounded-full bg-black/5 dark:bg-white/10 mt-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-royal-500 to-cyan-400 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Associated Course Selector */}
              <div className="relative z-10 max-w-sm mx-auto mb-8 mt-4">
                <label htmlFor="focus-course-select" className="sr-only">
                  {isArabic ? 'المساق الجاري دراسته' : 'Subject'}
                </label>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60 mb-1.5 justify-center">
                  <FiBookOpen size={13} />
                  <span>{isArabic ? 'المساق قيد المذاكرة حالياً:' : 'Active study course:'}</span>
                </div>
                <select
                  id="focus-course-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="input-spatial w-full text-xs font-semibold px-3 py-2 rounded-xl text-ink focus:outline-none text-center"
                >
                  <option value="">{isArabic ? '— عام / مذاكرة عامة —' : '— General Study —'}</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-center gap-4 relative z-10">
                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-4 rounded-2xl glass hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 transition"
                  title={isArabic ? 'إعادة ضبط المؤقت' : 'Reset timer'}
                  aria-label="Reset"
                >
                  <FiRotateCcw size={20} />
                </button>

                <button
                  type="button"
                  onClick={toggleTimer}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-royal-600 to-cyan-500 text-white font-extrabold text-lg shadow-xl shadow-royal-600/25 hover:opacity-95 active:scale-95 transition flex items-center gap-3 min-w-[170px] justify-center"
                >
                  {isRunning ? <FiPause size={22} /> : <FiPlay size={22} />}
                  <span>{isRunning ? (isArabic ? 'إيقاف مؤقت' : 'Pause') : (isArabic ? 'بدء التركيز' : 'Start Focus')}</span>
                </button>
              </div>
            </div>

            {/* Ambient Soundscapes Card */}
            <div className="glass rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <FiHeadphones className="text-royal-500 dark:text-cyan-400" size={17} />
                  <span>{isArabic ? 'الأصوات المحيطية المساعدة على التركيز (Ambient Audio)' : 'Ambient Focus Soundscapes'}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-white/50">
                  {isArabic ? 'صوت توليدي محلي خفيف' : 'Low-bandwidth Audio'}
                </span>
              </div>

              {/* Sound choices buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SOUNDSCAPES.map((snd) => {
                  const Icon = snd.icon
                  const active = activeSound === snd.id
                  return (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => setActiveSound(snd.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition ${
                        active
                          ? 'bg-royal-500/15 border-royal-500/30 text-accent dark:text-cyan-400 shadow-sm'
                          : 'glass border-white/5 text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{isArabic ? snd.labelAr : snd.labelEn}</span>
                    </button>
                  )
                })}
              </div>

              {/* Volume Slider */}
              {activeSound !== 'off' && (
                <div className="flex items-center gap-3 pt-2">
                  <FiVolume2 size={16} className="text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-royal-600 h-1.5 rounded-lg bg-black/10 dark:bg-white/10"
                    aria-label={isArabic ? 'مستوى صوت المؤثرات' : 'Sound volume'}
                  />
                  <span className="text-xs font-mono font-bold text-slate-500 w-8 text-end">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Session Goals & Tasks (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  <FiCheckCircle className="text-emerald-500" size={17} />
                  <span>{isArabic ? 'أهداف جلسة اليوم' : 'Session Micro-Goals'}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {tasks.filter((t) => t.done).length}/{tasks.length}
                </span>
              </div>

              {/* Add Task Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTask()
                    }
                  }}
                  placeholder={isArabic ? 'اكتب هدف الجلسة...' : 'Add session goal...'}
                  className="input-spatial flex-1 text-xs px-3.5 py-2 rounded-xl text-ink placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addTask}
                  disabled={!newTaskInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-royal-600 text-white text-xs font-bold hover:bg-royal-500 disabled:opacity-40 transition"
                >
                  <FiPlus size={16} />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {isArabic ? 'لا توجد أهداف مسجلة بعد. أضف هدفك لتبدأ!' : 'No goals yet. Add one to stay focused!'}
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-2xl transition border ${
                        task.done
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-400 line-through'
                          : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-ink'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                          task.done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-white/30 hover:border-emerald-500'
                        }`}
                        aria-label="Toggle goal"
                      >
                        {task.done && <FiCheck size={12} />}
                      </button>

                      <span
                        onClick={() => toggleTask(task.id)}
                        className="flex-1 text-xs font-medium cursor-pointer select-none"
                      >
                        {task.text}
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 opacity-60 hover:opacity-100 transition"
                        aria-label="Delete goal"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Motivational Tip */}
              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-white/60">
                <FiZap className="text-amber-500 shrink-0 mt-0.5" size={14} />
                <span>
                  {isArabic
                    ? 'نصيحة: تقسيم المذاكرة إلى جلسات 25 دقيقة يعزز استيعاب المفاهيم البرمجية الصعبة بنسبة 40%.'
                    : 'Tip: 25-minute sprints enhance retention of complex CS concepts by up to 40%.'}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
