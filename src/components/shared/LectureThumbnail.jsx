import { useEffect, useState } from 'react'
import { lectureThumb } from '../../utils/helpers'

// Quality ladder: Try highest resolution first (maxres/hq720), then fallback to hq/mq.
// We use direct src fallback without restrictive low-res srcSet so high-DPI displays
// always get the crystal clear full thumbnail image.
const LADDER = ['maxres', 'hq720', 'hq', 'mq']

/**
 * YouTube lecture thumbnail with automatic quality fallback.
 * Renders only the <img> (or the gradient tile when nothing is available) —
 * the caller owns the positioned 16:9 container and its overlays.
 *
 * props:
 *  - videoId: extracted YouTube id (null → gradient tile)
 *  - sizes: responsive width hint matching the real rendered card width
 *  - priority: first-paint image → eager + high fetchpriority
 *  - className: forwarded to the img (hover scale etc.)
 */
export default function LectureThumbnail({
  videoId,
  thumbnail,
  alt = '',
  sizes,
  width = 320,
  height = 180,
  priority = false,
  className = '',
}) {
  const [step, setStep] = useState(0)
  const [hasError, setHasError] = useState(false)

  // Reset step whenever videoId or thumbnail changes
  useEffect(() => {
    setStep(0)
    setHasError(false)
  }, [videoId, thumbnail])

  // Direct custom thumbnail provided
  if (thumbnail && !hasError && step === 0) {
    return (
      <img
        src={thumbnail}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    )
  }

  if (!videoId || step >= LADDER.length || hasError) {
    return (
      <div
        className={`absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-3 text-center overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-academic-primary/70 to-slate-950 opacity-95" />
        <div className="relative z-10 w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 mb-1.5 border border-white/10 shadow-md">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        </div>
        <span className="relative z-10 text-[11px] font-medium text-slate-300 tracking-wide line-clamp-1">{alt || 'محاضرة علمية'}</span>
      </div>
    )
  }

  const id = videoId
  const currentQuality = LADDER[step]

  return (
    <img
      key={`${id}-${currentQuality}`}
      src={lectureThumb(id, currentQuality)}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (step + 1 < LADDER.length) {
          setStep((s) => s + 1)
        } else {
          setHasError(true)
        }
      }}
      onLoad={(e) => {
        // YouTube returns a 120x90 placeholder when maxres/hq720 is missing.
        // If width is tiny (< 150px) and we're on maxres/hq720, try hqdefault.
        if (e.target.naturalWidth && e.target.naturalWidth < 150 && step < 2) {
          setStep((s) => s + 1)
        }
      }}
      className={`w-full h-full object-cover ${className}`}
    />
  )
}
