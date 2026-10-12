import { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiBell, FiAward, FiInfo, FiX, FiExternalLink, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'
import { getBroadcast, fetchBroadcastRemote, isBroadcastDismissed, dismissBroadcast, BROADCAST_EVENT, BROADCAST_TYPES } from '../../services/broadcast'

const TYPE_ICONS = {
  urgent: FiAlertTriangle,
  academic: FiBell,
  celebration: FiAward,
  info: FiInfo,
}

function BroadcastBanner() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'
  const prefersReduced = useReducedMotion()
  const [broadcast, setBroadcast] = useState(() => getBroadcast())
  const [dismissed, setDismissed] = useState(false)

  const syncBroadcast = useCallback(() => {
    const current = getBroadcast()
    setBroadcast(current)
    if (current && current.id) {
      setDismissed(isBroadcastDismissed(current.id))
    } else {
      setDismissed(false)
    }
  }, [])

  useEffect(() => {
    syncBroadcast()
    // Fetch latest remote announcement from Supabase
    fetchBroadcastRemote().then((remote) => {
      if (remote) {
        setBroadcast(remote)
        setDismissed(isBroadcastDismissed(remote.id))
      }
    }).catch(() => {})

    const handleEvent = (e) => {
      if (e.detail) {
        setBroadcast(e.detail)
        setDismissed(isBroadcastDismissed(e.detail.id))
      } else {
        setBroadcast(null)
      }
    }

    const handleStorage = (e) => {
      if (e.key === 'al_azher_broadcast_announcement') {
        syncBroadcast()
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBroadcastRemote().catch(() => {})
      }
    }

    window.addEventListener(BROADCAST_EVENT, handleEvent)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener(BROADCAST_EVENT, handleEvent)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [syncBroadcast])

  if (!broadcast || !broadcast.active) return null
  if (dismissed && !broadcast.pinned) return null

  const typeConfig = BROADCAST_TYPES[broadcast.type] || BROADCAST_TYPES.academic
  const IconComponent = TYPE_ICONS[broadcast.type] || FiBell

  const title = isArabic ? (broadcast.titleAr || broadcast.titleEn) : (broadcast.titleEn || broadcast.titleAr)
  const message = isArabic ? (broadcast.messageAr || broadcast.messageEn) : (broadcast.messageEn || broadcast.messageAr)
  const linkText = isArabic
    ? (broadcast.linkTextAr || broadcast.linkTextEn || 'عرض التفاصيل')
    : (broadcast.linkTextEn || broadcast.linkTextAr || 'View Details')

  const handleDismiss = () => {
    if (broadcast.id) {
      dismissBroadcast(broadcast.id)
      setDismissed(true)
    }
  }

  const isExternalLink = broadcast.link && (broadcast.link.startsWith('http://') || broadcast.link.startsWith('https://'))
  const ArrowIcon = isArabic ? FiArrowLeft : FiArrowRight

  return (
    <AnimatePresence>
      <motion.aside
        role="region"
        aria-label={isArabic ? 'إعلان هام من إدارة المنصة' : 'Important announcement'}
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0, y: -10 }}
        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-40 border-b overflow-hidden shadow-sm ${typeConfig.bgLight} ${typeConfig.bgDark}`}
      >
        <div className="container-page py-2.5 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Left/Start side: Icon + Badge + Text */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`flex-shrink-0 p-1.5 rounded-lg shadow-xs ${typeConfig.accent}`}>
                <IconComponent size={16} aria-hidden="true" />
              </span>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${typeConfig.accent}`}>
                  {isArabic ? typeConfig.badgeAr : typeConfig.badgeEn}
                </span>

                {title && (
                  <span className="font-bold text-xs sm:text-sm truncate">
                    {title}
                  </span>
                )}

                {message && (
                  <span className="text-xs sm:text-sm opacity-90 line-clamp-1 sm:line-clamp-none">
                    {title ? `— ${message}` : message}
                  </span>
                )}
              </div>
            </div>

            {/* Right/End side: Action Link + Dismiss Button */}
            <div className="flex items-center gap-2 flex-shrink-0 ms-auto">
              {broadcast.link && (
                isExternalLink ? (
                  <a
                    href={broadcast.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 transition shadow-xs"
                  >
                    <span>{linkText}</span>
                    <FiExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : (
                  <Link
                    to={broadcast.link}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 transition shadow-xs"
                  >
                    <span>{linkText}</span>
                    <ArrowIcon size={12} aria-hidden="true" />
                  </Link>
                )
              )}

              {broadcast.dismissible && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition"
                  aria-label={isArabic ? 'إغلاق الإعلان' : 'Dismiss announcement'}
                  title={isArabic ? 'إغلاق' : 'Dismiss'}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

export default memo(BroadcastBanner)
