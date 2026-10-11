import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { resetPassword, verifyStudentEmail, verifyStudentName } from '../services'
import { RateLimitService } from '../services/rateLimitService'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import { FiUser, FiLock, FiMail, FiArrowLeft, FiArrowRight, FiCheckCircle, FiSmile } from 'react-icons/fi'

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
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
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

      {/* 4-Step Progress Indicator */}
      {!success && (
        <div role="group" className="flex items-center justify-center gap-2 mb-6" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-8 bg-royal-500 dark:bg-cyan-400'
                  : step > s
                  ? 'w-5 bg-emerald-500/80 dark:bg-emerald-400/80'
                  : 'w-4 bg-slate-200 dark:bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      <AuthAlert type="error" message={error} show={!success && !!error} />

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