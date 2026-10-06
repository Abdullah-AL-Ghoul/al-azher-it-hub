// Track A (index.html) — to fully eliminate the RTL flash for en users, the
// synchronous lang/dir bootstrap lives in /public/boot.js (loaded in <head>
// before first paint; the CSP whitelists only external scripts). The client
// path below also sets lang/dir synchronously in useState so the flash is
// minimized even without it.
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import ar from '../i18n/ar.json'

const dictionaries = new Map([['ar', ar]])

const loaders = {
  en: () => import('../i18n/en.json').then(m => m.default)
}

function loadLanguage(l) {
  if (dictionaries.has(l)) return Promise.resolve(dictionaries.get(l))
  const loader = loaders[l]
  if (!loader) return Promise.resolve(null)
  return loader().then(d => {
    dictionaries.set(l, d)
    return d
  })
}

function resolveKey(dict, key) {
  if (!dict) return undefined
  const keys = key.split('.')
  let value = dict
  for (const k of keys) {
    if (value == null || typeof value !== 'object') return undefined
    value = value[k]
  }
  return value
}

function escapeRegex(k) {
  return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function interpolate(str, params) {
  if (!params) return str
  return Object.entries(params).reduce((result, [k, v]) => {
    const safe = String(v ?? '')
    const g = escapeRegex(k)
    return result
      .replace(new RegExp(`\\{\\{\\s*${g}\\s*\\}\\}`, 'g'), () => safe)
      .replace(new RegExp(`\\{\\s*${g}\\s*\\}`, 'g'), () => safe)
  }, str)
}

// Follow the visitor's browser language when nothing is stored yet: an
// explicit in-session toggle wins, otherwise the first browser preference
// that is ar or en decides (Arabic is the fallback for everything else).
function getBrowserLang() {
  if (typeof navigator === 'undefined') return 'ar'
  try {
    const code = String(navigator.language || '').toLowerCase()
    if (code.startsWith('en')) return 'en'
    if (code.startsWith('ar')) return 'ar'
  } catch (e) { /* ignore */ }
  return 'ar'
}

function resolveInitialLang() {
  let l = getBrowserLang()
  if (typeof sessionStorage !== 'undefined') {
    try {
      l = sessionStorage.getItem('al_azher_lang') || l
    } catch (e) { /* ignore */ }
  }
  if (typeof document !== 'undefined') {
    try {
      document.documentElement.lang = l
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    } catch (e) { /* ignore */ }
  }
  return l
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(resolveInitialLang)
  const [dict, setDict] = useState(() => dictionaries.get(resolveInitialLang()) || ar)

  const applyDocumentLang = useCallback((l) => {
    if (typeof document === 'undefined') return
    try {
      document.documentElement.lang = l
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    } catch (e) { /* ignore */ }
  }, [])

  useEffect(() => {
    applyDocumentLang(lang)
    let cancelled = false
    try {
      sessionStorage.setItem('al_azher_lang', lang)
    } catch (e) { /* ignore */ }
    if (dictionaries.has(lang)) {
      setDict(dictionaries.get(lang))
      return
    }
    loadLanguage(lang).then(d => {
      if (!cancelled && d) setDict(d)
    })
    return () => { cancelled = true }
  }, [lang, applyDocumentLang])

  const t = useCallback((key, params) => {
    const value = resolveKey(dict, key)
    if (value === undefined || value == null) {
      // Missing keys surface as the dotted path; warn in dev so drift between
      // the dictionaries and the inline-string era is caught early.
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(`[i18n] missing key: ${key}`)
      }
      return key
    }
    if (typeof value !== 'string') return value
    return interpolate(value, params)
  }, [dict])

  const toggleLang = useCallback(() => setLang(l => l === 'ar' ? 'en' : 'ar'), [])

  const value = useMemo(() => ({ lang, toggleLang, t }), [lang, toggleLang, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
