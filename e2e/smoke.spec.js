import { test, expect } from '@playwright/test'

// Anonymous, read-only smoke suite for the route config migration.
// Verifies: bare/protected routing, redirects, lazy chunk loading through
// Suspense, and RTL/LTR direction handling — in both languages.

test.describe('welcome gate (bare route)', () => {
	test('renders in Arabic RTL when Arabic is selected', async ({ page }) => {
		// The language defaults from the browser locale; pin it for determinism.
		await page.addInitScript(() => sessionStorage.setItem('al_azher_lang', 'ar'))
		await page.goto('/')
		await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
		await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
		await expect(page.locator('#main-content')).toBeVisible()
	})

	test('persisted English preference switches direction to LTR', async ({ page }) => {
		await page.addInitScript(() => sessionStorage.setItem('al_azher_lang', 'en'))
		await page.goto('/')
		await expect(page.locator('html')).toHaveAttribute('lang', 'en')
		await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
	})
})

test.describe('auth pages (bare routes)', () => {
	test('login renders its form through the lazy Suspense path', async ({ page }) => {
		await page.goto('/login')
		await expect(page).toHaveURL(/\/login$/)
		await expect(page.locator('#main-content form')).toBeVisible()
	})
})

test.describe('route guards (anonymous)', () => {
	test('protected /home redirects to the welcome gate', async ({ page }) => {
		await page.goto('/home')
		await expect(page).toHaveURL(/\/$/)
	})

	test('admin-only /admin redirects anonymous visitors to the welcome gate', async ({ page }) => {
		await page.goto('/admin')
		await expect(page).toHaveURL(/\/$/)
	})

	test('legacy /videos redirect lands on the protected lectures route', async ({ page }) => {
		await page.goto('/videos')
		// /videos -> /lectures (config redirect) -> / (unauthenticated guard)
		await expect(page).toHaveURL(/\/$/)
	})
})

test.describe('catch-all', () => {
	test('unknown paths render the NotFound page without changing the URL', async ({ page }) => {
		await page.goto('/this-path-does-not-exist')
		await expect(page).toHaveURL(/\/this-path-does-not-exist$/)
		await expect(page.locator('#main-content h1')).toBeVisible()
	})
})
