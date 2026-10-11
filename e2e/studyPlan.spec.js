import { test, expect } from '@playwright/test'

test.describe('Study Plan & Academic GPA Calculator E2E Suite', () => {
  test('navigates to study plan and tests curriculum tracker & GPA calculator', async ({ page }) => {
    // Intercept Supabase users API so session restoration succeeds
    await page.route('**/rest/v1/users*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ studentId: '20241001', name: 'عبدالله طارق', role: 'student' }]),
      })
    })

    // Intercept settings endpoint for studyPlan
    await page.route('**/rest/v1/settings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ value: { links: [{ id: '1', titleAr: 'الخطة الرسمية لكلية الهندسة', titleEn: 'Official Engineering Plan', url: 'https://example.com' }] } }),
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

    // Visit study-plan directly
    await page.goto('/study-plan')

    // Tab 1: Curriculum Tracker should be active by default
    const trackerTab = page.getByRole('button', { name: /مسار الخطة التخصصية|Curriculum Tracker/i })
    await expect(trackerTab).toBeVisible()

    // Major Selector card and select dropdown should be visible
    const planSelectorCard = page.locator('text=الخطة الأكاديمية للتخصص المعتمد')
    await expect(planSelectorCard).toBeVisible()

    const planSelect = page.locator('#academic-plan-select')
    await expect(planSelect).toBeVisible()

    // Check that an official Al-Azhar accredited course code (e.g., ITCS1401 or MATH1320) exists
    const officialCourse = page.locator('text=ITCS1401').first()
    await expect(officialCourse).toBeVisible()

    // Test multi-plan switching: switch to Computer Science 2020 (Plan 9243)
    await planSelect.selectOption('cs-2020')
    await expect(planSelect).toHaveValue('cs-2020')
    await expect(page.locator('span').filter({ hasText: 'علوم الحاسوب (2020)' }).first()).toBeVisible()

    // Switch back to CSE 2025 (Plan 9312)
    await planSelect.selectOption('cse-2025')
    await expect(planSelect).toHaveValue('cse-2025')
    await expect(page.locator('span').filter({ hasText: 'هندسة أنظمة الحاسوب (2025)' }).first()).toBeVisible()

    // Test status toggle on a course: click "ناجح" or "Passed"
    const passedBtn = page.getByTitle('ناجح').first()
    await expect(passedBtn).toBeVisible()
    await passedBtn.click()

    // Tab 2: Switch to GPA Calculator
    const calcTab = page.getByRole('button', { name: /حاسبة المعدل الأكاديمي|GPA Calculator/i })
    await expect(calcTab).toBeVisible()
    await calcTab.click()

    // Ensure GPA Calculator view rendered
    await expect(page.locator('text=النتيجة الأكاديمية')).toBeVisible()
    await expect(page.locator('text=المعدل الفصلي المتوقع')).toBeVisible()

    // Add Course button works
    const addCourseBtn = page.getByRole('button', { name: /إضافة مساق|Add Course/i })
    await expect(addCourseBtn).toBeVisible()
    await addCourseBtn.click()

    // Switch between Percentage and 4.0 Points Scale
    const pointsScaleBtn = page.getByRole('button', { name: /نظام النقاط|Points Scale/i })
    await expect(pointsScaleBtn).toBeVisible()
    await pointsScaleBtn.click()

    // Tab 3: Switch to Official Links tab
    const linksTab = page.getByRole('button', { name: /الوثائق والروابط الرسمية|Official Links/i })
    await expect(linksTab).toBeVisible()
    await linksTab.click()

    // Links container should be visible
    await expect(page.locator('text=الخطة الرسمية لكلية الهندسة')).toBeVisible()
  })
})
