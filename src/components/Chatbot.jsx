import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getLectures, getSources, getSubjects, addStudentLog } from '../services'
import { modalContent, springFast } from '../utils/motionTokens'
import { buildChatIntents, getGreeting, formatTime } from '../utils/chatIntents'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { toast } from 'react-hot-toast'
import {
 FiMessageCircle, FiX, FiSend, FiUser, FiHelpCircle,
 FiBookOpen, FiVideo, FiLink, FiPhone, FiCalendar,
 FiStar, FiZap, FiCopy, FiCheck, FiTrash2
} from 'react-icons/fi'

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

function renderWithLinks(text, isUser, navigate) {
 const parts = text.split(/(https?:\/\/[^\s]+|\/(?:lectures|sources|home|roadmap|additions|study-plan|contact|profile|admin)(?:\/[^\s]*)?)/g)
 return parts.map((part, i) => {
  const isUrl = /^https?:\/\//.test(part)
  const isInternal = /^\/(?:lectures|sources|home|roadmap|additions|study-plan|contact|profile|admin)/.test(part)
  if (isInternal) {
   return (
    <button
     key={i}
     type="button"
     className={`inline underline underline-offset-2 font-medium ${isUser ? 'text-white hover:text-white/80' : 'text-accent hover:text-royal-600 dark:hover:text-cyan-300'}`}
     onClick={() => navigate(part)}
    >
     {part}
    </button>
   )
  }
  if (isUrl) {
   return (
    <a
     key={i}
     href={part}
     target="_blank"
     rel="noopener noreferrer"
     className={`underline underline-offset-2 font-medium ${isUser ? 'text-white hover:text-white/80' : 'text-accent hover:text-royal-600 dark:hover:text-cyan-300'}`}
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
 const navigate = useNavigate()

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
       : 'bg-white dark:bg-navy-700 text-ink rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-600'
     }`}>
      {renderWithLinks(msg.text, isUser, navigate)}
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
   const loadData = async () => {
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
  () => buildChatIntents(dataCache, user, isArabic),
  [dataCache, user, isArabic]
 )

 const getResponse = useCallback(text => {
  for (const handler of handlers) {
   const result = handler(text)

   if (result) {
    return result
   }
  }
  return { quickKey: 'default', text: handlers[handlers.length - 1](text).text }
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
  }, 250 + Math.random() * 250)
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
     aria-expanded={open}
     className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 w-14 h-14 bg-gradient-to-br from-royal-500 to-cyan-400 text-white rounded-full shadow-lg shadow-royal-500/30 flex items-center justify-center end-6`}
     onClick={() => setOpen(!open)}
    whileHover={prefersReduced ? {} : { boxShadow: '0 10px 36px rgba(37, 99, 235, 0.45)', scale: 1.08 }}
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
       className={`fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 w-[calc(100vw-48px)] sm:w-96 h-[75vh] sm:h-[520px] modal-spatial rounded-2xl flex flex-col overflow-hidden end-6`}
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
       className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/[0.02] dark:bg-black/20"
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
          role="group"
          aria-label={isArabic ? 'اقتراحات سريعة' : 'Quick suggestions'}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-3 pb-2.5 pt-1 flex flex-wrap gap-1.5 bg-black/[0.02] dark:bg-black/20 border-t border-line overflow-hidden"
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

      <div className="p-3 border-t border-line">
       <form
        className="flex gap-2"
        onSubmit={event => {
         event.preventDefault()
         send()
        }}
       >
        <input
         aria-label={t('chatbot.inputLabel')}
         className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-navy-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-ink placeholder:text-slate-500 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-royal-400/50 transition"
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