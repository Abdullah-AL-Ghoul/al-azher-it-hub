import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useLanguage } from './context/LanguageContext'
import { useAuth } from './context/AuthContext'
import { recordToday } from './utils/achievements'
import { lazyWithRecovery } from './utils/lazyRecovery'
import { useAppShortcuts } from './hooks/useAppShortcuts'
import { useSeo } from './hooks/useSeo'
import { APP_ROUTES, isBarePathname } from './router/routes'
import ProtectedRoute from './router/ProtectedRoute'
import PageLoader from './components/PageLoader'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import WelcomeModal from './components/WelcomeModal'
import ErrorBoundary from './components/ErrorBoundary'
import SpatialBackground from './components/spatial/SpatialBackground'
import GlobalSearchTrigger from './components/GlobalSearchTrigger'

const Chatbot = lazyWithRecovery(() => import('./components/Chatbot'))
const GlobalSearch = lazyWithRecovery(() => import('./components/GlobalSearch'))
// Guide loads only when `?` is pressed — keeps the entry chunk lean.
const ShortcutsGuide = lazyWithRecovery(() => import('./components/ShortcutsGuide'))

// Directional route slide: pages enter from the locale's reading start
// (left edge in RTL, right edge in LTR) and exit toward the opposite side.
// Eased with the standard snappy-out curve; exit is shorter so the incoming
// page never feels queued behind the outgoing one.
function PageTransition({ children }) {
 const prefersReduced = useReducedMotion()
 const { lang } = useLanguage()
 if (prefersReduced) return <>{children}</>
 const enterX = lang === 'ar' ? -24 : 24
 return (
  <motion.div
   initial={{ opacity: 0, x: enterX }}
   animate={{ opacity: 1, x: 0 }}
   exit={{ opacity: 0, x: -enterX * 0.5, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } }}
   transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
   {children}
  </motion.div>
 )
}

function AppRoutes() {
 const location = useLocation()
 return (
  // mode="wait": with "sync" both pages briefly coexist in normal flow, so the
  // document height doubles and the scrollbar jumps on every navigation.
  <AnimatePresence initial={false} mode="wait">
   <Routes location={location} key={location.pathname}>
    {APP_ROUTES.map((route) => {
     if (route.redirect) {
      return <Route key={route.path} path={route.path} element={<Navigate to={route.redirect} replace />} />
     }
     const { Component } = route
     let element = (
      <PageTransition>
       <Component />
      </PageTransition>
     )
     if (route.protected || route.adminOnly) {
      element = <ProtectedRoute adminOnly={route.adminOnly}>{element}</ProtectedRoute>
     }
     return <Route key={route.path} path={route.path} element={element} />
    })}
   </Routes>
  </AnimatePresence>
 )
}

