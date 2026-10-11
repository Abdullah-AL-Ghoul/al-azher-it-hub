import { test, expect } from '@playwright/test'

test.describe('Course Roadmap & Academic Profile Synchronization E2E', () => {
  test.setTimeout(60000)

  test('tests interactive roadmap track filters and prerequisite dependency highlighting', async ({ page }) => {
    // Intercept Supabase endpoints
    await page.route('**/rest/v1/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ studentId: '20241001', name: 'عبدالله طارق', role: 'student' }]),
      })
    })
    await page.route('**/rest/v1/courses*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/settings*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ value: [] }) })
    })

    // Mock session
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

    await page.goto('/roadmap')

    // Track filter pills should be present
    const softwareTrack = page.getByRole('button', { name: /تطوير البرمجيات والويب/i })
    await expect(softwareTrack).toBeVisible({ timeout: 15000 })

    // Prerequisite legend should be visible
    const prereqLegend = page.locator('text=متطلب سابق')
    await expect(prereqLegend.first()).toBeVisible()

    // Click on Software track
    await softwareTrack.click()

    // Click on a course item to expand prerequisite details
    const courseCard = page.locator('[role="button"][aria-expanded]').first()
    await expect(courseCard).toBeVisible()
    await courseCard.click()
    await expect(courseCard).toHaveAttribute('aria-expanded', 'true')
  })

  test('tests profile academic progress gauge, saved GPA metrics and printable report modal', async ({ page }) => {
    // Intercept Supabase endpoints
    await page.route('**/rest/v1/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ studentId: '20241001', name: 'عبدالله طارق', role: 'student', major: 'Software Engineering' }]),
      })
    })
    await page.route('**/rest/v1/lectures*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/sources*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/favorites*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/user_stats*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/student_logs*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    // Mock session and pre-fill curriculum progress & saved GPA
    await page.addInitScript(() => {
      sessionStorage.setItem('al_azher_lang', 'ar')
      sessionStorage.setItem(
        'al_azher_session',
        JSON.stringify({
          studentId: '20241001',
          name: 'عبدالله طارق',
          role: 'student',
          major: 'Software Engineering',
        })
      )
      // Save 2 passed courses in curriculum progress
      localStorage.setItem('al_azher_curriculum_progress', JSON.stringify({
        'it101': 'passed',
        'it102': 'passed',
      }))
      // Save calculation in GPA calculator
      localStorage.setItem('al_azher_saved_gpa_calc', JSON.stringify([
        { id: '1', name: 'برمجة الحاسوب (1)', hours: 3, grade: 92, letter: 'A+' },
        { id: '2', name: 'تراكيب البيانات', hours: 3, grade: 86, letter: 'A' },
      ]))
    })

    await page.goto('/profile')

    // Academic progress card should be displayed
    const academicHeader = page.locator('text=السجل الأكاديمي والتقدم التخصصي')
    await expect(academicHeader).toBeVisible({ timeout: 15000 })

    // Saved GPA should be displayed
    const gpaVal = page.locator('text=89.0%')
    await expect(gpaVal).toBeVisible()

    // Export / Print button should be visible
    const printBtn = page.getByRole('button', { name: /تصدير \/ طباعة السجل/i })
    await expect(printBtn).toBeVisible()

    // Click to open printable report modal
    await printBtn.click()

    // Modal university header should be visible
    const universityTitle = page.locator('text=جامعة الأزهر - غزة')
    await expect(universityTitle).toBeVisible()

    // Modal print action button
    const modalPrintBtn = page.getByRole('button', { name: /طباعة \/ حفظ كـ PDF/i })
    await expect(modalPrintBtn).toBeVisible()
  })
})
