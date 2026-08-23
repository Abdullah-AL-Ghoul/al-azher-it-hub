export const nowISO = () => new Date().toISOString()

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
