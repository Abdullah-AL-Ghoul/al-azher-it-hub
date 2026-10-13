import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { 
  FiHeadphones, 
  FiLayers, 
  FiTerminal, 
  FiGitCommit, 
  FiTrendingUp, 
  FiCalendar, 
  FiHardDrive, 
  FiFileText, 
  FiArrowRight, 
  FiArrowLeft, 
  FiSearch, 
  FiCheckCircle,
  FiCode,
  FiAward,
  FiCheckSquare
} from 'react-icons/fi'
import PageHero from '../components/shared/PageHero'
import OfflineStudyPackModal from '../components/shared/OfflineStudyPackModal'

const CATEGORIES = [
  { id: 'all', labelAr: 'جميع الأدوات', labelEn: 'All Tools' },
  { id: 'study', labelAr: 'المذاكرة والاستيعاب', labelEn: 'Study & Learning' },
  { id: 'productivity', labelAr: 'الإنتاجية والتركيز', labelEn: 'Productivity & Focus' },
  { id: 'programming', labelAr: 'مراجع البرمجة', labelEn: 'Coding References' },
  { id: 'academic', labelAr: 'الخطة والأكاديميا', labelEn: 'Curriculum & GPA' },
  { id: 'offline', labelAr: 'الدراسة بدون إنترنت', labelEn: 'Offline Study' },
]

