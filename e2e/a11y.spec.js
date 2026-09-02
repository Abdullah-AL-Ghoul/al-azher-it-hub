import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Automated WCAG scans (axe-core) on the public surface. Critical/serious
// violations fail the build; moderate-and-below are tracked manually.
// Authenticated pages are covered by the manual accessibility review.

async function scan(page, url) {
  await page.goto(url)
  await expect(page.locator('h1').first()).toBeAttached({ timeout: 15_000 })
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations.filter((v) => ['critical', 'serious'].includes(v.impact))
}

test('landing gate has no critical or serious a11y violations', async ({ page }) => {
  const violations = await scan(page, '/')
  expect(violations, JSON.stringify(violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length })), null, 2)).toEqual([])
})

test('login page has no critical or serious a11y violations', async ({ page }) => {
  const violations = await scan(page, '/login')
  expect(violations, JSON.stringify(violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length })), null, 2)).toEqual([])
})

test('signup page has no critical or serious a11y violations', async ({ page }) => {
  const violations = await scan(page, '/signup')
  expect(violations, JSON.stringify(violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length })), null, 2)).toEqual([])
})

test('404 page has no critical or serious a11y violations', async ({ page }) => {
  const violations = await scan(page, '/this-page-does-not-exist-xyz')
  expect(violations, JSON.stringify(violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length })), null, 2)).toEqual([])
})
