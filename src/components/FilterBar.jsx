import { useState, useEffect, useCallback, memo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { FiSearch, FiX } from 'react-icons/fi'

export default memo(function FilterBar({ subjects, activeSubject, onSubjectChange, searchQuery, onSearchChange, searchPlaceholder, allLabel, resultCount }) {
 const { lang, t } = useLanguage()
 const isArabic = lang === 'ar'
 const [localSearch, setLocalSearch] = useState(searchQuery || '')

 useEffect(() => {
  setLocalSearch(searchQuery || '')
 }, [searchQuery])

 const debouncedSearch = useCallback(
  (() => {
   let timer
   return (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => onSearchChange(val), 300)
   }
  })(),
  [onSearchChange]
 )

 const handleChange = (val) => {
  setLocalSearch(val)
  debouncedSearch(val)
 }

 const clearSearch = () => {
  setLocalSearch('')
  onSearchChange('')
 }

 const hasFilter = localSearch || activeSubject !== 'all'

 const resetAll = () => {
  setLocalSearch('')
  onSearchChange('')
  onSubjectChange('all')
 }

 return (
  <div className="space-y-4">
   <div className="relative">
    <FiSearch className="absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" style={{ [isArabic ? 'right' : 'left']: '16px' }} size={18} />
    <input
     type="text"
     value={localSearch}
     onChange={(e) => handleChange(e.target.value)}
     placeholder={searchPlaceholder}
     className="w-full input-spatial rounded-xl py-3.5 pr-12 pl-12 text-navy-900 dark:text-white placeholder:text-slate-500 dark:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500/50 transition"
     aria-label={searchPlaceholder}
    />
    {localSearch && (
     <button
      onClick={clearSearch}
      className="absolute top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors"
      style={{ [isArabic ? 'left' : 'right']: '16px' }}
      aria-label={t('common.search')}
     >
      <FiX size={16} />
     </button>
    )}
   </div>

   <div className="flex flex-wrap items-center gap-2" role="group" aria-label={isArabic ? 'تصفية حسب الموضوع' : 'Filter by subject'}>
    <button
     onClick={() => onSubjectChange('all')}
     aria-pressed={activeSubject === 'all'}
     aria-label={isArabic ? 'عرض الكل' : 'Show all'}
     className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 ${
      activeSubject === 'all'
       ? 'btn-spatial text-white'
       : 'glass text-slate-600 dark:text-white/70 hover:text-navy-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500/50'
     }`}
    >
     {allLabel || t('common.all')}
    </button>
    {subjects.map(subject => (
     <button
      key={subject}
      onClick={() => onSubjectChange(subject)}
      aria-pressed={activeSubject === subject}
      aria-label={isArabic ? `تصفية حسب: ${subject}` : `Filter by: ${subject}`}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition duration-200 ${
       activeSubject === subject
        ? 'btn-spatial text-white'
        : 'glass text-slate-600 dark:text-white/70 hover:text-navy-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500/50'
      }`}
     >
      {subject}
     </button>
    ))}
   </div>

   {(resultCount !== undefined || hasFilter) && (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 ">
     {resultCount !== undefined && (
      <span>{resultCount} {t('common.results')}</span>
     )}
      {hasFilter && (
       <button onClick={resetAll} className="text-royal-500 dark:text-cyan-400 hover:text-royal-600 dark:hover:text-cyan-300 font-medium transition-colors" aria-label={isArabic ? 'إعادة ضبط الفلاتر' : 'Reset filters'}>
        {t('common.reset')}
       </button>
      )}
    </div>
   )}
  </div>
 )
})
