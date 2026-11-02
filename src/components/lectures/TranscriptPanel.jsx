import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch,
  FiX,
  FiPlay,
  FiDownload,
  FiClock,
  FiCopy,
  FiCheck,
  FiFileText,
  FiExternalLink,
  FiLayers,
} from 'react-icons/fi'
import { formatVttTime, searchCues } from '../../utils/vttParser'
import { exportSubtitleFile } from '../../services/subtitles'
import { useLanguage } from '../../context/LanguageContext'
import { toast } from 'react-hot-toast'

/**
 * Interactive Full Transcript & Subtitles Panel.
 *
 * Provides synchronized auto-scrolling transcript with active cue highlighting,
 * instant search, click-to-seek, copy segment, and download as WebVTT / SRT / TXT.
 */
export default function TranscriptPanel({
  subtitles = [],
  currentTime = 0,
  onSeek,
  className = '',
}) {
  const { t, lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [selectedTrackLang, setSelectedTrackLang] = useState(() => {
    return subtitles[0]?.language || 'ar'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const [copiedCueId, setCopiedCueId] = useState(null)

  const containerRef = useRef(null)
  const activeItemRef = useRef(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef(null)

  // Sync selected track when available subtitles change
  useEffect(() => {
    if (subtitles.length > 0 && !subtitles.some(s => s.language === selectedTrackLang)) {
      setSelectedTrackLang(subtitles[0].language)
    }
  }, [subtitles, selectedTrackLang])

  const activeTrack = useMemo(() => {
    return subtitles.find(s => s.language === selectedTrackLang) || subtitles[0] || null
  }, [subtitles, selectedTrackLang])

  const cues = activeTrack?.cues || []

  // Current active cue index
  const activeCueIndex = useMemo(() => {
    if (!cues.length || currentTime < 0) return -1
    return cues.findIndex(c => currentTime >= c.start && currentTime <= c.end)
  }, [cues, currentTime])

  // Filtered cues based on search
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cues.map((cue, idx) => ({ cue, originalIdx: idx }))
    const results = searchCues(cues, searchQuery)
    return results.map(r => ({ cue: r.cue, originalIdx: r.index }))
  }, [cues, searchQuery])

  // Smart Auto-scroll: follow active cue unless user manually scrolled recently
  useEffect(() => {
    if (!autoScrollEnabled || isUserScrollingRef.current || activeCueIndex < 0) return
    const el = activeItemRef.current
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeCueIndex, autoScrollEnabled])

  // Detect user manual scroll in transcript box
  const handleScroll = useCallback(() => {
    isUserScrollingRef.current = true
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current)
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 4000)
  }, [])

  const handleCopy = async (cue) => {
    try {
      await navigator.clipboard.writeText(`[${formatVttTime(cue.start)}] ${cue.text}`)
      setCopiedCueId(cue.id)
      toast.success(isArabic ? 'تم نسخ المقطع بالتوقيت' : 'Segment copied with timestamp')
      setTimeout(() => setCopiedCueId(null), 2000)
    } catch (_e) {
      toast.error(isArabic ? 'فشل النسخ' : 'Failed to copy')
    }
  }

  return (
    <div className={`flex flex-col bg-slate-900/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl ${className}`}>
      {/* Header with Search and Language Picker */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiFileText className="text-cyan-400" size={18} />
            <h3 className="font-semibold text-white text-sm">
              {isArabic ? 'التفريغ النصي والترجمة' : 'Transcript & Subtitles'}
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {cues.length} {isArabic ? 'مقطع' : 'cues'}
            </span>
          </div>

          {/* Export button */}
          {activeTrack && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => exportSubtitleFile(activeTrack, 'vtt')}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1 border border-white/10"
                title={isArabic ? 'تحميل كملف WebVTT' : 'Download WebVTT'}
              >
                <FiDownload size={13} />
                <span className="hidden sm:inline">VTT</span>
              </button>
              <button
                type="button"
                onClick={() => exportSubtitleFile(activeTrack, 'txt')}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1 border border-white/10"
                title={isArabic ? 'تحميل كنص خام' : 'Download text'}
              >
                <FiDownload size={13} />
                <span className="hidden sm:inline">TXT</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Tabs & Search Input */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tracks Switcher */}
          {subtitles.length > 0 && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {subtitles.map(track => {
                const isSelected = selectedTrackLang === track.language
                return (
                  <button
                    key={track.id || track.language}
                    type="button"
                    onClick={() => setSelectedTrackLang(track.language)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500 to-royal-600 text-white shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {isArabic ? (track.labelAr || track.language) : (track.labelEn || track.language)}
                  </button>
                )
              })}
            </div>
          )}

          {/* Search bar */}
          <div className="relative flex-1 min-w-[160px]">
            <FiSearch size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'بحث في النص والمصطلحات...' : 'Search transcript...'}
              className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-8 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-scroll toggle status */}
      <div className="px-4 py-1.5 bg-black/20 border-b border-white/5 flex items-center justify-between text-[11px] text-white/50">
        <span>
          {searchQuery
            ? `${filteredCues.length} ${isArabic ? 'نتيجة مطابقة' : 'matches'}`
            : (isArabic ? 'اضغط على أي مقطع للانتقال لوقته في المحاضرة' : 'Click any cue to seek')}
        </span>
        <button
          type="button"
          onClick={() => setAutoScrollEnabled(v => !v)}
          className={`hover:underline ${autoScrollEnabled ? 'text-cyan-400' : 'text-white/40'}`}
        >
          {autoScrollEnabled
            ? (isArabic ? 'التمرير التلقائي: مفعّل' : 'Auto-scroll: ON')
            : (isArabic ? 'التمرير التلقائي: متوقف' : 'Auto-scroll: OFF')}
        </button>
      </div>

      {/* Cues List */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto max-h-[460px] p-3 space-y-2 divide-y divide-white/5"
      >
        {filteredCues.length === 0 ? (
          <div className="text-center py-12 text-white/50 text-xs">
            {searchQuery
              ? (isArabic ? 'لم يتم العثور على نتائج تطابق بحثك.' : 'No matching cues found.')
              : (isArabic ? 'لا توجد مقاطع ترجمة لهذه المحاضرة حتى الآن.' : 'No transcript cues available.')}
          </div>
        ) : (
          filteredCues.map(({ cue, originalIdx }) => {
            const isActive = originalIdx === activeCueIndex
            return (
              <div
                key={cue.id || originalIdx}
                ref={isActive ? activeItemRef : null}
                className={`pt-2 transition-all rounded-xl p-2.5 cursor-pointer group ${
                  isActive
                    ? 'bg-cyan-500/15 border border-cyan-400/40 shadow-lg text-white'
                    : 'hover:bg-white/5 text-white/80'
                }`}
                onClick={() => onSeek?.(cue.start)}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400/80 mb-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <FiClock size={11} />
                    {formatVttTime(cue.start).slice(3, 8)}
                    {isActive && (
                      <span className="ms-1.5 px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-bold text-[9px] uppercase tracking-wider animate-pulse">
                        {isArabic ? 'يعمل الآن' : 'Playing'}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopy(cue) }}
                      className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
                      title={isArabic ? 'نسخ المقطع' : 'Copy cue'}
                    >
                      {copiedCueId === cue.id ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
                    </button>
                  </div>
                </div>

                <p
                  className={`text-xs leading-relaxed ${isActive ? 'font-medium text-cyan-50' : 'text-white/85'}`}
                  dir={selectedTrackLang === 'ar' ? 'rtl' : 'ltr'}
                >
                  {cue.text}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
