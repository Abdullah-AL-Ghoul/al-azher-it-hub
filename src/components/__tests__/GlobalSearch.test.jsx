import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { renderWithProviders as render, screen, waitFor, within } from '../../test-utils/renderWithProviders'
import GlobalSearch from '../GlobalSearch'
import { createTestSupabase } from '../../test-utils/renderWithProviders'

const LECTURES = [
  { id: 'l1', titleAr: 'مقدمة في الشبكات', titleEn: 'Intro to Networks', subjectAr: 'شبكات', subjectEn: 'Networks' },
  { id: 'l2', titleAr: 'خوارزميات', titleEn: 'Algorithms', subjectAr: 'علوم حاسوب', subjectEn: 'CS' },
]
const SOURCES = [{ id: 's1', titleAr: 'ملخص الشبكات', titleEn: 'Networks Summary', subjectAr: 'شبكات', subjectEn: 'Networks' }]
const ADDITIONS = [{ id: 'a1', titleAr: 'تمرين برمجة', titleEn: 'Coding exercise' }]

function seeded() {
  // A signed-in user: GlobalSearch renders null for anonymous visitors.
  return createTestSupabase({ data: { lectures: LECTURES, sources: SOURCES, additions: ADDITIONS } })
}

const openPanel = async (user) => {
  // AuthContext resolves the session asynchronously; wait for the trigger.
  const trigger = await waitFor(() => screen.getByRole('button', { name: /بحث عالمي|Global search/ }))
  await user.click(trigger)
  return screen.getByRole('dialog')
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens with the trigger button and shows the empty state', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch />, { supabase: seeded() })
    const panel = await openPanel(user)
    expect(panel).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('ابدأ الكتابة للبحث')).toBeInTheDocument()
  })

  it('opens via the global Ctrl+K shortcut', async () => {
    render(<GlobalSearch />, { supabase: seeded() })
    await waitFor(() => screen.getByRole('button', { name: /بحث عالمي|Global search/ }))
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch />, { supabase: seeded() })
    await openPanel(user)
    await user.keyboard('{Escape}')
    // AnimatePresence plays an exit animation before unmounting.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 2000 })
  })

  it('finds lectures and sources for a query', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch />, { supabase: seeded() })
    await openPanel(user)
    await user.type(screen.getByRole('combobox'), 'الشبكات')
    const listbox = await waitFor(() => screen.getByRole('listbox'), { timeout: 3000 })
    expect(within(listbox).getByText('مقدمة في الشبكات')).toBeInTheDocument()
    expect(within(listbox).getByText('ملخص الشبكات')).toBeInTheDocument()
  })

  it('shows the no-results state for unknown queries', async () => {
    const user = userEvent.setup()
    render(<GlobalSearch />, { supabase: seeded() })
    await openPanel(user)
    await user.type(screen.getByRole('combobox'), 'xyzzy-not-found')
    await waitFor(() => expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('navigates to the lecture page when a result is chosen', async () => {
    let path = null
    const user = userEvent.setup()
    render(
      <>
        <GlobalSearch />
        <LocationProbe onLocation={(p) => { path = p }} />
      </>,
      { supabase: seeded() }
    )
    await openPanel(user)
    await user.type(screen.getByRole('combobox'), 'خوارزميات')
    const item = await waitFor(() => screen.getByText('خوارزميات'), { timeout: 3000 })
    await user.click(item)
    await waitFor(() => expect(path).toBe('/lecture/l2'))
  })
})

function LocationProbe({ onLocation }) {
  const location = useLocation()
  onLocation(location.pathname)
  return null
}
