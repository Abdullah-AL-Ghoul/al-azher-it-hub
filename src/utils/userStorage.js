/**
 * User-scoped localStorage key isolation utility.
 * Prevents cross-account PII and academic state leakage on shared university lab computers.
 */

/**
 * Resolves a user-scoped localStorage key for a given base key and student identifier.
 * @param {string} baseKey - The base localStorage key name
 * @param {string| number | { studentId?: string, id?: string } | null | undefined} [userOrStudentId]
 * @returns {string} Scoped storage key (e.g., `${baseKey}_${studentId}` or `${baseKey}_guest`)
 */
export function getUserStorageKey(baseKey, userOrStudentId) {
  const cleanBase = String(baseKey || '').trim()
  if (!cleanBase) return 'al_azher_storage_guest'

  let resolvedId = ''
  if (userOrStudentId && typeof userOrStudentId === 'object') {
    resolvedId = String(userOrStudentId.studentId || userOrStudentId.id || '').trim()
  } else if (userOrStudentId !== null && userOrStudentId !== undefined) {
    resolvedId = String(userOrStudentId).trim()
  }

  const scope = resolvedId ? resolvedId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest'
  return `${cleanBase}_${scope}`
}

/**
 * Safely reads a user-scoped string value from localStorage.
 * @param {string} baseKey
 * @param {string | object | null | undefined} userOrStudentId
 * @returns {string | null}
 */
export function getUserStorageItem(baseKey, userOrStudentId) {
  try {
    const key = getUserStorageKey(baseKey, userOrStudentId)
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Safely writes a user-scoped string value to localStorage.
 * @param {string} baseKey
 * @param {string | object | null | undefined} userOrStudentId
 * @param {string} value
 */
export function setUserStorageItem(baseKey, userOrStudentId, value) {
  try {
    const key = getUserStorageKey(baseKey, userOrStudentId)
    localStorage.setItem(key, value)
  } catch {
    // Ignore quota/security errors
  }
}

/**
 * Safely removes a user-scoped key from localStorage.
 * @param {string} baseKey
 * @param {string | object | null | undefined} userOrStudentId
 */
export function removeUserStorageItem(baseKey, userOrStudentId) {
  try {
    const key = getUserStorageKey(baseKey, userOrStudentId)
    localStorage.removeItem(key)
  } catch {
    // Ignore security errors
  }
}
