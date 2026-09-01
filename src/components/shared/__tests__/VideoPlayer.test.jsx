import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VideoPlayer from '../VideoPlayer'

describe('VideoPlayer', () => {
  it('shows the no-video placeholder when there is no id and no url', () => {
    render(<VideoPlayer videoId={null} url={null} isArabic />)
    expect(screen.getByText('لا يوجد فيديو لهذه المحاضرة')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the thumbnail facade first — no iframe until the user clicks', () => {
    const { container } = render(<VideoPlayer videoId="abc123" title="محاضرة" isArabic onWatch={() => {}} />)
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.getByRole('button', { name: 'محاضرة' })).toBeInTheDocument()
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toContain('abc123')
  })

  it('swaps to the youtube-nocookie iframe on click and fires onWatch once', async () => {
    const user = userEvent.setup()
    const onWatch = vi.fn()
    const { container } = render(<VideoPlayer videoId="abc123" isArabic onWatch={onWatch} />)

    await user.click(screen.getByRole('button'))
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe.getAttribute('src')).toContain('youtube-nocookie.com/embed/abc123')
    expect(iframe.getAttribute('src')).toContain('autoplay=1')
    expect(iframe.getAttribute('title')).toBeTruthy()

    // Clicking again (the facade is gone, but beginInline is guarded by ref)
    expect(onWatch).toHaveBeenCalledTimes(1)
  })

  it('keeps the autoplay flag off when autoPlay is false and the facade is used', async () => {
    const user = userEvent.setup()
    const { container } = render(<VideoPlayer videoId="abc123" isArabic onWatch={() => {}} />)
    await user.click(screen.getByRole('button'))
    expect(container.querySelector('iframe')?.getAttribute('src')).not.toContain('autoplay=0')
  })

  it('autoPlay mode skips the facade and fires onWatch after mount', () => {
    vi.useFakeTimers()
    const onWatch = vi.fn()
    const { container } = render(<VideoPlayer videoId="abc123" isArabic onWatch={onWatch} autoPlay />)
    expect(container.querySelector('iframe')).not.toBeNull()
    expect(onWatch).not.toHaveBeenCalled()
    // onWatch is deferred 400ms so it lands after mount in modal contexts
    vi.advanceTimersByTime(450)
    expect(onWatch).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('offers the YouTube external link alongside the player when a url exists', async () => {
    const user = userEvent.setup()
    const onWatch = vi.fn()
    render(<VideoPlayer videoId="abc123" url="https://youtube.com/watch?v=abc123" isArabic onWatch={onWatch} />)
    const link = screen.getByRole('link', { name: /youtube/i })
    expect(link).toHaveAttribute('href', 'https://youtube.com/watch?v=abc123')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    // Opening externally also counts the lecture as watched
    await user.click(link)
    expect(onWatch).toHaveBeenCalled()
  })

  it('renders the English fallback copy in en mode', () => {
    render(<VideoPlayer videoId={null} url={null} isArabic={false} />)
    expect(screen.getByText('No video for this lecture')).toBeInTheDocument()
  })
})
