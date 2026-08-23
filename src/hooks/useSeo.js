import { useEffect } from 'react'

const SITE_URL = 'https://al-azher-it-hub.vercel.app'

const DEFAULT_DESCRIPTIONS = {
  ar: 'منصة تعليمية لطلبة تكنولوجيا المعلومات - محاضرات فيديو، ملخصات، وملفات PDF',
  en: 'Educational platform for IT students - video lectures, summaries, and PDF files',
}

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

export function useSeo(pathname, lang) {
  useEffect(() => {
    if (!pathname) return
    const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    upsertCanonical(`${SITE_URL}${cleanPath === '/' ? '/' : cleanPath}`)

    const entry = ROUTE_DESCRIPTIONS[cleanPath]
    const description = entry ? entry[lang === 'ar' ? 'ar' : 'en'] : DEFAULT_DESCRIPTIONS[lang === 'ar' ? 'ar' : 'en']
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', `${SITE_URL}${cleanPath}`)
  }, [pathname, lang])
}

export default useSeo
