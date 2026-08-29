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
  setError('')
  if (!form.studentId.trim() || !form.password) {
   setError(isArabic ? 'أدخل رقمك الجامعي وكلمة المرور' : 'Enter your ID and password')
   return
  }
   setLoading(true)

   const result = await login(form.studentId, form.password)
  setLoading(false)

  if (result.ok) {
   setShowSuccess(true)
   sessionStorage.setItem('al_azher_just_auth', '1')
   try {
    const ipRes = await fetch('https://api.ipify.org?format=json')
    const ipData = await ipRes.json()
    try { updateLastVisit(ipData.ip, navigator.userAgent) } catch (e) { /* non-critical */ }
    try { addStudentLog({ type: 'LOGIN', detail: '', device: navigator.userAgent }) } catch (e) { /* non-critical */ }
   } catch (e) { /* ip fetch failed, non-critical */ }
   navigateTimer.current = setTimeout(() => {
    navigate(result.user.role === 'admin' ? '/admin' : '/home')
   }, 1400)
  } else {
   if (result.error === 'EMAIL_NOT_CONFIRMED') {
    setError(t('login.emailNotConfirmed'))
   } else if (result.error === 'TOO_MANY_ATTEMPTS' && result.retryAfter) {
    setError(isArabic
     ? `محاولات كثيرة، حاول بعد ${result.retryAfter} ثانية`
     : `Too many attempts. Try again in ${result.retryAfter} seconds`)
   } else {
    setError(t('login.error'))
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

   <AuthAlert type="success" message={isArabic ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!'} show={showSuccess} />
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
         <label htmlFor={`login-${field.key}`} className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ml-1 uppercase tracking-wider">
          {isArabic ? field.labelAr : field.labelEn}
         </label>
         <SpatialInput
          id={`login-${field.key}`}
          icon={field.icon}
         type={field.type}
         value={form[field.key]}
         onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
         placeholder={isArabic ? field.placeholderAr : field.placeholderEn}
         disabled={loading}
         isArabic={isArabic}
         showToggle={field.hasToggle}
         onToggle={() => setShowPassword(!showPassword)}
         showPassword={showPassword}
         autoComplete={field.autoComplete}
         required={field.required}
        />
       </motion.div>
       ))}

       <div className="flex justify-end -mt-1">
        <Link to="/forgot-password" className="text-xs font-medium text-royal-600 dark:text-cyan-400 hover:text-royal-700 dark:hover:text-cyan-300 transition">
         {isArabic ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
        </Link>
       </div>

       <AuthSubmitButton
        loading={loading}
        loadingText={t('login.loggingIn')}
        buttonText={t('login.login')}
        isArabic={isArabic}
        delay={0.85}
       />
      </form>

     <SocialAuth isArabic={isArabic} disabled={loading} />

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
