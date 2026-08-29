# خطة الفحص الشامل والإصلاح — AL-Azher IT Hub

فحص 3 وكلاء متوازين اكتمل. النتائج: **تسريب PII خطير في قاعدة البيانات الحية** + 3 ترحيلات SQL غير مطبّقة (التعليقات/السجلات/الفهرس معطلة فعلياً) + ~25 مشكلة واجهة + تحسينات أداء آمنة.

**قراري حول framer-motion:** الإبقاء عليه (إزالته = إعادة بناء ~20 مكوّناً مقابل 35KB مضغوط فقط — تجارة سيئة). ننفذ التحسينات الآمنة بدلاً منه.

---

## المرحلة A — الطوارئ الحية (أولوية قصوى)

**A1. ملف SQL جديد `supabase/migration-fix-live-rls.sql`** — يغلق **تسريب PII المباشر** (الأخطر): جدولا `activity` (168 صفاً) و `student_logs` (297 صفاً) مقروءان من أي شخص (أسماء + أرقام جامعية + عناوين IP + بيانات الجهاز). المحتوى:
- `enable row level security` على الجدولين
- حذف كل السياسات الموجودة (drop all policies)
- إنشاء: قراءة admin فقط + إدراج للمصادقين فقط
- استعلامات تحقق

**A2. تحديث `migration-security-hardening.sql`** — سد 3 ثغرات اكتشفها الفحص قبل تطبيقه:
- `drop policy "sources_auth_upload"` (أي مستخدم مصادق كان يستطيع رفع أي ملف للـ bucket العام)
- `revoke execute on throttle_request/clear_request_throttle from anon` (كانت قابلة للتنفيذ علناً)

**A3. `git add`** الملفات العامة غير المتعقبة (boot.js, sw-register.js, og-image.png, fonts/) — بدون commit.

**A4. تحديث `docs/SECURITY_MIGRATION_CHECKLIST.md`** بترتيب التطبيق الجديد: fix-live-rls → hardening → catalog.

## المرحلة B — إصلاحات الواجهة (من فحص الواجهة)

- **B1.** Contact.jsx: تضمين البريد الإلكتروني في نص mailto (كان الحقل ميتاً)
- **B2.** حذف 3 كتل خطأ ميتة (StudyPlan, Additions, Sources)
- **B3.** Home.jsx: مؤشر التقدم RTL → `inset-inline-start` (كان ينعكس للعربي)
- **B4.** StudentLogs: عرض تسميات مترجمة حسب نوع السجل بدلاً من نصوص عربية مكتوبة يدوياً
- **B5.** تنظيف خصائص RTL الفيزيائية (Home, Sources, Contact, BackToTop/Chatbot توحيد, FilterBar, GlobalSearch) إلى logical properties
- **B6.** إصلاح سهم CourseRoadmap `rotate-180` غير المشروط
- **B7.** اعتماد مكوّن Skeleton الموحد في 7 صفحات متبقية
- **B8.** AdminSearch: تحميل البيانات الأربعة عند فتح اللوحة (بدل "لا نتائج" المضلل) + إكمال الـ a11y (aria-activedescendant + تنقل لوحة المفاتيح)
- **B9.** AdminDashboard: تنقل صريح بعد تسجيل الخروج + إظهار أخطاء تحميل التبويبات
- **B10.** نماذج الإضافة: تسميات aria للمدخلات + htmlFor في CourseRoadmap
- **B11.** ConfirmDialog لحذف عناصر StudyPlan و CourseRoadmap
- **B12.** تحقق من الرقم الجامعي في Signup (أدنى طول + trim + aria-invalid)
- **B13.** NotFound: نطاق mousemove على العنوان فقط
- **B14.** لمسات صغيرة: StarRating aria-pressed، إعادة تسمية studentsCount، maxLength للرسالة

## المرحلة C — الأداء والـ SEO (آمنة)

- **C1.** حذف 5 ملفات خطوط Inter "other" غير المستخدمة (85KB) + 15 قاعدة @font-face + تحديث سكربت التنزيل ليتجاهلها
- **C2.** Service Worker: تخزين صور YouTube المصغّرة (cache-first) + إضافة الخطوط/og-image/sitemap إلى precache
- **C3.** أول صورة في صفحة /catalog → `fetchpriority="high"` (مرشح LCP)
- **C4.** Preload شرطي لخط Inter (فقط عند اللغة الإنجليزية) عبر boot.js
- **C5.** تسجيل السكربتات في package.json (fonts:download, og:generate, sitemap:generate)
- **C6.** إصلاح CSP: إزالة sha256 قديمة + إزالة Supabase من script-src (تبقى في connect-src)

## المرحلة D — الاختبارات والـ CI

- **D1.** اختبارات جديدة: `useSeo.test.js` (العناوين/الـ canonical/robots لكل المسارات)، `catalog.test.js` (الخدمة)، `useLectures.test.js`
- **D2.** رفع عتبات التغطية قليلاً (lines 10 / functions 20 / branches 20) بعد إضافة الاختبارات — تحقق من الخضرة
- **D3.** توثيق متغيرات Supabase المطلوبة في CI لاختبارات E2E

## المرحلة E — الوثائق والتحقق النهائي

- **E1.** تحديث `docs/DEPLOY_AND_MIGRATE_GUIDE_AR.md` بالترحيلة الجديدة + توثيق قرار framer-motion
- **E2.** تحقق نهائي: ESLint + Vitest (مع الاختبارات الجديدة) + Playwright 6 اختبارات + Build + الخادم على 3000

**ملاحظة:** كل إصلاحات SQL تُسلَّم كملفات جاهزة — **أنت تطبقها** على Supabase الحيّ (لا أملك صلاحية الوصول)، والنشر على Vercel من طرفك.