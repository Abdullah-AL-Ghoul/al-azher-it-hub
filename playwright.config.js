import { defineConfig, devices } from '@playwright/test'

// Smoke tests run against the production build (vite preview) so they exercise
// the real chunk graph and service-worker registration path. They are strictly
// anonymous and read-only: no test signs in or writes to Supabase.
export default defineConfig({
	testDir: './e2e',
	timeout: 30000,
	expect: { timeout: 10000 },
	fullyParallel: true,
	retries: process.env.CI ? 1 : 0,
	reporter: [['list']],
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure',
		// Block the PWA service worker so tests always exercise the fresh build
		// instead of a cache from a previous run.
		serviceWorkers: 'block',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run preview -- --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 60000,
	},
})
