import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'

const ThemeContext = createContext()
const THEMES = ['light', 'dark', 'amoled']

const THEME_COLORS = {
 light: '#f0f4f8',
 dark: '#0f172a',
 amoled: '#000000',
}

function readStoredTheme() {
 try {
  const s = sessionStorage.getItem('al_azher_theme')
  if (s && THEMES.includes(s)) return s
 } catch (_e) { /* storage unavailable */ }
 return null
}

export function ThemeProvider({ children }) {
 // A stored theme means the user manually chose it (we only persist manual choices).
 const manualRef = useRef(readStoredTheme() !== null)
 const [theme, setTheme] = useState(() => {
  const stored = readStoredTheme()
  if (stored) return stored
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
   return 'dark'
  }
  return 'light'
 })

 useEffect(() => {
  const root = document.documentElement
  root.classList.remove('dark')
  root.removeAttribute('data-theme')

  if (theme === 'dark') {
   root.classList.add('dark')
  } else if (theme === 'amoled') {
   root.classList.add('dark')
   root.setAttribute('data-theme', 'amoled')
  }

  // Sync browser chrome + form controls with the active theme.
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
  const color = THEME_COLORS[theme] || THEME_COLORS.light
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color))

  // Persist ONLY manual choices so the OS-preference listener keeps working.
  if (manualRef.current) {
   try { sessionStorage.setItem('al_azher_theme', theme) } catch (_e) { /* ignore */ }
  }
 }, [theme])

 // Follow OS theme changes unless the user picked a theme manually.
 useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e) => {
   if (!manualRef.current) setTheme(e.matches ? 'dark' : 'light')
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
 }, [])

 const toggle = useCallback(() => {
  manualRef.current = true
  setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])
 }, [])

 const dark = theme === 'dark' || theme === 'amoled'

 const value = useMemo(() => ({ theme, dark, toggle }), [theme, dark, toggle])

 return (
  <ThemeContext.Provider value={value}>
   {children}
  </ThemeContext.Provider>
 )
}

export const useTheme = () => useContext(ThemeContext)
