import { Suspense, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Lazy WebGL scene host.
 * - The heavy three.js chunk loads ONLY when the host enters the viewport
 *   (IntersectionObserver with a 200px margin).
 * - Desktop (fine pointer + enough memory) and non-reduced-motion only;
 *   every other client gets the CSS art fallback.
 * - Browsers auto-pause rAF while the tab is hidden, which stops the
 *   R3F render loop for free.
 * - The host is aria-hidden; pass `fallbackLabel` for a text alternative.
 */
function supportsWebGL() {
  try {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    if (window.matchMedia('(pointer: coarse)').matches) return false
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return false
    const canvas = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
  } catch (_e) {
    return false
  }
}

export default function Lazy3DScene({
  scene, // () => import('./SomeScene') — resolved module must default-export a component
  sceneProps, // props forwarded to the resolved scene component
  className = '',
  fallbackLabel = '',
  fallback, // JSX shown on mobile / reduced-motion / no WebGL / before load
  ariaHidden = true,
}) {
  const hostRef = useRef(null)
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [idle, setIdle] = useState(false)
  const [SceneComp, setSceneComp] = useState(null)
  const capable = useMemo(() => supportsWebGL(), [])

  // After-paint + idle gate: wait for one double-paint (page visibly rendered)
  // then for browser idle — the three.js chunk (~850KB) must never download
  // or parse while the first contentful paint / hydration is still happening.
  useEffect(() => {
    if (!capable) return
    let raf1, raf2, idleId
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if ('requestIdleCallback' in window) {
          idleId = window.requestIdleCallback(() => setIdle(true), { timeout: 1500 })
        } else {
          idleId = setTimeout(() => setIdle(true), 300)
        }
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (typeof idleId === 'number' && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId)
      else clearTimeout(idleId)
    }
  }, [capable])

  useEffect(() => {
    const el = hostRef.current
    if (!el || !capable) return
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: '200px' }
    )
    // Second observer: once loaded, pause the scene's render loop whenever
    // the host leaves the viewport (off-screen rAF/GPU work otherwise runs
    // forever, e.g. the hero particle field while reading below it).
    const visibilityIo = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '100px' }
    )
    io.observe(el)
    visibilityIo.observe(el)
    return () => {
      io.disconnect()
      visibilityIo.disconnect()
    }
  }, [capable])

  useEffect(() => {
    if (!near || !idle || !scene || SceneComp) return
    let cancelled = false
    scene()
      .then((mod) => {
        if (!cancelled) setSceneComp(() => mod.default)
      })
      .catch(() => {}) // keep the CSS fallback on load failure
    return () => { cancelled = true }
  }, [near, idle, scene, SceneComp])

  return (
    <div
      ref={hostRef}
      className={className}
      aria-hidden={ariaHidden}
      role={fallbackLabel ? 'img' : undefined}
      aria-label={fallbackLabel || undefined}
    >
      {near && SceneComp ? (
        <Suspense fallback={fallback}>
          <SceneComp {...(sceneProps || {})} paused={!visible} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}
