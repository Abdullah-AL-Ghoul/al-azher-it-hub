import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Phase 5 expansion — anonymous, read-only. Covers the Phase 4 surfaces that
// are reachable without credentials (shortcuts, guest search panel, new route
// guard) plus axe-core a11y sweeps of every public page in both languages.

test.describe('keyboard shortcuts (anonymous)', () => {
	test('`?` opens the shortcuts guide and Escape closes it', async ({ page }) => {
		await page.goto('/login')
		await page.locator('#main-content form').waitFor()
		await page.keyboard.press('?')
		const dialog = page.getByRole('dialog', { name: /keyboard shortcuts|اختصارات لوحة المفاتيح/i })
		await expect(dialog).toBeVisible()
		await page.keyboard.press('Escape')
		await expect(dialog).toBeHidden()
	})

	test('`/` opens global search, which shows the guest sign-in panel', async ({ page }) => {
		await page.goto('/login')
		await page.locator('#main-content form').waitFor()
		await page.keyboard.press('/')
		const panel = page.getByRole('dialog').filter({ hasText: /sign in to search|سجّل الدخول للبحث/i })
		await expect(panel).toBeVisible()
		// The panel links to /login (previously this was a silent null render)
		await expect(panel.getByRole('link', { name: /sign in|تسجيل الدخول/i })).toBeVisible()
	})

	test('`g` sequences navigate: anonymous g+p redirects through the guard', async ({ page }) => {
		await page.goto('/login')
		await page.locator('#main-content form').waitFor()
		// The login form autofocuses its first field — take focus off it so the
		// app-level shortcuts (skipped while typing) actually fire.
		await page.mouse.click(5, 300)
		await page.keyboard.press('g')
		await page.keyboard.press('p', { delay: 60 })
		// /profile is protected — the anonymous user bounces to the welcome gate
		await expect(page).toHaveURL(/\/$/)
	})
})

test.describe('notifications center (anonymous guard)', () => {
	test('/notifications redirects anonymous visitors to the welcome gate', async ({ page }) => {
		await page.goto('/notifications')
		await expect(page).toHaveURL(/\/$/)
	})
})

test.describe('axe-core (public pages, both languages)', () => {
	// The welcome gate runs a live WebGL scene during analysis; under parallel
	// workers 30s is not enough.
	test.describe.configure({ mode: 'serial' })
	test.setTimeout(90_000)

	for (const lang of ['ar', 'en']) {
		for (const path of ['/', '/login', '/signup', '/forgot-password', '/no-such-page']) {
			test(`axe: ${lang} ${path}`, async ({ page }) => {
				await page.addInitScript((lang) => {
					sessionStorage.setItem('al_azher_lang', lang)
					// Deterministic theme for contrast rules
					sessionStorage.removeItem('al_azher_theme')
				}, lang)
				await page.goto(path)
				await page.locator('#main-content').waitFor()

				const results = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa'])
					.analyze()

				const critical = results.violations.filter(
					(v) => v.impact === 'critical' || v.impact === 'serious'
				)
				// Log for the report but fail only on criticals — serious items are
				// tracked, not gating (embed/third-party constraints).
				if (critical.length) {
					console.log(`axe ${lang} ${path}:`, JSON.stringify(critical.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))))
				}
				expect(critical, JSON.stringify(critical.map((v) => `${v.id} x${v.nodes.length}`))).toEqual([])
			})
		}
	}
})
