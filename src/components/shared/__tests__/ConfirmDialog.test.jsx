import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders as render, screen } from '../../../test-utils/renderWithProviders'
import ConfirmDialog from '../ConfirmDialog'

function mount(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'حذف العنصر',
    message: 'لا يمكن التراجع عن هذه العملية',
    ...overrides,
  }
  render(<ConfirmDialog {...props} />)
  return props
}

const confirmButton = () => screen.getAllByRole('button').find((b) => /تأكيد|confirm|حذف|delete/i.test(b.textContent || ''))
const cancelButton = () => screen.getAllByRole('button').find((b) => /إلغاء|cancel/i.test(b.textContent || ''))

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    render(<ConfirmDialog isOpen={false} onClose={() => {}} onConfirm={() => {}} title="t" message="m" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the dialog with title and message when open', () => {
    mount()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('حذف العنصر')).toBeInTheDocument()
    expect(screen.getByText('لا يمكن التراجع عن هذه العملية')).toBeInTheDocument()
  })

  it('calls onClose when the cancel button is clicked', async () => {
    const user = userEvent.setup()
    const props = mount()
    await user.click(cancelButton())
    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  it('closes after a successful confirm', async () => {
    const user = userEvent.setup()
    const props = mount({ onConfirm: vi.fn().mockResolvedValue() })
    await user.click(confirmButton())
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('stays open when confirm rejects so the user can retry', async () => {
    const user = userEvent.setup()
    const props = mount({ onConfirm: vi.fn().mockRejectedValue(new Error('nope')) })
    await user.click(confirmButton())
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
    expect(props.onClose).not.toHaveBeenCalled()
  })

  it('uses custom button labels when provided', () => {
    mount({ confirmText: 'احذف', cancelText: 'تراجع' })
    expect(screen.getByText('احذف')).toBeInTheDocument()
    expect(screen.getByText('تراجع')).toBeInTheDocument()
  })
})
