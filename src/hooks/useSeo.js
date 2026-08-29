import { useEffect } from 'react'

const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://al-azher-it-hub.vercel.app')

const DEFAULT_DESCRIPTIONS = {
  ar: 'منصة تعليمية لطلبة تكنولوجيا المعلومات - محاضرات فيديو، ملخصات، وملفات PDF',
  en: 'Educational platform for IT students - video lectures, summaries, and PDF files',
}

const ROUTE_TITLES = {
  '/': { ar: 'الرئيسية - AL-Azher IT Hub', en: 'Home - AL-Azher IT Hub' },
  '/login': { ar: 'تسجيل الدخول - AL-Azher IT Hub', en: 'Sign In - AL-Azher IT Hub' },
  '/signup': { ar: 'إنشاء حساب - AL-Azher IT Hub', en: 'Sign Up - AL-Azher IT Hub' },
  '/forgot-password': { ar: 'استعادة كلمة المرور - AL-Azher IT Hub', en: 'Reset Password - AL-Azher IT Hub' },
  '/reset-password': { ar: 'إعادة تعيين كلمة المرور - AL-Azher IT Hub', en: 'Reset Password - AL-Azher IT Hub' },
  '/home': { ar: 'الرئيسية - AL-Azher IT Hub', en: 'Home - AL-Azher IT Hub' },
  '/lectures': { ar: 'المحاضرات - AL-Azher IT Hub', en: 'Lectures - AL-Azher IT Hub' },
  '/sources': { ar: 'المصادر - AL-Azher IT Hub', en: 'Sources - AL-Azher IT Hub' },
  '/study-plan': { ar: 'الخطة الدراسية - AL-Azher IT Hub', en: 'Study Plan - AL-Azher IT Hub' },
  '/additions': { ar: 'الإضافات - AL-Azher IT Hub', en: 'Additions - AL-Azher IT Hub' },
  '/contact': { ar: 'تواصل معنا - AL-Azher IT Hub', en: 'Contact - AL-Azher IT Hub' },
  '/profile': { ar: 'الملف الشخصي - AL-Azher IT Hub', en: 'Profile - AL-Azher IT Hub' },
  '/roadmap': { ar: 'خارطة الطريق - AL-Azher IT Hub', en: 'Roadmap - AL-Azher IT Hub' },
  '/admin': { ar: 'لوحة التحكم - AL-Azher IT Hub', en: 'Admin Dashboard - AL-Azher IT Hub' },
}

// Dynamic route families + fallbacks (single source of truth for <title>).
const PREFIX_TITLES = {
  '/lecture/': { ar: 'تفاصيل المحاضرة - AL-Azher IT Hub', en: 'Lecture Details - AL-Azher IT Hub' },
}
const NOT_FOUND_TITLES = { ar: 'الصفحة غير موجودة - AL-Azher IT Hub', en: 'Page Not Found - AL-Azher IT Hub' }

const ROUTE_DESCRIPTIONS = {
  '/': {
    ar: 'AL-Azher IT Hub - منصة تعليمية لطلبة تكنولوجيا المعلومات في جميع السنوات',
    en: 'AL-Azher IT Hub - educational platform for IT students of all years',
  },
  '/login': {
    ar: 'تسجيل الدخول إلى منصة AL-Azher IT Hub',
    en: 'Sign in to AL-Azher IT Hub',
  },
  '/signup': {
    ar: 'إنشاء حساب جديد على منصة AL-Azher IT Hub',
    en: 'Create a new account on AL-Azher IT Hub',
  },
  '/forgot-password': {
    ar: 'استعادة كلمة المرور - AL-Azher IT Hub',
    en: 'Reset your password - AL-Azher IT Hub',
  },
  '/home': {
    ar: 'الرئيسية - محاضرات ومصادر وخطتك الدراسية في مكان واحد',
    en: 'Home - lectures, sources, and your study plan in one place',
  },
  '/lectures': {
    ar: 'تصفح جميع محاضرات تكنولوجيا المعلومات بالفيديو',
    en: 'Browse all IT video lectures',
  },
  '/sources': {
    ar: 'مصادر وملخصات وملفات PDF لجميع المواد',
    en: 'Sources, summaries, and PDF files for all subjects',
  },
  '/study-plan': {
    ar: 'خطتك الدراسية الأسبوعية منظمة في مكان واحد',
    en: 'Your weekly study plan organized in one place',
  },
  '/additions': {
    ar: 'إضافات وروابط مفيدة لطلبة تكنولوجيا المعلومات',
    en: 'Useful additions and links for IT students',
  },
  '/contact': {
    ar: 'تواصل مع فريق AL-Azher IT Hub',
    en: 'Contact the AL-Azher IT Hub team',
  },
  '/profile': {
    ar: 'ملفك الشخصي وإحصائيات نشاطك',
    en: 'Your profile and activity statistics',
  },
  '/roadmap': {
    ar: 'خارطة الطريق الأكاديمية - AL-Azher IT Hub',
    en: 'Academic Roadmap - AL-Azher IT Hub',
  },
  '/admin': {
    ar: 'لوحة التحكم - AL-Azher IT Hub',
    en: 'Admin Dashboard - AL-Azher IT Hub',
  },
}

function upsertMeta(attribute, key, content) {
  let el = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertRobots(content) {
  let el = document.head.querySelector('meta[name="robots"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'robots')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeRobots() {
  const el = document.head.querySelector('meta[name="robots"]')
  if (el) el.remove()
}

export function useSeo(pathname, lang) {
  useEffect(() => {
    if (!pathname) return
    const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    const isArabic = lang === 'ar'
    const canonicalHref = `${SITE_URL}${cleanPath === '/' ? '/' : cleanPath}`
    upsertCanonical(canonicalHref)
    // NOTE: no hreflang alternates — language is switched client-side (no /en
    // URL scheme), so ar/en alternates would point to the same URL, which
    // search engines treat as a contradiction. lang/dir attributes carry the
    // language signal instead. Revisit if URL-per-language is ever introduced.

    if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
      upsertRobots('noindex, nofollow')
    } else {
      removeRobots()
    }

    const entry = ROUTE_DESCRIPTIONS[cleanPath]
    const description = entry ? entry[isArabic ? 'ar' : 'en'] : DEFAULT_DESCRIPTIONS[isArabic ? 'ar' : 'en']
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', `${SITE_URL}${cleanPath}`)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:url', `${SITE_URL}${cleanPath}`)

    let titleEntry = ROUTE_TITLES[cleanPath]
    if (!titleEntry) {
      for (const prefix of Object.keys(PREFIX_TITLES)) {
        if (cleanPath.startsWith(prefix)) {
          titleEntry = PREFIX_TITLES[prefix]
          break
        }
      }
    }
    const title = titleEntry
      ? titleEntry[isArabic ? 'ar' : 'en']
      : NOT_FOUND_TITLES[isArabic ? 'ar' : 'en']
    document.title = title
    upsertMeta('property', 'og:title', title)
    upsertMeta('name', 'twitter:title', title)

    document.documentElement.lang = isArabic ? 'ar' : 'en'
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    upsertMeta('property', 'og:locale', isArabic ? 'ar_AR' : 'en_US')
  }, [pathname, lang])
}

export default useSeo
