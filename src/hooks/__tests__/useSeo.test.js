import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSeo } from '../useSeo'

function cleanHead() {
  document.title = ''
  document.head.querySelectorAll('meta[name="description"], meta[property], meta[name="robots"], link[rel="canonical"]').forEach(n => n.remove())
}

describe('useSeo', () => {
  beforeEach(cleanHead)

  it('sets title and canonical for a known route', () => {
    renderHook(() => useSeo('/lectures', 'ar'))
    expect(document.title).toContain('المحاضرات')
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain('/lectures')
  })

  it('uses the lecture-detail title for /lecture/:id', () => {
    renderHook(() => useSeo('/lecture/abc123', 'ar'))
    expect(document.title).toContain('المحاضرة')
  })

  it('uses the English title when lang is en', () => {
    renderHook(() => useSeo('/lectures', 'en'))
    expect(document.title).toContain('Lectures')
  })

  it('adds noindex for admin routes', () => {
    renderHook(() => useSeo('/admin', 'ar'))
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })

  it('does not add noindex for public routes', () => {
    renderHook(() => useSeo('/lectures', 'ar'))
    expect(document.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('falls back to the not-found title for unknown routes', () => {
    renderHook(() => useSeo('/this-does-not-exist', 'ar'))
    expect(document.title).toContain('الصفحة غير موجودة')
  })

  it('sets the html lang and dir attributes', () => {
    renderHook(() => useSeo('/', 'ar'))
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })
})
