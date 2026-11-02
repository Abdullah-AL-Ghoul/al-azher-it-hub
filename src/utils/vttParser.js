/**
 * WebVTT and Subtitle Utility Suite for Al-Azhar IT Hub.
 *
 * Implements W3C WebVTT parsing, formatting, validation, and time conversions.
 * Supports Unicode, bidirectional Arabic (RTL) / English (LTR) text,
 * and academic Computer Science terminology normalization.
 */

/**
 * Standard Computer Science & IT Technical Glossary for academic translations.
 * Prevents mangling programming languages, commands, and core algorithms.
 */
export const TECHNICAL_GLOSSARY = {
  // Programming & Data Structures
  'array': 'مصفوفة (Array)',
  'linked list': 'قائمة مترابطة (Linked List)',
  'stack': 'مكدس (Stack)',
  'queue': 'طابور (Queue)',
  'tree': 'شجرة (Tree)',
  'graph': 'مخطط (Graph)',
  'hash table': 'جدول تجزئة (Hash Table)',
  'algorithm': 'خوارزمية (Algorithm)',
  'recursion': 'استدعاء ذاتي (Recursion)',
  'pointer': 'مؤشر (Pointer)',
  'object-oriented programming': 'برمجة كائنية التوجه (OOP)',
  'inheritance': 'وراثة (Inheritance)',
  'polymorphism': 'تعدد الأشكال (Polymorphism)',
  'encapsulation': 'تغليف (Encapsulation)',
  'abstraction': 'تجريد (Abstraction)',

  // Databases & Systems
  'database': 'قاعدة بيانات (Database)',
  'relational database': 'قاعدة بيانات علائقية (RDBMS)',
  'primary key': 'مفتاح أساسي (Primary Key)',
  'foreign key': 'مفتاح أجنبي (Foreign Key)',
  'index': 'فهرس (Index)',
  'transaction': 'معاملة (Transaction)',
  'concurrency': 'تزامن (Concurrency)',
  'deadlock': 'جمود تام (Deadlock)',

  // Networks & Security
  'network': 'شبكة (Network)',
  'protocol': 'بروتوكول (Protocol)',
  'socket': 'مقبس (Socket)',
  'packet': 'حزمة بيانات (Packet)',
  'bandwidth': 'عرض النطاق (Bandwidth)',
  'latency': 'زمن الاستجابة (Latency)',
  'encryption': 'تشفير (Encryption)',
  'authentication': 'المصادقة (Authentication)',
  'authorization': 'التفويض (Authorization)',

  // AI & Machine Learning
  'machine learning': 'تعلم الآلة (Machine Learning)',
  'deep learning': 'التعلم العميق (Deep Learning)',
  'neural network': 'شبكة عصبية (Neural Network)',
  'gradient descent': 'الانحدار التدريجي (Gradient Descent)',
  'loss function': 'دالة الخسارة (Loss Function)',
}

/**
 * Convert seconds into WebVTT timestamp string (HH:MM:SS.mmm).
 * @param {number} seconds - Floating point seconds
 * @returns {string} Timestamp formatted as 00:00:00.000
 */
export function formatVttTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00:00.000'
  const totalMs = Math.round(seconds * 1000)
  const ms = String(totalMs % 1000).padStart(3, '0')
  const totalSec = Math.floor(totalMs / 1000)
  const s = String(totalSec % 60).padStart(2, '0')
  const totalMin = Math.floor(totalSec / 60)
  const m = String(totalMin % 60).padStart(2, '0')
  const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
  return `${h}:${m}:${s}.${ms}`
}

/**
 * Parse a WebVTT or SRT timestamp string into seconds.
 * Supports:
 * - 00:01:23.450
 * - 01:23.450
 * - 00:01:23,450 (SRT comma format)
 * @param {string} str - Timestamp string
 * @returns {number} Seconds as float, or 0 on parse failure
 */
export function parseVttTime(str) {
  if (!str || typeof str !== 'string') return 0
  const normalized = str.trim().replace(',', '.')
  const parts = normalized.split(':')
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0
    const minutes = parseFloat(parts[1]) || 0
    const seconds = parseFloat(parts[2]) || 0
    return Math.max(0, hours * 3600 + minutes * 60 + seconds)
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0
    const seconds = parseFloat(parts[1]) || 0
    return Math.max(0, minutes * 60 + seconds)
  }
  return 0
}

/**
 * Parse WebVTT formatted string into structured cues array.
 * @param {string} vttText - Raw WebVTT file content
 * @returns {Array<{ id: string, start: number, end: number, text: string }>}
 */
