import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getLectures, getFavorites, getRatings, getViewed, toggleFavorite, setRating, markViewed, addStudentLog } from '../services'
import { sortLectures } from '../utils/sort'
import toast from 'react-hot-toast'

export function useLectures(user, isArabic) {
  const [activeSubject, setActiveSubject] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sortBy, setSortBy] = useState('date-desc')
  const [viewMode, setViewMode] = useState('grid')
  const [lectures, setLectures] = useState([])
  const [localFavorites, setLocalFavorites] = useState([])
  const [localRatings, setLocalRatings] = useState({})
  const [viewedIds, setViewedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const viewedIdsRef = useRef([])

  const replaceViewedIds = useCallback((ids) => {
    viewedIdsRef.current = Array.isArray(ids) ? ids : []
    setViewedIds(viewedIdsRef.current)
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        const l = await getLectures()
        if (mounted) setLectures(l)
        if (user && mounted) {
          const [favs, rats, viewed] = await Promise.all([
            getFavorites(user.studentId),
            getRatings(user.studentId),
            getViewed(user.studentId).catch(() => []),
          ])
          if (mounted) {
            setLocalFavorites(favs)
            setLocalRatings(rats)
            replaceViewedIds(viewed)
          }
        }
      } catch (err) {
        console.warn('useLectures load failed:', err?.message)
        if (mounted) setError(err)
      }
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [user, reloadKey, replaceViewedIds])

  const subjects = useMemo(() => {
    const set = new Set(lectures.map(l => isArabic ? l.subjectAr : l.subjectEn))
    return Array.from(set)
  }, [lectures, isArabic])

  const filtered = useMemo(() => {
    let result = lectures.filter(l => {
      const subject = isArabic ? l.subjectAr : l.subjectEn
      const title = isArabic ? l.titleAr : l.titleEn
      const matchSubject = activeSubject === 'all' || subject === activeSubject
      const matchSearch = !search || title?.toLowerCase().includes(search.toLowerCase()) || subject?.toLowerCase().includes(search.toLowerCase())
      let matchDate = true
      if (dateFrom) matchDate = matchDate && l.date >= dateFrom
      if (dateTo) matchDate = matchDate && l.date <= dateTo
      return matchSubject && matchSearch && matchDate
    })
    return sortLectures(result, sortBy, isArabic)
  }, [lectures, activeSubject, search, dateFrom, dateTo, sortBy, isArabic])

  const handleToggleFavorite = useCallback(async (id, lecture) => {
    if (!user) return
    try {
      const newFavs = await toggleFavorite(user.studentId, id)
      setLocalFavorites(newFavs)
      addStudentLog({
        studentId: user.studentId,
        name: user.name,
        type: 'ADD_FAVORITE',
        detail: `${newFavs.includes(id) ? 'إضافة' : 'إزالة'} مفضلة: ${lecture?.titleAr || lecture?.titleEn || id}`,
        ip: '',
        device: navigator.userAgent,
      }).catch(() => {})
    } catch (e) {
      toast.error(isArabic ? 'خطأ في المفضلة' : 'Failed to update favorite')
    }
  }, [user, isArabic])

  const handleRate = useCallback(async (id, rating, lecture) => {
    if (!user) return
    try {
      const newRatings = await setRating(user.studentId, id, rating)
      setLocalRatings(newRatings)
      addStudentLog({
        studentId: user.studentId,
        name: user.name,
        type: 'RATE_LECTURE',
        detail: `تقييم ${rating} نجوم: ${lecture?.titleAr || lecture?.titleEn || id}`,
        ip: '',
        device: navigator.userAgent,
      }).catch(() => {})
    } catch (e) {
      toast.error(isArabic ? 'خطأ في التقييم' : 'Failed to rate')
    }
  }, [user, isArabic])

  const handleWatch = useCallback((id, lecture) => {
    if (!user || viewedIdsRef.current.includes(id)) return
    replaceViewedIds([...viewedIdsRef.current, id])
    markViewed(user.studentId, id).catch(() => {})
    addStudentLog({
      studentId: user.studentId,
      name: user.name,
      type: 'VIEW_LECTURE',
      detail: `مشاهدة: ${lecture?.titleAr || lecture?.titleEn || id}`,
      ip: '',
      device: navigator.userAgent,
    }).catch(() => {})
  }, [user, replaceViewedIds])

  const reload = useCallback(() => {
    setLoading(true)
    setReloadKey(k => k + 1)
  }, [])

  return {
    activeSubject, setActiveSubject,
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    showAdvanced, setShowAdvanced,
    sortBy, setSortBy,
    viewMode, setViewMode,
    lectures, subjects, filtered,
    localFavorites, localRatings, viewedIds,
    loading, error, reload,
    handleToggleFavorite, handleRate, handleWatch,
  }
}
