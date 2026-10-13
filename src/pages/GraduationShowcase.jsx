import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import PageHero from '../components/shared/PageHero'
import { 
  FiAward, 
  FiGithub, 
  FiExternalLink, 
  FiSearch, 
  FiPlus, 
  FiUsers, 
  FiUserCheck, 
  FiTag, 
  FiX, 
  FiCheckCircle, 
  FiBookOpen, 
  FiStar,
  FiCode
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const TRACKS = [
  { id: 'all', labelAr: 'كافة التخصصات', labelEn: 'All Tracks' },
  { id: 'se', labelAr: 'هندسة البرمجيات', labelEn: 'Software Engineering' },
  { id: 'cs', labelAr: 'علوم الحاسوب والذكاء الاصطناعي', labelEn: 'Computer Science & AI' },
  { id: 'is', labelAr: 'نظم المعلومات', labelEn: 'Information Systems' },
  { id: 'mm', labelAr: 'الوسائط المتعددة والويب', labelEn: 'Multimedia & Web' },
]

const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    track: 'cs',
    titleAr: 'نظام الفرز الطبي الذكي لمرضى العيادات الخارجية باستخدام الرؤية الحاسوبية',
    titleEn: 'AI-Powered Triage & Clinical Diagnostic Assistant via Computer Vision',
    year: '2024 - 2025',
    supervisor: 'د. أحمد النجار',
    supervisorEn: 'Dr. Ahmad Al-Najjar',
    team: ['عبد الله الغول', 'محمود خليل', 'إبراهيم صيام'],
    teamEn: ['Abdullah Al-Ghoul', 'Mahmoud Khalil', 'Ibrahim Siam'],
    awardAr: 'درع التميز البحثي بالكلية',
    awardEn: 'Faculty Research Award',
    descAr: 'نموذج هجين يجمع بين معالجة اللغة الطبيعية للغة العربية ورؤية الحاسوب لقراءة التقارير الإشعاعية وتصنيف الحالات الحرجة بموثوقية 94.6% لتسريع التدخل الطبي.',
    descEn: 'A hybrid clinical AI pipeline combining Arabic medical NLP and chest X-ray vision triage achieving 94.6% sensitivity for high-urgency cases.',
    tech: ['PyTorch', 'FastAPI', 'React', 'Docker', 'YOLOv8', 'PostgreSQL'],
    githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
    demoUrl: 'https://abdullah-portfolio26.vercel.app/',
  },
  {
    id: 'proj-2',
    track: 'se',
    titleAr: 'منصة التعلم الأكاديمي التكيفية لطلبة تكنولوجيا المعلومات (IT Hub)',
    titleEn: 'Adaptive Spatial Learning & Knowledge Hub for IT Undergraduates',
    year: '2025 - 2026',
    supervisor: 'د. رائد عكيلة',
    supervisorEn: 'Dr. Raed Okila',
    team: ['عبد الله الغول', 'فريق المطورين الطلاب'],
    teamEn: ['Abdullah Al-Ghoul', 'Student Core Team'],
    awardAr: 'مشروع العام للكلية 2025',
    awardEn: 'Faculty Project of the Year 2025',
    descAr: 'بيئة تعليمية شاملة ومفتوحة المصدر لطلبة كلية الهندسة وتكنولوجيا المعلومات تقدم محاكياً للاختبارات ومحرر أكواد محلياً وخزينة مراجع سحابية متوافقة مع الهواتف.',
    descEn: 'An open-source adaptive educational platform featuring real-time code execution, spaced repetition flashcards, and complete Al-Azher IT curriculum sync.',
    tech: ['React 18', 'Tailwind CSS', 'Vite', 'PWA', 'Framer Motion', 'Web Workers'],
    githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
    demoUrl: 'https://al-azher-it-hub.vercel.app',
  },
  {
    id: 'proj-3',
    track: 'is',
    titleAr: 'نظام إدارة سلاسل الإمداد وتوزيع الإغاثة الطارئة بنظام البلوكشين',
    titleEn: 'Decentralized Disaster Relief & Supply Chain Tracking Architecture',
    year: '2024 - 2025',
    supervisor: 'د. محمد مطر',
    supervisorEn: 'Dr. Mohammed Matar',
    team: ['سارة أبو شعبان', 'عمر الدحدوح', 'نور قاسم'],
    teamEn: ['Sara Abu Shaban', 'Omar Al-Dahdouh', 'Nour Qassem'],
    awardAr: 'أفضل دراسة جدوى رقمية',
    awardEn: 'Best Digital Enterprise Award',
    descAr: 'بنية موزعة لتوثيق وتتبع مسارات الشاحنات وتوزيع الحصص التموينية والمستلزمات الطبية في أوقات الطوارئ لمنع الهدر وضمان الشفافية بنسبة 100%.',
    descEn: 'A distributed ledger ledger verifying relief deliveries, transit checkpoints, and patient medicine quotas with full tamper-proof audit trails.',
    tech: ['Solidity', 'Next.js', 'Ethers.js', 'GraphQL', 'Tailwind'],
    githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
    demoUrl: 'https://abdullah-portfolio26.vercel.app/',
  },
  {
    id: 'proj-4',
    track: 'mm',
    titleAr: 'تطبيق الواقع المعزز (AR) للملاحة والتوجيه ثلاثي الأبعاد داخل الحرم الجامعي',
    titleEn: 'Immersive AR Campus Navigation & Interactive Spatial Floorplan',
    year: '2023 - 2024',
    supervisor: 'د. وسام عاشور',
    supervisorEn: 'Dr. Wesam Ashour',
    team: ['كريم حميد', 'دينا حلس', 'بلال الشرفا'],
    teamEn: ['Kareem Hmaid', 'Dina Helles', 'Belal Al-Shorafa'],
    awardAr: 'جائزة الابتكار التفاعلي',
    awardEn: 'Interactive UX Innovation Prize',
    descAr: 'تطبيق هاتف متنقل يتيح للطلبة الجدد والزائرين استكشاف مباني وقاعات ومختبرات الكلية عبر كاميرا الهاتف مع خطوط إرشادية وتنبيهات مواعيد المحاضرات.',
    descEn: 'An AR-powered mobile wayfinding client using spatial anchors to guide freshmen students to laboratories and lecture halls seamlessly.',
    tech: ['Unity', 'ARKit', 'Flutter', 'C#', 'Blender', 'Firebase'],
    githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
    demoUrl: 'https://abdullah-portfolio26.vercel.app/',
  },
  {
    id: 'proj-5',
    track: 'se',
    titleAr: 'محرك الاختبارات الآلي وفحص الشفرات البرمجية لمختبرات البرمجة (AutoGrader)',
    titleEn: 'Automated Code Sandbox & Continuous Assignment Grading Engine',
    year: '2024 - 2025',
    supervisor: 'د. إيهاب زقوت',
    supervisorEn: 'Dr. Ihab Zaqout',
    team: ['رامي المصري', 'أسامة حبيب', 'هديل الكرد'],
    teamEn: ['Rami Al-Masri', 'Osama Habib', 'Hadeel Al-Kurd'],
    awardAr: 'مرتبة الشرف الأولى',
    awardEn: 'First Class Honors',
    descAr: 'حاوية معزولة وآمنة (Docker Sandbox) تفحص حلول الطلاب البرمجية في لغات C++ و Java و Python وتقيس زمن التنفيذ واستهلاك الذاكرة مع كشف التشابه.',
    descEn: 'Sandboxed code execution runtime supporting automated unit tests, memory profiling, and AST-based similarity detection for programming courses.',
    tech: ['Golang', 'Docker API', 'React', 'Redis', 'PostgreSQL'],
    githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
    demoUrl: 'https://abdullah-portfolio26.vercel.app/',
  },
  {
    id: 'proj-6',
    track: 'cs',
    titleAr: 'مستكشف ومحلل شبكات التواصل ورصد الشائعات والأخبار المضللة بالذكاء الاصطناعي',
    titleEn: 'Graph Neural Network Framework for Arabic Misinformation Detection',
    year: '2024 - 2025',
    supervisor: 'د. نهى البيوك',
    supervisorEn: 'Dr. Noha Al-Bayouk',
    team: ['يوسف النجار', 'منى الشوا', 'طارق بكر'],
    teamEn: ['Yousef Al-Najjar', 'Mona Al-Shawa', 'Tariq Bakr'],
    awardAr: 'أفضل خوارزمية ذكاء اصطناعي',
    awardEn: 'Best AI Algorithm',
    descAr: 'خوارزمية تعتمد على الشبكات العصبية الرسومية (GNNs) لتتبع ديناميكيات انتشار المنشورات الإخبارية باللغة العربية وتحليل الثقة بالحقائق في الزمن الحقيقي.',
    descEn: 'Graph convolutional neural network architecture modeling rumor cascades and source veracity in Arabic news streams with real-time scoring.',
    tech: ['Python', 'PyTorch Geometric', 'NetworkX', 'Transformers', 'FastAPI'],
    githubUrl: 'https://github.com/Abdullah-AL-Ghoul',
    demoUrl: 'https://abdullah-portfolio26.vercel.app/',
  },
]

