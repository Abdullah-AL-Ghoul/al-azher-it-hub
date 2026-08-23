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
    },
  }),
)
