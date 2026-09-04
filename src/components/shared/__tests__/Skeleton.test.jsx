import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Skeleton from '../Skeleton'

describe('Skeleton', () => {
  it('renders a hidden decorative div with the skeleton class and custom classes', () => {
    const { container } = render(<Skeleton className="h-40 w-full rounded-xl" />)
    const el = container.firstChild
    expect(el).toHaveClass('skeleton', 'h-40', 'w-full', 'rounded-xl')
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })

  it('works without extra classes', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('skeleton')
  })
})
