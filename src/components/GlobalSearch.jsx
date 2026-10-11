import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getAdditions } from '../services'
import { modalOverlay, modalContent } from '../utils/motionTokens'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { 
  FiSearch, 
  FiFileText, 
  FiGrid, 
  FiHeart, 
  FiArrowRight, 
  FiX, 
  FiBookOpen, 
  FiLayers, 
  FiZap, 
  FiCheckCircle,
  FiCompass,
  FiClock,
  FiAward
} from 'react-icons/fi'
import { FaCalculator } from 'react-icons/fa'
import LectureThumbnail from './shared/LectureThumbnail'
import { lectureVideoId } from '../utils/helpers'
import { ACADEMIC_PLANS } from '../data/academicCurriculum'

// Build unified catalog of courses from all 6 accredited plans
const ALL_ACADEMIC_COURSES = []
const seenCourseKeys = new Set()

ACADEMIC_PLANS.forEach(plan => {
  plan.curriculum.forEach(yr => {
    yr.semesters.forEach(sem => {
      sem.courses.forEach(c => {
        const key = `${plan.id}-${c.code}`
        if (!seenCourseKeys.has(key)) {
          seenCourseKeys.add(key)
          ALL_ACADEMIC_COURSES.push({
            type: 'course',
            id: c.id,
            code: c.code,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            hours: c.hours,
            courseType: c.type,
            planId: plan.id,
            planNameAr: plan.nameAr,
            planNameEn: plan.nameEn,
            planNumber: plan.planNumber,
          })
        }
      })
    })
  })
})

const navPages = [
  { to: '/home', keys: ['home', 'الرئيسية'] },
  { to: '/lectures', keys: ['lectures', 'محاضرات'] },
  { to: '/sources', keys: ['sources', 'مصادر', 'كتب', 'ملازم'] },
  { to: '/study-plan', keys: ['study plan', 'خطة دراسية', 'الخطة الدراسية'] },
  { to: '/roadmap', keys: ['roadmap', 'مسار', 'المسار الدراسي', 'شجرة المواد'] },
  { to: '/additions', keys: ['additions', 'إضافات'] },
  { to: '/contact', keys: ['contact', 'تواصل', 'الدعم'] },
  { to: '/profile', keys: ['profile', 'ملفي', 'الملف الشخصي', 'كشف الدرجات'] },
]

const typeIcons = {
  course: FiBookOpen,
  plan: FiLayers,
  action: FiZap,
  lecture: FiFileText,
  source: FiGrid,
  addition: FiHeart,
  page: FiArrowRight,
}

const typeColors = {
  course: 'from-sky-500 to-sky-600',
  plan: 'from-emerald-500 to-emerald-600',
  action: 'from-amber-500 to-amber-600',
  lecture: 'from-violet-500 to-violet-600',
  source: 'from-orange-500 to-orange-600',
  addition: 'from-rose-500 to-rose-600',
  page: 'from-cyan-500 to-cyan-600',
}

