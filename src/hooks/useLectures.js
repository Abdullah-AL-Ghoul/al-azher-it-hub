import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getLectures, addStudentLog } from '../services'
import { sortLectures } from '../utils/sort'
import { useUserData } from '../context/UserDataContext'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const viewedIdsRef = useRef([])

  // Single source of truth from UserDataContext — no parallel fetches.
  const { favorites, ratings, viewed, toggleFavorite, setRating, markViewed } = useUserData()

  useEffect(() => {
    viewedIdsRef.current = viewed
  }, [viewed])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        const l = await getLectures()
        if (mounted) setLectures(l)
      } catch (err) {
        if (mounted) setError(err)
      }
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [reloadKey])

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
      const newFavs = await toggleFavorite(id)
      addStudentLog({
        type: 'ADD_FAVORITE',
        detail: lecture?.titleAr || lecture?.titleEn || id,
        device: navigator.userAgent,
      }).catch(() => {})
      return newFavs
    } catch (e) {
      toast.error(isArabic ? 'خطأ في المفضلة' : 'Failed to update favorite')
    }
  }, [user, isArabic, toggleFavorite])

  const handleRate = useCallback(async (id, rating, lecture) => {
    if (!user) return
    try {
      const newRatings = await setRating(id, rating)
      addStudentLog({
        type: 'RATE_LECTURE',
        detail: `${rating}/5 · ${lecture?.titleAr || lecture?.titleEn || id}`,
        device: navigator.userAgent,
      }).catch(() => {})
      return newRatings
    } catch (e) {
      toast.error(isArabic ? 'خطأ في التقييم' : 'Failed to rate')
    }
  }, [user, isArabic, setRating])

  const handleWatch = useCallback(async (id, lecture) => {
    if (!user || viewedIdsRef.current.includes(id)) return
    // Optimistic: mark as viewed immediately (context handles SWR rollback)
    try {
      await markViewed(id)
    } catch (_e) {
      return
    }
    addStudentLog({
      type: 'VIEW_LECTURE',
      detail: lecture?.titleAr || lecture?.titleEn || id,
      device: navigator.userAgent,
    }).catch(() => {})
  }, [user, markViewed])

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
    localFavorites: favorites, localRatings: ratings, viewedIds: viewed,
    loading, error, reload,
    handleToggleFavorite, handleRate, handleWatch,
  }
}