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
export default function LectureThumbnail({ videoId, alt = '', sizes, width = 320, height = 180, priority = false, className = '' }) {
  const [step, setStep] = useState(0)

  // A reused instance (modal, re-ordered list) must restart the ladder when
  // the video changes, or one missing-maxres video degrades every later one.
  useEffect(() => {
    setStep(0)
  }, [videoId])

  if (!videoId || step >= LADDER.length) {
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
  return (
    <img
      key={`${id}-${step}`}
      src={lectureThumb(id, LADDER[step])}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      onError={() => setStep((s) => s + 1)}
      // YouTube answers 200 with a 120x90 gray placeholder for qualities a
      // video lacks — every real rung is ≥320px wide, so treat tiny decodes
      // as failures and keep descending the ladder.
      onLoad={(e) => { if (e.target.naturalWidth && e.target.naturalWidth < 200) setStep((s) => s + 1) }}
      className={`w-full h-full object-cover ${className}`}
    />
  )
}
