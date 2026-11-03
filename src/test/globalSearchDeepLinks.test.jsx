import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import GlobalSearch from '../components/GlobalSearch'
import { LanguageProvider } from '../context/LanguageContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'stu-1', studentId: '20220299', name: 'Abdullah Al-Ghoul' },
  }),
}))

vi.mock('../services', () => ({
  getLectures: vi.fn().mockResolvedValue([
    {
      id: 'lec-prog-1',
      titleAr: 'مقدمة في برمجة الحاسوب',
      titleEn: 'Introduction to Computer Programming',
      subjectAr: 'برمجة الحاسوب 1',
      subjectEn: 'Computer Programming 1',
      doctorAr: 'د. إياد الشامي',
      doctorEn: 'Dr. Eyad Al-Shami',
    },
  ]),
  getSources: vi.fn().mockResolvedValue([
    {
      id: 'src-prog-1',
      titleAr: 'ملخص برمجة الحاسوب شامل',
      titleEn: 'Comprehensive Computer Programming Summary',
      subjectAr: 'برمجة الحاسوب 1',
      subjectEn: 'Computer Programming 1',
      type: 'summary',
    },
  ]),
  getAdditions: vi.fn().mockResolvedValue([]),
  getAllSubtitles: vi.fn().mockResolvedValue([
    {
      id: 'sub-prog-1',
      lectureId: 'lec-prog-1',
      language: 'ar',
      published: true,
      cues: [
        {
          id: 'cue-1',
          start: 125,
          end: 132,
          text: 'في هذه الدقيقة نشرح أساسيات برمجة الحاسوب والمتغيرات',
        },
        {
          id: 'cue-long',
          start: 3725,
          end: 3735,
          text: 'شرح متقدم في برمجة الحاسوب بعد ساعة من المحاضرة',
        },
      ],
    },
  ]),
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location-probe">
      {location.pathname}
      {location.search}
    </div>
  )
}

function renderGlobalSearch(lang = 'ar') {
  sessionStorage.setItem('al_azher_lang', lang)
  localStorage.setItem('al_azher_lang', lang)
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LanguageProvider>
        <GlobalSearch />
        <LocationProbe />
      </LanguageProvider>
    </MemoryRouter>
  )
}

describe('GlobalSearch Category Filtering & Deep-Linking', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.scrollTo = vi.fn()
  })

  it('does not starve lecture, transcript, or source categories when 24+ courses match a common query', async () => {
    renderGlobalSearch('ar')

    // Open search modal via Ctrl+K
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })

    const input = await screen.findByPlaceholderText(/ابحث في المساقات/)
    fireEvent.change(input, { target: { value: 'برمجة' } })

    // Wait for debounced search (150ms) + async mocked services
    await waitFor(() => {
      expect(screen.getByText('مقدمة في برمجة الحاسوب')).toBeDefined()
    })

    // Switch to Lectures category pill
    fireEvent.click(screen.getByText('المحاضرات'))
    expect(await screen.findByText('مقدمة في برمجة الحاسوب')).toBeDefined()

    // Switch to Transcripts category pill and verify MM:SS and HH:MM:SS timestamps
    fireEvent.click(screen.getByText('نصوص المحاضرات'))
    expect(await screen.findByText(/أساسيات برمجة الحاسوب/)).toBeDefined()
    expect(screen.getByText(/⏱️ 02:05/)).toBeDefined()
    expect(screen.getByText(/⏱️ 01:02:05/)).toBeDefined()

    // Switch to Sources category pill
    fireEvent.click(screen.getByText('المصادر والامتحانات'))
    expect(await screen.findByText('ملخص برمجة الحاسوب شامل')).toBeDefined()
  }, 15000)

  it('deep-links transcript cue selection to /lecture/:id?t=<seconds>', async () => {
    renderGlobalSearch('ar')

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const input = await screen.findByPlaceholderText(/ابحث في المساقات/)
    fireEvent.change(input, { target: { value: 'برمجة' } })

    await waitFor(() => {
      expect(screen.getByText('مقدمة في برمجة الحاسوب')).toBeDefined()
    })

    fireEvent.click(screen.getByText('نصوص المحاضرات'))

    const cueText = await screen.findByText(/أساسيات برمجة الحاسوب/)
    const cueBtn = cueText.closest('button')
    fireEvent.click(cueBtn)

    expect(screen.getByTestId('location-probe').textContent).toBe('/lecture/lec-prog-1?t=125')
  }, 15000)

  it('deep-links source selection to /sources?q=<title>', async () => {
    renderGlobalSearch('ar')

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const input = await screen.findByPlaceholderText(/ابحث في المساقات/)
    fireEvent.change(input, { target: { value: 'ملخص برمجة' } })

    const srcText = await screen.findByText('ملخص برمجة الحاسوب شامل')
    const srcBtn = srcText.closest('button')
    fireEvent.click(srcBtn)

    expect(decodeURIComponent(screen.getByTestId('location-probe').textContent)).toBe(
      '/sources?q=ملخص برمجة الحاسوب شامل'
    )
  }, 15000)
})
