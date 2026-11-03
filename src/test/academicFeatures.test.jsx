import { describe, it, expect, beforeEach } from 'vitest'
import { getUserStorageKey, getUserStorageItem, setUserStorageItem } from '../utils/userStorage'
import { getAcademicPlan } from '../data/academicCurriculum'

describe('Comprehensive Academic Features & Tools Suite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Curriculum & Course Prerequisites Verification', () => {
    it('loads accredited computer systems engineering plan with required course hierarchies', () => {
      const plan = getAcademicPlan('cse-2025')
      expect(plan).toBeDefined()
      expect(plan.departmentAr).toContain('أنظمة الحاسوب')
      expect(plan.curriculum).toHaveLength(4)

      // Find first semester courses
      const year1Sem1 = plan.curriculum[0].semesters[0]
      expect(year1Sem1.courses.length).toBeGreaterThanOrEqual(4)
      const introCourse = year1Sem1.courses.find(c => c.code.includes('1301') || c.code.includes('1101'))
      expect(introCourse).toBeDefined()
    })

    it('verifies that all accredited majors provide complete 4-year curricula', () => {
      const majors = ['cse-2025', 'cs-2020', 'is-2020', 'cce-2025', 'mechatronics-2025', 'renewable-2025']
      majors.forEach(majorId => {
        const plan = getAcademicPlan(majorId)
        expect(plan.curriculum).toHaveLength(4)
        const totalCredits = plan.curriculum.reduce((accYear, yr) => {
          return accYear + yr.semesters.reduce((accSem, sem) => {
            return accSem + sem.courses.reduce((accC, c) => accC + (c.hours || c.credits || 0), 0)
          }, 0)
        }, 0)
        expect(totalCredits).toBeGreaterThanOrEqual(130)
      })
    })
  })

  describe('GPA & Academic Calculator Logic', () => {
    it('calculates weighted GPA correctly across multiple courses', () => {
      const courses = [
        { name: 'Data Structures', credits: 3, grade: 90 },
        { name: 'Database Systems', credits: 3, grade: 85 },
        { name: 'Software Engineering', credits: 3, grade: 95 },
        { name: 'English Language 1', credits: 2, grade: 80 },
      ]

      const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0)
      const totalPoints = courses.reduce((sum, c) => sum + (c.credits * c.grade), 0)
      const calculatedGpa = Number((totalPoints / totalCredits).toFixed(2))

      // (3*90 + 3*85 + 3*95 + 2*80) / 11 = (270 + 255 + 285 + 160) / 11 = 970 / 11 = 88.18
      expect(totalCredits).toBe(11)
      expect(calculatedGpa).toBe(88.18)
    })

    it('persists GPA calculator custom entries under student-scoped storage', () => {
      const student = { studentId: 'std_2022_05' }
      const key = getUserStorageKey('al_azher_gpa_calculator_data', student)
      expect(key).toBe('al_azher_gpa_calculator_data_std_2022_05')

      const savedData = {
        currentGpa: 87.5,
        completedHours: 75,
        targetGpa: 90.0,
      }

      setUserStorageItem('al_azher_gpa_calculator_data', student, JSON.stringify(savedData))

      const retrieved = JSON.parse(getUserStorageItem('al_azher_gpa_calculator_data', student))
      expect(retrieved.currentGpa).toBe(87.5)
      expect(retrieved.completedHours).toBe(75)
      expect(retrieved.targetGpa).toBe(90.0)
    })
  })

  describe('Weekly Schedule Builder & Timetable Conflicts', () => {
    it('detects time overlap conflict when courses share day and time window', () => {
      const schedule = [
        { id: 1, course: 'Algorithms', day: 'mon', startTime: '09:00', endTime: '10:30' },
        { id: 2, course: 'Operating Systems', day: 'wed', startTime: '09:00', endTime: '10:30' },
      ]

      const isConflict = (newSlot, existingSlots) => {
        return existingSlots.some(slot => {
          if (slot.day !== newSlot.day) return false
          const s1 = parseInt(slot.startTime.replace(':', ''), 10)
          const e1 = parseInt(slot.endTime.replace(':', ''), 10)
          const s2 = parseInt(newSlot.startTime.replace(':', ''), 10)
          const e2 = parseInt(newSlot.endTime.replace(':', ''), 10)
          return Math.max(s1, s2) < Math.min(e1, e2)
        })
      }

      // Overlapping slot on Monday 09:30 - 11:00
      const conflictingSlot = { course: 'Computer Networks', day: 'mon', startTime: '09:30', endTime: '11:00' }
      expect(isConflict(conflictingSlot, schedule)).toBe(true)

      // Non-conflicting slot on Monday 11:00 - 12:30
      const cleanSlot = { course: 'Computer Networks', day: 'mon', startTime: '11:00', endTime: '12:30' }
      expect(isConflict(cleanSlot, schedule)).toBe(false)
    })
  })

  describe('Task Tracker & Kanban Workflow', () => {
    it('manages task lifecycle across todo, in-progress, and completed columns', () => {
      const student = { studentId: '20230987' }
      const initialTasks = [
        { id: 't1', title: 'Study for Midterm', column: 'todo', priority: 'high' },
        { id: 't2', title: 'Submit Web Project', column: 'in-progress', priority: 'urgent' },
      ]

      setUserStorageItem('al_azher_tasks', student, JSON.stringify(initialTasks))

      // Move t1 to in-progress
      const tasks = JSON.parse(getUserStorageItem('al_azher_tasks', student))
      const updated = tasks.map(t => t.id === 't1' ? { ...t, column: 'in-progress' } : t)

      // Add a completed task
      updated.push({ id: 't3', title: 'Database Assignment', column: 'done', priority: 'medium' })
      setUserStorageItem('al_azher_tasks', student, JSON.stringify(updated))

      const finalSaved = JSON.parse(getUserStorageItem('al_azher_tasks', student))
      expect(finalSaved).toHaveLength(3)
      expect(finalSaved.find(t => t.id === 't1').column).toBe('in-progress')
      expect(finalSaved.find(t => t.id === 't3').column).toBe('done')
    })
  })

  describe('Focus Room & Pomodoro Statistics', () => {
    it('tracks completed study sessions and total focused minutes', () => {
      const student = { studentId: 'pomodoro_std' }
      const stats = {
        sessionsCompleted: 4,
        totalMinutes: 100, // 4 * 25
        lastSessionDate: new Date().toISOString().slice(0, 10),
      }

      setUserStorageItem('al_azher_pomodoro_stats', student, JSON.stringify(stats))

      const retrieved = JSON.parse(getUserStorageItem('al_azher_pomodoro_stats', student))
      expect(retrieved.sessionsCompleted).toBe(4)
      expect(retrieved.totalMinutes).toBe(100)
    })
  })
})
