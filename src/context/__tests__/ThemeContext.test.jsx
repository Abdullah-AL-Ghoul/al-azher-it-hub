import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

function storage() {
  return {
    get: () => sessionStorage.getItem('al_azher_theme'),
    set: (v) => sessionStorage.setItem('al_azher_theme', v),
    clear: () => sessionStorage.removeItem('al_azher_theme'),
  }
}

describe('ThemeContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to light when nothing is stored and the OS prefers light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('light')
    expect(result.current.dark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('cycles light → dark → amoled → light on toggle', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    expect(result.current.dark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('amoled')
    expect(document.documentElement.getAttribute('data-theme')).toBe('amoled')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('persists manual choices to sessionStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    act(() => result.current.toggle())
    expect(storage().get()).toBe('dark')
  })

  it('restores a stored manual theme on mount', () => {
    storage().set('amoled')
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.theme).toBe('amoled')
    expect(result.current.dark).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('amoled')
  })

  it('marks the theme as dark for both dark and amoled', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })
    expect(result.current.dark).toBe(false)
    act(() => result.current.toggle()) // dark
    expect(result.current.dark).toBe(true)
    act(() => result.current.toggle()) // amoled
    expect(result.current.dark).toBe(true)
  })
})
