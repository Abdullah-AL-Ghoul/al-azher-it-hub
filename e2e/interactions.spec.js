import { test, expect } from '@playwright/test'

// Public-page interaction E2E: language switching, theme switching, and the
// landing FAQ. All read-only — no accounts, no data writes.

test('language toggle switches the landing to English and persists', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /أنشئ حسابك مجاناً/ }).first()).toBeVisible()

  await page.getByRole('button', { name: /تبديل اللغة/ }).click()
  await expect(page.getByRole('link', { name: /Create your free account/ }).first()).toBeVisible({ timeout: 10_000 })

  // Reload — the choice must persist for the session.
  await page.reload()
  await expect(page.getByRole('link', { name: /Create your free account/ }).first()).toBeVisible()

  // And the document direction flipped to LTR.
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})

test('theme toggle applies a persistent theme class', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')

  await expect(page.getByRole('button', { name: /تبديل المظهر/ })).toBeVisible()
  const before = await html.getAttribute('data-theme')
  await page.getByRole('button', { name: /تبديل المظهر/ }).click()
  await expect
    .poll(async () => `${await html.getAttribute('data-theme') ?? ''}|${await html.getAttribute('class') ?? ''}`)
    .not.toBe(`${before ?? ''}|light`)

  // Reload — manual theme choices persist.
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('class', /dark/, { timeout: 5000 })
})

test('landing FAQ accordion expands and collapses', async ({ page }) => {
  await page.goto('/')

  const faqButtons = page.locator('button[aria-expanded]')
  await expect(faqButtons.first()).toBeAttached({ timeout: 15_000 })
  const count = await faqButtons.count()
  expect(count).toBeGreaterThan(0)

  const faqButton = faqButtons.last()
  await faqButton.scrollIntoViewIfNeeded()
  const wasOpen = (await faqButton.getAttribute('aria-expanded')) === 'true'
  await faqButton.click()
  await expect(faqButton).toHaveAttribute('aria-expanded', String(!wasOpen))
  await faqButton.click()
  await expect(faqButton).toHaveAttribute('aria-expanded', String(wasOpen))
})
