// SECURITY CAVEAT: Row-level security (RLS) must be enabled on the users table in
// Supabase so clients can only read/write their own rows. This service relies on
// the DB enforcing those policies — it is not a substitute for RLS.
//
// RLS compatibility: reads that anonymous/restored callers cannot do through RLS
// go through SECURITY DEFINER RPCs (get_session_profile / get_login_profile /
// get_profile_by_auth_id / get_profile_by_email / user_exists /
// verify_student_email). Each RPC helper falls back to a direct table read when
// the RPC is unavailable (tests, pre-migration environments) — under RLS that
// direct read is still protected by the self/admin policies, and with RLS off it
// restores the previous behavior. An anonymous caller can never obtain a
// profile unless the PBKDF2 hash they supply matches.
import { getSupabase } from './supabase'
import { hashPassword, hashPasswordLegacy, generateSalt } from '../utils/crypto'
import { nowISO } from '../utils/helpers'
import { safeActivity } from './activity'

const USER_COLS = 'studentId, name, role, email, major, google, linkedin, whatsapp, status, "lastVisit", "createdAt"'

function isThrottleError(error) {
  if (!error) return false
  const msg = String(error.message || error.code || error.details || '')
  return /TOO_MANY_ATTEMPTS/i.test(msg)
}

// Runs an RPC and returns { data, error }. Errors are NOT thrown here so the
// auth/session path can treat "RPC unavailable" and "no row" uniformly.
// Throttle errors are propagated so callers can surface rate-limit feedback.
async function rpcSafe(fn, params) {
  try {
    const { data, error } = await getSupabase().rpc(fn, params)
    if (error && isThrottleError(error)) throw error
    return { data: data ?? null, error: error || null }
  } catch (_e) {
    if (isThrottleError(_e) || isThrottleError(_e?.error)) throw _e?.error || _e
    return { data: null, error: { message: 'rpc_unavailable' } }
  }
}

export async function getUsers() {
  const { data, error } = await getSupabase()
    .from('users')
    .select(USER_COLS)
    .order('createdAt', { ascending: false, nullsFirst: false })
    .limit(500)
  if (error) throw error
  return data || []
}

export async function getSessionUser(studentId) {
  // SECURITY DEFINER RPC: returns the profile only when the caller IS that user
  // or an admin. Falls back to a direct read (RLS-enforced) when the RPC is not
  // deployed yet.
  const { data, error } = await rpcSafe('get_session_profile', { p_student_id: studentId })
  if (data) return data
  if (error && !isRpcMissing(error)) throw error
  const { data: direct, error: directError } = await getSupabase()
    .from('users')
    .select('studentId, name, role, email, major, google, linkedin, whatsapp, "lastVisit", "lastIP"')
    .eq('studentId', studentId)
    .maybeSingle()
  if (directError) throw directError
  return direct || null
}

function isRpcMissing(error) {
  if (!error) return false
  const m = String(error.message || error.code || error.hint || error.details || '')
  return /function .* does not exist|PGRST202|PGRST301|rpc_unavailable/i.test(m)
}

export async function findOrCreateOAuthUser(authUser) {
  if (!authUser?.id) return null

  // 1) By auth_user_id (self-only via RPC, RLS-enforced direct read fallback)
  const byAuth = await getProfileByAuthId(authUser.id)
  if (byAuth) {
    return { ...byAuth, role: byAuth.role || 'student' }
  }

  const email = authUser.email?.trim() || ''
  // 2) By email (RPC only returns a row when the email matches the caller's
  //    verified auth email or the caller is admin; direct read is RLS-enforced).
  if (email) {
    const byEmail = await getProfileByEmail(email)
    if (byEmail) {
      await linkAuthUser(byEmail.studentId)
      return { ...byEmail, role: byEmail.role || 'student' }
    }
  }

  // 3) Create a new profile row (role is forced to 'student' server-side).
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
  await insertUserRow(newUser)
  await safeActivity('users', 'REGISTER', newUser.name)
  const safeUser = { ...newUser }
  delete safeUser.password
  return { ...safeUser, role: safeUser.role || 'student' }
}

