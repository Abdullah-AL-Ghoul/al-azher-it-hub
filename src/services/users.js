// SECURITY CAVEAT: Row-level security (RLS) must be enabled on the users table in
// Supabase so clients can only read/write their own rows. This service relies on
// the DB enforcing those policies — it is not a substitute for RLS.
import { getSupabase } from './supabase'
import { hashPassword, hashPasswordLegacy, generateSalt } from '../utils/crypto'
import { nowISO } from '../utils/helpers'
import { safeActivity } from './activity'

const USER_COLS = 'studentId, name, role, email, major, google, linkedin, whatsapp, status, "lastVisit", "createdAt"'

const DUMMY_SALT = '0123456789abcdef0123456789abcdef'

function pickPreferredProfile(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null
  return rows.find(r => (r.role || 'student') === 'admin') || rows[0]
}

export async function getUsers() {
  const { data, error } = await getSupabase().from('users').select(USER_COLS).limit(500)
  if (error) throw error
  return data || []
}

export async function getSessionUser(studentId) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('studentId, name, role, email, major, google, linkedin, whatsapp, "lastVisit", "lastIP"')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export async function findOrCreateOAuthUser(authUser) {
  if (!authUser?.id) return null

  const { data: byAuthId } = await getSupabase()
    .from('users')
    .select(USER_COLS)
    .eq('auth_user_id', authUser.id)
    .maybeSingle()
  if (byAuthId) {
    return { ...byAuthId, role: byAuthId.role || 'student' }
  }

  const email = authUser.email?.trim() || ''
  if (email) {
    const { data: byEmail } = await getSupabase()
      .from('users')
      .select(USER_COLS)
      .ilike('email', email)
      .maybeSingle()
    if (byEmail) {
      await linkAuthUser(byEmail.studentId)
      return { ...byEmail, role: byEmail.role || 'student' }
    }
  }

  const salt = generateSalt()
  const hashedPw = await hashPassword(`oauth-${Date.now()}-${Math.random()}`, salt)
  const newUser = {
    name: authUser.user_metadata?.name
      || authUser.user_metadata?.full_name
      || authUser.email?.split('@')[0]
      || 'OAuth User',
    studentId: `oauth_${Date.now().toString(36)}`,
    email,
    major: '',
    role: 'student',
    status: 'active',
    password: `${salt}:${hashedPw}`,
    createdAt: nowISO(),
    auth_user_id: authUser.id,
  }
  const { error } = await getSupabase().from('users').insert(newUser)
  if (error) throw error
  await safeActivity('users', 'REGISTER', newUser.name)
  return { ...newUser, role: newUser.role || 'student' }
}

function authEmail(studentId) {
  return `${studentId}@al-azher.local`
}

export async function registerUser(user) {
  if (!user?.name?.trim()) return { ok: false, error: 'NAME_REQUIRED' }
  if (!user?.studentId?.trim()) return { ok: false, error: 'STUDENT_ID_REQUIRED' }
  if (!user?.password || user.password.length < 6) return { ok: false, error: 'PASSWORD_TOO_SHORT' }

  const { data: existing, error: checkError } = await getSupabase()
    .from('users')
    .select('studentId')
    .eq('studentId', user.studentId.trim())
    .maybeSingle()
  if (checkError) throw checkError
  if (existing) {
    return { ok: false, error: 'STUDENT_ID_EXISTS' }
  }

  const realEmail = user.email?.trim()
  const authAccountEmail = realEmail && realEmail.includes('@')
    ? realEmail
    : authEmail(user.studentId.trim())

  const { data: authData, error: authError } = await getSupabase().auth.signUp({
    email: authAccountEmail,
    password: user.password,
    options: { data: { studentId: user.studentId.trim(), name: user.name.trim() } },
  })
  if (authError) {
    const code = authError.code || authError.status || ''
    if (String(code).includes('rate_limit') || String(code) === 'over_email_send_rate_limit') {
      return { ok: false, error: 'EMAIL_RATE_LIMIT' }
    }
    throw authError
  }

  const salt = generateSalt()
  const hashedPw = await hashPassword(user.password, salt)
  const newUser = {
    name: user.name.trim(),
    studentId: user.studentId.trim(),
    email: realEmail || '',
    major: user.major?.trim() || '',
    role: 'student',
    status: 'active',
    password: `${salt}:${hashedPw}`,
    createdAt: nowISO(),
    auth_user_id: authData.user?.id || null,
  }
  const { error } = await getSupabase().from('users').insert(newUser)
  if (error) {
    try { await getSupabase().auth.signOut() } catch (_err) { /* ignore */ }
    throw error
  }
  await safeActivity('users', 'REGISTER', user.name)

  const sessionCreated = !!authData.session
  if (!sessionCreated) {
    return { ok: true, user: newUser, needsConfirmation: true }
  }
  return { ok: true, user: newUser }
}

async function tryAuthSignIn(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error?.code === 'email_not_confirmed') return { emailNotConfirmed: true }
  if (!error && data?.user) return { authData: data }
  return { authData: null }
}

