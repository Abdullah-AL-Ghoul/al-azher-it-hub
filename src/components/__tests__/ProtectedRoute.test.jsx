import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import { AuthProvider } from '../../context/AuthContext'
import { createMockSupabase, __setSupabaseMock, __resetSupabaseMock, DEFAULT_USER, DEFAULT_SESSION } from '../../test-utils/mockSupabase'

const SESSION_KEY = 'al_azher_session'

function renderAt(route, mock) {
  __setSupabaseMock(mock)
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>landing</div>} />
          <Route path="/home" element={<div>student-home</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <div>admin-dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lectures"
            element={
              <ProtectedRoute>
                <div>lectures-page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetSupabaseMock()
  })

  it('holds on a loading gate (never redirects) while session restore is pending', () => {
    const never = new Promise(() => {})
    const mock = createMockSupabase({ auth: { getSession: () => never }, data: { users: [] } })
    renderAt('/lectures', mock)

    expect(screen.queryByText('lectures-page')).not.toBeInTheDocument()
    expect(screen.queryByText('landing')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to landing once restore completes with no session', async () => {
    const mock = createMockSupabase({ session: null, data: { users: [] } })
    renderAt('/lectures', mock)

    await waitFor(() => expect(screen.getByText('landing')).toBeInTheDocument())
    expect(screen.queryByText('lectures-page')).not.toBeInTheDocument()
  })

  it('renders children for an authenticated student', async () => {
    const mock = createMockSupabase({ data: { users: [DEFAULT_USER] } })
    renderAt('/lectures', mock)

    await waitFor(() => expect(screen.getByText('lectures-page')).toBeInTheDocument())
  })

  it('redirects students away from admin-only routes', async () => {
    const mock = createMockSupabase({ data: { users: [DEFAULT_USER] } })
    renderAt('/admin', mock)

    await waitFor(() => expect(screen.getByText('student-home')).toBeInTheDocument())
    expect(screen.queryByText('admin-dashboard')).not.toBeInTheDocument()
  })

  it('allows admins into admin-only routes', async () => {
    const admin = { ...DEFAULT_USER, role: 'admin' }
    const mock = createMockSupabase({
      user: admin,
      session: {
        ...DEFAULT_SESSION,
        user: { ...DEFAULT_SESSION.user, user_metadata: { studentId: admin.studentId, name: admin.name } },
      },
      data: { users: [admin] },
    })
    renderAt('/admin', mock)

    await waitFor(() => expect(screen.getByText('admin-dashboard')).toBeInTheDocument())
  })

  it('restores a deep-linked protected route from a cached session without redirecting to /', async () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ studentId: DEFAULT_USER.studentId, name: DEFAULT_USER.name, role: 'student' })
    )
    const mock = createMockSupabase({ session: null, data: { users: [DEFAULT_USER] } })
    renderAt('/lectures', mock)

    await waitFor(() => expect(screen.getByText('lectures-page')).toBeInTheDocument())
    expect(screen.queryByText('landing')).not.toBeInTheDocument()
  })
})
