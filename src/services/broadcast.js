import { getSupabase, authRpc, isSupabaseConfigured } from './supabase'

const STORAGE_KEY = 'al_azher_broadcast_announcement'
const DISMISSED_KEY = 'al_azher_dismissed_broadcasts'
export const BROADCAST_EVENT = 'al_azher_broadcast_updated'

export const BROADCAST_TYPES = {
  urgent: {
    key: 'urgent',
    labelAr: 'تنبيه عاجل',
    labelEn: 'Urgent Alert',
    badgeAr: 'عاجل',
    badgeEn: 'URGENT',
    theme: 'rose',
    bgLight: 'bg-rose-50 border-rose-200 text-rose-900',
    bgDark: 'dark:bg-rose-950/60 dark:border-rose-800/60 dark:text-rose-100',
    accent: 'bg-rose-500 text-white',
  },
  academic: {
    key: 'academic',
    labelAr: 'إعلان أكاديمي',
    labelEn: 'Academic Announcement',
    badgeAr: 'أكاديمي',
    badgeEn: 'ACADEMIC',
    theme: 'royal',
    bgLight: 'bg-royal-50 border-royal-200 text-royal-950',
    bgDark: 'dark:bg-royal-950/60 dark:border-royal-800/60 dark:text-royal-100',
    accent: 'bg-royal-600 text-white',
  },
  celebration: {
    key: 'celebration',
    labelAr: 'تهنئة وفعاليات',
    labelEn: 'Celebration & Events',
    badgeAr: 'مميز',
    badgeEn: 'SPECIAL',
    theme: 'emerald',
    bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    bgDark: 'dark:bg-emerald-950/60 dark:border-emerald-800/60 dark:text-emerald-100',
    accent: 'bg-emerald-600 text-white',
  },
  info: {
    key: 'info',
    labelAr: 'تحديث وتوجيه',
    labelEn: 'Update & Guidance',
    badgeAr: 'إرشاد',
    badgeEn: 'INFO',
    theme: 'cyan',
    bgLight: 'bg-cyan-50 border-cyan-200 text-cyan-950',
    bgDark: 'dark:bg-cyan-950/60 dark:border-cyan-800/60 dark:text-cyan-100',
    accent: 'bg-cyan-600 text-white',
  },
}

export const DEFAULT_BROADCAST = {
  id: 'bc_academic_welcome_2026',
  active: true,
  type: 'academic',
  titleAr: 'إعلان أكاديمي: نظام ترجمة وتفريغ المحاضرات الذكي بالذكاء الاصطناعي متاح الآن لجميع الطلاب',
  titleEn: 'Academic Notice: AI Lecture Subtitles & Transcription System is Now Live',
  messageAr: 'تم تفعيل الترجمة النصية المتزامنة للمحاضرات بالذكاء الاصطناعي مع معجم المصطلحات الأكاديمية المعتمد.',
  messageEn: 'AI-synchronized multilingual lecture subtitles with accredited terminology glossary are now available for all students.',
  link: '/lectures',
  linkTextAr: 'استعراض المحاضرات',
  linkTextEn: 'Explore Lectures',
  dismissible: true,
  pinned: false,
  updatedAt: '2026-10-25T10:00:00.000Z',
  updatedBy: 'Dean of IT Faculty',
}

/**
 * Retrieves the currently configured broadcast from local storage
 * Falls back to DEFAULT_BROADCAST when no custom configuration is set.
 */
export function getBroadcast() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_BROADCAST }
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return { ...DEFAULT_BROADCAST }
    return data
  } catch {
    return { ...DEFAULT_BROADCAST }
  }
}

/**
 * Fetches the latest global broadcast from Supabase settings table
 */
export async function fetchBroadcastRemote() {
  try {
    if (!isSupabaseConfigured()) return getBroadcast()
    const { data, error } = await getSupabase()
      .from('settings')
      .select('value')
      .eq('key', 'broadcast')
      .maybeSingle()
    if (error) return getBroadcast()
    if (data?.value && typeof data.value === 'object') {
      const remote = data.value
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
      window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: remote }))
      return remote
    } else if (data && data.value === null) {
      const cleared = { id: 'cleared', active: false, cleared: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared))
      window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: cleared }))
      return cleared
    }
    return getBroadcast()
  } catch {
    return getBroadcast()
  }
}

