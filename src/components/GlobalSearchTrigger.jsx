import { useLanguage } from '../context/LanguageContext'
import { FiSearch } from 'react-icons/fi'

// Lightweight stand-in for GlobalSearch (lazy-loaded on first intent).
// Same navbar slot and styling; Ctrl+K is handled globally by App until
// GlobalSearch mounts and registers its own handler.
export default function GlobalSearchTrigger({ onActivate }) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={onActivate}
      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-white/60 hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 transition"
      aria-label={t('nav.search')}
    >
      <FiSearch size={18} />
    </button>
  )
}