function AppContent() {
 const { lang } = useLanguage()
 const { user } = useAuth()
 const location = useLocation()
 const navigationType = useNavigationType()
 const [showSuccessRedirect, setShowSuccessRedirect] = useState(false)
 const [chatbotReady, setChatbotReady] = useState(false)
 const [searchActive, setSearchActive] = useState(false)
 const [searchAutoOpen, setSearchAutoOpen] = useState(false)
 const [guideOpen, setGuideOpen] = useState(false)
 const scrollPositions = useRef(new Map())
 const prevPathRef = useRef(location.pathname)

 // GlobalSearch mounts lazily on first activation; the Ctrl/Cmd+K shortcut
 // opens it pre-focused (autoOpen), the navbar chip opens it plain.
 const activateSearch = useCallback((autoOpen = false) => {
  setSearchAutoOpen(autoOpen)
  setSearchActive(true)
 }, [])

 useAppShortcuts({
  onOpenGuide: () => setGuideOpen(true),
  onOpenSearch: () => activateSearch(true),
  guideOpen,
 })

 useEffect(() => {
  const onKey = (e) => {
   if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') {
    e.preventDefault()
    activateSearch(true)
   }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
 }, [activateSearch])

 useSeo(location.pathname, lang)

 // Daily streak: mark today active once per boot for signed-in students.
 useEffect(() => {
  if (user && user.role !== 'admin') recordToday(user.studentId)
 }, [user])

 // Scroll handling: new navigations go to top; back/forward restores the
 // position saved for that path. The restore runs twice (paint + after the
 // exiting page's transition) because with mode="wait" the target content
 // mounts ~150ms later, and lazy pages render even later.
 useEffect(() => {
  scrollPositions.current.set(prevPathRef.current, window.scrollY)
  prevPathRef.current = location.pathname

  const saved = navigationType === 'POP' ? scrollPositions.current.get(location.pathname) : undefined
  if (saved === undefined) {
   window.scrollTo({ top: 0, behavior: 'instant' })
   return
  }
  const restore = () => window.scrollTo({ top: saved || 0, behavior: 'instant' })
  const raf = requestAnimationFrame(restore)
  const t = setTimeout(restore, 350)
  return () => { cancelAnimationFrame(raf); clearTimeout(t) }
 }, [location.pathname, navigationType])

 const hideLayout = isBarePathname(location.pathname)

 // Defer Chatbot (heavy lazy chunk) until browser is idle to avoid blocking main thread / LCP
 useEffect(() => {
  if (hideLayout) return
  const cb = () => setChatbotReady(true)
  if ('requestIdleCallback' in window) {
   const id = window.requestIdleCallback(cb, { timeout: 2500 })
   return () => {
    try { window.cancelIdleCallback(id) } catch (_) { /* ignore */ }
   }
  }
  const t = setTimeout(cb, 1800)
  return () => clearTimeout(t)
 }, [hideLayout])

 useEffect(() => {
  if (user && hideLayout) {
   if (sessionStorage.getItem('al_azher_just_auth')) {
    sessionStorage.removeItem('al_azher_just_auth')
    const t = setTimeout(() => setShowSuccessRedirect(true), 400)
    return () => clearTimeout(t)
   }
   setShowSuccessRedirect(true)
  } else {
   setShowSuccessRedirect(false)
  }
 }, [user, hideLayout])

 if (user && hideLayout && showSuccessRedirect) {
  return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />
 }

  return (
   <ErrorBoundary lang={lang}>
   <div className={`min-h-screen flex flex-col ${lang === 'ar' ? 'font-arabic' : 'font-english'}`}>
    {!hideLayout && <SpatialBackground />}   <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-royal-500 focus:text-white focus:text-sm focus:font-medium focus:shadow-xl"
   >
    {lang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
   </a>
   <div className="spatial-content">
   {!hideLayout && (
    <ErrorBoundary lang={lang}>
     <Navbar />
    </ErrorBoundary>
   )}
   <main id="main-content" className="flex-1" tabIndex={-1}>
     <ErrorBoundary lang={lang}>
      <Suspense fallback={<PageLoader />}>
       <AppRoutes />
      </Suspense>
    </ErrorBoundary>
    </main>
    {!hideLayout && <Footer />}
    {!hideLayout && <BackToTop />}
     {!hideLayout && (
      <ErrorBoundary lang={lang} fallback={null}>
       <WelcomeModal />
      </ErrorBoundary>
     )}
           {searchActive ? (
      <Suspense fallback={null}>
       <ErrorBoundary lang={lang} fallback={null}>
        <GlobalSearch autoOpen={searchAutoOpen} />
       </ErrorBoundary>
      </Suspense>
     ) : (
      user && !hideLayout && <GlobalSearchTrigger onActivate={() => activateSearch(true)} />
     )}
{!hideLayout && chatbotReady && (
     <Suspense fallback={null}>
      <ErrorBoundary lang={lang} fallback={null}>
       <Chatbot />
      </ErrorBoundary>
     </Suspense>
    )}
    <Suspense fallback={null}>
     <ShortcutsGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </Suspense>
    <Toaster
    position="top-center"
    containerStyle={{ top: 72 }}
    toastOptions={{
     duration: 3000,
     role: 'status',
     ariaLive: 'polite',
     style: {
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      borderRadius: '16px',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-default)',
      fontSize: '14px',
     },
     success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
     error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
    }}
    />
    </div>
   </div>
   </ErrorBoundary>
  )
}

export default function App() {
 return <AppContent />
}
