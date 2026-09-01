import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders as render, screen } from '../../test-utils/renderWithProviders'
import FilterBar from '../FilterBar'

const SUBJECTS = ['رياضيات', 'برمجة', 'شبكات']
const COUNTS = { 'رياضيات': 5, 'برمجة': 3, 'شبكات': 2 }

function mount(overrides = {}) {
  const props = {
    subjects: SUBJECTS,
    subjectCounts: COUNTS,
    activeSubject: 'all',
    onSubjectChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    searchPlaceholder: 'ابحث...',
    allLabel: 'الكل',
    resultCount: 10,
    ...overrides,
  }
  render(<FilterBar {...props} />)
  return props
}

describe('FilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the search input, all-button, and one button per subject', () => {
    mount()
    expect(screen.getByRole('textbox', { name: 'ابحث...' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /الكل/ })).toBeInTheDocument()
    for (const s of SUBJECTS) {
      expect(screen.getByRole('button', { name: new RegExp(s) })).toBeInTheDocument()
    }
  })

  it('shows result counts per subject chip', () => {
    mount()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('marks the active subject with aria-pressed', () => {
    mount({ activeSubject: 'برمجة' })
    const chip = screen.getByRole('button', { name: /برمجة/ })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /الكل/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports subject selection immediately', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const props = mount()
    await user.click(screen.getByRole('button', { name: /شبكات/ }))
    expect(props.onSubjectChange).toHaveBeenCalledWith('شبكات')
  })

  it('debounces search input by 300ms', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const props = mount()
    await user.type(screen.getByRole('textbox'), 'abc')
    expect(props.onSearchChange).not.toHaveBeenCalled()
    await actNow()
    expect(props.onSearchChange).toHaveBeenCalledWith('abc')
  })

  it('clear button resets the search at once', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const props = mount({ searchQuery: 'term' })
    const clear = screen.getByRole('button', { name: /مسح البحث|Clear search/ })
    await user.click(clear)
    expect(props.onSearchChange).toHaveBeenCalledWith('')
  })

  it('shows the reset-filters button only when a filter is active and resets on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const props = mount({ activeSubject: 'برمجة' })
    const reset = screen.getByRole('button', { name: /إعادة ضبط الفلاتر|Reset filters/ })
    expect(reset).toBeInTheDocument()
    await user.click(reset)
    // resetAll pushes both filters back to their defaults
    expect(props.onSubjectChange).toHaveBeenCalledWith('all')
    expect(props.onSearchChange).toHaveBeenCalledWith('')
  })
})

// Advance past the debounce without fighting userEvent's own clock.
async function actNow() {
  await vi.advanceTimersByTimeAsync(320)
}
