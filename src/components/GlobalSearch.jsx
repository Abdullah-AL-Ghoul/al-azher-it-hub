import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getAdditions, getAllSubtitles } from '../services'
import { formatVttTime } from '../utils/vttParser'
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
  FiAward,
  FiMessageSquare
} from 'react-icons/fi'
import { FaCalculator } from 'react-icons/fa'
import LectureThumbnail from './shared/LectureThumbnail'
import { lectureVideoId } from '../utils/helpers'
import { ACADEMIC_PLANS } from '../data/academicCurriculum'
import { DEFAULT_LECTURES } from '../data/sampleLectures'

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
  { to: '/roadmap', keys: ['roadmap', 'مسار', 'المسار الدراسي', 'شجرة المواد', 'متطلبات'] },
  { to: '/focus', keys: ['focus', 'pomodoro', 'بومودورو', 'تركيز', 'غرفة التركيز', 'مؤقت'] },
  { to: '/flashcards', keys: ['flashcards', 'بطاقات', 'مراجعة', 'فلاش كاردز', 'leitner'] },
  { to: '/cheatsheets', keys: ['cheatsheets', 'أكواد', 'أوامر', 'git', 'linux', 'sql', 'big-o'] },
  { to: '/tools', keys: ['tools', 'أدوات', 'الأدوات الذكية', 'مركز الأدوات', 'innovation', 'study tools'] },
  { to: '/additions', keys: ['additions', 'إضافات'] },
  { to: '/contact', keys: ['contact', 'تواصل', 'الدعم'] },
  { to: '/profile', keys: ['profile', 'ملفي', 'الملف الشخصي', 'كشف الدرجات'] },
]

const typeIcons = {
  course: FiBookOpen,
  plan: FiLayers,
  action: FiZap,
  lecture: FiFileText,
  transcript: FiMessageSquare,
  source: FiGrid,
  addition: FiHeart,
  page: FiArrowRight,
}

const typeColors = {
  course: 'from-sky-500 to-sky-600',
  plan: 'from-emerald-500 to-emerald-600',
  action: 'from-amber-500 to-amber-600',
  lecture: 'from-violet-500 to-violet-600',
  transcript: 'from-teal-500 to-cyan-600',
  source: 'from-orange-500 to-orange-600',
  addition: 'from-rose-500 to-rose-600',
  page: 'from-cyan-500 to-cyan-600',
}

const SEARCH_CATEGORIES = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'course', labelAr: 'المساقات والخطط', labelEn: 'Courses & Plans' },
  { id: 'lecture', labelAr: 'المحاضرات', labelEn: 'Lectures' },
  { id: 'transcript', labelAr: 'نصوص المحاضرات', labelEn: 'Transcripts' },
  { id: 'source', labelAr: 'المصادر والامتحانات', labelEn: 'Sources' },
  { id: 'action', labelAr: 'الأدوات', labelEn: 'Tools' },
]

