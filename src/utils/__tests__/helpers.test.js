import { describe, it, expect } from 'vitest'
import { nowISO, extractYouTubeId, lectureVideoId, lectureThumb, storagePathFromUrl, getSourceFiles } from '../helpers'

describe('nowISO', () => {
  it('returns a string in ISO format', () => {
    const result = nowISO()
    expect(typeof result).toBe('string')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('returns the current time', () => {
    const before = new Date().toISOString().slice(0, 19)
    const result = nowISO()
    const after = new Date().toISOString().slice(0, 19)
    expect(result.slice(0, 19)).toBe(before)
    expect(result.slice(0, 19)).toBe(after)
  })
})

describe('extractYouTubeId', () => {
  it('extracts from watch URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts from youtu.be URLs', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts from embed URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts from shorts URLs', () => {
    expect(extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts a bare 11-char id', () => {
    expect(extractYouTubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('returns null for invalid input', () => {
    expect(extractYouTubeId(null)).toBe(null)
    expect(extractYouTubeId('')).toBe(null)
    expect(extractYouTubeId('https://example.com')).toBe(null)
  })
})

describe('lectureVideoId', () => {
  it('uses stored videoId when present', () => {
    expect(lectureVideoId({ videoId: 'abc123', url: 'https://youtu.be/xyz999' })).toBe('abc123')
  })
  it('falls back to extracting from url', () => {
    expect(lectureVideoId({ url: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('dQw4w9WgXcQ')
  })
  it('returns null when nothing available', () => {
    expect(lectureVideoId({})).toBe(null)
    expect(lectureVideoId(null)).toBe(null)
  })
})

describe('lectureThumb', () => {
  it('builds mqdefault URL by default', () => {
    expect(lectureThumb('dQw4w9WgXcQ')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg')
  })
  it('builds hqdefault URL when quality hq', () => {
    expect(lectureThumb('dQw4w9WgXcQ', 'hq')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })
  it('builds maxresdefault URL when quality maxres (true 16:9)', () => {
    expect(lectureThumb('dQw4w9WgXcQ', 'maxres')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')
  })
  it('falls back to mq for unknown quality', () => {
    expect(lectureThumb('dQw4w9WgXcQ', 'ultra')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg')
  })
  it('returns null for empty id', () => {
    expect(lectureThumb('')).toBe(null)
    expect(lectureThumb(null)).toBe(null)
  })
})

describe('storagePathFromUrl + getSourceFiles path enrichment', () => {
  it('extracts the object path from a public storage URL', () => {
    expect(storagePathFromUrl('https://x.supabase.co/storage/v1/object/public/sources/171_a.pdf')).toBe('171_a.pdf')
  })
  it('extracts from signed/authenticated URL shapes too', () => {
    expect(storagePathFromUrl('https://x.supabase.co/storage/v1/object/sign/sources/a%20b.pdf?token=x')).toBe('a b.pdf')
  })
  it('returns bare paths as-is and null for external links', () => {
    expect(storagePathFromUrl('folder/file.pdf')).toBe('folder/file.pdf')
    expect(storagePathFromUrl('https://example.com/file.pdf')).toBe(null)
    expect(storagePathFromUrl('')).toBe(null)
  })
  it('getSourceFiles enriches entries with a path', () => {
    const src = { files: [{ url: 'https://x.supabase.co/storage/v1/object/public/sources/171_a.pdf', name: 'a.pdf' }] }
    expect(getSourceFiles(src)[0].path).toBe('171_a.pdf')
  })
})
