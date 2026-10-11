import { test, expect } from '@playwright/test'

test.describe('Home Page Quick Academic Widget E2E Suite', () => {
  test('displays quick academic progress, saved GPA and shortcuts on Home', async ({ page }) => {
    // Intercept Supabase endpoints
    await page.route('**/rest/v1/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ studentId: '20241001', name: 'عبدالله طارق', role: 'student' }]),
      })
    })
    await page.route('**/rest/v1/lectures*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/sources*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })
    await page.route('**/rest/v1/additions*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    })

    // Mock student session and curriculum progress
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
      // Save 3 passed courses in curriculum
      localStorage.setItem('al_azher_curriculum_progress', JSON.stringify({
        'it101': 'passed',
        'it102': 'passed',
        'it201': 'passed',
      }))
      // Save GPA
      localStorage.setItem('al_azher_saved_gpa_calc', JSON.stringify([
        { id: '1', name: 'برمجة الحاسوب (1)', hours: 3, grade: 88, letter: 'A' },
        { id: '2', name: 'تراكيب البيانات', hours: 3, grade: 82, letter: 'B+' },
      ]))
    })

    await page.goto('/home')

    // Welcome title should greet student
    const welcomeTitle = page.locator('text=مرحباً بك، عبدالله طارق!')
    await expect(welcomeTitle).toBeVisible({ timeout: 15000 })

    // Curriculum progress card
    const curriculumWidget = page.locator('text=إنجاز الخطة الأكاديمية')
    await expect(curriculumWidget).toBeVisible()

    // GPA widget should show computed GPA
    const gpaWidget = page.locator('text=85.0%')
    await expect(gpaWidget).toBeVisible()

    // Past Exams shortcut
    const examsShortcut = page.locator('text=أرشيف الامتحانات السابقة')
    await expect(examsShortcut).toBeVisible()

    // Roadmap shortcut
    const roadmapShortcut = page.locator('text=خريطة المتطلبات الشجرية')
    await expect(roadmapShortcut).toBeVisible()
  })
})