export default function GlobalSearch({ autoOpen = false }) {
  const { lang, t } = useLanguage()
  const auth = useAuth()
  const user = auth?.user || null
  const navigate = useNavigate()
  const isArabic = lang === 'ar'

  const [open, setOpen] = useState(!!autoOpen)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
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
    setActiveCategory('all')
    setResults([])
    setActiveIndex(0)
    setLoading(false)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveCategory('all')
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
      title: isArabic ? 'مركز الأدوات الذكية والإنتاجية' : 'Student Tools & Innovation Hub',
      subtitle: isArabic ? 'غرفة التركيز، بطاقات 3D، خزينة الأكواد، وشجرة المتطلبات' : 'Focus room, 3D flashcards, cheatsheets, and DAG tree',
      to: '/tools',
      icon: FiGrid,
    },
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

      // 4. Fetch dynamic data from services (Lectures, Sources, Additions, Subtitles)
      let { lectures, sources, additions, subtitles } = datasetRef.current || {}
      if (!lectures) {
        ;[lectures, sources, additions, subtitles] = await Promise.all([
          getLectures().catch(() => []),
          getSources().catch(() => []),
          getAdditions().catch(() => []),
          getAllSubtitles().catch(() => []),
        ])
        if (seq !== searchSeq.current) return
        datasetRef.current = { lectures, sources, additions, subtitles }
      }

      // Combine fetched lectures with DEFAULT_LECTURES fallback for complete lookup
      const allLectures = [...(lectures || [])]
      DEFAULT_LECTURES.forEach(dl => {
        if (!allLectures.some(l => l.id === dl.id || l.id === dl.aliasId || l.aliasId === dl.id)) {
          allLectures.push(dl)
        }
      })

      // Match Lectures (including instructor/doctor name)
      allLectures.forEach(l => {
        const title = isArabic ? l.titleAr : l.titleEn
        const subject = isArabic ? l.subjectAr : l.subjectEn
        const doctor = isArabic ? (l.doctorAr || l.doctorEn) : (l.doctorEn || l.doctorAr)
        if (
          title?.toLowerCase().includes(lower) ||
          subject?.toLowerCase().includes(lower) ||
          l.doctorAr?.toLowerCase().includes(lower) ||
          l.doctorEn?.toLowerCase().includes(lower)
        ) {
          items.push({
            type: 'lecture',
            title: title || '',
            subtitle: [subject, doctor].filter(Boolean).join(' • '),
            id: l.id,
            videoId: lectureVideoId(l),
          })
        }
      })

      // Match Lecture Transcripts & Subtitles (Cue-level search with timestamp deep-link)
      if (Array.isArray(subtitles) && lower.length >= 2) {
        let transcriptMatches = 0
        for (const track of subtitles) {
          if (transcriptMatches >= 16) break
          const parentLecture = allLectures.find(
            l =>
              l.id === track.lectureId ||
              l.id === track.aliasLectureId ||
              l.aliasId === track.lectureId ||
              l.aliasId === track.aliasLectureId
          )
          const lectureId = parentLecture?.id || track.lectureId
          const lectureName = parentLecture
            ? (isArabic ? (parentLecture.titleAr || parentLecture.titleEn) : (parentLecture.titleEn || parentLecture.titleAr))
            : (track.lectureTitle || track.lectureId)
          const cues = Array.isArray(track.cues) ? track.cues : []
          for (const cue of cues) {
            if (transcriptMatches >= 16) break
            if (cue.text?.toLowerCase().includes(lower)) {
              const startSec = Math.max(0, Number(cue.start) || 0)
              const fullVtt = formatVttTime(startSec)
              const timeStr = startSec >= 3600 ? fullVtt.slice(0, 8) : fullVtt.slice(3, 8)
              items.push({
                type: 'transcript',
                id: lectureId,
                timestamp: Math.floor(startSec),
                title: cue.text,
                subtitle: `${lectureName} • ⏱️ ${timeStr}`,
              })
              transcriptMatches += 1
            }
          }
        }
      }

      // Match Sources
      ;(sources || []).forEach(s => {
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
      ;(additions || []).forEach(a => {
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
      setResults(items)
      setActiveIndex(0)
    } catch {
      if (seq === searchSeq.current) setResults([])
    } finally {
      if (seq === searchSeq.current) setLoading(false)
    }
  }, [isArabic, quickActions])

  const filteredResults = useMemo(() => {
    if (activeCategory === 'course') {
      return results.filter(r => r.type === 'course' || r.type === 'plan').slice(0, 24)
    }
    if (activeCategory === 'source') {
      return results.filter(r => r.type === 'source' || r.type === 'addition').slice(0, 24)
    }
    if (activeCategory === 'action') {
      return results.filter(r => r.type === 'action' || r.type === 'page').slice(0, 24)
    }
    if (activeCategory !== 'all') {
      return results.filter(r => r.type === activeCategory).slice(0, 24)
    }
    // For 'all': deduplicate repeated course codes across plans and balance categories
    // so courses don't starve lectures, transcripts, sources, and actions.
    const seenCodes = new Set()
    const coursesAndPlans = []
    const nonCourses = []
    for (const r of results) {
      if (r.type === 'course') {
        if (!seenCodes.has(r.code)) {
          seenCodes.add(r.code)
          coursesAndPlans.push(r)
        }
      } else if (r.type === 'plan') {
        coursesAndPlans.push(r)
      } else {
        nonCourses.push(r)
      }
    }
    if (nonCourses.length === 0) return coursesAndPlans.slice(0, 24)
    const maxCoursesInAll = Math.max(6, 24 - nonCourses.length)
    return [...coursesAndPlans.slice(0, maxCoursesInAll), ...nonCourses].slice(0, 24)
  }, [results, activeCategory])

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
      } catch { /* ignore storage errors */ }
      navigate(`/study-plan?plan=${encodeURIComponent(item.planId)}`)
    } else if (item.type === 'course') {
      try {
        localStorage.setItem('al_azher_active_major_plan', item.planId)
      } catch { /* ignore storage errors */ }
      const qParam = item.code ? `&q=${encodeURIComponent(item.code)}` : ''
      navigate(`/study-plan?plan=${encodeURIComponent(item.planId)}${qParam}`)
    } else if (item.type === 'lecture') {
      navigate(item.id ? `/lecture/${item.id}` : '/lectures')
    } else if (item.type === 'transcript') {
      const tParam = Number.isFinite(item.timestamp) ? `?t=${item.timestamp}` : ''
      navigate(item.id ? `/lecture/${item.id}${tParam}` : '/lectures')
    } else if (item.type === 'source') {
      const qParam = item.title ? `?q=${encodeURIComponent(item.title)}` : ''
      navigate(`/sources${qParam}`)
    } else if (item.type === 'addition') {
      navigate('/additions')
    }
    closeModal()
  }, [navigate, closeModal])

  const handleKeyDown = (e) => {
    const activeList = query.trim() ? filteredResults : quickActions
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
      case 'transcript': return isArabic ? 'نص المحاضرة' : 'Transcript'
      case 'source': return isArabic ? 'ملف / مصدر' : 'Source'
      case 'addition': return isArabic ? 'إضافة' : 'Addition'
      default: return isArabic ? 'صفحة' : 'Page'
    }
  }

  if (!user) {
    if (!open) return null
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            {...modalOverlay}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-label={t('inline.global-search.global-search')}
          >
            <motion.div
              {...modalContent}
              ref={panelRef}
              className="modal-spatial rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-center p-8 border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <FiSearch size={32} className="mx-auto mb-4 text-slate-300 dark:text-white/20" />
              <p className="text-sm text-ink font-bold mb-1">
                {t('inline.global-search.sign-in-to-search')}
              </p>
              <p className="text-xs text-slate-400 dark:text-white/40 mb-5">
                {t('inline.global-search.sign-in-to-search-hint')}
              </p>
              <Link
                to="/login"
                onClick={closeModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-royal-500 hover:bg-royal-600 text-white rounded-xl text-sm font-semibold transition shadow-md"
              >
                {t('inline.global-search.sign-in')}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
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
                placeholder={isArabic ? 'ابحث في المساقات، المحاضرات، نصوص الفيديو، والامتحانات...' : 'Search courses, lectures, video transcripts, exams...'}
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

            {/* Category Filter Pills */}
            {query.trim() && (
              <div className="flex items-center gap-1.5 px-4 py-2 border-b border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar bg-black/[0.01] dark:bg-white/[0.01]">
                {SEARCH_CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setActiveCategory(cat.id); setActiveIndex(0) }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                        isActive
                          ? 'bg-royal-500 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/60 hover:text-ink'
                      }`}
                    >
                      {isArabic ? cat.labelAr : cat.labelEn}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Results / Zero State Panel */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {loading && query.trim() && (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-white/40 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-royal-500 border-t-transparent rounded-full animate-spin" />
                  <span>{isArabic ? 'جاري البحث في قاعدة البيانات الأكاديمية...' : 'Searching curriculum database...'}</span>
                </div>
              )}

              {/* No Results */}
              {!loading && query.trim() && filteredResults.length === 0 && (
                <div className="py-12 text-center px-4">
                  <FiSearch size={36} className="mx-auto mb-3 text-slate-300 dark:text-white/20" />
                  <p className="text-sm font-semibold text-ink">
                    {isArabic ? 'لم يتم العثور على نتائج مطابقة' : 'No matching results found'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                    {isArabic ? 'جرب البحث برمز المساق (مثل ITCS1401) أو باسم المادة أو كلمة داخل المحاضرة' : 'Try searching by course code (e.g. ITCS1401), title, or spoken keyword'}
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
              {filteredResults.length > 0 && (
                <div id="global-search-results" role="listbox" className="p-2 space-y-1">
                  {filteredResults.map((item, i) => {
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

              {filteredResults.length > 0 && (
                <span className="font-semibold tabular-nums text-royal-600 dark:text-cyan-400">
                  {filteredResults.length} {isArabic ? 'نتيجة' : 'results'}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
