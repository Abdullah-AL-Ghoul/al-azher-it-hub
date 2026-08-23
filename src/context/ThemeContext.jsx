import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const ThemeContext = createContext()
const THEMES = ['light', 'dark', 'amoled']

export function ThemeProvider({ children }) {
 const [theme, setTheme] = useState(() => {
  const stored = sessionStorage.getItem('al_azher_theme')
  if (stored && THEMES.includes(stored)) return stored
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
   return 'dark'
  }
  return 'light'
 })

 useEffect(() => {
  const root = document.documentElement
  // Remove all theme classes/attributes first
  root.classList.remove('dark')
  root.removeAttribute('data-theme')
  
  // Apply theme: dark class for Tailwind dark: variants, data-theme for CSS vars
  if (theme === 'dark') {
   root.classList.add('dark')
  } else if (theme === 'amoled') {
   root.classList.add('dark')
   root.setAttribute('data-theme', 'amoled')
  }
  // light: neither class nor attribute needed
  
  // Sync browser chrome + form controls with the active theme
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f0f4f8' : theme === 'amoled' ? '#000000' : '#0f172a')
  
  sessionStorage.setItem('al_azher_theme', theme)
 }, [theme])

 // Listen for system preference changes
 useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (e) => {
   // Only auto-switch if user hasn't manually set a theme
   if (!sessionStorage.getItem('al_azher_theme')) {
    setTheme(e.matches ? 'dark' : 'light')
   }
  }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
 }, [])

 const toggle = useCallback(() => {
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
