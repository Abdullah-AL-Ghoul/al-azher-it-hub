import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RateLimitService } from '../rateLimitService'

describe('RateLimitService', () => {
  beforeEach(() => {
    RateLimitService.cleanup('student1')
    RateLimitService.cleanup('student2')
    vi.useFakeTimers()
  })

  afterEach(() => {
    RateLimitService.cleanup('student1')
    RateLimitService.cleanup('student2')
    vi.useRealTimers()
  })

  describe('checkStudentRateLimit', () => {
    it('allows the first request', () => {
      const result = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('allows up to 3 requests then blocks', () => {
      const r1 = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(r1.allowed).toBe(true)
      expect(r1.remaining).toBe(2)

      const r2 = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(r2.allowed).toBe(true)
      expect(r2.remaining).toBe(1)

      const r3 = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(r3.allowed).toBe(true)
      expect(r3.remaining).toBe(0)

      const r4 = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(r4.allowed).toBe(false)
      expect(r4.remaining).toBe(0)
    })

    it('allows requests after the window resets', () => {
      RateLimitService.checkStudentRateLimit('student1', '/lectures')
      RateLimitService.checkStudentRateLimit('student1', '/lectures')
      RateLimitService.checkStudentRateLimit('student1', '/lectures')

      const blocked = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(blocked.allowed).toBe(false)

      vi.advanceTimersByTime(65000)

      const allowed = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(allowed.allowed).toBe(true)
      expect(allowed.remaining).toBe(2)
    })

    it('returns allowed for empty studentId', () => {
      const result = RateLimitService.checkStudentRateLimit(null, '/lectures')
      expect(result.allowed).toBe(true)
    })
  })

  describe('checkSourceRateLimit', () => {
    it('allows up to 10 requests then blocks', () => {
      for (let i = 0; i < 10; i++) {
        const r = RateLimitService.checkSourceRateLimit('student1', '/sources')
        expect(r.allowed).toBe(true)
      }

      const blocked = RateLimitService.checkSourceRateLimit('student1', '/sources')
      expect(blocked.allowed).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('clears rate limit data for a specific user', () => {
      RateLimitService.checkStudentRateLimit('student1', '/lectures')
      RateLimitService.checkStudentRateLimit('student1', '/sources')
      RateLimitService.checkStudentRateLimit('student2', '/lectures')

      RateLimitService.cleanup('student1')

      const r1 = RateLimitService.checkStudentRateLimit('student1', '/lectures')
      expect(r1.remaining).toBe(2)

      const r2 = RateLimitService.checkStudentRateLimit('student2', '/lectures')
      expect(r2.remaining).toBe(1)
    })
  })
})
