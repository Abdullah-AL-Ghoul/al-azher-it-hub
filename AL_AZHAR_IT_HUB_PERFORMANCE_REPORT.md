# تقرير الأداء وتحسين الحزم وCore Web Vitals (`AL_AZHAR_IT_HUB_PERFORMANCE_REPORT.md`)

> **المشروع:** Al-Azhar IT Hub  
> **تاريخ القياس:** 2026-11-03  
> **أداة البناء والقياس:** Vite 7.3.6 (Rollup + esbuild minification + gzip estimation)

---

## 1. مقارنة الأداء وأحجام الحزم (قبل وبعد التحسين — Before vs. After)

| المؤشر / الحزمة | قبل التحسين (Baseline) | بعد التحسين (After) | نسبة التحسن / الفارق |
|---|---|---|---|
| **حزمة `AdminDashboard` (`dist/assets/AdminDashboard-*.js`)** | `221.71 kB` (`gzip: 51.99 kB`) | **`94.92 kB` (`gzip: 23.02 kB`)** | **انخفاض بنسبة -57.2% (-126.79 kB)** بعد تحويل اللوحات الفرعية إلى `React.lazy` |
| **حزمة `vendor-three` (`dist/assets/vendor-three-*.js`)** | `846.04 kB` (`gzip: 226.44 kB`) | **`703.41 kB` (`gzip: 181.17 kB`)** | **انخفاض بنسبة -16.9% (-142.63 kB)** عبر فصل `@react-three` و`three-stdlib` في `vendor-r3f` (`140.96 kB`) |
| **تحذيرات حجم الحزم في البناء (`> chunkSizeWarningLimit`)** | تحذير نشط (`(!) Some chunks are larger than 500 kB`) | **0 تحذيرات (Clean Build)** | القضاء الكامل على تحذيرات الحزم وتخصيص اللوحات الإدارية في حزم مستقلة |
| **زمن البناء الإنتاجي (`npm run build`)** | `46.37s` | **`40.19s`** | **أسرع بنسبة 13.3% (-6.18s)** |
| **إعادة حساب المصفوفات في `TranscriptPanel.jsx` و`Home.jsx`** | إعادة إنشاء مصفوفة `cues` و`favorites` في كل رندر مما يبطل `useMemo` | **تثبيت المراجع عبر `useMemo`** | منع إعادة الفلترة غير الضرورية في كل إطار زمني لتشغيل الفيديو (تحسين مباشر لمؤشر **INP**) |

---

## 2. تفصيل الحزم المقسمة حديثاً في لوحة الإدارة (Lazy-Loaded Admin Sub-Panels)

بدلاً من تحميل كامل كود لوحة الإدارة في حزمة واحدة ضخمة (`221.71 kB`)، أصبحت اللوحات الفرعية تُحمل عند الطلب فقط عند فتح التبويب الخاص بها:

| الحزمة المستقلة (Lazy Chunk) | الحجم (Minified) | الحجم المضغوط (Gzip) | متى يتم تحميلها؟ |
|---|---|---|---|
| `AdminDashboard-*.js` (النواة + النظرة العامة) | `94.92 kB` | `23.02 kB` | عند دخول المشرف إلى `/admin` |
| `SubtitlesManagement-*.js` | `41.62 kB` | `10.89 kB` | عند فتح تبويب "إدارة الترجمة والتفريغ" فقط |
| `StudentAnalyticsPanel-*.js` | `20.91 kB` | `5.78 kB` | عند فتح تبويب "تحليلات الطلاب" فقط |
| `BroadcastPanel-*.js` | `17.44 kB` | `4.85 kB` | عند فتح تبويب "الإشعارات العامة" فقط |
| `UsersTable-*.js` | `16.49 kB` | `4.43 kB` | عند فتح تبويب "إدارة الطلاب" فقط |
| `SettingsPanel-*.js` | `16.46 kB` | `3.33 kB` | عند فتح تبويب "إعدادات الموقع" فقط |
| `ActivityLogs-*.js` | `9.65 kB` | `3.00 kB` | عند فتح تبويب "سجل التعديلات" فقط |
| `StudentLogs-*.js` | `6.91 kB` | `2.47 kB` | عند فتح تبويب "سجل نشاط الطلاب" فقط |

---

## 3. تحليل مؤشرات Core Web Vitals (LCP / INP / CLS)

1. **Largest Contentful Paint (LCP):**
   - تم عزل `preload-runtime` في `vite.config.js` بحيث لا يتم إرفاق `<link rel="modulepreload">` لحزمة `vendor-three` في رأس صفحة HTML الأولية.
   - المشهد ثلاثي الأبعاد (`SpatialCanvas`) مؤجل عبر `requestIdleCallback` بمهلة 1200ms ولا يُحمل على الجوال أو الأجهزة منخفضة الذاكرة (`deviceMemory < 4`).
   - النتيجة: المسار الحرج الأولي يقتصر على `index.js` (`56.12 kB gzip`) + `vendor-react` (`59.43 kB gzip`) + `index.css` (`24.69 kB gzip`).
2. **Interaction to Next Paint (INP):**
   - في `TranscriptPanel.jsx`، كان السطر `const cues = activeTrack?.cues || []` ينشئ مرجع مصفوفة جديد في كل مرة يتحدث فيها `currentTime` (4 مرات في الثانية أثناء تشغيل الفيديو)، مما يُبطل `useMemo` لـ `filteredCues` و`activeCueInfo`. تغليف `cues` و`favorites` بـ `useMemo` خفف الحمل الحسابي أثناء التفاعل المباشر.
3. **Cumulative Layout Shift (CLS):**
   - يستخدم مشغل الفيديو (`VideoPlayer.jsx`) حاوية ذات نسبة أبعاد ثابتة (`aspect-video` / `16:9`) مع صور مصغرة (`LectureThumbnail`) مسبقة الأبعاد، وتستخدم قوائم المساقات والمحاضرات والمصادر مكونات `Skeleton` مطابقة لأبعاد البطاقات الفعلية لمنع أي إزاحة تخطيطية أثناء التحميل.