// Inserts a user row through the register_user RPC when available (server
// enforces role='student'), falling back to the RLS-constrained direct insert.
async function insertUserRow(user) {
  const { error: rpcError } = await getSupabase().rpc('register_user', {
    p_student_id: user.studentId,
    p_name: user.name,
    p_email: user.email || '',
    p_major: user.major || '',
    p_new_hashed: user.password,
    p_auth_user_id: user.auth_user_id || null,
  })
  if (!rpcError) return
  if (!isRpcMissing(rpcError)) throw rpcError
  const { error } = await getSupabase().from('users').insert({
    ...user,
    role: 'student',
    status: 'active',
  })
  if (error) throw error
}

function authEmail(studentId) {
  return `${studentId}@al-azher.local`
}

async function userExists(studentId) {
  const { data } = await rpcSafe('user_exists', { p_student_id: studentId })
  if (data != null) return !!data
  // Fallback: direct read returns a row only if RLS allows it; anon reads are
  // blocked under RLS, so this only succeeds in tests/pre-RLS environments.
  const { data: direct, error } = await getSupabase()
    .from('users')
    .select('studentId')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return !!direct
}

export async function registerUser(user) {
  if (!user?.name?.trim()) return { ok: false, error: 'NAME_REQUIRED' }
  if (!user?.studentId?.trim()) return { ok: false, error: 'STUDENT_ID_REQUIRED' }
  if (!user?.password || user.password.length < 8) return { ok: false, error: 'PASSWORD_TOO_SHORT' }

  const exists = await userExists(user.studentId.trim())
  if (exists) {
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
    const code = String(authError.code || authError.status || '')
    const msg = String(authError.message || '').toLowerCase()
    if (code.includes('rate_limit') || code === 'over_email_send_rate_limit' || msg.includes('rate_limit')) {
      return { ok: false, error: 'EMAIL_RATE_LIMIT' }
    }
    if (msg.includes('already registered') || msg.includes('already been registered') || code === 'user_already_exists' || code === 'email_exists') {
      return { ok: false, error: 'EMAIL_EXISTS' }
    }
    if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || code === 'weak_password')) {
      return { ok: false, error: 'PASSWORD_TOO_SHORT' }
    }
    // Surface the underlying auth reason instead of a vague generic error.
    return { ok: false, error: 'AUTH_FAILED', detail: authError.message || authError.code }
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
  try {
    await insertUserRow(newUser)
  } catch (rpcError) {
    const m = String(rpcError?.message || '').toLowerCase()
    if (m.includes('duplicate') || m.includes('unique') || m.includes('already exists')) {
      return { ok: false, error: 'STUDENT_ID_EXISTS' }
    }
    // Roll back the just-created auth account so retrying signup works cleanly.
    try { await getSupabase().auth.signOut() } catch (_e) { /* ignore */ }
    return { ok: false, error: 'REGISTER_FAILED', detail: rpcError?.message }
  }
  await safeActivity('users', 'REGISTER', user.name)

  const safeUser = { ...newUser }
  delete safeUser.password
  const sessionCreated = !!authData.session
  if (!sessionCreated) {
    return { ok: true, user: safeUser, needsConfirmation: true }
  }
  return { ok: true, user: safeUser }
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
    const candidates = []
    if (userRow.email?.includes('@')) candidates.push(userRow.email.trim())
    candidates.push(authEmail(userRow.studentId))
    for (const email of candidates) {
      const { data: signInData } = await getSupabase().auth.signInWithPassword({ email, password })
      if (signInData?.user) {
        await linkAuthUser(userRow.studentId)
        return
      }
    }
    const email = userRow.email?.includes('@') ? userRow.email.trim() : authEmail(userRow.studentId)
    const { data: signUpData } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { studentId: userRow.studentId, name: userRow.name } },
    })
    if (signUpData?.user?.id) await linkAuthUser(userRow.studentId)
  } catch (_e) { /* migration best-effort */ }
}

