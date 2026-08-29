import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import SpatialInput from '../components/spatial/SpatialInput'
import {
 FiSend, FiLoader, FiUser, FiPhone, FiMail, FiLinkedin, FiGlobe,
 FiMessageSquare, FiCheck, FiClock, FiArrowRight, FiArrowLeft,
 FiGithub
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

const containerVariants = pageContainer
const itemVariants = pageItem

const WHATSAPP_NUMBER = '970592127061'

const socialLinks = [
 { icon: FiLinkedin, href: 'https://www.linkedin.com/in/abdullah-al-ghoul-a254763a6/', label: 'LinkedIn', color: 'from-blue-600 to-blue-500' },
 { icon: FiGlobe, href: 'https://abullah-profile.vercel.app/', label: 'Portfolio', color: 'from-purple-600 to-purple-500' },
 { icon: FiGithub, href: 'https://github.com/abdullahalghoul/al-azher-it-hub', label: 'GitHub', color: 'from-gray-700 to-gray-600' },
]

const responseTimes = [
 { icon: FiClock, label: 'Email', time: '24h' },
 { icon: FiMessageSquare, label: 'Chat', time: '2h' },
 { icon: FiPhone, label: 'Call', time: 'Instant' },
]

function buildWhatsAppLink(isArabic) {
 const message = isArabic
  ? 'مرحباً! أنا أستخدم منصة AL-Azher IT Hub وأحتاج مساعدة في حل مشكلة:'
  : 'Hello! I\'m using the AL-Azher IT Hub platform and I need help with an issue:'
 return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export default function Contact() {
 const { lang, t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 const [sent, setSent] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const [messageLen, setMessageLen] = useState(0)
 const [focusedField, setFocusedField] = useState(null)
 const submitTimer = useRef(null)
 const resetTimer = useRef(null)

 
 useEffect(() => {
  return () => {
   if (submitTimer.current) clearTimeout(submitTimer.current)
   if (resetTimer.current) clearTimeout(resetTimer.current)
  }
 }, [])

 const handleSubmit = (e) => {
  e.preventDefault()
  setSubmitting(true)
  const form = e.target
  const subject = encodeURIComponent(form.subject.value)
  const body = encodeURIComponent(
   `${t('contact.form.name')}: ${form.name.value}\n${t('contact.form.emailPlaceholder')}: ${form.email.value}\n${t('contact.form.message')}:\n${form.message.value}`
  )
  submitTimer.current = setTimeout(() => {
   window.location.href = `mailto:abdallhalghoul200@gmail.com?subject=${subject}&body=${body}`
   setSent(true)
   setSubmitting(false)
   setMessageLen(0)
   resetTimer.current = setTimeout(() => setSent(false), 5000)
  }, 500)
 }

 const contactInfo = [
  { icon: FiUser, text: t('contact.info.address'), gradient: 'from-royal-500 to-cyan-500' },
  { icon: FiPhone, text: t('contact.info.phone'), sublabel: isArabic ? 'متاح في أوقات العمل' : 'Available during work hours', gradient: 'from-emerald-500 to-teal-500' },
  { icon: FiMail, text: t('contact.info.email'), sublabel: isArabic ? 'نرد خلال 24 ساعة' : 'We reply within 24h', gradient: 'from-violet-500 to-purple-500' },
 ]

 return (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="min-h-screen bg-spatial-page ">
   {/* Hero Section */}
   <div className="relative pt-24 pb-16 overflow-hidden">
    {/* Background decorations */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
     <div className="absolute -top-40 -right-40 w-80 h-80 bg-royal-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl" />
     <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 dark:bg-royal-500/10 rounded-full blur-3xl" />
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-royal-500/5 to-cyan-500/5 rounded-full blur-3xl" />
    </div>

    <div className="relative container-page text-center">
     <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-royal-600 dark:text-cyan-400 mb-6"
     >
      <FiMessageSquare size={16} />
      {isArabic ? 'نحن هنا لمساعدتك' : "We're here to help"}
     </motion.div>

     <motion.h1
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink mb-4"
     >
      {isArabic ? 'تواصل' : 'Get in'}{' '}
      <span className="gradient-text-spatial">{isArabic ? 'معنا' : 'Touch'}</span>
     </motion.h1>

     <motion.p
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-slate-500 dark:text-white/50 text-lg max-w-2xl mx-auto mb-8"
     >
      {t('contact.subtitle')}
     </motion.p>

     {/* Response time badges */}
     <motion.div
      initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-wrap justify-center gap-4"
     >
      {responseTimes.map((item, idx) => (
       <div key={idx} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm">
        <item.icon size={14} className="text-accent" />
        <span className="text-slate-600 dark:text-white/60">{item.label}</span>
        <span className="font-semibold text-ink">{item.time}</span>
       </div>
      ))}
     </motion.div>
    </div>
   </div>

   {/* Main Content */}
   <div className="container-page pb-20">
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
     {/* Form Section - Takes 3 columns */}
     <div className="lg:col-span-3">
      <motion.div
       variants={itemVariants}
       className="glass rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      >
       {/* Form header */}
       <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-royal-500/25">
         <FiSend size={18} />
        </div>
        <div>
         <h2 className="text-xl font-bold text-ink">{t('contact.form.send')}</h2>
         <p className="text-sm text-slate-500 dark:text-white/50">{isArabic ? 'نرد على رسائلك بسرعة!' : 'We respond quickly!'}</p>
        </div>
       </div>

       <AnimatePresence mode="wait">
        {sent ? (
         <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="py-12 text-center"
         >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-400/20 dark:to-teal-400/20 border border-emerald-200/30 dark:border-emerald-400/20 flex items-center justify-center">
           <FiCheck className="text-4xl text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-ink mb-2">
           {isArabic ? 'تم الإرسال بنجاح!' : 'Message Sent!'}
          </h3>
          <p className="text-slate-500 dark:text-white/50 max-w-md mx-auto">
           {isArabic
            ? 'يجب أن يفتح بريدك الإلكتروني. إذا لم يحدث، أرسل لنا على abdallhalghoul200@gmail.com'
            : 'Your email client should open. If not, email us at abdallhalghoul200@gmail.com'}
          </p>
          <button
           onClick={() => setSent(false)}
           className="mt-6 inline-flex items-center gap-2 text-accent font-medium hover:underline"
          >
           {isArabic ? 'إرسال رسالة أخرى' : 'Send another message'}
           {isArabic ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
          </button>
         </motion.div>
        ) : (
         <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleSubmit}
          className="space-y-5"
         >
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="relative">
             <label htmlFor="contact-name" className="sr-only">{t('contact.form.namePlaceholder')}</label>
             <SpatialInput
              id="contact-name"
              type="text"
              name="name"
              required
              placeholder={t('contact.form.namePlaceholder')}
              isArabic={isArabic}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
             />
            {focusedField === 'name' && (
             <motion.div
              layoutId="focus-indicator-name"
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-royal-500 to-cyan-500 rounded-full"
             />
            )}
           </div>
            <div className="relative">
             <label htmlFor="contact-email" className="sr-only">{t('contact.form.emailPlaceholder')}</label>
             <SpatialInput
              id="contact-email"
              type="email"
              name="email"
             required
             placeholder={t('contact.form.emailPlaceholder')}
             isArabic={isArabic}
             onFocus={() => setFocusedField('email')}
             onBlur={() => setFocusedField(null)}
            />
            {focusedField === 'email' && (
             <motion.div
              layoutId="focus-indicator-email"
              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-royal-500 to-cyan-500 rounded-full"
             />
            )}
           </div>
          </div>

          <div className="relative">
           <label htmlFor="contact-subject" className="sr-only">{t('contact.form.subjectPlaceholder')}</label>
           <SpatialInput
            id="contact-subject"
            type="text"
            name="subject"
            required
            placeholder={t('contact.form.subjectPlaceholder')}
            isArabic={isArabic}
            onFocus={() => setFocusedField('subject')}
            onBlur={() => setFocusedField(null)}
           />
           {focusedField === 'subject' && (
            <motion.div
             layoutId="focus-indicator-subject"
             className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-royal-500 to-cyan-500 rounded-full"
            />
           )}
          </div>

          <div className="relative">
           <label htmlFor="contact-message" className="block text-sm font-medium text-slate-600 dark:text-white/70 mb-2">
            {t('contact.form.message')}
           </label>
           <div className="relative group">
            <FiMessageSquare
             aria-hidden="true"
             className="absolute top-3.5 start-4 text-slate-400 dark:text-white/40 group-focus-within:text-royal-500 dark:group-focus-within:text-cyan-400 transition-colors"
             size={16}
            />
            <textarea
             id="contact-message"
             name="message"
             required
             rows="5"
             maxLength={1000}
             placeholder={t('contact.form.messagePlaceholder')}
             onChange={(e) => setMessageLen(e.target.value.length)}
             onFocus={() => setFocusedField('message')}
             onBlur={() => setFocusedField(null)}
             className={`input-spatial w-full rounded-xl ps-11 pe-4 py-3.5 text-ink placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none resize-none transition-all duration-200 ${focusedField === 'message' ? 'ring-2 ring-royal-500/50 dark:ring-cyan-400/50' : ''}`}
             dir={isArabic ? 'rtl' : 'ltr'}
            />
           </div>
           <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-slate-500 dark:text-white/60">
             {messageLen > 0 && (
              <span className={messageLen > 500 ? 'text-amber-600 dark:text-amber-400' : ''}>
               {messageLen} {isArabic ? 'حرف' : 'chars'}
              </span>
             )}
            </div>
            {messageLen > 500 && (
             <span className="text-xs text-amber-600 dark:text-amber-400">{isArabic ? 'رسالة طويلة' : 'Long message'}</span>
            )}
           </div>
          </div>

          <motion.button
           type="submit"
           whileHover={prefersReduced ? {} : { scale: 1.01 }}
           whileTap={prefersReduced ? {} : { scale: 0.99 }}
           disabled={submitting}
           className="w-full btn-spatial text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
          >
           <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
           {submitting ? (
            <FiLoader size={18} className="animate-spin" />
           ) : (
            <>
             <FiSend size={18} />
             {isArabic ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
            </>
           )}
           <span className="relative z-10">
            {submitting ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : t('contact.form.send')}
           </span>
          </motion.button>
         </motion.form>
        )}
       </AnimatePresence>
      </motion.div>
     </div>

     {/* Contact Info Sidebar - Takes 2 columns */}
     <div className="lg:col-span-2 space-y-6">
      {/* Contact Cards */}
      <motion.div variants={itemVariants} className="space-y-4">
       {contactInfo.map((info, idx) => {
        const Icon = info.icon
        return (
         <motion.div
          key={idx}
          initial={prefersReduced ? {} : { opacity: 0, x: isArabic ? 20 : -20 }}
          animate={prefersReduced ? {} : { opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={prefersReduced ? {} : { x: isArabic ? -4 : 4, scale: 1.01 }}
          className="glass rounded-xl p-5 flex items-center gap-4 cursor-default group"
         >
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
           <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
           <p dir={info.text?.includes('+') ? 'ltr' : undefined} className="font-semibold text-ink truncate">
            {info.text}
           </p>
           <p className="text-sm text-slate-500 dark:text-white/50">{info.sublabel}</p>
          </div>
          {info.text?.includes('@') && (
           <a
            href={`mailto:${info.text}`}
            className="p-2 rounded-lg text-slate-400 hover:text-royal-500 dark:hover:text-cyan-400 hover:bg-royal-50 dark:hover:bg-cyan-500/10 transition-all"
            aria-label={isArabic ? 'إرسال بريد' : 'Send email'}
           >
            <FiArrowRight size={16} className={isArabic ? 'rotate-180' : ''} />
           </a>
          )}
         </motion.div>
        )
       })}
      </motion.div>

      {/* WhatsApp CTA */}
      <motion.div
       initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
       animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
       transition={{ delay: 0.15 }}
       className="gradient-border rounded-xl p-5 overflow-hidden relative"
      >
       <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
       <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl" />
       <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 flex-shrink-0">
         <FaWhatsapp size={26} />
        </div>
        <div className="flex-1 min-w-0">
         <h3 className="font-bold text-ink">{isArabic ? 'تواصل عبر واتساب' : 'WhatsApp Us'}</h3>
         <p className="text-sm text-slate-500 dark:text-white/60">{isArabic ? 'الرد الأسرع والأسهل — اضغط وابدأ المحادثة' : 'Fastest and easiest — tap to start chatting'}</p>
        </div>
        <a
         href={buildWhatsAppLink(isArabic)}
         target="_blank"
         rel="noopener noreferrer"
         className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition flex-shrink-0 shadow-lg shadow-emerald-500/25"
        >
         <FaWhatsapp size={16} />
         {isArabic ? 'ابدأ المحادثة' : 'Start chat'}
        </a>
       </div>
       <p className="relative mt-3 text-xs text-slate-400 dark:text-white/40">
        {isArabic ? 'ستُفتح رسالة جاهزة: "أنا من منصة AL-Azher IT Hub وأحتاج مساعدة في حل مشكلة..."' : 'A ready message will open: "I\'m from AL-Azher IT Hub and need help with an issue..."'}
       </p>
      </motion.div>

      {/* Social Links */}
      <motion.div variants={itemVariants} className="glass rounded-xl p-6">
       <h3 className="text-lg font-bold text-ink mb-4">
        {isArabic ? 'تابعنا' : 'Follow Us'}
       </h3>
       <div className="grid grid-cols-2 gap-3">
        {socialLinks.map((social, idx) => (
         <motion.a
          key={idx}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={prefersReduced ? {} : { scale: 1.05, y: -2 }}
          whileTap={prefersReduced ? {} : { scale: 0.95 }}
          className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${social.color} text-white shadow-lg hover:shadow-xl transition-shadow`}
         >
          <social.icon size={18} />
          <span className="text-sm font-medium">{social.label}</span>
         </motion.a>
        ))}
       </div>
      </motion.div>

      {/* Quick Response */}
      <motion.div variants={itemVariants} className="glass rounded-xl p-6">
       <h3 className="text-lg font-bold text-ink mb-4">
        {isArabic ? 'الاستجابة السريعة' : 'Quick Response'}
       </h3>
       <div className="space-y-3">
        {[
         { icon: FiCheck, text: isArabic ? 'رد خلال 24 ساعة' : 'Reply within 24 hours' },
         { icon: FiCheck, text: isArabic ? 'دعم فني متخصص' : 'Dedicated tech support' },
         { icon: FiCheck, text: isArabic ? 'حل المشاكل العاجلة' : 'Urgent issue resolution' },
        ].map((item, idx) => (
         <div key={idx} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center flex-shrink-0">
           <item.icon size={12} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <span className="text-sm text-slate-600 dark:text-white/60">{item.text}</span>
         </div>
        ))}
       </div>
      </motion.div>
     </div>
    </div>
   </div>
  </motion.div>
 )
}
