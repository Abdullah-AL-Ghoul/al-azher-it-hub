export const MAX_FILE_SIZE = 100 * 1024 * 1024

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
]

export const STORAGE_BUCKET = 'sources'

import { getSupabase } from './supabase'

function sanitizeFileName(name) {
  return name.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(0, 80)
}

export async function uploadSourceFile(file, onProgress) {
  const supabase = getSupabase()

  onProgress?.({ progress: 5, file: file.name, status: 'uploading' })

  const safeName = sanitizeFileName(file.name)
  const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  const filePath = `${uid}_${safeName}`

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (error) {
    throw new Error(error.message || 'Supabase upload failed')
  }

  onProgress?.({ progress: 90, file: file.name, status: 'uploading' })

  const { data: urlData, error: urlError } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error(urlError?.message || 'Could not build public URL')
  }

  onProgress?.({ progress: 100, file: file.name, status: 'success' })

  return {
    name: file.name,
    size: file.size,
    mimeType: file.type,
    url: urlData.publicUrl,
    path: data.path,
    storage: 'supabase',
    uploadedAt: new Date().toISOString(),
  }
}

// Signed-URL cache: path → { url, expiresAt }. Signed URLs live for one
// hour; anything cached within a 10-minute safety margin of expiry is
// refreshed, so a long-lived page never hands out a dead link.
const SIGNED_TTL_SECONDS = 3600
const signedCache = new Map()

export async function getSignedSourceUrls(paths) {
  const supabase = getSupabase()
  const now = Date.now()
  const freshEnough = (expiresAt) => expiresAt - now > 10 * 60 * 1000

  const result = {}
  const missing = []
  for (const raw of paths) {
    const p = String(raw || '')
    if (!p) continue
    const hit = signedCache.get(p)
    if (hit && freshEnough(hit.expiresAt)) result[p] = hit.url
    else missing.push(p)
  }
  if (missing.length === 0) return result

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(missing, SIGNED_TTL_SECONDS)
  if (error) throw new Error(error.message || 'Could not sign source URLs')

  const issuedAt = Date.now()
  for (const p of missing) {
    const entry = data?.find((d) => d.path === p)
    // supabase-js returns `signedUrl` already prefixed with the storage base URL
    if (entry?.signedUrl) {
      const expiresAt = issuedAt + SIGNED_TTL_SECONDS * 1000
      signedCache.set(p, { url: entry.signedUrl, expiresAt })
      result[p] = entry.signedUrl
    } else {
      // Unsignable path (external link or legacy data) — caller falls back.
      result[p] = null
    }
  }
  return result
}

/**
 * Signs a SINGLE path for in-memory fetch (never shown to the user).
 * Short 5-minute TTL — the bytes are consumed immediately by the app.
 * Optionally forces the download disposition.
 */
export async function signSourceForFetch(path, { download = false, name } = {}) {
  const supabase = getSupabase()
  const options = download ? { download: name || true } : {}
  return supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 300, options)
}

export function validateFiles(fileList) {
  const files = Array.from(fileList)
  const valid = []
  const errors = []
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      errors.push({ file: f.name, reason: 'too_large', size: f.size })
      continue
    }
    if (!ACCEPTED_MIME_TYPES.includes(f.type)) {
      errors.push({ file: f.name, reason: 'invalid_type', type: f.type })
      continue
    }
    valid.push(f)
  }
  return { valid, errors }
}

const MAGIC_BYTES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],                    // %PDF
  'image/png': [0x89, 0x50, 0x4E, 0x47],                          // PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF],                                // JPEG
  'image/gif': [0x47, 0x49, 0x46, 0x38],                          // GIF87a/GIF89a
  'image/webp': [0x52, 0x49, 0x46, 0x46],                         // RIFF (WEBP container)
  'application/zip': [0x50, 0x4B, 0x03, 0x04],                    // ZIP
  'application/x-rar-compressed': [0x52, 0x61, 0x72, 0x21],       // RAR
  'application/msword': [0xD0, 0xCF, 0x11, 0xE0],                 // CFB (doc/xls/ppt)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04], // ZIP (docx/xlsx/pptx)
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B, 0x03, 0x04],
  'text/plain': null,                                                // no magic, accept MIME check only
  'text/csv': null,
  'application/json': null,
  'image/svg+xml': [0x3C, 0x73, 0x76, 0x67],                      // <svg
  'image/bmp': [0x42, 0x4D],                                       // BM
}

/** Read the first N bytes of a File and check against known magic signatures. */
export async function validateMagicBytes(file) {
  const magic = MAGIC_BYTES[file.type]
  if (!magic) return true // no magic defined, accept
  const buf = await file.slice(0, magic.length).arrayBuffer()
  const header = new Uint8Array(buf)
  for (let i = 0; i < magic.length; i++) {
    if (header[i] !== magic[i]) return false
  }
  return true
}

export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
