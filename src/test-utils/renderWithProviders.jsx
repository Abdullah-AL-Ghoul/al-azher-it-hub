import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { LanguageProvider } from '@context/LanguageContext'
import { ThemeProvider } from '@context/ThemeContext'
import { AuthProvider } from '@context/AuthContext'
import { ScrollProvider } from '@hooks/useScrollManager'
import { createMockSupabase, __setSupabaseMock, __resetSupabaseMock, DEFAULT_USER, DEFAULT_SESSION } from './mockSupabase'

// A predictable, unauthenticated-looking test identity the providers can use.
export const defaultUser = DEFAULT_USER
export { DEFAULT_SESSION as defaultSession }

const STORAGE = {
  lang: 'al_azher_lang',
  theme: 'al_azher_theme',
  session: 'al_azher_session',
}

// Create a Supabase mock pre-seeded with a test user and idempotent session.
export function createTestSupabase(options = {}) {
  const user = options.user || defaultUser
  const session = options.session === null ? null : options.session || {
    ...DEFAULT_SESSION,
    user: { ...DEFAULT_SESSION.user, ...(options.authUser || {}), ...(user ? {
      id: user.authUserId || 'auth-uid-1',
      email: user.email || defaultUser.email,
      user_metadata: { studentId: user.studentId, name: user.name },
    } : {}) },
  }
  return createMockSupabase({
    ...options,
    user,
    session,
    data: { users: [user], ...(options.data || {}) },
  })
}

// Build the provider tree. Provider order mirrors src/App composition:
// Language -> Theme -> Scroll -> Auth -> (Router) -> children.
function ProviderTree({ lang, theme, user, providers, children }) {
  if (typeof window !== 'undefined') {
    if (lang) window.sessionStorage?.setItem(STORAGE.lang, lang)
    if (theme) window.sessionStorage?.setItem(STORAGE.theme, theme)
    if (user) window.sessionStorage?.setItem(STORAGE.session, JSON.stringify(user))
  }

  let tree = children
  if (providers && Array.isArray(providers)) {
    tree = providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, tree)
  }

  if (user) {
    tree = <AuthProvider>{tree}</AuthProvider>
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <ScrollProvider>{tree}</ScrollProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}

export function renderWithProviders(ui, options = {}) {
  const {
    lang = 'ar',
    theme = 'light',
    user = defaultUser,
    route = '/',
    routes = [route],
    providers,
    router = true,
    supabase,
    ...renderOptions
  } = options

  // Install a fresh Supabase mock so AuthProvider/services never hit the network.
  __resetSupabaseMock()
  const mock = supabase || createTestSupabase({ user })
  __setSupabaseMock(mock)

  const content = (
    <ProviderTree lang={lang} theme={theme} user={user} providers={providers}>
      {ui}
    </ProviderTree>
  )

  const wrapped = router ? <MemoryRouter initialEntries={routes}>{content}</MemoryRouter> : content

  return render(wrapped, renderOptions)
}

export * from '@testing-library/react'
