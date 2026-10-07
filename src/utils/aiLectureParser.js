import { extractYouTubeId, uid } from './helpers.js'

/**
 * Fetches real video metadata from YouTube official oEmbed endpoint.
 * Returns title, author (channel/doctor), and thumbnail url.
 */
export async function fetchYouTubeMeta(url) {
  if (!url) return null
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  try {
    const enc = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)
    const res = await fetch(`https://www.youtube.com/oembed?url=${enc}&format=json`)
    if (!res.ok) {
      return {
        videoId,
        title: '',
        author: '',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      }
    }
    const data = await res.json()
    return {
      videoId,
      title: data.title || '',
      author: data.author_name || '',
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }
  } catch (err) {
    return {
      videoId,
      title: '',
      author: '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    }
  }
}

/**
 * Parses raw text containing YouTube URLs or lecture titles into structured lecture items.
 * Lines can be:
 * - Direct YouTube URL (e.g. https://www.youtube.com/watch?v=...)
 * - Title + URL (e.g. المحاضرة 1: مقدمة في الخوارزميات - https://youtu.be/...)
 */
export async function parseLecturesFromInput(text, defaultSubject = '') {
  if (!text) return []

  // Split lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const results = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Extract url from line
    const urlMatch = line.match(/(https?:\/\/[^\s]+)/i)
    const url = urlMatch ? urlMatch[1] : (extractYouTubeId(line) ? `https://www.youtube.com/watch?v=${line}` : '')
    
    if (!url) continue

    const videoId = extractYouTubeId(url)
    if (!videoId) continue

    // Extract raw title from before or after the URL
    let customTitle = line.replace(url, '').replace(/[-–—:|#]/g, ' ').trim()
    
    // Fetch live metadata from YouTube
    const meta = await fetchYouTubeMeta(url)
    const finalTitle = customTitle || meta?.title || `محاضرة ${results.length + 1}`

    results.push({
      id: uid(),
      titleAr: finalTitle,
      titleEn: finalTitle,
      url,
      videoId,
      doctorAr: meta?.author || '',
      doctorEn: meta?.author || '',
      subjectAr: defaultSubject || '',
      subjectEn: defaultSubject || '',
      date: new Date().toISOString().slice(0, 10),
      sortOrder: results.length + 1,
    })
  }

  return results
}
