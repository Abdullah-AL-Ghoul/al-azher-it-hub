import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { FiDownload, FiX, FiSmartphone, FiShare, FiCheck } from 'react-icons/fi'

export default function PwaInstallPrompt() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIos(isIosDevice)

    // Check if user previously dismissed prompt in this session
    const isDismissed = sessionStorage.getItem('al_azher_pwa_dismissed') === 'true'

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!isDismissed) {
        // Show after a short pleasant delay so it doesn't pop up immediately on first second
        const timer = setTimeout(() => setShowPrompt(true), 3500)
        return () => clearTimeout(timer)
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // For iOS, if not dismissed and not standalone, show prompt after delay
    if (isIosDevice && !isDismissed && !isStandalone) {
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosInstructions(true)
      return
    }

    if (!deferredPrompt) {
      setShowIosInstructions(true)
      return
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } catch {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('al_azher_pwa_dismissed', 'true')
  }

  if (isInstalled || !showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-white dark:bg-slate-900 border border-royal-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-royal-500/20 backdrop-blur-xl"
        role="dialog"
        aria-label={isArabic ? 'تثبيت تطبيق المنصة' : 'Install App'}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-royal-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-royal-500/25">
            <FiSmartphone size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-ink truncate">
                {isArabic ? 'تثبيت AL-Azher IT Hub' : 'Install AL-Azher IT Hub'}
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-white/60 mt-1 leading-relaxed">
              {isArabic
                ? 'ثبّت المنصة كتطبيق سريع على هاتفك أو حاسوبك للوصول الفوري والمذاكرة دون إنترنت.'
                : 'Install as a lightweight app on your device for instant offline study.'}
            </p>

            {/* iOS manual instructions modal view */}
            {showIosInstructions ? (
              <div className="mt-3 p-3 rounded-2xl bg-royal-500/10 text-royal-700 dark:text-cyan-300 text-xs space-y-1.5 border border-royal-500/20">
                <div className="font-bold flex items-center gap-1.5">
                  <FiShare size={14} />
                  <span>{isArabic ? 'طريقة التثبيت على آيفون (Safari):' : 'iOS Install Steps:'}</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>{isArabic ? 'انقر على زر المشاركة (Share) أسفل المتصفح.' : 'Tap the Share icon at the bottom of Safari.'}</li>
                  <li>{isArabic ? 'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).' : 'Select "Add to Home Screen".'}</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setShowIosInstructions(false)}
                  className="mt-2 text-[11px] font-bold text-royal-600 dark:text-cyan-400 underline"
                >
                  {isArabic ? 'حسناً، فهمت' : 'Got it'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3 pt-1">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 py-2 px-3 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-royal-600/30 transition"
                >
                  <FiDownload size={14} />
                  <span>{isArabic ? 'تثبيت التطبيق الآن' : 'Install App'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-2 px-3 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 text-xs font-semibold transition"
                >
                  {isArabic ? 'لاحقاً' : 'Later'}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
