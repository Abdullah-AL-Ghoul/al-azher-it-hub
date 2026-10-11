import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  FiPlay,
  FiPause,
  FiExternalLink,
  FiVideoOff,
  FiLoader,
  FiMaximize,
  FiMinimize,
  FiVolume2,
  FiVolumeX,
  FiX,
  FiRotateCcw,
} from 'react-icons/fi'
import LectureThumbnail from './LectureThumbnail'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const MIN_RESUME_SEC = 30
const WATCHED_RATIO = 0.9

function buildEmbedSrc(videoId, { autoplay = false, start = 0 } = {}) {
  const params = new URLSearchParams({
    rel: '0',
    playsinline: '1',
    modestbranding: '1',
    enablejsapi: '1',
    autoplay: autoplay ? '1' : '0',
  })
  if (start > 0) params.set('start', String(Math.floor(start)))
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
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
 * Modern, robust video player:
 * - Guarantees 16:9 aspect ratio without any container collapse or zero-height bugs.
 * - Handles YouTube embeds with auto-resume, play/pause controls, speed menu, and fullscreen.
 * - Auto-detects direct video URLs (.mp4/.webm) and renders native HTML5 video.
 * - Surfaces instant, helpful fallback when YouTube disables embedding (Error 150/101).
 */
export default function VideoPlayer({
  videoId,
  url,
  thumbnail,
  title,
  onWatch,
  autoPlay = false,
  lectureId = '',
  studentId: studentIdProp = '',
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const studentId = studentIdProp || user?.studentId || 'guest'

  const isDirectVideo = Boolean(url && /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(url))
  const [inline, setInline] = useState(autoPlay)
  const [loading, setLoading] = useState(false)
  const [embedFailed, setEmbedFailed] = useState(false)
  const watchedRef = useRef(false)
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const barRef = useRef(null)

  // Player telemetry
  const [isPlaying, setIsPlaying] = useState(Boolean(autoPlay))
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [pct, setPct] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const timeRef = useRef(0)
  const playerStateRef = useRef(-1)

  // Resume state
  const [resumeSec, setResumeSec] = useState(0)
  const [resumeChip, setResumeChip] = useState(0)
  const storageKey = useMemo(
    () => `yt_pos_${studentId || 'guest'}_${lectureId || 'x'}`,
    [studentId, lectureId]
  )

  const beginInline = useCallback(() => {
    if (!videoId) {
      if (isDirectVideo) {
        setInline(true)
        if (!watchedRef.current) {
          watchedRef.current = true
          onWatch?.()
        }
      } else if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        if (!watchedRef.current) {
          watchedRef.current = true
          onWatch?.()
        }
      }
      return
    }

    try {
      const saved = parseFloat(localStorage.getItem(storageKey) || '0')
      if (saved >= MIN_RESUME_SEC) {
        setResumeSec(Math.max(0, Math.floor(saved) - 5))
        setResumeChip(Math.floor(saved))
      }
    } catch (_e) { /* silent */ }

    setInline(true)
    setLoading(true)
    setIsPlaying(true)
    if (!watchedRef.current) {
      watchedRef.current = true
      onWatch?.()
    }
  }, [videoId, url, isDirectVideo, onWatch, storageKey])

  useEffect(() => {
    if (autoPlay && (videoId || isDirectVideo) && !watchedRef.current) {
      watchedRef.current = true
      const tm = setTimeout(() => onWatch?.(), 400)
      return () => clearTimeout(tm)
    }
  }, [autoPlay, videoId, isDirectVideo, onWatch])

  // Save progress periodically
  useEffect(() => {
    if (!inline || !videoId) return undefined
    const saveNow = () => {
      try {
        if (timeRef.current >= MIN_RESUME_SEC) {
          localStorage.setItem(storageKey, String(Math.floor(timeRef.current)))
        }
      } catch (_e) { /* silent */ }
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

  // YT postMessage channel
  const post = useCallback((func, args = []) => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
  }, [])

  useEffect(() => {
    if (!inline || !videoId) return undefined
    const listen = () => {
      const win = iframeRef.current?.contentWindow
      if (win) win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*')
    }
    listen()

    const onMessage = (e) => {
      if (
        e.origin !== 'https://www.youtube.com' &&
        e.origin !== 'https://www.youtube-nocookie.com'
      ) return

      let data
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data } catch (_e) { return }
      if (!data || typeof data !== 'object') return

      if (data.event === 'onError') {
        playerStateRef.current = -1
        setIsPlaying(false)
        setLoading(false)
        setEmbedFailed(true)
      } else if (data.event === 'onStateChange') {
        const state = typeof data.info === 'number' ? data.info : data.info?.playerState
        playerStateRef.current = state
        setIsPlaying(state === 1)
        if (state === 1) setLoading(false)
        if (state === 0) {
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
    const loadTimer = setTimeout(listen, 600)
    return () => {
      window.removeEventListener('message', onMessage)
      clearTimeout(loadTimer)
    }
  }, [inline, videoId, storageKey, onWatch])

  // Fullscreen sync
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

  const togglePlayPause = useCallback(() => {
    const next = !isPlaying
    post(next ? 'playVideo' : 'pauseVideo')
    setIsPlaying(next)
  }, [isPlaying, post])

  const onKeyDown = useCallback((e) => {
    if (!inline) return
    const step = e.shiftKey ? 10 : 5
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); seekBy(step); break
      case 'ArrowLeft': e.preventDefault(); seekBy(-step); break
      case ' ': case 'Spacebar': e.preventDefault(); togglePlayPause(); break
      case 'm': case 'M': case 'م': post(muted ? 'unMute' : 'mute'); setMuted(!muted); break
      case 'f': case 'F': case 'ف': toggleFullscreen(); break
      default: break
    }
  }, [inline, seekBy, togglePlayPause, post, muted, toggleFullscreen])

  const startOver = useCallback(() => {
    setResumeChip(0)
    setResumeSec(0)
    try { localStorage.removeItem(storageKey) } catch (_e) { /* silent */ }
    timeRef.current = 0
    setPct(0)
    if (barRef.current) barRef.current.style.transform = 'scaleX(0)'
    post('seekTo', [0, true])
  }, [storageKey, post])

  const handleEmbedLoad = () => {
    setLoading(false)
  }
  const handleEmbedError = () => {
    setLoading(false)
    setEmbedFailed(true)
  }

  const controlBtn =
    'p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60'

  // Empty state if neither videoId nor URL
  if (!videoId && !url) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-royal-500/10 to-violet-500/10" />
        <div className="relative text-center px-4">
          <FiVideoOff size={40} className="mx-auto mb-2 text-white/40" />
          <p className="text-sm font-medium text-white/70">{t('inline.video-player.no-video-for-this')}</p>
        </div>
      </div>
    )
  }

  // Direct video file (.mp4 / .webm)
  if (isDirectVideo && inline) {
    return (
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col group select-none focus:outline-none border border-white/10"
        tabIndex={0}
      >
        <div
          className="relative w-full aspect-video min-h-[260px] sm:min-h-[400px] bg-black flex items-center justify-center"
          style={{ aspectRatio: '16 / 9' }}
        >
          <video
            src={url}
            controls
            autoPlay={autoPlay}
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => {
              setIsPlaying(true)
              if (!watchedRef.current) {
                watchedRef.current = true
                onWatch?.()
              }
            }}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      </div>
    )
  }

  // YouTube inline embed
  if (videoId && inline) {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`
    return (
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col group select-none focus:outline-none border border-white/10"
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={title || t('inline.video-player.lecture-video')}
      >
        {/* 16:9 Video Canvas */}
        <div
          className="relative w-full aspect-video min-h-[260px] sm:min-h-[400px] bg-black overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* Local progress bar */}
          <div className="absolute top-0 inset-x-0 h-[3px] z-30 bg-white/15 pointer-events-none" aria-hidden="true">
            <div
              ref={barRef}
              className="h-full bg-gradient-to-r from-royal-500 to-cyan-400 origin-left"
              style={{ transform: `scaleX(${pct / 100})`, transition: 'transform 0.3s linear' }}
            />
          </div>

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-xs">
              <FiLoader size={36} className="text-cyan-400 animate-spin" aria-hidden="true" />
            </div>
          )}

          <iframe
            key={`${videoId}@${resumeSec}`}
            ref={iframeRef}
            src={buildEmbedSrc(videoId, { autoplay: autoPlay || resumeSec > 0, start: resumeSec })}
            title={title || t('inline.video-player.lecture-video')}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={handleEmbedLoad}
            onError={handleEmbedError}
          />

          {/* Resume chip */}
          {resumeChip > 0 && (
            <div className="absolute top-3 start-3 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-full ps-3 pe-1.5 py-1.5 text-white text-xs shadow-lg border border-white/10">
              <span>{t('inline.video-player.resume-from').replace('{time}', fmt(resumeChip))}</span>
              <button
                type="button"
                onClick={startOver}
                className="inline-flex items-center gap-1 px-2 py-1 min-h-[26px] rounded-full bg-white/15 hover:bg-white/25 transition text-[11px] font-medium"
                title={t('inline.video-player.start-over')}
              >
                <FiX size={10} /> {t('inline.video-player.start-over')}
              </button>
            </div>
          )}

          {/* External YouTube link badge */}
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 end-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md rounded-full text-white text-xs font-medium transition border border-white/10"
            title={t('inline.video-player.open-on-youtube')}
            aria-label={t('inline.video-player.open-on-youtube')}
          >
            <FiExternalLink size={12} />
            YouTube
          </a>

          {/* Embed blocked fallback overlay */}
          {embedFailed && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/90 text-center px-6">
              <FiVideoOff size={42} className="text-rose-400 mb-1" />
              <p className="text-sm text-white font-semibold">
                {t('inline.video-player.this-video-cannot-be')}
              </p>
              <p className="text-xs text-white/60 max-w-md">
                {t('inline.video-player.the-uploader-may-have')}
              </p>
              <a
                href={ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-rose-600/30 transition transform hover:scale-105"
              >
                <FiExternalLink size={15} />
                {t('inline.video-player.open-on-youtube-2')}
              </a>
            </div>
          )}
        </div>

        {/* Supplementary control bar */}
        <div
          role="group"
          aria-label={t('inline.video-player.keyboard-hint')}
          title={t('inline.video-player.keyboard-hint')}
          className="relative flex items-center gap-1 sm:gap-2 px-3 py-2 bg-slate-950/95 text-xs border-t border-white/10 z-20 backdrop-blur-md"
        >
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            className={controlBtn}
            aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            title="Space"
          >
            {isPlaying ? <FiPause size={15} /> : <FiPlay size={15} />}
          </button>

          {/* Seek -10s */}
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className={controlBtn}
            aria-label="تأخير 10 ثواني"
            title="ArrowLeft / -10s"
          >
            <FiRotateCcw size={14} />
          </button>

          {/* Speed menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSpeedOpen((v) => !v)}
              className={controlBtn + ' font-semibold tabular-nums text-cyan-300'}
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
                className="absolute bottom-full mb-2 start-0 z-40 bg-slate-900 border border-white/15 rounded-xl overflow-hidden shadow-2xl min-w-[96px] py-1"
              >
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitemradio"
                    aria-checked={rate === s}
                    onClick={() => { post('setPlaybackRate', [s]); setSpeedOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-white/10 ${rate === s ? 'text-cyan-400 font-bold' : 'text-white/80'}`}
                  >
                    <span>{s === 1 ? t('inline.video-player.speed-normal') : `${s}×`}</span>
                    {rate === s && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Watch Progress */}
          {pct > 0 && (
            <span className="text-white/60 tabular-nums text-[11px] ms-1 hidden sm:inline" aria-live="polite">
              {t('inline.video-player.watch-progress').replace('{pct}', String(pct))}
            </span>
          )}

          <div className="flex-1" />

          {/* Mute toggle */}
          <button
            type="button"
            onClick={() => { post(muted ? 'unMute' : 'mute'); setMuted(!muted) }}
            className={controlBtn}
            aria-label={muted ? t('inline.video-player.unmute') : t('inline.video-player.mute')}
            aria-pressed={muted}
            title="M"
          >
            {muted ? <FiVolumeX size={15} /> : <FiVolume2 size={15} />}
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={controlBtn}
            aria-label={t('inline.video-player.fullscreen')}
            title="F"
          >
            {fullscreen ? <FiMinimize size={15} /> : <FiMaximize size={15} />}
          </button>
        </div>
      </div>
    )
  }

  // Thumbnail + Play trigger
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
      <div
        className="relative block w-full aspect-video min-h-[260px] sm:min-h-[400px] bg-black group overflow-hidden text-start cursor-pointer"
        style={{ aspectRatio: '16 / 9' }}
        onClick={beginInline}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            beginInline()
          }
        }}
        aria-label={title || t('inline.video-player.play-lecture-inline')}
      >
        <LectureThumbnail
          videoId={videoId}
          thumbnail={thumbnail}
          alt={title || ''}
          width={1280}
          height={720}
          sizes="(max-width: 768px) 100vw, 66vw"
          className="group-hover:scale-105 transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-300" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-rose-600/95 group-hover:bg-rose-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-rose-600/50 group-hover:scale-110 transition-all duration-300 backdrop-blur-xs">
            <FiPlay size={36} className="ms-1" />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-semibold flex items-center gap-2">
              <FiPlay size={16} className="text-rose-400" />
              {t('inline.video-player.watch-inline')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-medium">
              <FiPlay size={12} />
              {t('inline.video-player.no-leaving')}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary external link */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation()
            onWatch?.()
          }}
          className="absolute top-3 end-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white text-xs font-medium transition border border-white/10"
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
