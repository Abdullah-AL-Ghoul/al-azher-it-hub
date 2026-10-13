import { test, expect } from '@playwright/test'

test.describe('Flagship Academic Features E2E Verification', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
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

    await page.addInitScript(() => {
      sessionStorage.setItem('al_azher_lang', 'ar')
      sessionStorage.setItem('al_azher_session', JSON.stringify({
        studentId: '20241001',
        name: 'عبدالله طارق',
        role: 'student',
      }))
    })
  })

  test('1. Coding Arena Page - verifies title, challenges and test runner', async ({ page }) => {
    await page.goto('/arena')
    await page.waitForLoadState('networkidle')

    // Verify Title is correct and NOT Page Not Found
    await expect(page).toHaveTitle(/حلبة التحديات البرمجية|Coding Arena/i)

    // Verify main components
    await expect(page.locator('text=ساحة التحديات البرمجية ولوحة المتصدرين')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=لوحة المتصدرين وقائمة الشرف')).toBeVisible()

    // Test runner button
    const runBtn = page.getByRole('button', { name: /تشغيل وفحص الحالات/i })
    await expect(runBtn).toBeVisible()
    await runBtn.click()

    // Verify test case success toast or output
    await expect(page.locator('text=تم اجتياز جميع حالات الاختبار بنجاح')).toBeVisible({ timeout: 10000 })
  })

  test('2. Tech Interview Simulator Page - verifies title, tracks and model answers', async ({ page }) => {
    await page.goto('/interview')
    await page.waitForLoadState('networkidle')

    // Verify Title is correct
    await expect(page).toHaveTitle(/محاكي المقابلات التقنية|Tech Interview/i)

    // Verify header and track selection
    await expect(page.locator('text=محاكي المقابلات التقنية والجاهزية لسوق العمل')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=مهندس واجهات أمامية').first()).toBeVisible()

    // Reveal model answer
    const revealBtn = page.getByRole('button', { name: /كشف الإجابة النموذجية/i })
    await expect(revealBtn).toBeVisible()
    await revealBtn.click()

    await expect(page.locator('text=الإجابة النموذجية الموصى بها')).toBeVisible({ timeout: 5000 })
  })

  test('3. ATS Resume Builder Page - verifies title, editor sections and live preview', async ({ page }) => {
    await page.goto('/resume')
    await page.waitForLoadState('networkidle')

    // Verify Title is correct
    await expect(page).toHaveTitle(/صانع السيرة الذاتية المهنية|ATS Resume/i)

    // Verify header and preview
    await expect(page.locator('text=صانع السيرة الذاتية التقنية المعتمد')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /طباعة وتصدير PDF/i })).toBeVisible()
    await expect(page.locator('#resume-printable-sheet')).toBeVisible()
    await expect(page.locator('#resume-printable-sheet').locator('text=عبد الله طارق الغول')).toBeVisible()
  })

  test('4. Exam Solutions Page - verifies title, course filters and step-by-step reveal', async ({ page }) => {
    await page.goto('/exam-solutions')
    await page.waitForLoadState('networkidle')

    // Verify Title is correct
    await expect(page).toHaveTitle(/بنك حلول الامتحانات السابقة|Past Exams/i)

    // Verify header and questions
    await expect(page.locator('text=بنك حلول الامتحانات السابقة خطوة بخطوة')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=هياكل البيانات والخوارزميات').first()).toBeVisible()

    // Reveal solution
    const revealStepBtn = page.getByRole('button', { name: /كشف خطوات الحل النموذجي خطوة بخطوة/i }).first()
    await expect(revealStepBtn).toBeVisible()
    await revealStepBtn.click()

    await expect(page.locator('text=خطوات الحل النموذجي المعتمد في التصحيح').first()).toBeVisible({ timeout: 5000 })
  })

  test('5. Focus Room Virtual Synchronous Study Lounge', async ({ page }) => {
    await page.goto('/focus')
    await page.waitForLoadState('networkidle')

    // Verify Virtual Study Lounge
    await expect(page.locator('text=صالة المذاكرة الجماعية التفاعلية')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=طالباً يدرسون الآن معاً')).toBeVisible()
    await expect(page.locator('text=خوارزميات وهياكل البيانات')).toBeVisible()
  })
})
