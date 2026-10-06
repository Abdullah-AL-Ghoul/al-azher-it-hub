import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabase } from '../services/supabase'

const ACTIVITY_TYPES = {
 lectures: { icon: 'FiBookOpen', color: 'bg-violet-400', labelAr: 'محاضرة جديدة', labelEn: 'New Lecture' },
 sources: { icon: 'FiFolder', color: 'bg-amber-400', labelAr: 'مصدر جديد', labelEn: 'New Source' },
 additions: { icon: 'FiFileText', color: 'bg-emerald-400', labelAr: 'إضافة جديدة', labelEn: 'New Addition' },
 courses: { icon: 'FiLayers', color: 'bg-blue-400', labelAr: 'مادة جديدة', labelEn: 'New Course' },
}

const ACTIONS = {
 ADD: { verbAr: 'تمت إضافة', verbEn: 'Added', color: 'bg-emerald-400' },
 UPDATE: { verbAr: 'تم تحديث', verbEn: 'Updated', color: 'bg-blue-400' },
 IMPORT: { verbAr: 'استيراد', verbEn: 'Imported', color: 'bg-purple-400' },
}

function getActivityMeta(type, action) {
 const base = ACTIVITY_TYPES[type] || { icon: 'FiBell', color: 'bg-gray-400', labelAr: 'إشعار', labelEn: 'Notification' }
 const verb = ACTIONS[action] || { verbAr: action, verbEn: action }
 return { ...base, ...verb }
}

function isWorthNotifying(type, action) {
 return (ACTIVITY_TYPES[type] || type === 'users' || type === 'system') && ACTIONS[action]
}

export function useNotifications(user) {
 const [notifications, setNotifications] = useState([])
 const [unreadCount, setUnreadCount] = useState(0)
 const lastSeenRef = useRef(Date.now())
 const studentId = user?.studentId || 'anon'

 const getLastVisitKey = useCallback(() => `al_azher_last_visit_${studentId}`, [studentId])

 const loadRecent = useCallback(async () => {
  try {
   // Uses the SECURITY DEFINER get_notifications_feed RPC, which exposes only
   // type/action/detail/timestamp — never studentId/name/ip/device. Directly
   // reading the activity table is admin-only under RLS.
   const { data, error } = await getSupabase()
    .rpc('get_notifications_feed', { p_limit: 30 })
   if (error) return
   const items = (data || [])
    .filter(n => isWorthNotifying(n.type, n.action))
    .map(n => ({ ...n, meta: getActivityMeta(n.type, n.action) }))
   setNotifications(items)
   let lastVisit = parseInt(localStorage.getItem(getLastVisitKey()) || '0', 10)
   if (!lastVisit) {
    lastVisit = Date.now()
    localStorage.setItem(getLastVisitKey(), String(lastVisit))
   }
   const unread = items.filter(n => {
    const ts = new Date(n.timestamp).getTime()
    return ts > lastVisit
   }).length
   setUnreadCount(unread)
  } catch { /* silent */ }
 }, [getLastVisitKey])

 const markAsRead = useCallback(() => {
  lastSeenRef.current = Date.now()
  localStorage.setItem(getLastVisitKey(), String(lastSeenRef.current))
  setUnreadCount(0)
 }, [getLastVisitKey])

 useEffect(() => {
  if (!user) return
  loadRecent()
  // Poll instead of subscribing to realtime: realtime on `activity` is
  // admin-only under RLS and would leak PII if opened to students.
  // Only poll while the tab is visible — hidden tabs skip the network call.
  const loadIfVisible = () => {
   if (document.visibilityState === 'visible') loadRecent()
  }
  const interval = setInterval(loadIfVisible, 60000)
  document.addEventListener('visibilitychange', loadIfVisible)
  return () => {
   clearInterval(interval)
   document.removeEventListener('visibilitychange', loadIfVisible)
  }
 }, [loadRecent, user])

 return { notifications, unreadCount, markAsRead, refresh: loadRecent }
}
