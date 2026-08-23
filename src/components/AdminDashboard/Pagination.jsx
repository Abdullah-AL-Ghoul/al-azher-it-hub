import { memo } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

function Pagination({ page, totalPages, totalItems, onPageChange, isArabic }) {
 if (totalPages <= 1) return null

 return (
  <div className="flex justify-center items-center gap-2 mt-4">
   <button
    onClick={() => onPageChange(page - 1)}
    disabled={page <= 1}
    className="p-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
    aria-label={isArabic ? 'السابق' : 'Previous'}
   >
    {isArabic ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
   </button>
   <span className="text-sm text-slate-500 dark:text-slate-400 px-2">
    {page} / {totalPages}
   </span>
   <button
    onClick={() => onPageChange(page + 1)}
    disabled={page >= totalPages}
    className="p-2 glass text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
    aria-label={isArabic ? 'التالي' : 'Next'}
   >
    {isArabic ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
   </button>
   <span className="text-xs text-slate-500 dark:text-slate-400 ms-2">
    ({totalItems} {isArabic ? 'عنصر' : 'items'})
   </span>
  </div>
 )
}

export default memo(Pagination)
