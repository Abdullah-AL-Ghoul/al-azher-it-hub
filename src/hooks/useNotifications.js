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
 const channelRef = useRef(null)
 const studentId = user?.studentId || 'anon'

 const getLastVisitKey = useCallback(() => `al_azher_last_visit_${studentId}`, [studentId])

 const loadRecent = useCallback(async () => {
  try {
   const { data, error } = await getSupabase()
    .from('activity')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(30)
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
  loadRecent()

  try {
   const supabase = getSupabase()
   const channel = supabase
    .channel('activity-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, (payload) => {
     const n = payload.new
     if (!isWorthNotifying(n.type, n.action)) return
     const newItem = { ...n, meta: getActivityMeta(n.type, n.action) }
     setNotifications(prev => [newItem, ...prev].slice(0, 30))
     setUnreadCount(prev => prev + 1)
    })
    .subscribe()
   channelRef.current = channel
  } catch { /* silent */ }

  const interval = setInterval(loadRecent, 60000)
  return () => {
   clearInterval(interval)
   if (channelRef.current) {
    try { getSupabase().removeChannel(channelRef.current) } catch { /* silent */ }
   }
  }
 }, [loadRecent])

 return { notifications, unreadCount, markAsRead, refresh: loadRecent }
}