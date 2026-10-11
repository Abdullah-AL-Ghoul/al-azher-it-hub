import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { updateLastVisit, addStudentLog } from '../services'
import { FiUser, FiLock } from 'react-icons/fi'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import AuthSuccessAnimation from '../components/auth/AuthSuccessAnimation'
import SocialAuth from '../components/auth/SocialAuth'

export default function Login() {
 const { lang, t } = useLanguage()
 const { login, user } = useAuth()
 const navigate = useNavigate()
 const isArabic = lang === 'ar'

 const [form, setForm] = useState({ studentId: '', password: '' })
 const [showPassword, setShowPassword] = useState(false)
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)
 const [showSuccess, setShowSuccess] = useState(false)
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
   setLockoutSeconds(prev => {
    if (prev <= 1) {
     clearInterval(interval)
     try { sessionStorage.removeItem('login_lockout_until') } catch (_e) {}
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
   setError(isArabic
    ? `تم قفل تسجيل الدخول مؤقتاً لحماية الحساب. يرجى الانتظار ${lockoutSeconds} ثانية`
    : `Login locked temporarily. Please wait ${lockoutSeconds}s`)
  }
 }, [lockoutSeconds, isArabic])

 useEffect(() => {
  try {
   if (sessionStorage.getItem('al_azher_session_expired') === '1') {
    sessionStorage.removeItem('al_azher_session_expired')
    setError(isArabic
     ? 'تم تسجيل الخروج تلقائياً بسبب عدم النشاط لفترة طويلة لحماية حسابك.'
     : 'Session expired due to inactivity. Please log in again.')
   }
  } catch (_e) {}
 }, [isArabic])

 useEffect(() => {
  return () => { if (navigateTimer.current) clearTimeout(navigateTimer.current) }
 }, [])

 useEffect(() => {
  // Redirect a returning logged-in user away from the login page, but never
  // during the post-login success animation (showSuccess), which must be
  // visible before the delayed navigation below.
  if (user && !showSuccess) {
   navigate(user.role === 'admin' ? '/admin' : '/home', { replace: true })
  }
 }, [user, showSuccess, navigate])

 // Block the form while a user session is being restored/redirected, but let
 // the success screen render once showSuccess is true.
 if (user && !showSuccess) return null

 const handleSubmit = async (e) => {
  e.preventDefault()
  if (lockoutSeconds > 0) return
  setError('')
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
   } catch (_e) {}
   sessionStorage.setItem('al_azher_just_auth', '1')
   // IP logging is telemetry, not part of the login flow — run it after the
   // user has already navigated so it never delays the redirect.
   const logVisit = async () => {
    try {
     const ipRes = await fetch('https://api.ipify.org?format=json')
     const ipData = await ipRes.json()
     try { updateLastVisit(ipData.ip, navigator.userAgent) } catch (e) { /* non-critical */ }
     try { addStudentLog({ type: 'LOGIN', detail: '', device: navigator.userAgent }) } catch (e) { /* non-critical */ }
    } catch (e) { /* ip fetch failed, non-critical */ }
   }
   setTimeout(logVisit, 0)
   navigateTimer.current = setTimeout(() => {
    navigate(result.user.role === 'admin' ? '/admin' : '/home')
   }, 900)
  } else {
   if (result.error === 'EMAIL_NOT_CONFIRMED') {
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
     setError(isArabic
      ? `${t('login.error')} (تبقى ${rem} محاولات قبل الإيقاف المؤقت)`
      : `${t('login.error')} (${rem} attempts remaining before temporary lockout)`)
    } else {
     setError(t('login.error'))
    }
   }
  }
 }

 const formFields = [
  { key: 'studentId', icon: FiUser, type: 'text', labelAr: 'الرقم الجامعي أو البريد', labelEn: 'University ID or Email', placeholderAr: 'أدخل رقمك الجامعي أو البريد', placeholderEn: 'Enter university ID or email', autoComplete: 'username', required: true },
  { key: 'password', icon: FiLock, type: showPassword ? 'text' : 'password', labelAr: 'كلمة المرور', labelEn: 'Password', placeholderAr: '••••••', placeholderEn: '••••••', hasToggle: true, autoComplete: 'current-password', required: true },
 ]

 return (
  <AuthLayout isArabic={isArabic} onBack={() => navigate('/')}>
   <AuthLogo
    title={t('login.title')}
    subtitle={t('login.subtitle')}
    isArabic={isArabic}
   />

   <AuthAlert type="success" message={t('inline.login.login-successful')} show={showSuccess} />
   <AuthAlert type="error" message={error} show={!showSuccess && !!error} />

   {!showSuccess && (
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ delay: 0.3 }}
     className="relative z-10"
    >
     <form onSubmit={handleSubmit} className="space-y-4">
      {formFields.map((field, i) => (
       <motion.div
        key={field.key}
        initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 + i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
       >
         <label htmlFor={`login-${field.key}`} className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ms-1 uppercase tracking-wider">
          {isArabic ? field.labelAr : field.labelEn}
         </label>
         <SpatialInput
          id={`login-${field.key}`}
          icon={field.icon}
         type={field.type}
         value={form[field.key]}
         onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
         placeholder={isArabic ? field.placeholderAr : field.placeholderEn}
         disabled={loading || lockoutSeconds > 0}
         isArabic={isArabic}
         showToggle={field.hasToggle}
         onToggle={() => setShowPassword(!showPassword)}
         showPassword={showPassword}
         autoComplete={field.autoComplete}
         required={field.required}
         aria-invalid={error ? 'true' : undefined}
         aria-describedby={error ? 'auth-form-alert' : undefined}
        />
       </motion.div>
       ))}

       <div className="flex justify-end -mt-1">
        <Link to="/forgot-password" className="text-xs font-medium text-royal-600 dark:text-cyan-400 hover:text-royal-700 dark:hover:text-cyan-300 transition">
         {t('inline.login.forgot-password')}
        </Link>
       </div>

       <AuthSubmitButton
        loading={loading}
        disabled={lockoutSeconds > 0}
        loadingText={t('login.loggingIn')}
        buttonText={lockoutSeconds > 0 ? (isArabic ? `يرجى الانتظار (${lockoutSeconds})` : `Please wait (${lockoutSeconds}s)`) : t('login.login')}
        isArabic={isArabic}
        delay={0.85}
       />
      </form>

     <SocialAuth isArabic={isArabic} disabled={loading || lockoutSeconds > 0} />

     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="mt-6 text-center"
     >
      <p className="text-slate-500 dark:text-white/50 text-sm">
       {t('login.noAccount')}
       {' '}
       <Link to="/signup" className="text-accent hover:text-royal-600 dark:hover:text-cyan-300 font-medium transition-colors relative group">
        {t('login.createAccount')}
         <span className="absolute -bottom-0.5 start-0 w-0 h-0.5 bg-royal-400 group-hover:w-full transition duration-300" />
       </Link>
      </p>
     </motion.div>
    </motion.div>
   )}

   <AuthSuccessAnimation show={showSuccess} redirectingText={t('login.redirecting')} />
  </AuthLayout>
 )
}
