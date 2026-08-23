# دليل النشر والترحيل الأمني — AL-Azher IT Hub

> **للمالك فقط.** لا تنفَّذ أي أمر من هذا الدليل على قاعدة بيانات الإنتاج قبل قراءة القسم كاملاً.
> آخر تحديث: 2026-08-23 | الحالة المحلية: 5 commits، lint/tests/build خضراء، Lighthouse A11y/BP/SEO = 100

---

## المرحلة 0 — نشر الكود المحلي (إلزامية أولاً)

كل إصلاحات التدقيق موجودة محلياً فقط (لا يوجد `origin`):

```powershell
# 1) أنشئ مستودعاً فارغاً على GitHub (بدون README) ثم:
git remote add origin https://github.com/<حسابك>/al-azher-it-hub.git
git push -u origin master

# 2) في Vercel: Import Git Repository ← اختر المستودع ← اربطه بمشروع
#    al-azher-it-hub الموجود (Settings ← Git ← Connect)
# 3) أي push لاحق = نشر تلقائي مع معاينة لكل PR
```

**بديل عبر CLI** (إن وفرت `VERCEL_TOKEN`):
```powershell
npx vercel --prod --token=<TOKEN> --yes
```

✅ تحقق بعد النشر: افتح الموقع ← مصدر الصفحة يجب أن يحتوي `js/index-DuxP6Wcl.js` أو أحدث، وأن CSP يذكر `wtetgxgtvqewveorfnwj.supabase.co` بدلاً من `*.supabase.co`.

---

## المرحلة 1 — التحقق من حالة RLS (قراءة فقط، آمن 100%)

افتح **Supabase Dashboard ← SQL Editor** وشغّل الاستعلامات [A]–[F] من تقرير التدقيق
(سكربت read-only كامل مرفق أسفل هذا الدليل). أهم ثلاث نتائج:

| الاستعلام | النتيجة الصحية | إن ظهر العكس |
|---|---|---|
| [A] `relrowsecurity` للجداول الـ13 | `true` للجميع | طبّق الخطوة 2 الآن |
| [C2] سياسات activity | لا وجود لـ `activity_all_read` | تسريب PII حي — طبّق الخطوة 2 |
| [C3] سياسات storage.objects | لا وجود لـ `sources_auth_upload` | أي مستخدم يرفع ملفات — طبّق الخطوة 2 |

---

## المرحلة 2 — توحيد الأمان (idempotent، قابل لإعادة التشغيل)

```sql
-- الصق كامل الملف ثم Run:
-- supabase/security-consolidated.sql
```

بعده أعد الاستعلام [A] — يجب أن يظل كل شيء `true`.

### ⚠️ كسور وظيفية يعالجها هذا الملف — يجب مزامنة الكود معها:

التوحيد **يسحب صلاحية INSERT المباشر** على جدول users ويغلق القراءة قبل الدخول.
ثلاث نقاط في الكود ستتعطل إن نُشر الـ SQL وحده:

| # | الموضع الحالي | الإجراء المطلوب قبل/مع النشر |
|---|---|---|
| 1 | `src/services/users.js` → `registerUser()` و `findOrCreateOAuthUser()`: إدراج مباشر `.from('users').insert(...)` | استبداله باستدعاء `rpc('register_user', { p_name, p_student_id, p_password_hashed, p_major, p_email, p_auth_user_id })` — الدالة موجودة جاهزة في security-consolidated.sql (سطر ~218) وتفرض `role='student'` من الخادم |
| 2 | `authenticateUser()`: استعلام `users` قبل المصادقة (سطر ~208) لن يجد شيئاً تحت السياسات الجديدة | اعتمد مسار Supabase Auth فقط للحسابات المرتبطة، وأضف RPC خاص باحتياط الحسابات القديمة (أو أكمل ترحيل docs/auth-migration.md قبل السحب) |
| 3 | `src/hooks/useNotifications.js` + `src/services/activity.js`: قراءة `activity` مباشرة ستعيد صفاً فارغاً للطلاب | الانتقال إلى `get_notifications_feed(limit)` الموجودة في نفس الملف (سطر ~199) وتحديد الأعمدة الآمنة |

**الترتيب الآمن:** انشر commit الكود الذي يستخدم الـ RPCs *في نفس الوقت* مع تشغيل
الـ SQL (نافذة ثوانٍ)، أو شغّل SQL أولاً ثم فوراً deploy الكود — والتطبيق حالياً
غير مفتوح للجميع فهذه النافذة مقبولة.

---

## المرحلة 3 — ترقية بوابة كلمات المرور (patch v2)

```sql
-- supabase/patch-password-oracle-throttle.sql   (نسخة v2 المُراجعة)
```

ماذا تفعل: خنّاز الثروتسلينغ (10 محاولات/15 دقيقة لكل معرف)، وإخفاء وجود
الحسابات (salt عشوائي للحسابات غير الموجودة)، مع بقاء عقد الـ client كما هو.

اختبار ما بعد التطبيق (نفس محرر SQL):
```sql
select public.get_password_salt('not-a-real-id');            -- 32 hex عشوائي وليس NULL
select public.verify_password('not-a-real-id', repeat('a',64)); -- false
-- كرّر الثانية >10 مرات خلال 15 دقيقة → يجب أن يرمي TOO_MANY_ATTEMPTS
```
ثم اختبر دخول حساب حقيقي واحد (قديم legacy + واحد PBKDF2 إن وجد).

---

## خطة التراجع (Rollback)

| المرحلة | كيف تتراجع |
|---|---|
| نشر الكود | Vercel ← Deployments ← **Instant Rollback** لآخر إصدار مستقر |
| consolidated | لا يحتاج تراجعاً (idempotent + سياساته هي المقصودة)؛ لكن إن انكسر التسجيل: أعِد منح INSERT مؤقتاً `grant insert on public.users to anon;` حتى تُنقل الكود للـ RPC |
| patch v2 | الدوال بنفس التواقيع — استرجع نسخ security-fix.sql بنفس أمر create or replace الموجود فيها |

---

## ملحق — سكربت التحقق المختصر (انسخه كما هو)

```sql
select c.relname, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
('users','courses','lectures','sources','additions','subjects','comments',
 'activity','student_logs','favorites','ratings','user_stats','settings');

select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema='public' and grantee in ('anon','authenticated')
  and privilege_type in ('INSERT','UPDATE','DELETE');          -- يجب: صفر صفوف

select policyname from pg_policies
where tablename='activity'
  and policyname='activity_all_read';                          -- يجب: صفر صفوف

select policyname from pg_policies
where tablename='objects' and schemaname='storage'
  and policyname='sources_auth_upload';                        -- يجب: صفر صفوف

select count(*) filter (where position(':' in password)=0) as legacy_hashes
from public.users;                                             -- خطة ترحيل لهؤلاء
```

---

## حالة الأداء الموثقة (بعد قياس نظيف)

- Desktop: Performance **90–92**، LCP < 1.1s
- Mobile: Performance **77**، **TBT 153ms** (قراءات سابقة ~1000ms كانت ملوثة بتشغيل وكلاء متوازٍ)
- قرار موثق: جرّب تأجيل Supabase خارج المسار الحرج → قِيس → **تراجعنا** لأنه زاد LCP موبايل 40% بسبب waterfall (36 طلباً بدل 16)
