import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import PageHero from '../components/shared/PageHero'
import {
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiHelpCircle,
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiBookmark,
  FiCheck,
  FiZap,
  FiLayers
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const TRACKS = [
  { id: 'frontend', nameAr: 'مهندس واجهات أمامية (Frontend Engineer)', nameEn: 'Frontend Engineer', color: 'from-blue-600 to-cyan-500' },
  { id: 'backend', nameAr: 'مهندس خلفية وقواعد بيانات (Backend & DB)', nameEn: 'Backend & Databases', color: 'from-emerald-600 to-teal-500' },
  { id: 'fullstack', nameAr: 'تصميم الأنظمة وهندسة البرمجيات (System Design)', nameEn: 'System Design & SE', color: 'from-violet-600 to-indigo-500' },
  { id: 'mobile', nameAr: 'تطبيقات الهاتف المحمول (Mobile Apps)', nameEn: 'Mobile App Developer', color: 'from-amber-600 to-orange-500' },
]

const QUESTIONS_BANK = {
  frontend: [
    {
      id: 'fe-1',
      difficulty: 'junior',
      topic: 'JavaScript Engine',
      qAr: 'ما هو الفرق بين Event Loop و Microtasks vs Macrotasks في محرك JavaScript V8؟',
      qEn: 'What is the difference between Microtasks and Macrotasks in the JavaScript Event Loop?',
      modelAnswerAr: `حلقة الأحداث (Event Loop) مسؤولة عن إدارة تنفيذ العمليات المتزامنة وغير المتزامنة في خيط واحد (Single Thread).
1. الـ Call Stack ينفذ العمليات التزامنية أولاً.
2. عند تفريغ الـ Stack، يبدأ محرك V8 بفحص قائمة الـ Microtasks Queue (مثل: Promises و queueMicrotask) وينفذها حتى النهاية.
3. بعدها ينتقل إلى الـ Macrotasks Queue (مثل: setTimeout و setInterval و I/O callbacks) وينفذ واحدة منها، ثم يعيد فحص الـ Microtasks مجدداً.`,
      modelAnswerEn: `The Event Loop coordinates code execution. Microtasks (Promise callbacks, queueMicrotask) have higher priority and are completely drained before the browser picks the next Macrotask (setTimeout, requestAnimationFrame, I/O).`,
      interviewerTipsAr: 'المقابل يبحث عن فهم عميق لسبب تنفيذ .then() قبل setTimeout(..., 0).',
      interviewerTipsEn: 'Interviewer looks for why Promise.then() runs before setTimeout(0).'
    },
    {
      id: 'fe-2',
      difficulty: 'mid',
      topic: 'React Internals',
      qAr: 'كيف تعمل خوارزمية React Fiber والمطابقة (Reconciliation) عند تحديث الـ State؟',
      qEn: 'How does React Fiber Reconciliation work when state updates occur?',
      modelAnswerAr: `خوارزمية React Fiber تقسم عمل الريندر إلى وحدات عمل صغيرة (Work In Progress Units) قابلة للإيقاف المؤقت والاستئناف لتجنب تجميد الخيط الرئيسي (Main Thread).
تعتمد على المقارنة الاستدلالية O(N) لشجرة الـ Virtual DOM الحالية مع الشجرة الجديدة عبر مفاتيح العناصر (Keys)، وفي مرحلة الـ Commit يتم تطبيق التغييرات الفعلية فقط على الـ Real DOM.`,
      modelAnswerEn: `Fiber is a complete rewrite of React's reconciliation engine. It enables incremental rendering by breaking rendering work into chunks across animation frames using a doubly-linked tree of fibers.`,
      interviewerTipsAr: 'ركز على مرحلتي Render (المحاسبة غير المرئية) و Commit (الكتابة الفعلية في DOM).',
      interviewerTipsEn: 'Highlight the difference between the Render phase (pure) and Commit phase (DOM mutation).'
    },
    {
      id: 'fe-3',
      difficulty: 'mid',
      topic: 'Web Performance',
      qAr: 'ما هي مقاييس تجربة المستخدم Core Web Vitals (LCP, INP, CLS) وكيف تحسنها؟',
      qEn: 'Explain Core Web Vitals (LCP, INP, CLS) and how to optimize them.',
      modelAnswerAr: `1. LCP (Largest Contentful Paint): يقيس سرعة ظهور أكبر عنصر محتوى مرئي. يُحسن عبر تحسين حجم وضغط الصور (WebP/AVIF)، وتحميل الخطوط المسبق (preload).
2. INP (Interaction to Next Paint): يقيس استجابة الصفحة لنقرات المستخدم وتفاعله. يُحسن بتجنب المهام الطويلة (Long Tasks > 50ms) ونقل الحسابات الثقيلة لـ Web Workers.
3. CLS (Cumulative Layout Shift): يقيس استقرار الواجهة البصري. يُحسن بتحديد أبعاد ثابتة (width/height) لجميع الصور وحاويات الإعلانات.`,
      modelAnswerEn: `LCP measures load speed (<2.5s), INP measures responsiveness (<200ms), and CLS measures visual stability (<0.1). Optimized via modern formats, minimizing main thread blocking, and reserving element dimensions.`,
      interviewerTipsAr: 'تحدث عن المقاييس بالأرقام القياسية المعتمدة من Google (<2.5s, <200ms, <0.1).',
      interviewerTipsEn: 'Cite Google recommended thresholds: LCP < 2.5s, INP < 200ms, CLS < 0.1.'
    }
  ],
  backend: [
    {
      id: 'be-1',
      difficulty: 'junior',
      topic: 'Database Indexing',
      qAr: 'كيف تعمل الفهارس (Indexes) مثل B-Tree في محركات SQL وما هي تكلفتها على عمليات الكتابة؟',
      qEn: 'How do B-Tree indexes work in SQL engines, and what trade-offs exist on write operations?',
      modelAnswerAr: `الفهرس B-Tree ينظم البيانات في شجرة بحث متوازنة ذات تفرع متعدد، مما يقلل تعقيد البحث من مسح شامل O(N) Table Scan إلى O(log N).
التكلفة: كل عملية إضافة (INSERT) أو تعديل (UPDATE) تتطلب إعادة ترتيب شجرة الفهرس وتحديث صفحات الذاكرة، مما يستهلك وقتاً ومساحة تخزين إضافية. لذلك نضع الفهارس فقط على الأعمدة المستخدمة بكثرة في WHERE و JOIN.`,
      modelAnswerEn: `B-Tree structures allow logarithmic search by balancing sorted tree nodes. While drastically speeding up SELECT queries, they impose write overhead because every INSERT/UPDATE/DELETE requires updating all related index trees.`,
      interviewerTipsAr: 'وضح أن زيادة الفهارس بشكل عشوائي يضر بسرعة الـ INSERT في التطبيقات عالية الكثافة.',
      interviewerTipsEn: 'Explain that redundant indexes significantly degrade throughput of high-write workloads.'
    },
    {
      id: 'be-2',
      difficulty: 'mid',
      topic: 'API Security & Auth',
      qAr: 'ما هو الفرق بين Session-Based Authentication و Token-Based (JWT)، وكيف تمنع ثغرات XSS و CSRF؟',
      qEn: 'Session-Based vs JWT Auth, and how to defend against XSS and CSRF?',
      modelAnswerAr: `1. Sessions: تعتمد على الحالة (Stateful)، وتُحفظ الجلسة في الذاكرة (Redis) ويُرسل Session ID في Cookie.
2. JWT: عديمة الحالة (Stateless)، التوكن يحتوي على Claims مشفرة وموقعة برمجياً.
للحماية:
- منع XSS: تخزين الـ Refresh Token في Cookie محمية بـ HttpOnly + SameSite=Strict لمنع قراءتها عبر JavaScript.
- منع CSRF: استخدام CSRF Tokens أو التحقق من ترويسة Origin و SameSite Cookies.`,
      modelAnswerEn: `Sessions are server-stateful; JWTs are self-contained and stateless. Store sensitive tokens in httpOnly, SameSite=Lax/Strict cookies to mitigate XSS exposure, combined with anti-CSRF tokens for mutating actions.`,
      interviewerTipsAr: 'لا تقل أبداً أن تخزين التوكن في localStorage آمن للبيانات الحساسة.',
      interviewerTipsEn: 'Never recommend localStorage for storing sensitive auth tokens due to XSS vulnerability.'
    }
  ],
  fullstack: [
    {
      id: 'fs-1',
      difficulty: 'mid',
      topic: 'System Architecture',
      qAr: 'كيف تصمم بنية التخزين المؤقت (Caching Strategy) باستخدام Redis لموقع عالي الزيارات؟',
      qEn: 'How do you design a Redis caching strategy for a high-traffic web application?',
      modelAnswerAr: `1. نمط Cache-Aside: يبحث التطبيق في Redis أولاً (Cache Hit)، إذا لم يجد يقرأ من قاعدة البيانات (Cache Miss) ثم يملأ الـ Cache.
2. إدارة الصلاحية (TTL): تحديد زمن انتهاء صلاحية مناسب لمنع البيانات القديمة (Stale Data).
3. معالجة الـ Cache Invalidation: مسح المفتاح فور حدوث أي عملية تحديث أو حذف على السجل.
4. منع انهيار الكاش (Cache Avalanche): استخدام فترات TTL عشوائية قليلاً (Jitter) حتى لا تنتهي كل المفاتيح في نفس الثانية.`,
      modelAnswerEn: `Implement Cache-Aside with automated TTLs. Handle stampedes/avalanches with randomized expiration jitter and mutex locking for expensive cache misses. Invalidate cache on mutations.`,
      interviewerTipsAr: 'أظهر وعيك بمشاكل التخزين المؤقت الكلاسيكية: Cache Stampede و Cache Invalidation.',
      interviewerTipsEn: 'Demonstrate awareness of classic cache challenges: Stampede, Penetration, and Stale reads.'
    }
  ],
  mobile: [
    {
      id: 'mb-1',
      difficulty: 'junior',
      topic: 'Flutter Lifecycle',
      qAr: 'ما هي دورة حياة StatefulWidget في Flutter، وما دور build و dispose؟',
      qEn: 'Explain StatefulWidget lifecycle in Flutter, focusing on build() and dispose().',
      modelAnswerAr: `1. createState(): إنشاء كائن الـ State.
2. initState(): تهيئة المتحولات، وبدء المؤقتات والاشتراكات لمرة واحدة فقط.
3. didChangeDependencies(): تُستدعى عند تغير كائنات InheritedWidget المستمع إليها.
4. build(): بناء ودراسة شجرة الـ Widgets (تُستدعى كثيراً ويجب أن تكون سريعة وخالية من العمليات الثقيلة).
5. dispose(): التنظيف الحتمي للموارد، مثل إلغاء Controllers والـ StreamSubscriptions لتفادي تسريب الذاكرة (Memory Leaks).`,
      modelAnswerEn: `createState -> initState -> didChangeDependencies -> build -> dispose. Always cancel AnimationControllers, TextEditingControllers, and streams in dispose() to prevent memory leaks.`,
      interviewerTipsAr: 'التأكيد على تفريغ الـ Controllers في dispose هو علامة الاحتراف لدى المقابل.',
      interviewerTipsEn: 'Emphasizing controller and listener cancellation in dispose() proves production readiness.'
    }
  ]
}

export default function InterviewSimulator() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [activeTrack, setActiveTrack] = useState('frontend')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(180) // 3 mins mock answer timer
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Local storage mastered questions
  const [masteredIds, setMasteredIds] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_interview_mastered')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const currentQuestions = useMemo(() => {
    return QUESTIONS_BANK[activeTrack] || QUESTIONS_BANK.frontend
  }, [activeTrack])

  const currentQuestion = currentQuestions[currentIdx] || currentQuestions[0]

  const handleNext = () => {
    if (currentIdx < currentQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setShowAnswer(false)
      setTimerSeconds(180)
      setIsTimerRunning(false)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
      setShowAnswer(false)
      setTimerSeconds(180)
      setIsTimerRunning(false)
    }
  }

  const toggleMastered = (id) => {
    let updated
    if (masteredIds.includes(id)) {
      updated = masteredIds.filter((item) => item !== id)
      toast(isArabic ? 'تمت إزالة السؤال من قائمة المتقنة' : 'Removed from mastered list')
    } else {
      updated = [...masteredIds, id]
      toast.success(isArabic ? 'رائع! تم تسجيل إتقان السؤال في ملفك المهني' : 'Marked as mastered!')
    }
    setMasteredIds(updated)
    try {
      localStorage.setItem('al_azher_interview_mastered', JSON.stringify(updated))
    } catch {}
  }

  // Timer interval
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(180)
  }

  const isMastered = masteredIds.includes(currentQuestion?.id)

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-spatial-page">
      <div className="container-page max-w-5xl space-y-8">
        
        {/* Page Hero */}
        <PageHero
          variant="path"
          title={isArabic ? 'محاكي المقابلات التقنية والجاهزية لسوق العمل' : 'Tech Interview Prep & Career Simulator'}
          subtitle={
            isArabic
              ? 'تدرّب على أسئلة المقابلات الحقيقية لشركات التكنولوجيا العالمية — أسئلة تخصصية في هندسة البرمجيات، الواجهات، قواعد البيانات، وتصميم الأنظمة مع شروحات معايير التقييم.'
              : 'Master software engineering, architecture, and coding technical interviews with real company questions and rubric breakdowns.'
          }
        >
          {/* Readiness Gauge */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <div className="glass px-5 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold text-ink">
              <FiBriefcase className="text-royal-500 dark:text-cyan-400" size={16} />
              <span>{isArabic ? `الأسئلة المتقنة: ${masteredIds.length}` : `Mastered: ${masteredIds.length}`}</span>
            </div>
            <div className="glass px-5 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold text-ink">
              <FiAward className="text-amber-500" size={16} />
              <span>{isArabic ? 'مستوى الجاهزية المهنية: 88%' : 'Career Readiness: 88%'}</span>
            </div>
          </div>
        </PageHero>

        {/* Track Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => {
                setActiveTrack(track.id)
                setCurrentIdx(0)
                setShowAnswer(false)
                resetTimer()
              }}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTrack === track.id
                  ? `bg-gradient-to-r ${track.color} text-white shadow-lg`
                  : 'glass text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {isArabic ? track.nameAr : track.nameEn}
            </button>
          ))}
        </div>

        {/* Question Card Box */}
        {currentQuestion && (
          <div className="glass rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Top Bar: Difficulty, Topic, Timer, Bookmark */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase font-mono ${
                  currentQuestion.difficulty === 'junior'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                  {currentQuestion.topic}
                </span>
                <span className="text-xs text-slate-400">
                  {currentIdx + 1} / {currentQuestions.length}
                </span>
              </div>

              {/* Mock Response Timer */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-mono font-bold text-ink">
                  <FiClock size={14} className={timerSeconds < 30 ? 'text-rose-500 animate-pulse' : 'text-slate-400'} />
                  <span>{formatTimer(timerSeconds)}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleTimer}
                  className="p-2 rounded-xl glass hover:bg-black/5 text-ink text-xs transition"
                  title={isTimerRunning ? 'إيقاف مؤقت' : 'بدء المؤقت'}
                >
                  {isTimerRunning ? <FiPause size={14} /> : <FiPlay size={14} />}
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-2 rounded-xl glass hover:bg-black/10 text-slate-400 text-xs transition"
                  title="إعادة ضبط"
                >
                  <FiRotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleMastered(currentQuestion.id)}
                  className={`p-2 rounded-xl border transition ${
                    isMastered
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                      : 'glass border-white/10 text-slate-400 hover:text-ink'
                  }`}
                  title={isMastered ? 'تم إتقانه' : 'تمييز كمتقن'}
                >
                  <FiBookmark size={15} />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-2xl font-extrabold text-ink leading-snug">
                {isArabic ? currentQuestion.qAr : currentQuestion.qEn}
              </h2>
              {isArabic && (
                <p className="text-xs sm:text-sm text-slate-400 font-mono" dir="ltr">
                  {currentQuestion.qEn}
                </p>
              )}
            </div>

            {/* Reveal Model Answer Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAnswer(!showAnswer)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-royal-600 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-royal-500/25 transition flex items-center justify-center gap-2"
              >
                <FiZap size={16} />
                <span>
                  {showAnswer
                    ? (isArabic ? 'إخفاء الإجابة النموذجية' : 'Hide Model Answer')
                    : (isArabic ? 'كشف الإجابة النموذجية ومعايير المقابل' : 'Reveal Model Answer & Interviewer Rubric')}
                </span>
              </button>
            </div>

            {/* Model Answer Drawer */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-4 border-t border-black/5 dark:border-white/10"
                >
                  <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
                    <h4 className="text-xs font-extrabold text-royal-600 dark:text-cyan-400 uppercase tracking-wider">
                      {isArabic ? 'الإجابة النموذجية الموصى بها:' : 'Recommended Model Response:'}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-white/90 leading-relaxed whitespace-pre-line font-medium">
                      {isArabic ? currentQuestion.modelAnswerAr : currentQuestion.modelAnswerEn}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <FiAward size={14} />
                      <span>{isArabic ? 'ما يبحث عنه المقابل في إجابتك (Interviewer Rubric):' : 'Interviewer Evaluation Tips:'}</span>
                    </div>
                    <p className="leading-relaxed">
                      {isArabic ? currentQuestion.interviewerTipsAr : currentQuestion.interviewerTipsEn}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-ink disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <FiChevronRight size={16} />
                <span>{isArabic ? 'السؤال السابق' : 'Previous'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIdx === currentQuestions.length - 1}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-bold disabled:opacity-30 disabled:pointer-events-none shadow-md shadow-royal-600/25 transition"
              >
                <span>{isArabic ? 'السؤال التالي' : 'Next Question'}</span>
                <FiChevronLeft size={16} />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
