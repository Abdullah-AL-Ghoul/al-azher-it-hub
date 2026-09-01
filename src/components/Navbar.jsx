import { useState, useRef, useEffect, useMemo, memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useScrollManager, useScrollFrame } from '../hooks/useScrollManager.jsx'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useNotifications } from '../hooks/useNotifications'
import { HiMenu, HiX } from 'react-icons/hi'
import { FiSun, FiMoon, FiMonitor, FiUser, FiLogOut, FiShield, FiBell, FiX, FiBookOpen, FiFolder, FiFileText, FiLayers, FiSettings } from 'react-icons/fi'
import SiteLogo from './shared/SiteLogo'
import ConfirmDialog from './shared/ConfirmDialog'

const iconMap = { FiBookOpen, FiFolder, FiFileText, FiLayers, FiUser, FiSettings }

const prefetchCache = new Map()
function prefetchData(path) {
  if (prefetchCache.has(path)) return
  prefetchCache.set(path, true)
  import('../services').then(s => {
    if (path === '/lectures' || path === '/home') s.getLectures().catch(() => {})
    if (path === '/sources' || path === '/home') s.getSources().catch(() => {})
    if (path === '/additions') s.getAdditions().catch(() => {})
    if (path === '/roadmap') { s.getCourses().catch(() => {}); s.getRoadmap().catch(() => {}) }
    if (path === '/study-plan') s.getStudyPlan().catch(() => {})
  }).catch(() => {})
}

