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
