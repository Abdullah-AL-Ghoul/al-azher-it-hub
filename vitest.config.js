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
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        include: ['src/**'],
        exclude: ['src/test-utils/**', 'src/i18n/**', 'src/data/**', '**/__tests__/**'],
        thresholds: {
          statements: 4,
          branches: 15,
          functions: 8,
          lines: 4,
        },
      },
    },
  })
)
