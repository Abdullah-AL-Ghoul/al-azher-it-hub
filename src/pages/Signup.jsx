import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiHash, FiLock, FiCheckCircle, FiBookOpen, FiMail, FiShield, FiRefreshCw, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import AuthSuccessAnimation from '../components/auth/AuthSuccessAnimation'
import SocialAuth from '../components/auth/SocialAuth'

function PasswordStrength({ password, isArabic }) {
  const { t } = useLanguage()
  const criteria = [
    { test: (p) => p.length >= 8, label: t('inline.signup.at-least-8-characters') || '8 أحرف على الأقل' },
    { test: (p) => /[A-Z]/.test(p), label: t('inline.signup.uppercase-letter-a-z') || 'حرف كبير (A-Z)' },
    { test: (p) => /[0-9]/.test(p), label: t('inline.signup.number-0-9') || 'رقم (0-9)' },
    { test: (p) => /[^A-Za-z0-9]/.test(p), label: t('inline.signup.special-character') || 'رمز خاص (@$!%*#?&)' },
  ]

  let score = 0
  if (password) {
    criteria.forEach((c) => {
      if (c.test(password)) score++
    })
  }

  const levels = [
    { label: t('inline.signup.weak') || 'ضعيفة', color: 'bg-rose-500', textColor: 'text-rose-500' },
    { label: t('inline.signup.fair') || 'متوسطة', color: 'bg-amber-500', textColor: 'text-amber-500' },
    { label: t('inline.signup.good') || 'جيدة', color: 'bg-yellow-400', textColor: 'text-yellow-400' },
    { label: t('inline.signup.strong') || 'قوية', color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    { label: t('inline.signup.very-strong') || 'ممتازة', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
  ]

  if (!password) return null

  const level = levels[Math.min(score, levels.length - 1)] || levels[0]

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 mt-2 space-y-2.5"
    >
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-white/70">
          <FiShield size={14} className={level.textColor} />
          {isArabic ? 'قوة كلمة المرور:' : 'Password strength:'}
        </span>
        <span className={`${level.textColor} font-bold`}>{level.label}</span>
      </div>

      {/* Segmented Strength Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`rounded-full transition-all duration-300 ${
              score > step ? level.color : 'bg-slate-200 dark:bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((c, i) => {
          const passed = c.test(password)
          return (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                passed ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-white/40'
              }`}
            >
              <FiCheckCircle
                size={12}
                className={passed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-white/20'}
              />
              <span>{c.label}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

const POPULAR_MAJORS = [
  { ar: 'هندسة البرمجيات', en: 'Software Engineering' },
  { ar: 'علوم الحاسوب', en: 'Computer Science' },
  { ar: 'نظم المعلومات الحاسوبية', en: 'Information Systems' },
  { ar: 'الوسائط وتطوير الويب', en: 'Multimedia & Web' },
]

export default function Signup() {
  const { lang, t } = useLanguage()
  const { signup, user, resendConfirmation } = useAuth()
  const navigate = useNavigate()
  const isArabic = lang === 'ar'

  const [form, setForm] = useState({
    name: '',
    studentId: '',
    email: '',
    major: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const navigateTimer = useRef(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  useEffect(() => {
    if (user && !showSuccess) navigate('/home', { replace: true })
  }, [user, showSuccess, navigate])

  if (user && !showSuccess) return null

  const handleResend = async () => {
    if (cooldown > 0 || resending || !form.email) return
    setResending(true)
    try {
      await resendConfirmation(form.email)
      toast.success(isArabic ? 'تم إعادة إرسال رابط التفعيل إلى بريدك' : 'Verification link resent to your email')
      setCooldown(60)
    } catch (_e) {
      toast.error(isArabic ? 'فشل إعادة الإرسال، يرجى المحاولة لاحقاً' : 'Failed to resend verification link')
    } finally {
      setResending(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.studentId.trim()) {
      setError(t('inline.signup.enter-your-full-name'))
      return
    }
    const normalizedId = form.studentId.trim()
    if (normalizedId.length < 3) {
      setError(t('inline.signup.university-id-is-too'))
      return
    }
    if (form.password !== form.confirmPassword) {
      setError(t('forgotPassword.passwordsDoNotMatch'))
      requestAnimationFrame(() => document.getElementById('signup-confirm-password')?.focus())
      return
    }
    if (form.password.length < 8) {
      setError(t('forgotPassword.passwordMin8'))
      return
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t('signup.error.email'))
      return
    }

    setLoading(true)
    const result = await signup(form.name, form.studentId, form.password, form.major, form.email)
    setLoading(false)

    if (result.ok) {
      setShowSuccess(true)
      if (result.needsConfirmation) {
        setNeedsConfirmation(true)
      } else {
        sessionStorage.setItem('al_azher_just_auth', '1')
        navigateTimer.current = setTimeout(() => navigate('/home'), 1200)
      }
    } else if (result.error === 'STUDENT_ID_EXISTS') {
      setError(t('signup.error.exists'))
    } else if (result.error === 'EMAIL_RATE_LIMIT') {
      setError(t('signup.error.rateLimit'))
    } else if (result.error === 'EMAIL_EXISTS') {
      setError(t('inline.signup.this-email-is-already'))
    } else if (result.error === 'PASSWORD_TOO_SHORT') {
      setError(t('forgotPassword.passwordMin8'))
    } else if (result.error === 'REGISTER_FAILED') {
      setError(t('inline.signup.an-error-occurred-while'))
    } else {
      setError(t('signup.error.generic'))
    }
  }

  return (
    <AuthLayout isArabic={isArabic} onBack={() => navigate('/')}>
      <AuthLogo
        title={t('signup.title')}
        subtitle={t('signup.subtitle')}
        isArabic={isArabic}
      />

      <AuthAlert
        type="success"
        message={needsConfirmation ? t('signup.checkEmail') : t('inline.signup.account-created-successfully')}
        show={showSuccess && !needsConfirmation}
      />
      <AuthAlert type="error" message={error} show={!showSuccess && !!error} />

      {needsConfirmation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-4 relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-royal-500 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-royal-500/25">
            <FiMail size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink mb-1.5">{isArabic ? 'تأكيد الحساب الجامعي' : 'Verify Your Email'}</h2>
            <p className="text-sm text-slate-600 dark:text-white/70 max-w-sm mx-auto leading-relaxed">
              {isArabic ? (
                <>
                  تم إرسال رابط التفعيل إلى بريدك: <br />
                  <span className="font-bold text-royal-600 dark:text-cyan-400 font-mono text-xs sm:text-sm">{form.email}</span>
                  <br />
                  يرجى فتح بريدك (وفحص مجلد Spam إن لزم) والنقر على الرابط لتفعيل حسابك.
                </>
              ) : (
                <>
                  A verification link was sent to your email: <br />
                  <span className="font-bold text-royal-600 dark:text-cyan-400 font-mono text-xs sm:text-sm">{form.email}</span>
                  <br />
                  Please check your inbox (and spam folder) to activate your account.
                </>
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-royal-500/10 hover:bg-royal-500/20 text-royal-600 dark:text-cyan-400 text-xs sm:text-sm font-bold border border-royal-500/20 transition-all disabled:opacity-50"
            >
              <FiRefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              <span>
                {cooldown > 0
                  ? isArabic ? `إعادة الإرسال بعد (${cooldown}ث)` : `Resend in (${cooldown}s)`
                  : isArabic ? 'إعادة إرسال الرابط' : 'Resend Verification Link'}
              </span>
            </button>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-spatial text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              {t('signup.login')}
            </Link>
          </div>
        </motion.div>
      ) : !showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="relative z-10"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Full Name & University ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {isArabic ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <SpatialInput
                  id="signup-name"
                  icon={FiUser}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter full name'}
                  disabled={loading}
                  isArabic={isArabic}
                  autoComplete="name"
                  required
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? 'auth-form-alert' : undefined}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-studentId"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {isArabic ? 'الرقم الجامعي' : 'University ID'}
                </label>
                <SpatialInput
                  id="signup-studentId"
                  icon={FiHash}
                  type="text"
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                  placeholder={isArabic ? 'أدخل رقمك الجامعي' : 'Enter university ID'}
                  disabled={loading}
                  isArabic={isArabic}
                  autoComplete="username"
                  required
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? 'auth-form-alert' : undefined}
                />
              </div>
            </div>

            {/* Row 2: Email & Major */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <SpatialInput
                  id="signup-email"
                  icon={FiMail}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="example@university.edu"
                  disabled={loading}
                  isArabic={isArabic}
                  autoComplete="email"
                  required
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? 'auth-form-alert' : undefined}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-major"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {isArabic ? 'التخصص الأكاديمي' : 'Major / Specialization'}
                </label>
                <SpatialInput
                  id="signup-major"
                  icon={FiBookOpen}
                  type="text"
                  value={form.major}
                  onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))}
                  placeholder={isArabic ? 'مثال: هندسة البرمجيات' : 'e.g. Software Engineering'}
                  disabled={loading}
                  isArabic={isArabic}
                  autoComplete="organization-title"
                />
                {/* Popular major suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2 ms-0.5">
                  {POPULAR_MAJORS.map((m, idx) => {
                    const label = isArabic ? m.ar : m.en
                    const selected = form.major === label
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, major: label }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          selected
                            ? 'bg-royal-500/20 text-royal-600 dark:text-cyan-300 border border-royal-500/30'
                            : 'bg-slate-100/70 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-ink hover:bg-slate-200/70 dark:hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Row 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {t('signup.password')}
                </label>
                <SpatialInput
                  id="signup-password"
                  icon={FiLock}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  disabled={loading}
                  isArabic={isArabic}
                  showToggle
                  onToggle={() => setShowPassword(!showPassword)}
                  showPassword={showPassword}
                  autoComplete="new-password"
                  required
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? 'auth-form-alert' : undefined}
                />
              </div>

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5 ms-1 uppercase tracking-wider"
                >
                  {t('signup.confirmPassword')}
                </label>
                <SpatialInput
                  id="signup-confirm-password"
                  icon={FiLock}
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  disabled={loading}
                  isArabic={isArabic}
                  showToggle
                  onToggle={() => setShowConfirm(!showConfirm)}
                  showPassword={showConfirm}
                  autoComplete="new-password"
                  required
                  aria-invalid={
                    (form.confirmPassword && form.password !== form.confirmPassword) || error ? 'true' : undefined
                  }
                  aria-describedby={error ? 'auth-form-alert' : undefined}
                />
              </div>
            </div>

            {/* Real-time match / mismatch message */}
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-rose-500 dark:text-rose-400 ms-1 font-medium">
                {t('forgotPassword.passwordsDoNotMatch')}
              </p>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 ms-1 font-semibold">
                <FiCheckCircle size={14} />
                <span>{isArabic ? 'كلمتا المرور متطابقتان تماماً' : 'Passwords match successfully'}</span>
              </div>
            )}

            {/* Segmented Password Strength Visualizer */}
            <AnimatePresence>
              <PasswordStrength password={form.password} isArabic={isArabic} />
            </AnimatePresence>

            {/* Submit Action */}
            <AuthSubmitButton
              loading={loading}
              loadingText={t('signup.signingUp')}
              buttonText={t('signup.signup')}
              isArabic={isArabic}
              delay={0.3}
            />
          </form>

          {/* Social OAuth Alternative */}
          <SocialAuth isArabic={isArabic} disabled={loading} />

          {/* Switch to Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-6 text-center"
          >
            <p className="text-slate-500 dark:text-white/50 text-sm">
              {t('signup.hasAccount')}{' '}
              <Link
                to="/login"
                className="text-royal-600 dark:text-cyan-400 hover:text-royal-700 dark:hover:text-cyan-300 font-semibold transition-colors relative group"
              >
                {t('signup.login')}
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
