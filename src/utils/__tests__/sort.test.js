import { describe, it, expect } from 'vitest'
import { sortLectures } from '../sort'

const makeLecture = (overrides) => ({
  id: Math.random().toString(36).slice(2, 8),
  titleAr: '',
  titleEn: '',
  subjectAr: '',
  subjectEn: '',
  date: '',
  createdAt: '',
  sortOrder: 0,
  ...overrides,
})

describe('sortLectures', () => {
  it('sorts by date descending by default (newest first)', () => {
    const a = makeLecture({ date: '2024-01-10' })
    const b = makeLecture({ date: '2024-01-20' })
    const c = makeLecture({ date: '2024-01-15' })
    const result = sortLectures([a, b, c], 'date-desc', false)
    expect(result.map(l => l.date)).toEqual(['2024-01-20', '2024-01-15', '2024-01-10'])
  })

  it('sorts by date ascending (oldest first)', () => {
    const a = makeLecture({ date: '2024-01-10' })
    const b = makeLecture({ date: '2024-01-20' })
    const result = sortLectures([b, a], 'date-asc', false)
    expect(result.map(l => l.date)).toEqual(['2024-01-10', '2024-01-20'])
  })

  it('breaks date ties by createdAt descending', () => {
    const a = makeLecture({ date: '2024-01-10', createdAt: '2024-01-10T09:00:00Z' })
    const b = makeLecture({ date: '2024-01-10', createdAt: '2024-01-10T11:00:00Z' })
    const c = makeLecture({ date: '2024-01-10', createdAt: '2024-01-10T10:00:00Z' })
    const result = sortLectures([a, b, c], 'date-desc', false)
    expect(result.map(l => l.createdAt)).toEqual(['2024-01-10T11:00:00Z', '2024-01-10T10:00:00Z', '2024-01-10T09:00:00Z'])
  })

  it('prioritizes manual sortOrder over date', () => {
    const a = makeLecture({ date: '2024-01-20', sortOrder: 2 })
    const b = makeLecture({ date: '2024-01-10', sortOrder: 1 })
    const c = makeLecture({ date: '2024-01-15', sortOrder: 0 })
    const result = sortLectures([a, b, c], 'date-desc', false)
    expect(result.map(l => l.sortOrder)).toEqual([0, 1, 2])
  })

  it('sorts Arabic titles alphabetically using ar locale', () => {
    const a = makeLecture({ titleAr: 'ب', isArabic: true })
    const b = makeLecture({ titleAr: 'أ', isArabic: true })
    const c = makeLecture({ titleAr: 'ج', isArabic: true })
    const result = sortLectures([a, b, c], 'title', true)
    expect(result.map(l => l.titleAr)).toEqual(['أ', 'ب', 'ج'])
  })

  it('sorts English titles alphabetically with numeric awareness', () => {
    const a = makeLecture({ titleEn: 'Lecture 10' })
    const b = makeLecture({ titleEn: 'Lecture 2' })
    const c = makeLecture({ titleEn: 'Lecture 1' })
    const result = sortLectures([a, b, c], 'title', false)
    expect(result.map(l => l.titleEn)).toEqual(['Lecture 1', 'Lecture 2', 'Lecture 10'])
  })

  it('sorts by createdAt descending (recently added)', () => {
    const a = makeLecture({ createdAt: '2024-02-01T00:00:00Z' })
    const b = makeLecture({ createdAt: '2024-03-01T00:00:00Z' })
    const c = makeLecture({ createdAt: '2024-01-01T00:00:00Z' })
    const result = sortLectures([a, b, c], 'created-desc', false)
    expect(result.map(l => l.createdAt)).toEqual(['2024-03-01T00:00:00Z', '2024-02-01T00:00:00Z', '2024-01-01T00:00:00Z'])
  })

  it('handles empty dates by treating them as oldest', () => {
    const a = makeLecture({ date: '', createdAt: '2024-01-01T00:00:00Z' })
    const b = makeLecture({ date: '2024-05-01' })
    const result = sortLectures([a, b], 'date-desc', false)
    expect(result.map(l => l.date)).toEqual(['2024-05-01', ''])
  })

  it('returns a copy and does not mutate input', () => {
    const arr = [makeLecture({ date: '2024-01-10' }), makeLecture({ date: '2024-01-20' })]
    const before = arr.map(l => l.date)
    sortLectures(arr, 'date-desc', false)
    expect(arr.map(l => l.date)).toEqual(before)
  })

  it('returns [] for non-array input', () => {
    expect(sortLectures(null)).toEqual([])
    expect(sortLectures(undefined)).toEqual([])
  })
})
