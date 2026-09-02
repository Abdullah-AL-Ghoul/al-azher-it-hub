import { test, expect } from '@playwright/test'

// Authentication surface E2E. The real Supabase backend is exercised read-
// only: wrong-credential sign-in must fail with an inline error, and protected
// routes must gate anonymous visitors. No data is written.

test('login rejects invalid credentials with an inline error', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('textbox', { name: /الرقم الجامعي أو البريد/ }).fill('no-such-user-e2e')
  await page.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('wrong-password-123')
  await page.getByRole('button', { name: /دخول|تسجيل الدخول/ }).click()

  // Inline alert (aria-describedby wiring) — never a silent failure.
  await expect(page.locator('#auth-form-alert')).toBeVisible({ timeout: 15_000 })
  await expect(page).not.toHaveURL(/\/home|\/admin/)
})

test('protected routes redirect anonymous users to the landing gate', async ({ page }) => {
  for (const route of ['/home', '/lectures', '/profile']) {
    await page.goto(route)
    // The auth gate renders the WelcomeGate hero or bounces to /login.
    await expect(page).not.toHaveURL(new RegExp(route.replace('/', '\\/') + '$'))
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  }
})

test('signup form blocks submission with mismatched password confirmation', async ({ page }) => {
  await page.goto('/signup')
  await page.getByRole('textbox', { name: 'الاسم الكامل' }).fill('طالب اختبار E2E')
  await page.getByRole('textbox', { name: 'الرقم الجامعي' }).fill('e2e-signup-user')
  await page.getByRole('textbox', { name: 'البريد الإلكتروني' }).fill('e2e-signup@test.local')
  await page.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('Str0ngPass!e2e')
  await page.getByRole('textbox', { name: /تأكيد كلمة المرور/ }).fill('Different!Pass')

  await page.getByRole('button', { name: /إنشاء الحساب|إنشاء/ }).click()

  // The mismatch error is shown and no navigation happens.
  await expect(page.locator('#auth-form-alert, #signup-password-hint').first()).toBeVisible()
  await expect(page).not.toHaveURL(/\/home|\/admin/)
})
