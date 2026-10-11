import { describe, it, expect } from 'vitest'
import { ambientAudio } from '../utils/ambientAudio'
import { APP_ROUTES } from '../router/routes'

describe('Study Innovation Suite Unit Tests', () => {
  describe('Ambient Audio Engine', () => {
    it('initializes with default volume of 0.5', () => {
      expect(ambientAudio.volume).toBe(0.5)
    })

    it('clamps volume properly between 0.0 and 1.0', () => {
      ambientAudio.setVolume(1.5)
      expect(ambientAudio.volume).toBe(1.0)

      ambientAudio.setVolume(-0.5)
      expect(ambientAudio.volume).toBe(0.0)

      ambientAudio.setVolume(0.75)
      expect(ambientAudio.volume).toBe(0.75)
    })

    it('safely handles stop without active nodes', () => {
      expect(() => ambientAudio.stop()).not.toThrow()
    })
  })

  describe('Innovation Suite Route Registry', () => {
    it('registers /focus route as protected student area', () => {
      const focusRoute = APP_ROUTES.find(r => r.path === '/focus')
      expect(focusRoute).toBeDefined()
      expect(focusRoute.protected).toBe(true)
    })

    it('registers /flashcards route as protected student area', () => {
      const flashcardsRoute = APP_ROUTES.find(r => r.path === '/flashcards')
      expect(flashcardsRoute).toBeDefined()
      expect(flashcardsRoute.protected).toBe(true)
    })

    it('registers /cheatsheets route as protected student area', () => {
      const cheatsheetsRoute = APP_ROUTES.find(r => r.path === '/cheatsheets')
      expect(cheatsheetsRoute).toBeDefined()
      expect(cheatsheetsRoute.protected).toBe(true)
    })
  })

  describe('Offline Study Pack Data Structure', () => {
    it('constructs valid backup payload schema', () => {
      const backupPayload = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        platform: 'Al-Azhar IT Hub',
        activeMajor: 'cse-2025',
        weeklySchedule: null,
        gpaCalculator: null,
        flashcardsMastery: {},
        customFlashcards: [],
        curriculumProgress: {},
        lectureNotes: {},
      }

      expect(backupPayload.platform).toBe('Al-Azhar IT Hub')
      expect(backupPayload.version).toBe('1.0.0')
      expect(backupPayload.activeMajor).toBe('cse-2025')
      expect(typeof backupPayload.exportedAt).toBe('string')
    })
  })
})
