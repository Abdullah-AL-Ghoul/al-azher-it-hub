/**
 * Unified error normalization for the data layer.
 *
 * Services throw raw Supabase/PostgREST errors; UI components should never
 * render `error.message` directly because it can leak internal details
 * (table names, RLS policies, SQL hints) and is English-only. Pass raw errors
 * through `getErrorMessage`/`normalizeSupabaseError` instead.
 *
 * @typedef {'NETWORK'|'PERMISSION'|'DUPLICATE'|'NOT_FOUND'|'RATE_LIMIT'|'AUTH'|'GENERIC'} ErrorCategory
 *
 * @typedef {Object} NormalizedError
 * @property {ErrorCategory} category
 * @property {string} message User-facing, already localized
 * @property {boolean} retryable Whether a retry plausibly helps
 */

const MESSAGES = {
  NETWORK: {
    ar: 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',
    en: "Couldn't reach the server. Check your connection and try again.",
  },
  PERMISSION: {
    ar: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
    en: "You don't have permission to perform this action.",
  },
  DUPLICATE: {
    ar: 'هذا العنصر موجود بالفعل.',
    en: 'This item already exists.',
  },
  NOT_FOUND: {
    ar: 'العنصر المطلوب غير موجود أو تم حذفه.',
    en: "The requested item doesn't exist or was removed.",
  },
  RATE_LIMIT: {
    ar: 'محاولات كثيرة جداً. انتظر قليلاً ثم أعد المحاولة.',
    en: 'Too many attempts. Wait a moment and try again.',
  },
  AUTH: {
    ar: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
    en: 'Your session has expired. Please sign in again.',
  },
  GENERIC: {
    ar: 'حدث خطأ غير متوقع. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم.',
    en: 'Something went wrong. Try again, or contact support if it persists.',
  },
}

const NO_RETRY = new Set(['PERMISSION', 'DUPLICATE', 'NOT_FOUND'])

/**
 * @param {*} error Anything thrown or a Supabase PostgrestError object
 * @returns {ErrorCategory}
 */
export function classifyError(error) {
  if (!error) return 'GENERIC'
  const msg = String(error.message || error.code || error.details || error.hint || '')
  if (/failed to fetch|networkerror|load failed|fetch failed|err_network|err_internet/i.test(msg)) return 'NETWORK'
  if (/too_many_attempts|rate_limit|too many requests|429/i.test(msg)) return 'RATE_LIMIT'
  if (/42501|row-level security|permission denied|insufficient_privilege/i.test(msg)) return 'PERMISSION'
  if (/23505|duplicate key|unique constraint|already exists/i.test(msg)) return 'DUPLICATE'
  if (/pgrst116|not found|does not exist|no rows/i.test(msg)) return 'NOT_FOUND'
  if (/jwt|session missing|invalid claim|401|auth_session_missing|refresh_token/i.test(msg)) return 'AUTH'
  return 'GENERIC'
}

/**
 * @param {*} error
 * @param {'ar'|'en'} lang
 * @returns {NormalizedError}
 */
export function normalizeSupabaseError(error, lang = 'ar') {
  const category = classifyError(error)
  const localized = MESSAGES[category]
  return {
    category,
    message: lang === 'en' ? localized.en : localized.ar,
    retryable: !NO_RETRY.has(category),
  }
}

/**
 * Convenience for toast/inline messages: returns just the localized text.
 * @param {*} error
 * @param {'ar'|'en'} lang
 * @returns {string}
 */
export function getErrorMessage(error, lang = 'ar') {
  return normalizeSupabaseError(error, lang).message
}
