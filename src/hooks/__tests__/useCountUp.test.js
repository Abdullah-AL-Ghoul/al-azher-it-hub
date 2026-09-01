import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useCountUp from '../useCountUp'

// Manual rAF pump so the count-up can be stepped deterministically.
// performance.now is stubbed to the same clock, since the hook anchors its
// start time to it — real time would make progress wildly negative.
function installRaf() {
  const g = globalThis
  const realRaf = g.requestAnimationFrame
  const realCaf = g.cancelAnimationFrame
  const realPerf = g.performance
  let queue = []
  let clock = 0
  g.requestAnimationFrame = (cb) => {
    queue.push(cb)
    return queue.length - 1
  }
  g.cancelAnimationFrame = () => {}
  g.performance = { now: () => clock }
  return {
    step(now = 0) {
      clock = now
      const list = queue
      queue = []
      list.forEach((cb) => cb(now))
    },
    restore() {
      g.requestAnimationFrame = realRaf
      g.cancelAnimationFrame = realCaf
      g.performance = realPerf
    },
  }
}

describe('useCountUp', () => {
  let raf
  beforeEach(() => {
    raf = installRaf()
  })
  afterEach(() => {
    raf.restore()
  })

  const step = (now) => act(() => raf.step(now))

  it('jumps straight to the target when reduced motion is requested', () => {
    const { result } = renderHook(() => useCountUp(500, { reduced: true }))
    expect(result.current).toBe(500)
  })

  it('stays at 0 until start flips true', () => {
    const { result } = renderHook(() => useCountUp(500, { start: false }))
    expect(result.current).toBe(0)
  })

  it('eases toward the target over frames and lands exactly on it', () => {
    const { result } = renderHook(() => useCountUp(900, { duration: 1000 }))

    // First rAF fires immediately at t0, subsequent frames advance the clock.
    let now = 0
    step(now)
    expect(result.current).toBeGreaterThanOrEqual(0)
    expect(result.current).toBeLessThan(900)

    for (let i = 1; i <= 20; i++) {
      now += 100
      step(now)
    }
    expect(result.current).toBe(900)
  })

  it('is monotonically non-decreasing while animating', () => {
    const { result } = renderHook(() => useCountUp(300, { duration: 600 }))
    let now = 0
    step(now)
    let prev = result.current
    for (let i = 0; i < 10; i++) {
      now += 100
      step(now)
      expect(result.current).toBeGreaterThanOrEqual(prev)
      prev = result.current
    }
  })

  it('follows a new target once it changes', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, { duration: 100 }), {
      initialProps: { target: 100 },
    })
    let now = 0
    for (let i = 0; i < 5; i++) {
      now += 100
      step(now)
    }
    expect(result.current).toBe(100)

    rerender({ target: 250 })
    for (let i = 0; i < 5; i++) {
      now += 100
      step(now)
    }
    expect(result.current).toBe(250)
  })
})
