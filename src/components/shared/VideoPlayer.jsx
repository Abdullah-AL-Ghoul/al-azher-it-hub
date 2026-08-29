import { useState, useEffect, useCallback, useRef } from 'react'
import { FiPlay, FiExternalLink, FiVideoOff, FiLoader } from 'react-icons/fi'
import { lectureThumb } from '../../utils/helpers'

function buildEmbedSrc(videoId, autoplay = true) {
  const params = new URLSearchParams({
    rel: 0,
    playsinline: 1,
    modestbranding: 1,
    color: 'white',
    autoplay: autoplay ? 1 : 0,
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export default function VideoPlayer({ videoId, url, title, isArabic, onWatch, autoPlay = false }) {
  const [inline, setInline] = useState(autoPlay)
  const [loading, setLoading] = useState(false)
  const [embedFailed, setEmbedFailed] = useState(false)
  const watchedRef = useRef(false)
  const iframeRef = useRef(null)

  // Fire onWatch the first time inline playback starts (a real user gesture).
  const beginInline = useCallback(() => {
    if (!videoId) return
    setInline(true)
    setLoading(true)
    if (!watchedRef.current) {
      watchedRef.current = true
      onWatch?.()
    }
  }, [videoId, onWatch])

  useEffect(() => {
    if (autoPlay && videoId && !watchedRef.current) {
      watchedRef.current = true
      // Defer so onWatch runs after mount (modal context).
      const t = setTimeout(() => onWatch?.(), 400)
      return () => clearTimeout(t)
    }
  }, [autoPlay, videoId, onWatch])

  const handleEmbedLoad = () => {
    setLoading(false)
    setEmbedFailed(false)
  }

  const handleEmbedError = () => {
    setLoading(false)
    setEmbedFailed(true)
  }

  if (!videoId && !url) {
    return (
      <div className="relative aspect-video bg-black/30 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20" />
        <div className="relative text-center px-4">
          <FiVideoOff size={36} className="mx-auto mb-2 text-white/50" />
          <p className="text-sm text-white/70">{isArabic ? 'لا يوجد فيديو لهذه المحاضرة' : 'No video for this lecture'}</p>
        </div>
      </div>
    )
  }

  // Inline embed — default, keeps the student on the site.
  if (videoId && inline) {
    return (
      <div className="relative aspect-video bg-black group">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <FiLoader size={28} className="text-white animate-spin" aria-hidden="true" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={buildEmbedSrc(videoId)}
          title={title || (isArabic ? 'فيديو المحاضرة' : 'Lecture video')}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={handleEmbedLoad}
          onError={handleEmbedError}
        />
        {/* External fallback — always available */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 end-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-black/80 transition"
            title={isArabic ? 'فتح على YouTube' : 'Open on YouTube'}
            aria-label={isArabic ? 'فتح على YouTube' : 'Open on YouTube'}
          >
            <FiExternalLink size={12} />
            YouTube
          </a>
        )}
        {embedFailed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 text-center px-6">
            <FiVideoOff size={36} className="text-white/60 mb-1" />
            <p className="text-sm text-white/80 font-medium">
              {isArabic ? 'تعذّر تشغيل هذا الفيديو داخل الموقع' : 'This video cannot be played inline'}
            </p>
            <p className="text-xs text-white/50">
              {isArabic ? 'قد يكون صاحب الفيديو منع التضمين' : 'The uploader may have disabled embedding'}
            </p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm font-medium transition"
              >
                <FiExternalLink size={14} />
                {isArabic ? 'افتح على YouTube' : 'Open on YouTube'}
              </a>
            )}
          </div>
        )}
      </div>
    )
  }

  // Thumbnail + play — one click switches to inline embed (no new tab).
  return (
    <div className="relative">
      <button
        type="button"
        onClick={beginInline}
        className="relative block w-full aspect-video bg-black group overflow-hidden rounded-t-2xl text-start cursor-pointer"
        aria-label={title || (isArabic ? 'تشغيل المحاضرة داخل الموقع' : 'Play lecture inline')}
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
              {isArabic ? 'شاهد الآن داخل الموقع' : 'Watch inline'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
              <FiPlay size={12} />
              {isArabic ? 'بدون مغادرة' : 'No leaving'}
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
          title={isArabic ? 'فتح على YouTube' : 'Open on YouTube'}
          aria-label={isArabic ? 'فتح على YouTube' : 'Open on YouTube'}
        >
          <FiExternalLink size={12} />
          YouTube
        </a>
      )}
    </div>
  )
}