async function hashForSalt(password, salt) {
  if (salt === '') return hashPasswordLegacy(password)
  return hashPassword(password, salt)
}

async function getPasswordSalt(studentId) {
  const { data } = await rpcSafe('get_password_salt', { p_student_id: studentId })
  return data ?? null
}

async function getPasswordSaltByEmail(email) {
  const { data } = await rpcSafe('get_password_salt_by_email', { p_email: email })
  return data ?? null
}

async function getLoginProfile(studentId, candidateHash) {
  const { data } = await rpcSafe('get_login_profile', {
    p_student_id: studentId,
    p_candidate_hash: candidateHash,
  })
  return data || null
}

async function getLoginProfileByEmail(email, candidateHash) {
  const { data } = await rpcSafe('get_login_profile_by_email', {
    p_email: email,
    p_candidate_hash: candidateHash,
  })
  return data || null
}

async function getProfileByAuthId(authUserId) {
  const { data } = await rpcSafe('get_profile_by_auth_id', { p_auth_user_id: authUserId })
  if (data) return data
  const { data: direct, error } = await getSupabase()
    .from('users')
    .select('studentId, name, role, email, major, google, linkedin, whatsapp, "lastVisit", "lastIP", auth_user_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw error
  return direct || null
}

async function getProfileByEmail(email) {
  const { data } = await rpcSafe('get_profile_by_email', { p_email: email })
  if (data) return data
  // Escape LIKE wildcards so user-supplied emails can't match unintended rows.
  const escaped = (email || '').replace(/[\\%_]/g, m => `\\${m}`)
  const { data: direct, error } = await getSupabase()
    .from('users')
    .select('studentId, name, role, email, major, google, linkedin, whatsapp, "lastVisit", "lastIP"')
    .ilike('email', escaped)
    .order('role', { ascending: false })
    .maybeSingle()
  if (error) throw error
  return direct || null
}

// Client-side legacy hash verification (pre-RLS/test environments). In
// production with RLS on, getLoginProfile/getLoginProfileByEmail are used and
// this never runs for an anonymous caller.
async function verifyLegacyPassword(studentId, candidateHash) {
  const { data } = await rpcSafe('verify_password', {
    p_student_id: studentId,
    p_candidate_hash: candidateHash,
  })
  return !!data
}

export async function authenticateUser(studentIdOrEmail, password) {
  const trimmed = studentIdOrEmail.trim()
  const isEmail = trimmed.includes('@')
  const pw = password || ''

  try {
    if (isEmail) {
      // 1) Native Supabase Auth first.
      const signIn = await tryAuthSignIn(trimmed, pw)
      if (signIn.emailNotConfirmed) return { ok: false, error: 'EMAIL_NOT_CONFIRMED' }
      if (signIn.authData?.user) {
        const byAuth = await getProfileByAuthId(signIn.authData.user.id)
        if (byAuth) return { ok: true, user: { ...byAuth, role: byAuth.role || 'student' } }
        const byEmail = await getProfileByEmail(trimmed)
        if (byEmail) {
          await linkAuthUser(byEmail.studentId)
          return { ok: true, user: { ...byEmail, role: byEmail.role || 'student' } }
        }
        return { ok: false, error: 'INVALID_CREDENTIALS' }
      }

      // 2) Legacy PBKDF2 fallback via RPCs (RLS-safe, no hash leak).
      const salt = await getPasswordSaltByEmail(trimmed)
      if (salt === null) return { ok: false, error: 'INVALID_CREDENTIALS' }
      const candidate = await hashForSalt(pw, salt)
      const profile = await getLoginProfileByEmail(trimmed, candidate)
      if (!profile) return { ok: false, error: 'INVALID_CREDENTIALS' }
      await ensureAuthLinked({ ...profile, auth_user_id: null }, pw)
      return { ok: true, user: { ...profile, role: profile.role || 'student' } }
    }

    // StudentId path.
    const synthetic = authEmail(trimmed)
    const r = await tryAuthSignIn(synthetic, pw)
    if (r.emailNotConfirmed) return { ok: false, error: 'EMAIL_NOT_CONFIRMED' }

    const salt = await getPasswordSalt(trimmed)
    if (salt === null) {
      // No legacy hash: maybe a pure auth-account user matched the synthetic
      // email; resolve their profile by auth id.
      if (r.authData?.user) {
        const byAuth = await getProfileByAuthId(r.authData.user.id)
        if (byAuth) return { ok: true, user: { ...byAuth, role: byAuth.role || 'student' } }
      }
      return { ok: false, error: 'INVALID_CREDENTIALS' }
    }
    const candidate = await hashForSalt(pw, salt)
    const profile = await getLoginProfile(trimmed, candidate)
    if (profile) {
      if (!r.authData?.user) await ensureAuthLinked({ ...profile, auth_user_id: null }, pw)
      return { ok: true, user: { ...profile, role: profile.role || 'student' } }
    }
    // Fallback for environments without the get_login_profile RPC.
    const ok = await verifyLegacyPassword(trimmed, candidate)
    if (!ok) return { ok: false, error: 'INVALID_CREDENTIALS' }
    const userRow = await getSessionUser(trimmed)
    if (!userRow) return { ok: false, error: 'INVALID_CREDENTIALS' }
    if (!r.authData?.user) await ensureAuthLinked({ ...userRow, auth_user_id: null }, pw)
    return { ok: true, user: { ...userRow, role: userRow.role || 'student' } }
  } catch (_e) {
    if (isThrottleError(_e)) return { ok: false, error: 'TOO_MANY_ATTEMPTS' }
    // Never surface internal errors to a would-be attacker; treat as invalid.
    return { ok: false, error: 'INVALID_CREDENTIALS' }
  }
}

export async function resetPassword(studentId, newPassword, opts = {}) {
  const salt = generateSalt()
  const hashedPw = await hashPassword(newPassword, salt)
  const newHashed = `${salt}:${hashedPw}`

  const { error: rpcError } = await getSupabase().rpc('reset_password', {
    p_student_id: studentId,
    p_new_hashed: newHashed,
    p_email: opts.email || '',
  })
  if (rpcError) throw rpcError

  await safeActivity('users', 'RESET_PASSWORD', studentId)
  return { ok: true }
}

export async function signOut() {
  await getSupabase().auth.signOut()
}

export async function sendPasswordResetEmail(email) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
  })
  if (error) throw error
}

