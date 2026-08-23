import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { resetPassword, verifyStudent } from '../services'
import { RateLimitService } from '../services/rateLimitService'
import SpatialInput from '../components/spatial/SpatialInput'
import SiteLogo from '../components/shared/SiteLogo'
import { FiUser, FiLock, FiArrowLeft, FiCheckCircle, FiLoader } from 'react-icons/fi'

export default function ForgotPassword() {
 const { lang, t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [studentId, setStudentId] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
 const [confirmPassword, setConfirmPassword] = useState('')
 const [showNew, setShowNew] = useState(false)
 const [showConfirm, setShowConfirm] = useState(false)
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)
 const [success, setSuccess] = useState(false)
 const navigateTimer = useRef(null)

 useEffect(() => {
  return () => { if (navigateTimer.current) clearTimeout(navigateTimer.current) }
 }, [])

 useEffect(() => {
  document.title = t('forgotPassword.documentTitle')
 }, [isArabic, t])

 const handleVerify = async (e) => {
  e.preventDefault()
  setError('')
  if (!studentId.trim()) {
   setError(t('forgotPassword.enterUniversityId'))
   return
  }
  const rl = RateLimitService.checkStudentRateLimit(studentId.trim(), 'forgot-password-verify')
  if (!rl.allowed) {
   setError(t('forgotPassword.tooManyAttempts'))
   setLoading(false)
   return
  }
   setLoading(true)
   try {
    const result = await verifyStudent(studentId.trim())
    setLoading(false)
    if (!result.exists) {
     setError(t('forgotPassword.verifyNotFoundHint'))
     return
    }
    setStudentName(result.name || '')
    setStudentEmail(result.email || '')
    setStep(3)
   } catch (err) {
    setLoading(false)
    setError(t('forgotPassword.error'))
   }
  }

  const handleReset = async (e) => {
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
  const rl = RateLimitService.checkStudentRateLimit(studentId, 'forgot-password-reset')
  if (!rl.allowed) {
   setError(t('forgotPassword.tooManyAttempts'))
   setLoading(false)
   return
  }
  setLoading(true)
  try {
   const result = await resetPassword(studentId, newPassword, { email: studentEmail })
   setLoading(false)
   if (result.ok) {
    setSuccess(true)
     navigateTimer.current = setTimeout(() => navigate('/login'), 2000)
   } else {
   setError(t('forgotPassword.error'))
   }
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
      <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-1">
       {t('forgotPassword.title')}
      </h1>
      <p className="text-slate-500 dark:text-white/50 text-sm">
       {t('forgotPassword.subtitle')}
      </p>
     </motion.div>

     <AnimatePresence mode="wait">
      {success ? (
       <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
       >
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
         <FiCheckCircle aria-hidden="true" className="text-emerald-400" size={32} />
        </div>
        <p className="text-emerald-400 font-semibold mb-2">
         {t('forgotPassword.success')}
        </p>
        <p className="text-slate-500 dark:text-white/50 text-sm">
         {t('forgotPassword.successDesc')}
        </p>
       </motion.div>
      ) : (
       <motion.div key={`step-${step}`}>
        <AnimatePresence mode="wait">
         {error && (
          <motion.div
           key="error"
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center backdrop-blur-sm"
           role="alert"
          >
           {error}
          </motion.div>
         )}
        </AnimatePresence>

        {step === 1 && (
         <form onSubmit={handleVerify} className="space-y-5">
          <SpatialInput
           icon={FiUser}
           type="text"
           required
           value={studentId}
           onChange={e => setStudentId(e.target.value)}
           placeholder={t('forgotPassword.enterUniversityId')}
           aria-label={t('forgotPassword.enterUniversityId')}
           isArabic={isArabic}
           autoComplete="username"
          />
          <motion.button
           type="submit"
           whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }}
           whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }}
           disabled={loading}
           className="w-full btn-spatial text-white px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
           {loading ? (
            <>
             <FiLoader size={18} className="animate-spin" />
             {t('forgotPassword.verifying')}
            </>
           ) : (
            t('forgotPassword.next')
           )}
          </motion.button>
         </form>
        )}

        {step === 3 && (
         <form onSubmit={handleReset} className="space-y-5">
           <div className="text-center mb-2">
            <p className="text-sm text-slate-600 dark:text-white/60">
             {t('forgotPassword.hello')}, <span className="text-navy-900 dark:text-white font-medium">{studentName}</span>
            </p>
           </div>
          <SpatialInput
           icon={FiLock}
           type={showNew ? 'text' : 'password'}
           required
           value={newPassword}
           onChange={e => setNewPassword(e.target.value)}
           placeholder="••••••"
           aria-label={t('forgotPassword.newPassword')}
           isArabic={isArabic}
           autoComplete="new-password"
           disabled={loading}
           showToggle
           onToggle={() => setShowNew(v=>!v)}
           showPassword={showNew}
          />
          <SpatialInput
           icon={FiLock}
           type={showConfirm ? 'text' : 'password'}
           required
           value={confirmPassword}
           onChange={e => setConfirmPassword(e.target.value)}
           placeholder="••••••"
           aria-label={t('signup.confirmPassword')}
           isArabic={isArabic}
           autoComplete="new-password"
           disabled={loading}
           showToggle
           onToggle={() => setShowConfirm(v=>!v)}
           showPassword={showConfirm}
          />
          <motion.button
           type="submit"
           whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }}
           whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }}
           disabled={loading}
           className="w-full btn-spatial text-white px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
           {loading ? (
            <>
             <FiLoader size={18} className="animate-spin" />
             {t('forgotPassword.changing')}
            </>
           ) : (
            t('forgotPassword.reset')
           )}
          </motion.button>
         </form>
        )}
       </motion.div>
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
