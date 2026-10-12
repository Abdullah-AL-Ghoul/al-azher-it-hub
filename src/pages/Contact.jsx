import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import SpatialInput from '../components/spatial/SpatialInput'
import {
  FiSend, FiLoader, FiUser, FiPhone, FiMail, FiLinkedin, FiGlobe,
  FiMessageSquare, FiCheck, FiClock, FiArrowRight, FiArrowLeft,
  FiGithub, FiCopy, FiChevronDown, FiExternalLink, FiZap, FiCheckCircle
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'

const containerVariants = pageContainer
const itemVariants = pageItem

const DEVELOPER_PROFILE = {
  nameAr: 'م. عبد الله الغول',
  nameEn: 'Eng. Abdullah Al-Ghoul',
  roleAr: 'مهندس ومطور منصة AL-Azher IT Hub',
  roleEn: 'Lead Software Engineer & Platform Creator',
  email: 'abdallhalghoul200@gmail.com',
  phone: '+970592127061',
  whatsappNumber: '970592127061',
  portfolioUrl: 'https://abdullah-portfolio26.vercel.app/',
  githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
  linkedinUrl: 'https://www.linkedin.com/in/abdullah-al-ghoul-a254763a6/',
}

const INQUIRY_TOPICS = [
  {
    id: 'academic',
    labelAr: 'استفسار أكاديمي / مقررات',
    labelEn: 'Academic / Course Question',
    subjectAr: '[استفسار أكاديمي] بخصوص المقررات الدراسية',
    subjectEn: '[Academic Question] Regarding IT Courses',
    color: 'from-royal-500 to-cyan-500',
  },
  {
    id: 'suggestion',
    labelAr: 'اقتراح ميزة أو مادة جديدة',
    labelEn: 'Feature / Course Suggestion',
    subjectAr: '[اقتراح ميزة] فكرة لتطوير المنصة أو إضافة مادة',
    subjectEn: '[Feature Suggestion] Platform improvement idea',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'bug',
    labelAr: 'إبلاغ عن مشكلة أو رابط معطل',
    labelEn: 'Report Issue / Broken Link',
    subjectAr: '[إبلاغ عن خطأ] رابط معطل أو مشكلة فنية',
    subjectEn: '[Bug Report] Broken link or technical issue',
    color: 'from-rose-500 to-amber-500',
  },
  {
    id: 'contribute',
    labelAr: 'مشاركة علمية / انضمام للمشروع',
    labelEn: 'Contribute / Collaboration',
    subjectAr: '[مشاركة علمية] الرغبة في إثراء المحتوى والمواد',
    subjectEn: '[Collaboration] Academic content contribution',
    color: 'from-violet-500 to-purple-500',
  },
]

const FAQ_ITEMS = [
  {
    questionAr: 'كيف يمكنني اقتراح إضافة شروحات أو ملخصات غير متوفرة؟',
    questionEn: 'How can I request new courses, videos, or summaries?',
    answerAr: 'يمكنك اختيار تصنيف "اقتراح ميزة أو مادة جديدة" عبر النموذج أدناه، أو مراسلتنا مباشرة على واتساب متضمناً اسم المادة والتخصص، وسنعمل على توفيرها بأسرع وقت.',
    answerEn: 'You can choose "Feature / Course Suggestion" in the form below or chat directly on WhatsApp with course details, and we will prioritize adding it.',
  },
  {
    questionAr: 'هل كافة خطط ومقررات كلية تكنولوجيا المعلومات محدثة؟',
    questionEn: 'Are all IT curriculum plans and courses up to date?',
    answerAr: 'نعم، المنصة تغطي تخصصات (هندسة البرمجيات، علوم الحاسوب، نظم المعلومات، والوسائط وتطوير الويب) ومطابقة للخطة الدراسية الأكاديمية المعتمدة لعام 2026.',
    answerEn: 'Yes, the platform covers all faculty majors (Software Engineering, CS, IS, Multimedia & Web) aligned with the active 2026 university curriculum.',
  },
  {
    questionAr: 'أين يمكنني الانضمام لمجموعات واتساب التخصصية للدفعات؟',
    questionEn: 'Where can I find and join academic WhatsApp groups?',
    answerAr: 'تتوفر روابط مجموعات الدفعات والتخصصات في قسم "الإضافات" عبر شريط التنقل العلوي مع روابط انضمام مباشرة وسريعة.',
    answerEn: 'All academic WhatsApp study group links are cataloged in the "Additions" section in the navigation bar with 1-click join buttons.',
  },
  {
    questionAr: 'واجهت مشكلة في الدخول أو نسيت كلمة المرور، ما الحل؟',
    questionEn: 'What should I do if I cannot sign in or forgot my password?',
    answerAr: 'يمكنك التوجه فوراً لصفحة "استعادة كلمة المرور" للتحقق عبر الرقم الجامعي وتعيين كلمة مرور جديدة في 4 خطوات بسيطة، أو التواصل معنا للدعم.',
    answerEn: 'Head to "Forgot Password" to reset your password using your university ID in 4 simple steps, or reach out to us for technical assistance.',
  },
]

export default function Contact() {
  const { lang, t } = useLanguage()
  const prefersReduced = useReducedMotion()
  const isArabic = lang === 'ar'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('academic')
  const [sendMethod, setSendMethod] = useState('email') // 'email' | 'whatsapp'
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [messageLen, setMessageLen] = useState(0)
  const [activeFaq, setActiveFaq] = useState(null)
  const [focusedField, setFocusedField] = useState(null)

  const submitTimer = useRef(null)
  const resetTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (submitTimer.current) clearTimeout(submitTimer.current)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  // Auto-fill subject when topic changes if user hasn't typed custom subject
  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic.id)
    const suggested = isArabic ? topic.subjectAr : topic.subjectEn
    setSubject(suggested)
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(isArabic ? `تم نسخ ${label} بنجاح` : `${label} copied to clipboard`)
  }

  const buildWhatsAppUrl = () => {
    const topicObj = INQUIRY_TOPICS.find((tp) => tp.id === selectedTopic)
    const topicLabel = topicObj ? (isArabic ? topicObj.labelAr : topicObj.labelEn) : ''
    const msg = isArabic
      ? `مرحباً م. عبد الله!\nالاسم: ${name || 'طالب'}\nالبريد: ${email || 'غير محدد'}\nالتصنيف: ${topicLabel}\nالموضوع: ${subject || 'استفسار'}\n\nالرسالة:\n${message || 'أحتاج مساعدة في منصة AL-Azher IT Hub'}`
      : `Hello Eng. Abdullah!\nName: ${name || 'Student'}\nEmail: ${email || 'Not provided'}\nCategory: ${topicLabel}\nSubject: ${subject || 'Inquiry'}\n\nMessage:\n${message || 'I need help on AL-Azher IT Hub'}`
    return `https://wa.me/${DEVELOPER_PROFILE.whatsappNumber}?text=${encodeURIComponent(msg)}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)

    if (sendMethod === 'whatsapp') {
      submitTimer.current = setTimeout(() => {
        window.open(buildWhatsAppUrl(), '_blank')
        setSent(true)
        setSubmitting(false)
        resetTimer.current = setTimeout(() => setSent(false), 5000)
      }, 400)
      return
    }

    // Default: Email mailto protocol
    const topicObj = INQUIRY_TOPICS.find((tp) => tp.id === selectedTopic)
    const topicLabel = topicObj ? (isArabic ? topicObj.labelAr : topicObj.labelEn) : ''
    const finalSubject = encodeURIComponent(subject || `[AL-Azher IT Hub] ${topicLabel}`)
    const finalBody = encodeURIComponent(
      `${t('contact.form.name')}: ${name}\n${t('contact.form.emailPlaceholder')}: ${email}\nالتصنيف: ${topicLabel}\n\n${t('contact.form.message')}:\n${message}`
    )

    submitTimer.current = setTimeout(() => {
      window.location.href = `mailto:${DEVELOPER_PROFILE.email}?subject=${finalSubject}&body=${finalBody}`
      setSent(true)
      setSubmitting(false)
      resetTimer.current = setTimeout(() => setSent(false), 5000)
    }, 400)
  }

  const socialChannels = [
    {
      name: isArabic ? 'المعرض الشخصي' : 'Portfolio',
      sub: isArabic ? 'استعراض المشاريع والخبرات' : 'Projects & Portfolio',
      icon: FiGlobe,
      url: DEVELOPER_PROFILE.portfolioUrl,
      color: 'from-purple-600 to-indigo-600',
      badge: 'abdullah-portfolio26',
    },
    {
      name: isArabic ? 'حساب جيت هب' : 'GitHub Profile',
      sub: isArabic ? 'المستودعات والكود المصدري' : 'Repositories & Source Code',
      icon: FiGithub,
      url: DEVELOPER_PROFILE.githubUrl,
      color: 'from-slate-800 to-zinc-900',
      badge: '@Abdullah-AL-Ghoul',
    },
    {
      name: isArabic ? 'لينكد إن' : 'LinkedIn',
      sub: isArabic ? 'الملف المهني والشبكة' : 'Professional Profile',
      icon: FiLinkedin,
      url: DEVELOPER_PROFILE.linkedinUrl,
      color: 'from-blue-600 to-sky-600',
      badge: 'Abdullah Al-Ghoul',
    },
    {
      name: isArabic ? 'واتساب المباشر' : 'Direct WhatsApp',
      sub: isArabic ? 'دردشة فورية وسريعة' : 'Instant Chat & Fast Reply',
      icon: FaWhatsapp,
      url: `https://wa.me/${DEVELOPER_PROFILE.whatsappNumber}`,
      color: 'from-emerald-600 to-teal-600',
      badge: '+970 59-212-7061',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-spatial-page pt-24 pb-20"
    >
      {/* Hero Header Section */}
      <div className="relative pb-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-royal-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 dark:bg-royal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container-page text-center">
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-xs sm:text-sm font-semibold text-royal-600 dark:text-cyan-400 mb-5 border border-royal-500/20 shadow-xs"
          >
            <FiZap size={15} />
            <span>{isArabic ? 'مركز التواصل والدعم الفني والأكاديمي' : 'Support & Academic Contact Center'}</span>
          </motion.div>

          <motion.h1
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink mb-3 tracking-tight"
          >
            {isArabic ? 'تواصل مع' : 'Get in'}{' '}
            <span className="gradient-text-spatial">
              {isArabic ? 'مهندس ومطور المنصة' : 'Direct Touch With Us'}
            </span>
          </motion.h1>

          <motion.p
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6"
          >
            {isArabic
              ? 'نحن هنا للإجابة على استفساراتكم، استقبال اقتراحاتكم، وتوفير الدعم الأكاديمي والتقني لكافة طلبة كلية تكنولوجيا المعلومات بجامعة الأزهر.'
              : 'We are here to answer your questions, welcome suggestions, and provide seamless technical and academic support for all IT students.'}
          </motion.p>

          {/* Quick Metrics & Response Badges */}
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold"
          >
            <div className="flex items-center gap-2 px-3.5 py-1.5 glass rounded-xl text-slate-700 dark:text-white/80 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isArabic ? 'متاح للمساعدة والدعم' : 'Live & Available'}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 glass rounded-xl text-slate-700 dark:text-white/80 border border-white/10">
              <FaWhatsapp className="text-emerald-500" size={13} />
              <span>{isArabic ? 'رد فوري عبر واتساب' : 'Instant WhatsApp Response'}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 glass rounded-xl text-slate-700 dark:text-white/80 border border-white/10">
              <FiClock className="text-royal-500 dark:text-cyan-400" size={13} />
              <span>{isArabic ? 'رد خلال 24 ساعة عبر البريد' : 'Email Reply < 24 Hours'}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT / MAIN COLUMN (Form Section) - 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div variants={itemVariants} className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-royal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-royal-500/25">
                    <FiSend size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-ink">
                      {isArabic ? 'نموذج التواصل السريع' : 'Fast Contact Form'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      {isArabic ? 'اختر تصنيف الاستفسار وطريقة الإرسال المناسبة لك' : 'Select topic and choose your preferred send method'}
                    </p>
                  </div>
                </div>

                {/* Send Method Toggle: Email vs WhatsApp */}
                <div className="flex rounded-xl bg-slate-100/90 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSendMethod('email')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sendMethod === 'email'
                        ? 'bg-white dark:bg-white/15 text-royal-600 dark:text-cyan-300 shadow-xs'
                        : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    <FiMail size={13} />
                    <span>{isArabic ? 'بريد' : 'Email'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMethod('whatsapp')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sendMethod === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    <FaWhatsapp size={13} />
                    <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
                  </button>
                </div>
              </div>

              {/* Topic Selector Chips */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-2 ms-1">
                  {isArabic ? 'ما هو موضوع تواصلك معنا؟' : 'What is your inquiry about?'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INQUIRY_TOPICS.map((topic) => {
                    const isSelected = selectedTopic === topic.id
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => handleSelectTopic(topic)}
                        className={`text-start p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-royal-500/10 dark:bg-cyan-500/15 border-royal-500/40 dark:border-cyan-400/40 text-royal-700 dark:text-cyan-300 shadow-xs'
                            : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-royal-500 dark:bg-cyan-400' : 'bg-slate-300 dark:bg-white/20'
                            }`}
                          />
                          <span className="truncate">{isArabic ? topic.labelAr : topic.labelEn}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="sent-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                      <FiCheckCircle size={36} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ink mb-1.5">
                        {isArabic ? 'تم تجهيز رسالتك بنجاح!' : 'Your message is ready!'}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 max-w-sm mx-auto leading-relaxed">
                        {sendMethod === 'whatsapp'
                          ? (isArabic ? 'تم فتح تطبيق واتساب للتواصل المباشر مع المهندس عبد الله الغول.' : 'WhatsApp chat initiated with Eng. Abdullah Al-Ghoul.')
                          : (isArabic ? 'تم توجيه الرسالة إلى تطبيق البريد الإلكتروني الخاص بك.' : 'Your email client has been prepared with your message.')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSent(false)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-spatial text-xs font-semibold transition"
                    >
                      {isArabic ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                      {isArabic ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1">
                          {t('contact.form.name')}
                        </label>
                        <SpatialInput
                          id="contact-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t('contact.form.namePlaceholder')}
                          isArabic={isArabic}
                          icon={FiUser}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1">
                          {t('contact.form.email')}
                        </label>
                        <SpatialInput
                          id="contact-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('contact.form.emailPlaceholder')}
                          isArabic={isArabic}
                          icon={FiMail}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1">
                        {t('contact.form.subject')}
                      </label>
                      <SpatialInput
                        id="contact-subject"
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={t('contact.form.subjectPlaceholder')}
                        isArabic={isArabic}
                        icon={FiMessageSquare}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5 ms-1">
                        <label htmlFor="contact-message" className="text-xs font-semibold text-slate-600 dark:text-white/70">
                          {t('contact.form.message')}
                        </label>
                        <span className={`text-[11px] ${messageLen > 600 ? 'text-amber-500' : 'text-slate-400 dark:text-white/40'}`}>
                          {messageLen} / 1000
                        </span>
                      </div>
                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        maxLength={1000}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value)
                          setMessageLen(e.target.value.length)
                        }}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={t('contact.form.messagePlaceholder')}
                        className={`w-full rounded-2xl glass p-3.5 text-xs sm:text-sm text-ink placeholder:text-slate-400 dark:placeholder:text-white/40 border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-royal-500/40 transition-all resize-none leading-relaxed`}
                        dir="auto"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${
                        sendMethod === 'whatsapp'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
                          : 'bg-gradient-to-r from-royal-600 to-cyan-600 hover:from-royal-700 hover:to-cyan-700 shadow-royal-600/25'
                      }`}
                    >
                      {submitting ? (
                        <FiLoader size={17} className="animate-spin" />
                      ) : sendMethod === 'whatsapp' ? (
                        <>
                          <FaWhatsapp size={17} />
                          <span>{isArabic ? 'إرسال مباشر عبر واتساب' : 'Send via WhatsApp'}</span>
                        </>
                      ) : (
                        <>
                          <FiSend size={16} />
                          <span>{t('contact.form.send')}</span>
                          {isArabic ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Interactive FAQ Accordion */}
            <motion.div variants={itemVariants} className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-sm">
              <h3 className="text-base sm:text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <FiZap className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'الأسئلة الشائعة وإجابات سريعة' : 'Frequently Asked Questions'}</span>
              </h3>
              <div className="space-y-2.5">
                {FAQ_ITEMS.map((faq, idx) => {
                  const isOpen = activeFaq === idx
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden bg-slate-50/50 dark:bg-white/[0.02]"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 text-start flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-ink hover:text-royal-600 dark:hover:text-cyan-400 transition"
                      >
                        <span>{isArabic ? faq.questionAr : faq.questionEn}</span>
                        <FiChevronDown
                          size={15}
                          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-royal-500' : 'text-slate-400'}`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 dark:text-white/70 leading-relaxed border-t border-slate-100 dark:border-white/5"
                          >
                            {isArabic ? faq.answerAr : faq.answerEn}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR (Developer Profile & Direct Channels) - 5 Columns */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Engineer Profile Spotlight Card */}
            <motion.div variants={itemVariants} className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-royal-500/10 dark:bg-cyan-500/10 rounded-full blur-2xl" />
              
              <div className="relative flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-royal-600 to-cyan-500 text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-royal-500/30 shrink-0">
                  AG
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {isArabic ? 'متاح للدعم الأكاديمي' : 'Available for Academic Inquiries'}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-ink leading-tight">
                    {isArabic ? DEVELOPER_PROFILE.nameAr : DEVELOPER_PROFILE.nameEn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {isArabic ? DEVELOPER_PROFILE.roleAr : DEVELOPER_PROFILE.roleEn}
                  </p>
                </div>
              </div>

              {/* Direct Info Copy Badges */}
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiMail className="text-royal-500 dark:text-cyan-400 shrink-0" size={15} />
                    <span className="text-ink truncate font-medium">{DEVELOPER_PROFILE.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEVELOPER_PROFILE.email, isArabic ? 'البريد الإلكتروني' : 'Email')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/10 transition shrink-0"
                    title={isArabic ? 'نسخ البريد' : 'Copy Email'}
                  >
                    <FiCopy size={13} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FiPhone className="text-emerald-500 shrink-0" size={15} />
                    <span dir="ltr" className="text-ink font-semibold">{DEVELOPER_PROFILE.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(DEVELOPER_PROFILE.phone, isArabic ? 'رقم الهاتف' : 'Phone')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-ink hover:bg-slate-200/60 dark:hover:bg-white/10 transition shrink-0"
                    title={isArabic ? 'نسخ الرقم' : 'Copy Phone'}
                  >
                    <FiCopy size={13} />
                  </button>
                </div>
              </div>

              {/* Verified Links Grid (Portfolio, GitHub, LinkedIn, WhatsApp) */}
              <h4 className="text-xs font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-3 ms-1">
                {isArabic ? 'الروابط الرسمية والحسابات البرمجية' : 'Official Portfolios & Profiles'}
              </h4>

              <div className="space-y-2.5">
                {socialChannels.map((chan, idx) => {
                  const Icon = chan.icon
                  return (
                    <a
                      key={idx}
                      href={chan.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] border border-slate-200/70 dark:border-white/10 transition-all shadow-xs hover:border-royal-500/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${chan.color} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-ink group-hover:text-royal-600 dark:group-hover:text-cyan-400 transition-colors">
                            {chan.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-white/40 truncate">
                            {chan.badge}
                          </p>
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-ink group-hover:translate-x-0.5 transition-all">
                        <FiExternalLink size={14} />
                      </div>
                    </a>
                  )
                })}
              </div>
            </motion.div>

            {/* Direct WhatsApp Callout Banner */}
            <motion.div
              variants={itemVariants}
              className="rounded-3xl p-6 bg-gradient-to-br from-emerald-600/15 via-teal-500/10 to-transparent border border-emerald-500/30 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
                  <FaWhatsapp size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-ink mb-1">
                    {isArabic ? 'تواصل فوري عبر واتساب' : 'Direct WhatsApp Help'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed mb-3">
                    {isArabic
                      ? 'هل تواجه صعوبة في العثور على مادة أو لديك استفسار عاجل؟ محادثتنا مفتوحة لمساعدتك.'
                      : 'Need urgent help finding materials or have a platform question? Chat with us instantly.'}
                  </p>
                  <a
                    href={`https://wa.me/${DEVELOPER_PROFILE.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 hover:scale-[1.02]"
                  >
                    <FaWhatsapp size={14} />
                    <span>{isArabic ? 'بدء محادثة واتساب الآن' : 'Start WhatsApp Chat'}</span>
                    <FiExternalLink size={12} className="opacity-80" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* University & Academic Trust Card */}
            <motion.div variants={itemVariants} className="glass rounded-3xl p-6 border border-white/10 text-center space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-cyan-400">
                {isArabic ? 'جامعة الأزهر - غزة' : 'Al-Azhar University - Gaza'}
              </h5>
              <p className="text-xs text-slate-600 dark:text-white/60">
                {isArabic
                  ? 'كلية تكنولوجيا المعلومات — منصة تعليمية غير ربحية مخصصة لخدمة طلبة الكلية.'
                  : 'Faculty of Information Technology — A non-profit portal serving IT students.'}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
