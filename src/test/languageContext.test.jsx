import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../context/LanguageContext'

function TestComponent() {
  const { lang, toggleLang, t } = useLanguage()
  return (
    <div>
      <span data-testid="current-lang">{lang}</span>
      <span data-testid="translated-common">{t('common.cancel')}</span>
      <button onClick={toggleLang}>Toggle</button>
    </div>
  )
}

describe('LanguageContext and i18n', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('al_azher_lang', 'ar')
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  })

  it('initializes with arabic language when stored and provides translations', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    const currentLang = screen.getByTestId('current-lang')
    expect(currentLang.textContent).toBe('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')

    const cancelText = screen.getByTestId('translated-common')
    expect(cancelText.textContent).toBeTruthy()
    expect(cancelText.textContent).toBe('إلغاء')
  })

  it('toggles language and synchronizes html attributes', async () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    )

    const toggleBtn = screen.getByText('Toggle')
    await act(async () => {
      toggleBtn.click()
    })

    const currentLang = screen.getByTestId('current-lang')
    expect(currentLang.textContent).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(document.documentElement.dir).toBe('ltr')
    expect(sessionStorage.getItem('al_azher_lang')).toBe('en')
  })
})
