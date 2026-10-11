import { test, expect } from '@playwright/test'

test('clicking a lecture navigates to /lecture/:id and displays full 16:9 player', async ({ page }) => {
  test.setTimeout(60000)
  const mockLectures = [
    {
      id: 'lec-101',
      titleAr: 'المحاضرة الأولى: نظم قواعد بيانات',
      titleEn: 'Lecture 1: Database Systems',
      subjectAr: 'نظم قواعد بيانات نظري',
      subjectEn: 'Database Systems',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      date: '2026-07-04',
      createdAt: '2026-07-04T10:00:00Z',
    }
  ]

  // Intercept Supabase lectures and sources API
  await page.route('**/rest/v1/lectures*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': '0-0/1' },
      body: JSON.stringify(mockLectures),
    })
  })

  await page.route('**/rest/v1/sources*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route('**/rest/v1/users*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ studentId: '20241001', name: 'عبدالله طارق', role: 'student' }]),
    })
  })

  // Set logged-in student mock session so protected routes allow entry
  await page.addInitScript(() => {
    sessionStorage.setItem('al_azher_lang', 'ar')
    sessionStorage.setItem(
      'al_azher_session',
      JSON.stringify({
        studentId: '20241001',
        name: 'عبدالله طارق',
        role: 'student',
      })
    )
  })

  // 1. Visit Lectures list page
  await page.goto('/lectures')
  await expect(page.locator('text=المحاضرة الأولى: نظم قواعد بيانات')).toBeVisible()

  // 2. Click the lecture card thumbnail or play button
  const lectureCard = page.locator('a[href="/lecture/lec-101"]').first()
  await lectureCard.click()

  // 3. Verify it navigated directly to /lecture/lec-101 (NOT opened in a modal)
  await expect(page).toHaveURL(/\/lecture\/lec-101$/)
  await expect(page.locator('h1')).toContainText('المحاضرة الأولى: نظم قواعد بيانات')

  // 4. Verify video player container exists and is NOT collapsed (height > 250px)
  const videoCanvas = page.locator('iframe').first()
  await expect(videoCanvas).toBeVisible()

  const box = await videoCanvas.boundingBox()
  expect(box).toBeTruthy()
  expect(box.height).toBeGreaterThan(250) // Proves the 34px collapse bug is dead!
  console.log(`VERIFIED: Rendered video height is ${box.height}px, width is ${box.width}px!`)

  // 5. Take screenshot of the lecture page with the full video player
  await page.screenshot({ path: 'e2e/screenshot-verified-player.png', fullPage: false })

  // 6. Test Theater mode toggle
  const theaterBtn = page.locator('button:has-text("وضع المسرح")')
  await expect(theaterBtn).toBeVisible()
  await theaterBtn.click()
  await expect(page.locator('button:has-text("عرض عادي")')).toBeVisible()

  const theaterBox = await videoCanvas.boundingBox()
  expect(theaterBox.width).toBeGreaterThanOrEqual(box.width)
  console.log(`VERIFIED: Theater mode expanded video width to ${theaterBox.width}px!`)

  // 7. Test Timestamped note creation
  const noteInput = page.locator('input[placeholder*="اكتب ملاحظة"]')
  await expect(noteInput).toBeVisible()
  await noteInput.fill('ملاحظة هامة حول قواعد البيانات')
  await page.locator('button:has-text("إضافة")').click()
  await expect(page.locator('text=ملاحظة هامة حول قواعد البيانات')).toBeVisible()
  console.log('VERIFIED: Timestamped note added and visible!')
})
