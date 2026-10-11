import { test, expect } from '@playwright/test'

test.describe('Authentication Experience Transformation E2E Suite', () => {
  test('Login page renders desktop dual-panel and utility controls in Arabic', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('al_azher_lang', 'ar'))
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/login')

    // Expect Brand Panel to be visible on desktop in Arabic
    const brandHeading = page.locator('text=بوابتك الأكاديمية الأولى')
    await expect(brandHeading).toBeVisible()

    // Expect Top Utility Bar (Back button, Language toggle, Theme toggle)
    const backBtn = page.getByRole('button', { name: /العودة|Back/i })
    await expect(backBtn).toBeVisible()

    const langToggle = page.getByRole('button', { name: /English|العربية/i })
    await expect(langToggle).toBeVisible()

    // Expect form inputs
    const studentIdInput = page.locator('#login-studentId')
    await expect(studentIdInput).toBeVisible()

    const passwordInput = page.locator('#login-password')
    await expect(passwordInput).toBeVisible()

    // Test Show/Hide password toggle
    const toggleBtn = page.locator('button[aria-label*="كلمة المرور"], button[aria-label*="password"]').first()
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('Login page renders desktop dual-panel in English', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('al_azher_lang', 'en'))
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/login')

    // Expect Brand Panel in English
    const brandHeading = page.locator('text=Your Academic Gateway')
    await expect(brandHeading).toBeVisible()

    const studentIdInput = page.locator('#login-studentId')
    await expect(studentIdInput).toBeVisible()
  })

  test('Signup page renders responsive grid and password strength indicator', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('al_azher_lang', 'ar'))
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/signup')

    // Check Name, ID, Email, Major inputs exist
    await expect(page.locator('#signup-name')).toBeVisible()
    await expect(page.locator('#signup-studentId')).toBeVisible()
    await expect(page.locator('#signup-email')).toBeVisible()
    await expect(page.locator('#signup-major')).toBeVisible()
    await expect(page.locator('#signup-password')).toBeVisible()
    await expect(page.locator('#signup-confirm-password')).toBeVisible()

    // Typing a password reveals the strength indicator
    await page.locator('#signup-password').fill('StrongPass123!')
    const strengthIndicator = page.locator('text=قوة كلمة المرور:')
    await expect(strengthIndicator).toBeVisible()
  })

  test('Mobile viewport (375px) has zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasOverflow).toBe(false)
  })

  test('Forgot Password wizard flow operates cleanly', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('al_azher_lang', 'ar'))
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/forgot-password')

    // Step 1 input is visible
    const fpId = page.locator('#fp-id')
    await expect(fpId).toBeVisible()

    // Link back to login works
    const backToLogin = page.getByRole('link', { name: /تسجيل الدخول|Login/i })
    await expect(backToLogin).toBeVisible()
  })
})
