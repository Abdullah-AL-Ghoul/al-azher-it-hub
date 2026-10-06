import { useState } from 'react'
import { motion } from 'framer-motion'
import { SiGoogle, SiGithub, SiLinkedin, SiMicrosoft } from 'react-icons/si'
import { getSupabase } from '../../services/supabase'
import { useLanguage } from '../../context/LanguageContext'

const PROVIDERS = [
 { id: 'google', label: 'Google', icon: SiGoogle, color: '#DB4437' },
 { id: 'github', label: 'GitHub', icon: SiGithub, color: '#333333' },
 { id: 'microsoft', label: 'Microsoft', icon: SiMicrosoft, color: '#0078D4' },
 { id: 'linkedin_oidc', label: 'LinkedIn', icon: SiLinkedin, color: '#0A66C2' },
]

export default function SocialAuth({ isArabic, delay = 1.2, disabled = false } ) {
 const { t } = useLanguage()
 const [loading, setLoading] = useState('')
 const [error, setError] = useState('')

const handleClick = async (provider) => {
   if (loading || disabled) return
   setLoading(provider)
   setError('')
   try {
    sessionStorage.removeItem('al_azher_session')
    const redirectTo = `${window.location.origin}/login`
    const { data, error } = await getSupabase().auth.signInWithOAuth({
     provider: provider.id,
     options: { redirectTo },
    })
   if (error) throw error
   if (!data?.url) {
    setError(t('inline.social-auth.could-not-start-sign-in'))
    setLoading('')
    return
   }
   window.location.href = data.url
  } catch (e) {
   console.error('OAuth error:', e)
   setError(e?.message || (t('inline.social-auth.could-not-start-sign-in')))
   setLoading('')
  }
 }

 return (
  <motion.div
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   transition={{ delay, duration: 0.5 }}
   className="mt-6"
  >
   <div className="flex items-center gap-3 mb-4">
    <span className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
    <span className="text-xs text-slate-500 dark:text-white/60 uppercase tracking-wider">
     {t('inline.social-auth.or-continue-with')}
    </span>
    <span className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
   </div>

   {error && (
    <p className="text-center text-xs text-red-400 mb-3">{error}</p>
   )}

   <div className="grid grid-cols-4 gap-3">
    {PROVIDERS.map((p) => {
     const Icon = p.icon
     const isActive = loading === p.id
     return (
      <motion.button
       key={p.id}
       type="button"
       whileHover={!disabled && !loading ? { scale: 1.05, y: -2 } : {}}
       whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
       disabled={disabled || !!loading}
       onClick={() => handleClick(p)}
       title={p.label}
       aria-label={isArabic ? `متابعة عبر ${p.label}` : `Continue with ${p.label}`}
       className="relative flex items-center justify-center h-12 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 hover:border-slate-300 dark:hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
       {isActive ? (
        <span className="w-5 h-5 border-2 border-slate-300 border-t-royal-500 rounded-full animate-spin" />
       ) : (
        <Icon size={20} style={{ color: p.color }} aria-hidden="true" />
       )}
      </motion.button>
     )
    })}
   </div>
  </motion.div>
 )
}