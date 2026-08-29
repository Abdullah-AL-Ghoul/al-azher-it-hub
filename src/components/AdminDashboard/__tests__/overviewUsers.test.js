import { describe, it, expect } from 'vitest'
import { computeActiveStudents, computeNewStudents } from '../../../utils/adminStatsLogic'

describe('activeStudents (from student_logs fallback)', () => {
  it('includes a student whose users.lastVisit is null but has a recent log', () => {
    const users = [
      { studentId: '20241644', name: 'malk', role: 'student', lastVisit: null, createdAt: '2026-08-23T11:56:04Z' },
      { studentId: '20231537', name: 'ahmad', role: 'student', lastVisit: '2026-08-20T10:00:00Z', createdAt: '2026-01-01T00:00:00Z' },
    ]
    const logs = [
      { studentId: '20241644', type: 'VIEW_LECTURE', timestamp: '2026-08-23T11:58:45Z' },
      { studentId: '20241644', type: 'REGISTER', timestamp: '2026-08-23T11:56:04Z' },
    ]
    const active = computeActiveStudents(users, logs)
    expect(active[0].studentId).toBe('20241644')
    expect(active[0].lastActivity).toBe(new Date('2026-08-23T11:58:45Z').getTime())
  })

  it('sorts by most recent activity first and caps at 5', () => {
    const users = [1, 2, 3, 4, 5, 6].map(i => ({
      studentId: `u${i}`, name: `U${i}`, role: 'student', lastVisit: null,
      createdAt: '2026-01-01T00:00:00Z',
    }))
    const logs = users.map(u => ({
      studentId: u.studentId,
      timestamp: new Date(Date.now() - (6 - Number(u.studentId.slice(1))) * 60000).toISOString(),
    }))
    const active = computeActiveStudents(users, logs)
    expect(active).toHaveLength(5)
    expect(active[0].studentId).toBe('u6')
  })

  it('excludes admins from the active list', () => {
    const users = [
      { studentId: 'admin', name: 'Admin', role: 'admin', lastVisit: '2026-08-23T12:06:47Z' },
      { studentId: '20241644', name: 'malk', role: 'student', lastVisit: null, createdAt: '2026-08-23T11:56:04Z' },
    ]
    const logs = [
      { studentId: 'admin', timestamp: '2026-08-23T12:06:47Z' },
      { studentId: '20241644', timestamp: '2026-08-23T11:58:45Z' },
    ]
    const active = computeActiveStudents(users, logs)
    expect(active.every(u => u.studentId !== 'admin')).toBe(true)
    expect(active).toHaveLength(1)
    expect(active[0].studentId).toBe('20241644')
  })

  it('falls back to users.lastVisit when no logs exist', () => {
    const users = [
      { studentId: 'a', role: 'student', lastVisit: '2026-08-23T10:00:00Z', createdAt: '2026-01-01T00:00:00Z' },
      { studentId: 'b', role: 'student', lastVisit: null, createdAt: '2026-01-01T00:00:00Z' },
    ]
    const active = computeActiveStudents(users, [])
    expect(active[0].studentId).toBe('a')
  })
})

describe('newStudents', () => {
  it('orders by createdAt descending', () => {
    const users = [
      { studentId: 'old', role: 'student', createdAt: '2026-01-01T00:00:00Z' },
      { studentId: '20241644', role: 'student', createdAt: '2026-08-23T11:56:04Z' },
      { studentId: 'mid', role: 'student', createdAt: '2026-06-01T00:00:00Z' },
    ]
    const newest = computeNewStudents(users)
    expect(newest.map(u => u.studentId)).toEqual(['20241644', 'mid', 'old'])
  })

  it('caps at 5 students and excludes admins', () => {
    const users = [1, 2, 3, 4, 5, 6].map(i => ({
      studentId: `u${i}`, role: 'student',
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    }))
    users.push({ studentId: 'admin', role: 'admin', createdAt: '2026-08-23T12:00:00Z' })
    const newest = computeNewStudents(users)
    expect(newest).toHaveLength(5)
    expect(newest.some(u => u.studentId === 'admin')).toBe(false)
  })
})
