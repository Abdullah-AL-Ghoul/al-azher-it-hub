const UNSAFE_SCHEME_RE = /\b(?:javascript|vbscript|data):/gi
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi

export function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return str
  const cleaned = str
    .replace(/<[^>]*>/g, '')
    .replace(UNSAFE_SCHEME_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return cleaned.trim().slice(0, maxLength)
}

export function sanitizeObject(obj, fields) {
  if (!obj || typeof obj !== 'object') return obj
  const clean = { ...obj }
  for (const f of fields) {
    if (typeof clean[f] === 'string') clean[f] = sanitizeString(clean[f])
  }
  return clean
}

const DANGEROUS_PROTOCOL_RE = /^(?:javascript|data|vbscript|file):/i

/**
 * Validates whether a given URL is safe to navigate to or render as an external href.
 * Blocks dangerous schemes (javascript:, data:, vbscript:, file:) while allowing
 * https:, http:, mailto:, tel:, and safe in-app relative/hash paths.
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false

  if (DANGEROUS_PROTOCOL_RE.test(trimmed)) return false

  if (trimmed.startsWith('#') || (trimmed.startsWith('/') && !trimmed.startsWith('//'))) {
    return true
  }

  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://al-azher-it-hub.vercel.app'
    const parsed = new URL(trimmed, base)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch (_e) {
    return false
  }
}

/**
 * Returns the URL if safe, or a fallback safe URL (defaults to '#')
 */
export function sanitizeUrl(url, fallback = '#') {
  return isSafeUrl(url) ? url.trim() : fallback
}
