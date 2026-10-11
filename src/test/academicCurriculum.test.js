import { describe, it, expect } from 'vitest'
import {
  ACADEMIC_PLANS,
  getAcademicPlan,
  ACADEMIC_CURRICULUM,
  COURSE_TYPES,
} from '../data/academicCurriculum'

describe('Academic Curriculum Multi-Major Registry Suite', () => {
  it('contains all 6 official Al-Azhar accredited plans', () => {
    expect(ACADEMIC_PLANS).toHaveLength(6)
    const planIds = ACADEMIC_PLANS.map(p => p.id)
    expect(planIds).toEqual([
      'cse-2025',
      'cs-2020',
      'is-2020',
      'cce-2025',
      'mechatronics-2025',
      'renewable-2025',
    ])
  })

  it('each plan has correct planNumber, department, and faculty', () => {
    ACADEMIC_PLANS.forEach(plan => {
      expect(plan.id).toBeTruthy()
      expect(plan.planNumber).toMatch(/^[0-9]{4}$/)
      expect(plan.nameAr).toBeTruthy()
      expect(plan.nameEn).toBeTruthy()
      expect(plan.departmentAr).toContain('قسم')
      expect(plan.facultyAr).toContain('كلية الهندسة وتكنولوجيا المعلومات')
      expect(plan.curriculum).toBeDefined()
      expect(Array.isArray(plan.curriculum)).toBe(true)
    })
  })

  it('all 6 plans have 4 academic years with at least 2 semesters per year', () => {
    ACADEMIC_PLANS.forEach(plan => {
      expect(plan.curriculum).toHaveLength(4)
      plan.curriculum.forEach((yr, yrIdx) => {
        expect(yr.year).toBe(yrIdx + 1)
        expect(yr.semesters.length).toBeGreaterThanOrEqual(2)
        yr.semesters.forEach(sem => {
          expect(sem.courses.length).toBeGreaterThan(0)
          sem.courses.forEach(course => {
            expect(course.id).toBeTruthy()
            expect(course.code).toMatch(/^[A-Z]{4}[0-9]{4}$/)
            expect(course.nameAr).toBeTruthy()
            expect(course.nameEn).toBeTruthy()
            expect(course.hours).toBeGreaterThan(0)
            expect(['university', 'college', 'major', 'elective']).toContain(course.type)
          })
        })
      })
    })
  })

  it('validates total accredited credit hours per major', () => {
    const hoursSummary = {}
    ACADEMIC_PLANS.forEach(plan => {
      let total = 0
      plan.curriculum.forEach(yr => {
        yr.semesters.forEach(sem => {
          sem.courses.forEach(c => {
            total += c.hours
          })
        })
      })
      hoursSummary[plan.id] = total
    })

    // Engineering majors: ~150-160 credit hours
    expect(hoursSummary['cse-2025']).toBeGreaterThanOrEqual(150)
    expect(hoursSummary['cce-2025']).toBeGreaterThanOrEqual(150)
    expect(hoursSummary['mechatronics-2025']).toBeGreaterThanOrEqual(150)
    expect(hoursSummary['renewable-2025']).toBeGreaterThanOrEqual(150)

    // Computer Science & Information Systems: ~135-140 credit hours
    expect(hoursSummary['cs-2020']).toBeGreaterThanOrEqual(135)
    expect(hoursSummary['is-2020']).toBeGreaterThanOrEqual(135)
  })

  it('getAcademicPlan returns requested plan or falls back to default cse-2025', () => {
    const cse = getAcademicPlan('cse-2025')
    expect(cse.planNumber).toBe('9312')

    const cs = getAcademicPlan('cs-2020')
    expect(cs.planNumber).toBe('9243')

    const nonExistent = getAcademicPlan('unknown-plan-999')
    expect(nonExistent.id).toBe('cse-2025')
  })

  it('backward compatible ACADEMIC_CURRICULUM points to CSE 2025', () => {
    expect(ACADEMIC_CURRICULUM).toBe(ACADEMIC_PLANS[0].curriculum)
  })

  it('COURSE_TYPES contains university, college, major, and elective', () => {
    expect(COURSE_TYPES.university.labelAr).toBe('متطلب جامعة')
    expect(COURSE_TYPES.college.labelAr).toBe('متطلب كلية')
    expect(COURSE_TYPES.major.labelAr).toBe('إجباري تخصص')
    expect(COURSE_TYPES.elective.labelAr).toBe('اختياري تخصص')
  })
})
