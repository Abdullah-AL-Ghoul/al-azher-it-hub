import { memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { 
  FiHome, 
  FiTv, 
  FiBookOpen, 
  FiLayers, 
  FiUser 
} from 'react-icons/fi'

export default memo(function MobileBottomNav() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname

  const navItems = [
    {
      to: '/home',
      label: t('nav.home') || 'الرئيسية',
      icon: FiHome,
      isActive: currentPath === '/home',
    },
    {
      to: '/lectures',
      label: t('nav.lectures') || 'المحاضرات',
      icon: FiTv,
      isActive: currentPath === '/lectures' || currentPath.startsWith('/lecture/'),
    },
    {
      to: '/sources',
      label: t('nav.sources') || 'المصادر',
      icon: FiBookOpen,
      isActive: currentPath === '/sources',
    },
    {
      to: '/study-plan',
      label: t('nav.studyPlan') || 'الخطة',
      icon: FiLayers,
      isActive: currentPath === '/study-plan' || currentPath === '/schedule' || currentPath === '/roadmap',
    },
    {
      to: user ? '/profile' : '/login',
      label: user ? (t('nav.profile') || 'ملفي') : (t('nav.login') || 'دخول'),
      icon: FiUser,
      isActive: currentPath === '/profile',
    },
  ]

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)] transition-all duration-300"
    >
      <div className="grid grid-cols-5 h-16 items-center max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const IconComp = item.icon
          const active = item.isActive

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center h-full min-h-[48px] py-1 transition-colors select-none ${
                active
                  ? 'text-royal-600 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-white/50 hover:text-ink'
              }`}
            >
              {/* Active Background Glow Pill */}
              {active && (
                <motion.div
                  layoutId="mobile-nav-active-pill"
                  className="absolute inset-x-2 inset-y-1.5 rounded-2xl bg-royal-500/10 dark:bg-cyan-500/15 -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon with subtle spring scale */}
              <motion.div
                animate={{ scale: active ? 1.15 : 1, y: active ? -1 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative"
              >
                <IconComp size={20} />
                {active && (
                  <span className="absolute -bottom-1 inset-x-1 h-0.5 rounded-full bg-royal-600 dark:bg-cyan-400" />
                )}
              </motion.div>

              {/* Label */}
              <span className={`text-[10px] mt-1 leading-none tracking-tight truncate max-w-[58px] ${
                active ? 'font-black' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
})
