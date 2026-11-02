import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAllSubtitles,
  getSubtitlesByLecture,
  saveSubtitle,
  deleteSubtitle,
  updateSubtitleStatus,
  importSubtitleFile,
  runSubtitleGenerationPipeline,
} from '../services/subtitles'

describe('Subtitles Service & Pipeline Suite', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('fetches initial demo subtitles when storage is empty', async () => {
    const list = await getAllSubtitles(true)
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
    expect(list.some(s => s.language === 'ar')).toBe(true)
  })

  it('retrieves subtitles for a specific lecture', async () => {
    const subs = await getSubtitlesByLecture('demo-1')
    expect(Array.isArray(subs)).toBe(true)
    expect(subs.length).toBeGreaterThan(0)
    expect(subs[0]).toHaveProperty('cues')
    expect(subs[0].cues.length).toBeGreaterThan(0)
  })

  it('saves and updates subtitle records with automatic cue validation', async () => {
    const saved = await saveSubtitle({
      lectureId: 'test-lec-1',
      language: 'ar',
      status: 'needs_review',
      cues: [
        { id: '1', start: 5, end: 10, text: 'الجزء الثاني' },
        { id: '2', start: 0, end: 6, text: 'الجزء الأول متداخل' },
      ],
    })

    expect(saved).toBeDefined()
    expect(saved.lectureId).toBe('test-lec-1')
    expect(saved.language).toBe('ar')
    // Cues should be sorted by start time
    expect(saved.cues[0].start).toBe(0)
    // Overlap should be adjusted
    expect(saved.cues[0].end).toBeLessThanOrEqual(5)
  })

  it('updates subtitle publication status', async () => {
    const initial = await saveSubtitle({
      lectureId: 'test-lec-2',
      language: 'en',
      status: 'ai_generated',
      cues: [{ id: '1', start: 0, end: 5, text: 'Introduction' }],
    })

    const updated = await updateSubtitleStatus(initial.id, 'published')
    expect(updated.status).toBe('published')
  })

  it('imports WebVTT content and generates structured tracks', async () => {
    const vtt = `WEBVTT\n\n1\n00:00:01.000 --> 00:00:05.000\nخوارزميات البحث الثنائي Binary Search`
    const imported = await importSubtitleFile({
      lectureId: 'test-lec-3',
      text: vtt,
      format: 'vtt',
      language: 'ar',
    })

    expect(imported.cues).toHaveLength(1)
    expect(imported.cues[0].text).toContain('Binary Search')
  })

  it('runs subtitle generation simulation pipeline', async () => {
    const stepsRecorded = []
    const results = await runSubtitleGenerationPipeline({
      lectureId: 'test-lec-4',
      sourceLang: 'en',
      targetLangs: ['ar'],
      engine: 'gemini-flash',
      onProgress: (p) => stepsRecorded.push(p.step),
    })

    expect(results).toHaveLength(2) // 1 source + 1 translation
    expect(results[0].sourceType).toBe('original_transcript')
    expect(results[1].sourceType).toBe('translation')
    expect(stepsRecorded).toContain(1)
    expect(stepsRecorded).toContain(5)
  })

  it('deletes subtitle track cleanly', async () => {
    const sub = await saveSubtitle({
      lectureId: 'test-lec-del',
      language: 'en',
      cues: [{ start: 0, end: 2, text: 'delete me' }],
    })

    await deleteSubtitle(sub.id)
    const all = await getAllSubtitles(true)
    expect(all.some(s => s.id === sub.id)).toBe(false)
  })
})
