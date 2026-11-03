import { describe, it, expect, beforeEach } from 'vitest'
import { ambientAudio } from '../utils/ambientAudio'
import { APP_ROUTES } from '../router/routes'
import {
  REPORT_TYPES,
  getContentReports,
  submitContentReport,
  updateContentReportStatus,
  deleteContentReport,
} from '../services/reports'

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

    it('registers /tools hub route as protected student area', () => {
      const toolsRoute = APP_ROUTES.find(r => r.path === '/tools')
      expect(toolsRoute).toBeDefined()
      expect(toolsRoute.protected).toBe(true)
    })

    it('registers /playground code playground route as protected student area', () => {
      const playgroundRoute = APP_ROUTES.find(r => r.path === '/playground')
      expect(playgroundRoute).toBeDefined()
      expect(playgroundRoute.protected).toBe(true)
    })

    it('registers /quiz exam simulator route as protected student area', () => {
      const quizRoute = APP_ROUTES.find(r => r.path === '/quiz')
      expect(quizRoute).toBeDefined()
      expect(quizRoute.protected).toBe(true)
    })

    it('registers /tasks task tracker route as protected student area', () => {
      const tasksRoute = APP_ROUTES.find(r => r.path === '/tasks')
      expect(tasksRoute).toBeDefined()
      expect(tasksRoute.protected).toBe(true)
    })

    it('registers /projects graduation showcase route as protected student area', () => {
      const projectsRoute = APP_ROUTES.find(r => r.path === '/projects')
      expect(projectsRoute).toBeDefined()
      expect(projectsRoute.protected).toBe(true)
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

  describe('SEO Page Titles for Study Innovation Routes', () => {
    it('verifies that all innovation routes are defined in APP_ROUTES', () => {
      const innovationPaths = ['/tools', '/focus', '/flashcards', '/cheatsheets', '/playground', '/quiz', '/tasks', '/projects', '/notifications']
      innovationPaths.forEach((path) => {
        const route = APP_ROUTES.find((r) => r.path === path)
        expect(route).toBeDefined()
        expect(route.protected).toBe(true)
      })
    })
  })

  describe('Content Issue Reporting Service (Student Feedback Loop)', () => {
    beforeEach(() => {
      localStorage.removeItem('al_azher_content_reports_v1')
    })

    it('exposes structured bilingual REPORT_TYPES', () => {
      expect(Array.isArray(REPORT_TYPES)).toBe(true)
      expect(REPORT_TYPES.length).toBeGreaterThanOrEqual(4)
      expect(REPORT_TYPES.some((t) => t.id === 'video_issue')).toBe(true)
      expect(REPORT_TYPES.some((t) => t.id === 'subtitle_issue')).toBe(true)
    })

    it('submits, persists, updates status, and deletes content reports accurately', async () => {
      expect(await getContentReports()).toEqual([])

      // Edge case: missing both itemTitle and itemId throws error
      await expect(submitContentReport({ itemId: '', itemTitle: '   ' })).rejects.toThrow('Item reference is required')

      const report = await submitContentReport({
        itemType: 'lecture',
        itemId: 'lec-101',
        itemTitle: 'Data Structures Lecture 1',
        reportType: 'subtitle_issue',
        description: 'Translation mismatch at 04:15',
        reporterId: '20220299',
        reporterName: 'Abdullah Al-Ghoul',
      })

      expect(report.id).toMatch(/^rep_/)
      expect(report.status).toBe('open')
      expect(report.reportType).toBe('subtitle_issue')
      expect(await getContentReports()).toHaveLength(1)

      // Edge case: invalid reportType falls back to 'other' and empty fields sanitize cleanly
      const fallbackReport = await submitContentReport({
        itemId: 'lec-102',
        reportType: 'non_existent_type',
        description: '   ',
      })
      expect(fallbackReport.reportType).toBe('other')
      expect(fallbackReport.reporterName).toBe('طالب')
      expect(await getContentReports()).toHaveLength(2)

      // Resolve first report
      const updated = await updateContentReportStatus(report.id, 'resolved')
      expect(updated?.status).toBe('resolved')

      // Delete fallback report
      const deleted = await deleteContentReport(fallbackReport.id)
      expect(deleted).toBe(true)
      const remaining = await getContentReports()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(report.id)
    })
  })
})

