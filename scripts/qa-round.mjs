// Phase 5.3/5.5 — documented GUI + keyboard rounds (anonymous scope).
// Captures per-page screenshots at 4 viewports in both languages, records
// console errors/warnings per step, and walks a keyboard-only path.
// Output: .qa/*.png + .qa/gui-report.json + .qa/console.txt
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = 'http://localhost:4173'
const OUT = '.qa'
const SIZES = [
  { name: '320', width: 320, height: 640 },
  { name: '768', width: 768, height: 900 },
  { name: '1024', width: 1024, height: 800 },
  { name: '1440', width: 1440, height: 900 },
]
const PAGES = ['/', '/login', '/signup', '/forgot-password', '/no-such-page']
const report = { consoleByPage: {}, keyboardRound: {} }

fs.mkdirSync(OUT, { recursive: true })
if (fs.existsSync(`${OUT}/console.txt`)) fs.unlinkSync(`${OUT}/console.txt`)

const browser = await chromium.launch()

// Screenshot matrix: lang × viewport × page
for (const lang of ['ar', 'en']) {
  for (const size of SIZES) {
    for (const path of PAGES) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
      })
      await context.addInitScript((lang) => {
        sessionStorage.setItem('al_azher_lang', lang)
        sessionStorage.removeItem('al_azher_theme')
      }, lang)
      const page = await context.newPage()
      const key = `${lang} ${path} @${size.name}`
      const msgs = []
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') msgs.push(`[${msg.type()}] ${msg.text()}`)
      })
      page.on('pageerror', (err) => msgs.push(`[pageerror] ${err.message}`))

      await page.goto(`${BASE}${path}`)
      await page.waitForTimeout(1400) // splash + first paint settle
      const file = `${lang}-${size.name}-${path === '/' ? 'root' : path.replaceAll('/', '_')}.png`
      await page.screenshot({ path: `${OUT}/${file}` })
      report.consoleByPage[key] = msgs
      if (msgs.length) {
        fs.appendFileSync(`${OUT}/console.txt`, `=== ${key} ===\n${msgs.join('\n')}\n\n`)
      }
      await context.close()
      console.log('shot:', file)
    }
  }
}

// Keyboard-only round: no mouse events anywhere, both languages
for (const lang of ['ar', 'en']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript((lang) => {
    sessionStorage.setItem('al_azher_lang', lang)
    sessionStorage.removeItem('al_azher_theme')
  }, lang)
  const page = await context.newPage()
  const steps = []

  await page.goto(`${BASE}/`)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/kb-${lang}-root.png` })
  steps.push({ step: 'load / (splash → gate)', url: page.url() })

  await page.keyboard.press('Tab')
  const focused1 = await page.evaluate(() =>
    document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || 'none'
  )
  steps.push({ step: 'first Tab', focused: focused1 })

  // `?` opens the shortcuts guide
  await page.keyboard.press('?')
  await page.waitForTimeout(600)
  const guide = page.getByRole('dialog', { name: /keyboard shortcuts|اختصارات لوحة المفاتيح/i })
  const guideOpen = await guide.isVisible().catch(() => false)
  steps.push({ step: '? opens guide', ok: guideOpen })
  await page.screenshot({ path: `${OUT}/kb-${lang}-guide.png` })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(1200) // exit spring can run ~0.5s before unmount
  steps.push({ step: 'Escape closes guide', ok: !(await guide.isVisible().catch(() => false)) })

  // `/` opens the guest search panel
  await page.keyboard.press('/')
  await page.waitForTimeout(800)
  const guestPanel = page.getByRole('dialog').filter({ hasText: /sign in to search|سجّل الدخول للبحث/i })
  steps.push({ step: '/ opens guest search panel', ok: await guestPanel.isVisible().catch(() => false) })
  await page.screenshot({ path: `${OUT}/kb-${lang}-search-guest.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)

  report.keyboardRound[lang] = steps
  await context.close()
}

await browser.close()
fs.writeFileSync(`${OUT}/gui-report.json`, JSON.stringify(report, null, 2))
console.log('DONE — report at .qa/gui-report.json')
