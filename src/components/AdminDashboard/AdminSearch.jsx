import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { FiSearch, FiX, FiVideo, FiBook, FiGrid, FiUsers } from 'react-icons/fi'

/**
 * Global jump-search for the admin dashboard: searches users, lectures,
 * sources and courses from the header and navigates to the owning tab.
 * Keyboard: ArrowUp/ArrowDown to move, Enter to jump, Escape to close.
 */
export default function AdminSearch({
  courses = [],
  lectures = [],
  sources = [],
  users = [],
  isArabic,
  onNavigate,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const boxRef = useRef(null)
  const listId = 'admin-search-listbox'
  const inputId = 'admin-search-input'

  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!q) return []
    const match = (v) => (v || '').toLowerCase().includes(q)
    const groups = [
      {
        key: 'users', tab: 'users', icon: FiUsers, label: isArabic ? 'الطلاب' : 'Students',
        items: users.filter(u => match(u.name) || match(u.studentId) || match(u.email) || match(u.major)).slice(0, 6),
        nameOf: (u) => `${u.name || ''} (${u.studentId})`,
      },
      {
        key: 'lectures', tab: 'lectures', icon: FiVideo, label: isArabic ? 'المحاضرات' : 'Lectures',
        items: lectures.filter(l => match(l.titleAr) || match(l.titleEn) || match(l.subjectAr) || match(l.subjectEn)).slice(0, 6),
        nameOf: (l) => (isArabic ? l.titleAr : l.titleEn),
      },
      {
        key: 'sources', tab: 'sources', icon: FiGrid, label: isArabic ? 'المصادر' : 'Sources',
        items: sources.filter(s => match(s.titleAr) || match(s.titleEn) || match(s.subjectAr) || match(s.subjectEn)).slice(0, 6),
        nameOf: (s) => (isArabic ? s.titleAr : s.titleEn),
      },
      {
        key: 'courses', tab: 'courses', icon: FiBook, label: isArabic ? 'المواد' : 'Courses',
        items: courses.filter(c => match(c.nameAr) || match(c.nameEn) || match(c.doctorAr) || match(c.doctorEn)).slice(0, 6),
        nameOf: (c) => (isArabic ? c.nameAr : c.nameEn),
      },
    ]
    return groups.filter(g => g.items.length > 0)
  }, [q, users, lectures, sources, courses, isArabic])

  // Flat list for keyboard navigation (group headers are not focusable).
  const flat = useMemo(() => {
    const arr = []
    results.forEach(g => g.items.forEach((item, idx) => arr.push({ group: g, item, itemKey: `${g.key}-${idx}` })))
    return arr
  }, [results])

  const total = flat.length

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
      if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setActiveIndex(-1) }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onDown)
    }
  }, [open])

  const jumpTo = useCallback((group, item) => {
    setQuery(group.nameOf(item))
    setOpen(false)
    setActiveIndex(-1)
    onNavigate(group.tab)
  }, [onNavigate])

  const onInputKeyDown = useCallback((e) => {
    if (!open || total === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % total)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + total) % total)
    } else if (e.key === 'Enter' && activeIndex >= 0 && flat[activeIndex]) {
      e.preventDefault()
      const { group, item } = flat[activeIndex]
      jumpTo(group, item)
    }
  }, [open, total, activeIndex, flat, jumpTo])

  return (
    <div ref={boxRef} className="relative w-full max-w-xs">
      <FiSearch size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400 pointer-events-none" aria-hidden="true" />
      <input
        id={inputId}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        placeholder={isArabic ? 'بحث شامل...' : 'Global search...'}
        aria-label={isArabic ? 'بحث شامل في لوحة التحكم' : 'Global dashboard search'}
        aria-expanded={open && total > 0}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 && flat[activeIndex] ? `admin-search-${flat[activeIndex].itemKey}` : undefined}
        role="combobox"
        autoComplete="off"
        className="w-full ps-9 pe-8 py-2 glass rounded-xl text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal-500/30"
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setActiveIndex(-1); setOpen(true) }}
          aria-label={isArabic ? 'مسح البحث' : 'Clear search'}
          className="absolute top-1/2 -translate-y-1/2 end-2 p-1 text-slate-400 hover:text-ink rounded transition"
        >
          <FiX size={14} />
        </button>
      )}

      {open && q && (
        <div
          id={listId}
          role="listbox"
          aria-label={isArabic ? 'نتائج البحث' : 'Search results'}
          className="absolute top-full mt-1.5 start-0 end-0 max-h-80 overflow-y-auto glass rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1.5 scrollbar-thin"
        >
          {total === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
              {isArabic ? 'لا توجد نتائج' : 'No results found'}
            </p>
          ) : (
            results.map(group => {
              const Icon = group.icon
              return (
                <div key={group.key} className="px-2 py-1.5">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
                    <Icon size={11} /> {group.label} <span className="text-slate-300 dark:text-slate-600">({group.items.length})</span>
                  </p>
                  {group.items.map((item, idx) => {
                    const flatIdx = flat.findIndex(f => f.itemKey === `${group.key}-${idx}`)
                    const isActive = activeIndex === flatIdx
                    return (
                      <button
                        key={idx}
                        id={`admin-search-${group.key}-${idx}`}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => jumpTo(group, item)}
                        onMouseEnter={() => setActiveIndex(flatIdx)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition truncate ${
                          isActive
                            ? 'bg-royal-500/15 text-royal-600 dark:text-cyan-300'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-royal-500/10 dark:hover:bg-royal-500/15 hover:text-royal-600 dark:hover:text-cyan-300'
                        }`}
                      >
                        {group.nameOf(item)}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
