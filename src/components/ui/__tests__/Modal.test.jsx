import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders as render, screen } from '../../../test-utils/renderWithProviders'
import Modal from '../Modal'

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="t"><p>body</p></Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders an accessible dialog when open', () => {
    render(<Modal isOpen onClose={() => {}} title="لوحة التفاصيل"><p>body</p></Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('لوحة التفاصيل')).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('shows a close button that calls onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="t"><p>body</p></Modal>)
    await user.click(screen.getByRole('button', { name: /إغلاق|close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on overlay click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(<Modal isOpen onClose={onClose} title="t"><p>body</p></Modal>)
    const overlay = container.querySelector('.bg-black\\/60')
    await user.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('applies the size class', () => {
    const { container } = render(<Modal isOpen onClose={() => {}} size="xl" title="t"><p>b</p></Modal>)
    expect(container.querySelector('.max-w-4xl')).not.toBeNull()
  })
})
