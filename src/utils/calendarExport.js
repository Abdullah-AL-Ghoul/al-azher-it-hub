/**
 * Al-Azhar IT Hub — Calendar Export & Schedule Share Utilities
 * RFC 5545 iCalendar compliance + WhatsApp schedule formatting
 */

const DAY_INDEX_MAP = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const DAY_NAMES_AR = {
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الإثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
}

const DAY_NAMES_EN = {
  sat: 'Saturday',
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
}

/**
 * Calculates the next upcoming Date object matching targetDayOfWeek (0-6)
 */
function getNextDateForDay(targetDayOfWeek) {
  const now = new Date()
  const currentDay = now.getDay()
  let daysUntil = (targetDayOfWeek - currentDay + 7) % 7
  if (daysUntil === 0) daysUntil = 7 // Next week if today is that day, or today
  const targetDate = new Date(now)
  targetDate.setDate(now.getDate() + daysUntil)
  return targetDate
}

/**
 * Pads a number with leading zeros
 */
function pad(num) {
  return String(num).padStart(2, '0')
}

/**
 * Formats a Date + time (HH:MM) to iCalendar datetime string: YYYYMMDDTHHMMSS
 */
function formatIcsDateTime(date, timeStr) {
  const [hours, minutes] = (timeStr || '09:00').split(':').map(Number)
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(hours)
  const mm = pad(minutes)
  return `${y}${m}${d}T${hh}${mm}00`
}

/**
 * Generates an RFC 5545 compliant .ics string for weekly recurring university classes
 */
export function generateIcsCalendar(entries = [], isArabic = true) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Al-Azhar University IT Hub//Timetable//AR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${isArabic ? 'الجدول الدراسي - جامعة الأزهر' : 'University Schedule - Al-Azhar IT Hub'}`,
    'X-WR-TIMEZONE:Asia/Gaza',
  ]

  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  entries.forEach((entry, idx) => {
    if (!Array.isArray(entry.days) || entry.days.length === 0) return

    // Extract start and end time from slot "09:30 - 11:00"
    const times = (entry.timeSlot || '09:30 - 11:00').split('-').map(s => s.trim())
    const startTimeStr = times[0] || '09:30'
    const endTimeStr = times[1] || '11:00'

    entry.days.forEach((dayKey, dIdx) => {
      const targetDayOfWeek = DAY_INDEX_MAP[dayKey]
      if (targetDayOfWeek === undefined) return

      const startDate = getNextDateForDay(targetDayOfWeek)
      const dtStart = formatIcsDateTime(startDate, startTimeStr)
      const dtEnd = formatIcsDateTime(startDate, endTimeStr)
      const uid = `alazher_${entry.id || idx}_${dayKey}_${dIdx}@al-azher-it-hub.vercel.app`

      const courseTitle = entry.courseCode 
        ? `${entry.courseCode} - ${entry.courseName}`
        : entry.courseName

      const location = entry.room || (isArabic ? 'جامعة الأزهر - غزة' : 'Al-Azhar University - Gaza')
      const description = `${isArabic ? 'المحاضر:' : 'Instructor:'} ${entry.instructor || (isArabic ? 'غير محدد' : 'N/A')} | Al-Azhar IT Hub`

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${uid}`)
      lines.push(`DTSTAMP:${nowIso}`)
      lines.push(`DTSTART:${dtStart}`)
      lines.push(`DTEND:${dtEnd}`)
      // Repeat weekly for a 16-week university semester
      lines.push('RRULE:FREQ=WEEKLY;COUNT=16')
      lines.push(`SUMMARY:${courseTitle}`)
      lines.push(`LOCATION:${location}`)
      lines.push(`DESCRIPTION:${description}`)
      lines.push('STATUS:CONFIRMED')
      lines.push('END:VEVENT')
    })
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Triggers a browser download of the generated .ics file
 */
export function downloadIcsSchedule(entries = [], isArabic = true) {
  const icsContent = generateIcsCalendar(entries, isArabic)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `al-azhar-schedule-${new Date().toISOString().slice(0, 10)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Formats a clean text representation of the schedule suitable for WhatsApp or Telegram
 */
export function formatScheduleShareText(entries = [], isArabic = true) {
  if (!entries || entries.length === 0) {
    return isArabic 
      ? 'لا يوجد محاضرات مسجلة في الجدول الدراسي حالياً.' 
      : 'No lectures registered in timetable currently.'
  }

  const header = isArabic
    ? '📅 *الجدول الدراسي الأسبوعي - جامعة الأزهر (غزة)*\n🏛️ *كلية الهندسة وتكنولوجيا المعلومات*\n' + '─'.repeat(25)
    : '📅 *Weekly Timetable - Al-Azhar University*\n🏛️ *Faculty of Engineering & IT*\n' + '─'.repeat(25)

  const dayOrder = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu']
  const dayGroups = {}
  dayOrder.forEach(d => { dayGroups[d] = [] })

  entries.forEach(entry => {
    if (Array.isArray(entry.days)) {
      entry.days.forEach(d => {
        if (dayGroups[d]) {
          dayGroups[d].push(entry)
        }
      })
    }
  })

  const daySections = []

  dayOrder.forEach(dKey => {
    const list = dayGroups[dKey]
    if (list.length === 0) return

    // Sort by start time
    list.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''))

    const dayTitle = isArabic 
      ? `\n📌 *يوم ${DAY_NAMES_AR[dKey]}*:` 
      : `\n📌 *${DAY_NAMES_EN[dKey]}*:`

    const items = list.map(item => {
      const code = item.courseCode ? `[${item.courseCode}] ` : ''
      const room = item.room ? ` 📍 ${item.room}` : ''
      const doc = item.instructor ? ` 👨‍🏫 ${item.instructor}` : ''
      return `  ⏰ ${item.timeSlot} | ${code}${item.courseName}${room}${doc}`
    })

    daySections.push(`${dayTitle}\n${items.join('\n')}`)
  })

  const footer = isArabic
    ? '\n' + '─'.repeat(25) + '\n✨ تم الإنشاء عبر منصة Al-Azhar IT Hub\n🔗 https://al-azher-it-hub.vercel.app/study-plan?tab=schedule'
    : '\n' + '─'.repeat(25) + '\n✨ Generated via Al-Azhar IT Hub\n🔗 https://al-azher-it-hub.vercel.app/study-plan?tab=schedule'

  return `${header}\n${daySections.join('\n')}\n${footer}`
}

/**
 * Downloads a backup JSON file of the timetable
 */
export function exportScheduleJson(entries = []) {
  const dataStr = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    platform: 'Al-Azhar IT Hub',
    entries,
  }, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `al-azhar-schedule-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Validates and parses imported timetable JSON
 */
export function validateAndParseScheduleJson(rawText) {
  try {
    const parsed = JSON.parse(rawText)
    const list = Array.isArray(parsed) ? parsed : parsed.entries
    if (!Array.isArray(list)) {
      return { valid: false, error: 'Invalid schema: expected array of entries' }
    }
    // Check entries have courseName and days
    const validated = list.filter(item => item && typeof item === 'object' && item.courseName && Array.isArray(item.days))
    if (validated.length === 0) {
      return { valid: false, error: 'No valid timetable entries found in file' }
    }
    return { valid: true, entries: validated }
  } catch (err) {
    return { valid: false, error: err.message || 'JSON parsing failed' }
  }
}
