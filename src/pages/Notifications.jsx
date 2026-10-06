import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { pageContainer, pageItem } from '../utils/motionTokens'
import { FiBell, FiBookOpen, FiFolder, FiFileText, FiLayers, FiUser, FiSettings, FiCheck, FiArrowRight } from 'react-icons/fi'
import PageHero from '../components/shared/PageHero'

const iconMap = { FiBookOpen, FiFolder, FiFileText, FiLayers, FiUser, FiSettings }

export default function Notifications() {
  const { lang, t } = useLanguage()
  const { user } = useAuth()
  const isArabic = lang === 'ar'
  const { notifications, unreadCount, markAsRead } = useNotifications(user)
  const [filter, setFilter] = useState('all')

  // The read model is a watermark: an item is unread while its timestamp is
  // newer than the student's persisted last-seen marker (localStorage, per
  // student) — the same model the navbar badge uses, so both stay in sync.
  const lastSeenMs = useMemo(() => {
    try {
      return parseInt(localStorage.getItem(`al_azher_last_visit_${user?.studentId || 'anon'}`) || '0', 10)
    } catch (_e) { return 0 }
  }, [user, notifications])

  const visible = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => new Date(n.timestamp).getTime() > lastSeenMs)
    }
    return notifications
  }, [notifications, filter, lastSeenMs])

  const fmtTime = (ts) => {
    if (!ts) return ''
    return new Date(ts).toLocaleString(t('inline.home.en-us'), {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const filterTabs = [
    { key: 'all', label: t('inline.notifications-center.all'), count: notifications.length },
    { key: 'unread', label: t('inline.notifications-center.unread'), count: unreadCount },
  ]

  return (
    <motion.div variants={pageContainer} initial="hidden" animate="visible" className="min-h-screen pt-24 pb-16 bg-spatial-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHero
          title={t('inline.notifications-center.title')}
          subtitle={t('inline.notifications-center.subtitle')}
        />

        {/* Filter tabs + mark all read */}
        <motion.div variants={pageItem} className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 p-1 glass rounded-xl" role="tablist" aria-label={t('inline.notifications-center.title')}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={filter === tab.key}
                onClick={() => setFilter(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-accent'
                    : 'text-slate-500 dark:text-white/50 hover:text-ink'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                    tab.key === 'unread' ? 'bg-rose-500 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/60'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAsRead}
              className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl btn-secondary text-sm font-medium"
            >
              <FiCheck size={14} /> {t('inline.notifications-center.mark-all-read')}
            </button>
          )}
        </motion.div>

        {/* Feed */}
        <motion.div variants={pageItem} className="glass rounded-2xl border border-white/10 overflow-hidden">
          {visible.length === 0 ? (
            <div className="py-16 text-center">
              <FiBell size={40} className="mx-auto mb-4 text-slate-300 dark:text-white/20" />
              <p className="text-sm text-slate-500 dark:text-white/50 font-medium">
                {filter === 'unread'
                  ? t('inline.notifications-center.empty-unread')
                  : t('inline.notifications-center.empty')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {visible.map((item, i) => {
                const IconComp = iconMap[item.meta?.icon] || FiBell
                const unread = new Date(item.timestamp).getTime() > lastSeenMs
                return (
                  <div
                    key={item.id || i}
                    className={`flex items-start gap-3 p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                      unread ? 'bg-royal-500/[0.04] dark:bg-cyan-500/[0.05]' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg ${item.meta?.color || 'bg-cyan-400'} flex items-center justify-center shrink-0 mt-0.5`}>
                      <IconComp size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink">
                        <span className="text-accent font-medium">{item.meta?.verbAr || item.meta?.verbEn || item.action}</span>
                        {' '}
                        <span className="font-semibold">{item.detail || item.type}</span>
                        {unread && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 ms-2 align-middle" aria-label={t('inline.notifications-center.unread')} />}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1 tabular-nums">{fmtTime(item.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={pageItem} className="mt-8 text-center">
          <Link to="/home" className="inline-flex items-center gap-2 px-6 py-3 btn-secondary rounded-xl text-sm font-semibold">
            <FiArrowRight className={isArabic ? '' : 'rotate-180'} size={14} />
            {t('inline.notifications-center.back-home')}
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
