// Visual probe: render /lectures as a signed-in student with mock data and
// screenshot the thumbnails (desktop + mobile widths).
import { chromium } from '@playwright/test'
import { readFileSync } from 'fs'

const env = readFileSync('.env', 'utf8')
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim()
const SUPABASE_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim()

const USER = {
  studentId: 'probe-student',
  name: 'طالب فحص',
  role: 'student',
  email: 'probe@test.local',
  major: 'IT',
}

// Real YouTube ids: first two have maxres; the rest are videos known to lack it
const LECTURES = [
  { id: 'l1', titleAr: 'مقدمة البرمجة', titleEn: 'Intro', subjectAr: 'برمجة', subjectEn: 'CS', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', createdAt: '2026-08-01' },
  { id: 'l2', titleAr: 'الشبكات ١', titleEn: 'Net 1', subjectAr: 'شبكات', subjectEn: 'Net', url: 'https://www.youtube.com/watch?v=9bZkp7q19f0', createdAt: '2026-08-02' },
  { id: 'l3', titleAr: 'قواعد بيانات', titleEn: 'DB', subjectAr: 'بيانات', subjectEn: 'DB', url: 'https://youtu.be/kJQP7kiw5Fk', createdAt: '2026-08-03' },
  { id: 'l4', titleAr: 'أمن معلومات', titleEn: 'Sec', subjectAr: 'أمن', subjectEn: 'Sec', url: 'kJQP7kiw5Fk', createdAt: '2026-08-04' },
  { id: 'l5', titleAr: 'بدون رابط', titleEn: 'No url', subjectAr: 'عام', subjectEn: 'Gen', url: '', createdAt: '2026-08-05' },
]

function json(body) {
  return {
    status: 200,
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    },
    body: JSON.stringify(body),
  }
}

;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext({ locale: 'ar', viewport: { width: 1366, height: 900 } })
  const page = await context.newPage()
  const hits = {}
  page.on('response', (r) => { const u=r.url(); if (u.includes('rpc')) console.log('RESP:', r.status(), u.slice(0,100)) })
  page.on('request', (r) => { const u=r.url(); if (u.includes('rest/v1') || u.includes('auth')) console.log('REQ:', u.slice(0, 130)) })
  page.on('pageerror', (e) => console.log('PAGE_ERR:', String(e).slice(0, 200)))
  page.on('console', (m) => console.log('CS:', m.type(), m.text().slice(0, 150)))

  // Route at the CONTEXT level so it covers every page/target, and use a
  // single supabase-wide pattern (rpc/get_session_profile has no trailing
  // path, so '**/rest/v1/rpc/**' never matched it).
  await context.route('**supabase.co/**', (route) => {
    const url = route.request().url()
    hits.supabase = (hits.supabase || 0) + 1
    if (url.includes('/rpc/get_session_profile')) return json(USER)
    if (url.includes('/rpc/mark_viewed')) return json([])
    if (url.includes('/rpc/')) return json(null)
    if (url.includes('/rest/v1/lectures')) return json(LECTURES)
    if (url.includes('/rest/v1/')) return json([])
    if (url.includes('/auth/v1/')) return json({ user: null })
    return json(null)
  })

  // Seed the cached identity before app code runs — AuthContext's restore
  // path validates it against the mocked get_session_profile RPC.
  await page.addInitScript((user) => {
    const sbSession = {
      access_token: 'probe-access-token',
      refresh_token: 'probe-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'auth-1', email: user.email, user_metadata: { studentId: user.studentId, name: user.name } },
    }
    try { localStorage.setItem('sb-wtetgxgtvqewveorfnwj-auth-token', JSON.stringify(sbSession)) } catch {}
    sessionStorage.setItem('al_azher_session', JSON.stringify(user))
    sessionStorage.setItem('al_azher_lang', 'ar')
  }, USER)

  await page.goto('http://localhost:4199/lectures')
  await page.waitForTimeout(9000)
  
  const direct = await page.evaluate(async ({ url, key, sid }) => {
    try {
      const r = await fetch(url + '/rest/v1/rpc/get_session_profile', { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_student_id: sid }) })
      return { status: r.status, body: await r.json() }
    } catch (e) { return { error: String(e) } }
  }, { url: SUPABASE_URL, key: SUPABASE_KEY, sid: USER.studentId }).catch((e) => ({ error: String(e) }))
  console.log('DIRECT_RPC:', JSON.stringify(direct).slice(0, 200))
  console.log('FINAL_URL:', page.url())
  console.log('BODY_SNIP:', JSON.stringify(await page.locator('body').innerText().catch(() => '')).slice(0, 240))
  console.log('ROUTE_HITS:', JSON.stringify(hits))
  await page.screenshot({ path: 'test-results/lectures-thumbs.png', fullPage: true })

  browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })