import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

const ScrollContext = createContext({ y: 0, progress: 0, scrolled: false })

export function ScrollProvider({ children }) {
 const [scroll, setScroll] = useState({ y: 0, progress: 0, scrolled: false })
 const lastScrolledRef = useRef(false)
 const lastProgressRef = useRef(0)
 const rafRef = useRef(null)
 const tickingRef = useRef(false)

 useEffect(() => {
  const handler = () => {
   if (tickingRef.current) return
   tickingRef.current = true
   
   rafRef.current = requestAnimationFrame(() => {
    const y = window.scrollY
    const doc = document.documentElement.scrollHeight - window.innerHeight
    const progress = doc > 0 ? (y / doc) * 100 : 0
    const scrolled = y > 20

    const progressChanged = Math.abs(lastProgressRef.current - progress) >= 2
    const scrolledChanged = lastScrolledRef.current !== scrolled

    if (progressChanged || scrolledChanged) {
     lastProgressRef.current = progress
     lastScrolledRef.current = scrolled
     setScroll({ y, progress, scrolled })
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
  <ScrollContext.Provider value={scroll}>
   {children}
  </ScrollContext.Provider>
 )
}

export const useScrollManager = () => useContext(ScrollContext)
