import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'

export default function CustomSelect({ value, options, onChange, isArabic, label }) {
 const prefersReduced = useReducedMotion()
 const [open, setOpen] = useState(false)
 const [activeIndex, setActiveIndex] = useState(-1)
 const selected = options.find(o => o.value === value)
 const listId = `select-list-${String(label || 'default').replace(/\s+/g, '-')}`

 const commit = (opt) => {
  onChange(opt.value)
  setOpen(false)
 }

 return (
  <div className="relative">
   <button
    onClick={() => setOpen(!open)}
    onKeyDown={(e) => {
     if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
       setOpen(true)
       setActiveIndex(e.key === 'ArrowDown' ? 0 : options.length - 1)
      } else {
       setActiveIndex(i => {
        const next = e.key === 'ArrowDown' ? i + 1 : i - 1
        return Math.max(0, Math.min(options.length - 1, next))
       })
      }
     } else if (e.key === 'Enter' || e.key === ' ') {
      if (open && activeIndex >= 0 && options[activeIndex]) {
       e.preventDefault()
       commit(options[activeIndex])
      }
     } else if (e.key === 'Escape') {
      setOpen(false)
     } else if (e.key === 'Home' && open) {
      e.preventDefault()
      setActiveIndex(0)
     } else if (e.key === 'End' && open) {
      e.preventDefault()
      setActiveIndex(options.length - 1)
     }
    }}
    className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-slate-600 dark:text-white/70 hover:text-ink transition min-w-[160px] justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500/50"
    role="combobox"
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-controls={listId}
    aria-activedescendant={open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
   >
    <span>
     <span className="sr-only">{label}: </span>
     {isArabic ? selected?.labelAr : selected?.labelEn}
    </span>
    <FiChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
   </button>
   <AnimatePresence>
    {open && (
     <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <motion.div
       initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
       animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -8 }}
       id={listId}
       role="listbox"
       className="absolute top-full mt-1 left-0 right-0 glass rounded-xl shadow-xl z-50 overflow-hidden"
      >
       {options.map((opt, i) => (
        <button
         key={opt.value}
         id={`${listId}-opt-${i}`}
         role="option"
         aria-selected={value === opt.value}
         onClick={() => commit(opt)}
         onMouseEnter={() => setActiveIndex(i)}
         className={`w-full text-left px-4 py-2.5 min-h-[44px] text-sm transition-colors ${
          value === opt.value
           ? 'bg-royal-500/10 dark:bg-cyan-500/20 text-royal-500 dark:text-cyan-300'
           : 'text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink'
         }`}
        >
         {isArabic ? opt.labelAr : opt.labelEn}
        </button>
       ))}
      </motion.div>
     </>
    )}
   </AnimatePresence>
  </div>
 )
}
