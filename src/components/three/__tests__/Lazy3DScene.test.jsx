import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'

// Hoisted fakes for IntersectionObserver + WebGL support probing.
let ioInstances = []
let intersectingNear = false
let intersectingVisible = false

class FakeIO {
  constructor(cb, opts = {}) {
    this.cb = cb
    this.opts = opts
    this.el = null
    ioInstances.push(this)
  }
  observe(el) {
    this.el = el
    this.fire()
  }
  disconnect() {
    this.el = null
  }
  fire() {
    if (!this.el) return
    const near = this.opts.rootMargin === '200px'
    this.cb([{ isIntersecting: near ? intersectingNear : intersectingVisible }])
  }
}

describe('Lazy3DScene', () => {
  beforeEach(() => {
    ioInstances = []
    intersectingNear = false
    intersectingVisible = false
    vi.stubGlobal('IntersectionObserver', FakeIO)
    // Default desktop-capable environment.
    vi.stubGlobal('matchMedia', (q) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true })
    // jsdom has no WebGL; the support probe requires the global + a context.
    vi.stubGlobal('WebGLRenderingContext', function WebGLRenderingContext() {})
    // Give every canvas a fake WebGL context (jsdom has none).
    const realCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag, opts) => {
      const el = realCreateElement(tag, opts)
      if (String(tag).toLowerCase() === 'canvas') el.getContext = () => ({})
      return el
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  const load = async (sceneProps = {}) => {
    // Fresh module graph per test so useMemo(supportsWebGL) re-runs.
    const { default: Lazy3DScene } = await import('../Lazy3DScene')
    const scene = vi.fn().mockResolvedValue({ default: () => null })
    const utils = render(
      <Lazy3DScene scene={scene} fallback={<div>css-fallback</div>} fallbackLabel="مقدمة ثلاثية" {...sceneProps} />
    )
    return { utils, scene }
  }

  it('shows the fallback while far from the viewport and does not import the scene', async () => {
    const { scene } = await load()
    expect(screen.getByText('css-fallback')).toBeInTheDocument()
    expect(scene).not.toHaveBeenCalled()
  })

  it('imports the scene only when it comes near the viewport', async () => {
    const { scene } = await load()
    intersectingNear = true
    act(() => ioInstances.forEach((io) => io.fire()))
    await waitFor(() => expect(scene).toHaveBeenCalledTimes(1))
  })

  it('passes paused:false when visible and paused:true when it leaves', async () => {
    const sceneModule = await import('../Lazy3DScene')
    let receivedPaused = 'never-rendered'
    const scene = vi.fn().mockResolvedValue({
      default: ({ paused }) => {
        receivedPaused = paused
        return null
      },
    })
    render(<sceneModule.default scene={scene} fallback={null} />)
    intersectingNear = true
    act(() => ioInstances.forEach((io) => io.fire()))
    intersectingVisible = true
    act(() => ioInstances.forEach((io) => io.fire()))
    await waitFor(() => expect(receivedPaused).toBe(false))

    intersectingVisible = false
    act(() => ioInstances.forEach((io) => io.fire()))
    await waitFor(() => expect(receivedPaused).toBe(true))
  })

  it('keeps the fallback when the scene chunk fails to load', async () => {
    const { default: Lazy3DScene } = await import('../Lazy3DScene')
    const scene = vi.fn().mockRejectedValue(new Error('chunk 404'))
    render(<Lazy3DScene scene={scene} fallback={<div>css-fallback</div>} />)
    intersectingNear = true
    act(() => ioInstances.forEach((io) => io.fire()))
    await waitFor(() => expect(scene).toHaveBeenCalled())
    expect(screen.getByText('css-fallback')).toBeInTheDocument()
  })
})
