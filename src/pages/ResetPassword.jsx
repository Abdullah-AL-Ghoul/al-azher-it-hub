import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { getSupabase } from '../services/supabase'
import { resetPassword } from '../services'
import SpatialInput from '../components/spatial/SpatialInput'
import SiteLogo from '../components/shared/SiteLogo'
import { FiLock, FiArrowLeft, FiCheckCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi'

export default function ResetPassword() {
 const { lang, t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 const navigate = useNavigate()

 const [newPassword, setNewPassword] = useState('')
 const [confirmPassword, setConfirmPassword] = useState('')
 const [showNew, setShowNew] = useState(false)
 const [showConfirm, setShowConfirm] = useState(false)
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)
 const [success, setSuccess] = useState(false)
 const [invalidLink, setInvalidLink] = useState(false)
 const navigateTimer = useRef(null)
 const checkedRef = useRef(false)

 
 useEffect(() => {
  return () => { if (navigateTimer.current) clearTimeout(navigateTimer.current) }
 }, [])

 // Detect the recovery session from the URL hash (supabase-js handles type=recovery).
 useEffect(() => {
  if (checkedRef.current) return
  checkedRef.current = true
  let mounted = true
  async function check() {
   try {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    const isRecovery = session?.user && session.user.aud === 'authenticated'
    // A recovery link carries a session; if none exists the link is invalid/expired.
    if (!isRecovery) {
     if (mounted) setInvalidLink(true)
    }
   } catch (_e) {
    if (mounted) setInvalidLink(true)
   }
  }
  check()
  return () => { mounted = false }
 }, [])

 const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  if (newPassword.length < 8) {
   setError(t('forgotPassword.passwordMin8'))
   return
  }
  if (newPassword !== confirmPassword) {
   setError(t('forgotPassword.passwordsDoNotMatch'))
   return
  }
  setLoading(true)
  try {
   const supabase = getSupabase()
   const { data: { session } } = await supabase.auth.getSession()
   if (!session?.user) {
    setLoading(false)
    setInvalidLink(true)
    return
   }
   const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
   if (updateErr) throw updateErr

   // Sync the legacy PBKDF2 hash so the custom login fallback stays in sync.
   // Resolve the studentId even when the recovery session lacks metadata:
   // the verified auth email is the canonical link to the profile row.
   let studentId = session.user.user_metadata?.studentId
   if (!studentId && session.user.email) {
    const { data: profile } = await supabase.rpc('get_profile_by_email', {
      p_email: session.user.email,
    }).catch(() => ({ data: null }))
    studentId = profile?.studentId
   }
   if (studentId) {
    await resetPassword(studentId, newPassword, { email: '' }).catch(() => {})
   }

   setLoading(false)
   setSuccess(true)
   navigateTimer.current = setTimeout(() => navigate('/login'), 2200)
  } catch (err) {
   setLoading(false)
   setError(t('forgotPassword.error'))
  }
 }

 return (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-spatial-full">
   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent" />
   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent" />

   <motion.div
    initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
    animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
    transition={prefersReduced ? {} : { duration: 0.5 }}
    className="relative z-10 w-full max-w-md mx-4"
   >
    <div className="glass rounded-3xl p-8 md:p-10">
     <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center mb-8"
     >
      <div className="mx-auto mb-4">
       <SiteLogo size="md" />
      </div>
      <h1 className="text-2xl font-bold text-ink mb-1">
       {t('resetPassword.title')}
      </h1>
      <p className="text-slate-500 dark:text-white/50 text-sm">
       {t('resetPassword.subtitle')}
      </p>
     </motion.div>

     <AnimatePresence mode="wait">
      {invalidLink ? (
       <motion.div key="invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <div className="w-16 h-16 bg-rose-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
         <FiAlertTriangle aria-hidden="true" className="text-rose-400" size={32} />
        </div>
        <p className="text-rose-400 font-semibold mb-2">{t('resetPassword.invalidTitle')}</p>
        <p className="text-slate-500 dark:text-white/50 text-sm">{t('resetPassword.invalidDesc')}</p>
        <Link to="/forgot-password" className="mt-6 inline-flex items-center gap-2 text-sm text-royal-500 dark:text-cyan-400 hover:text-royal-600 dark:hover:text-cyan-300 transition-colors">
         <FiArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
         {t('resetPassword.requestAgain')}
        </Link>
       </motion.div>
      ) : success ? (
       <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
         <FiCheckCircle aria-hidden="true" className="text-emerald-400" size={32} />
        </div>
        <p className="text-emerald-400 font-semibold mb-2">{t('resetPassword.success')}</p>
        <p className="text-slate-500 dark:text-white/50 text-sm">{t('resetPassword.successDesc')}</p>
       </motion.div>
      ) : (
       <motion.form key="form" onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence>
         {error && (
          <motion.div
           key="error"
           id="rp-form-error"
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center backdrop-blur-sm"
           role="alert"
          >
           {error}
          </motion.div>
         )}
        </AnimatePresence>

        <div>
         <label htmlFor="rp-new" className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ms-1 uppercase tracking-wider">
          {t('resetPassword.newPassword')}
         </label>
         <SpatialInput
          id="rp-new"
          icon={FiLock}
          type={showNew ? 'text' : 'password'}
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="••••••"
          aria-label={t('resetPassword.newPassword')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'rp-form-error' : undefined}
          isArabic={isArabic}
          autoComplete="new-password"
          disabled={loading}
          showToggle
          onToggle={() => setShowNew(v => !v)}
          showPassword={showNew}
         />
        </div>

        <div>
         <label htmlFor="rp-confirm" className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ms-1 uppercase tracking-wider">
          {t('signup.confirmPassword')}
         </label>
         <SpatialInput
          id="rp-confirm"
          icon={FiLock}
          type={showConfirm ? 'text' : 'password'}
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••"
          aria-label={t('signup.confirmPassword')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'rp-form-error' : undefined}
          isArabic={isArabic}
          autoComplete="new-password"
          disabled={loading}
          showToggle
          onToggle={() => setShowConfirm(v => !v)}
          showPassword={showConfirm}
         />
        </div>

        <motion.button
         type="submit"
         whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }}
         whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }}
         disabled={loading}
         className="w-full btn-spatial px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
         {loading ? (
          <>
           <FiLoader size={18} className="animate-spin" />
           {t('forgotPassword.changing')}
          </>
         ) : (
          t('resetPassword.reset')
         )}
        </motion.button>
       </motion.form>
      )}
     </AnimatePresence>

     <div className="mt-6 pt-4 border-t border-white/10 text-center">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 transition-colors">
       <FiArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
       {t('forgotPassword.backToLogin')}
      </Link>
     </div>
    </div>
   </motion.div>
  </div>
 )
}