// Live UI/UX audit probe: captures public pages (desktop + mobile), plus
// interaction states (focused inputs, inline validation errors, mobile menu).
import { chromium } from '@playwright/test'
import fs from 'fs'

const BASE = 'http://localhost:4200'
const OUT = 'audit-shots'

;(async () => {
  const browser = await chromium.launch()
  fs.mkdirSync(OUT, { recursive: true })

  // ---------- Desktop (1366×900, Arabic, light) ----------
  const ctxD = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 } })
  const d = await ctxD.newPage()
  const shots = [
    ['/', 'landing-top'],
    ['/login', 'login'],
    ['/signup', 'signup'],
    ['/forgot-password', 'forgot'],
    ['/no-such-page-xyz', '404'],
  ]
  for (const [path, name] of shots) {
    await d.goto(BASE + path)
    await d.waitForTimeout(2500)
    await d.screenshot({ path: `${OUT}/d-${name}.png` })
    if (path === '/') {
      await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await d.waitForTimeout(1200)
      await d.screenshot({ path: `${OUT}/d-landing-bottom.png` })
    }
  }

  // Interaction states: login with wrong creds (inline error) + focused input
  await d.goto(BASE + '/login')
  await d.waitForTimeout(2000)
  await d.getByRole('textbox').first().click()
  await d.waitForTimeout(400)
  await d.screenshot({ path: `${OUT}/d-login-focus.png` })
  try {
    await d.getByRole('textbox', { name: /الرقم الجامعي أو البريد/ }).fill('probe-user-xyz')
    await d.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('wrong-pass-123')
    await d.getByRole('button', { name: /دخول|تسجيل/ }).click()
    await d.waitForTimeout(4000)
    await d.screenshot({ path: `${OUT}/d-login-error.png` })
  } catch (e) { console.log('login-error probe skipped:', String(e).slice(0, 80)) }
  await ctxD.close()

  // ---------- Desktop dark mode ----------
  const ctxDark = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 }, colorScheme: 'dark' })
  const dk = await ctxDark.newPage()
  await dk.goto(BASE + '/login')
  await dk.waitForTimeout(2000)
  await dk.screenshot({ path: `${OUT}/d-login-dark.png` })
  await ctxDark.close()

  // ---------- Mobile (390×844) ----------
  const ctxM = await browser.newContext({ locale: 'ar', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const m = await ctxM.newPage()
  for (const [path, name] of [['/', 'm-landing'], ['/login', 'm-login'], ['/signup', 'm-signup']]) {
    await m.goto(BASE + path)
    await m.waitForTimeout(2500)
    await m.screenshot({ path: `${OUT}/${name}.png` })
  }
  // mobile menu open
  await m.goto(BASE + '/login') // login has no navbar; open landing
  await m.goto(BASE + '/')
  await m.waitForTimeout(2000)
  await ctxM.close()

  await browser.close()
  console.log('shots done:', fs.readdirSync(OUT).join(', '))
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