const TOOLS_CONFIG = [
  {
    id: 'focus',
    category: 'productivity',
    titleAr: 'غرفة التركيز الذكية ومؤقت بومودورو',
    titleEn: 'Smart Focus Room & Pomodoro',
    descAr: 'جلسات تركيز بدون مشتتات مع مؤقت بومودورو (25/5/15) ومؤثرات صوتية اصطناعية طبيعية (مطر، بحر، مكتبة) تعمل عبر المتصفح بدون استهلاك إنترنت.',
    descEn: 'Distraction-free Pomodoro study timer with pure synthetic ambient soundscapes (rain, waves, library) running locally with zero bandwidth.',
    icon: FiHeadphones,
    color: 'from-blue-600 to-cyan-500',
    badgeAr: 'جديد • صوت اصطناعي',
    badgeEn: 'New • Pure Audio API',
    to: '/focus',
    actionTextAr: 'دخول غرفة التركيز',
    actionTextEn: 'Enter Focus Room',
    featuresAr: ['مؤقت 25/5/15', 'أصوات طبيعية بدون إنترنت', 'ربط بالمساق الأكاديمي', 'وضع الشاشة الكاملة Zen'],
    featuresEn: ['25/5/15 Timer', 'Zero-bandwidth soundscapes', 'Course linkage', 'Fullscreen Zen mode'],
  },
  {
    id: 'flashcards',
    category: 'study',
    titleAr: 'بطاقات المذاكرة والتكرار المتباعد',
    titleEn: 'Spaced Repetition Flashcards',
    descAr: 'نظام بطاقات تفاعلي ثلاثي الأبعاد 3D مبني على خوارزمية Leitner لترسيخ مفاهيم الخوارزميات، نظم التشغيل، والشبكات مع إمكانية إضافة بطاقات مخصصة.',
    descEn: '3D perspective interactive flashcards powered by the Leitner spaced repetition system for core CS & IT courses, with custom card creation.',
    icon: FiLayers,
    color: 'from-violet-600 to-indigo-500',
    badgeAr: 'تكرار متباعد 3D',
    badgeEn: '3D Leitner System',
    to: '/flashcards',
    actionTextAr: 'بدء مراجعة البطاقات',
    actionTextEn: 'Start Reviewing',
    featuresAr: ['تقليب ثلاثي الأبعاد', 'بنوك أسئلة ITCS', 'تصنيف الإتقان الثلاثي', 'إضافة بطاقات خاصة'],
    featuresEn: ['3D flip physics', 'Preloaded IT decks', '3-level mastery buckets', 'Custom card creation'],
  },
  {
    id: 'cheatsheets',
    category: 'programming',
    titleAr: 'خزينة الأكواد والمراجع السريعة',
    titleEn: 'IT Syntax & Cheatsheets Vault',
    descAr: 'مرجع سريع وشامل لأهم أوامر Git، سطر أوامر Linux، استعلامات SQL، ومخطط تعقيد الخوارزميات Big-O مع ميزة النسخ الفوري بنقرة واحدة.',
    descEn: 'Curated quick-reference vault for Git workflows, Linux terminal, SQL database syntax, and Big-O algorithm complexities with one-click copying.',
    icon: FiTerminal,
    color: 'from-amber-600 to-orange-500',
    badgeAr: 'نسخ فوري بنقرة واحدة',
    badgeEn: 'Instant Quick Copy',
    to: '/cheatsheets',
    actionTextAr: 'فتح خزينة الأكواد',
    actionTextEn: 'Open Cheatsheets',
    featuresAr: ['أوامر Git الأساسية والمتقدمة', 'أوامر سطر أوامر Linux', 'استعلامات SQL و JOINs', 'مخطط Big-O Time & Space'],
    featuresEn: ['Git commands & rebase', 'Linux terminal essentials', 'SQL & JOIN queries', 'Big-O complexity table'],
  },
  {
    id: 'roadmap-dag',
    category: 'academic',
    titleAr: 'شجرة المتطلبات السابقة للمساقات (DAG)',
    titleEn: 'Course Prerequisite DAG Tree',
    descAr: 'مخطط شجري توجيهي تفاعلي يربط كافة مساقات خطة تكنولوجيا المعلومات عبر السنوات الأربع، ويوضح سلاسل المتطلبات السابقة بنقرة زر.',
    descEn: 'Interactive directed acyclic graph (DAG) mapping out 4-year IT curriculum prerequisites with click-to-trace dependency paths and course details.',
    icon: FiGitCommit,
    color: 'from-emerald-600 to-teal-500',
    badgeAr: 'مخطط بياني تفاعلي',
    badgeEn: 'Interactive DAG Tree',
    to: '/roadmap',
    actionTextAr: 'استعراض شجرة المتطلبات',
    actionTextEn: 'Explore Prerequisite Tree',
    featuresAr: ['أعمدة السنوات الأربع', 'تتبع المتطلبات السابقة تفاعلياً', 'فحص تفاصيل المساق وساعاته', 'عرض الخطة الشجري والجدولي'],
    featuresEn: ['4-Year Columns', 'Interactive prerequisite tracing', 'Detailed course modal', 'DAG Tree & List switch'],
  },
  {
    id: 'gpa-predictor',
    category: 'academic',
    titleAr: 'حاسبة ومحلل المعدل التراكمي وتوقعات التخرج',
    titleEn: 'GPA Analytics & Target Predictor',
    descAr: 'حاسبة تفاعلية متقدمة لتحليل الساعات المتبقية وتوقع الدرجات المطلوبة في الفصول القادمة لتحقيق مرتبة الشرف ومعدل التخرج المستهدف.',
    descEn: 'Advanced academic calculator that analyzes completed hours, projects target GPAs, and predicts needed grades to graduate with honors.',
    icon: FiTrendingUp,
    color: 'from-pink-600 to-rose-500',
    badgeAr: 'توقع درجات التخرج',
    badgeEn: 'Graduation Predictor',
    to: '/study-plan?tab=gpa',
    actionTextAr: 'حساب وتوقع المعدل',
    actionTextEn: 'Calculate GPA',
    featuresAr: ['حساب المعدل التراكمي', 'توقع درجات الفصول القادمة', 'تحليل متطلبات التخرج', 'حساب مراتب الشرف'],
    featuresEn: ['Cumulative GPA engine', 'Target semester predictor', 'Degree audit breakdown', 'Honors tier projection'],
  },
  {
    id: 'weekly-schedule',
    category: 'productivity',
    titleAr: 'الجدول الدراسي الأسبوعي ومزامنة التقويم',
    titleEn: 'Weekly Schedule & Calendar Sync',
    descAr: 'منظم جدول المحاضرات الأسبوعي مع إمكانية تصديره بنقرة واحدة إلى تقويم الهاتف Google / Apple بصيغة .ics ومشاركته عبر واتساب.',
    descEn: 'Interactive weekly course schedule with one-click iCalendar (.ics) export for Google/Apple Calendar and WhatsApp schedule sharing.',
    icon: FiCalendar,
    color: 'from-cyan-600 to-blue-500',
    badgeAr: 'مزامنة iCalendar',
    badgeEn: 'iCal Sync & WhatsApp',
    to: '/study-plan?tab=schedule',
    actionTextAr: 'فتح الجدول الأسبوعي',
    actionTextEn: 'Open Weekly Schedule',
    featuresAr: ['جدول أسبوعي منظم', 'تصدير .ics للهواتف', 'مشاركة الجدول عبر واتساب', 'طباعة وتصدير التقويم'],
    featuresEn: ['Weekly grid layout', '.ics calendar file export', 'WhatsApp schedule share', 'Print & calendar export'],
  },
  {
    id: 'offline-pack',
    category: 'offline',
    titleAr: 'ملخص المذاكرة والعمل بدون إنترنت (PWA)',
    titleEn: 'Offline Study Summary & PWA',
    descAr: 'أداة محلية آمنة تتيح لك تصدير ملخص منظم لقراءة بياناتك وملاحظاتك أثناء انقطاع الإنترنت مع تقنية التخزين المؤقت.',
    descEn: 'Secure offline-first utility allowing read-only local export of student schedules, lecture notes, and study progress with zero network dependency.',
    icon: FiHardDrive,
    color: 'from-teal-600 to-emerald-500',
    badgeAr: 'تصدير آمن للقراءة فقط',
    badgeEn: 'Safe Read-Only Export',
    isModalAction: true,
    actionTextAr: 'تصدير ملخص المذاكرة',
    actionTextEn: 'Export Study Summary',
    featuresAr: ['تصدير دراسي آمن للقراءة فقط', 'حماية تامة لقاعدة البيانات', 'يعمل 100% بدون إنترنت', 'حفظ الملاحظات والجداول'],
    featuresEn: ['Safe read-only export', 'Full database protection', '100% offline-ready', 'Saves notes & schedules'],
  },
  {
    id: 'lecture-notes',
    category: 'study',
    titleAr: 'ملاحظات المحاضرات التفاعلية وتصدير Markdown',
    titleEn: 'Lecture Notes & Markdown Export',
    descAr: 'دوّن ملاحظاتك المرتبطة بالطابع الزمني لكل ثانية أثناء مشاهدة المحاضرات، وقم بتصديرها بنقرة واحدة كملف .md جاهز لـ Notion أو Obsidian.',
    descEn: 'Timestamped study notes synced to lecture video playheads with instant Markdown (.md) export ready for Notion, Obsidian, and VS Code.',
    icon: FiFileText,
    color: 'from-indigo-600 to-cyan-500',
    badgeAr: 'تصدير Notion & Obsidian',
    badgeEn: 'Markdown Export',
    to: '/lectures',
    actionTextAr: 'تصفح المحاضرات وتدوين الملاحظات',
    actionTextEn: 'Browse Lectures & Notes',
    featuresAr: ['ملاحظات مرتبطة بوقت الفيديو', 'تصدير ملف Markdown منسق', 'حفظ محلي تلقائي', 'قفز مباشر لثانية الملاحظة'],
    featuresEn: ['Timestamped video notes', 'Clean Markdown export', 'Auto-saved locally', 'Jump to video timecode'],
  },
  {
    id: 'code-playground',
    category: 'programming',
    titleAr: 'محرر ومختبر الأكواد السحابي (Playground)',
    titleEn: 'In-Browser Code Playground',
    descAr: 'محرر ومختبر تفاعلي لتجربة صفحات الويب (HTML/CSS/JS) ومحاكاة بايثون ومحرك SQL تفاعلي لقاعدة بيانات طلبة الكلية وقوالب C++ خوارزمية.',
    descEn: 'Real-time in-browser runner for Web (HTML/CSS/JS), Python simulation, SQL relational query engine, and C++ algorithm templates.',
    icon: FiCode,
    color: 'from-blue-600 to-indigo-600',
    badgeAr: 'تشغيل مباشر بالمتصفح',
    badgeEn: 'Zero-Install Runner',
    to: '/playground',
    actionTextAr: 'فتح مختبر الأكواد',
    actionTextEn: 'Launch Playground',
    featuresAr: ['معاينة حية فورية للويب', 'محرك استعلامات SQL تفاعلي', 'محاكاة بايثون بدون خادم', 'قوالب C++ للخوارزميات'],
    featuresEn: ['Live Web preview', 'Interactive SQL engine', 'Serverless Python simulation', 'C++ algorithm templates'],
  },
  {
    id: 'exam-simulator',
    category: 'study',
    titleAr: 'محاكي الاختبارات والامتحانات التفاعلية',
    titleEn: 'Exam & Quiz Simulator',
    descAr: 'محاكي اختبارات رسمي بمؤقت زمني وتصحيح تلقائي فوري للمساقات التخصصية مع بنوك أسئلة وتحليل نقاط القوة والضعف.',
    descEn: 'Timed exam simulator and practice mode for core CS & IT courses with instant grading, score cards, and detailed solution explanations.',
    icon: FiCheckSquare,
    color: 'from-emerald-600 to-cyan-600',
    badgeAr: 'مؤقت وتصحيح فوري',
    badgeEn: 'Timed & Auto-Graded',
    to: '/quiz',
    actionTextAr: 'بدء محاكاة الاختبار',
    actionTextEn: 'Start Exam Simulator',
    featuresAr: ['وضع اختبار مؤقت 15 دقيقة', 'وضع التدريب الفوري', 'تحليل شامل للدرجات', 'تغطية المساقات الأساسية'],
    featuresEn: ['15-min timed test mode', 'Instant practice mode', 'Detailed score breakdown', 'Core IT courses covered'],
  },
  {
    id: 'task-tracker',
    category: 'productivity',
    titleAr: 'منظم المهام والواجبات الأكاديمية والمزامنة',
    titleEn: 'Academic Task & Deliverables Tracker',
    descAr: 'إدارة وتسليم واجبات ومشاريع المساقات الجامعية مع شريط إنجاز ذكي، وتصدير التقويم بصيغة .ics، ومشاركة الواجبات عبر واتساب.',
    descEn: 'Manage assignments, labs, and capstone milestones with completion gauges, iCal calendar export, and WhatsApp sharing.',
    icon: FiCheckCircle,
    color: 'from-amber-600 to-rose-600',
    badgeAr: 'مزامنة .ics وواتساب',
    badgeEn: 'iCal & WhatsApp Sync',
    to: '/tasks',
    actionTextAr: 'فتح منظم المهام',
    actionTextEn: 'Open Task Tracker',
    featuresAr: ['مؤشر ونسبة إنجاز المهام', 'تصدير .ics لتقويم الهاتف', 'مشاركة الواجبات عبر واتساب', 'تصفية حسب الأولوية والمساق'],
    featuresEn: ['Progress gauge', 'iCal calendar export', 'WhatsApp task export', 'Priority & course filters'],
  },
  {
    id: 'graduation-showcase',
    category: 'academic',
    titleAr: 'معرض مشاريع التخرج والابتكار الأكاديمي',
    titleEn: 'Graduation Projects & Innovation Showcase',
    descAr: 'أرشيف مشاريع تخرج طلبة هندسة وتكنولوجيا المعلومات مع روابط المستودعات والمعاينة الحية وإمكانية تقديم مشروعك للاعتماد.',
    descEn: 'Showcase catalog of Al-Azher IT graduation projects across SE, CS, IS, and Multimedia with GitHub repos, demos, and capstone submissions.',
    icon: FiAward,
    color: 'from-purple-600 to-pink-600',
    badgeAr: 'أرشيف الكلية الرسمي',
    badgeEn: 'Official IT Showcase',
    to: '/projects',
    actionTextAr: 'استعراض المشاريع المعتمدة',
    actionTextEn: 'Explore Capstones',
    featuresAr: ['تصفية حسب تخصصات الكلية', 'روابط GitHub والمعاينة الحية', 'تفاصيل المشرف وفريق العمل', 'إمكانية إدراج مشروعك'],
    featuresEn: ['Major-specific filters', 'GitHub & demo links', 'Supervisor & team info', 'Submit new project proposal'],
  },
]

