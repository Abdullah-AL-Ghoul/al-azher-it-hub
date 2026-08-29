import { defineConfig, mergeConfig } from 'vite'
import viteConfig from './vite.config.js'

// Reuse the app's Vite config (plugins, resolve.alias, define) and only add the
// Vitest test block on top. Keeping this in a separate file means the regular
// Vite build is never charged with test-specific settings.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: './src/test-utils/setup.js',
      // E2E specs live in e2e/ and belong to Playwright, not Vitest.
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        include: ['src/**'],
        exclude: ['src/test-utils/**', 'src/i18n/**', 'src/data/**', '**/__tests__/**'],
        // Growth floors, not targets: raise these as coverage improves. After
        // the 2026-08-29 round (useSeo, useLectures tests): 10.3% lines.
        thresholds: {
          statements: 10,
          branches: 25,
          functions: 20,
          lines: 7,
        },
      },
    },
  })
)
