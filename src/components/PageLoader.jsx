import { useLanguage } from '../context/LanguageContext'

// Route-level Suspense fallback shown while a lazy page chunk loads.
export default function PageLoader() {
 const { t } = useLanguage()
 return (
  <div className="min-h-screen flex items-center justify-center bg-canvas">
   <div className="text-center">
    <div className="w-12 h-12 border-4 border-royal-500/20 border-t-royal-500 rounded-full animate-spin mx-auto mb-4" />
    <p className="text-slate-500 dark:text-white/50 text-sm">{t('inline.app.loading')}</p>
   </div>
  </div>
 )
}
