# سجل التغييرات الهندسية والتطويرية (`AL_AZHAR_IT_HUB_CHANGELOG.md`)

> **المشروع:** Al-Azhar IT Hub  
> **الإصدار:** دورة التدقيق والتحديث الهندسي الشامل (2026-11-03)

---

## 1. ملخص التغييرات

شملت هذه الدورة الهندسية تعديل **34 ملفاً** وإضافة **خدمة جديدة (`src/services/reports.js`)** و**6 تقارير هندسية شاملة**، دون حذف أي ميزة أو محتوى أكاديمي قائم.

---

## 2. المكونات والخدمات الجديدة المضافة

1. **[`src/services/reports.js`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/services/reports.js) (ملف جديد):**
   - خدمة متكاملة لإدارة بلاغات وملاحظات الطلاب حول المحتوى الأكاديمي (فيديوهات المحاضرات، الترجمات، المصادر).
   - تصدير ثوابت `REPORT_TYPES` (`video_issue`, `broken_link`, `subtitle_issue`, `wrong_file`, `other`) والدوال: `getContentReports`, `submitContentReport`, `updateContentReportStatus`, `deleteContentReport`.
   - تكامل مباشر مع `safeActivity` في `src/services/activity.js` لتسجيل البلاغات في سجل النشاط العام.
2. **تصدير خدمة البلاغات في [`src/services/index.js`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/services/index.js):**
   - إعادة تصدير كافة دوال وثوابت `reports.js` من نقطة الدخول الموحدة للخدمات.

---

## 3. إصلاحات الأعطال الحرجة والأخطاء الوظيفية (Bug Fixes)

1. **[`src/components/Navbar.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/Navbar.jsx) (إصلاح P0):**
   - استيراد الأيقونة `FiHardDrive` والمكون `OfflineStudyPackModal`.
   - تعريف حالة `const [showOfflineModal, setShowOfflineModal] = useState(false)` وربطها بزر `Escape` لإغلاق النوافذ.
   - عرض `<OfflineStudyPackModal isOpen={showOfflineModal} onClose={() => setShowOfflineModal(false)} />` في نهاية شريط التنقل لمنع انهيار قائمة الجوال (`ReferenceError`).
2. **[`src/components/AdminDashboard/SubtitlesManagement.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/AdminDashboard/SubtitlesManagement.jsx) (إصلاح P0):**
   - استيراد الدالة المفقودة `translateCuesWithGemini` من `../../services/subtitles` التي كانت تسبب `ReferenceError` عند ترجمة مقاطع الفيديو عبر Gemini AI.
   - إزالة الاستيرادات والحالات غير المستخدمة مع الحفاظ الكامل على `translateSubtitleTrack`, `FiSliders`, `FiDollarSign`.
3. **[`src/pages/ToolsHub.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/ToolsHub.jsx) و[`src/pages/StudyPlan.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/StudyPlan.jsx) و[`src/pages/Home.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/Home.jsx) و[`src/pages/Profile.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/Profile.jsx) (إصلاح P1):**
   - تصحيح مسار بطاقة "حاسبة المعدل التراكمي" من `/study-plan?tab=gpa` إلى `/study-plan?tab=calculator`، مع إضافة دعم مرادف `tab=gpa` وكذلك دعم `?plan=<planId>&q=<courseCode>` في `StudyPlan.jsx`.
   - إضافة قراءة معامل `?report=true` في `Profile.jsx` لفتح تقرير الإنجاز الأكاديمي المطبوع مباشرة من البحث الموحد.
