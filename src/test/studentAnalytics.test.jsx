import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StudentAnalyticsPanel from '../components/AdminDashboard/StudentAnalyticsPanel'
import { LanguageProvider } from '../context/LanguageContext'

describe('StudentAnalyticsPanel Suite', () => {
  const mockUsers = [
    { studentId: '20230001', name: 'أحمد علي', major: 'هندسة البرمجيات', role: 'student', createdAt: new Date().toISOString(), lastVisit: new Date().toISOString() },
    { studentId: '20230002', name: 'سارة خالد', major: 'علوم الحاسوب', role: 'student', createdAt: new Date().toISOString(), lastVisit: new Date().toISOString() },
    { studentId: 'oauth_user123', name: 'محمد جوجل', major: 'الأمن السيبراني', role: 'student', createdAt: new Date().toISOString(), lastVisit: null },
    { studentId: 'admin_1', name: 'المسؤول', role: 'admin' },
  ]

  const mockLogs = [
    { studentId: '20230001', name: 'أحمد علي', type: 'VIEW_LECTURE', timestamp: new Date().toISOString() },
    { studentId: '20230001', name: 'أحمد علي', type: 'ADD_FAVORITE', timestamp: new Date().toISOString() },
    { studentId: '20230002', name: 'سارة خالد', type: 'RATE_LECTURE', timestamp: new Date().toISOString() },
  ]

  it('renders correctly and filters out admin users from student totals', () => {
    render(
      <LanguageProvider>
        <StudentAnalyticsPanel users={mockUsers} studentLogs={mockLogs} isArabic={true} />
      </LanguageProvider>
    )

    // 3 students out of 4 total users (since 1 is admin)
    expect(screen.getAllByText('3').length).toBeGreaterThan(0)
    expect(screen.getAllByText('هندسة البرمجيات').length).toBeGreaterThan(0)
    expect(screen.getAllByText('علوم الحاسوب').length).toBeGreaterThan(0)
  })

  it('computes top engaged student rankings properly', () => {
    render(
      <LanguageProvider>
        <StudentAnalyticsPanel users={mockUsers} studentLogs={mockLogs} isArabic={true} />
      </LanguageProvider>
    )

    // أحمد علي has 2 actions (VIEW_LECTURE 3pts + ADD_FAVORITE 2pts = 5pts), should be ranked #1
    expect(screen.getByText('أحمد علي')).toBeDefined()
    expect(screen.getByText('5 نقطة')).toBeDefined()
  })
})
