import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { resetPassword, verifyStudentEmail, verifyStudentName, sendPasswordResetEmail } from '../services'
import { RateLimitService } from '../services/rateLimitService'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator'
import { FiUser, FiLock, FiMail, FiArrowLeft, FiArrowRight, FiCheckCircle, FiSmile, FiSend, FiShield } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const { lang, t } = useLanguage()
  const prefersReduced = useReducedMotion()
  const isArabic = lang === 'ar'
  const navigate = useNavigate()

  const [mode, setMode] = useState('wizard') // 'wizard' | 'email'
  const [step, setStep] = useState(1)
  const [studentId, setStudentId] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [directEmail, setDirectEmail] = useState('')
  const [studentName, setStudentName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigateTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const handleDirectEmailReset = async (e) => {
    e.preventDefault()
    setError('')
    if (!directEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(directEmail)) {
      setError(t('signup.error.email'))
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(directEmail.trim())
      setLoading(false)
      setEmailSent(true)
      toast.success(isArabic ? 'تم إرسال رابط إعادة التعيين لبريدك' : 'Reset email sent successfully')
    } catch (_err) {
      setLoading(false)
      setError(t('forgotPassword.error'))
    }
  }

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
    // Anti-enumeration: preserve existing flow (proceed identically)
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
    } catch (_err) {
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
    } catch (_err) {
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
    } catch (_err) {
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
      <AuthLogo
        title={t('forgotPassword.title')}
        subtitle={t('forgotPassword.subtitle')}
        isArabic={isArabic}
      />

      {/* Recovery Mode Selector */}
      {!success && !emailSent && (
        <div className="flex rounded-xl bg-slate-100/80 dark:bg-white/5 p-1 mb-5 border border-slate-200/60 dark:border-white/10">
          <button
            type="button"
            onClick={() => { setMode('wizard'); setError('') }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'wizard'
                ? 'bg-white dark:bg-white/15 text-royal-600 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-ink'
            }`}
          >
            {isArabic ? 'التحقق الأكاديمي المباشر' : 'Academic Verification'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('email'); setError('') }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              mode === 'email'
                ? 'bg-white dark:bg-white/15 text-royal-600 dark:text-cyan-300 shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-ink'
            }`}
          >
            {isArabic ? 'رابط الاستعادة للبريد' : 'Email Reset Link'}
          </button>
        </div>
      )}

      {/* 4-Step Progress Indicator (Wizard mode) */}
      {!success && !emailSent && mode === 'wizard' && (
        <div role="group" className="flex items-center justify-center gap-2 mb-6" aria-label={`Step ${step} of 4`}>
          {[
            { s: 1, label: isArabic ? 'الرقم الجامعي' : 'ID' },
            { s: 2, label: isArabic ? 'البريد' : 'Email' },
            { s: 3, label: isArabic ? 'الاسم' : 'Name' },
            { s: 4, label: isArabic ? 'كلمة المرور' : 'Password' },
          ].map(({ s, label }) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-8 bg-royal-500 dark:bg-cyan-400'
                    : step > s
                    ? 'w-5 bg-emerald-500/80 dark:bg-emerald-400/80'
                    : 'w-4 bg-slate-200 dark:bg-white/10'
                }`}
                title={label}
              />
              {step === s && (
                <span className="text-[11px] font-bold text-royal-600 dark:text-cyan-400 ms-1 hidden sm:inline">
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <AuthAlert type="error" message={error} show={!success && !emailSent && !!error} />

      {/* Email Reset Link Sent State */}
      {emailSent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-royal-500/25">
            <FiMail size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink mb-1.5">{isArabic ? 'تم إرسال رابط الاستعادة' : 'Reset Link Sent'}</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 max-w-sm mx-auto leading-relaxed">
              {isArabic
                ? 'تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى مراجعة بريدك الوارد.'
                : 'Instructions to reset your password have been sent to your email address.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-spatial text-xs sm:text-sm font-semibold transition shadow-sm"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </motion.div>
      ) : mode === 'email' ? (
        /* Direct Email Reset Form */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-white/70 mb-3">
            {isArabic ? 'أدخل بريدك الإلكتروني المسجل لإرسال رابط إعادة تعيين كلمة المرور' : 'Enter your registered email to receive a password reset link'}
          </p>
          <form onSubmit={handleDirectEmailReset} className="space-y-4">
            <div>
              <label htmlFor="fp-direct-email" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider">
                {t('forgotPassword.enterEmail')}
              </label>
              <SpatialInput
                id="fp-direct-email"
                icon={FiMail}
                type="email"
                required
                value={directEmail}
                onChange={(e) => setDirectEmail(e.target.value)}
                placeholder="example@university.edu"
                isArabic={isArabic}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <AuthSubmitButton
              loading={loading}
              loadingText={t('forgotPassword.verifying')}
              buttonText={isArabic ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
              isArabic={isArabic}
              delay={0.2}
            />
          </form>
        </motion.div>
      ) : (
        /* Wizard Multi-Step Recovery */

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
            animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <FiCheckCircle size={36} aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">{t('forgotPassword.success')}</h3>
            <p className="text-slate-500 dark:text-white/60 text-sm max-w-xs mx-auto">
              {t('forgotPassword.successDesc')}
            </p>
          </motion.div>
        ) : (
          <motion.div key={`step-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <p className="text-center text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/80 mb-5">
              {stepTitle()}
            </p>

            {step === 1 && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="fp-id" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider">
                    {t('forgotPassword.enterUniversityId')}
                  </label>
                  <SpatialInput
                    id="fp-id"
                    icon={FiUser}
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder={t('forgotPassword.enterUniversityId')}
                    isArabic={isArabic}
                    autoComplete="username"
                    disabled={loading}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'auth-form-alert' : undefined}
                  />
                </div>
                <AuthSubmitButton
                  loading={loading}
                  loadingText={t('forgotPassword.verifying')}
                  buttonText={t('forgotPassword.next')}
                  isArabic={isArabic}
                  delay={0.2}
                />
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label htmlFor="fp-email" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider">
                    {t('forgotPassword.enterEmail')}
                  </label>
                  <SpatialInput
                    id="fp-email"
                    icon={FiMail}
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder={t('forgotPassword.enterEmail')}
                    isArabic={isArabic}
                    autoComplete="email"
                    disabled={loading}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'auth-form-alert' : undefined}
                  />
                </div>
                <AuthSubmitButton
                  loading={loading}
                  loadingText={t('forgotPassword.verifying')}
                  buttonText={t('forgotPassword.verify')}
                  isArabic={isArabic}
                  delay={0.2}
                />
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  className="w-full text-center text-xs text-slate-500 dark:text-white/50 hover:text-royal-600 dark:hover:text-cyan-300 transition-colors py-1"
                >
                  {t('forgotPassword.changeStudentId')}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleVerifyName} className="space-y-4">
                <div>
                  <label htmlFor="fp-name" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider">
                    {t('forgotPassword.enterName')}
                  </label>
                  <SpatialInput
                    id="fp-name"
                    icon={FiSmile}
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder={t('forgotPassword.enterName')}
                    isArabic={isArabic}
                    autoComplete="name"
                    disabled={loading}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'auth-form-alert' : undefined}
                  />
                </div>
                <AuthSubmitButton
                  loading={loading}
                  loadingText={t('forgotPassword.verifying')}
                  buttonText={t('forgotPassword.verify')}
                  isArabic={isArabic}
                  delay={0.2}
                />
                <button
                  type="button"
                  onClick={() => {
                    setStep(2)
                    setError('')
                  }}
                  className="w-full text-center text-xs text-slate-500 dark:text-white/50 hover:text-royal-600 dark:hover:text-cyan-300 transition-colors py-1"
                >
                  {t('inline.forgot-password.back')}
                </button>
              </form>
            )}

            {step === 4 && (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-white/70 mb-2">
                  {t('forgotPassword.hello')}{' '}
                  <span className="font-bold text-royal-600 dark:text-cyan-400">{studentName}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="fp-new" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider">
                      {t('forgotPassword.newPassword')}
                    </label>
                    <SpatialInput
                      id="fp-new"
                      icon={FiLock}
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      isArabic={isArabic}
                      autoComplete="new-password"
                      disabled={loading}
                      showToggle
                      onToggle={() => setShowNew((v) => !v)}
                      showPassword={showNew}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? 'auth-form-alert' : undefined}
                    />
                  </div>

                  <div>
                    <label htmlFor="fp-confirm" className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider">
                      {t('signup.confirmPassword')}
                    </label>
                    <SpatialInput
                      id="fp-confirm"
                      icon={FiLock}
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      isArabic={isArabic}
                      autoComplete="new-password"
                      disabled={loading}
                      showToggle
                      onToggle={() => setShowConfirm((v) => !v)}
                      showPassword={showConfirm}
                      aria-invalid={error ? 'true' : undefined}
                      aria-describedby={error ? 'auth-form-alert' : undefined}
                    />
                  </div>
                </div>

                {/* Real-time match / mismatch indicator */}
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 ms-1 font-medium">
                    {t('forgotPassword.passwordsDoNotMatch')}
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 ms-1 font-semibold">
                    <FiCheckCircle size={14} />
                    <span>{isArabic ? 'كلمتا المرور متطابقتان تماماً' : 'Passwords match successfully'}</span>
                  </div>
                )}

                {/* Segmented Password Strength Visualizer */}
                <AnimatePresence>
                  <PasswordStrengthIndicator password={newPassword} isArabic={isArabic} />
                </AnimatePresence>

                <AuthSubmitButton
                  loading={loading}
                  loadingText={t('forgotPassword.changing')}
                  buttonText={t('forgotPassword.reset')}
                  isArabic={isArabic}
                  delay={0.2}
                />
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Return to Login */}
      <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 dark:text-white/60 hover:text-royal-600 dark:hover:text-cyan-300 transition-colors"
        >
          {isArabic ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
          <span>{t('forgotPassword.backToLogin')}</span>
        </Link>
      </div>
    </AuthLayout>
  )
}