import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getFavorites, toggleFavorite as svcToggleFavorite, getRatings, setRating as svcSetRating, getUserStats, markViewed as svcMarkViewed } from '../services'

const UserDataContext = createContext(null)

// In-memory cache with TTL for stale-while-revalidate (SWR) behavior
// Keeps data per studentId outside React tree to survive remounts without refetch
const cache = new Map() // studentId -> { data, timestamp }
const inflight = new Map() // studentId -> Promise
const TTL = 60 * 1000 // 60s fresh, stale served immediately while revalidating
const STALE_TTL = 5 * 60 * 1000 // 5min max stale before forced revalidate (still shows stale while fetching)

function getCached(studentId) {
  const entry = cache.get(studentId)
  if (!entry) return null
  return entry
}

function isFresh(entry) {
  return entry && (Date.now() - entry.timestamp < TTL)
}

function isStale(entry) {
  return entry && (Date.now() - entry.timestamp < STALE_TTL)
}

async function fetchUserData(studentId) {
  if (inflight.has(studentId)) return inflight.get(studentId)
  const p = Promise.all([
    getFavorites(studentId).catch(() => []),
    getRatings(studentId).catch(() => ({})),
    getUserStats(studentId).catch(() => ({ viewed: [], lastVisit: null })),
  ]).then(([favorites, ratings, stats]) => {
    const data = {
      favorites: Array.isArray(favorites) ? favorites : [],
      ratings: ratings || {},
      viewed: Array.isArray(stats?.viewed) ? stats.viewed : [],
      stats: stats || { viewed: [], lastVisit: null },
    }
    cache.set(studentId, { data, timestamp: Date.now() })
    return data
  }).finally(() => {
    inflight.delete(studentId)
  })
  inflight.set(studentId, p)
  return p
}

export function UserDataProvider({ children }) {
  const { user } = useAuth()
  const studentId = user?.studentId || null

  const [favorites, setFavorites] = useState(() => {
    const e = studentId ? getCached(studentId) : null
    return e?.data?.favorites || []
  })
  const [ratings, setRatings] = useState(() => {
    const e = studentId ? getCached(studentId) : null
    return e?.data?.ratings || {}
  })
  const [viewed, setViewed] = useState(() => {
    const e = studentId ? getCached(studentId) : null
    return e?.data?.viewed || []
  })
  const [stats, setStats] = useState(() => {
    const e = studentId ? getCached(studentId) : null
    return e?.data?.stats || { viewed: [], lastVisit: null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Refs mirror the latest state so rapid consecutive toggles/ratings roll back
  // to the freshest snapshot, not the render-closure value.
  const favoritesRef = useRef(favorites)
  useEffect(() => { favoritesRef.current = favorites }, [favorites])
  const ratingsRef = useRef(ratings)
  useEffect(() => { ratingsRef.current = ratings }, [ratings])
  const viewedRef = useRef(viewed)
  useEffect(() => { viewedRef.current = viewed }, [viewed])

  const applyData = useCallback((data) => {
    if (!mountedRef.current) return
    setFavorites(data.favorites)
    setRatings(data.ratings)
    setViewed(data.viewed)
    setStats(data.stats)
  }, [])

  const load = useCallback(async ({ force = false } = {}) => {
    if (!studentId) {
      setFavorites([])
      setRatings({})
      setViewed([])
      setStats({ viewed: [], lastVisit: null })
      setLoading(false)
      return
    }
    const cached = getCached(studentId)
    // SWR: if fresh and not forced, serve cached and skip network
    if (cached && isFresh(cached) && !force) {
      applyData(cached.data)
      setLoading(false)
      return
    }
    // If stale, show stale immediately then revalidate in background
    if (cached && isStale(cached) && !force) {
      applyData(cached.data)
      // continue to revalidate below without blocking UI
    } else if (cached && !force) {
      // expired beyond STALE_TTL — still show stale while fetching
      applyData(cached.data)
    }

    if (!cached || force) setLoading(true)
    setError(null)
    try {
      const data = await fetchUserData(studentId)
      if (mountedRef.current) {
        applyData(data)
        setError(null)
      }
    } catch (e) {
      if (mountedRef.current) setError(e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [studentId, applyData])

  // Fetch / revalidate when studentId changes; SWR keeps stale data visible during fetch
  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => load({ force: true }), [load])

  const toggleFavorite = useCallback(async (lectureId) => {
    if (!studentId) return
    const prev = favoritesRef.current
    const isFav = prev.includes(lectureId)
    const optimistic = isFav ? prev.filter((id) => id !== lectureId) : [...prev, lectureId]
    setFavorites(optimistic)
    // update cache optimistically
    const c = getCached(studentId)
    if (c) cache.set(studentId, { data: { ...c.data, favorites: optimistic }, timestamp: c.timestamp })
    try {
      const ids = await svcToggleFavorite(studentId, lectureId)
      if (mountedRef.current) {
        setFavorites(ids)
        const cur = getCached(studentId)
        if (cur) cache.set(studentId, { data: { ...cur.data, favorites: ids }, timestamp: Date.now() })
      }
      return ids
    } catch (e) {
      if (mountedRef.current) setFavorites(prev)
      throw e
    }
  }, [studentId])

  const setRating = useCallback(async (lectureId, rating) => {
    if (!studentId) return
    const prev = ratingsRef.current
    const optimistic = { ...prev, [lectureId]: rating }
    setRatings(optimistic)
    const c = getCached(studentId)
    if (c) cache.set(studentId, { data: { ...c.data, ratings: optimistic }, timestamp: c.timestamp })
    try {
      const next = await svcSetRating(studentId, lectureId, rating)
      if (mountedRef.current) {
        setRatings(next)
        const cur = getCached(studentId)
        if (cur) cache.set(studentId, { data: { ...cur.data, ratings: next }, timestamp: Date.now() })
      }
      return next
    } catch (e) {
      if (mountedRef.current) setRatings(prev)
      throw e
    }
  }, [studentId])

  const markViewed = useCallback(async (lectureId) => {
    if (!studentId || viewed.includes(lectureId)) return viewed
    const prev = viewed
    const optimistic = [...prev, lectureId]
    setViewed(optimistic)
    setStats((s) => ({ ...s, viewed: optimistic }))
    const c = getCached(studentId)
    if (c) cache.set(studentId, { data: { ...c.data, viewed: optimistic, stats: { ...c.data.stats, viewed: optimistic } }, timestamp: c.timestamp })
    try {
      const res = await svcMarkViewed(studentId, lectureId)
      if (mountedRef.current && res?.viewed) {
        setViewed(res.viewed)
        setStats((s) => ({ ...s, ...res }))
        const cur = getCached(studentId)
        if (cur) cache.set(studentId, { data: { ...cur.data, viewed: res.viewed, stats: { ...cur.data.stats, ...res } }, timestamp: Date.now() })
      }
      return res
    } catch (_e) {
      // keep optimistic on failure; will be corrected on next revalidate
      return { viewed: optimistic }
    }
  }, [studentId, viewed])

  const value = useMemo(() => ({
    favorites,
    ratings,
    viewed,
    stats,
    loading,
    error,
    refresh,
    toggleFavorite,
    setRating,
    markViewed,
    isStale: studentId ? !isFresh(getCached(studentId)) : false,
  }), [favorites, ratings, viewed, stats, loading, error, refresh, toggleFavorite, setRating, markViewed, studentId])

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider')
  return ctx
}

export default UserDataContext