export default function GraduationShowcase() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [activeTrack, setActiveTrack] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)

  // Local storage project submissions
  const [customProjects, setCustomProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_student_projects')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Submit form state
  const [formData, setFormData] = useState({
    title: '',
    track: 'se',
    year: '2025 - 2026',
    supervisor: '',
    team: '',
    desc: '',
    tech: '',
    githubUrl: '',
    demoUrl: '',
  })

  const allProjects = useMemo(() => {
    return [...customProjects, ...DEFAULT_PROJECTS]
  }, [customProjects])

  const filteredProjects = useMemo(() => {
    return allProjects.filter((proj) => {
      const matchTrack = activeTrack === 'all' || proj.track === activeTrack
      if (!matchTrack) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const title = (isArabic ? proj.titleAr : proj.titleEn) || proj.titleAr || ''
      const supervisor = (isArabic ? proj.supervisor : proj.supervisorEn) || proj.supervisor || ''
      const team = (isArabic ? proj.team.join(' ') : proj.teamEn?.join(' ') || proj.team.join(' '))
      const tech = proj.tech.join(' ')

      return (
        title.toLowerCase().includes(q) ||
        supervisor.toLowerCase().includes(q) ||
        team.toLowerCase().includes(q) ||
        tech.toLowerCase().includes(q)
      )
    })
  }, [allProjects, activeTrack, searchQuery, isArabic])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.supervisor.trim() || !formData.desc.trim()) {
      toast.error(isArabic ? 'يرجى تعبئة الحقول الأساسية المطلوبة' : 'Please fill all required fields')
      return
    }

    const newProject = {
      id: `custom-${Date.now()}`,
      track: formData.track,
      titleAr: formData.title,
      titleEn: formData.title,
      year: formData.year,
      supervisor: formData.supervisor,
      supervisorEn: formData.supervisor,
      team: formData.team.split(',').map((s) => s.trim()).filter(Boolean),
      teamEn: formData.team.split(',').map((s) => s.trim()).filter(Boolean),
      awardAr: 'مقدم حديثاً • قيد الاعتماد الأكاديمي',
      awardEn: 'Submitted • Pending Academic Review',
      descAr: formData.desc,
      descEn: formData.desc,
      tech: formData.tech.split(',').map((s) => s.trim()).filter(Boolean),
      githubUrl: formData.githubUrl || 'https://github.com/Abdullah-AL-Ghoul',
      demoUrl: formData.demoUrl || 'https://abdullah-portfolio26.vercel.app/',
    }

    const updated = [newProject, ...customProjects]
    setCustomProjects(updated)
    try {
      localStorage.setItem('al_azher_student_projects', JSON.stringify(updated))
    } catch {
      // storage quota fallback
    }

    toast.success(isArabic ? 'تم إدراج مشروع التخرج بنجاح في المعرض الأكاديمي!' : 'Graduation project added to showcase!')
    setIsSubmitModalOpen(false)
    setFormData({
      title: '',
      track: 'se',
      year: '2025 - 2026',
      supervisor: '',
      team: '',
      desc: '',
      tech: '',
      githubUrl: '',
      demoUrl: '',
    })
  }

  return (
    <div className="min-h-screen py-10 pt-24">
      <div className="container-page max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <PageHero
          variant="chips"
          title={isArabic ? 'معرض مشاريع التخرج والابتكار الأكاديمي' : 'Graduation & Innovation Showcase'}
          subtitle={
            isArabic
              ? 'نافذة استعراض النتاج التقني لطلبة كلية الهندسة وتكنولوجيا المعلومات بجامعة الأزهر — أفكار هندسية، نماذج ذكاء اصطناعي، ومشاريع رائدة صنعت بأيدي خريجينا.'
              : 'The official digital archive of Al-Azher Faculty of IT capstone projects, engineering breakthroughs, and cutting-edge software solutions.'
          }
        >
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-royal-600 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-royal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FiPlus size={18} />
              <span>{isArabic ? 'أضف / اقترح مشروع تخرجك' : 'Submit Your Capstone Project'}</span>
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl glass text-xs font-semibold text-slate-600 dark:text-white/80 border border-white/10">
              <FiAward className="text-amber-500" size={16} />
              <span>{isArabic ? `${allProjects.length} مشروع مسجل ومعتمد` : `${allProjects.length} Verified Projects`}</span>
            </div>
          </div>
        </PageHero>

        {/* Filter & Search Bar */}
        <div className="glass rounded-3xl p-4 sm:p-6 border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search input */}
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث باسم المشروع، التقنية، الطالب، أو المشرف...' : 'Search by project, tech stack, student, or supervisor...'}
                className="w-full pr-11 pl-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-royal-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* Total Results */}
            <div className="text-xs text-slate-500 dark:text-white/60 font-medium self-end md:self-center">
              {isArabic 
                ? `عرض ${filteredProjects.length} من إجمالي ${allProjects.length} مشروع`
                : `Showing ${filteredProjects.length} of ${allProjects.length} projects`}
            </div>
          </div>

          {/* Track Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTrack(t.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  activeTrack === t.id
                    ? 'bg-royal-600 text-white shadow-md shadow-royal-600/30'
                    : 'glass text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {isArabic ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-royal-500/10 text-royal-500 flex items-center justify-center mx-auto">
              <FiBookOpen size={28} />
            </div>
            <h3 className="text-lg font-bold text-ink">
              {isArabic ? 'لم يتم العثور على مشاريع مطابقة للبحث' : 'No matching capstone projects found'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {isArabic
                ? 'جرّب البحث بكلمات عامة مثل React، الذكاء الاصطناعي، أو قم باختيار تخصص آخر.'
                : 'Try searching with generic terms like Python, Mobile, or select another faculty track.'}
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveTrack('all'); }}
              className="px-5 py-2 rounded-xl bg-royal-500 text-white text-xs font-bold"
            >
              {isArabic ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj, idx) => (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="glass rounded-3xl p-6 border border-white/10 hover:border-royal-500/30 transition-all flex flex-col justify-between group shadow-lg hover:shadow-2xl relative overflow-hidden"
              >
                {/* Track gradient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-royal-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />

                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-royal-500/10 text-royal-600 dark:text-cyan-400 border border-royal-500/20">
                      {proj.year}
                    </span>
                    {proj.awardAr && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <FiStar size={12} className="fill-amber-400" />
                        <span>{isArabic ? proj.awardAr : proj.awardEn}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-extrabold text-ink leading-snug line-clamp-2 group-hover:text-royal-500 transition-colors mb-2">
                    {isArabic ? proj.titleAr : proj.titleEn}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-3 leading-relaxed mb-4">
                    {isArabic ? proj.descAr : proj.descEn}
                  </p>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {proj.tech.slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white/80"
                      >
                        {t}
                      </span>
                    ))}
                    {proj.tech.length > 5 && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-slate-400">
                        +{proj.tech.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Info & Actions */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/70">
                      <FiUserCheck size={14} className="text-royal-500 shrink-0" />
                      <span className="text-slate-400 font-medium">{isArabic ? 'المشرف:' : 'Supervisor:'}</span>
                      <span className="font-bold text-ink">{isArabic ? proj.supervisor : proj.supervisorEn}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/70">
                      <FiUsers size={14} className="text-cyan-500 shrink-0" />
                      <span className="text-slate-400 font-medium">{isArabic ? 'الفريق:' : 'Team:'}</span>
                      <span className="font-semibold text-ink line-clamp-1">
                        {isArabic ? proj.team.join('، ') : (proj.teamEn ? proj.teamEn.join(', ') : proj.team.join(', '))}
                      </span>
                    </div>
                  </div>

                  {/* Button Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      className="flex-1 py-2 px-3 rounded-xl bg-royal-500/10 hover:bg-royal-500/20 text-royal-600 dark:text-cyan-400 text-xs font-bold text-center transition"
                    >
                      {isArabic ? 'تفاصيل المشروع' : 'View Summary'}
                    </button>
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl glass hover:bg-black/10 dark:hover:bg-white/20 text-slate-600 dark:text-white/80 transition"
                        title={isArabic ? 'مستودع GitHub' : 'GitHub Repo'}
                      >
                        <FiGithub size={16} />
                      </a>
                    )}
                    {proj.demoUrl && (
                      <a
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl glass hover:bg-black/10 dark:hover:bg-white/20 text-royal-500 transition"
                        title={isArabic ? 'معاينة حية للمشروع' : 'Live Demo'}
                      >
                        <FiExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Project Details Modal */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                      {selectedProject.year}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-ink mt-2 leading-tight">
                      {isArabic ? selectedProject.titleAr : selectedProject.titleEn}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="p-2 rounded-full glass hover:bg-black/10 text-slate-400 hover:text-ink transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {isArabic ? 'ملخص الفكرة والأهداف الأكاديمية' : 'Executive Abstract & Goals'}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-white/80 leading-relaxed">
                      {isArabic ? selectedProject.descAr : selectedProject.descEn}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5">
                    <div>
                      <div className="text-xs text-slate-400 font-medium mb-1">{isArabic ? 'المشرف الأكاديمي' : 'Supervisor'}</div>
                      <div className="font-extrabold text-sm text-ink">
                        {isArabic ? selectedProject.supervisor : selectedProject.supervisorEn}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium mb-1">{isArabic ? 'فريق العمل من الطلبة' : 'Student Team'}</div>
                      <div className="font-extrabold text-sm text-ink">
                        {isArabic ? selectedProject.team.join('، ') : selectedProject.teamEn?.join(', ') || selectedProject.team.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {isArabic ? 'حزمة التقنيات والمكتبات المستخدمة' : 'Tech Stack & Libraries'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tech.map((t) => (
                        <span key={t} className="px-3 py-1.5 rounded-xl bg-royal-500/10 text-royal-600 dark:text-cyan-400 font-bold text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-black/5 dark:border-white/10">
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-bold text-sm text-center transition flex items-center justify-center gap-2"
                    >
                      <FiExternalLink size={16} />
                      <span>{isArabic ? 'زيارة المعاينة الحية' : 'Open Live Demo'}</span>
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-5 rounded-xl glass hover:bg-black/10 dark:hover:bg-white/20 text-ink font-bold text-sm transition flex items-center gap-2"
                    >
                      <FiGithub size={16} />
                      <span>GitHub</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="py-3 px-5 rounded-xl glass hover:bg-black/10 text-xs font-bold"
                  >
                    {isArabic ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Submit Capstone Modal */}
        <AnimatePresence>
          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-extrabold text-ink">
                      {isArabic ? 'إدراج مشروع تخرج جديد' : 'Submit Graduation Project'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isArabic
                        ? 'شارك إنجازك الأكاديمي مع مجتمع طلبة الكلية ليظهر في الأرشيف الرسمي للدفعة.'
                        : 'Showcase your capstone work with fellow IT students in the faculty archive.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="p-2 rounded-full glass hover:bg-black/10 text-slate-400"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-bold text-ink mb-1">
                      {isArabic ? 'عنوان المشروع *' : 'Project Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={isArabic ? 'مثال: نظام إدارة العيادات بالذكاء الاصطناعي' : 'e.g. AI-driven Clinical Platform'}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        {isArabic ? 'المسار الأكاديمي' : 'Faculty Track'}
                      </label>
                      <select
                        value={formData.track}
                        onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                      >
                        <option value="se">{isArabic ? 'هندسة البرمجيات' : 'Software Engineering'}</option>
                        <option value="cs">{isArabic ? 'علوم الحاسوب والذكاء الاصطناعي' : 'Computer Science & AI'}</option>
                        <option value="is">{isArabic ? 'نظم المعلومات' : 'Information Systems'}</option>
                        <option value="mm">{isArabic ? 'الوسائط المتعددة والويب' : 'Multimedia & Web'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">
                        {isArabic ? 'السنة الدراسية' : 'Academic Year'}
                      </label>
                      <input
                        type="text"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        placeholder="2025 - 2026"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        {isArabic ? 'المشرف الأكاديمي *' : 'Supervisor *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.supervisor}
                        onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                        placeholder={isArabic ? 'د. فلان الفلاني' : 'Dr. Full Name'}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">
                        {isArabic ? 'فريق العمل (مفصول بفاصلة)' : 'Team Members (comma separated)'}
                      </label>
                      <input
                        type="text"
                        value={formData.team}
                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        placeholder={isArabic ? 'أحمد، محمود، خليل' : 'Name 1, Name 2'}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      {isArabic ? 'التقنيات المستخدمة (مفصولة بفاصلة)' : 'Tech Stack (comma separated)'}
                    </label>
                    <input
                      type="text"
                      value={formData.tech}
                      onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
                      placeholder="React, Node.js, Python, PostgreSQL"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">
                      {isArabic ? 'ملخص ووصف المشروع *' : 'Abstract & Summary *'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.desc}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      placeholder={isArabic ? 'شرح مختصر عن مشكلة المشروع، الحل التقني، والنتائج...' : 'Brief summary of problem, solution, and results...'}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-ink mb-1">
                        {isArabic ? 'رابط GitHub' : 'GitHub Link'}
                      </label>
                      <input
                        type="url"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">
                        {isArabic ? 'رابط المعاينة الحية (إن وجد)' : 'Live Demo Link (optional)'}
                      </label>
                      <input
                        type="url"
                        value={formData.demoUrl}
                        onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:ring-2 focus:ring-royal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl glass text-ink text-xs font-bold"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-bold shadow-md shadow-royal-600/30"
                    >
                      {isArabic ? 'حفظ وإدراج في المعرض' : 'Save & Publish'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
