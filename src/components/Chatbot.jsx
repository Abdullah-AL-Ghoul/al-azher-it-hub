import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getSubjects, addStudentLog } from '../services'
import { modalContent, springFast } from '../utils/motionTokens'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { toast } from 'react-hot-toast'
import {
 FiMessageCircle, FiX, FiSend, FiUser, FiHelpCircle,
 FiBookOpen, FiVideo, FiLink, FiPhone, FiCalendar,
 FiStar, FiZap, FiCopy, FiCheck, FiTrash2
} from 'react-icons/fi'

function fuzzyMatch(text, keywords) {
 const lower = text.toLowerCase().trim()
 return keywords.some(kw => {
  const keyword = kw.toLowerCase()

  if (lower.includes(keyword)) {
   return true
  }
  let ki = 0

  for (let idx = 0; idx < lower.length && ki < keyword.length; idx++) {
   if (lower[idx] === keyword[ki]) {
    ki++
   }
  }
  return ki === keyword.length
 })
}

// Matches plain keywords via fuzzyMatch, but treats any pattern containing regex
// metacharacters (e.g. 'how many.*subject', 'كم.*محاضرة') as a real regular
// expression. Previously those were fed to fuzzyMatch, which matched them
// literally and the intents silently never fired.
function matchPatterns(text, patterns) {
 const RE_META = /[*+?()[\]{}|^$\\]/
 return patterns.some(p => {
  if (RE_META.test(p)) {
   try { return new RegExp(p, 'i').test(text) } catch { return false }
  }
  return fuzzyMatch(text, [p])
 })
}

function getGreeting(isArabic) {
 const hour = new Date().getHours()

 if (hour < 6) {
  return isArabic ? 'مساء الخير' : 'Good evening'
 }
 if (hour < 12) {
  return isArabic ? 'صباح الخير' : 'Good morning'
 }
 if (hour < 17) {
  return isArabic ? 'مساء الخير' : 'Good afternoon'
 }
 return isArabic ? 'مساء الخير' : 'Good evening'
}

function formatTime() {
 return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const QUICK_REPLIES = {
 afterHelp: {
  ar: [
   { icon: FiVideo, text: 'كم عدد المحاضرات؟' },
   { icon: FiBookOpen, text: 'المواد المتاحة' },
   { icon: FiLink, text: 'المصادر المتاحة' },
   { icon: FiPhone, text: 'معلومات التواصل' }
  ],
  en: [
   { icon: FiVideo, text: 'How many lectures?' },
   { icon: FiBookOpen, text: 'Available courses' },
   { icon: FiLink, text: 'Available sources' },
   { icon: FiPhone, text: 'Contact info' }
  ]
 },
 afterLectures: {
  ar: [
   { icon: FiBookOpen, text: 'المواد المتاحة' },
   { icon: FiLink, text: 'المصادر المتاحة' },
   { icon: FiCalendar, text: 'الخطة الدراسية' },
   { icon: FiStar, text: 'كيف أقيّم محاضرة؟' }
  ],
  en: [
   { icon: FiBookOpen, text: 'Available courses' },
   { icon: FiLink, text: 'Available sources' },
   { icon: FiCalendar, text: 'Study plan' },
   { icon: FiStar, text: 'How to rate a lecture?' }
  ]
 },
 afterSources: {
  ar: [
   { icon: FiVideo, text: 'كم عدد المحاضرات؟' },
   { icon: FiBookOpen, text: 'المواد المتاحة' },
   { icon: FiPhone, text: 'معلومات التواصل' },
   { icon: FiHelpCircle, text: 'مساعدة' }
  ],
  en: [
   { icon: FiVideo, text: 'How many lectures?' },
   { icon: FiBookOpen, text: 'Available courses' },
   { icon: FiPhone, text: 'Contact info' },
   { icon: FiHelpCircle, text: 'Help' }
  ]
 },
 default: {
  ar: [
   { icon: FiVideo, text: 'كم عدد المحاضرات؟' },
   { icon: FiBookOpen, text: 'المواد المتاحة' },
   { icon: FiLink, text: 'المصادر المتاحة' },
   { icon: FiHelpCircle, text: 'مساعدة' }
  ],
  en: [
   { icon: FiVideo, text: 'How many lectures?' },
   { icon: FiBookOpen, text: 'Available courses' },
   { icon: FiLink, text: 'Available sources' },
   { icon: FiHelpCircle, text: 'Help' }
  ]
 },
 initial: {
  ar: [
   { icon: FiVideo, text: 'كم عدد المحاضرات؟' },
   { icon: FiBookOpen, text: 'المواد المتاحة' },
   { icon: FiLink, text: 'المصادر المتاحة' },
   { icon: FiPhone, text: 'معلومات التواصل' },
   { icon: FiCalendar, text: 'الخطة الدراسية' },
   { icon: FiStar, text: 'كيف أقيّم محاضرة؟' }
  ],
  en: [
   { icon: FiVideo, text: 'How many lectures?' },
   { icon: FiBookOpen, text: 'Available courses' },
   { icon: FiLink, text: 'Available sources' },
   { icon: FiPhone, text: 'Contact info' },
   { icon: FiCalendar, text: 'Study plan' },
   { icon: FiStar, text: 'How to rate a lecture?' }
  ]
 }
}

function TypingIndicator() {
 const prefersReduced = useReducedMotion()
 return (
  <div className="flex items-start gap-2.5">
   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-royal-500 flex items-center justify-center shrink-0 shadow-md">
    <FiZap size={12} className="text-white" />
   </div>
   <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-navy-700 shadow-sm border border-slate-100 dark:border-slate-600">
    <div className="flex items-center gap-1.5">
     {[0, 1, 2].map(val => (
      <motion.div
       key={val}
       animate={prefersReduced ? {} : { opacity: [0.4, 1, 0.4], y: [0, -5, 0] }}
       className="w-2 h-2 bg-slate-300 dark:bg-slate-500 rounded-full"
       transition={prefersReduced ? {} : { delay: val * 0.2, duration: 0.8, repeat: Infinity }}
      />
     ))}
    </div>
   </div>
  </div>
 )
}

const CopyButton = memo(function CopyButton({ text, isArabic }) {
 const [copied, setCopied] = useState(false)

 const handleCopy = useCallback(async() => {
  try {
   if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
   } else {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
   }
   setCopied(true)
   toast.success(isArabic ? 'تم النسخ!' : 'Copied!')
   setTimeout(() => setCopied(false), 2000)
  } catch {
   toast.error(isArabic ? 'فشل النسخ' : 'Copy failed')
  }
 }, [text, isArabic])

  return (
   <button
    aria-label={isArabic ? 'نسخ الرسالة' : 'Copy message'}
    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-navy-600 transition-colors opacity-0 group-hover:opacity-100"
    onClick={handleCopy}
    title={isArabic ? 'نسخ' : 'Copy'}
   >
    {copied ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} className="text-slate-500 dark:text-slate-400" />}
   </button>
  )
})

