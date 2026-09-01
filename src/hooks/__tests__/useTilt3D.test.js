import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import useTilt3D from '../useTilt3D'

function attach(el) {
  document.body.appendChild(el)
  // jsdom has no layout; give getBoundingClientRect something stable to work with.
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100,
  })
  return el
}

describe('useTilt3D', () => {
  let rafQueue
  beforeEach(() => {
    rafQueue = []
    vi.stubGlobal('requestAnimationFrame', (cb) => { rafQueue.push(cb); return 1 })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  const flushFrames = () => {
    const list = rafQueue
    rafQueue = []
    list.forEach((cb) => cb(0))
  }

  it('returns a ref plus handlers and writes vars through the handler contract', () => {
    const el = attach(document.createElement('div'))
    const { result } = renderHook(() => useTilt3D({ max: 6 }))
    expect(result.current.ref).toBeDefined()
    expect(typeof result.current.tiltHandlers.onMouseMove).toBe('function')
    expect(typeof result.current.tiltHandlers.onMouseLeave).toBe('function')
    expect(result.current.tiltHandlers.ref).toBe(result.current.ref)

    // Behavior check through the real handler path (center → zero tilt).
    result.current.ref.current = el
    result.current.tiltHandlers.onMouseMove({ pointerType: 'mouse', clientX: 100, clientY: 50 })
    flushFrames()
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0.00deg')
  })

  it('writes tilt CSS vars and marks the element on mouse move', () => {
    const el = attach(document.createElement('div'))
    const { result } = renderHook(() => useTilt3D({ max: 6 }))
    result.current.ref.current = el

    // Pointer at the top-left corner: px=-0.5, py=-0.5 → tilt-x=3deg, tilt-y=-3deg
    result.current.tiltHandlers.onMouseMove({ pointerType: 'mouse', clientX: 0, clientY: 0 })
    flushFrames()

    expect(el.style.getPropertyValue('--tilt-x')).toBe('3.00deg')
    expect(el.style.getPropertyValue('--tilt-y')).toBe('-3.00deg')
    expect(el.style.getPropertyValue('--tilt-z')).toBe('10px')
    expect(el.classList.contains('is-tilting')).toBe(true)
  })

  it('ignores touch pointers entirely', () => {
    const el = attach(document.createElement('div'))
    const { result } = renderHook(() => useTilt3D())
    result.current.ref.current = el

    result.current.tiltHandlers.onMouseMove({ pointerType: 'touch', clientX: 50, clientY: 50 })
    flushFrames()

    expect(el.style.getPropertyValue('--tilt-x')).toBe('')
    expect(el.classList.contains('is-tilting')).toBe(false)
  })

  it('resets vars and the tilting class on mouse leave', () => {
    const el = attach(document.createElement('div'))
    const { result } = renderHook(() => useTilt3D())
    result.current.ref.current = el

    result.current.tiltHandlers.onMouseMove({ pointerType: 'mouse', clientX: 100, clientY: 50 })
    flushFrames()
    expect(el.classList.contains('is-tilting')).toBe(true)

    result.current.tiltHandlers.onMouseLeave()
    expect(el.classList.contains('is-tilting')).toBe(false)
    expect(el.style.getPropertyValue('--tilt-x')).toBe('0deg')
    expect(el.style.getPropertyValue('--tilt-y')).toBe('0deg')
    expect(el.style.getPropertyValue('--tilt-z')).toBe('0px')
  })
})
