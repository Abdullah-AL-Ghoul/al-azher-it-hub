import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ScrollProvider, useScrollManager, useScrollFrame } from '../useScrollManager'

function installRaf() {
  const g = globalThis
  const realRaf = g.requestAnimationFrame
  const realCaf = g.cancelAnimationFrame
  let queue = []
  g.requestAnimationFrame = (cb) => { queue.push(cb); return queue.length } // 1-based like real browsers
  g.cancelAnimationFrame = () => {}
  return {
    flush() {
      const list = queue
      queue = []
      list.forEach((cb) => cb(0))
    },
    restore() {
      g.requestAnimationFrame = realRaf
      g.cancelAnimationFrame = realCaf
    },
  }
}

function setScrollY(value) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 200, configurable: true })
}

describe('useScrollManager', () => {
  let raf
  beforeEach(() => {
    raf = installRaf()
    setScrollY(0)
  })
  afterEach(() => {
    raf.restore()
  })

  it('exposes scrolled:false at the top of the page', () => {
    const { result } = renderHook(() => useScrollManager(), { wrapper: ScrollProvider })
    expect(result.current.scrolled).toBe(false)
  })

  it('flips scrolled to true past the 20px threshold and back', () => {
    const { result } = renderHook(() => useScrollManager(), { wrapper: ScrollProvider })

    setScrollY(50)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      raf.flush()
    })
    expect(result.current.scrolled).toBe(true)

    setScrollY(5)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      raf.flush()
    })
    expect(result.current.scrolled).toBe(false)
  })

  it('does not flip at or below 20px', () => {
    const { result } = renderHook(() => useScrollManager(), { wrapper: ScrollProvider })
    setScrollY(20)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      raf.flush()
    })
    expect(result.current.scrolled).toBe(false)
  })
})

describe('useScrollFrame', () => {
  let raf
  beforeEach(() => {
    raf = installRaf()
    setScrollY(300)
  })
  afterEach(() => {
    raf.restore()
  })

  it('delivers { y, progress } on scroll events', () => {
    const seen = []
    renderHook(() => useScrollFrame((s) => seen.push(s)))
    raf.flush() // drain + discard the initial mount call
    seen.length = 0

    act(() => {
      window.dispatchEvent(new Event('scroll'))
      raf.flush()
    })

    expect(seen).toHaveLength(1)
    expect(seen[0].y).toBe(300)
    // doc = 1000 - 200 = 800 → progress = 300/800*100 = 37.5
    expect(seen[0].progress).toBeCloseTo(37.5, 5)
  })

  it('coalesces a scroll burst into one callback per animation frame', () => {
    const seen = []
    renderHook(() => useScrollFrame((s) => seen.push(s)))
    raf.flush() // drain + discard the initial mount call
    seen.length = 0

    act(() => {
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
    })
    expect(seen).toHaveLength(0) // nothing until the rAF fires

    act(() => raf.flush())
    expect(seen).toHaveLength(1)
  })

  it('fires once immediately on mount so consumers get an initial value', () => {
    const seen = []
    renderHook(() => useScrollFrame((s) => seen.push(s)))
    raf.flush()
    expect(seen).toHaveLength(1)
    expect(seen[0].y).toBe(300)
  })

  it('reports 0 progress when the document is not scrollable', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 200, configurable: true })
    const seen = []
    renderHook(() => useScrollFrame((s) => seen.push(s)))
    seen.length = 0 // drain the initial mount call
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      raf.flush()
    })
    expect(seen[0].progress).toBe(0)
  })
})