async function ensureAuthLinked(userRow, password) {
  try {
    // Only run the one-time migration when this legacy row has no auth link, and
    // only create a supabase auth account if one doesn't already exist. Guards
    // against re-signing-up (and rate limiting) on every login.
    if (userRow.auth_user_id) return
    const email = authEmail(userRow.studentId)
    const { data: signInData } = await getSupabase().auth.signInWithPassword({ email, password })
    if (signInData?.user) {
      await linkAuthUser(userRow.studentId)
      return
    }
    const { data: signUpData } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { studentId: userRow.studentId, name: userRow.name } },
    })
    if (signUpData?.user?.id) await linkAuthUser(userRow.studentId)
  } catch (_e) { /* migration best-effort */ }
}

export async function authenticateUser(studentIdOrEmail, password) {
  const trimmed = studentIdOrEmail.trim()
  const isEmail = trimmed.includes('@')

  if (isEmail) {
    const signIn = await tryAuthSignIn(trimmed, password)
    if (signIn.emailNotConfirmed) return { ok: false, error: 'EMAIL_NOT_CONFIRMED' }
    if (signIn.authData?.user) {
      const [{ data: profile }, { data: profilesByEmail }] = await Promise.all([
        getSupabase().from('users').select(USER_COLS).eq('auth_user_id', signIn.authData.user.id).maybeSingle(),
        getSupabase().from('users').select(USER_COLS).ilike('email', trimmed).limit(4),
      ])
      const profileByEmail = pickPreferredProfile(profilesByEmail)
      if (profile) {
        await linkAuthUser(profile.studentId)
        return { ok: true, user: { ...profile, role: profile.role || 'student' } }
      }
      if (profileByEmail) {
        await linkAuthUser(profileByEmail.studentId)
        return { ok: true, user: { ...profileByEmail, role: profileByEmail.role || 'student' } }
      }
      return { ok: false, error: 'INVALID_CREDENTIALS' }
    }
    const { data: profilesByEmail } = await getSupabase().from('users').select(USER_COLS).ilike('email', trimmed).limit(4)
    const profileByEmail = pickPreferredProfile(profilesByEmail)
    if (!profileByEmail) {
      await hashPassword(password, DUMMY_SALT)
      return { ok: false, error: 'INVALID_CREDENTIALS' }
    }
    const pwOk = await verifyPassword(profileByEmail.studentId, password)
    if (!pwOk) return { ok: false, error: 'INVALID_CREDENTIALS' }
    await ensureAuthLinked(profileByEmail, password)
    return { ok: true, user: { ...profileByEmail, role: profileByEmail.role || 'student' } }
  }

  const { data: lookupUser } = await getSupabase().from('users').select(`${USER_COLS}, auth_user_id`).eq('studentId', trimmed).maybeSingle()
  if (!lookupUser) {
    await hashPassword(password, DUMMY_SALT)
    return { ok: false, error: 'INVALID_CREDENTIALS'
    }
  }
  const candidateEmails = []
  if (lookupUser.email?.includes('@')) candidateEmails.push(lookupUser.email.trim())
  candidateEmails.push(authEmail(trimmed))
  for (const candidate of candidateEmails) {
    const r = await tryAuthSignIn(candidate, password)
    if (r.emailNotConfirmed) return { ok: false, error: 'EMAIL_NOT_CONFIRMED' }
    if (r.authData?.user) {
      await linkAuthUser(trimmed)
      return { ok: true, user: { ...lookupUser, role: lookupUser.role || 'student' } }
    }
  }
  const pwOk = await verifyPassword(lookupUser.studentId, password)
  if (!pwOk) return { ok: false, error: 'INVALID_CREDENTIALS' }
  await ensureAuthLinked(lookupUser, password)
  return { ok: true, user: { ...lookupUser, role: lookupUser.role || 'student' } }
}

async function verifyPassword(studentId, password) {
  const { data: salt, error: saltError } = await getSupabase().rpc('get_password_salt', {
    p_student_id: studentId,
  })
  if (saltError) throw saltError
  if (salt === null || salt === undefined) return false

  let candidate
  if (salt === '') {
    candidate = await hashPasswordLegacy(password)
  } else {
    candidate = await hashPassword(password, salt)
  }

  const { data, error } = await getSupabase().rpc('verify_password', {
    p_student_id: studentId,
    p_candidate_hash: candidate,
  })
  if (error) throw error
  return !!data
}

async function linkAuthUser(studentId) {
  const { error } = await getSupabase().rpc('link_auth_user', {
    p_student_id: studentId,
  })
  if (error) {
    console.warn('link_auth_user failed:', error.message)
  }
}

export async function resetPassword(studentId, newPassword, opts = {}) {
  const salt = generateSalt()
  const hashedPw = await hashPassword(newPassword, salt)
  const newHashed = `${salt}:${hashedPw}`

  if (opts.asAdmin) {
    const { error: rpcError } = await getSupabase().rpc('reset_password', {
      p_student_id: studentId,
      p_new_hashed: newHashed,
    })
    if (rpcError) throw rpcError
  } else {
    const { error: rpcError } = await getSupabase().rpc('reset_password', {
      p_student_id: studentId,
      p_new_hashed: newHashed,
      p_email: opts.email || '',
    })
    if (rpcError) throw rpcError
  }

  await safeActivity('users', 'RESET_PASSWORD', studentId)
  return { ok: true }
}

export async function signOut() {
  await getSupabase().auth.signOut()
}

export async function verifyStudent(studentId) {
  const { data, error } = await getSupabase()
    .from('users')
    .select(USER_COLS)
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return { exists: !!data, name: data?.name || null, email: data?.email || '' }
}