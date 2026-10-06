import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// public/ files (like sw.js) are copied as-is and never processed by Vite,
// so __BUILD_DATE__ stays as a literal. This plugin injects the real build
// timestamp into dist/sw.js so the SW cache version changes every build
// (fixes stale cache + never-updating service worker).
function swVersionPlugin() {
  return {
    name: 'sw-version',
    apply: 'build',
    closeBundle() {
      const file = path.resolve(__dirname, 'dist/sw.js')
      if (!existsSync(file)) return
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const src = readFileSync(file, 'utf8')
      writeFileSync(file, src.replace(/__BUILD_DATE__/g, `"${stamp}"`))
    },
  }
}

export default defineConfig({
  plugins: [react(), swVersionPlugin()],
  esbuild: {
    // Strip debug-only console noise from the production bundle; console.warn
    // and console.error (ErrorBoundary, SW diagnostics) are kept.
    drop: ['debugger'],
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: 'esbuild',
    // Compression (gzip/brotli) is handled by Vercel/CDN at serve time;
    // if self-hosting, add vite-plugin-compression to emit .gz/.br at build.
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Keep react-icons in its own chunk to avoid bloating vendor-react;
        // order matters — vendor-icons check must stay before vendor-react.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-icons')) return 'vendor-icons'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('react-hot-toast')) return 'vendor-toast'
            if (id.includes('@supabase')) return 'vendor-supabase'
            // three + R3F + drei ship as one lazy vendor chunk, only fetched
            // when a Lazy3DScene actually mounts.
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three'
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'vendor-react'
          }
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        compact: true
      }
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', '@supabase/supabase-js'],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    cors: {
      // Localhost origins only — a wildcard origin lets any page in a browser
      // on the dev machine read responses from the Vite server.
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@i18n': path.resolve(__dirname, 'src/i18n')
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    postcss: './postcss.config.js'
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(
      process.env.SOURCE_DATE_EPOCH
        ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
        : new Date().toISOString()
    ),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})