/**
 * Saves a broadcast locally and dispatches update event.
 * If active, removes from dismissed list so user sees it immediately.
 */
export function saveBroadcast(broadcast) {
  try {
    const payload = {
      id: broadcast.id || `bc_${Date.now()}`,
      active: Boolean(broadcast.active),
      type: broadcast.type || 'academic',
      titleAr: broadcast.titleAr || '',
      titleEn: broadcast.titleEn || '',
      messageAr: broadcast.messageAr || '',
      messageEn: broadcast.messageEn || '',
      link: broadcast.link || '',
      linkTextAr: broadcast.linkTextAr || '',
      linkTextEn: broadcast.linkTextEn || '',
      dismissible: broadcast.dismissible !== false,
      pinned: Boolean(broadcast.pinned),
      updatedAt: new Date().toISOString(),
      updatedBy: broadcast.updatedBy || 'Admin',
    }

    if (payload.active) {
      try {
        const rawDismissed = localStorage.getItem(DISMISSED_KEY)
        if (rawDismissed) {
          const list = JSON.parse(rawDismissed)
          if (Array.isArray(list) && list.includes(payload.id)) {
            const filtered = list.filter((x) => x !== payload.id)
            localStorage.setItem(DISMISSED_KEY, JSON.stringify(filtered))
          }
        }
      } catch (_e) {
        // ignore
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: payload }))

    // Background sync to Supabase settings
    try {
      if (isSupabaseConfigured()) {
        authRpc('admin_save_setting', { p_key: 'broadcast', p_value: payload }).catch(() => {})
      }
    } catch (_e) {
      // ignore
    }

    return payload
  } catch (err) {
    console.error('Failed to save broadcast:', err)
    return null
  }
}

/**
 * Async save that guarantees Supabase settings synchronization
 */
export async function saveBroadcastRemote(broadcast) {
  const payload = saveBroadcast(broadcast)
  if (!payload) return null
  try {
    if (isSupabaseConfigured()) {
      await authRpc('admin_save_setting', { p_key: 'broadcast', p_value: payload })
    }
  } catch (err) {
    console.warn('Failed to sync broadcast to Supabase:', err)
  }
  return payload
}

/**
 * Toggles or updates active state
 */
export function toggleBroadcastActive(active) {
  const current = getBroadcast()
  if (!current) return null
  return saveBroadcast({ ...current, active })
}

/**
 * Completely clears the broadcast locally and on Supabase.
 * Sets active to false so default fallback doesn't re-trigger until explicitly restored.
 */
export function clearBroadcast() {
  try {
    const cleared = {
      id: 'cleared',
      active: false,
      cleared: true,
      titleAr: '',
      titleEn: '',
      messageAr: '',
      messageEn: '',
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared))
    window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: cleared }))
    if (isSupabaseConfigured()) {
      authRpc('admin_save_setting', { p_key: 'broadcast', p_value: null }).catch(() => {})
    }
    return cleared
  } catch (err) {
    console.error('Failed to clear broadcast:', err)
  }
}

/**
 * Restores the default academic broadcast announcement
 */
export function restoreDefaultBroadcast() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(DISMISSED_KEY)
    return saveBroadcast(DEFAULT_BROADCAST)
  } catch (err) {
    console.error('Failed to restore default broadcast:', err)
    return DEFAULT_BROADCAST
  }
}

/**
 * Checks if a broadcast ID has been dismissed by the student in this browser
 */
export function isBroadcastDismissed(id) {
  if (!id) return false
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const list = JSON.parse(raw)
    return Array.isArray(list) && list.includes(id)
  } catch {
    return false
  }
}

/**
 * Dismisses a broadcast for this browser session
 */
export function dismissBroadcast(id) {
  if (!id) return
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const list = raw ? JSON.parse(raw) : []
    const updated = Array.from(new Set([...(Array.isArray(list) ? list : []), id]))
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to dismiss broadcast:', err)
  }
}
