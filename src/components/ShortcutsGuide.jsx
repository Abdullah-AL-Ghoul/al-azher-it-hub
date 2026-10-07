import Modal from './ui/Modal'
import { useLanguage } from '../context/LanguageContext'

const Kbd = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-1 rounded-md border border-black/10 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-semibold text-ink shadow-sm">
    {children}
  </kbd>
)

function Row({ keys, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-black/5 dark:border-white/5 last:border-0">
      <span className="flex items-center gap-1 flex-wrap">{keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)}</span>
      <span className="text-xs text-slate-500 dark:text-white/60 text-end">{desc}</span>
    </div>
  )
}

/** Shortcuts guide modal (opened with `?`). Rows are bilingual via i18n. */
export default function ShortcutsGuide({ isOpen, onClose }) {
  const { t } = useLanguage()
  const s = (k) => t(`inline.shortcuts.${k}`)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={s('title')} size="md">
      <div className="px-6 py-4">
        <p className="text-xs text-slate-500 dark:text-white/50 mb-4">{s('subtitle')}</p>

        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-1">{s('nav')}</h3>
        <Row keys={['g', 'h']} desc={s('nav-home')} />
        <Row keys={['g', 'l']} desc={s('nav-lectures')} />
        <Row keys={['g', 's']} desc={s('nav-sources')} />
        <Row keys={['g', 'a']} desc={s('nav-additions')} />
        <Row keys={['g', 'r']} desc={s('nav-roadmap')} />
        <Row keys={['g', 'p']} desc={s('nav-profile')} />

        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mt-5 mb-1">{s('general')}</h3>
        <Row keys={['/']} desc={s('search')} />
        <Row keys={['Ctrl', 'K']} desc={s('search')} />
        <Row keys={['?']} desc={s('guide')} />

        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mt-5 mb-1">{s('video')}</h3>
        <Row keys={['←', '→']} desc={s('video-seek')} />
        <Row keys={['Space']} desc={s('video-play')} />
        <Row keys={['M']} desc={s('video-mute')} />
        <Row keys={['F']} desc={s('video-fs')} />

        <p className="text-[11px] text-slate-400 dark:text-white/30 mt-4">{s('hint-while-typing')}</p>
      </div>
    </Modal>
  )
}
