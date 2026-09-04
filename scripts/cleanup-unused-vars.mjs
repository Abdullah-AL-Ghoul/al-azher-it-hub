// Line-based cleanup of unused vars left by the i18n migration (CRLF-safe).
import fs from 'fs'

function editLines(file, fn) {
  const raw = fs.readFileSync(file, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const lines = raw.split(/\r?\n/)
  const out = fn(lines)
  fs.writeFileSync(file, out.join(eol))
}

// 1) Drop standalone unused `const isArabic = lang === 'ar'` lines.
for (const f of [
  'src/App.jsx',
  'src/components/Footer.jsx',
  'src/components/HeroSection.jsx',
  'src/components/Navbar.jsx',
]) {
  editLines(f, (lines) => lines.filter((l, i) => {
    if (/^\s*const isArabic = lang === 'ar'\s*$/.test(l)) {
      const prev = lines.slice(Math.max(0, i - 3), i).join(' ')
      const rest = lines.slice(i + 1, i + 6).join(' ')
      // Only remove when isArabic is genuinely unused in the file.
      const uses = lines.filter((x) => /\bisArabic\b/.test(x)).length
      if (uses <= 1) return false
      return true
    }
    return true
  }))
}

// 2) Trim unused imports in test files.
editLines('src/components/__tests__/GlobalSearch.test.jsx', (lines) =>
  lines.filter((l) => !/^import \{ __setSupabaseMock \}/.test(l)))

editLines('src/components/shared/__tests__/EmptyState.test.jsx', (lines) =>
  lines.map((l) => l.replace(/^import \{ describe, it, expect, vi \} from 'vitest'$/, "import { describe, it, expect } from 'vitest'")))

editLines('src/components/shared/__tests__/Skeleton.test.jsx', (lines) =>
  lines.map((l) => l.replace(/^import \{ render, screen \} from '@testing-library\/react'$/, "import { render } from '@testing-library/react'")))

editLines('src/hooks/__tests__/useScrollManager.test.jsx', (lines) =>
  lines.map((l) => l.replace(/^import \{ describe, it, expect, beforeEach, afterEach, vi \} from 'vitest'$/, "import { describe, it, expect, beforeEach, afterEach } from 'vitest'")))

console.log('cleanup done')