export function parseVtt(vttText) {
  if (!vttText || typeof vttText !== 'string') return []

  const lines = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const cues = []
  let i = 0

  // Optional: Skip WEBVTT header and metadata comments
  while (i < lines.length) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('WEBVTT') || trimmed.startsWith('NOTE') || trimmed === '') {
      i++
      continue
    }
    break
  }

  while (i < lines.length) {
    let line = lines[i].trim()
    if (!line) {
      i++
      continue
    }

    let cueId = ''
    // Check if this line is an ID or the timestamp line
    if (!line.includes('-->')) {
      cueId = line
      i++
      if (i >= lines.length) break
      line = lines[i].trim()
    }

    // Must be timestamp line now
    if (line.includes('-->')) {
      const arrowParts = line.split('-->')
      const startStr = arrowParts[0].trim()
      // Discard optional cue settings like "align:center size:50%"
      const endPart = arrowParts[1].trim().split(/\s+/)[0]
      const start = parseVttTime(startStr)
      const end = parseVttTime(endPart)

      i++
      const textLines = []
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i])
        i++
      }

      const text = textLines.join('\n').trim()
      if (text && end >= start) {
        cues.push({
          id: cueId || `cue_${cues.length + 1}`,
          start: Math.round(start * 1000) / 1000,
          end: Math.round(end * 1000) / 1000,
          text,
        })
      }
    } else {
      i++
    }
  }

  return validateCues(cues)
}

/**
 * Parse SubRip (.srt) text format into standard cue objects.
 * @param {string} srtText - Raw SRT file content
 * @returns {Array<{ id: string, start: number, end: number, text: string }>}
 */
export function parseSrt(srtText) {
  if (!srtText || typeof srtText !== 'string') return []
  // Standard WebVTT parser already handles commas and numeric identifiers
  return parseVtt(srtText)
}

/**
 * Convert structured cues array into valid WebVTT string.
 * @param {Array<{ id?: string, start: number, end: number, text: string }>} cues
 * @param {Object} [metadata] - Optional title, language or header comments
 * @returns {string}
 */
export function cuesToVtt(cues = [], metadata = {}) {
  const header = [
    'WEBVTT',
    metadata.title ? `NOTE Title: ${metadata.title}` : null,
    metadata.language ? `NOTE Language: ${metadata.language}` : null,
    metadata.lectureId ? `NOTE Lecture: ${metadata.lectureId}` : null,
    '',
  ].filter(Boolean).join('\n')

  const validCues = validateCues(cues)
  const body = validCues.map((cue, idx) => {
    const id = cue.id || String(idx + 1)
    const timeRange = `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}`
    return `${id}\n${timeRange}\n${cue.text}`
  }).join('\n\n')

  return `${header}\n${body}\n`
}

/**
 * Validate, clean, and sort cues chronologically.
 * - Enforces start < end (min 0.2s duration).
 * - Sorts by start time.
 * - Prevents unintended overlapping cues.
 * @param {Array<{ id?: string, start: number, end: number, text: string }>} cues
 * @returns {Array<{ id: string, start: number, end: number, text: string }>}
 */
export function validateCues(cues) {
  if (!Array.isArray(cues)) return []

  const cleaned = cues
    .filter(c => c && typeof c.text === 'string' && c.text.trim())
    .map((c, index) => {
      const start = Math.max(0, Number(c.start) || 0)
      let end = Math.max(start + 0.2, Number(c.end) || start + 1)
      return {
        id: String(c.id || `cue_${index + 1}`),
        start: Math.round(start * 1000) / 1000,
        end: Math.round(end * 1000) / 1000,
        text: c.text.trim(),
      }
    })
    .sort((a, b) => a.start - b.start || a.end - b.end)

  // Resolve overlaps gracefully
  for (let i = 0; i < cleaned.length - 1; i++) {
    const curr = cleaned[i]
    const next = cleaned[i + 1]
    if (curr.end > next.start) {
      if (next.start - curr.start >= 0.5) {
        curr.end = Math.max(curr.start + 0.2, next.start - 0.05)
      }
    }
  }

  return cleaned
}

/**
 * Find the active cue for a given playback time in seconds.
 * Performs binary search for O(log n) efficiency.
 * @param {Array<{ start: number, end: number, text: string }>} cues
 * @param {number} currentTime - Current video playback time in seconds
 * @returns {{ cue: Object|null, index: number }}
 */
export function findActiveCue(cues, currentTime) {
  if (!cues || cues.length === 0 || currentTime === undefined || currentTime < 0) {
    return { cue: null, index: -1 }
  }

  let low = 0
  let high = cues.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const item = cues[mid]
    if (currentTime >= item.start && currentTime <= item.end) {
      return { cue: item, index: mid }
    }
    if (currentTime < item.start) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  return { cue: null, index: -1 }
}

/**
 * Filter cues matching a search term for in-transcript search.
 * @param {Array<{ start: number, end: number, text: string }>} cues
 * @param {string} query
 * @returns {Array<{ cue: Object, index: number }>}
 */
export function searchCues(cues, query) {
  if (!Array.isArray(cues) || !query || !query.trim()) return []
  const q = query.trim().toLowerCase()
  const results = []
  cues.forEach((cue, index) => {
    if (cue.text.toLowerCase().includes(q)) {
      results.push({ cue, index })
    }
  })
  return results
}
