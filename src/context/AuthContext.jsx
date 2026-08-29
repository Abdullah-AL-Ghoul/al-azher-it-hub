import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { authenticateUser, registerUser, addStudentLog, getSessionUser, findOrCreateOAuthUser, signOut as supabaseSignOut } from '../services'
import { getSupabase } from '../services/supabase'
import { RateLimitService } from '../services/rateLimitService'

const STORAGE_KEY = 'al_azher_session'

const AuthContext = createContext()

function saveSession(userData) {
 try {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
 } catch (_e) { /* silent */ }
}

export function AuthProvider({ children }) {
 const stored = (() => {
  try {
   const s = sessionStorage.getItem(STORAGE_KEY)
   return s ? JSON.parse(s) : null
  } catch { return null }
 })()
   const [user, setUser] = useState(null)
   const [loading, setLoading] = useState(true)
   const userRef = useRef(null)
   useEffect(() => { userRef.current = user }, [user])

 useEffect(() => {
  let mounted = true

  async function restoreSession() {
   try {
    const { data: { session } } = await getSupabase().auth.getSession()
    if (session?.user) {
     const sid = session.user.user_metadata?.studentId
      || session.user.email?.split('@')[0]
     let dbUser = null
     if (sid) {
      dbUser = await getSessionUser(sid)
     }
     if (!dbUser) {
      dbUser = await findOrCreateOAuthUser(session.user)
     }
     if (!mounted) return
     if (dbUser) {
      setUser({
       role: dbUser.role || 'student',
       name: dbUser.name,
       studentId: dbUser.studentId,
       major: dbUser.major || '',
       google: dbUser.google || '',
       linkedin: dbUser.linkedin || '',
       whatsapp: dbUser.whatsapp || '',
       lastVisit: dbUser.lastVisit || null,
       lastIP: dbUser.lastIP || null,
       email: dbUser.email || '',
      })
      setLoading(false)
      return
     }
    }
   } catch (_e) { /* fallback to sessionStorage */ }

   if (stored?.studentId) {
    try {
     const dbUser = await getSessionUser(stored.studentId)
     if (!mounted) return
     if (!dbUser) {
      sessionStorage.removeItem(STORAGE_KEY)
      setUser(null)
     } else {
      const corrected = {
       ...stored,
       role: dbUser.role || 'student',
       name: dbUser.name || stored.name,
       major: dbUser.major || stored.major,
       google: dbUser.google || stored.google,
       linkedin: dbUser.linkedin || stored.linkedin,
       whatsapp: dbUser.whatsapp || stored.whatsapp,
       email: dbUser.email || stored.email || '',
      }
      setUser(corrected)
      saveSession(corrected)
     }
    } catch (_error) {
     if (!mounted) return
     // Network failure: keep the cached identity for offline browsing, but
     // never restore the admin role from cache — it must be re-verified
     // online, or a suspended/demoted admin would keep the admin UI.
     setUser({ ...stored, role: stored.role === 'admin' ? 'student' : stored.role })
    } finally {
     if (mounted) setLoading(false)
    }
    return
   }
   setLoading(false)
  }

  restoreSession()
  return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep React state in sync with the real Supabase session. When the token
  // expires, is revoked, or the user signs out elsewhere, clear the local user
  // so ProtectedRoute stops trusting a stale/privileged cached session.
  useEffect(() => {
   let sub
   try {
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
     if (!session) {
      setUser(null)
      setLoading(false)
      try { sessionStorage.removeItem(STORAGE_KEY) } catch (_e) { /* ignore */ }
     }
    })
    sub = subscription
   } catch (_e) { /* supabase may not be configured */ }
   return () => { if (sub) { try { sub.unsubscribe() } catch (_e) { /* ignore */ } } }
  }, [])

 const login = useCallback(async (studentId, password) => {
  // Client-side soft limiter mirrors the server policy (10 attempts / 15 min
  // per account) so the UX and the DB agree on the retry window.
  const loginAttempts = JSON.parse(sessionStorage.getItem('login_attempts') || '{}')
  const now = Date.now()
  const WINDOW_MS = 15 * 60 * 1000
  const MAX_ATTEMPTS = 10
  const attemptData = loginAttempts[studentId] || { count: 0, resetTime: now + WINDOW_MS }

  if (now > attemptData.resetTime) {
   attemptData.count = 0
   attemptData.resetTime = now + WINDOW_MS
  }

  if (attemptData.count >= MAX_ATTEMPTS) {
   const retryAfter = Math.ceil((attemptData.resetTime - now) / 1000)
   return { ok: false, error: 'TOO_MANY_ATTEMPTS', retryAfter }
  }

   try {
    const result = await authenticateUser(studentId, password)

    if (result.ok) {
     const { role } = result.user

     if (role === 'admin') {
      const adminUser = {
       role: 'admin',
       name: result.user.name,
       studentId: result.user.studentId,
      }
      setUser(adminUser)
      saveSession(adminUser)
      delete loginAttempts[studentId]
      sessionStorage.setItem('login_attempts', JSON.stringify(loginAttempts))
      return { ok: true, user: adminUser }
     } else {
      const studentUser = {
       role: 'student',
       name: result.user.name,
       studentId: result.user.studentId,
       major: result.user.major || '',
       google: result.user.google || '',
       linkedin: result.user.linkedin || '',
       whatsapp: result.user.whatsapp || '',
       lastVisit: result.user.lastVisit || null,
       lastIP: result.user.lastIP || null,
      }
      setUser(studentUser)
      saveSession(studentUser)
      delete loginAttempts[studentId]
      sessionStorage.setItem('login_attempts', JSON.stringify(loginAttempts))
      return { ok: true, user: studentUser }
     }
    }

    if (result.error === 'TOO_MANY_ATTEMPTS') {
     // Server-side throttle enforced; surface without double-counting.
     // Both client and server use the same 15-minute window.
     return { ok: false, error: 'TOO_MANY_ATTEMPTS', retryAfter: 900 }
    }

    attemptData.count += 1
    loginAttempts[studentId] = attemptData
    sessionStorage.setItem('login_attempts', JSON.stringify(loginAttempts))

    return result
   } catch (error) {
    if (String(error?.message || error?.code || '').includes('TOO_MANY_ATTEMPTS')) {
     return { ok: false, error: 'TOO_MANY_ATTEMPTS', retryAfter: 900 }
    }
    return { ok: false, error: 'LOGIN_ERROR' }
   }
 }, [])

 const signup = useCallback(async (name, studentId, password, major = '', email = '') => {
  try {
   const result = await registerUser({ name, studentId, password, major, email })
   if (result.ok) {
    if (result.needsConfirmation) {
     return result
    }
    const studentUser = {
     role: 'student',
     name: result.user.name,
     studentId: result.user.studentId,
     major: result.user.major || ''
    }
    setUser(studentUser)
    saveSession(studentUser)
    addStudentLog({
     type: 'REGISTER',
     detail: '',
     device: navigator.userAgent,
    }).catch(() => {})
   }
   return result
  } catch (error) {
   // Signup failures are returned in `result` and surfaced generically by the
   // page; never log the raw error (may contain server internals).
   return { ok: false, error: 'SIGNUP_ERROR', detail: error?.message }
  }
 }, [])

 const updateUser = useCallback((fields) => {
  setUser(prev => {
   const next = { ...(prev || {}), ...fields }
   if (next.studentId) saveSession(next)
   return next
  })
 }, [])

 const logout = useCallback(async () => {
  const sid = userRef.current?.studentId
  setUser(null)
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem('login_attempts')
  sessionStorage.removeItem('al_azher_just_auth')
  if (sid) RateLimitService.cleanup(sid)
  try { await supabaseSignOut() } catch (_e) { /* session may already be gone */ }
 }, [])

const value = useMemo(() => ({
   user,
   loading,
   login,
   signup,
   logout,
   updateUser,
   isAdmin: user?.role === 'admin'
  }), [user, loading, login, signup, logout, updateUser])

 return (
  <AuthContext.Provider value={value}>
   {children}
  </AuthContext.Provider>
 )
}

export const useAuth = () => useContext(AuthContext)
