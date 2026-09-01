import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders as render, screen } from '../../../test-utils/renderWithProviders'
import ErrorState from '../ErrorState'

describe('ErrorState', () => {
  it('renders nothing without an error', () => {
    const { container } = render(<ErrorState error={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an alert with the error message', () => {
    render(<ErrorState error={new Error('boom')} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('accepts a plain string error', () => {
    render(<ErrorState error="network down" />)
    expect(screen.getByText('network down')).toBeInTheDocument()
  })

  it('shows a custom title when provided', () => {
    render(<ErrorState error="x" title="عنوان الخطأ" />)
    expect(screen.getByText('عنوان الخطأ')).toBeInTheDocument()
  })

  it('calls onRetry from the retry button', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState error="x" onRetry={onRetry} />)
    await user.click(screen.getByRole('button'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('compact mode keeps the alert role and retry affordance', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState error="broken" compact onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('broken')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /حاول مرة أخرى|retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
