import { createContext, useContext, useEffect, useRef, useState } from 'react'

// Consumers re-render on `scrolled` only (it flips twice per page at most).
// Continuous values (y / progress) are intentionally NOT context state —
// each consumer owns a small rAF-coalesced scroll listener that writes the
// DOM directly, so a long page scroll never re-renders Navbar/BackToTop.
const ScrollContext = createContext({ scrolled: false })

export function ScrollProvider({ children }) {
 const [scrolled, setScrolled] = useState(false)
 const scrolledRef = useRef(false)
 const rafRef = useRef(null)
 const tickingRef = useRef(false)

 useEffect(() => {
  const handler = () => {
   if (tickingRef.current) return
   tickingRef.current = true

   rafRef.current = requestAnimationFrame(() => {
    const nextScrolled = window.scrollY > 20
    if (nextScrolled !== scrolledRef.current) {
     scrolledRef.current = nextScrolled
     setScrolled(nextScrolled)
    }
    tickingRef.current = false
   })
  }

  window.addEventListener('scroll', handler, { passive: true })
  return () => {
   window.removeEventListener('scroll', handler)
   if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }
 }, [])

 return (
  <ScrollContext.Provider value={{ scrolled }}>
   {children}
  </ScrollContext.Provider>
 )
}

export const useScrollManager = () => useContext(ScrollContext)

// rAF-coalesced scroll callback for direct DOM writes (progress bars, rings).
// `onScroll` receives { y, progress } — keep it stable to avoid re-subscribing.
export function useScrollFrame(onScroll) {
 const cbRef = useRef(onScroll)
 cbRef.current = onScroll

 useEffect(() => {
  let raf = null
  const handle = () => {
   if (raf) return
   raf = requestAnimationFrame(() => {
    raf = null
    const y = window.scrollY
    const doc = document.documentElement.scrollHeight - window.innerHeight
    cbRef.current({ y, progress: doc > 0 ? (y / doc) * 100 : 0 })
   })
  }
  handle()
  window.addEventListener('scroll', handle, { passive: true })
  window.addEventListener('resize', handle)
  return () => {
   if (raf) cancelAnimationFrame(raf)
   window.removeEventListener('scroll', handle)
   window.removeEventListener('resize', handle)
  }
 }, [])
}
