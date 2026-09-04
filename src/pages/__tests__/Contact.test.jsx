import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders as render, screen } from '../../test-utils/renderWithProviders'
import Contact from '../Contact'

describe('Contact page', () => {
  it('renders the full contact page without crashing (regression: module-scope t)', () => {
    render(<Contact />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument()
  })

  it('renders the WhatsApp deep link and social links', () => {
    const { container } = render(<Contact />)
    const wa = container.querySelector('a[href*="wa.me/970592127061"]')
    expect(wa).not.toBeNull()
    expect(wa.getAttribute('href')).toContain('text=')
    expect(container.querySelector('a[href*="linkedin.com"]')).not.toBeNull()
  })

  it('shows the success celebration after submitting the form', async () => {
    // jsdom cannot navigate to mailto: — silence its navigation error.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Contact />)
    await user.type(screen.getByRole('textbox', { name: /اسمك الكامل/ }), 'طالب')
    await user.type(screen.getByRole('textbox', { name: /بريدك الإلكتروني/ }), 'a@b.com')
    await user.type(screen.getByRole('textbox', { name: /عنوان الرسالة/ }), 'سؤال')
    await user.type(screen.getByLabelText('الرسالة', { exact: true }), 'رسالة اختبار')
    await user.click(screen.getByRole('button', { type: 'submit' }))
    // 500ms submit timer flips the success state.
    await new Promise((r) => setTimeout(r, 1200))
    expect(screen.getByText('تم الإرسال بنجاح!')).toBeInTheDocument()
  }, 10_000)
})
