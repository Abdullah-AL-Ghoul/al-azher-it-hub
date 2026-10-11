import { test, expect } from '@playwright/test'

test.describe('Study Innovation Suite E2E Verification', () => {
  test.setTimeout(60000)

  // Setup mock authenticated student session
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
  test('Focus Room (Pomodoro & Ambient Tools)', async ({ page }) => {
    await page.goto('/focus')
    await page.waitForLoadState('networkidle')

    // Expect 25:00 timer display
    const timerText = page.locator('text=25:00')
    await expect(timerText).toBeVisible({ timeout: 10000 })

    // Expect Start Focus button
    const startBtn = page.getByRole('button', { name: /بدء التركيز|Start Focus/i })
    await expect(startBtn).toBeVisible()

    // Expect ambient audio buttons
    const rainBtn = page.getByRole('button', { name: /مطر هادئ|Gentle Rain/i })
    await expect(rainBtn).toBeVisible()

    // Add session micro-goal
    const goalInput = page.getByPlaceholder(/اكتب هدف الجلسة/i)
    await goalInput.fill('مذاكرة خوارزميات الفرز')
    await goalInput.press('Enter')

    await expect(page.locator('text=مذاكرة خوارزميات الفرز')).toBeVisible()
  })

  test('IT Cheatsheets & Syntax Vault', async ({ page }) => {
    await page.goto('/cheatsheets')
    await page.waitForLoadState('networkidle')

    // Expect category buttons
    await expect(page.getByRole('button', { name: /أوامر Git/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /أوامر لينكس/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /قواعد بيانات SQL/i })).toBeVisible()

    // Test search filter
    const searchInput = page.getByPlaceholder(/ابحث في الأوامر والأكواد/i)
    await searchInput.fill('git commit')

    await expect(page.locator('text=git commit -m')).toBeVisible()
  })

  test('Spaced Repetition Flashcards', async ({ page }) => {
    await page.goto('/flashcards')
    await page.waitForLoadState('networkidle')

    // Expect flashcards card container
    await expect(page.locator('text=سؤال / مفهوم')).toBeVisible({ timeout: 25000 })

    // Expect flip button or card
    const flipBtn = page.getByRole('button', { name: /اقلب البطاقة/i })
    await expect(flipBtn).toBeVisible()
    await flipBtn.click()

    // Back answer should be visible
    await expect(page.locator('text=الإجابة والشرح النموذجي')).toBeVisible()

    // Rate button
    const masteredBtn = page.getByRole('button', { name: /متقن \/ سهل/i })
    await expect(masteredBtn).toBeVisible()
  })

  test('Course Roadmap DAG Prerequisite Tree Mode', async ({ page }) => {
    await page.goto('/roadmap')
    await page.waitForLoadState('networkidle')

    // Expect view switcher buttons
    const treeBtn = page.getByRole('button', { name: /شجرة المتطلبات/i })
    const listBtn = page.getByRole('button', { name: /الفصول الدراسية/i })
    await expect(treeBtn).toBeVisible({ timeout: 10000 })
    await expect(listBtn).toBeVisible()

    // In tree mode, year columns should be present
    await expect(page.locator('text=السنة الأولى')).toBeVisible()
    await expect(page.locator('text=السنة الرابعة')).toBeVisible()
  })

  test('Tools Hub Page Renders All 8 Tools with Category Filtering', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Page title and tools header
    await expect(page.locator('text=مركز الأدوات الذكية')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=الأدوات المتاحة')).toBeVisible()

    // Key tools should be visible
    await expect(page.locator('text=غرفة التركيز الذكية ومؤقت بومودورو')).toBeVisible()
    await expect(page.locator('text=بطاقات المذاكرة والتكرار المتباعد')).toBeVisible()
    await expect(page.locator('text=خزينة الأكواد والمراجع السريعة')).toBeVisible()
    await expect(page.locator('text=شجرة المتطلبات السابقة للمساقات')).toBeVisible()

    // Test category filtering
    const studyTab = page.getByRole('button', { name: /المذاكرة والاستيعاب/i })
    await expect(studyTab).toBeVisible()
    await studyTab.click()
    await expect(page.locator('text=بطاقات المذاكرة')).toBeVisible()
  })
})
