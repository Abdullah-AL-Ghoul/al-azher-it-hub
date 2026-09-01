import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

function Boom() {
  throw new Error('kaboom')
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary lang="ar">
        <p>محتوى سليم</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('محتوى سليم')).toBeInTheDocument()
  })

  it('renders the Arabic fallback UI when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary lang="ar">
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('حدث خطأ!')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()
  })

  it('renders the English fallback UI in en mode', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary lang="en">
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.queryByText(/حدث خطأ/)).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()
  })
})
