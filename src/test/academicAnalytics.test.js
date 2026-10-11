import { describe, it, expect } from 'vitest'
import {
  calculateCategoryBreakdown,
  calculateTargetGpaRequirement,
  getHonorRollStanding,
} from '../utils/academicAnalytics'

describe('academicAnalytics utility test suite', () => {
  const sampleCurriculum = [
    {
      year: 1,
      semesters: [
        {
          semester: 1,
          courses: [
            { id: 'c1', type: 'university', hours: 2 },
            { id: 'c2', type: 'college', hours: 3 },
            { id: 'c3', type: 'major', hours: 4 },
            { id: 'c4', type: 'elective', hours: 3 },
          ]
        }
      ]
    }
  ]

  it('calculates category breakdown accurately with hours and percentages', () => {
    const progress = {
      c1: 'passed', // 2h university
      c3: 'passed', // 4h major
    }

    const breakdown = calculateCategoryBreakdown(sampleCurriculum, progress)

    expect(breakdown.university.totalHours).toBe(2)
    expect(breakdown.university.passedHours).toBe(2)
    expect(breakdown.university.percentage).toBe(100)

    expect(breakdown.college.totalHours).toBe(3)
    expect(breakdown.college.passedHours).toBe(0)
    expect(breakdown.college.percentage).toBe(0)

    expect(breakdown.major.totalHours).toBe(4)
    expect(breakdown.major.passedHours).toBe(4)
    expect(breakdown.major.percentage).toBe(100)

    expect(breakdown.elective.totalHours).toBe(3)
    expect(breakdown.elective.passedHours).toBe(0)
  })

  it('calculates achievable target GPA requirement correctly', () => {
    // 136 total hours, 36 completed with 80% GPA. Target is 85%.
    // Remaining is 100 hours.
    // (85 * 136 - 80 * 36) / 100 = (11560 - 2880) / 100 = 8680 / 100 = 86.8%
    const result = calculateTargetGpaRequirement(136, 36, 80, 85)
    expect(result.achievable).toBe(true)
    expect(result.requiredGpa).toBe(86.8)
    expect(result.maxPossibleGpa).toBeGreaterThan(85)
  })

  it('detects mathematically unachievable target GPA', () => {
    // 136 total hours, 100 completed with 60% GPA. Target is 95%.
    // Max possible = (60 * 100 + 100 * 36) / 136 = (6000 + 3600) / 136 = 70.58%
    const result = calculateTargetGpaRequirement(136, 100, 60, 95)
    expect(result.achievable).toBe(false)
    expect(result.requiredGpa).toBeGreaterThan(100)
    expect(result.maxPossibleGpa).toBe(70.59)
  })

  it('returns honor roll standings with badges', () => {
    const honor = getHonorRollStanding(92)
    expect(honor.labelAr).toContain('مرتبة الشرف')

    const excellent = getHonorRollStanding(87)
    expect(excellent.labelAr).toContain('امتياز')

    const warning = getHonorRollStanding(45)
    expect(warning.labelAr).toContain('إنذار')
  })
})
