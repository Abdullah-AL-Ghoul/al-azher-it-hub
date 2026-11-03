import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUserStorageKey,
  getUserStorageItem,
  setUserStorageItem,
  removeUserStorageItem,
} from '../utils/userStorage'

describe('userStorage Isolation Suite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generates user-scoped keys for authenticated students', () => {
    const studentUser = { studentId: '20230101', name: 'Ahmed', role: 'student' }
    const key = getUserStorageKey('student_notes', studentUser)
    expect(key).toBe('student_notes_20230101')
  })

  it('falls back to user.id when studentId is absent', () => {
    const adminUser = { id: 'admin_uuid_99', name: 'Dr. Mahmoud', role: 'admin' }
    const key = getUserStorageKey('lecture_note_123', adminUser)
    expect(key).toBe('lecture_note_123_admin_uuid_99')
  })

  it('handles raw string and number identifiers directly', () => {
    expect(getUserStorageKey('tasks', 'std_456')).toBe('tasks_std_456')
    expect(getUserStorageKey('progress', 12345)).toBe('progress_12345')
  })

  it('assigns guest scope when user is null, undefined, or empty', () => {
    expect(getUserStorageKey('bookmarks', null)).toBe('bookmarks_guest')
    expect(getUserStorageKey('bookmarks', undefined)).toBe('bookmarks_guest')
    expect(getUserStorageKey('bookmarks', {})).toBe('bookmarks_guest')
    expect(getUserStorageKey('bookmarks', '')).toBe('bookmarks_guest')
  })

  it('sanitizes special characters in user IDs to preserve key safety', () => {
    const uncleanUser = { studentId: 'std/2023:01@azhar' }
    const key = getUserStorageKey('pref', uncleanUser)
    expect(key).toBe('pref_std_2023_01_azhar')
  })

  it('returns default fallback when baseKey is empty or missing', () => {
    expect(getUserStorageKey('', { studentId: '123' })).toBe('al_azher_storage_guest')
    expect(getUserStorageKey(null, { studentId: '123' })).toBe('al_azher_storage_guest')
  })

  it('stores, reads, and deletes items with strict isolation between different students', () => {
    const student1 = { studentId: 'std_001', name: 'Omar' }
    const student2 = { studentId: 'std_002', name: 'Sara' }

    setUserStorageItem('al_azher_resume_draft', student1, JSON.stringify({ title: 'Omar CV' }))
    setUserStorageItem('al_azher_resume_draft', student2, JSON.stringify({ title: 'Sara CV' }))

    const saved1 = JSON.parse(getUserStorageItem('al_azher_resume_draft', student1))
    const saved2 = JSON.parse(getUserStorageItem('al_azher_resume_draft', student2))

    expect(saved1.title).toBe('Omar CV')
    expect(saved2.title).toBe('Sara CV')

    // Removing student 1 data must not affect student 2
    removeUserStorageItem('al_azher_resume_draft', student1)
    expect(getUserStorageItem('al_azher_resume_draft', student1)).toBeNull()
    expect(getUserStorageItem('al_azher_resume_draft', student2)).not.toBeNull()
  })

  it('prevents guests from accessing student private storage', () => {
    const student = { studentId: 'std_private' }
    setUserStorageItem('lecture_note_lec1', student, 'Confidential exam note')

    const guestRead = getUserStorageItem('lecture_note_lec1', null)
    expect(guestRead).toBeNull()
  })
})