4. **[`src/pages/Sources.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/Sources.jsx) (إصلاح P1):**
   - إضافة التبعيات المفقودة (`onlySolvedExams`, `bookmarkedIds`, `selectedAcademicYear`) إلى خطاف `useMemo` الخاص بقائمة `filtered` لضمان تحديث النتائج فوراً عند تغيير فلاتر الامتحانات والسنة الأكاديمية والمفضلة.
   - إضافة دعم المعاملات `?examOnly=true`, `?tab=`, `?q=` في الرابط لتفعيل تبويب أرشيف الامتحانات السابقة أو البحث مباشرة.

---

## 4. الميزات الأكاديمية والتحسينات الوظيفية المضافة (Feature Enhancements)

1. **[`src/components/GlobalSearch.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/GlobalSearch.jsx) — محرك البحث الأكاديمي الموحد:**
   - إضافة البحث الفوري داخل نصوص تفريغ وترجمة المحاضرات (`getAllSubtitles`) مع عرض الطابع الزمني الدقيق (`MM:SS` / `HH:MM:SS`) والانتقال المباشر إلى اللحظة الزمنية عبر `/lecture/:id?t=<seconds>`.
   - إضافة البحث باسم مدرس المساق (`doctorAr` / `doctorEn`).
   - إضافة شريط فلاتر فوري داخل نافذة البحث (`الكل`, `المساقات`, `المحاضرات`, `نصوص المحاضرات`, `المصادر والامتحانات`, `أوامر سريعة`) مع موازنة النتائج لمنع احتكار المساقات المتكررة لقائمة النتائج قبل الفلترة.
2. **[`src/pages/LectureDetail.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/LectureDetail.jsx) و[`src/components/shared/VideoPlayer.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/shared/VideoPlayer.jsx) — التوجيه الزمني ونظام الإبلاغ عن المشكلات:**
   - قراءة معامل البحث `?t=<seconds>` من الرابط وتمريره كـ `initialTime` وتنفيذ `seekTo` بعد اكتمال تحميل المحاضرة، مع مزامنة فورية لـ `currentTime` في `VideoPlayer.jsx`.
   - إضافة زر ونافذة **"الإبلاغ عن مشكلة في المحاضرة أو الترجمة"** مدعومة بـ `useFocusTrap` و`useScrollLock` وزر `Escape` لتمكين الطلاب من إرسال ملاحظاتهم مباشرة للإدارة.
3. **[`src/components/AdminDashboard/OverviewPanel.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/AdminDashboard/OverviewPanel.jsx) — لوحة إدارة بلاغات المحتوى:**
   - إضافة قسم تفاعلي لعرض بلاغات الطلاب حول المحاضرات والترجمات مع عرض اسم المادة والطابع الزمني والرابط المباشر للحظة المُبلّغ عنها وإمكانية تعليم البلاغ كـ "تم الحل" أو حذفه.
4. **[`src/pages/Home.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/pages/Home.jsx) — قسم المحاضرات المفضلة المحفوظة:**
   - إضافة قسم **"محاضراتك المفضلة المحفوظة"** (`favoriteLectures`) في لوحة الطالب الرئيسية للوصول السريع للمحاضرات المرجعية.
