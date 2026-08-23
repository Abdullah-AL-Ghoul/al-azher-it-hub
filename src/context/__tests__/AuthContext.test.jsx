import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../AuthContext'
import { createMockSupabase, __setSupabaseMock, __resetSupabaseMock, DEFAULT_USER } from '../../test-utils/mockSupabase'

const SESSION_KEY = 'al_azher_session'

function Probe() {
  const { user, loading } = useAuth()
  if (loading) return <div data-testid="auth-loading">loading</div>
  return <div data-testid="auth-user">{user ? user.studentId : 'anonymous'}</div>
}

function renderAuth(mock) {
  __setSupabaseMock(mock)
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
}

describe('AuthProvider session restore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetSupabaseMock()
  })

  it('shows loading while restoring a cold (no stored) session, then resolves the user from Supabase', async () => {
    const mock = createMockSupabase({ data: { users: [DEFAULT_USER] } })
    const { getByTestId } = renderAuth(mock)

    expect(getByTestId('auth-loading')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent(DEFAULT_USER.studentId)
    })
    expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument()
  })

  it('resolves to anonymous without a redirect-window gap when no session exists', async () => {
    const mock = createMockSupabase({ session: null, data: { users: [] } })
    const { getByTestId } = renderAuth(mock)

    expect(getByTestId('auth-loading')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('anonymous')
    })
  })

  it('clears a stale cached session when the DB profile no longer exists', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ studentId: 'ghost-user', name: 'Ghost', role: 'student' }))
    const mock = createMockSupabase({ session: null, data: { users: [] } })
    renderAuth(mock)

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('anonymous')
    })
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('keeps a cached session and corrects role from the DB', async () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ studentId: DEFAULT_USER.studentId, name: DEFAULT_USER.name, role: 'admin' })
    )
    const adminRow = { ...DEFAULT_USER, role: 'student' }
    const mock = createMockSupabase({ session: null, data: { users: [adminRow] } })
    renderAuth(mock)

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent(DEFAULT_USER.studentId)
    })
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    expect(parsed.role).toBe('student')
  })
})

describe('AuthProvider login throttling', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetSupabaseMock()
  })

  function LoginProbe() {
    const { login } = useAuth()
    return (
      <button
        onClick={() => login('student-1', 'wrong-password').then((r) => {
          window.__lastLoginResult = r
        })}
      >
        try-login
      </button>
    )
  }

  it('locks out after 5 consecutive failed attempts without calling the service again', async () => {
    const spy = vi.fn(async () => ({ ok: false, error: 'INVALID_CREDENTIALS' }))
    const mock = createMockSupabase({
      auth: { signInWithPassword: spy },
      rpc: async () => ({ data: null, error: { message: 'no user' } }),
      data: { users: [] },
    })
    __setSupabaseMock(mock)
    const user = userEvent.setup()
    render(<MemoryRouter><AuthProvider><LoginProbe /></AuthProvider></MemoryRouter>)

    const button = screen.getByText('try-login')
    for (let i = 0; i < 5; i++) {
      await act(async () => { await user.click(button) })
      await waitFor(() => expect(window.__lastLoginResult?.ok).toBe(false))
    }

    const callsAfterFive = spy.mock.calls.length
    await act(async () => { await user.click(button) })
    await waitFor(() => expect(window.__lastLoginResult.error).toBe('TOO_MANY_ATTEMPTS'))
    expect(spy.mock.calls.length).toBe(callsAfterFive)
    expect(window.__lastLoginResult.retryAfter).toBeGreaterThan(0)
  })
})

describe('AuthProvider logout', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetSupabaseMock()
  })

  function LogoutProbe() {
    const { user, loading, logout } = useAuth()
    if (loading) return <div data-testid="auth-loading">loading</div>
    return (
      <div>
        <div data-testid="auth-user">{user ? user.studentId : 'anonymous'}</div>
        <button onClick={logout}>sign-out</button>
      </div>
    )
  }

  it('clears the user and persisted session on logout', async () => {
    __setSupabaseMock(createMockSupabase({ data: { users: [DEFAULT_USER] } }))
    const user = userEvent.setup()
    render(<MemoryRouter><AuthProvider><LogoutProbe /></AuthProvider></MemoryRouter>)
    await waitFor(() => expect(screen.getByTestId('auth-user')).toHaveTextContent(DEFAULT_USER.studentId))

    await act(async () => { await user.click(screen.getByText('sign-out')) })

    await waitFor(() => expect(screen.getByTestId('auth-user')).toHaveTextContent('anonymous'))
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })
})

describe('AuthProvider signup', () => {
  beforeEach(() => {
    sessionStorage.clear()
    __resetSupabaseMock()
  })

  function SignupProbe() {
    const { signup } = useAuth()
    return (
      <button
        onClick={() =>
          registerVia(signup)
        }
      >
        do-signup
      </button>
    )
  }

  async function registerVia(signup) {
    window.__lastSignup = await signup('New Student', 'student-9', 'secret123', 'CS', 's9@test.com')
  }

  it('surfaces service failure without setting a session', async () => {
    const mock = createMockSupabase({
      auth: { signUp: async () => ({ data: { user: null }, error: { message: 'email exists' } }) },
      rpc: async () => ({ data: null, error: { message: 'denied' } }),
      data: { users: [] },
    })
    __setSupabaseMock(mock)
    const user = userEvent.setup()
    render(<MemoryRouter><AuthProvider><SignupProbe /></AuthProvider></MemoryRouter>)

    await act(async () => { await user.click(screen.getByText('do-signup')) })
    await waitFor(() => expect(window.__lastSignup).toBeDefined())
    expect(window.__lastSignup.ok).toBe(false)
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')).toBeNull()
  })
})
