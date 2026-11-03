import { describe, it, expect } from 'vitest'
import {
  formatVttTime,
  parseVttTime,
  parseVtt,
  parseSrt,
  cuesToVtt,
  validateCues,
  findActiveCue,
  searchCues,
  TECHNICAL_GLOSSARY,
  applyAcademicGlossary,
  translateCues,
} from '../utils/vttParser'

describe('vttParser Suite', () => {
  it('formats seconds to WebVTT timestamp format HH:MM:SS.mmm', () => {
    expect(formatVttTime(0)).toBe('00:00:00.000')
    expect(formatVttTime(65.5)).toBe('00:01:05.500')
    expect(formatVttTime(3661.123)).toBe('01:01:01.123')
    expect(formatVttTime(-5)).toBe('00:00:00.000')
  })

  it('parses WebVTT and SRT timestamp strings to seconds', () => {
    expect(parseVttTime('00:01:05.500')).toBe(65.5)
    expect(parseVttTime('01:05.500')).toBe(65.5)
    expect(parseVttTime('00:01:05,500')).toBe(65.5) // SRT format
    expect(parseVttTime('01:01:01.123')).toBe(3661.123)
    expect(parseVttTime('invalid')).toBe(0)
  })

  it('parses WebVTT file content into structured cue objects', () => {
    const vttSample = `WEBVTT
NOTE Lecture Introduction

1
00:00:01.000 --> 00:00:04.500
مرحباً بكم في محاضرة هياكل البيانات

2
00:00:05.000 --> 00:00:08.200 align:center
سنشرح اليوم موضوع الـ Linked List`

    const cues = parseVtt(vttSample)
    expect(cues).toHaveLength(2)
    expect(cues[0]).toEqual({
      id: '1',
      start: 1,
      end: 4.5,
      text: 'مرحباً بكم في محاضرة هياكل البيانات',
    })
    expect(cues[1].id).toBe('2')
    expect(cues[1].start).toBe(5)
    expect(cues[1].end).toBe(8.2)
    expect(cues[1].text).toBe('سنشرح اليوم موضوع الـ Linked List')
  })

  it('parses SRT formatted subtitles', () => {
    const srtSample = `1
00:00:01,000 --> 00:00:03,000
First line of SRT

2
00:00:03,500 --> 00:00:06,000
Second line of SRT`

    const cues = parseSrt(srtSample)
    expect(cues).toHaveLength(2)
    expect(cues[0].start).toBe(1)
    expect(cues[0].end).toBe(3)
    expect(cues[0].text).toBe('First line of SRT')
  })

  it('converts cues back to valid WebVTT string', () => {
    const inputCues = [
      { id: '1', start: 0, end: 2.5, text: 'Hello' },
      { id: '2', start: 3.1, end: 5.0, text: 'World' },
    ]
    const vtt = cuesToVtt(inputCues, { title: 'Test Lecture', language: 'ar' })
    expect(vtt).toContain('WEBVTT')
    expect(vtt).toContain('NOTE Title: Test Lecture')
    expect(vtt).toContain('NOTE Language: ar')
    expect(vtt).toContain('00:00:00.000 --> 00:00:02.500')
    expect(vtt).toContain('Hello')
    expect(vtt).toContain('00:00:03.100 --> 00:00:05.000')
    expect(vtt).toContain('World')
  })

  it('validates cues and resolves unintended overlaps', () => {
    const messyCues = [
      { start: 10, end: 15, text: 'Second' },
      { start: 0, end: 12, text: 'First (overlaps into second)' },
    ]
    const validated = validateCues(messyCues)
    expect(validated[0].start).toBe(0)
    expect(validated[0].end).toBeLessThanOrEqual(10)
    expect(validated[1].start).toBe(10)
  })

  it('finds active cue in O(log n) time binary search', () => {
    const cues = [
      { id: '1', start: 0, end: 5, text: 'Intro' },
      { id: '2', start: 5.5, end: 10, text: 'Body' },
      { id: '3', start: 10.5, end: 15, text: 'Conclusion' },
    ]

    expect(findActiveCue(cues, 2).cue?.text).toBe('Intro')
    expect(findActiveCue(cues, 7).cue?.text).toBe('Body')
    expect(findActiveCue(cues, 12).cue?.text).toBe('Conclusion')
    expect(findActiveCue(cues, 5.2).cue).toBeNull() // gap between 5 and 5.5
    expect(findActiveCue(cues, 20).cue).toBeNull() // after end
  })

  it('searches cues accurately across Arabic and English terms', () => {
    const cues = [
      { id: '1', start: 0, end: 5, text: 'مقدمة في خوارزميات الفرز Sorting' },
      { id: '2', start: 5, end: 10, text: 'تعريف مصفوفة البيانات Array' },
    ]

    expect(searchCues(cues, 'خوارزميات')).toHaveLength(1)
    expect(searchCues(cues, 'array')).toHaveLength(1)
    expect(searchCues(cues, 'غير موجود')).toHaveLength(0)
  })

  it('includes key Computer Science technical glossary entries', () => {
    expect(TECHNICAL_GLOSSARY['array']).toContain('مصفوفة')
    expect(TECHNICAL_GLOSSARY['linked list']).toContain('قائمة مترابطة')
    expect(TECHNICAL_GLOSSARY['database']).toContain('قاعدة بيانات')
  })

  it('applies academic CS glossary correctly to Arabic text', () => {
    const raw = 'في هذه المحاضرة سنشرح هياكل البيانات وأشجار البحث الثنائية والفرز السريع.'
    const refined = applyAcademicGlossary(raw)
    expect(refined).toContain('هياكل البيانات (Data Structures)')
    expect(refined).toContain('أشجار البحث الثنائية (BST)')
    expect(refined).toContain('الترتيب السريع (QuickSort)')
  })

  it('translates text and subtitle cues seamlessly', async () => {
    const cues = [
      { id: '1', start: 0, end: 4, text: 'Welcome to this computer science lecture.' },
    ]
    const translated = await translateCues(cues, 'en', 'ar')
    expect(translated).toHaveLength(1)
    expect(translated[0].start).toBe(0)
    expect(translated[0].end).toBe(4)
    expect(typeof translated[0].text).toBe('string')
    expect(translated[0].text.length).toBeGreaterThan(0)
  })
})
