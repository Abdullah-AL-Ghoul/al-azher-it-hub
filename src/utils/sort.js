export function sortLectures(lectures, sortBy = 'date-desc', isArabic = true) {
  if (!Array.isArray(lectures)) return []
  const sortLocale = isArabic ? 'ar' : 'en'
  return [...lectures].sort((a, b) => {
    const orderA = a.sortOrder ?? 0
    const orderB = b.sortOrder ?? 0
    if (orderA !== orderB) return orderA - orderB
    const createdAtA = a.createdAt || ''
    const createdAtB = b.createdAt || ''
    const titleA = (isArabic ? a.titleAr : a.titleEn) || ''
    const titleB = (isArabic ? b.titleAr : b.titleEn) || ''
    const byDate = (dir) => {
      const cmp = (a.date || '').localeCompare(b.date || '')
      if (cmp !== 0) return cmp * dir
      return createdAtA.localeCompare(createdAtB) * dir
    }
    switch (sortBy) {
      case 'date-asc': return byDate(1)
      case 'date-desc': return byDate(-1)
      case 'title': return titleA.localeCompare(titleB, sortLocale, { sensitivity: 'base', numeric: true }) || byDate(-1)
      case 'created-desc': return createdAtB.localeCompare(createdAtA) || byDate(-1)
      case 'created-asc': return createdAtA.localeCompare(createdAtB) || byDate(1)
      default: return byDate(-1)
    }
  })
}