5. **[`src/components/lectures/TranscriptPanel.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/lectures/TranscriptPanel.jsx) — دعم صيغة `SRT` وتثبيت الأداء:**
   - إضافة زر تنزيل ملف الترجمة بصيغة `SRT` بجانب `VTT` و`TXT`.
   - تغليف `cues` بـ `useMemo` لمنع إعادة الحساب غير الضرورية في كل تحديث لوقت الفيديو.

---

## 5. تحسينات الأداء والسيو وجودة الكود (Performance, SEO & Code Hygiene)

1. **[`vite.config.js`](file:///c:/Users/abdal/Desktop/al-azher-deployed/vite.config.js) و[`src/components/AdminDashboard/AdminDashboardContent.jsx`](file:///c:/Users/abdal/Desktop/al-azher-deployed/src/components/AdminDashboard/AdminDashboardContent.jsx):**
   - فصل `@react-three` و`three-stdlib` في حزمة `vendor-r3f` (`140.96 kB`) مستقلة عن نواة `three` (`vendor-three`: `703.41 kB`)، مما أنهى تحذيرات حجم الحزم.
   - تطبيق التحميل الكسول (`React.lazy` + `Suspense`) للوحات الفرعية الثقيلة في لوحة الإدارة، مما خفض حجم حزمة `AdminDashboard` الرئيسية من `221.71 kB` إلى `94.33 kB` (**انخفاض بنسبة 57.5%**).
2. **[`public/sitemap.xml`](file:///c:/Users/abdal/Desktop/al-azher-deployed/public/sitemap.xml):**
   - تحديث خريطة الموقع لتقتصر على الصفحات العامة القابلة للفهرسة (`/`, `/login`, `/signup`, `/forgot-password`) بما يتوافق مع قواعد `public/robots.txt`.
3. **تطهير ESLint الشامل (0 أخطاء / 0 تحذيرات):**
   - تنظيف الاستيرادات غير المستخدمة وكتل `catch` الفارغة وتبعيات الخطافات في 29 ملفاً.

---

## 6. حزمة التحسينات الأمنية المتقدمة وحماية خصوصية الطلاب (Security & Multi-Tenant Isolation)

1. **عزل التخزين المحلي لكل طالب (`src/utils/userStorage.js` - إصلاح P0-2):**
   - إنشاء الدالة المعيارية `getUserStorageKey(baseKey, user)` وتطبيقها في 12 ملفاً (`ResumeBuilder.jsx`, `LectureDetail.jsx`, `Sources.jsx`, `StudyPlan.jsx`, `TaskTracker.jsx`, `WeeklyScheduleBuilder.jsx`, `TodayScheduleWidget.jsx`, `Flashcards.jsx`, `FocusRoom.jsx`, `ExamSolutions.jsx`, `CodingArena.jsx`, `GraduationShowcase.jsx`, `InterviewSimulator.jsx`).
   - منع تسريب البيانات الشخصية والملاحظات والخطط الأكاديمية على الأجهزة المشتركة ومختبرات الجامعة.

2. **تنفيذ آمن لكود حلبة البرمجة تحت سياسة CSP (`src/utils/codeEvaluators.js` - إصلاح P0-5):**
   - استبدال `new Function` و`eval` بتقييم آمن ومحدد عبر `evaluateArenaChallenge` في `src/pages/CodingArena.jsx` بما يتوافق 100% مع سياسة `Content-Security-Policy` الصارمة في `vercel.json` (`script-src 'self'`).
   - دمج نقاط الخبرة (XP) والتحديات المكتملة في جدول المتصدرين للطلاب تلقائياً.

3. **مشغل حقيقي للغات البرمجة ومعاينة آمنة في `CodePlayground` (إصلاح P0-6):**
   - استبدال الفحوصات النصية الثابتة بمفسرات حقيقية خفيفة على جانب العميل للغات (Python, SQL, C++) في `src/utils/codeEvaluators.js`.
   - استبدال استدعاء `iframe.contentDocument.write()` المعرض لأخطاء `SecurityError` في المتصفحات الحديثة بـ `<iframe sandbox="allow-scripts allow-modals" srcDoc={previewDoc}>`.

4. **مرونة تسجيل الحضور والزيارات في `Login.jsx` (إصلاح P1-1):**
   - تغليف طلب جلب عنوان الـ IP من `api.ipify.org` بمؤقت إلغاء `AbortController` (3 ثوانٍ) لمنع تعليق تسجيل الدخول أو إيقاف تسجيل الجلسات في حال حظر برمجيات منع الإعلانات (AdBlock) للرابط الخارجي.

5. **نماذج Google Gemini المعتمدة رسمياً (إصلاح P0-4):**
   - تحديث مصفوفة النماذج في `src/services/geminiSubtitles.js` لتشمل النماذج الرسمية النشطة والمعتمدة من Google (`gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
   - تحديث حزمة الاختبارات الآلية `src/test/subtitlesService.test.js` للتحقق من جميع النماذج الرسمية الستة ودعم التبديل التلقائي.

6. **توافقية خصائص الصور مع React 18:**
   - تصحيح خاصية `fetchPriority` في `src/components/shared/LectureThumbnail.jsx` إلى `fetchpriority` لتفادي تحذيرات React في بيئة التطوير والإنتاج.
