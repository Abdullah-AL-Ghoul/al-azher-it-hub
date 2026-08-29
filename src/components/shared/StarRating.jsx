import { FiStar } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

const TARGET_SIZES = {
  sm: 'min-w-[40px] min-h-[40px]',
  md: 'min-w-[44px] min-h-[44px]',
}

/**
 * 5-star rating row used on lecture cards, list items, and the video modal.
 * value: 0-5 (current rating), onRate: (star) => void.
 * target: 'sm' (40px touch targets, in-modal) | 'md' (44px, default).
 */
export default function StarRating({ value = 0, onRate, size = 16, target = 'md', className = '' }) {
  const { t } = useLanguage()
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onRate?.(star)
          }}
          className={`${TARGET_SIZES[target] || TARGET_SIZES.md} flex items-center justify-center transition-transform hover:scale-125`}
          aria-label={`${t('lectures.rate')} ${star}`}
          aria-pressed={value >= star}
        >
          <FiStar
            size={size}
            className={value >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/60'}
          />
        </button>
      ))}
    </div>
  )
}