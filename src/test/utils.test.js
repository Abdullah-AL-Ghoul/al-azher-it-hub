import { describe, it, expect, beforeEach } from 'vitest'
import {
  extractYouTubeId,
  storagePathFromUrl,
  getSourceFiles,
  uid,
  lectureVideoId,
  SORT_OPTIONS,
} from '../utils/helpers'
import { sanitizeString, sanitizeObject, isSafeUrl, sanitizeUrl } from '../utils/sanitize'
import { hashPassword, hashPasswordLegacy, generateSalt } from '../utils/crypto'
import { matchCourseLectures, matchCourseSources, computeCourseStats } from '../utils/courseStats'
import { recordToday, currentStreak, bestStreak } from '../utils/achievements'

describe('helpers utility suite', () => {
  it('generates non-empty unique ids', () => {
    const id1 = uid()
    const id2 = uid()
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })

  it('extracts youtube ids correctly from multiple url patterns', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeId('')).toBeNull()
    expect(extractYouTubeId(null)).toBeNull()
  })

  it('lectureVideoId resolves from string or object', () => {
    expect(lectureVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(lectureVideoId({ videoId: 'dQw4w9WgXcQ' })).toBe('dQw4w9WgXcQ')
    expect(lectureVideoId({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('dQw4w9WgXcQ')
    expect(lectureVideoId(null)).toBeNull()
  })

  it('normalizes source files from legacy and multi-file structures', () => {
    const sourceWithLegacy = {
      fileData: 'https://example.com/storage/v1/object/public/sources/doc1.pdf',
      fileName: 'doc1.pdf',
    }
    const files = getSourceFiles(sourceWithLegacy)
    expect(files.length).toBe(1)
    expect(files[0].path).toBe('doc1.pdf')
  })

  it('provides complete sort options with bilingual labels', () => {
    expect(SORT_OPTIONS.length).toBeGreaterThanOrEqual(4)
    SORT_OPTIONS.forEach(opt => {
      expect(opt.value).toBeTruthy()
      expect(opt.labelAr).toBeTruthy()
      expect(opt.labelEn).toBeTruthy()
    })
  })

  it('extracts storagePathFromUrl accurately', () => {
    expect(storagePathFromUrl('https://example.com/storage/v1/object/public/sources/subfolder/file.pdf')).toBe('subfolder/file.pdf')
    expect(storagePathFromUrl('sources/manual/file.pdf')).toBe('sources/manual/file.pdf')
    expect(storagePathFromUrl(null)).toBeNull()
  })
})

describe('sanitize utility suite', () => {
  it('strips HTML tags and unsafe javascript schemes', () => {
    const unsafe = '<script>alert(1)</script>Hello <b>World</b><a href="javascript:steal()">link</a>'
    const cleaned = sanitizeString(unsafe)
    expect(cleaned).not.toContain('<script>')
    expect(cleaned).not.toContain('javascript:')
    expect(cleaned).toContain('Hello')
    expect(cleaned).toContain('World')
  })

  it('sanitizes specific object properties', () => {
    const data = {
      title: '<img src=x onerror=alert(1)>Introduction',
      count: 42,
      note: 'Normal text',
    }
    const sanitized = sanitizeObject(data, ['title', 'note'])
    expect(sanitized.title).not.toContain('<img')
    expect(sanitized.count).toBe(42)
  })

  it('validates safe and malicious URLs correctly with isSafeUrl and sanitizeUrl', () => {
    expect(isSafeUrl('https://example.com/test')).toBe(true)
    expect(isSafeUrl('http://example.com/test')).toBe(true)
    expect(isSafeUrl('mailto:student@alazher.edu')).toBe(true)
    expect(isSafeUrl('tel:+970599000000')).toBe(true)
    expect(isSafeUrl('/sources')).toBe(true)
    expect(isSafeUrl('#schedule-section')).toBe(true)

    // Unsafe schemes must be blocked
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false)
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isSafeUrl('vbscript:msgbox("hi")')).toBe(false)
    expect(isSafeUrl('file:///etc/passwd')).toBe(false)
    expect(isSafeUrl('')).toBe(false)
    expect(isSafeUrl(null)).toBe(false)

    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    expect(sanitizeUrl('javascript:bad()', '#fallback')).toBe('#fallback')
  })
})

describe('crypto security utility suite', () => {
  it('generates random hex salt', () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    expect(salt1.length).toBe(32) // 16 bytes hex
    expect(salt2.length).toBe(32)
    expect(salt1).not.toBe(salt2)
  })

  it('hashes passwords deterministically with PBKDF2', async () => {
    const salt = generateSalt()
    const hash1 = await hashPassword('Secret123!', salt)
    const hash2 = await hashPassword('Secret123!', salt)
    expect(hash1).toBe(hash2)
    expect(hash1.length).toBe(64) // SHA-256 32 bytes hex
  })

  it('legacy SHA-256 hash behaves deterministically', async () => {
    const hash1 = await hashPasswordLegacy('Password')
    const hash2 = await hashPasswordLegacy('Password')
    expect(hash1).toBe(hash2)
    expect(hash1.length).toBe(64)
  })
})

describe('courseStats matching and calculation', () => {
  const mockCourse = { id: 'c1', nameAr: 'خوارزميات', nameEn: 'Algorithms' }
  const mockLectures = [
    { id: 'l1', courseId: 'c1', titleAr: 'مقدمة' },
    { id: 'l2', subjectAr: 'خوارزميات', titleAr: 'ترتيب' },
    { id: 'l3', courseId: 'other', titleAr: 'أخرى' },
  ]
  const mockSources = [
    { id: 's1', subjectAr: 'خوارزميات', titleAr: 'ملخص' },
    { id: 's2', subjectEn: 'Networking', titleEn: 'Summary' },
  ]

  it('matches course lectures by id or subject name', () => {
    const matched = matchCourseLectures(mockCourse, mockLectures)
    expect(matched.length).toBe(2)
    expect(matched.map(m => m.id)).toEqual(['l1', 'l2'])
  })

  it('matches course sources by subject name', () => {
    const matched = matchCourseSources(mockCourse, mockSources)
    expect(matched.length).toBe(1)
    expect(matched[0].id).toBe('s1')
  })

  it('computes correct view counts and ratings', () => {
    const userStats = [
      { viewed: ['l1', 'l2'] },
      { viewed: ['l1'] },
    ]
    const allRatings = [
      { ratings: { l1: 5, l2: 4, l3: 1 } },
      { ratings: { l1: 4 } },
    ]
    const stats = computeCourseStats(mockCourse, mockLectures, mockSources, userStats, allRatings)
    expect(stats.courseLectures.length).toBe(2)
    expect(stats.views).toBe(3) // l1: 2 views, l2: 1 view
    expect(stats.ratingsCount).toBe(3) // l1 has 5 & 4, l2 has 4
    expect(stats.avgRating).toBe('4.3') // (5+4+4)/3 = 4.33
  })
})

describe('achievements and streak tracking', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('records today and computes active streak', () => {
    const studentId = 'student_test'
    expect(currentStreak(studentId)).toBe(0)

    recordToday(studentId)
    expect(currentStreak(studentId)).toBe(1)
    expect(bestStreak(studentId)).toBe(1)
  })
})
