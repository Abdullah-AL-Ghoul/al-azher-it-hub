import { describe, it, expect } from 'vitest'
import { computeCourseStats, matchCourseLectures, matchCourseSources } from '../courseStats'

const course = { id: 'c1', nameAr: 'هندسة البرمجيات', nameEn: 'Software Engineering', doctorAr: 'د. أحمد', doctorEn: 'Dr. Ahmed' }

const lectures = [
  { id: 'l1', courseId: 'c1', titleAr: 'المحاضرة الأولى', titleEn: 'Lecture 1', subjectAr: 'هندسة البرمجيات', subjectEn: 'Software Engineering' },
  { id: 'l2', courseId: 'c1', titleAr: 'المحاضرة الثانية', titleEn: 'Lecture 2', subjectAr: 'هندسة البرمجيات', subjectEn: 'Software Engineering' },
  { id: 'l3', courseId: 'c2', titleAr: 'رياضيات', titleEn: 'Math', subjectAr: 'رياضيات', subjectEn: 'Math' },
]

const sources = [
  { id: 's1', titleAr: 'كتاب', titleEn: 'Book', subjectAr: 'هندسة البرمجيات', subjectEn: 'Software Engineering' },
  { id: 's2', titleAr: 'ملخص', titleEn: 'Summary', subjectAr: 'هندسة البرمجيات', subjectEn: 'Software Engineering' },
  { id: 's3', titleAr: 'رياضيات', titleEn: 'Math', subjectAr: 'رياضيات', subjectEn: 'Math' },
]

describe('matchCourseLectures', () => {
  it('filters lectures by courseId', () => {
    const result = matchCourseLectures(course, lectures)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('l1')
    expect(result[1].id).toBe('l2')
  })

  it('filters lectures by subjectAr/En match when courseId missing', () => {
    const lectures2 = [
      { id: 'l4', subjectAr: 'هندسة البرمجيات', subjectEn: 'SE' },
      { id: 'l5', subjectAr: 'رياضيات', subjectEn: 'Math' },
    ]
    const result = matchCourseLectures(course, lectures2)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('l4')
  })

  it('returns empty for null course', () => {
    expect(matchCourseLectures(null, lectures)).toEqual([])
    expect(matchCourseLectures(undefined, [])).toEqual([])
  })
})

describe('matchCourseSources', () => {
  it('returns sources matching the course subject', () => {
    const result = matchCourseSources(course, sources)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('s1')
    expect(result[1].id).toBe('s2')
  })
})

describe('computeCourseStats', () => {
  const userStats = [
    { studentId: 's1', viewed: ['l1', 'l2'] },
    { studentId: 's2', viewed: ['l1'] },
    { studentId: 's3', viewed: [] },
  ]

  const allRatings = [
    { studentId: 's1', ratings: { l1: 5, l2: 4 } },
    { studentId: 's2', ratings: { l1: 3 } },
  ]

  it('computes total views and per-lecture breakdown', () => {
    const stats = computeCourseStats(course, lectures, sources, userStats, allRatings)
    expect(stats.courseLectures).toHaveLength(2)
    expect(stats.courseSources).toHaveLength(2)
    expect(stats.views).toBe(3) // l1:2 + l2:1
    expect(stats.perLecture).toHaveLength(2)
    expect(stats.perLecture.find(p => p.id === 'l1').views).toBe(2)
    expect(stats.perLecture.find(p => p.id === 'l2').views).toBe(1)
  })

  it('computes average rating', () => {
    const stats = computeCourseStats(course, lectures, sources, userStats, allRatings)
    expect(stats.ratingsCount).toBe(3) // 5 + 4 + 3
    expect(stats.avgRating).toBe('4.0') // (5+4+3)/3
  })

  it('returns — for avgRating when no ratings', () => {
    const stats = computeCourseStats(course, lectures, sources, userStats, [])
    expect(stats.ratingsCount).toBe(0)
    expect(stats.avgRating).toBe('—')
  })

  it('computes topViews correctly', () => {
    const stats = computeCourseStats(course, lectures, sources, userStats, allRatings)
    expect(stats.topViews).toBe(2) // l1 has 2 views
  })

  it('handles empty userStats/ratings gracefully', () => {
    const stats = computeCourseStats(course, lectures, sources, [], [])
    expect(stats.views).toBe(0)
    expect(stats.ratingsCount).toBe(0)
    expect(stats.avgRating).toBe('—')
    expect(stats.courseLectures).toHaveLength(2)
    expect(stats.courseSources).toHaveLength(2)
  })
})