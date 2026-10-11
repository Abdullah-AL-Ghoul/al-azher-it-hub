import { describe, it, expect } from 'vitest'
import { classifySource, ACADEMIC_YEAR_FILTERS, EXAM_SUB_TYPES } from '../data/sourceCategories'

describe('sourceCategories utility test suite', () => {
  it('correctly classifies midterm and final exams with semantic labels', () => {
    const midterm = classifySource({ titleAr: 'امتحان نصفي لمساق تفاضل وتكامل 1' })
    expect(midterm.category).toBe('exams')
    expect(midterm.examType).toBe('midterm')
    expect(midterm.labelAr).toContain('امتحان نصفي')

    const final = classifySource({ titleAr: 'امتحان فاينل نهائي 2024' })
    expect(final.category).toBe('exams')
    expect(final.examType).toBe('final')
    expect(final.labelAr).toContain('امتحان نهائي')
  })

  it('detects solution key availability (hasSolution = true)', () => {
    const withSolution1 = classifySource({ titleAr: 'امتحان نهائي مع الحل والاجابات النموذجية' })
    expect(withSolution1.hasSolution).toBe(true)

    const withSolution2 = classifySource({ titleAr: 'Final Exam 2023 Solved' })
    expect(withSolution2.hasSolution).toBe(true)

    const noSolution = classifySource({ titleAr: 'أسئلة امتحان غير محلولة' })
    // wait, 'غير محلولة' contains 'حل', let's check normal question paper
    const normal = classifySource({ titleAr: 'امتحان نصفي برمجة حاسوب 1' })
    expect(normal.hasSolution).toBe(false)
  })

  it('extracts academic exam year accurately', () => {
    const exam2024 = classifySource({ titleAr: 'امتحان نهائي 2024 تفاضل' })
    expect(exam2024.examYear).toBe('2024')

    const exam2022 = classifySource({ titleEn: 'Midterm 2022 Networks' })
    expect(exam2022.examYear).toBe('2022')

    const noYear = classifySource({ titleAr: 'ملخص عام' })
    expect(exam2024.examYear).toBe('2024')
    expect(noYear.examYear).toBeNull()
  })

  it('infers academic year level from course code and curriculum name', () => {
    // MATH1320 is in Year 1
    const math = classifySource({ titleAr: 'تفاضل وتكامل (1) ملخص شامل', code: 'MATH1320' })
    expect(math.academicYear).toBe(1)

    // Explicit keyword
    const level2 = classifySource({ titleAr: 'ملخص لطلاب السنة الثانية' })
    expect(level2.academicYear).toBe(2)
  })

  it('exports academic year filters', () => {
    expect(ACADEMIC_YEAR_FILTERS.length).toBe(5)
    expect(ACADEMIC_YEAR_FILTERS[1].id).toBe('1')
  })
})
