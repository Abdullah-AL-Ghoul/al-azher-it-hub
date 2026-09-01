import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiHash, FiLock, FiCheckCircle, FiBookOpen, FiMail } from 'react-icons/fi'
import SpatialInput from '../components/spatial/SpatialInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthLogo from '../components/auth/AuthLogo'
import AuthAlert from '../components/auth/AuthAlert'
import AuthSubmitButton from '../components/auth/AuthSubmitButton'
import AuthSuccessAnimation from '../components/auth/AuthSuccessAnimation'
import SocialAuth from '../components/auth/SocialAuth'

function PasswordStrength({ password, isArabic }) {
 const criteria = [
  { test: (p) => p.length >= 8, label: isArabic ? '8 أحرف على الأقل' : 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: isArabic ? 'حرف كبير (A-Z)' : 'Uppercase letter (A-Z)' },
  { test: (p) => /[0-9]/.test(p), label: isArabic ? 'رقم (0-9)' : 'Number (0-9)' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: isArabic ? 'رمز خاص (!@#$...)' : 'Special character (!@#$...)' },
 ]

 let score = 0
 if (password) {
  criteria.forEach(c => { if (c.test(password)) score++ })
 }

 const levels = [
  { label: isArabic ? 'ضعيفة' : 'Weak', color: 'bg-red-500', width: '20%', textColor: 'text-red-400' },
  { label: isArabic ? 'متوسطة' : 'Fair', color: 'bg-amber-500', width: '40%', textColor: 'text-amber-400' },
  { label: isArabic ? 'جيدة' : 'Good', color: 'bg-yellow-400', width: '60%', textColor: 'text-yellow-400' },
  { label: isArabic ? 'قوية' : 'Strong', color: 'bg-emerald-500', width: '80%', textColor: 'text-emerald-400' },
  { label: isArabic ? 'قوية جداً' : 'Very Strong', color: 'bg-emerald-400', width: '100%', textColor: 'text-emerald-400' },
 ]

 if (!password) return null

 const level = levels[score] || levels[0]

 return (
  <motion.div
   initial={{ opacity: 0, height: 0 }}
   animate={{ opacity: 1, height: 'auto' }}
   exit={{ opacity: 0, height: 0 }}
   className="mt-2"
  >
   <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
    <motion.div
     initial={{ width: 0 }}
     animate={{ width: level.width }}
     transition={{ duration: 0.3 }}
     className={`h-1.5 rounded-full ${level.color}`}
    />
   </div>
   <p className={`text-xs ${level.textColor} mb-2`}>{level.label}</p>
   <div className="space-y-1">
    {criteria.map((c, i) => {
     const passed = c.test(password)
     return (
      <div key={i} className={`flex items-center gap-2 text-xs transition-colors ${passed ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
       <FiCheckCircle size={12} className={passed ? 'text-emerald-400' : 'text-slate-500'} />
       <span>{c.label}</span>
      </div>
     )
    })}
   </div>
  </motion.div>
 )
}

export default function Signup() {
 const { lang, t } = useLanguage()
 const { signup, user } = useAuth()
 const navigate = useNavigate()
 const isArabic = lang === 'ar'

 const [form, setForm] = useState({ name: '', studentId: '', email: '', major: '', password: '', confirmPassword: '' })
 const [showPassword, setShowPassword] = useState(false)
 const [showConfirm, setShowConfirm] = useState(false)
 const [error, setError] = useState('')
 const [loading, setLoading] = useState(false)
 const [showSuccess, setShowSuccess] = useState(false)
 const [needsConfirmation, setNeedsConfirmation] = useState(false)
 const navigateTimer = useRef(null)

 
 useEffect(() => {
  return () => { if (navigateTimer.current) clearTimeout(navigateTimer.current) }
 }, [])

 useEffect(() => {
  // Redirect a returning logged-in user away from signup, but never during the
  // success animation (showSuccess) so the confirmation screen is visible first.
  if (user && !showSuccess) navigate('/home', { replace: true })
 }, [user, showSuccess, navigate])

 if (user && !showSuccess) return null

 const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  if (!form.name.trim() || !form.studentId.trim()) {
   setError(isArabic ? 'أدخل الاسم الكامل والرقم الجامعي' : 'Enter your full name and university ID')
   return
  }
  const normalizedId = form.studentId.trim()
  if (normalizedId.length < 3) {
   setError(isArabic ? 'الرقم الجامعي قصير جداً (3 أحرف على الأقل)' : 'University ID is too short (min 3 characters)')
   return
  }
  if (form.password !== form.confirmPassword) {
   setError(t('forgotPassword.passwordsDoNotMatch'))
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
   if (!result.needsConfirmation) {
    sessionStorage.setItem('al_azher_just_auth', '1')
   }
   if (result.needsConfirmation) {
    setNeedsConfirmation(true)
    navigateTimer.current = setTimeout(() => navigate('/login'), 1800)
   } else {
    navigateTimer.current = setTimeout(() => navigate('/home'), 1200)
   }
  } else if (result.error === 'STUDENT_ID_EXISTS') {
   setError(t('signup.error.exists'))
  } else if (result.error === 'EMAIL_RATE_LIMIT') {
   setError(t('signup.error.rateLimit'))
  } else if (result.error === 'EMAIL_EXISTS') {
   setError(isArabic
    ? 'هذا البريد الإلكتروني مسجّل بالفعل. جرّب تسجيل الدخول أو استخدم بريداً آخر.'
    : 'This email is already registered. Try signing in or use a different email.')
  } else if (result.error === 'PASSWORD_TOO_SHORT') {
   setError(t('forgotPassword.passwordMin8'))
  } else if (result.error === 'REGISTER_FAILED') {
   setError(isArabic ? 'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.' : 'An error occurred while creating the account. Try again.')
  } else {
   setError(t('signup.error.generic'))
  }
 }

 const formFields = [
  { key: 'name', icon: FiUser, type: 'text', labelAr: 'الاسم الكامل', labelEn: 'Full Name', placeholderAr: 'أدخل اسمك الكامل', placeholderEn: 'Enter your full name', autoComplete: 'name', required: true },
  { key: 'studentId', icon: FiHash, type: 'text', labelAr: 'الرقم الجامعي', labelEn: 'University ID', placeholderAr: 'أدخل رقمك الجامعي', placeholderEn: 'Enter your university ID', autoComplete: 'username', required: true },
  { key: 'email', icon: FiMail, type: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', placeholderAr: 'example@university.edu', placeholderEn: 'example@university.edu', autoComplete: 'email', required: true },
  { key: 'major', icon: FiBookOpen, type: 'text', labelAr: 'التخصص', labelEn: 'Major / Specialization', placeholderAr: 'مثال: هندسة البرمجيات', placeholderEn: 'e.g. Software Engineering', autoComplete: 'organization-title' },
 ]

 return (
  <AuthLayout isArabic={isArabic} onBack={() => navigate('/')}>
   <AuthLogo
    title={t('signup.title')}
    subtitle={t('signup.subtitle')}
    isArabic={isArabic}
   />

   <AuthAlert type="success" message={needsConfirmation ? t('signup.checkEmail') : (isArabic ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!')} show={showSuccess} />
   <AuthAlert type="error" message={error} show={!showSuccess && !!error} />

   {!showSuccess && (
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ delay: 0.2 }}
     className="relative z-10"
    >
     <form onSubmit={handleSubmit} className="space-y-4">
      {formFields.map((field, i) => (
       <motion.div
        key={field.key}
        initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
       >
        <label htmlFor={`signup-${field.key}`} className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ml-1 uppercase tracking-wider">
         {isArabic ? field.labelAr : field.labelEn}
        </label>
        <SpatialInput
         id={`signup-${field.key}`}
         icon={field.icon}
         type={field.type}
         value={form[field.key]}
         onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
         placeholder={isArabic ? field.placeholderAr : field.placeholderEn}
         disabled={loading}
         isArabic={isArabic}
         autoComplete={field.autoComplete}
         required={field.required}
        />
       </motion.div>
      ))}

      <motion.div
       initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
       <label htmlFor="signup-password" className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ml-1 uppercase tracking-wider">
        {t('signup.password')}
       </label>
       <SpatialInput
        id="signup-password"
        icon={FiLock}
        type={showPassword ? 'text' : 'password'}
        value={form.password}
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        placeholder="••••••"
        disabled={loading}
        isArabic={isArabic}
        showToggle
        onToggle={() => setShowPassword(!showPassword)}
        showPassword={showPassword}
        autoComplete="new-password"
        required
       />
       <AnimatePresence>
        <PasswordStrength password={form.password} isArabic={isArabic} />
       </AnimatePresence>
       {form.password && form.password.length < 8 && (
        <p className="text-xs text-amber-400/80 mt-1 ml-1">
         {isArabic ? '8 أحرف على الأقل' : 'At least 8 characters'}
        </p>
       )}
      </motion.div>

      <motion.div
       initial={{ opacity: 0, x: isArabic ? 30 : -30 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: 0.58, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <label htmlFor="signup-confirm-password" className="block text-xs font-medium text-slate-500 dark:text-white/60 mb-2 ml-1 uppercase tracking-wider">
         {t('signup.confirmPassword')}
        </label>
         <SpatialInput
          id="signup-confirm-password"
          icon={FiLock}
         type={showConfirm ? 'text' : 'password'}
         value={form.confirmPassword}
         onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
         placeholder="••••••"
         disabled={loading}
         isArabic={isArabic}
         showToggle
         onToggle={() => setShowConfirm(!showConfirm)}
         showPassword={showConfirm}
         autoComplete="new-password"
         required
        />
       {form.confirmPassword && form.password !== form.confirmPassword && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-1">
         {t('forgotPassword.passwordsDoNotMatch')}
        </p>
       )}
      </motion.div>

      <AuthSubmitButton
       loading={loading}
       loadingText={t('signup.signingUp')}
       buttonText={t('signup.signup')}
       isArabic={isArabic}
       delay={0.65}
      />
     </form>

     <SocialAuth isArabic={isArabic} disabled={loading} />

     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="mt-6 text-center"
     >
      <p className="text-slate-500 dark:text-white/50 text-sm">
       {t('signup.hasAccount')}
       {' '}
       <Link to="/login" className="text-accent hover:text-royal-600 dark:hover:text-cyan-300 font-medium transition-colors relative group">
        {t('signup.login')}
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
