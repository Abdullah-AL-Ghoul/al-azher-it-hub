import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { FiPlay, FiExternalLink, FiVideoOff, FiLoader, FiMaximize, FiMinimize, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi'
import { lectureThumb } from '../../utils/helpers'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

const YT_EMBED_ORIGIN = 'https://www.youtube-nocookie.com'
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
// Positions below this are noise — never resume from them.
const MIN_RESUME_SEC = 30
// ≥90% of duration counts as "watched".
const WATCHED_RATIO = 0.9

function buildEmbedSrc(videoId, { autoplay = false, start = 0 } = {}) {
  const params = new URLSearchParams({
    rel: 0,
    playsinline: 1,
    modestbranding: 1,
    color: 'white',
    enablejsapi: 1,
    autoplay: autoplay ? 1 : 0,
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  })
  if (start > 0) params.set('start', String(Math.floor(start)))
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

function fmt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/**
 * Professional inline player on top of the privacy-enhanced YouTube embed:
 * - enablejsapi + hand-rolled postMessage (no external widget script, so CSP
 *   keeps script-src 'self').
 * - Watch position persisted per student+lecture; auto-resumes via start=
 *   with a "start over" chip and a thin local progress bar.
 * - Marks the lecture watched at >=90% (feeds the existing markViewed).
 * - Keyboard on container focus: arrows seek ±5s (Shift = ±10s), Space
 *   play/pause, M mute, F container fullscreen; speed menu 0.5x–2x.
 */
export default function VideoPlayer({
  videoId,
  url,
  title,
  onWatch,
  autoPlay = false,
  lectureId = '',
  studentId: studentIdProp = '',
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  // Position key is per student+lecture; guests share a separate key space.
  const studentId = studentIdProp || user?.studentId || 'guest'
  const [inline, setInline] = useState(autoPlay)
  const [loading, setLoading] = useState(false)
  const [embedFailed, setEmbedFailed] = useState(false)
  const watchedRef = useRef(false)
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const barRef = useRef(null)

  // Telemetry streamed back from the embed
  const [isPlaying, setIsPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [pct, setPct] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const timeRef = useRef(0)
  const playerStateRef = useRef(-1)

  // Resume state: seconds baked into the iframe src + the chip above it
  const [resumeSec, setResumeSec] = useState(0)
  const [resumeChip, setResumeChip] = useState(0)
  const storageKey = useMemo(
    () => `yt_pos_${studentId || 'guest'}_${lectureId || 'x'}`,
    [studentId, lectureId]
  )

  // Fire onWatch the first time inline playback starts (a real user gesture).
  const beginInline = useCallback(() => {
    if (!videoId) return
    try {
      const saved = parseFloat(localStorage.getItem(storageKey) || '0')
      if (saved >= MIN_RESUME_SEC) {
        setResumeSec(Math.max(0, Math.floor(saved) - 5))
        setResumeChip(Math.floor(saved))
      }
    } catch (e) { /* silent */ }
    setInline(true)
    setLoading(true)
    if (!watchedRef.current) {
      watchedRef.current = true
      onWatch?.()
    }
  }, [videoId, onWatch, storageKey])

  useEffect(() => {
    if (autoPlay && videoId && !watchedRef.current) {
      watchedRef.current = true
      // Defer so onWatch runs after mount (modal context).
      const tm = setTimeout(() => onWatch?.(), 400)
      return () => clearTimeout(tm)
    }
  }, [autoPlay, videoId, onWatch])

  // ── position persistence ────────────────────────────────────────────────
  // timeRef is written by the postMessage stream, never by React state, so
  // the 3s persist tick and the pagehide save cost no re-renders.
  useEffect(() => {
    if (!inline || !videoId) return undefined
    const saveNow = () => {
      try {
        if (timeRef.current >= MIN_RESUME_SEC) {
          localStorage.setItem(storageKey, String(Math.floor(timeRef.current)))
        }
      } catch (e) { /* silent */ }
    }
    const interval = setInterval(() => {
      if (playerStateRef.current === 1) saveNow()
    }, 3000)
    window.addEventListener('pagehide', saveNow)
    return () => {
      clearInterval(interval)
      window.removeEventListener('pagehide', saveNow)
      if (playerStateRef.current === 1) saveNow()
    }
  }, [inline, videoId, storageKey])

  // ── YT postMessage channel ──────────────────────────────────────────────
  const post = useCallback((func, args = []) => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage(JSON.stringify({ event: 'command', func, args }), YT_EMBED_ORIGIN)
  }, [])

  useEffect(() => {
    if (!inline || !videoId) return undefined
    // Handshake: asking the embed to stream infoDelivery. Sent on mount and
    // re-sent shortly after iframe load (the first message can race the load).
    const listen = () => {
      const win = iframeRef.current?.contentWindow
      if (win) win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT_EMBED_ORIGIN)
    }
    listen()
    const onMessage = (e) => {
      if (e.origin !== YT_EMBED_ORIGIN && e.origin !== 'https://www.youtube.com') return
      let data
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch (_e) { return }
      if (!data || typeof data !== 'object') return

      if (data.event === 'onStateChange') {
        const state = typeof data.info === 'number' ? data.info : data.info?.playerState
        playerStateRef.current = state
        setIsPlaying(state === 1)
        if (state === 0) {
          // ended — drop the resume point
          try { localStorage.removeItem(storageKey) } catch (_e) { /* silent */ }
          setResumeChip(0)
        }
      } else if (data.event === 'infoDelivery' && data.info) {
        const info = data.info
        if (!Number.isFinite(info.currentTime)) return
        timeRef.current = info.currentTime
        if (Number.isFinite(info.duration) && info.duration > 0) {
          const p = Math.min(100, Math.round((info.currentTime / info.duration) * 100))
          setPct((prev) => (prev === p ? prev : p))
          if (barRef.current) barRef.current.style.transform = `scaleX(${Math.min(1, info.currentTime / info.duration)})`
          // ≥90% watched → count it (watchedRef dedupes across sources)
          if (info.currentTime >= info.duration * WATCHED_RATIO && !watchedRef.current) {
            watchedRef.current = true
            onWatch?.()
          }
        }
        if (info.muted !== undefined) setMuted(!!info.muted)
        if (Number.isFinite(info.playbackRate) && info.playbackRate > 0) setRate(info.playbackRate)
      }
    }
    window.addEventListener('message', onMessage)
    const loadTimer = setTimeout(listen, 800)
    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(loadTimer)
    }
  }, [inline, videoId, storageKey, onWatch])

  // Fullscreen state sync (user may also leave via Esc in the browser chrome)
  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const seekBy = useCallback((delta) => {
    post('seekTo', [Math.max(0, timeRef.current + delta), true])
  }, [post])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }, [])

  // Keyboard controls: bound to the player container (tabIndex 0). Keys never
  // hijack the page — space/arrows keep scrolling normally until the player
  // itself has focus, matching the native video-element contract.
  const onKeyDown = useCallback((e) => {
    if (!inline) return
    const step = e.shiftKey ? 10 : 5
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); seekBy(step); break
      case 'ArrowLeft': e.preventDefault(); seekBy(-step); break
      case ' ': case 'Spacebar': e.preventDefault(); post(isPlaying ? 'pauseVideo' : 'playVideo'); break
      case 'm': case 'M': case 'م': post(muted ? 'unMute' : 'mute'); setMuted(!muted); break
      case 'f': case 'F': case 'ف': toggleFullscreen(); break
      default: break
    }
  }, [inline, seekBy, post, isPlaying, muted, toggleFullscreen])

  const startOver = useCallback(() => {
    setResumeChip(0)
    setResumeSec(0)
    try { localStorage.removeItem(storageKey) } catch (_e) { /* silent */ }
    timeRef.current = 0
    setPct(0)
    if (barRef.current) barRef.current.style.transform = 'scaleX(0)'
  }, [storageKey])

  const handleEmbedLoad = () => {
    setLoading(false)
    setEmbedFailed(false)
  }
  const handleEmbedError = () => {
    setLoading(false)
    setEmbedFailed(true)
  }

  const controlBtn = 'p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60'

  if (!videoId && !url) {
    return (
      <div className="relative aspect-video bg-black/30 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
        <div className="relative text-center px-4">
          <FiVideoOff size={36} className="mx-auto mb-2 text-white/50" />
          <p className="text-sm text-white/70">{t('inline.video-player.no-video-for-this')}</p>
        </div>
      </div>
    )
  }

  // ── Inline embed — default, keeps the student on the site ───────────────
  if (videoId && inline) {
    return (
      <div
        ref={containerRef}
        className="relative bg-black group"
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={title || t('inline.video-player.lecture-video')}
      >
        {/* Local progress bar — mirrors real position even though YT's own
            scrubber only appears on hover; ref-written, zero re-renders */}
        <div className="absolute top-0 inset-x-0 h-[3px] z-20 bg-white/15 pointer-events-none" aria-hidden="true">
          <div
            ref={barRef}
            className="h-full bg-gradient-to-r from-royal-500 to-cyan-400 origin-left"
            style={{ transform: `scaleX(${pct / 100})`, transition: 'transform 0.3s linear' }}
          />
        </div>

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <FiLoader size={28} className="text-white animate-spin" aria-hidden="true" />
          </div>
        )}
        {/* key forces a fresh embed when the resume point changes */}
        <iframe
          key={`${videoId}@${resumeSec}`}
          ref={iframeRef}
          src={buildEmbedSrc(videoId, { autoplay: autoPlay || resumeSec > 0, start: resumeSec })}
          title={title || t('inline.video-player.lecture-video')}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={handleEmbedLoad}
          onError={handleEmbedError}
        />

        {/* Resume chip */}
        {resumeChip > 0 && (
          <div className="absolute top-3 start-3 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full ps-3 pe-1.5 py-1.5 text-white text-xs shadow-lg">
            <span>{t('inline.video-player.resume-from').replace('{time}', fmt(resumeChip))}</span>
            <button
              onClick={startOver}
              className="inline-flex items-center gap-1 px-2 py-1 min-h-[28px] rounded-full bg-white/15 hover:bg-white/25 transition text-[11px] font-medium"
              title={t('inline.video-player.start-over')}
            >
              <FiX size={10} /> {t('inline.video-player.start-over')}
            </button>
          </div>
        )}

        {/* External fallback — always available */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 end-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition"
            title={t('inline.video-player.open-on-youtube')}
            aria-label={t('inline.video-player.open-on-youtube')}
          >
            <FiExternalLink size={12} />
            YouTube
          </a>
        )}

        {embedFailed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 text-center px-6">
            <FiVideoOff size={36} className="text-white/60 mb-1" />
            <p className="text-sm text-white/80 font-medium">
              {t('inline.video-player.this-video-cannot-be')}
            </p>
            <p className="text-xs text-white/50">
              {t('inline.video-player.the-uploader-may-have')}
            </p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-medium transition"
              >
                <FiExternalLink size={14} />
                {t('inline.video-player.open-on-youtube-2')}
              </a>
            )}
          </div>
        )}

        {/* Control strip — complements (not replaces) YT's native controls */}
        <div
          role="group"
          aria-label={t('inline.video-player.keyboard-hint')}
          title={t('inline.video-player.keyboard-hint')}
          className="relative flex items-center gap-1 px-2 py-1 bg-black/90 text-xs border-t border-white/10"
        >
          {/* Speed menu */}
          <div className="relative">
            <button
              onClick={() => setSpeedOpen((v) => !v)}
              className={controlBtn + ' font-medium tabular-nums'}
              aria-haspopup="menu"
              aria-expanded={speedOpen}
              aria-label={t('inline.video-player.speed')}
              title={t('inline.video-player.speed')}
            >
              {rate}×
            </button>
            {speedOpen && (
              <div
                role="menu"
                aria-label={t('inline.video-player.speed')}
                className="absolute bottom-full mb-1 start-0 z-30 bg-black/95 border border-white/15 rounded-xl overflow-hidden shadow-2xl min-w-[88px]"
              >
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    role="menuitemradio"
                    aria-checked={rate === s}
                    onClick={() => { post('setPlaybackRate', [s]); setSpeedOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 min-h-[36px] text-xs transition-colors hover:bg-white/10 ${rate === s ? 'text-cyan-300 font-semibold' : 'text-white/80'}`}
                  >
                    <span>{s === 1 ? t('inline.video-player.speed-normal') : `${s}×`}</span>
                    {rate === s && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-white/50 tabular-nums ms-1" aria-live="polite">
            {pct > 0 ? t('inline.video-player.watch-progress').replace('{pct}', String(pct)) : ''}
          </span>

          <div className="flex-1" />

          <button
            onClick={() => { post(muted ? 'unMute' : 'mute'); setMuted(!muted) }}
            className={controlBtn}
            aria-label={muted ? t('inline.video-player.unmute') : t('inline.video-player.mute')}
            aria-pressed={muted}
            title="M"
          >
            {muted ? <FiVolumeX size={15} /> : <FiVolume2 size={15} />}
          </button>
          <button onClick={toggleFullscreen} className={controlBtn} aria-label={t('inline.video-player.fullscreen')} title="F">
            {fullscreen ? <FiMinimize size={15} /> : <FiMaximize size={15} />}
          </button>
        </div>
      </div>
    )
  }

  // ── Thumbnail + play — one click switches to inline embed (no new tab) ──
  return (
    <div className="relative">
      <button
        type="button"
        onClick={beginInline}
        className="relative block w-full aspect-video bg-black group overflow-hidden rounded-t-2xl text-start cursor-pointer"
        aria-label={title || t('inline.video-player.play-lecture-inline')}
      >
        {videoId ? (
          <img src={lectureThumb(videoId, 'hq')} srcSet={`${lectureThumb(videoId, 'mq')} 320w, ${lectureThumb(videoId, 'hq')} 480w`} sizes="(max-width: 768px) 100vw, 66vw" alt="" width="480" height="360" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
        )}

        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-rose-500/90 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-500/30 group-hover:scale-110 group-hover:shadow-rose-500/50 transition-all duration-300">
            <FiPlay size={36} className="ms-1" />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium flex items-center gap-2">
              <FiPlay size={16} />
              {t('inline.video-player.watch-inline')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
              <FiPlay size={12} />
              {t('inline.video-player.no-leaving')}
            </span>
          </div>
        </div>
      </button>

      {/* Secondary: open on YouTube */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onWatch?.()}
          className="absolute top-3 end-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition"
          title={t('inline.video-player.open-on-youtube')}
          aria-label={t('inline.video-player.open-on-youtube')}
        >
          <FiExternalLink size={12} />
          YouTube
        </a>
      )}
    </div>
  )
}
