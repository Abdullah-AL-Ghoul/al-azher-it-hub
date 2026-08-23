import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(isActive) {
  const containerRef = useRef(null)
  const previousRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    previousRef.current = document.activeElement

    const container = containerRef.current
    if (!container) return

    const timer = setTimeout(() => {
      const focusable = container.querySelectorAll(FOCUSABLE)
      if (focusable.length > 0) {
        focusable[0].focus()
      }
    }, 50)

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      const focusable = container.querySelectorAll(FOCUSABLE)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      if (previousRef.current && previousRef.current.focus) {
        previousRef.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}
