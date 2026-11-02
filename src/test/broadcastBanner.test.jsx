import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BroadcastBanner from '../components/shared/BroadcastBanner'
import { LanguageProvider } from '../context/LanguageContext'
import {
  saveBroadcast,
  clearBroadcast,
  restoreDefaultBroadcast,
  DEFAULT_BROADCAST,
} from '../services/broadcast'

function renderBanner(lang = 'ar') {
  sessionStorage.setItem('al_azher_lang', lang)
  localStorage.setItem('al_azher_lang', lang)
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <BroadcastBanner />
      </LanguageProvider>
    </MemoryRouter>
  )
}

describe('BroadcastBanner Component Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    document.body.className = ''
    window.scrollTo = vi.fn()
    vi.restoreAllMocks()
  })

  it('renders accredited default broadcast banner in Arabic for new visitors', () => {
    renderBanner('ar')

    // Academic badge and text
    expect(screen.getByText('أكاديمي')).toBeDefined()
    expect(screen.getByText(/نظام ترجمة وتفريغ المحاضرات الذكي/)).toBeDefined()
    expect(screen.getByText('استعراض المحاضرات')).toBeDefined()

    // Sets body class for clearance offset
    expect(document.body.classList.contains('has-broadcast-banner')).toBe(true)
  })

  it('renders in English when language is switched to en', () => {
    renderBanner('en')

    expect(screen.getByText('ACADEMIC')).toBeDefined()
    expect(screen.getByText(/Academic Notice/)).toBeDefined()
    expect(screen.getByText('Explore Lectures')).toBeDefined()
  })

  it('hides the banner when the student clicks dismiss', async () => {
    renderBanner('ar')

    const dismissBtn = screen.getByRole('button', { name: /إغلاق الإعلان|Dismiss/i })
    expect(dismissBtn).toBeDefined()

    await act(async () => {
      fireEvent.click(dismissBtn)
    })

    await waitFor(() => {
      expect(screen.queryByText('أكاديمي')).toBeNull()
      expect(document.body.classList.contains('has-broadcast-banner')).toBe(false)
    })
  })

  it('keeps pinned announcements visible and omits dismiss button', () => {
    saveBroadcast({
      id: 'bc_pinned_emergency',
      type: 'urgent',
      titleAr: 'تنبيه طارئ معتمد',
      messageAr: 'إعلان مثبت غير قابل للتجاهل',
      active: true,
      dismissible: false,
      pinned: true,
    })

    renderBanner('ar')

    expect(screen.getByText('عاجل')).toBeDefined()
    expect(screen.getByText('تنبيه طارئ معتمد')).toBeDefined()
    // Dismiss button should not exist
    expect(screen.queryByRole('button', { name: /إغلاق الإعلان|Dismiss/i })).toBeNull()
  })

  it('does not render anything when broadcast is explicitly cleared or inactive', () => {
    clearBroadcast()

    const { container } = renderBanner('ar')
    expect(container.firstChild).toBeNull()
    expect(document.body.classList.contains('has-broadcast-banner')).toBe(false)
  })

  it('updates dynamically in real-time when a new broadcast event is dispatched', async () => {
    renderBanner('ar')

    expect(screen.getByText('أكاديمي')).toBeDefined()

    // Admin pushes urgent broadcast live
    await act(async () => {
      saveBroadcast({
        id: 'bc_realtime_urgent',
        type: 'urgent',
        titleAr: 'إعلان عاجل ومباشر',
        messageAr: 'تم تحديث جدول الاختبارات',
        active: true,
      })
    })

    await waitFor(() => {
      expect(screen.getByText('عاجل')).toBeDefined()
      expect(screen.getByText('إعلان عاجل ومباشر')).toBeDefined()
    })
  })
})
