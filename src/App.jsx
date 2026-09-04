import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useLanguage } from './context/LanguageContext'
import { useAuth } from './context/AuthContext'
import { pageTransition } from './utils/motionTokens'
import { useSeo } from './hooks/useSeo'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'
import ProtectedRoute from './components/ProtectedRoute'
import WelcomeModal from './components/WelcomeModal'
import ErrorBoundary from './components/ErrorBoundary'
import SpatialBackground from './components/spatial/SpatialBackground'
import GlobalSearchTrigger from './components/GlobalSearchTrigger'

const Chatbot = lazy(() => import('./components/Chatbot'))
const GlobalSearch = lazy(() => import('./components/GlobalSearch'))

const WelcomeGate = lazy(() => import('./pages/WelcomeGate'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Home = lazy(() => import('./pages/Home'))
const Lectures = lazy(() => import('./pages/Lectures'))
const LectureDetail = lazy(() => import('./pages/LectureDetail'))
const Sources = lazy(() => import('./pages/Sources'))
const StudyPlan = lazy(() => import('./pages/StudyPlan'))
const Additions = lazy(() => import('./pages/Additions'))
const Contact = lazy(() => import('./pages/Contact'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const CourseRoadmap = lazy(() => import('./pages/CourseRoadmap'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
 const { t } = useLanguage()
 return (
  <div className="min-h-screen flex items-center justify-center bg-spatial-page">
   <div className="text-center">
    <div className="w-12 h-12 border-4 border-royal-500/20 border-t-royal-500 rounded-full animate-spin mx-auto mb-4" />
    <p className="text-slate-500 dark:text-white/50 text-sm">{t('inline.app.loading')}</p>
   </div>
  </div>
 )
}

function PageTransition({ children }) {
 const prefersReduced = useReducedMotion()
 if (prefersReduced) return <>{children}</>
 return (
  <motion.div
   initial={pageTransition.initial}
   animate={pageTransition.animate}
   exit={pageTransition.exit}
   transition={pageTransition.transition}
  >
   {children}
  </motion.div>
 )
}

function AppContent() {
 const { lang } = useLanguage()
 const { user } = useAuth()
 const location = useLocation()
 const [showSuccessRedirect, setShowSuccessRedirect] = useState(false)
 const [chatbotReady, setChatbotReady] = useState(false)
 const [searchActive, setSearchActive] = useState(false)
 const [searchAutoOpen, setSearchAutoOpen] = useState(false)

 // GlobalSearch mounts lazily on first activation; the Ctrl/Cmd+K shortcut
 // opens it pre-focused (autoOpen), the navbar chip opens it plain.
 const activateSearch = useCallback((autoOpen = false) => {
  setSearchAutoOpen(autoOpen)
  setSearchActive(true)
 }, [])

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

 useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
 }, [location.pathname])

 const hideLayout = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/reset-password'

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
   {!hideLayout && <Navbar />}
   <main id="main-content" className="flex-1" tabIndex={-1}>
     <ErrorBoundary lang={lang}>
      <Suspense fallback={<PageLoader />}>
       <AnimatePresence initial={false} mode="sync">
        <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><WelcomeGate /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />

        <Route path="/home" element={
         <ProtectedRoute><PageTransition><Home /></PageTransition></ProtectedRoute>
        } />
        <Route path="/lectures" element={
         <ProtectedRoute><PageTransition><Lectures /></PageTransition></ProtectedRoute>
        } />
        <Route path="/lecture/:id" element={
         <ProtectedRoute><PageTransition><LectureDetail /></PageTransition></ProtectedRoute>
        } />
        <Route path="/sources" element={
         <ProtectedRoute><PageTransition><Sources /></PageTransition></ProtectedRoute>
        } />
        <Route path="/study-plan" element={
         <ProtectedRoute><PageTransition><StudyPlan /></PageTransition></ProtectedRoute>
        } />
        <Route path="/additions" element={
         <ProtectedRoute><PageTransition><Additions /></PageTransition></ProtectedRoute>
        } />
        <Route path="/contact" element={
         <ProtectedRoute><PageTransition><Contact /></PageTransition></ProtectedRoute>
        } />
        <Route path="/roadmap" element={
         <ProtectedRoute><PageTransition><CourseRoadmap /></PageTransition></ProtectedRoute>
        } />
        <Route path="/profile" element={
         <ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>
        } />
        <Route path="/admin" element={
         <ProtectedRoute adminOnly><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>
        } />

        <Route path="/videos" element={<Navigate to="/lectures" replace />} />
        <Route path="/books" element={<Navigate to="/home" replace />} />
        <Route path="/courses" element={<Navigate to="/home" replace />} />
        <Route path="/schedule" element={<Navigate to="/home" replace />} />
        <Route path="/university" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
       </Routes>
      </AnimatePresence>
     </Suspense>
    </ErrorBoundary>
    </main>
    {!hideLayout && <Footer />}
    {!hideLayout && <BackToTop />}
     {!hideLayout && <WelcomeModal />}
           {searchActive ? (
      <Suspense fallback={null}>
       <GlobalSearch autoOpen={searchAutoOpen} />
      </Suspense>
     ) : (
      !hideLayout && <GlobalSearchTrigger onActivate={() => activateSearch(true)} />
     )}
{!hideLayout && chatbotReady && (
     <Suspense fallback={null}>
      <Chatbot />
     </Suspense>
    )}
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
