import { memo } from 'react'
import { FiUser } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

const sizes = {
 sm: { box: 'w-9 h-9', icon: 16, radius: 'rounded-lg', shadow: 'shadow-lg shadow-royal-500/20 dark:shadow-royal-500/30' },
 md: { box: 'w-20 h-20', icon: 32, radius: 'rounded-2xl', shadow: 'shadow-xl shadow-royal-500/20' },
 lg: { box: 'w-24 h-24', icon: 40, radius: 'rounded-3xl', shadow: 'shadow-2xl shadow-royal-500/30' },
}

function SiteLogo({ size = 'sm', showText = false, className = '' }) {
 const { t } = useLanguage()
 const s = sizes[size] || sizes.sm

 return (
  <div className={`flex items-center gap-2 ${className}`}>
   <div className={`${s.box} bg-gradient-to-br from-royal-500 to-cyan-400 ${s.radius} flex items-center justify-center text-white shrink-0 ${s.shadow}`}>
    <FiUser size={s.icon} />
   </div>
   {showText && (
    <span className="font-bold text-lg text-ink">
     {t('site.title')}
    </span>
   )}
  </div>
 )
}

export default memo(SiteLogo)
