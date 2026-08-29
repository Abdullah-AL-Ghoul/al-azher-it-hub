import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { UserDataProvider } from '../../context/UserDataContext'
import { useLectures } from '../useLectures'
import { DEFAULT_USER, __setSupabaseMock } from '../../test-utils/mockSupabase'
import { createTestSupabase } from '../../test-utils/renderWithProviders'

function wrapper({ children }) {
  return (
    <AuthProvider>
      <UserDataProvider>{children}</UserDataProvider>
    </AuthProvider>
  )
}

describe('useLectures', () => {
  it('loads lectures and derives subjects', async () => {
    const mock = createTestSupabase({
      user: DEFAULT_USER,
      data: {
        lectures: [
          { id: 'l1', titleAr: 'مقدمة في البرمجة', titleEn: 'Intro', subjectAr: 'برمجة', subjectEn: 'Programming', date: '2026-01-01' },
          { id: 'l2', titleAr: 'الشبكات', titleEn: 'Networks', subjectAr: 'شبكات', subjectEn: 'Networks', date: '2026-01-02' },
        ],
      },
    })
    __setSupabaseMock(mock)

    const { result } = renderHook(() => useLectures(DEFAULT_USER, true), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.lectures).toHaveLength(2)
    expect(result.current.subjects).toContain('برمجة')
    expect(result.current.subjects).toContain('شبكات')
  })

  it('filters lectures by active subject', async () => {
    const mock = createTestSupabase({
      user: DEFAULT_USER,
      data: {
        lectures: [
          { id: 'l1', titleAr: 'مقدمة', titleEn: 'Intro', subjectAr: 'برمجة', subjectEn: 'Programming', date: '2026-01-01' },
          { id: 'l2', titleAr: 'الشبكات', titleEn: 'Networks', subjectAr: 'شبكات', subjectEn: 'Networks', date: '2026-01-02' },
        ],
      },
    })
    __setSupabaseMock(mock)

    const { result } = renderHook(() => useLectures(DEFAULT_USER, true), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    result.current.setActiveSubject('برمجة')
    await waitFor(() => expect(result.current.activeSubject).toBe('برمجة'))
    expect(result.current.filtered.map(l => l.id)).toEqual(['l1'])
  })
})