export default memo(function Navbar() {
  const { lang, toggleLang, t } = useLanguage()
  const { user, logout, isAdmin } = useAuth()
  const prefersReduced = useReducedMotion()
  const { theme, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const { scrolled } = useScrollManager()
  // Progress bar is written straight to the DOM per scroll frame — React
  // state here would re-render the whole navbar ~every 100px.
  useScrollFrame(({ progress }) => {
    if (progressRef.current) {
      progressRef.current.style.width = `${progress}%`
    }
  })
  const progressRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifTrapRef = useFocusTrap(showNotifications)
  const mobileTrapRef = useFocusTrap(isOpen)
  const isArabic = lang === 'ar'
  const { notifications, unreadCount, markAsRead } = useNotifications(user)

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${progress}%`
    }
  }, [progress])

  useEffect(() => {
    if (!isOpen && !showNotifications) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setShowNotifications(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', handleEsc) }
  }, [isOpen, showNotifications])

  const links = useMemo(() => [
    { to: '/home', label: t('nav.home') },
    { to: '/lectures', label: t('nav.lectures') },
    { to: '/sources', label: t('nav.sources') },
    { to: '/study-plan', label: t('nav.studyPlan') },
    { to: '/roadmap', label: t('nav.roadmap') },
    { to: '/additions', label: t('nav.additions') },
    { to: '/contact', label: t('nav.contact') },
  ], [t])

  const isActive = (path) => location.pathname === path
  const navBg = scrolled ? 'navbar-spatial scrolled' : 'navbar-spatial'
  const iconBtn = 'p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors text-slate-600 dark:text-white/60 hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-400/50 focus-visible:ring-offset-2'

  return (
    <>
      <div ref={progressRef} className="scroll-progress" style={{ width: '0%' }} />

      <nav aria-label={isArabic ? 'التنقل الرئيسي' : 'Primary navigation'} className={`fixed top-0 inset-x-0 z-50 transition duration-300 ${navBg}`}>
        <div className="container-page">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/home" className="flex items-center gap-2 group">
              <SiteLogo size="sm" />
              <span className="font-bold text-lg text-ink">{t('site.title')}</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onMouseEnter={() => prefetchData(link.to)}
                  aria-current={isActive(link.to) ? 'page' : undefined}
                  className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    isActive(link.to)
                      ? 'text-accent'
                      : 'text-slate-600 dark:text-white/60 hover:text-ink'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute bottom-0 inset-x-1/4 h-0.5 bg-accent rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  to="/admin"
                  aria-current={isActive('/admin') ? 'page' : undefined}
                  className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'text-accent'
                      : 'text-slate-600 dark:text-white/60 hover:text-ink'
                  }`}
                >
                  <FiShield size={14} />
                  {t('nav.admin')}
                  {isActive('/admin') && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute bottom-0 inset-x-1/4 h-0.5 bg-accent rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )}

              <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />

              <button
                onClick={toggleTheme}
                className={iconBtn}
                title={theme === 'light' ? t('theme.dark') : theme === 'dark' ? t('theme.amoled') : t('theme.light')}
                aria-label={theme === 'light' ? t('theme.dark') : theme === 'dark' ? t('theme.amoled') : t('theme.light')}
              >
                {theme === 'light' ? <FiMoon size={16} /> : theme === 'dark' ? <FiMonitor size={16} /> : <FiSun size={16} />}
              </button>

              {user && (
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) markAsRead() }}
                    className={`relative ${iconBtn}`}
                    title={isArabic ? 'الإشعارات' : 'Notifications'}
                    aria-label={isArabic ? 'الإشعارات' : 'Notifications'}
                    aria-expanded={showNotifications}
                  >
                    <FiBell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -end-0.5 w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        ref={notifTrapRef}
                        initial={prefersReduced ? {} : { opacity: 0, y: 8, scale: 0.96 }}
                        animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute mt-2 ${isArabic ? 'start-0' : 'end-0'} w-80 max-w-[calc(100vw-1rem)] modal-spatial rounded-2xl overflow-hidden z-[60]`}
                        role="dialog"
                        aria-label={isArabic ? 'الإشعارات' : 'Notifications'}
                      >
                        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                          <h3 className="text-sm font-bold text-ink">{isArabic ? 'الإشعارات' : 'Notifications'}</h3>
                          <button onClick={() => setShowNotifications(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label={t('common.close')}>
                            <FiX size={14} className="text-slate-400" />
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto overscroll-contain">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                              <FiBell size={24} className="mx-auto mb-2 text-slate-300 dark:text-white/20" />
                              <p className="text-xs text-slate-400 dark:text-white/40">{isArabic ? 'لا يوجد إشعارات بعد' : 'No notifications yet'}</p>
                            </div>
                          ) : (
                            notifications.map((item, i) => {
                              const IconComp = iconMap[item.meta?.icon] || FiBell
                              return (
                                <div key={item.id || i} className="px-4 py-3 border-b border-line last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${item.meta?.color || 'bg-cyan-400'} flex items-center justify-center shrink-0 mt-0.5`}>
                                      <IconComp size={14} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-ink">
                                        <span className="text-accent">{item.meta?.verbAr || item.meta?.verbEn || item.action}</span>
                                        {' '}
                                        <span className="font-semibold">{item.detail || item.type}</span>
                                      </p>
                                      <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={toggleLang}
                className={`px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-medium transition duration-200 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10`}
                aria-label={`${t('nav.language')} — ${isArabic ? 'Switch to English' : 'التبديل إلى العربية'}`}
              >
                {t('nav.language')}
              </button>

              <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />

              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/profile" className="text-sm font-medium text-ink hover:text-accent transition-colors">
                    {user.name}
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`p-1.5 min-w-[44px] min-h-[44px] rounded-lg transition duration-200 ${iconBtn}`}
                    title={t('nav.logout')}
                    aria-label={t('nav.logout')}
                    aria-haspopup="dialog"
                  >
                    <FiLogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-spatial relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white">
                  <FiUser size={13} />
                  {t('nav.login')}
                </Link>
              )}
            </div>

            {/* Mobile right section */}
            <div className="flex items-center gap-2 lg:hidden">
              {user && <span className="text-sm font-medium text-ink">{user.name}</span>}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${iconBtn}`}
                aria-label={isOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                aria-expanded={isOpen}
              >
                {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={mobileTrapRef}
              role="dialog"
              aria-modal="true"
              aria-label={isArabic ? 'قائمة التنقل' : 'Navigation menu'}
              initial={prefersReduced ? {} : { opacity: 0, height: 0, y: -10 }}
              animate={prefersReduced ? {} : { opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={prefersReduced ? {} : { duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden modal-spatial border-t border-line overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain"
            >
              <div className="px-4 py-3 space-y-1">
                {links.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive(link.to) ? 'page' : undefined}
                    className={`relative block px-4 py-3 min-h-[44px] flex items-center rounded-xl text-sm transition-colors ${
                      isActive(link.to)
                        ? 'bg-royal-50 dark:bg-white/10 text-accent font-medium'
                        : 'text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink'
                    }`}
                  >
                    {isActive(link.to) && (
                      <motion.div
                        layoutId="nav-active-indicator-mobile"
                        className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-e-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    {link.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}
                    aria-current={isActive('/admin') ? 'page' : undefined}
                    className={`relative block px-4 py-3 min-h-[44px] rounded-xl text-sm flex items-center gap-2 ${
                      isActive('/admin')
                        ? 'bg-royal-50 dark:bg-white/10 text-accent font-medium'
                        : 'text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink'
                    }`}
                  >
                    {isActive('/admin') && (
                      <motion.div
                        layoutId="nav-active-indicator-mobile"
                        className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-e-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <FiShield size={16} /> {t('nav.admin')}
                  </Link>
                )}
                {user && !isAdmin && (
                  <Link to="/profile" onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 min-h-[44px] rounded-xl text-sm text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink flex items-center gap-2"
                  >
                    <FiUser size={16} /> {t('nav.profile')}
                  </Link>
                )}
                <button onClick={toggleTheme} className="w-full text-start px-4 py-3 min-h-[44px] rounded-xl text-sm text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink flex items-center gap-2">
                  {theme === 'light' ? <FiMoon size={16} /> : theme === 'dark' ? <FiMonitor size={16} /> : <FiSun size={16} />}
                  {theme === 'light' ? (lang === 'ar' ? 'وضع مظلم' : 'Dark mode') : theme === 'dark' ? (lang === 'ar' ? 'وضع AMOLED' : 'AMOLED mode') : (lang === 'ar' ? 'وضع فاتح' : 'Light mode')}
                </button>
                <button onClick={() => { toggleLang(); setIsOpen(false) }} className="w-full text-start px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink border border-slate-200 dark:border-white/10">
                  {t('nav.language')}
                </button>
                {!user && (
                  <Link to="/" onClick={() => setIsOpen(false)} className="w-full text-start px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold btn-spatial flex items-center gap-2">
                    <FiUser size={16} /> {t('nav.login')}
                  </Link>
                )}
                {user && (
                  <button onClick={() => { setIsOpen(false); setShowLogoutConfirm(true) }} className="w-full text-start px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2">
                    <FiLogOut size={16} /> {t('nav.logout')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title={t('nav.logout')}
        message={t('nav.logoutConfirm')}
        confirmText={t('nav.logout')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </>
  )
})