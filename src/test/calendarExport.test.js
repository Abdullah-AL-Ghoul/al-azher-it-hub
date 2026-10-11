import { describe, it, expect } from 'vitest'
import { 
  generateIcsCalendar, 
  formatScheduleShareText, 
  validateAndParseScheduleJson 
} from '../utils/calendarExport'

describe('calendarExport utility test suite', () => {
  const sampleEntries = [
    {
      id: 'test_1',
      courseCode: 'ITCS1401',
      courseName: 'مقدمة في الحوسبة',
      room: 'قاعة 302',
      instructor: 'د. أحمد',
      days: ['sun', 'tue'],
      timeSlot: '09:30 - 11:00',
      hours: 4,
    },
    {
      id: 'test_2',
      courseCode: 'MATH1320',
      courseName: 'تفاضل وتكامل',
      room: 'مدرج القدس',
      instructor: 'د. محمود',
      days: ['mon', 'wed'],
      timeSlot: '11:00 - 12:30',
      hours: 3,
    }
  ]

  it('generates valid RFC 5545 iCalendar string with VCALENDAR and VEVENT blocks', () => {
    const ics = generateIcsCalendar(sampleEntries, true)
    
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=16')
    expect(ics).toContain('SUMMARY:ITCS1401 - مقدمة في الحوسبة')
    expect(ics).toContain('LOCATION:قاعة 302')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('creates individual VEVENT entries for each recurring day in entry', () => {
    const ics = generateIcsCalendar(sampleEntries, true)
    const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
    // test_1 has 2 days ('sun', 'tue'), test_2 has 2 days ('mon', 'wed') -> 4 VEVENTs
    expect(veventCount).toBe(4)
  })

  it('formats schedule text properly for WhatsApp sharing in Arabic and English', () => {
    const shareTextAr = formatScheduleShareText(sampleEntries, true)
    expect(shareTextAr).toContain('الجدول الدراسي الأسبوعي')
    expect(shareTextAr).toContain('يوم الأحد')
    expect(shareTextAr).toContain('ITCS1401')
    expect(shareTextAr).toContain('قاعة 302')

    const shareTextEn = formatScheduleShareText(sampleEntries, false)
    expect(shareTextEn).toContain('Weekly Timetable')
    expect(shareTextEn).toContain('Sunday')
  })

  it('handles empty entries gracefully in share text', () => {
    const emptyAr = formatScheduleShareText([], true)
    expect(emptyAr).toContain('لا يوجد محاضرات')

    const emptyEn = formatScheduleShareText([], false)
    expect(emptyEn).toContain('No lectures registered')
  })

  it('validates and parses valid timetable JSON', () => {
    const validJson = JSON.stringify({
      version: 1,
      entries: sampleEntries
    })

    const result = validateAndParseScheduleJson(validJson)
    expect(result.valid).toBe(true)
    expect(result.entries.length).toBe(2)
    expect(result.entries[0].courseCode).toBe('ITCS1401')
  })

  it('rejects invalid JSON or malformed entries', () => {
    const badJson = 'invalid json string'
    const result1 = validateAndParseScheduleJson(badJson)
    expect(result1.valid).toBe(false)

    const malformed = JSON.stringify({ entries: [{ foo: 'bar' }] })
    const result2 = validateAndParseScheduleJson(malformed)
    expect(result2.valid).toBe(false)
  })
})
