import { extractYouTubeId, uid } from './helpers.js'

/**
 * Fetches real video metadata from YouTube official oEmbed endpoint.
 * Returns title, author (channel/doctor), and thumbnail url.
 */
export async function fetchYouTubeMeta(url) {
  if (!url) return null
  const videoId = extractYouTubeId(url)
  if (!videoId) return null

  // 1. First attempt: Noembed endpoint (CORS-friendly in browsers, returns exact YouTube title & author)
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    const res = await fetch(noembedUrl)
    if (res.ok) {
      const data = await res.json()
      if (data && data.title) {
        return {
          videoId,
          title: data.title.trim(),
          author: data.author_name ? data.author_name.trim() : '',
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        }
      }
    }
  } catch (_e) {
    // Continue to fallback
  }

  // 2. Fallback attempt: Official YouTube oEmbed
  try {
    const enc = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)
    const res = await fetch(`https://www.youtube.com/oembed?url=${enc}&format=json`)
    if (res.ok) {
      const data = await res.json()
      if (data && data.title) {
        return {
          videoId,
          title: data.title.trim(),
          author: data.author_name ? data.author_name.trim() : '',
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        }
      }
    }
  } catch (_err) {
    // ignore
  }

  return {
    videoId,
    title: '',
    author: '',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
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

    // Check if the preceding line was a lecture label like "Lec 1:" or "محاضرة 1"
    let precedingHint = ''
    if (i > 0) {
      const prevLine = lines[i - 1]
      if (!prevLine.match(/https?:\/\//i) && !extractYouTubeId(prevLine)) {
        if (/^(?:lec(?:ture)?|محاضرة|درس|part|ch(?:apter)?)\s*[\d.:\-]/i.test(prevLine)) {
          precedingHint = prevLine.replace(/[:\-–]/g, ' ').trim()
        }
      }
    }

    // Extract inline custom title from the same line if exists
    let inlineCustom = line.replace(url, '').replace(/[-–—:|#]/g, ' ').trim()
    // Ignore generic "Lec 1" or "محاضرة 1" if we can get the actual real video title
    const isGenericLabel = /^(?:lec(?:ture)?|محاضرة|درس|part)\s*\d+$/i.test(inlineCustom)
    if (isGenericLabel) {
      if (!precedingHint) precedingHint = inlineCustom
      inlineCustom = ''
    }

    // Fetch live metadata from YouTube
    const meta = await fetchYouTubeMeta(url)
    
    // The exact YouTube video title is prioritized!
    let finalTitle = ''
    if (meta?.title) {
      // If user had a prefix like "Lec 1:" and YouTube title is "Introduction to Computing",
      // combine them nicely or use YouTube title directly
      if (precedingHint && !meta.title.toLowerCase().startsWith(precedingHint.toLowerCase())) {
        finalTitle = `${precedingHint}: ${meta.title}`
      } else {
        finalTitle = meta.title
      }
    } else if (inlineCustom) {
      finalTitle = inlineCustom
    } else if (precedingHint) {
      finalTitle = precedingHint
    } else {
      finalTitle = `محاضرة ${results.length + 1}`
    }

    results.push({
      id: uid(),
      titleAr: finalTitle,
      titleEn: finalTitle,
      url,
      videoId,
      thumbnail: meta?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
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
