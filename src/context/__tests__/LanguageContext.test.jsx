import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../LanguageContext'
import { __resetSupabaseMock } from '../../test-utils/mockSupabase'

beforeEach(() => {
  __resetSupabaseMock()
  // jsdom defaults to 'en-US', but the app's fallback is Arabic. Restore the
  // browser-language detection to 'ar' so tests that expect Arabic pass.
  Object.defineProperty(window.navigator, 'language', {
    value: 'ar',
    configurable: true,
    writable: true,
  })
  window.sessionStorage?.clear()
})

function renderUseLanguage() {
  return renderHook(() => useLanguage(), { wrapper: LanguageProvider })
}

describe('LanguageContext', () => {
  it('provides default lang ar', () => {
    const { result } = renderUseLanguage()
    expect(result.current.lang).toBe('ar')
  })

  it('follows the browser language when nothing is stored', () => {
    Object.defineProperty(window.navigator, 'language', {
      value: 'en-US',
      configurable: true,
      writable: true,
    })
    const { result } = renderUseLanguage()
    expect(result.current.lang).toBe('en')
  })

  it('falls back to ar for non-English browser languages', () => {
    Object.defineProperty(window.navigator, 'language', {
      value: 'fr-FR',
      configurable: true,
      writable: true,
    })
    const { result } = renderUseLanguage()
    expect(result.current.lang).toBe('ar')
  })

  it('t() returns the key for a missing key', () => {
    const { result } = renderUseLanguage()
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('t() resolves a real key', () => {
    const { result } = renderUseLanguage()
    expect(result.current.t('common.save')).toBe('حفظ')
  })

  it('t() interpolates double-brace {{name}}', () => {
    const { result } = renderUseLanguage()
    expect(result.current.t('profile.greeting', { name: 'عبدالله' })).toBe(
      'مرحبًا يا عبدالله!'
    )
  })

  it('t() interpolates single-brace {count} too', () => {
    const { result } = renderUseLanguage()
    expect(result.current.t('chatbot.lecturesCount', { count: 42 })).toContain('42')
  })

  it('t() interpolates params with special regex characters safely', () => {
    const { result } = renderUseLanguage()
    expect(result.current.t('home.welcome', { name: '$1.00' })).toBe(
      'مرحبًا بك، $1.00!'
    )
  })

  it('t() returns non-string values as-is', () => {
    const { result } = renderUseLanguage()
    expect(result.current.t('common.ok', { ok: 1 })).toBe('common.ok')
  })

  it('toggles lang to en and back', async () => {
    const { result } = renderUseLanguage()
    expect(result.current.lang).toBe('ar')
    result.current.toggleLang()
    await waitFor(() => expect(result.current.lang).toBe('en'))
    result.current.toggleLang()
    await waitFor(() => expect(result.current.lang).toBe('ar'))
  })
})