function renderWithLinks(text, isUser) {
 const parts = text.split(/(https?:\/\/[^\s]+|\/(?:lectures|sources|home|roadmap|additions|study-plan|contact|profile|admin)(?:\/[^\s]*)?)/g)
 return parts.map((part, i) => {
  const isUrl = /^https?:\/\//.test(part)
  const isInternal = /^\/(?:lectures|sources|home|roadmap|additions|study-plan|contact|profile|admin)/.test(part)
  if (isUrl || isInternal) {
   return (
    <a
     key={i}
     href={part}
     target={isUrl ? '_blank' : undefined}
     rel={isUrl ? 'noopener noreferrer' : undefined}
     className={`underline underline-offset-2 font-medium ${isUser ? 'text-white hover:text-white/80' : 'text-royal-500 dark:text-cyan-400 hover:text-royal-600 dark:hover:text-cyan-300'}`}
     onClick={e => { if (isInternal) { e.preventDefault(); window.location.href = part } }}
    >
     {part}
    </a>
   )
  }
  return <span key={i}>{part}</span>
 })
}

const ChatMessage = memo(function ChatMessage({ msg, isArabic, prefersReduced }) {
 const isUser = msg.role === 'user'

 return (
  <motion.div
   animate={prefersReduced ? {} : { opacity: 1, scale: 1, y: 0 }}
   className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
   initial={prefersReduced ? {} : { opacity: 0, scale: 0.97, y: 8 }}
   transition={prefersReduced ? {} : { duration: 0.25 }}
  >
   <div className={`flex items-start gap-2 max-w-[88%] ${isUser ? 'flex-row-reverse' : ''} group`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isUser ? 'bg-gradient-to-br from-royal-500 to-royal-600' : 'bg-gradient-to-br from-cyan-400 to-royal-500'}`}>
     {isUser ? <FiUser size={12} className="text-white" /> : <FiZap size={12} className="text-white" />}
    </div>
    <div className="flex flex-col gap-1">
     <div className={`px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
      isUser
       ? 'bg-royal-500 text-white rounded-2xl rounded-tr-sm shadow-sm'
       : 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-600'
     }`}>
      {renderWithLinks(msg.text, isUser)}
     </div>
     <div className={`flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 ">{msg.time}</span>
      {!isUser && <CopyButton isArabic={isArabic} text={msg.text} />}
     </div>
    </div>
   </div>
   </motion.div>
  )
})

