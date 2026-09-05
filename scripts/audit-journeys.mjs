// UX journey probes: real interactions with measured outcomes (steps, time,
// visibility failures). No fabricated metrics — everything logged from the
// actual browser session.
import { chromium } from '@playwright/test'
import fs from 'fs'

const BASE = 'http://localhost:4200'
const results = []

const log = (journey, step, data) => results.push({ journey, step, ...data })

;(async () => {
  const browser = await chromium.launch()

  // ---------- Journey A: FAQ accordion discovery (desktop) ----------
  {
    const ctx = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 } })
    const p = await ctx.newPage()
    const t0 = Date.now()
    await p.goto(BASE + '/')
    await p.waitForTimeout(2200)
    const faqButtons = p.locator('button[aria-expanded]')
    const count = await faqButtons.count()
    log('A-FAQ', 'count-buttons', { observed: count, atMs: Date.now() - t0 })
    // Is the FAQ visible without scrolling from the fold?
    const first = faqButtons.first()
    const inFold = await first.isVisible().catch(() => false)
    const box = await first.boundingBox().catch(() => null)
    log('A-FAQ', 'first-visible-in-viewport', { observed: inFold && box ? box.y < 900 : false, y: box?.y })
    await first.scrollIntoViewIfNeeded()
    await first.click()
    await p.waitForTimeout(600)
    const expandedAfter = await first.getAttribute('aria-expanded')
    log('A-FAQ', 'expand-works', { observed: expandedAfter === 'true' })
    await ctx.close()
  }

  // ---------- Journey B: language toggle reachability ----------
  {
    const ctx = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(BASE + '/')
    await p.waitForTimeout(2200)
    const langBtn = p.getByRole('button', { name: /EN|English/ }).first()
    const visible = await langBtn.isVisible().catch(() => false)
    log('B-LANG', 'toggle-visible-desktop', { observed: visible })
    await langBtn.click()
    await p.waitForTimeout(1500)
    const english = await p.getByRole('link', { name: /Create your free account/ }).first().isVisible().catch(() => false)
    log('B-LANG', 'switched-to-en', { observed: english })
    const dir = await p.locator('html').getAttribute('dir')
    log('B-LANG', 'dir-flipped', { observed: dir })
    await ctx.close()
  }

  // ---------- Journey C: login wrong-credential feedback timing ----------
  {
    const ctx = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(BASE + '/login')
    await p.waitForTimeout(2000)
    const t0 = Date.now()
    await p.getByRole('textbox', { name: /الرقم الجامعي أو البريد/ }).fill('probe-ux-xyz')
    await p.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('wrong-pass-123')
    await p.getByRole('button', { name: /دخول|تسجيل الدخول/ }).click()
    let errorVisible = false
    let waited = 0
    try {
      await p.locator('#auth-form-alert').waitFor({ state: 'visible', timeout: 15000 })
      errorVisible = true
      waited = Date.now() - t0
    } catch { waited = Date.now() - t0 }
    log('C-LOGIN-ERR', 'inline-error-shown', { observed: errorVisible, latencyMs: waited })
    // Is focus moved to the alert?
    const described = await p.getByRole('textbox', { name: /الرقم الجامعي أو البريد/ }).getAttribute('aria-describedby').catch(() => null)
    log('C-LOGIN-ERR', 'field-describedby-links-alert', { observed: described === 'auth-form-alert' })
    // does the form keep the entered ID (friction check)?
    const idValue = await p.getByRole('textbox', { name: /الرقم الجامعي أو البريد/ }).inputValue()
    log('C-LOGIN-ERR', 'input-preserved', { observed: idValue === 'probe-ux-xyz' })
    await ctx.close()
  }

  // ---------- Journey D: mobile landing → CTA reachability ----------
  {
    const ctx = await browser.newContext({ locale: 'ar', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const p = await ctx.newPage()
    await p.goto(BASE + '/')
    await p.waitForTimeout(2500)
    const cta = p.getByRole('link', { name: /أنشئ حسابك مجاناً/ }).first()
    const visible = await cta.isVisible().catch(() => false)
    log('D-MOBILE', 'primary-cta-visible-without-scroll', { observed: visible })
    const tapTarget = await cta.boundingBox()
    log('D-MOBILE', 'cta-touch-size', { observed: tapTarget ? `${Math.round(tapTarget.height)}px height` : 'n/a', min44: tapTarget ? tapTarget.height >= 44 : null })
    // theme toggle & lang on mobile header
    const langM = await p.getByRole('button', { name: /EN|English/ }).first().isVisible().catch(() => false)
    log('D-MOBILE', 'lang-toggle-visible', { observed: langM })
    await ctx.close()
  }

  // ---------- Journey E: signup validation feedback ----------
  {
    const ctx = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(BASE + '/signup')
    await p.waitForTimeout(2000)
    // submit empty form — required-field feedback?
    await p.getByRole('button', { name: /إنشاء الحساب/ }).click().catch(() => {})
    await p.waitForTimeout(800)
    const alert = await p.locator('#auth-form-alert').isVisible().catch(() => false)
    const nativeValidity = await p.evaluate(() => {
      const el = document.querySelector('form input[required]')
      return el ? el.validationMessage : null
    })
    log('E-SIGNUP', 'empty-submit-feedback', { customAlert: alert, nativeValidation: Boolean(nativeValidity) })
    // password mismatch path
    await p.getByRole('textbox', { name: 'الاسم الكامل' }).fill('طالب اختبار')
    await p.getByRole('textbox', { name: 'الرقم الجامعي' }).fill('ux-probe-1')
    await p.getByRole('textbox', { name: 'البريد الإلكتروني' }).fill('ux-probe@test.local')
    await p.getByRole('textbox', { name: 'كلمة المرور', exact: true }).fill('Str0ng!Pass1')
    await p.getByRole('textbox', { name: /تأكيد كلمة المرور/ }).fill('Different!Pass')
    await p.getByRole('button', { name: /إنشاء الحساب/ }).click().catch(() => {})
    await p.waitForTimeout(1000)
    const mismatch = await p.locator('#auth-form-alert').isVisible().catch(() => false)
    log('E-SIGNUP', 'mismatch-error-shown', { observed: mismatch })
    await ctx.close()
  }

  await browser.close()
  fs.writeFileSync('audit-shots/journeys.json', JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 1))
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
