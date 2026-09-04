import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState from '../EmptyState'
import { FiInbox } from 'react-icons/fi'

describe('EmptyState', () => {
  it('renders title, description, icon, and status role', () => {
    render(
      <EmptyState icon={FiInbox} title="لا نتائج" description="جرّب تعديل الفلتر" />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('لا نتائج')).toBeInTheDocument()
    expect(screen.getByText('جرّب تعديل الفلتر')).toBeInTheDocument()
  })

  it('renders an action node when provided', () => {
    render(<EmptyState title="فارغ" action={<button>أضف الآن</button>} />)
    expect(screen.getByRole('button', { name: 'أضف الآن' })).toBeInTheDocument()
  })

  it('maps known colors to gradient classes', () => {
    const { container } = render(<EmptyState icon={FiInbox} color="emerald" title="x" />)
    expect(container.querySelector('.bg-gradient-to-br')?.className).toContain('from-emerald-500')
  })

  it('falls back to the blue gradient for unknown colors', () => {
    const { container } = render(<EmptyState icon={FiInbox} color="chartreuse" title="x" />)
    expect(container.querySelector('.bg-gradient-to-br')?.className).toContain('from-blue-500')
  })

  it('omits title and description blocks when not passed', () => {
    const { container } = render(<EmptyState icon={FiInbox} />)
    expect(container.querySelector('h3')).toBeNull()
    expect(container.querySelector('p')).toBeNull()
  })
})
