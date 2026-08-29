import { describe, it, expect } from 'vitest'
import { buildChatIntents, getGreeting } from '../chatIntents'

const data = {
  lectures: [
    { id: 'l1', titleAr: 'مقدمة في البرمجة', titleEn: 'Intro to Programming', subjectAr: 'برمجة', subjectEn: 'Programming', date: '2026-01-01', url: 'https://youtu.be/abc123' },
    { id: 'l2', titleAr: 'هياكل البيانات', titleEn: 'Data Structures', subjectAr: 'برمجة', subjectEn: 'Programming', date: '2026-01-08', url: '' },
  ],
  sources: [
    { id: 's1', titleAr: 'ملخص البرمجة', titleEn: 'Programming Summary' },
  ],
  subjects: [
    { id: 'sub1', ar: 'برمجة', en: 'Programming' },
  ],
}

function respond(handlers, text) {
  for (const h of handlers) {
    const r = h(text)
    if (r) return r
  }
  return handlers[handlers.length - 1](text).text
}

describe('chatIntents', () => {
  const ar = buildChatIntents(data, { name: 'عبدالله' }, true)
  const en = buildChatIntents(data, null, false)

  it('greets and uses the user name in Arabic', () => {
    const r = respond(ar, 'مرحبا')
    expect(r.text).toContain('عبدالله')
    expect(r.quickKey).toBe('initial')
  })

  it('counts lectures grouped by subject', () => {
    const r = respond(ar, 'كم عدد المحاضرات؟')
    expect(r.text).toContain('2 محاضرة')
    expect(r.text).toContain('برمجة: 2')
  })

  it('lists available courses', () => {
    const r = respond(en, 'show me the courses')
    expect(r.text).toContain('Programming')
  })

  it('searches lectures and sources', () => {
    const r = respond(ar, 'ابحث عن مقدمة')
    expect(r.text).toContain('مقدمة في البرمجة')
  })

  it('summarizes a lecture by name', () => {
    const r = respond(en, 'tell me about data structures')
    expect(r.text).toContain('Data Structures')
    expect(r.text).toContain('/lecture/l2')
  })

  it('falls back to a generic help response', () => {
    const r = respond(en, 'xyz unknown phrase 123')
    expect(r.text).toContain('didn\'t quite understand')
  })

  it('provides a time-of-day greeting', () => {
    const g = getGreeting(true)
    expect(typeof g).toBe('string')
    expect(g.length).toBeGreaterThan(0)
  })

  it('understands Arabic with diacritics (tashkeel) and letter variants', () => {
    const r = respond(ar, 'مَرْحَباً')
    expect(r.quickKey).toBe('initial')
  })

  it('understands ta-marbuta/alef-maqsura variants (مساعده -> مساعدة)', () => {
    const r = respond(ar, 'أحتاج مساعده من فضلك')
    expect(r.quickKey).toBe('afterHelp')
  })

  it('tolerates typos in common words (كام -> كم)', () => {
    const r = respond(ar, 'كام عدد المحاضرات')
    expect(r.text).toContain('2 محاضرة')
  })

  it('does not let short keywords hijack unrelated questions (status bug)', () => {
    // Regression: the old engine matched 'status' inside this sentence.
    const r = respond(en, 'summarize Data Structures')
    expect(r.text).toContain('Data Structures')
    expect(r.text).not.toContain("I'm doing great")
  })

  it('keeps multi-word keywords strict (كم مادة must not fire on كم عدد)', () => {
    const r = respond(ar, 'كم عدد المحاضرات؟')
    expect(r.text).not.toContain('عدد المواد')
  })

  it('understands natural English phrasing', () => {
    const r = respond(en, 'how many lectures do you have?')
    expect(r.text).toContain('2 lectures')
  })

  it('understands search intent with partial titles', () => {
    const r = respond(ar, 'ابحث عن مقدمة')
    expect(r.text).toContain('مقدمة في البرمجة')
  })

  it('smart-falls-back to title matches without an explicit search command', () => {
    const r = respond(en, 'Data Structures lecture')
    expect(r.text).toContain('Data Structures')
    expect(r.text).toContain('/lectures')
  })

  it('still falls back to generic help when nothing matches', () => {
    const r = respond(en, 'xyz unknown phrase 123')
    expect(r.text).toContain('didn\'t quite understand')
  })
})
