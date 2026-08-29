export const nowISO = () => new Date().toISOString()

// Collision-resistant short id for local keys (notes, plan items, additions).
export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

// Shared lecture sort options (Lectures + Sources).
export const SORT_OPTIONS = [
  { value: 'date-desc', labelAr: 'الأحدث أولاً', labelEn: 'Newest first' },
  { value: 'date-asc', labelAr: 'الأقدم أولاً', labelEn: 'Oldest first' },
  { value: 'created-desc', labelAr: 'الأحدث إضافةً', labelEn: 'Recently added' },
  { value: 'title', labelAr: 'أبجدي', labelEn: 'Alphabetical' },
]

// Fetches a file to a blob and triggers a download; falls back to opening the
// URL in a new tab when cross-origin fetch is blocked.
export async function downloadFile(url, name) {
  const fallback = () => {
    const a = document.createElement('a')
    a.href = url
    a.download = name || 'file'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return fallback()
    const blob = await res.blob()
    if (!blob || blob.size === 0) return fallback()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name || 'file'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000)
  } catch (e) {
    fallback()
  }
}

// Normalizes a source row into a flat file list (files array + legacy fileData).
export function getSourceFiles(source) {
  const files = []
  if (Array.isArray(source?.files) && source.files.length > 0) files.push(...source.files.filter(f => f?.url))
  if (source?.fileData && !files.some(f => f.url === source.fileData)) files.unshift({ url: source.fileData, name: source.fileName || 'file', size: 0 })
  return files
}

export function extractYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function lectureVideoId(lecture) {
  if (!lecture) return null
  if (lecture.videoId) return lecture.videoId
  return extractYouTubeId(lecture.url) || null
}

export function lectureThumb(id, quality = 'mq') {
  if (!id) return null
  const file = quality === 'hq' ? 'hqdefault.jpg' : 'mqdefault.jpg'
  return `https://img.youtube.com/vi/${id}/${file}`
}
