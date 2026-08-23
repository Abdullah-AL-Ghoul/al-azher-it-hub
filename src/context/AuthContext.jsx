import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { authenticateUser, registerUser, addStudentLog, getSessionUser, findOrCreateOAuthUser, signOut as supabaseSignOut } from '../services'
import { getSupabase } from '../services/supabase'

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
  const [user, setUser] = useState(stored)
  const [loading, setLoading] = useState(!stored)

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
    setLoading(false)
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
      }
      setUser(corrected)
      saveSession(corrected)
     }
    } catch (_error) { /* keep cached session */ }
    return
   }
   setLoading(false)
  }

  restoreSession()
  return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

 const login = useCallback(async (studentId, password) => {
  const loginAttempts = JSON.parse(sessionStorage.getItem('login_attempts') || '{}')
  const now = Date.now()
  const attemptData = loginAttempts[studentId] || { count: 0, resetTime: now + 60000 }

  if (now > attemptData.resetTime) {
   attemptData.count = 0
   attemptData.resetTime = now + 60000
  }

  if (attemptData.count >= 5) {
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

   attemptData.count += 1
   loginAttempts[studentId] = attemptData
   sessionStorage.setItem('login_attempts', JSON.stringify(loginAttempts))

   return result
  } catch (error) {
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
     studentId: result.user.studentId,
     name: result.user.name,
     type: 'REGISTER',
     detail: 'تسجيل جديد',
     ip: '',
     device: navigator.userAgent,
    }).catch(() => {})
   }
   return result
  } catch (error) {
   return { ok: false, error: 'SIGNUP_ERROR' }
  }
 }, [])

 const logout = useCallback(async () => {
  setUser(null)
  sessionStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem('login_attempts')
  await supabaseSignOut()
 }, [])

const value = useMemo(() => ({
   user,
   loading,
   login,
   signup,
   logout,
   isAdmin: user?.role === 'admin'
  }), [user, loading, login, signup, logout])

 return (
  <AuthContext.Provider value={value}>
   {children}
  </AuthContext.Provider>
 )
}

export const useAuth = () => useContext(AuthContext)