function buildHandlers(data, user, isArabic) {
 const { lectures, sources, subjects } = data

 function greetHandler(text) {
  if (fuzzyMatch(text, ['مرحبا', 'هلا', 'السلام عليكم', 'اهلا', 'hello', 'hi', 'hey', 'morning', 'evening', 'صباح', 'مساء'])) {
   return {
    quickKey: 'initial',
    text: `${getGreeting(isArabic)}${user?.name ? ' ' + user.name : ''}! 😊\n\n${isArabic
     ? 'كيف أقدر أساعدك اليوم؟ اسألني عن المحاضرات، المواد، المصادر، أو أي شي!'
     : 'How can I help you today? Ask me about lectures, courses, sources, or anything!'}`
   }
  }
  return null
 }

 function howAreYouHandler(text) {
  if (fuzzyMatch(text, ['كيف حالك', 'كيفك', 'how are you', 'عامل ايه', 'شلونك', 'status'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? 'الحمد لله، تمام! 😊 أنا هنا جاهز أساعدك. اسألني عن أي شي!'
     : 'I\'m doing great, thanks! 😊 I\'m here and ready to help. Ask me anything!'
   }
  }
  return null
 }

 function whoAreYouHandler(text) {
  if (fuzzyMatch(text, ['مين انت', 'من انت', 'who are you', 'انت مين', 'تعريف', 'عن نفسك'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? 'أنا مساعد AL-Azher IT Hub الذكي! 🤖\n\nأقدر أساعدك في:\n• معرفة عدد المحاضرات والمصادر\n• عرض المواد والمساقات المتاحة\n• معلومات التواصل\n• معرفة طريقة استخدام الموقع\n• الإجابة على أسئلتك المتنوعة\n\nجرب أسألني!'
     : 'I\'m the AL-Azher IT Hub smart assistant! 🤖\n\nI can help you with:\n• Finding lectures and sources\n• Available courses and subjects\n• Contact information\n• How to use the site\n• Answering your various questions\n\nTry asking me!'
   }
  }
  return null
 }

  function subjectsCountHandler(text) {
   if (matchPatterns(text, ['عدد المواد', 'كم مادة', 'كم ماده', 'how many.*subject', 'how many.*course', 'subjects.*count', 'courses.*count'])) {
   if (!subjects.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في مواد مسجلة حالياً. 📭' : 'No courses recorded yet. 📭' }
   }
   return { quickKey: 'afterLectures', text: isArabic ? `📖 عدد المواد المتاحة: ${subjects.length}` : `📖 Available courses: ${subjects.length}` }
  }
  return null
 }

 function lecturesCountHandler(text) {
  const hasSource = /مصدر|مصادر|source/i.test(text)
  const hasSubject = /مادة|مواد|subject|course/i.test(text)
  if (hasSource || hasSubject) return null
  if (matchPatterns(text, ['عدد المحاضرات', 'كم محاضرة', 'كم.*محاضر', 'lectures.*count', 'how many.*lecture'])) {
   if (!lectures.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في محاضرات مسجلة حالياً. 📭' : 'No lectures recorded yet. 📭' }
   }
   const grouped = {}

   lectures.forEach(lecture => {
    const name = isArabic ? (lecture.subjectAr || lecture.titleAr) : (lecture.subjectEn || lecture.titleEn)

    if (name) {
     grouped[name] = (grouped[name] || 0) + 1
    }
   })
   const list = Object.entries(grouped).slice(0, 8).map(([name, count]) => ` • ${name}: ${count}`).join('\n')
   const byCourse = Object.keys(grouped).length > 0
    ? `${isArabic ? 'حسب المادة:' : 'By course:'}\n${list}`
    : ''
   return {
    quickKey: 'afterLectures',
    text: isArabic
     ? `📊 في حالياً ${lectures.length} محاضرة مسجلة.\n\n${byCourse}`
     : `📊 There are currently ${lectures.length} lectures recorded.\n\n${byCourse}`
   }
  }
  return null
 }

  function sourcesCountHandler(text) {
   if (matchPatterns(text, ['عدد المصادر', 'كم.*مصدر', 'sources.*count', 'how many.*source', 'كم مصدر'])) {
   if (!sources.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في مصادر مسجلة حالياً. 📭' : 'No sources recorded yet. 📭' }
   }
   return {
    quickKey: 'afterSources',
    text: isArabic
     ? `📚 في حالياً ${sources.length} مصدر متاح.`
     : `📚 There are currently ${sources.length} sources available.`
   }
  }
  return null
 }

 function subjectsHandler(text) {
  if (fuzzyMatch(text, ['مواد', 'مساقات', 'courses', 'subjects', 'المواد', 'كل المواد'])) {
   if (!subjects.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في مواد مسجلة حالياً. تواصل مع Admin. 📭' : 'No courses recorded yet. Contact the admin. 📭' }
   }
   const list = subjects.map((subject, idx) => `${idx + 1}. ${isArabic ? (subject.nameAr || subject.ar) : (subject.nameEn || subject.en)}`).join('\n')
   const deepLink = isArabic ? '\n\n→ افتح المواد: /home' : '\n\n→ Browse courses: /home'
   return {
    quickKey: 'afterLectures',
    text: isArabic ? `📖 المواد المتاحة (${subjects.length}):\n\n${list}${deepLink}` : `📖 Available courses (${subjects.length}):\n\n${list}${deepLink}`
   }
  }
  return null
 }

 function lecturesListHandler(text) {
  if (matchPatterns(text, ['محاضرات', 'videos', 'ليست.*محاضرات', 'all.*lecture', 'كل.*محاضرة', 'عرض.*محاضرات', 'عرض المحاضرات'])) {
   if (!lectures.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في محاضرات حالياً. 📭' : 'No lectures available yet. 📭' }
   }
   const grouped = {}

   lectures.forEach(lecture => {
    const name = isArabic ? lecture.subjectAr : lecture.subjectEn

    if (!grouped[name]) {
     grouped[name] = []
    }
    grouped[name].push(isArabic ? lecture.titleAr : lecture.titleEn)
   })
   const list = Object.entries(grouped).slice(0, 5).map(([name, items]) => {
    const more = items.length > 3 ? `\n ...و${items.length - 3} أخرى` : ''
    return `📌 ${name} (${items.length}):\n${items.slice(0, 3).map(item => ` • ${item}`).join('\n')}${more}`
   }).join('\n\n')
   const deepLink = isArabic ? '\n\n→ افتح المحاضرات: /lectures' : '\n\n→ Open lectures: /lectures'
   return {
    quickKey: 'afterLectures',
    text: isArabic ? `🎬 المحاضرات (${lectures.length}):\n\n${list}${deepLink}` : `🎬 Lectures (${lectures.length}):\n\n${list}${deepLink}`
   }
  }
  return null
 }

  function sourcesListHandler(text) {
    if (matchPatterns(text, ['مصادر', 'ملخصات', 'summary', 'pdf', 'كتاب', 'book', 'المصادر', 'كل.*مصادر'])) {
    if (!sources.length) {
     return { quickKey: 'default', text: isArabic ? 'ما في مصادر حالياً. 📭' : 'No sources available yet. 📭' }
    }
    const list = sources.slice(0, 8).map((source, idx) => `${idx + 1}. ${isArabic ? source.titleAr : source.titleEn}`).join('\n')
    const more = sources.length > 8
     ? `\n\n${isArabic ? '...والمزيد في صفحة المصادر' : '...and more on the Sources page'}`
     : ''
    const deepLink = isArabic ? '\n\n→ افتح المصادر: /sources' : '\n\n→ Open sources: /sources'
    return {
     quickKey: 'afterSources',
     text: isArabic ? `📎 المصادر المتاحة (${sources.length}):\n\n${list}${more}${deepLink}` : `📎 Available sources (${sources.length}):\n\n${list}${more}${deepLink}`
    }
   }
   return null
  }

  function lectureInfoHandler(text) {
   let currentLecture = null
   try {
    const raw = sessionStorage.getItem('al_azher_current_lecture')
    if (raw) currentLecture = JSON.parse(raw)
   } catch (e) { /* silent */ }

   const wantsSummary = fuzzyMatch(text, ['لخص', 'لخّص', 'الخلاصة', 'تلخيص', 'summarize', 'summary'])
   const wantsInfo = matchPatterns(text, ['معلومات عن محاضرة', 'ما هي محاضرة', 'عن محاضرة', 'tell me about', 'what.*lecture', 'what is this'])
   if (!wantsSummary && !wantsInfo) return null

   const aboutMatch = text.match(/(?:لخص|لخّص|ملخص|معلومات عن|ما هي محاضرة|عن محاضرة|summarize|summary|tell me about|about)\s+(.+)/i)
   let query = aboutMatch ? aboutMatch[1].trim().toLowerCase() : ''

   let lecture = null
   if (query) {
    lecture = lectures.find(l => {
     const title = ((isArabic ? l.titleAr : l.titleEn) || '').toLowerCase()
     const subject = ((isArabic ? l.subjectAr : l.subjectEn) || '').toLowerCase()
     return title.includes(query) || subject.includes(query)
    })
    if (!lecture) {
     const partial = lectures.filter(l => {
      const title = ((isArabic ? l.titleAr : l.titleEn) || '').toLowerCase()
      const subject = ((isArabic ? l.subjectAr : l.subjectEn) || '').toLowerCase()
      return title.includes(query) || subject.includes(query)
     })
     if (partial.length) lecture = partial[0]
    }
   } else if (currentLecture) {
    lecture = lectures.find(l => l.id === currentLecture.id) || null
   }

   if (!lecture) {
    const recent = [...lectures].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5)
    if (recent.length === 0) {
     return { quickKey: 'default', text: isArabic ? 'ما في محاضرات مسجلة حالياً. 📭' : 'No lectures recorded yet. 📭' }
    }
    return {
     quickKey: 'default',
     text: isArabic
      ? '🎬 أي محاضرة تريد أن ألخصها؟ جرب: "لخص [اسم المحاضرة]"\n\nأحدث المحاضرات:\n' + recent.map((l, i) => `${i + 1}. ${isArabic ? l.titleAr : l.titleEn}`).join('\n')
      : '🎬 Which lecture would you like me to summarize? Try: "summarize [lecture name]"\n\nRecent lectures:\n' + recent.map((l, i) => `${i + 1}. ${isArabic ? l.titleAr : l.titleEn}`).join('\n')
    }
   }

   const relatedSources = sources.filter(s =>
    (s.subjectAr && lecture.subjectAr && s.subjectAr === lecture.subjectAr) ||
    (s.subjectEn && lecture.subjectEn && s.subjectEn === lecture.subjectEn)
   )
   const deepLink = isArabic ? `\n\n→ افتح تفاصيل المحاضرة: /lecture/${lecture.id}` : `\n\n→ Open lecture details: /lecture/${lecture.id}`
   const lines = isArabic
    ? [
      `📚 ملخص محاضرة: ${lecture.titleAr}`,
      ``,
      `• المادة: ${lecture.subjectAr || '—'}`,
      `• التاريخ: ${lecture.date || '—'}`,
      `• الدكتور: ${lecture.doctorAr || '—'}`,
      `• مصادر مرتبطة: ${relatedSources.length}`,
      ``,
      lecture.url ? `🎬 رابط الفيديو: ${lecture.url}` : null,
      deepLink,
     ]
    : [
      `📚 Lecture summary: ${lecture.titleEn}`,
      ``,
      `• Subject: ${lecture.subjectEn || '—'}`,
      `• Date: ${lecture.date || '—'}`,
      `• Doctor: ${lecture.doctorEn || '—'}`,
      `• Related sources: ${relatedSources.length}`,
      ``,
      lecture.url ? `🎬 Video link: ${lecture.url}` : null,
      deepLink,
     ]
   return {
    quickKey: 'default',
    text: lines.filter(Boolean).join('\n')
   }
  }

 function contactHandler(text) {
  if (fuzzyMatch(text, ['تواصل', 'اتصال', 'contact', 'هاتف', 'phone', 'بريد', 'email', 'رقم'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '📱 معلومات التواصل:\n\n📞 الهاتف: +970592127061\n📧 البريد: abdallhalghoul200@gmail.com\n\nتقدر تتواصل معنا في أي وقت!'
     : '📱 Contact Information:\n\n📞 Phone: +970592127061\n📧 Email: abdallhalghoul200@gmail.com\n\nFeel free to reach out anytime!'
   }
  }
  return null
 }

 function studyPlanHandler(text) {
  if (fuzzyMatch(text, ['خطة', 'دراسة', 'plan', 'جدول', 'schedule', 'الخطة الدراسية'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '📋 الخطة الدراسية:\n\nتقدر تشوف الخطة الدراسية من الصفحة الرئيسية أو من قائمة التنقل. في هناك جدول كامل بالمواعيد والمواد!'
     : '📋 Study Plan:\n\nYou can view the study plan from the homepage or the navigation menu. There\'s a full schedule with dates and courses!'
   }
  }
  return null
 }

 function rateHandler(text) {
  if (matchPatterns(text, ['تقييم', 'rate', 'rating', 'كيف.*أقيّم', 'تقييم محاضرة', 'أقيّم'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '⭐ التقييم:\n\n1. افتح صفحة "المحاضرات"\n2. اختر المحاضرة اللي تبي تقيّمها\n3. اضغط على نجوم التقييم (1-5)\n4. التقييم يُحفظ تلقائياً!\n\nملاحظة: تقدر تغيّر تقييمك في أي وقت.'
     : '⭐ Rating:\n\n1. Open the "Lectures" page\n2. Choose the lecture you want to rate\n3. Click on the star rating (1-5)\n4. Your rating is saved automatically!\n\nNote: You can change your rating anytime.'
   }
  }
  return null
 }

 function favoritesHandler(text) {
  if (fuzzyMatch(text, ['مفضلة', 'favorite', 'favorites', 'إضافة.*مفضلة', 'حفظ'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '❤️ المفضلة:\n\nتقدر تضيف محاضرة للمفضلة بالضغط على أيقونة القلب في بطاقة المحاضرة. المفضلة تظهر في صفحة "المحاضرات" عند تصفية "المفضلة".'
     : '❤️ Favorites:\n\nYou can add a lecture to favorites by clicking the heart icon on the lecture card. Favorites appear on the "Lectures" page when filtering by "Favorites".'
   }
  }
  return null
 }

 function profileHandler(text) {
  if (fuzzyMatch(text, ['ملفي', 'profile', 'حسابي', 'account', 'الملف الشخصي'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '👤 ملفك الشخصي:\n\nتقدر تشوّف وتحوّ ملفك الشخصي من صفحة "الملف الشخصي". في تقدر تعدّل اسمك، تخصصك، وكلمة المرور.'
     : '👤 Your Profile:\n\nYou can view and edit your profile from the "Profile" page. You can update your name, major, and password.'
   }
  }
  return null
 }

 function thankYouHandler(text) {
  if (fuzzyMatch(text, ['شكر', 'ممتاز', 'حلو', 'thanks', 'thank', 'great', 'good', 'perfect', 'أحسنت', 'تمام'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? 'العفو! 😊 هل في شي ثاني أقدر أساعدك فيه؟'
     : 'You\'re welcome! 😊 Is there anything else I can help with?'
   }
  }
  return null
 }

 function addContentHandler(text) {
  if (fuzzyMatch(text, ['اضيف', 'اضافة', 'add', 'نشر', 'post', 'إضافة محتوى'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '➕ إضافة محتوى:\n\nتقدر تضيف محتوى من صفحة "الإضافات". اذا بدك تضيف مواد أو محاضرات، لازم تكون Admin وتدخل على "لوحة التحكم".'
     : '➕ Add Content:\n\nYou can add content from the "Additions" page. If you want to add courses or lectures, you need to be an admin and go to the "Dashboard".'
   }
  }
  return null
 }

 function helpHandler(text) {
  if (fuzzyMatch(text, ['مساعدة', 'help', 'ساعدني', 'محتاج مساعدة'])) {
   return {
    quickKey: 'afterHelp',
    text: isArabic
     ? '🆘 طبعاً! أنا هنا أساعدك!\n\nاسألني عن:\n• عدد المحاضرات والمصادر\n• المواد المتاحة\n• معلومات التواصل\n• الخطة الدراسية\n• طريقة التقييم\n• المفضلة\n• ملفك الشخصي\n\nجرب أسأل عن أي شي!'
     : '🆘 Of course! I\'m here to help!\n\nAsk me about:\n• Number of lectures and sources\n• Available courses\n• Contact information\n• Study plan\n• How to rate\n• Favorites\n• Your profile\n\nTry asking about anything!'
   }
  }
  return null
 }

 function goodbyeHandler(text) {
  const isGreetingBack = /وعليكم.*السلام|عليكم السلام/.test(text)
  if (isGreetingBack) return null
  if (fuzzyMatch(text, ['bye', 'goodbye', 'مع السلامة', 'الى اللقاء', 'سلام', 'exit', 'خروج'])) {
   return {
    quickKey: 'initial',
    text: isArabic
     ? 'مع السلامة! 👋 نتمنى لك يوم جميل. ارجع في أي وقت!'
     : 'Goodbye! 👋 Have a great day. Come back anytime!'
   }
  }
  return null
 }

 function jokesHandler(text) {
  if (fuzzyMatch(text, ['نكتة', 'joke', 'ضحك', 'funny', 'ازعل', 'فرفش', 'ضحكني'])) {
   const jokesAr = [
    'ليش المبرمج حط الكونساول لوق قبل النوم؟ عشان يشوف احلامه! 😄',
    'ليش الكود ما يتعب؟ لأنه دايم break! 😂',
    ' programmer: "الكود شغال عندي" — الكود ما شغال عند حد! 😅'
   ]
   const jokesEn = [
    'Why do programmers prefer dark mode? Because light attracts bugs! 😄',
    'Why do Java developers wear glasses? Because they can\'t C#! 😂',
    'A SQL query walks into a bar, sees two tables and asks... "Can I JOIN you?" 😅'
   ]
   const pool = isArabic ? jokesAr : jokesEn
   return {
    quickKey: 'default',
    text: pool[Math.floor(Math.random() * pool.length)]
   }
  }
  return null
 }

 function searchHandler(text) {
  const searchMatch = text.match(/(?:ابحث\s+عن|بحث\s+عن|search\s+for|search\s+about|find\s+about|find\b)\s*(.+)/i) || text.match(/(?:ابحث|بحث)\s+(.+)/i)

  if (!searchMatch) {
   return null
  }
  const query = searchMatch[1].trim().toLowerCase()

  if (!query) {
   return null
  }

  const matchedLectures = lectures.filter(lecture => {
   const title = isArabic ? (lecture.titleAr || '') : (lecture.titleEn || '')
   const subject = isArabic ? (lecture.subjectAr || '') : (lecture.subjectEn || '')
   return title.toLowerCase().includes(query) || subject.toLowerCase().includes(query)
  })

  const matchedSources = sources.filter(source => {
   const title = isArabic ? (source.titleAr || '') : (source.titleEn || '')
   return title.toLowerCase().includes(query)
  })

  const matchedSubjects = subjects.filter(subject => {
   const name = isArabic ? (subject.nameAr || subject.ar || '') : (subject.nameEn || subject.en || '')
   return name.toLowerCase().includes(query)
  })

  if (!matchedLectures.length && !matchedSources.length && !matchedSubjects.length) {
   return {
    quickKey: 'default',
    text: isArabic
     ? `🔍 ما لقيت نتائج لـ "${query}".\n\nجرب كلمات مختلفة أو اسأل عن المحاضرات والمصادر.`
     : `🔍 No results found for "${query}".\n\nTry different words or ask about lectures and sources.`
   }
  }

  const parts = [isArabic ? `🔍 نتائج البحث لـ "${query}":\n\n` : `🔍 Search results for "${query}":\n\n`]

  if (matchedLectures.length) {
   const heading = isArabic ? `🎬 محاضرات (${matchedLectures.length}):` : `🎬 Lectures (${matchedLectures.length}):`
   const items = matchedLectures.slice(0, 5).map(lecture => ` • ${isArabic ? lecture.titleAr : lecture.titleEn}`).join('\n')
   parts.push(`${heading}\n${items}\n\n`)
  }

  if (matchedSources.length) {
   const heading = isArabic ? `📎 مصادر (${matchedSources.length}):` : `📎 Sources (${matchedSources.length}):`
   const items = matchedSources.slice(0, 5).map(source => ` • ${isArabic ? source.titleAr : source.titleEn}`).join('\n')
   parts.push(`${heading}\n${items}\n\n`)
  }

  if (matchedSubjects.length) {
   const heading = isArabic ? `📖 مواد (${matchedSubjects.length}):` : `📖 Courses (${matchedSubjects.length}):`
   const items = matchedSubjects.slice(0, 5).map(subject => ` • ${isArabic ? (subject.nameAr || subject.ar) : (subject.nameEn || subject.en)}`).join('\n')
   parts.push(`${heading}\n${items}`)
  }

  return {
   quickKey: 'default',
   text: parts.join('').trim()
  }
 }

 function defaultHandler() {
  return {
   quickKey: 'default',
   text: isArabic
    ? '🤔 ما فهمت كلامك بالضبط، بس أنا هنا أساعدك!\n\nجرب اسألني عن:\n• المحاضرات والمواد\n• المصادر\n• معلومات التواصل\n• الخطة الدراسية\n• التقييم والمفضلة\n• اكتب "ابحث عن..." للبحث'
    : '🤔 I didn\'t quite understand, but I\'m here to help!\n\nTry asking me about:\n• Lectures and courses\n• Sources\n• Contact information\n• Study plan\n• Rating and favorites\n• Type \'search for...\' to search'
  }
 }

  return [
   greetHandler,
   howAreYouHandler,
   whoAreYouHandler,
   subjectsCountHandler,
   lecturesCountHandler,
   sourcesCountHandler,
   subjectsHandler,
  lecturesListHandler,
  sourcesListHandler,
  lectureInfoHandler,
  contactHandler,
  studyPlanHandler,
  rateHandler,
  favoritesHandler,
  profileHandler,
  thankYouHandler,
  addContentHandler,
  helpHandler,
  goodbyeHandler,
  jokesHandler,
  searchHandler,
  defaultHandler
 ]
}

export default function Chatbot() {
 const { lang, t } = useLanguage()
 const { user } = useAuth()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 const [open, setOpen] = useState(false)
 const trapRef = useFocusTrap(open)
 const [messages, setMessages] = useState([])
 const [input, setInput] = useState('')
 const [isTyping, setIsTyping] = useState(false)
 const [showQuickReplies, setShowQuickReplies] = useState(true)
 const [quickReplyKey, setQuickReplyKey] = useState('initial')
 const messagesEnd = useRef(null)
 const inputRef = useRef(null)
 const [dataCache, setDataCache] = useState({ lectures: [], sources: [], subjects: [] })
 const dataLoaded = useRef(false)
  const typingTimer = useRef(null)
  const msgIdRef = useRef(0)
  const nextId = () => `msg_${Date.now()}_${++msgIdRef.current}`
  const getHistoryKey = useCallback((studentId) => `chat_history_${studentId || 'guest'}`, [])

  useEffect(() => {
   if (!user) return
   try {
    const saved = localStorage.getItem(getHistoryKey(user.studentId))
    if (saved) {
     const parsed = JSON.parse(saved)
     if (Array.isArray(parsed) && parsed.length) {
      setMessages(parsed.slice(-30))
      setShowQuickReplies(false)
     }
    }
   } catch {}
  }, [user, getHistoryKey])

  useEffect(() => {
   if (!messages.length) return
   try { localStorage.setItem(getHistoryKey(user?.studentId), JSON.stringify(messages.slice(-30))) } catch {}
  }, [messages, user, getHistoryKey])

 useEffect(() => {
  const el = messagesEnd.current

  if (el) {
   const parent = el.parentElement
   const threshold = 80
   const isNearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < threshold

   if (isNearBottom) {
    el.scrollIntoView({ behavior: 'smooth' })
   }
  }
 }, [messages, isTyping])

 useEffect(() => {
  if (open && !dataLoaded.current) {
   async function loadData() {
    try {
     const [lectureList, sourceList, subjectList] = await Promise.all([getLectures(), getSources(), getSubjects()])
     setDataCache({ lectures: lectureList, sources: sourceList, subjects: subjectList })
     dataLoaded.current = true
    } catch {
     /* silent */
    }
   }
   loadData()
  }
 }, [open])

 useEffect(() => {
  if (open && messages.length === 0) {
   const greeting = getGreeting(isArabic)
   const name = user?.name || ''

   setMessages([{
    id: '1',
    quick: true,
    role: 'bot',
    text: `${greeting}${name ? ' ' + name : ''}! 👋\n\n${isArabic
     ? 'أنا مساعد AL-Azher IT Hub الذكي. اسألني عن أي شي وسأحاول أساعدك!'
     : 'I\'m the AL-Azher IT Hub smart assistant. Ask me anything and I\'ll do my best to help!'}`,
    time: formatTime()
   }])
  }
 }, [open, isArabic, user])

 useEffect(() => {
  if (open) {
   const timer = setTimeout(() => inputRef.current?.focus(), 300)
   return () => clearTimeout(timer)
  }
 }, [open])

 const handlers = useMemo(
  () => buildHandlers(dataCache, user, isArabic),
  [dataCache, user, isArabic]
 )

 const getResponse = useCallback(text => {
  for (const handler of handlers) {
   const result = handler(text)

   if (result) {
    return result
   }
  }
  return { quickKey: 'default', text: handlers[handlers.length - 1]().text }
 }, [handlers])

 useEffect(() => {
  return () => {
   if (typingTimer.current) {
    clearTimeout(typingTimer.current)
   }
  }
 }, [])

 useEffect(() => {
  function handleEscape(event) {
   if (event.key === 'Escape' && open) {
    setOpen(false)
   }
  }
  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
 }, [open])

 const send = useCallback(text => {
  const msgText = text || input.trim()

  if (!msgText) {
   return
  }
  if (typingTimer.current) clearTimeout(typingTimer.current)
  const userMsg = { id: nextId(), role: 'user', text: msgText, time: formatTime() }
  setShowQuickReplies(false)
  setMessages(prev => {
   const next = [...prev, userMsg]
   return next.length > 80 ? next.slice(next.length - 80) : next
  })
  setInput('')
  setIsTyping(true)

  if (user) {
   addStudentLog({
    detail: msgText,
    device: navigator.userAgent,
    ip: '',
    name: user.name,
    studentId: user.studentId,
    type: 'USE_CHATBOT'
   }).catch(() => {})
  }

  typingTimer.current = setTimeout(() => {
   const response = getResponse(msgText)
   const botMsg = { id: nextId(), role: 'bot', text: response.text, time: formatTime() }
   setMessages(prev => {
    const next = [...prev, botMsg]
    return next.length > 80 ? next.slice(next.length - 80) : next
   })
   setQuickReplyKey(response.quickKey || 'default')
   setShowQuickReplies(true)
   setIsTyping(false)
  }, 400 + Math.random() * 500)
 }, [input, user, getResponse])

  const clearChat = useCallback(() => {
   if (typingTimer.current) clearTimeout(typingTimer.current)
   setIsTyping(false)
   try { localStorage.removeItem(getHistoryKey(user?.studentId)) } catch {}
  setMessages([])
  setShowQuickReplies(true)
  setQuickReplyKey('initial')
  const greeting = getGreeting(isArabic)
  const name = user?.name || ''

  setTimeout(() => {
   setMessages([{
    id: nextId(),
    quick: true,
    role: 'bot',
    text: `${greeting}${name ? ' ' + name : ''}! 👋\n\n${isArabic
     ? 'تم مسح المحادثة. اسألني عن أي شي!'
     : 'Chat cleared. Ask me anything!'}`,
    time: formatTime()
   }])
   }, 100)
  }, [isArabic, user, getHistoryKey])

 const quickReplies = useMemo(() => {
  const keySet = QUICK_REPLIES[quickReplyKey] || QUICK_REPLIES.default
  return isArabic ? keySet.ar : keySet.en
 }, [quickReplyKey, isArabic])

 return (
  <>
   <motion.button
     aria-label={t('chatbot.assistantLabel')}
     className={`fixed bottom-6 z-50 w-14 h-14 bg-gradient-to-br from-royal-500 to-cyan-400 text-white rounded-full shadow-lg shadow-royal-500/30 flex items-center justify-center ${isArabic ? 'left-6' : 'right-6'}`}
     onClick={() => setOpen(!open)}
    whileHover={prefersReduced ? {} : { boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)', scale: 1.1 }}
    whileTap={prefersReduced ? {} : { scale: 0.95 }}
   >
    <motion.div
     animate={prefersReduced ? {} : { rotate: open ? 180 : 0 }}
     transition={prefersReduced ? {} : springFast}
    >
     {open ? <FiX size={24} /> : <FiMessageCircle size={24} />}
    </motion.div>
   </motion.button>

   <AnimatePresence>
    {open && (
      <motion.div
       ref={trapRef}
       {...modalContent}
       aria-label={t('chatbot.assistantLabel')}
       aria-modal="true"
       className={`fixed bottom-24 z-50 w-[calc(100vw-48px)] sm:w-96 h-[75vh] sm:h-[520px] bg-white dark:bg-navy-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden ${isArabic ? 'left-6' : 'right-6'}`}
       role="dialog"
      >
      <div className="bg-gradient-to-r from-royal-500 to-cyan-500 px-4 py-3.5 flex items-center gap-3">
       <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
        <FiZap size={18} className="text-white" />
       </div>
       <div className="flex-1">
        <span className="text-white font-semibold text-sm block">{t('chatbot.assistantLabel')}</span>
        <span className="text-white/80 text-xs flex items-center gap-1.5">
         <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
         {t('chatbot.onlineNow')}
        </span>
       </div>
       <div className="flex items-center gap-1">
        <button
         aria-label={isArabic ? 'مسح المحادثة' : 'Clear chat'}
         className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
         onClick={clearChat}
         title={isArabic ? 'مسح المحادثة' : 'Clear chat'}
        >
         <FiTrash2 size={16} className="text-white" />
        </button>
        <button
         aria-label={isArabic ? 'إغلاق' : 'Close'}
         className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
         onClick={() => setOpen(false)}
        >
         <FiX size={18} className="text-white" />
        </button>
       </div>
      </div>

      <div
       aria-label={t('chatbot.chatMessagesLabel')}
       aria-live="polite"
       className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-navy-900"
       role="log"
      >
       <AnimatePresence initial={false}>
        {messages.map(msg => (
         <ChatMessage
          isArabic={isArabic}
          key={msg.id}
          msg={msg}
          prefersReduced={prefersReduced}
         />
        ))}
       </AnimatePresence>
       {isTyping && <TypingIndicator />}
       <div ref={messagesEnd} />
      </div>

      <AnimatePresence>
       {showQuickReplies && (
        <motion.div
         animate={{ height: 'auto', opacity: 1 }}
         className="px-3 pb-2.5 pt-1 flex flex-wrap gap-1.5 bg-slate-50 dark:bg-navy-900 border-t border-slate-100 dark:border-slate-700/50 overflow-hidden"
         exit={{ height: 0, opacity: 0 }}
         initial={{ height: 0, opacity: 0 }}
        >
         {quickReplies.map((quickReply, idx) => {
          const Icon = quickReply.icon
          return (
           <button
            key={`${quickReplyKey}-${idx}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-navy-700 border border-slate-200 dark:border-slate-600 text-royal-600 dark:text-cyan-400 hover:bg-royal-50 dark:hover:bg-royal-500/10 rounded-full text-xs font-medium transition-colors shadow-sm"
            onClick={() => send(quickReply.text)}
           >
            <Icon size={12} />
            {quickReply.text}
           </button>
          )
         })}
        </motion.div>
       )}
      </AnimatePresence>

      <div className="p-3 bg-white dark:bg-navy-800 border-t border-slate-100 dark:border-slate-700">
       <form
        className="flex gap-2"
        onSubmit={event => {
         event.preventDefault()
         send()
        }}
       >
        <input
         aria-label={t('chatbot.inputLabel')}
         className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-navy-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-royal-400/50 transition"
         onChange={event => setInput(event.target.value)}
         placeholder={t('chatbot.inputPlaceholder')}
         ref={inputRef}
         value={input}
        />
        <button
         aria-label={t('chatbot.sendLabel')}
         className="p-2.5 bg-gradient-to-r from-royal-500 to-cyan-500 hover:from-royal-600 hover:to-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition shadow-sm"
         disabled={!input.trim()}
         type="submit"
        >
         <FiSend size={16} />
        </button>
       </form>
      </div>
     </motion.div>
    )}
   </AnimatePresence>
  </>
 )
}
