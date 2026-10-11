import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { resetPassword, getAuthSession, updateAuthUserPassword, resolveStudentIdByEmail } from '../services'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import { FiLock, FiArrowLeft, FiArrowRight, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'

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
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  // Detect the recovery session from the URL hash (supabase-js handles type=recovery).
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true
    let mounted = true
    async function check() {
      try {
        const session = await getAuthSession()
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
    return () => {
      mounted = false
    }
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
      const session = await getAuthSession()
      if (!session?.user) {
        setLoading(false)
        setInvalidLink(true)
        return
      }
      await updateAuthUserPassword(newPassword)

      // Sync the legacy PBKDF2 hash so the custom login fallback stays in sync.
      let studentId = session.user.user_metadata?.studentId
      if (!studentId && session.user.email) {
        studentId = await resolveStudentIdByEmail(session.user.email)
      }
      if (studentId) {
        await resetPassword(studentId, newPassword, { email: '' }).catch(() => {})
      }

      setLoading(false)
      setSuccess(true)
      navigateTimer.current = setTimeout(() => navigate('/login'), 2200)
    } catch (_err) {
      setLoading(false)
      setError(t('forgotPassword.error'))
    }
  }

  return (
    <AuthLayout isArabic={isArabic} onBack={() => navigate('/login')}>
      <AuthLogo
        title={t('resetPassword.title')}
        subtitle={t('resetPassword.subtitle')}
        isArabic={isArabic}
      />

      <AuthAlert type="error" message={error} show={!success && !invalidLink && !!error} />

      <AnimatePresence mode="wait">
        {invalidLink ? (
          <motion.div
            key="invalid"
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
            animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 bg-rose-500/15 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
              <FiAlertTriangle aria-hidden="true" size={34} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">{t('resetPassword.invalidTitle')}</h3>
            <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm max-w-xs mx-auto mb-5">
              {t('resetPassword.invalidDesc')}
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-royal-600 dark:bg-cyan-500 hover:bg-royal-700 dark:hover:bg-cyan-400 text-white transition-all shadow-md"
            >
              <span>{t('resetPassword.requestAgain')}</span>
            </Link>
          </motion.div>
        ) : success ? (
          <motion.div
            key="success"
            initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
            animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <FiCheckCircle aria-hidden="true" size={36} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">{t('resetPassword.success')}</h3>
            <p className="text-slate-500 dark:text-white/60 text-xs sm:text-sm max-w-xs mx-auto">
              {t('resetPassword.successDesc')}
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="rp-new"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {t('resetPassword.newPassword')}
                </label>
                <SpatialInput
                  id="rp-new"
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
                <label
                  htmlFor="rp-confirm"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {t('signup.confirmPassword')}
                </label>
                <SpatialInput
                  id="rp-confirm"
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

            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-rose-500 dark:text-rose-400 ms-1 font-medium">
                {t('forgotPassword.passwordsDoNotMatch')}
              </p>
            )}

            <AuthSubmitButton
              loading={loading}
              loadingText={t('forgotPassword.changing')}
              buttonText={t('resetPassword.reset')}
              isArabic={isArabic}
              delay={0.25}
            />
          </motion.form>
        )}
      </AnimatePresence>

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