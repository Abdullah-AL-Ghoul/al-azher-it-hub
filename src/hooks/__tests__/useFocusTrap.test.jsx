import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'
import { useScrollLock } from '../useScrollLock'

function dialogWithButtons() {
  const container = document.createElement('div')
  container.innerHTML = `
    <button id="outside">outside</button>
    <div id="dialog">
      <button id="first">first</button>
      <button id="middle">middle</button>
      <button id="last">last</button>
    </div>`
  document.body.appendChild(container)
  return container
}

// The trap only works when the ref is attached before the effect runs, so
// exercise it through a real host component instead of renderHook.
function Trap({ active, targetRef }) {
  const ref = useFocusTrap(active)
  // Point the trap's own ref at the caller's element on first render.
  if (targetRef) ref.current = targetRef.current
  return null
}

const mountTrap = (container, active = true) => {
  const host = { current: container.querySelector('#dialog') }
  const utils = render(<Trap active={active} targetRef={host} />)
  act(() => vi.advanceTimersByTime(60))
  return utils
}

const pressTab = (shift = false) => {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }))
  })
}

describe('useFocusTrap', () => {
  let container
  beforeEach(() => {
    container = dialogWithButtons()
  })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('focuses the first focusable element when activated', () => {
    vi.useFakeTimers()
    mountTrap(container)
    expect(document.activeElement.id).toBe('first')
  })

  it('wraps tab navigation inside the container', () => {
    vi.useFakeTimers()
    mountTrap(container)

    container.querySelector('#last').focus()
    pressTab()
    expect(document.activeElement.id).toBe('first')

    pressTab(true)
    expect(document.activeElement.id).toBe('last')
  })

  it('restores focus to the previously focused element on deactivation', () => {
    vi.useFakeTimers()

    const outside = container.querySelector('#outside')
    outside.focus()

    const utils = mountTrap(container)
    expect(document.activeElement.id).not.toBe('outside')

    act(() => utils.rerender(<Trap active={false} targetRef={{ current: container.querySelector('#dialog') }} />))
    expect(document.activeElement.id).toBe('outside')
  })

  it('leaves focus alone while inactive', () => {
    vi.useFakeTimers()
    const outside = container.querySelector('#outside')
    outside.focus()
    mountTrap(container, false)
    expect(document.activeElement.id).toBe('outside')
  })
})

describe('useScrollLock', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })
  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('locks body overflow while active and restores on cleanup', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderHook(() => useScrollLock(true))
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('does not lock while inactive', () => {
    document.body.style.overflow = 'scroll'
    renderHook(() => useScrollLock(false))
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('stacks two locks and only restores after the last unmounts', () => {
    document.body.style.overflow = 'auto'
    const a = renderHook(() => useScrollLock(true))
    const b = renderHook(() => useScrollLock(true))

    a.unmount()
    expect(document.body.style.overflow).toBe('hidden')

    b.unmount()
    expect(document.body.style.overflow).toBe('auto')
  })
})
