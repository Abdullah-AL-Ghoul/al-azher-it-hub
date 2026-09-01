import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { resetPassword, verifyStudentEmail, verifyStudentName } from '../services'
import { RateLimitService } from '../services/rateLimitService'
import SpatialInput from '../components/spatial/SpatialInput'
import SiteLogo from '../components/shared/SiteLogo'
import AuthLayout from '../components/auth/AuthLayout'
import { FiUser, FiLock, FiMail, FiArrowLeft, FiCheckCircle, FiLoader, FiSmile } from 'react-icons/fi'

export default function ForgotPassword() {
 const { lang, t } = useLanguage()
 const prefersReduced = useReducedMotion()
 const isArabic = lang === 'ar'
 const navigate = useNavigate()
 const [step, setStep] = useState(1)
 const [studentId, setStudentId] = useState('')
 const [studentEmail, setStudentEmail] = useState('')
 const [studentName, setStudentName] = useState('')
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
   return
  }
  // Anti-enumeration: do NOT reveal whether the student ID exists. The flow
  // proceeds identically for known and unknown IDs; only the email/name
  // verification steps (server-throttled) can reject, and those responses
  // are generic. See docs/AUDIT_REPORT.md H5.
  setStep(2)
 }

 const handleVerifyEmail = async (e) => {
  e.preventDefault()
  setError('')
  if (!studentEmail.trim()) {
   setError(t('forgotPassword.enterEmail'))
   return
  }
  const rl = RateLimitService.checkStudentRateLimit(studentId.trim(), 'forgot-password-email')
  if (!rl.allowed) {
   setError(t('forgotPassword.tooManyAttempts'))
   return
  }
  setLoading(true)
  try {
   const ok = await verifyStudentEmail(studentId.trim(), studentEmail.trim())
   setLoading(false)
   if (ok) {
    setStep(3)
   } else {
    setError(t('forgotPassword.emailMismatch'))
   }
  } catch (err) {
   setLoading(false)
   setError(t('forgotPassword.error'))
  }
 }

 const handleVerifyName = async (e) => {
  e.preventDefault()
  setError('')
  if (!studentName.trim()) {
   setError(t('forgotPassword.enterName'))
   return
  }
  const rl = RateLimitService.checkStudentRateLimit(studentId.trim(), 'forgot-password-name')
  if (!rl.allowed) {
   setError(t('forgotPassword.tooManyAttempts'))
   return
  }
  setLoading(true)
  try {
   const ok = await verifyStudentName(studentId.trim(), studentName.trim())
   setLoading(false)
   if (ok) {
    setStep(4)
   } else {
    setError(t('forgotPassword.nameMismatch'))
   }
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
   return
  }
  setLoading(true)
  try {
   const result = await resetPassword(studentId, newPassword, { email: studentEmail })
   setLoading(false)
   if (result.ok) {
    setSuccess(true)
    navigateTimer.current = setTimeout(() => navigate('/login'), 2200)
   } else {
    setError(t('forgotPassword.error'))
   }
  } catch (err) {
   setLoading(false)
   setError(t('forgotPassword.error'))
  }
 }

 const stepTitle = () => {
  if (step === 1) return t('forgotPassword.enterUniversityId')
  if (step === 2) return t('forgotPassword.enterRegisteredEmail')
  if (step === 3) return t('forgotPassword.enterName')
  return t('forgotPassword.newPassword')
 }

 return (
  <AuthLayout isArabic={isArabic} onBack={() => navigate('/login')}>
   <motion.div
    initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
    animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
    transition={prefersReduced ? {} : { duration: 0.5 }}
   >
    <motion.div
     initial={{ opacity: 0, y: -20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ delay: 0.2 }}
     className="text-center mb-8"
    >
      <div className="mx-auto mb-4">
       <SiteLogo size="md" />
      </div>
      <h1 className="text-2xl font-bold mb-1">
       {t('forgotPassword.title')}
      </h1>
      <p className="text-slate-500 dark:text-white/50 text-sm">
       {t('forgotPassword.subtitle')}
      </p>
      <div className="flex items-center justify-center gap-2 mt-3">
       {[1, 2, 3, 4].map(s => (
        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'w-8 bg-royal-500 dark:bg-cyan-400' : 'w-4 bg-black/10 dark:bg-white/10'}`} />
       ))}
      </div>
     </motion.div>

     <AnimatePresence mode="wait">
      {success ? (
       <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
         <FiCheckCircle aria-hidden="true" className="text-emerald-400" size={32} />
        </div>
        <p className="text-emerald-400 font-semibold mb-2">{t('forgotPassword.success')}</p>
        <p className="text-slate-500 dark:text-white/50 text-sm">{t('forgotPassword.successDesc')}</p>
       </motion.div>
      ) : (
       <motion.div key={`step-${step}`}>
        <p className="text-center text-sm text-slate-600 dark:text-white/70 mb-5 font-medium">{stepTitle()}</p>
        <AnimatePresence>
         {error && (
          <motion.div key="error" id="auth-form-alert" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center backdrop-blur-sm" role="alert">
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
           aria-invalid={error ? 'true' : undefined}
           aria-describedby={error ? 'auth-form-alert' : undefined}
           isArabic={isArabic}
           autoComplete="username"
          />
          <motion.button type="submit" whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }} whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }} disabled={loading} className="w-full btn-spatial px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
           {loading ? (<><FiLoader size={18} className="animate-spin" />{t('forgotPassword.verifying')}</>) : (t('forgotPassword.next'))}
          </motion.button>
         </form>
        )}

        {step === 2 && (
         <form onSubmit={handleVerifyEmail} className="space-y-5">
          <SpatialInput
           icon={FiMail}
           type="email"
           required
           value={studentEmail}
           onChange={e => setStudentEmail(e.target.value)}
           placeholder={t('forgotPassword.enterEmail')}
           aria-label={t('forgotPassword.enterEmail')}
           aria-invalid={error ? 'true' : undefined}
           aria-describedby={error ? 'auth-form-alert' : undefined}
           isArabic={isArabic}
           autoComplete="email"
          />
          <motion.button type="submit" whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }} whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }} disabled={loading} className="w-full btn-spatial px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
           {loading ? (<><FiLoader size={18} className="animate-spin" />{t('forgotPassword.verifying')}</>) : (t('forgotPassword.verify'))}
          </motion.button>
          <button type="button" onClick={() => { setStep(1); setError('') }} className="w-full text-center text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 transition-colors">
           {t('forgotPassword.changeStudentId')}
          </button>
         </form>
        )}

        {step === 3 && (
         <form onSubmit={handleVerifyName} className="space-y-5">
          <SpatialInput
           icon={FiSmile}
           type="text"
           required
           value={studentName}
           onChange={e => setStudentName(e.target.value)}
           placeholder={t('forgotPassword.enterName')}
           aria-label={t('forgotPassword.enterName')}
           aria-invalid={error ? 'true' : undefined}
           aria-describedby={error ? 'auth-form-alert' : undefined}
           isArabic={isArabic}
           autoComplete="name"
          />
          <motion.button type="submit" whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }} whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }} disabled={loading} className="w-full btn-spatial px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
           {loading ? (<><FiLoader size={18} className="animate-spin" />{t('forgotPassword.verifying')}</>) : (t('forgotPassword.verify'))}
          </motion.button>
          <button type="button" onClick={() => { setStep(2); setError('') }} className="w-full text-center text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 transition-colors">
           {isArabic ? 'رجوع' : 'Back'}
          </button>
         </form>
        )}

        {step === 4 && (
         <form onSubmit={handleReset} className="space-y-5">
          <p className="text-center text-sm text-slate-600 dark:text-white/60">
           {t('forgotPassword.hello')} <span className="font-semibold text-navy-900 dark:text-white">{studentName}</span>
          </p>
          <SpatialInput icon={FiLock} type={showNew ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••" aria-label={t('forgotPassword.newPassword')}
           aria-invalid={error ? 'true' : undefined}
           aria-describedby={error ? 'auth-form-alert' : undefined} isArabic={isArabic} autoComplete="new-password" disabled={loading} showToggle onToggle={() => setShowNew(v => !v)} showPassword={showNew} />
          <SpatialInput icon={FiLock} type={showConfirm ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••" aria-label={t('signup.confirmPassword')} isArabic={isArabic} autoComplete="new-password" disabled={loading} showToggle onToggle={() => setShowConfirm(v => !v)} showPassword={showConfirm} />
          <motion.button type="submit" whileHover={prefersReduced ? {} : { scale: loading ? 1 : 1.02 }} whileTap={prefersReduced ? {} : { scale: loading ? 1 : 0.98 }} disabled={loading} className="w-full btn-spatial px-6 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
           {loading ? (<><FiLoader size={18} className="animate-spin" />{t('forgotPassword.changing')}</>) : (t('forgotPassword.reset'))}
          </motion.button>
         </form>
        )}
       </motion.div>
      )}
     </AnimatePresence>

     <div className="mt-6 pt-4 border-t border-line text-center">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 transition-colors">
       <FiArrowLeft size={16} className={isArabic ? 'rotate-180' : ''} />
       {t('forgotPassword.backToLogin')}
      </Link>
     </div>
    </motion.div>
  </AuthLayout>
 )
}