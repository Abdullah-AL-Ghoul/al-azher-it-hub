import { describe, it, expect } from 'vitest'
import { sanitizeString, sanitizeObject } from '../sanitize'

describe('sanitizeString', () => {
  it('removes HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  it('removes javascript: scheme', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)')
  })

  it('removes vbscript: scheme', () => {
    expect(sanitizeString('vbscript:msgbox(1)')).toBe('msgbox(1)')
  })

  it('removes data: scheme', () => {
    expect(sanitizeString('data:text/html,<script>alert(1)</script>')).toBe(
      'text/html,alert(1)'
    )
  })

  it('removes on* event handlers', () => {
    expect(sanitizeString('click me onmouseover="evil()"')).toBe('click me')
  })

  it('encodes bare < and >', () => {
    expect(sanitizeString('<3')).toBe('&lt;3')
  })

  it('trims and truncates to maxLength', () => {
    const r = sanitizeString('a'.repeat(600), 100)
    expect(r).toHaveLength(100)
  })

  it('returns non-string values as-is', () => {
    expect(sanitizeString(42)).toBe(42)
    expect(sanitizeString(null)).toBeNull()
    expect(sanitizeString(undefined)).toBeUndefined()
  })
})

describe('sanitizeObject', () => {
  it('sanitizes specified fields', () => {
    const obj = { name: '<script>alert(1)</script>', desc: 'safe', age: 30 }
    const r = sanitizeObject(obj, ['name', 'desc'])
    expect(r.name).toBe('alert(1)')
    expect(r.desc).toBe('safe')
    expect(r.age).toBe(30)
  })

  it('returns non-object as-is', () => {
    expect(sanitizeObject(null, [])).toBeNull()
  })
})
