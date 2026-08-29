import { test, expect } from '@playwright/test'

// Smoke tests for the public surface of the app. The full content pages
// require auth and are covered by unit tests; these verify the shell
// and the auth pages render and behave.

test('landing page renders the hero and CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /أنشئ حسابك مجاناً/ }).first()).toBeVisible()
})

test('login page renders the form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('textbox', { name: /الرقم الجامعي أو البريد/ })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'كلمة المرور', exact: true })).toBeVisible()
})

test('signup page renders all fields', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.getByRole('textbox', { name: 'الاسم الكامل' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'الرقم الجامعي' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'كلمة المرور', exact: true })).toBeVisible()
})

test('static SEO assets are served', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain('<urlset')

  const og = await request.get('/og-image.png')
  expect(og.ok()).toBeTruthy()
  expect((await og.body()).length).toBeGreaterThan(10_000)
})

test('404 route renders the not-found page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist-xyz')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('browser locale en shows the English landing (locale detection)', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Create your free account/ }).first()).toBeVisible()
  await context.close()
})