export default function ToolsHub() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOfflineModal, setShowOfflineModal] = useState(false)

  // Filter tools by category and search
  const filteredTools = useMemo(() => {
    return TOOLS_CONFIG.filter((tool) => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const title = (isArabic ? tool.titleAr : tool.titleEn).toLowerCase()
      const desc = (isArabic ? tool.descAr : tool.descEn).toLowerCase()
      const badge = (isArabic ? tool.badgeAr : tool.badgeEn).toLowerCase()
      const matchesSearch = title.includes(query) || desc.includes(query) || badge.includes(query)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery, isArabic])

  const ArrowIcon = isArabic ? FiArrowLeft : FiArrowRight

  return (
    <div className="min-h-screen pt-24 pb-20 bg-spatial-page">
      {/* Page Hero */}
      <PageHero
        variant="chips"
        title={isArabic ? 'مركز الأدوات الذكية والإنتاجية' : 'Student Tools & Innovation Hub'}
        subtitle={
          isArabic
            ? 'باقة متكاملة من الأدوات الدراسية التفاعلية، مصممة خصيصاً لطلاب تكنولوجيا المعلومات بجامعة الأزهر لدعم المذاكرة، التركيز، وتخطيط النجاح الأكاديمي.'
            : 'A comprehensive suite of interactive academic productivity tools, crafted for Al-Azhar IT students to enhance study focus, mastery, and curriculum navigation.'
        }
      />

      <div className="container-page space-y-8">
        {/* Search & Category Filter Bar */}
        <div className="glass rounded-3xl p-5 border border-line space-y-4">
          <div className="relative">
            <FiSearch className="absolute top-1/2 -translate-y-1/2 text-slate-400 start-4" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'ابحث في أدوات المنصة (بومودورو، بطاقات، أوامر، معدل، جدول...)' : 'Search study tools (Pomodoro, flashcards, cheatsheets, GPA, schedule...)'}
              className="w-full input-spatial rounded-2xl py-3.5 pe-4 ps-12 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-royal-500/30 transition text-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? 'btn-spatial text-white shadow-md'
                    : 'glass text-slate-600 dark:text-white/60 hover:text-ink'
                }`}
              >
                {isArabic ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Count & Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
            <span>{isArabic ? 'الأدوات المتاحة' : 'Available Tools'}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-royal-500/10 text-accent font-bold">
              {filteredTools.length} {isArabic ? 'أداة' : 'tools'}
            </span>
          </h2>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all') }}
              className="text-xs text-accent hover:underline font-medium"
            >
              {isArabic ? 'إعادة ضبط البحث' : 'Reset search'}
            </button>
          )}
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-line space-y-3">
            <FiSearch size={36} className="mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-ink">
              {isArabic ? 'لم يتم العثور على أدوات مطابقة' : 'No matching tools found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60 max-w-sm mx-auto">
              {isArabic
                ? 'جرب البحث بكلمات أخرى أو اختر تصنيف "جميع الأدوات" لاستعراض كل الميزات.'
                : 'Try different search keywords or switch back to "All Tools" tab.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredTools.map((tool, idx) => {
              const Icon = tool.icon
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="glass rounded-3xl p-6 border border-line flex flex-col justify-between hover:border-royal-500/40 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Subtle top glow */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${tool.color} opacity-80`} />

                  <div className="space-y-4">
                    {/* Header: Icon + Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                        <Icon size={26} />
                      </div>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-slate-600 dark:text-white/80 border border-black/5 dark:border-white/5">
                        {isArabic ? tool.badgeAr : tool.badgeEn}
                      </span>
                    </div>

                    {/* Titles & Description */}
                    <div>
                      <h3 className="text-lg font-extrabold text-ink group-hover:text-accent transition-colors">
                        {isArabic ? tool.titleAr : tool.titleEn}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-white/65 mt-2 leading-relaxed">
                        {isArabic ? tool.descAr : tool.descEn}
                      </p>
                    </div>

                    {/* Features checklist pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(isArabic ? tool.featuresAr : tool.featuresEn).map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70"
                        >
                          <FiCheckCircle size={11} className="text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 mt-4 border-t border-black/5 dark:border-white/5">
                    {tool.isModalAction ? (
                      <button
                        type="button"
                        onClick={() => setShowOfflineModal(true)}
                        className="w-full btn-spatial py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 group/btn shadow-md"
                      >
                        <span>{isArabic ? tool.actionTextAr : tool.actionTextEn}</span>
                        <ArrowIcon size={16} className="transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                      </button>
                    ) : (
                      <Link
                        to={tool.to}
                        className="w-full btn-spatial py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 group/btn shadow-md"
                      >
                        <span>{isArabic ? tool.actionTextAr : tool.actionTextEn}</span>
                        <ArrowIcon size={16} className="transition-transform group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Offline Study Pack Modal */}
      <OfflineStudyPackModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
      />
    </div>
  )
}