export default function GlobalSearch({ autoOpen = false }) {
  const { lang, t, toggleLang } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isArabic = lang === 'ar'

  const [open, setOpen] = useState(!!autoOpen)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const searchSeq = useRef(0)
  const datasetRef = useRef(null)
  const panelRef = useFocusTrap(open)

  const openModal = useCallback(() => {
    setOpen(true)
    setQuery('')
    setResults([])
    setActiveIndex(0)
    setLoading(false)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIndex(0)
    setLoading(false)
    searchSeq.current += 1
  }, [])

  // Listen to Ctrl/Cmd + K and custom open event
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) closeModal()
        else openModal()
      }
    }
    const onCustomOpen = () => openModal()

    window.addEventListener('keydown', onKey)
    window.addEventListener('al_azher_open_search', onCustomOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('al_azher_open_search', onCustomOpen)
    }
  }, [open, openModal, closeModal])

  useEffect(() => {
    if (!open) return
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 80)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(focusTimer)
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeModal])

  // Quick Action recommendations for zero-state
  const quickActions = useMemo(() => [
    {
      type: 'action',
      title: isArabic ? 'حاسبة المعدل الأكاديمي التراكمي' : 'GPA Calculator',
      subtitle: isArabic ? 'حساب المعدل الفصلي والتراكمي حسب نظام جامعة الأزهر' : 'Compute term and cumulative GPA',
      to: '/study-plan?tab=calculator',
      icon: FaCalculator,
    },
    {
      type: 'action',
      title: isArabic ? 'أرشيف الامتحانات السابقة المعتمدة' : 'Past Exams Archive',
      subtitle: isArabic ? 'نماذج امتحانات نصفية ونهائية مع الحلول النموذجية' : 'Midterm and final past exams repository',
      to: '/sources?examOnly=true',
      icon: FiCheckCircle,
    },
    {
      type: 'action',
      title: isArabic ? 'شجرة المسار والمتطلبات السابقة' : 'Course Roadmap & Tree',
      subtitle: isArabic ? 'مخطط العلاقات بين المساقات وسلاسل فتح المواد' : 'Interactive 4-year prerequisite tree',
      to: '/roadmap',
      icon: FiCompass,
    },
    {
      type: 'action',
      title: isArabic ? 'مخطط الجدول الدراسي الأسبوعي' : 'Weekly Timetable Builder',
      subtitle: isArabic ? 'بناء وتوزيع جدول المحاضرات الأسبوعي وفحص التعارض الزمني' : 'Build lecture schedule and detect time conflicts',
      to: '/study-plan?tab=schedule',
      icon: FiClock,
    },
    {
      type: 'action',
      title: isArabic ? 'تقرير الإنجاز الأكاديمي المطبوع' : 'Printable Degree Report',
      subtitle: isArabic ? 'كشف تفصيلي بالمساقات المنجزة والمعدل التقديري' : 'Official degree progress transcript',
      to: '/profile?report=true',
      icon: FiAward,
    },
  ], [isArabic])

  const performSearch = useCallback(async (q) => {
    const seq = ++searchSeq.current
    const rawTrimmed = q.trim()
    if (!rawTrimmed) {
      setResults([])
      setActiveIndex(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const lower = rawTrimmed.toLowerCase()
      const items = []

      // 1. Search in Accredited Academic Courses (Instant local match)
      ALL_ACADEMIC_COURSES.forEach(course => {
        const matchesCode = course.code.toLowerCase().includes(lower)
        const matchesAr = course.nameAr.toLowerCase().includes(lower)
        const matchesEn = course.nameEn.toLowerCase().includes(lower)

        if (matchesCode || matchesAr || matchesEn) {
          items.push({
            type: 'course',
            id: course.id,
            code: course.code,
            title: isArabic ? `${course.code} — ${course.nameAr}` : `${course.code} — ${course.nameEn}`,
            subtitle: `${course.hours} ${isArabic ? 'ساعات معتمدة' : 'credit hrs'} • ${isArabic ? course.planNameAr : course.planNameEn} (#${course.planNumber})`,
            planId: course.planId,
            nameAr: course.nameAr,
          })
        }
      })

      // 2. Search in Accredited Degree Plans
      ACADEMIC_PLANS.forEach(plan => {
        const matchesAr = plan.nameAr.toLowerCase().includes(lower)
        const matchesEn = plan.nameEn.toLowerCase().includes(lower)
        const matchesNum = plan.planNumber.includes(lower)
        const matchesDept = plan.departmentAr.toLowerCase().includes(lower) || plan.departmentEn.toLowerCase().includes(lower)

        if (matchesAr || matchesEn || matchesNum || matchesDept) {
          items.push({
            type: 'plan',
            id: plan.id,
            planId: plan.id,
            title: isArabic ? plan.nameAr : plan.nameEn,
            subtitle: `${isArabic ? `خطة معتمدة رقم ${plan.planNumber}` : `Accredited Plan #${plan.planNumber}`} • ${isArabic ? plan.departmentAr : plan.departmentEn}`,
          })
        }
      })

      // 3. Search Quick Actions (e.g. "امتحان", "معدل", "شجرة")
      quickActions.forEach(qa => {
        if (qa.title.toLowerCase().includes(lower) || qa.subtitle.toLowerCase().includes(lower)) {
          items.push(qa)
        }
      })

      // Past exam instant intent
      if (['امتحان', 'امتحانات', 'نصفي', 'نهائي', 'فاينل', 'ميد', 'exam', 'midterm', 'final'].some(k => lower.includes(k))) {
        if (!items.some(it => it.to === '/sources?examOnly=true')) {
          items.unshift({
            type: 'action',
            title: isArabic ? 'تصفية أرشيف الامتحانات السابقة مباشرة' : 'Filter Past Exams Repository',
            subtitle: isArabic ? 'عرض كافة نماذج الامتحانات النصفية والنهائية المعتمدة' : 'Show all accredited midterms & finals',
            to: '/sources?examOnly=true',
            icon: FiCheckCircle,
          })
        }
      }

      // Schedule timetable instant intent
      if (['جدول', 'جدولي', 'مواعيد', 'schedule', 'timetable'].some(k => lower.includes(k))) {
        if (!items.some(it => it.to === '/study-plan?tab=schedule')) {
          items.unshift({
            type: 'action',
            title: isArabic ? 'فتح مخطط الجدول الدراسي الأسبوعي' : 'Open Weekly Timetable Builder',
            subtitle: isArabic ? 'بناء وتوزيع المحاضرات وفحص التعارض الزمني' : 'Build lecture timetable & detect clashes',
            to: '/study-plan?tab=schedule',
            icon: FiClock,
          })
        }
      }

      // 4. Fetch dynamic data from services (Lectures, Sources, Additions)
      let { lectures, sources, additions } = datasetRef.current || {}
      if (!lectures) {
        ;[lectures, sources, additions] = await Promise.all([
          getLectures().catch(() => []),
          getSources().catch(() => []),
          getAdditions().catch(() => []),
        ])
        if (seq !== searchSeq.current) return
        datasetRef.current = { lectures, sources, additions }
      }

      // Match Lectures
      lectures.forEach(l => {
        const title = isArabic ? l.titleAr : l.titleEn
        const subject = isArabic ? l.subjectAr : l.subjectEn
        if (title?.toLowerCase().includes(lower) || subject?.toLowerCase().includes(lower)) {
          items.push({
            type: 'lecture',
            title: title || '',
            subtitle: subject || '',
            id: l.id,
            videoId: lectureVideoId(l),
          })
        }
      })

      // Match Sources
      sources.forEach(s => {
        const title = isArabic ? s.titleAr : s.titleEn
        const subject = isArabic ? s.subjectAr : s.subjectEn
        if (title?.toLowerCase().includes(lower) || subject?.toLowerCase().includes(lower)) {
          items.push({
            type: 'source',
            title: title || '',
            subtitle: subject || '',
            id: s.id,
          })
        }
      })

      // Match Additions
      additions.forEach(a => {
        const title = isArabic ? a.titleAr : a.titleEn
        if (title?.toLowerCase().includes(lower)) {
          items.push({
            type: 'addition',
            title: title || '',
            subtitle: isArabic ? 'إضافة أكاديمية' : 'Academic Addition',
            id: a.id,
          })
        }
      })

      // Match Nav Pages
      navPages.forEach(p => {
        if (p.keys.some(k => k.toLowerCase().includes(lower))) {
          items.push({
            type: 'page',
            title: isArabic ? (p.keys[1] || p.keys[0]) : p.keys[0],
            subtitle: isArabic ? 'صفحة في المنصة' : 'Platform Page',
            to: p.to,
          })
        }
      })

      if (seq !== searchSeq.current) return
      setResults(items.slice(0, 16))
      setActiveIndex(0)
    } catch {
      if (seq === searchSeq.current) setResults([])
    } finally {
      if (seq === searchSeq.current) setLoading(false)
    }
  }, [isArabic, quickActions])

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 120)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  const handleSelect = useCallback((item) => {
    if (item.type === 'page' || item.type === 'action') {
      navigate(item.to)
    } else if (item.type === 'plan') {
      try {
        localStorage.setItem('al_azher_active_major_plan', item.planId)
      } catch {}
      navigate('/study-plan')
    } else if (item.type === 'course') {
      try {
        localStorage.setItem('al_azher_active_major_plan', item.planId)
      } catch {}
      navigate('/study-plan')
    } else if (item.type === 'lecture') {
      navigate(item.id ? `/lecture/${item.id}` : '/lectures')
    } else if (item.type === 'source') {
      navigate('/sources')
    } else if (item.type === 'addition') {
      navigate('/additions')
    }
    closeModal()
  }, [navigate, closeModal])

  const handleKeyDown = (e) => {
    const activeList = query.trim() ? results : quickActions
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, activeList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeList[activeIndex]) {
      e.preventDefault()
      handleSelect(activeList[activeIndex])
    }
  }

  const scrollToItem = (index) => {
    const el = listRef.current?.children?.[index]
    el?.scrollIntoView({ block: 'nearest' })
  }

  useEffect(() => { scrollToItem(activeIndex) }, [activeIndex])

  const getTypeLabel = (type) => {
    switch (type) {
      case 'course': return isArabic ? 'مساق معتمد' : 'Course'
      case 'plan': return isArabic ? 'خطة تخصص' : 'Degree Plan'
      case 'action': return isArabic ? 'إجراء سريع' : 'Action'
      case 'lecture': return isArabic ? 'محاضرة' : 'Lecture'
      case 'source': return isArabic ? 'ملف / مصدر' : 'Source'
      case 'addition': return isArabic ? 'إضافة' : 'Addition'
      default: return isArabic ? 'صفحة' : 'Page'
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...modalOverlay}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[8vh] p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={isArabic ? 'شريط البحث الشامل والتحكم السريع' : 'Universal Command Search'}
        >
          <motion.div
            {...modalContent}
            ref={panelRef}
            className="modal-spatial rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-white/15 bg-white/90 dark:bg-navy-950/90 backdrop-blur-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <FiSearch size={20} className="text-royal-500 dark:text-cyan-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isArabic ? 'ابحث في الخطط، المساقات، الامتحانات، المحاضرات...' : 'Search plans, courses, exams, lectures...'}
                className="flex-1 bg-transparent text-ink placeholder-slate-400 dark:placeholder-white/40 text-sm sm:text-base font-medium outline-none"
                autoComplete="off"
                role="combobox"
                aria-expanded="true"
                aria-controls="global-search-results"
                aria-autocomplete="list"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-400"
                >
                  <FiX size={16} />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[11px] font-mono text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results / Zero State Panel */}
            <div ref={listRef} className="max-h-[62vh] overflow-y-auto overscroll-contain">
              {loading && query.trim() && (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-white/40 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-royal-500 border-t-transparent rounded-full animate-spin" />
                  <span>{isArabic ? 'جاري البحث في قاعدة البيانات الأكاديمية...' : 'Searching curriculum database...'}</span>
                </div>
              )}

              {/* No Results */}
              {!loading && query.trim() && results.length === 0 && (
                <div className="py-12 text-center px-4">
                  <FiSearch size={36} className="mx-auto mb-3 text-slate-300 dark:text-white/20" />
                  <p className="text-sm font-semibold text-ink">
                    {isArabic ? 'لم يتم العثور على نتائج مطابقة' : 'No matching results found'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                    {isArabic ? 'جرب البحث برمز المساق (مثل ITCS1401) أو باسم المادة أو التخصص' : 'Try searching by course code (e.g. ITCS1401), title, or major'}
                  </p>
                </div>
              )}

              {/* Zero-State Recommendations */}
              {!loading && !query.trim() && (
                <div className="p-4 space-y-4">
                  {/* Quick Academic Actions */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider block mb-2 px-2">
                      {isArabic ? 'أدوات وإجراءات سريعة' : 'Quick Actions & Tools'}
                    </span>
                    <div className="space-y-1">
                      {quickActions.map((action, i) => {
                        const IconComp = action.icon || FiZap
                        const isSelected = i === activeIndex
                        return (
                          <button
                            key={action.to}
                            type="button"
                            onClick={() => handleSelect(action)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition ${
                              isSelected
                                ? 'bg-royal-500/10 dark:bg-cyan-500/10 text-royal-600 dark:text-cyan-300'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 text-ink'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shrink-0">
                              <IconComp size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold truncate">{action.title}</p>
                              <p className="text-[11px] text-slate-400 dark:text-white/40 truncate">{action.subtitle}</p>
                            </div>
                            <FiArrowRight size={14} className="text-slate-400 shrink-0" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Accredited Plans Shortcuts */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider block mb-2 px-2">
                      {isArabic ? 'الخطط الأكاديمية المعتمدة لجامعة الأزهر' : 'Official Accredited Degree Plans'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {ACADEMIC_PLANS.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => handleSelect({ type: 'plan', planId: plan.id })}
                          className="p-2.5 rounded-xl border border-line bg-black/[0.02] dark:bg-white/[0.02] hover:border-royal-500/40 text-start transition flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-ink block truncate group-hover:text-royal-600 dark:group-hover:text-cyan-400">
                              {isArabic ? plan.nameAr : plan.nameEn}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{plan.planNumber} • {plan.badge}
                            </span>
                          </div>
                          <FiLayers size={13} className="text-slate-400 group-hover:text-royal-600 dark:group-hover:text-cyan-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Search Results */}
              {results.length > 0 && (
                <div id="global-search-results" role="listbox" className="p-2 space-y-1">
                  {results.map((item, i) => {
                    const Icon = item.icon || typeIcons[item.type] || FiFileText
                    const isSelected = i === activeIndex

                    return (
                      <button
                        key={`${item.type}-${item.id || item.to || item.code}-${i}`}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-start transition ${
                          isSelected
                            ? 'bg-royal-500/10 dark:bg-cyan-500/10 ring-1 ring-royal-500/20'
                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {item.type === 'lecture' && item.videoId ? (
                          <div className="relative w-12 h-7 rounded-md overflow-hidden bg-black/30 shrink-0">
                            <LectureThumbnail videoId={item.videoId} alt="" width={48} height={28} />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[item.type] || 'from-sky-500 to-sky-600'} flex items-center justify-center text-white shrink-0`}>
                            <Icon size={14} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-ink truncate leading-snug">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[11px] text-slate-400 dark:text-white/50 truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/60 shrink-0">
                          {getTypeLabel(item.type)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer Bar with Keyboard Shortcuts */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] text-slate-500 dark:text-white/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[10px]">↑↓</kbd>
                  <span>{isArabic ? 'للتنقل' : 'Navigate'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[10px]">↵</kbd>
                  <span>{isArabic ? 'للاختيار' : 'Select'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[10px]">ESC</kbd>
                  <span>{isArabic ? 'للإغلاق' : 'Close'}</span>
                </span>
              </div>

              {results.length > 0 && (
                <span className="font-semibold tabular-nums text-royal-600 dark:text-cyan-400">
                  {results.length} {isArabic ? 'نتيجة' : 'results'}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
