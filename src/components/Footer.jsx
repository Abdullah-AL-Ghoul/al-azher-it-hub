import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
 import { FiArrowUpRight, FiLinkedin, FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import SiteLogo from './shared/SiteLogo'

export default memo(function Footer() {
  const { t, lang } = useLanguage()
  const isArabic = lang === 'ar'
  const prefersReduced = useReducedMotion()

 const links = [
  { to: '/home', label: t('nav.home') },
  { to: '/lectures', label: t('nav.lectures') },
  { to: '/sources', label: t('nav.sources') },
  { to: '/study-plan', label: t('nav.studyPlan') },
  { to: '/additions', label: t('nav.additions') },
  { to: '/contact', label: t('nav.contact') },
 ]

 const resourceLinks = [
  { to: '/lectures', label: t('nav.lectures') },
  { to: '/sources', label: t('nav.sources') },
  { to: '/study-plan', label: t('nav.studyPlan') },
  { to: '/additions', label: t('nav.additions') },
 ]

 return (
  <footer className="relative glass border-t border-white/10 text-ink">
   <motion.div
    variants={prefersReduced ? {} : pageContainer}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-50px' }}
    className="container-page py-16"
   >
    {/* CTA banner */}
    <div className="gradient-border rounded-2xl p-6 md:p-8 mb-14 overflow-hidden relative">
     <div className="absolute -top-16 -end-16 w-48 h-48 bg-royal-500/10 rounded-full blur-3xl" />
     <div className="absolute -bottom-16 -start-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
     <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
       <h3 className="text-xl md:text-2xl font-bold text-ink mb-1">{t('footer.ctaTitle')}</h3>
       <p className="text-slate-500 dark:text-slate-400 text-sm">{t('footer.ctaDesc')}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
       <Link to="/lectures" className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl btn-primary font-semibold text-sm">
        {t('nav.lectures')} <FiArrowUpRight size={16} />
       </Link>
       <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl btn-secondary font-semibold text-sm">
        {t('footer.contact')} <FiArrowUpRight size={16} />
       </Link>
      </div>
     </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
     <motion.div variants={pageItem} className="lg:col-span-1">
      <Link to="/home" className="flex items-center gap-2 mb-4 group">
       <SiteLogo size="sm" />
       <span className="font-bold text-lg">{t('site.title')}</span>
      </Link>
      <h3 className="font-semibold text-sm text-accent uppercase tracking-wider mb-4">
       {t('footer.about')}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
       {t('footer.aboutDesc')}
      </p>
       <Link to="/contact" className="inline-flex items-center gap-1.5 py-1.5 mb-5 text-accent hover:text-royal-600 dark:hover:text-cyan-300 text-sm font-medium transition-colors group">
       {t('footer.contact')}
       <FiArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
      {/* Social Icons */}
      <div className="flex items-center gap-3">
        <a href="https://www.linkedin.com/in/abdullah-al-ghoul-a254763a6/" target="_blank" rel="noopener noreferrer"
         className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-black/5 dark:bg-white/5 hover:bg-royal-500/20 border border-black/8 dark:border-white/10 hover:border-royal-500/30 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-royal-500 dark:hover:text-royal-400 transition-colors duration-300"
         aria-label={isArabic ? 'لينكد إن - LinkedIn' : 'LinkedIn'}>
        <FiLinkedin size={18} />
       </a>
       <a href="mailto:abdallhalghoul200@gmail.com"
         className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-black/5 dark:bg-white/5 hover:bg-royal-500/20 border border-black/8 dark:border-white/10 hover:border-royal-500/30 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-300"
         aria-label={isArabic ? 'البريد الإلكتروني - Email' : 'Email'}>
        <FiMail size={18} />
       </a>
       <a href="https://wa.me/970592127061" target="_blank" rel="noopener noreferrer"
         className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-black/5 dark:bg-white/5 hover:bg-emerald-500/20 border border-black/8 dark:border-white/10 hover:border-emerald-500/30 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors duration-300"
         aria-label={isArabic ? 'واتساب - WhatsApp' : 'WhatsApp'}>
        <FaWhatsapp size={18} />
       </a>
       <a href="tel:+970592127061"
         className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-black/5 dark:bg-white/5 hover:bg-amber-500/20 border border-black/8 dark:border-white/10 hover:border-amber-500/30 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors duration-300"
         aria-label={isArabic ? 'الهاتف - Phone' : 'Phone'}>
        <FiPhone size={18} />
       </a>
      </div>
     </motion.div>

     <motion.div variants={pageItem}>
      <h3 className="font-semibold text-sm text-accent uppercase tracking-wider mb-4">
       {t('footer.quickLinks')}
      </h3>
       <ul className="space-y-1">
        {links.map(link => (
         <li key={link.to}>
          <Link to={link.to} className="inline-flex items-center gap-1 py-1.5 text-slate-500 dark:text-slate-400 hover:text-ink text-sm transition-colors group">
           <FiArrowUpRight className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" size={14} />
           {link.label}
          </Link>
         </li>
        ))}
       </ul>
     </motion.div>

     <motion.div variants={pageItem}>
      <h3 className="font-semibold text-sm text-accent uppercase tracking-wider mb-4">
       {t('footer.resources')}
      </h3>
       <ul className="space-y-1">
        {resourceLinks.map(link => (
         <li key={link.to}>
          <Link to={link.to} className="inline-flex items-center gap-1 py-1.5 text-slate-500 dark:text-slate-400 hover:text-ink text-sm transition-colors group">
           <FiArrowUpRight className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" size={14} />
           {link.label}
          </Link>
         </li>
        ))}
       </ul>
     </motion.div>

     <motion.div variants={pageItem}>
      <h3 className="font-semibold text-sm text-accent uppercase tracking-wider mb-4">
       {t('footer.contact')}
      </h3>
      <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400 ">
       <li className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-royal-500/20 flex-shrink-0">
         <FiMapPin size={14} />
        </div>
        {t('contact.info.address')}
       </li>
       <li className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-royal-500/20 flex-shrink-0">
         <FiPhone size={14} />
        </div>
        <span dir="ltr">{t('contact.info.phone')}</span>
       </li>
       <li className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-royal-500/20 flex-shrink-0">
         <FiMail size={14} />
        </div>
        {t('contact.info.email')}
       </li>
       <li>
        <a href="https://www.linkedin.com/in/abdullah-al-ghoul-a254763a6/" target="_blank" rel="noopener noreferrer"
          className="hover:text-royal-500 dark:hover:text-cyan-400 transition-colors flex items-center gap-3 group">
         <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-royal-500/20 flex-shrink-0 group-hover:scale-110 transition-transform">
          <FiLinkedin size={14} />
         </div>
         {t('footer.linkedin')}
        </a>
       </li>
      </ul>
     </motion.div>
    </div>

    {/* Bottom gradient line + copyright */}
    <div className="relative mt-12 pt-8 text-center text-slate-500 dark:text-slate-400 text-sm">
     <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-royal-500/20 to-transparent" />
     <p>{t('footer.rights')}</p>
    </div>
   </motion.div>
  </footer>
 )
})
