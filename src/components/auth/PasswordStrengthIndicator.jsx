import { motion } from 'framer-motion'
import { FiCheckCircle, FiShield } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

export default function PasswordStrengthIndicator({ password, isArabic }) {
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
