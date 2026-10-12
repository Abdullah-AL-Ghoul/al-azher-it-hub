import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { updateLastVisit, addStudentLog } from '../services'
import { FiUser, FiLock, FiMail, FiRefreshCw, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import AuthSuccessAnimation from '../components/auth/AuthSuccessAnimation'
import SocialAuth from '../components/auth/SocialAuth'

export default function Login() {
  const { lang, t } = useLanguage()
  const { login, user, resendConfirmation } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isArabic = lang === 'ar'

  const rememberedId = (() => {
    try {
      return localStorage.getItem('al_azher_remembered_id') || ''
    } catch {
      return ''
    }
  })()

  const [form, setForm] = useState({ studentId: rememberedId, password: '' })
  const [rememberId, setRememberId] = useState(() => Boolean(rememberedId))
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const navigateTimer = useRef(null)

  const [lockoutSeconds, setLockoutSeconds] = useState(() => {
    try {
      const until = Number(sessionStorage.getItem('login_lockout_until') || 0)
      const rem = Math.ceil((until - Date.now()) / 1000)
      return rem > 0 ? rem : 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          try {
            sessionStorage.removeItem('login_lockout_until')
          } catch (_e) {}
          setError('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutSeconds])

  useEffect(() => {
    if (lockoutSeconds > 0) {
      setError(
        isArabic
          ? `تم قفل تسجيل الدخول مؤقتاً لحماية الحساب. يرجى الانتظار ${lockoutSeconds} ثانية`
          : `Login locked temporarily. Please wait ${lockoutSeconds}s`
      )
    }
  }, [lockoutSeconds, isArabic])

  useEffect(() => {
    try {
      if (sessionStorage.getItem('al_azher_session_expired') === '1') {
        sessionStorage.removeItem('al_azher_session_expired')
        setError(
          isArabic
            ? 'تم تسجيل الخروج تلقائياً بسبب عدم النشاط لفترة طويلة لحماية حسابك.'
            : 'Session expired due to inactivity. Please log in again.'
        )
      }
    } catch (_e) {}
  }, [isArabic])

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  useEffect(() => {
    if (user && !showSuccess) {
      const target = location.state?.from || (user.role === 'admin' ? '/admin' : '/home')
      navigate(target, { replace: true })
    }
  }, [user, showSuccess, navigate, location.state])

  if (user && !showSuccess) return null

  const handleResendConfirmation = async () => {
    const emailToTarget = unconfirmedEmail || (form.studentId.includes('@') ? form.studentId.trim() : '')
    if (!emailToTarget) {
      toast.error(isArabic ? 'يرجى كتابة بريدك الإلكتروني في خانة تسجيل الدخول' : 'Please provide your email address')
      return
    }
    setResendingEmail(true)
    try {
      await resendConfirmation(emailToTarget)
      toast.success(isArabic ? 'تم إرسال رابط التفعيل بنجاح! تفقد بريدك الوارد' : 'Verification email sent! Check your inbox')
    } catch (_e) {
      toast.error(isArabic ? 'فشل إعادة الإرسال، يرجى المحاولة لاحقاً' : 'Failed to resend confirmation email')
    } finally {
      setResendingEmail(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (lockoutSeconds > 0) return
    setError('')
    setUnconfirmedEmail('')
    if (!form.studentId.trim() || !form.password) {
      setError(t('inline.login.enter-your-id-and'))
      return
    }
    setLoading(true)

    const result = await login(form.studentId, form.password)
    setLoading(false)

    if (result.ok) {
      setShowSuccess(true)
      try {
        sessionStorage.removeItem('login_consecutive_failures')
        sessionStorage.removeItem('login_lockout_until')
        if (rememberId && form.studentId.trim()) {
          localStorage.setItem('al_azher_remembered_id', form.studentId.trim())
        } else {
          localStorage.removeItem('al_azher_remembered_id')
        }
      } catch (_e) {}
      sessionStorage.setItem('al_azher_just_auth', '1')

      const logVisit = async () => {
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json')
          const ipData = await ipRes.json()
          try {
            updateLastVisit(ipData.ip, navigator.userAgent)
          } catch (_e) {}
          try {
            addStudentLog({ type: 'LOGIN', detail: '', device: navigator.userAgent })
          } catch (_e) {}
        } catch (_e) {}
      }
      setTimeout(logVisit, 0)
      const targetDestination = location.state?.from || (result.user.role === 'admin' ? '/admin' : '/home')
      navigateTimer.current = setTimeout(() => {
        navigate(targetDestination)
      }, 900)
    } else {
      if (result.error === 'EMAIL_NOT_CONFIRMED') {
        const mail = form.studentId.includes('@') ? form.studentId.trim() : ''
        setUnconfirmedEmail(mail)
        setError(t('login.emailNotConfirmed'))
      } else if (result.error === 'TOO_MANY_ATTEMPTS' && result.retryAfter) {
        const secs = Number(result.retryAfter) || 30
        try {
          sessionStorage.setItem('login_lockout_until', String(Date.now() + secs * 1000))
        } catch (_e) {}
        setLockoutSeconds(secs)
      } else {
        let failures = 1
        try {
          failures = (Number(sessionStorage.getItem('login_consecutive_failures')) || 0) + 1
          sessionStorage.setItem('login_consecutive_failures', String(failures))
        } catch (_e) {}

        if (failures >= 5) {
          const LOCK_TIME = 30
          try {
            sessionStorage.setItem('login_lockout_until', String(Date.now() + LOCK_TIME * 1000))
            sessionStorage.setItem('login_consecutive_failures', '0')
          } catch (_e) {}
          setLockoutSeconds(LOCK_TIME)
        } else if (failures >= 3) {
          const rem = 5 - failures
          setError(
            isArabic
              ? `${t('login.error')} (تبقى ${rem} محاولات قبل الإيقاف المؤقت)`
              : `${t('login.error')} (${rem} attempts remaining before temporary lockout)`
          )
        } else {
          setError(t('login.error'))
        }
      }
    }
  }

  return (
    <AuthLayout isArabic={isArabic} onBack={() => navigate('/')}>
      <AuthLogo
        title={t('login.title')}
        subtitle={t('login.subtitle')}
        isArabic={isArabic}
      />

      <AuthAlert type="success" message={t('inline.login.login-successful')} show={showSuccess} />
      <AuthAlert type="error" message={error} show={!showSuccess && !!error} />

      {/* Resend confirmation button if email is unconfirmed */}
      {error && !showSuccess && (error === t('login.emailNotConfirmed') || unconfirmedEmail) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-center"
        >
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendingEmail}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-royal-500/10 hover:bg-royal-500/20 text-royal-600 dark:text-cyan-400 text-xs font-bold border border-royal-500/20 transition-all cursor-pointer"
          >
            <FiRefreshCw size={13} className={resendingEmail ? 'animate-spin' : ''} />
            <span>{isArabic ? 'إعادة إرسال رابط التفعيل إلى بريدك' : 'Resend confirmation link to your email'}</span>
          </button>
        </motion.div>
      )}

      {!showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative z-10"
        >
          {/* Welcome back indicator for returning students */}
          {rememberedId && form.studentId === rememberedId && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-3.5">
              <FiCheck size={14} className="shrink-0" />
              <span>{isArabic ? 'مرحباً بعودتك! تم استرجاع رقمك المحفوظ.' : 'Welcome back! Your saved ID was restored.'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student ID / Email Field */}
            <div>
              <label
                htmlFor="login-studentId"
                className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
              >
                {isArabic ? 'الرقم الجامعي أو البريد الإلكتروني' : 'University ID or Email'}
              </label>
              <SpatialInput
                id="login-studentId"
                icon={FiUser}
                type="text"
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                placeholder={isArabic ? 'أدخل رقمك الجامعي أو بريدك' : 'Enter university ID or email'}
                disabled={loading || lockoutSeconds > 0}
                isArabic={isArabic}
                autoComplete="username"
                required
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'auth-form-alert' : undefined}
              />
            </div>

            {/* Password Field with Forgot Password in Header */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ms-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 uppercase tracking-wider"
                >
                  {isArabic ? 'كلمة المرور' : 'Password'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-royal-600 dark:text-cyan-400 hover:text-royal-700 dark:hover:text-cyan-300 transition-colors"
                >
                  {t('inline.login.forgot-password')}
                </Link>
              </div>
              <SpatialInput
                id="login-password"
                icon={FiLock}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                disabled={loading || lockoutSeconds > 0}
                isArabic={isArabic}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                autoComplete="current-password"
                required
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'auth-form-alert' : undefined}
              />
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-0.5 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-white/70 hover:text-ink">
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-royal-600 focus:ring-royal-400/50 cursor-pointer"
                />
                <span>{isArabic ? 'تذكر رقمي في هذا المتصفح' : 'Remember ID on this device'}</span>
              </label>
            </div>

            {/* Submit Action with Progressive Countdown */}
            <AuthSubmitButton
              loading={loading}
              disabled={lockoutSeconds > 0}
              loadingText={t('login.loggingIn')}
              buttonText={
                lockoutSeconds > 0
                  ? isArabic
                    ? `يرجى الانتظار (${lockoutSeconds} ث)`
                    : `Please wait (${lockoutSeconds}s)`
                  : t('login.login')
              }
              isArabic={isArabic}
              delay={0.3}
            />
          </form>

          {/* Social OAuth Alternative */}
          <SocialAuth isArabic={isArabic} disabled={loading || lockoutSeconds > 0} />

          {/* Create Account Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-slate-500 dark:text-white/50 text-sm">
              {t('login.noAccount')}{' '}
              <Link
                to="/signup"
                className="text-royal-600 dark:text-cyan-400 hover:text-royal-700 dark:hover:text-cyan-300 font-semibold transition-colors relative group"
              >
                {t('login.createAccount')}
                <span className="absolute -bottom-0.5 start-0 w-0 h-0.5 bg-royal-400 dark:bg-cyan-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </motion.div>
        </motion.div>
      )}

      <AuthSuccessAnimation show={showSuccess} redirectingText={t('login.redirecting')} />
    </AuthLayout>
  )
}