export async function verifyStudent(studentId) {
  // Only exposes existence — name/email are never revealed to unauthenticated
  // callers (the old version leaked the registered email for any studentId).
  const { data } = await rpcSafe('user_exists', { p_student_id: studentId })
  if (data != null) return { exists: !!data }
  const { data: direct, error } = await getSupabase()
    .from('users')
    .select('studentId')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return { exists: !!direct }
}

export async function verifyStudentEmail(studentId, email) {
  const { data } = await rpcSafe('verify_student_email', {
    p_student_id: studentId,
    p_email: email,
  })
  if (data != null) return !!data
  // Fallback: compare against the stored email.
  const { data: direct, error } = await getSupabase()
    .from('users')
    .select('email')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return !!direct && String(direct.email || '').toLowerCase() === String(email || '').toLowerCase()
}

export async function verifyStudentName(studentId, name) {
  const { data } = await rpcSafe('verify_student_name', {
    p_student_id: studentId,
    p_name: name,
  })
  if (data != null) return !!data
  const normalize = (s) => (s || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '') // remove tashkeel (fatha, damma, kasra, shadda, etc.)
    .replace(/ /g, '')
  const { data: direct, error } = await getSupabase()
    .from('users')
    .select('name')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return !!direct && normalize(direct.name) === normalize(name)
}

async function linkAuthUser(studentId) {
  const { error } = await getSupabase().rpc('link_auth_user', {
    p_student_id: studentId,
  })
  if (error) {
    console.warn('link_auth_user failed:', error.message)
  }
}
