import { useEffect, useState } from 'react'
import { lectureThumb } from '../../utils/helpers'

// Quality ladder: start at maxres (true 16:9); YouTube serves 404 + a gray
// placeholder for qualities a video lacks, so on error we drop a rung and
// finally paint the branded gradient tile instead of a black box.
const LADDER = ['maxres', 'hq', 'mq']

const SRC_SETS = [
  (id) => `${lectureThumb(id, 'mq')} 320w, ${lectureThumb(id, 'hq')} 480w, ${lectureThumb(id, 'maxres')} 1280w`,
  (id) => `${lectureThumb(id, 'mq')} 320w, ${lectureThumb(id, 'hq')} 480w`,
  (id) => `${lectureThumb(id, 'mq')} 320w`,
]

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
        className={`absolute inset-0 bg-gradient-to-br from-cyan-500/25 via-royal-500/15 to-violet-500/25 ${className}`}
        aria-hidden="true"
      />
    )
  }

  const id = videoId
  return (
    <img
      key={id}
      src={lectureThumb(id, LADDER[step])}
      srcSet={SRC_SETS[step](id)}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      onError={() => setStep((s) => s + 1)}
      className={`w-full h-full object-cover ${className}`}
    />
  )
}
