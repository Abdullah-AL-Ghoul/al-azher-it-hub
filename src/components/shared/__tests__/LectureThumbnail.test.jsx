import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import LectureThumbnail from '../LectureThumbnail'

describe('LectureThumbnail', () => {
  it('renders the maxres image first with correct srcSet', () => {
    const { container } = render(<LectureThumbnail videoId="abc12345678" alt="lecture" />)
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toContain('maxresdefault.jpg')
    expect(img.getAttribute('srcset')).toContain('maxresdefault.jpg 1280w')
    expect(img.getAttribute('srcset')).toContain('mqdefault.jpg 320w')
    expect(img.getAttribute('alt')).toBe('lecture')
  })

  it('drops to the next quality rung on error, then paints the gradient tile', () => {
    const { container } = render(<LectureThumbnail videoId="abc12345678" />)
    let img = container.querySelector('img')
    expect(img.getAttribute('src')).toContain('maxresdefault')

    fireEvent.error(img)
    img = container.querySelector('img')
    expect(img.getAttribute('src')).toContain('hqdefault')

    fireEvent.error(img)
    img = container.querySelector('img')
    expect(img.getAttribute('src')).toContain('mqdefault')

    // Exhausted ladder: no more img — branded gradient tile instead.
    fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('div[aria-hidden="true"]')).toBeTruthy()
  })

  it('renders only the gradient tile when videoId is missing', () => {
    const { container } = render(<LectureThumbnail videoId={null} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('marks the first-paint image as high priority and eager', () => {
    const { container } = render(<LectureThumbnail videoId="abc12345678" priority />)
    const img = container.querySelector('img')
    expect(img.getAttribute('loading')).toBe('eager')
    expect(img.getAttribute('fetchpriority')).toBe('high')
  })
})
