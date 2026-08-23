export const MAX_FILE_SIZE = 100 * 1024 * 1024

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
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
  const filePath = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${safeName}`

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

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path)

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

export function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
