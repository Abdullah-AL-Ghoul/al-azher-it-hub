import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import PageHero from '../components/shared/PageHero'
import {
  FiFileText,
  FiPrinter,
  FiDownload,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiRotateCcw,
  FiUser,
  FiCode,
  FiFolder,
  FiExternalLink,
  FiMail,
  FiPhone,
  FiGithub,
  FiLinkedin
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const DEFAULT_RESUME = {
  fullName: 'عبد الله طارق الغول',
  fullNameEn: 'Abdullah T. Al-Ghoul',
  title: 'مهندس برمجيات | مبرمج أنظمة ويب متكاملة (Full-Stack Engineer)',
  email: 'abdullah.dev@alazher.edu.ps',
  phone: '+970 59 123 4567',
  location: 'غزة، فلسطين',
  github: 'https://github.com/Abdullah-AL-Ghoul',
  portfolio: 'https://abdullah-portfolio26.vercel.app/',
  summary: 'طالب متميز في كلية الهندسة وتكنولوجيا المعلومات بجامعة الأزهر. متخصص في هندسة البرمجيات وبناء تطبيقات الويب عالية الأداء وقواعد البيانات الموزعة مع شغف بتطوير تجارب مستخدم تفاعلية.',
  education: {
    degree: 'بكالوريوس هندسة البرمجيات (B.Sc. Software Engineering)',
    institution: 'جامعة الأزهر - غزة، كلية تكنولوجيا المعلومات',
    gradYear: '2026',
    gpa: '92.4% (امتياز مع مرتبة الشرف)',
  },
  skills: {
    languages: 'JavaScript (ES6+), TypeScript, Python, C++, SQL, HTML5/CSS3',
    frameworks: 'React.js, Next.js, Node.js, Express, Tailwind CSS, Vite',
    databases: 'PostgreSQL, Supabase, MySQL, Redis, MongoDB',
    tools: 'Git, GitHub Actions, Docker, Linux, RESTful APIs, Postman, Vercel',
  },
  projects: [
    {
      title: 'منصة AL-Azher IT Hub الأكاديمية التفاعلية',
      tech: 'React 18, Tailwind CSS, Vite, Supabase, PWA, Vitest',
      points: [
        'بناء وهندسة منصة تعليمية وتفاعلية متكاملة تخدم أكثر من 1200+ طالب في كلية تكنولوجيا المعلومات.',
        'تطوير مشغل محاضرات تفاعلي مع استئناف ذكي وملاحظات مرتبطة بالوقت، ومحرر أكواد سحابي يعمل محلياً.',
        'تغطية اختبارات مؤتمتة عبر Playwright و Vitest مع اعتماد 100% لتجربة المستخدم والأمان.',
      ]
    },
    {
      title: 'نظام الفرز السريري الذكي بالرؤية الحاسوبية',
      tech: 'Python, PyTorch, FastAPI, Docker, YOLOv8, PostgreSQL',
      points: [
        'تصميم نموذج هجين يجمع بين معالجة اللغة الطبية ورؤية الحاسوب لتصنيف التقارير الإشعاعية.',
        'تحقيق نسبة دقة 94.6% في كشف الحالات الحرجة وتقليص وقت انتظار التدخل الطبي بنسبة 35%.',
      ]
    }
  ]
}

export default function ResumeBuilder() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_resume_draft')
      return saved ? JSON.parse(saved) : DEFAULT_RESUME
    } catch {
      return DEFAULT_RESUME
    }
  })

  const [newProject, setNewProject] = useState({ title: '', tech: '', point: '' })

  const handlePrint = () => {
    window.print()
  }

  const handleSaveDraft = () => {
    try {
      localStorage.setItem('al_azher_resume_draft', JSON.stringify(resumeData))
      toast.success(isArabic ? 'تم حفظ مسودة السيرة الذاتية بنجاح' : 'Resume draft saved locally')
    } catch {
      toast.error(isArabic ? 'تعذر الحفظ في المتصفح' : 'Could not save draft')
    }
  }

  const handleReset = () => {
    setResumeData(DEFAULT_RESUME)
    toast(isArabic ? 'تمت استعادة النموذج الافتراضي' : 'Restored sample template')
  }

  const handleAddProject = (e) => {
    e.preventDefault()
    if (!newProject.title.trim()) return
    const updated = {
      ...resumeData,
      projects: [
        ...resumeData.projects,
        {
          title: newProject.title,
          tech: newProject.tech,
          points: [newProject.point].filter(Boolean),
        }
      ]
    }
    setResumeData(updated)
    setNewProject({ title: '', tech: '', point: '' })
    toast.success(isArabic ? 'تمت إضافة المشروع للسيرة الذاتية' : 'Project added to resume')
  }

  const handleRemoveProject = (idx) => {
    const updated = {
      ...resumeData,
      projects: resumeData.projects.filter((_, i) => i !== idx),
    }
    setResumeData(updated)
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-spatial-page print:bg-white print:p-0 print:m-0">
      
      {/* Screen-only Hero Header */}
      <div className="container-page max-w-7xl print:hidden space-y-6">
        <PageHero
          variant="file"
          title={isArabic ? 'صانع السيرة الذاتية التقنية المعتمد (ATS Resume)' : 'ATS-Friendly IT Resume Builder'}
          subtitle={
            isArabic
              ? 'أنشئ سيرة ذاتية احترافية مصممة خصيصاً لشركات البرمجيات والتكنولوجيا وفق المعايير العالمية المعتمدة (Harvard Single-Column) مع تصدير مباشر إلى PDF.'
              : 'Create clean, ATS-compliant technical resumes formatted for top software engineering roles with one-click print and PDF export.'
          }
        >
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-royal-600 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-royal-500/25 transition active:scale-95"
            >
              <FiPrinter size={16} />
              <span>{isArabic ? 'طباعة وتصدير PDF معتمد' : 'Print / Export ATS PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-ink transition"
            >
              <FiDownload size={14} />
              <span>{isArabic ? 'حفظ المسودة' : 'Save Draft'}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl glass hover:bg-black/5 text-slate-400 text-xs transition"
              title="استعادة النموذج الجاهز"
            >
              <FiRotateCcw size={14} />
            </button>
          </div>
        </PageHero>

        {/* Dual Pane Layout: Form Editor (Left) & Real-time ATS Paper Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Editor Pane (5 cols) */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            
            {/* Personal Info Box */}
            <div className="glass rounded-3xl p-6 border border-white/10 shadow-lg space-y-4">
              <h3 className="text-sm font-extrabold text-ink flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                <FiUser className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'البيانات الشخصية والمهنية' : 'Contact & Profile'}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">{isArabic ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:outline-none focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">{isArabic ? 'المسمى المهني المستهدف' : 'Target Title'}</label>
                  <input
                    type="text"
                    value={resumeData.title}
                    onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink focus:outline-none focus:ring-1 focus:ring-royal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">{isArabic ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input
                      type="email"
                      value={resumeData.email}
                      onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">{isArabic ? 'الهاتف' : 'Phone'}</label>
                    <input
                      type="text"
                      value={resumeData.phone}
                      onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">GitHub / Portfolio Links</label>
                  <input
                    type="text"
                    value={resumeData.github}
                    onChange={(e) => setResumeData({ ...resumeData, github: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink text-[11px] mb-2"
                  />
                  <input
                    type="text"
                    value={resumeData.portfolio}
                    onChange={(e) => setResumeData({ ...resumeData, portfolio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">{isArabic ? 'النبذة المهنية (Executive Summary)' : 'Summary'}</label>
                  <textarea
                    rows={3}
                    value={resumeData.summary}
                    onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-ink text-[11px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Technical Skills Box */}
            <div className="glass rounded-3xl p-6 border border-white/10 shadow-lg space-y-4">
              <h3 className="text-sm font-extrabold text-ink flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                <FiCode className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'المهارات التقنية (Skills Matrix)' : 'Technical Skills'}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">لغات البرمجة (Languages)</label>
                  <input
                    type="text"
                    value={resumeData.skills.languages}
                    onChange={(e) => setResumeData({ ...resumeData, skills: { ...resumeData.skills, languages: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border text-ink text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">الأطر والمكتبات (Frameworks)</label>
                  <input
                    type="text"
                    value={resumeData.skills.frameworks}
                    onChange={(e) => setResumeData({ ...resumeData, skills: { ...resumeData.skills, frameworks: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border text-ink text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">قواعد البيانات (Databases & Cloud)</label>
                  <input
                    type="text"
                    value={resumeData.skills.databases}
                    onChange={(e) => setResumeData({ ...resumeData, skills: { ...resumeData.skills, databases: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border text-ink text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Add Project Form */}
            <div className="glass rounded-3xl p-6 border border-white/10 shadow-lg space-y-4">
              <h3 className="text-sm font-extrabold text-ink flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/10">
                <FiFolder className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'إضافة مشروع تقني للسيرة الذاتية' : 'Add Project'}</span>
              </h3>

              <form onSubmit={handleAddProject} className="space-y-3 text-xs">
                <input
                  type="text"
                  required
                  placeholder={isArabic ? 'عنوان المشروع' : 'Project Title'}
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border text-ink"
                />
                <input
                  type="text"
                  placeholder={isArabic ? 'التقنيات (React, Python, SQL...)' : 'Tech Stack'}
                  value={newProject.tech}
                  onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border text-ink"
                />
                <textarea
                  rows={2}
                  placeholder={isArabic ? 'إنجاز أو ميزة رئيسية في المشروع' : 'Key impact point or feature'}
                  value={newProject.point}
                  onChange={(e) => setNewProject({ ...newProject, point: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border text-ink resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-bold text-xs shadow-md transition"
                >
                  {isArabic ? 'إدراج المشروع في السيرة الذاتية' : 'Insert Project'}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: ATS Live Paper Preview (7 cols) */}
          <div className="lg:col-span-7 w-full flex justify-center">
            
            {/* The ATS Paper Sheet (White clean sheet format) */}
            <div
              id="resume-printable-sheet"
              className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:rounded-none font-serif leading-relaxed"
              dir="ltr"
            >
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-900 font-sans">
                  {resumeData.fullName}
                </h1>
                <p className="text-xs font-semibold text-slate-700 mt-1 font-sans">
                  {resumeData.title}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2 font-sans">
                  {resumeData.location && <span>{resumeData.location}</span>}
                  {resumeData.phone && <span>• {resumeData.phone}</span>}
                  {resumeData.email && <span>• {resumeData.email}</span>}
                  {resumeData.github && (
                    <a href={resumeData.github} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                      • GitHub
                    </a>
                  )}
                  {resumeData.portfolio && (
                    <a href={resumeData.portfolio} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                      • Portfolio
                    </a>
                  )}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans">
                    Professional Summary
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* Education */}
              <div className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans">
                  Education
                </h2>
                <div className="flex justify-between items-start text-xs font-sans">
                  <div>
                    <span className="font-extrabold text-slate-900">{resumeData.education.institution}</span>
                    <p className="text-slate-700 italic">{resumeData.education.degree}</p>
                  </div>
                  <div className="text-end text-[11px] text-slate-600">
                    <span>{resumeData.education.gradYear}</span>
                    <p className="font-semibold text-slate-800">{resumeData.education.gpa}</p>
                  </div>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans">
                  Technical Skills
                </h2>
                <div className="text-xs space-y-1 font-sans">
                  <div><strong className="text-slate-900">Languages:</strong> <span className="text-slate-700">{resumeData.skills.languages}</span></div>
                  <div><strong className="text-slate-900">Frameworks:</strong> <span className="text-slate-700">{resumeData.skills.frameworks}</span></div>
                  <div><strong className="text-slate-900">Databases & Cloud:</strong> <span className="text-slate-700">{resumeData.skills.databases}</span></div>
                  <div><strong className="text-slate-900">Tools:</strong> <span className="text-slate-700">{resumeData.skills.tools}</span></div>
                </div>
              </div>

              {/* Technical Projects */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans">
                  Key Technical Projects
                </h2>
                <div className="space-y-4">
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="relative group">
                      <div className="flex justify-between items-baseline font-sans text-xs">
                        <span className="font-extrabold text-slate-900">{proj.title}</span>
                        <span className="text-[11px] text-slate-600 font-mono italic">{proj.tech}</span>
                      </div>
                      <ul className="list-disc list-outside ms-4 mt-1 space-y-0.5 text-xs text-slate-700">
                        {proj.points.map((pt, pIdx) => (
                          <li key={pIdx} className="leading-relaxed">{pt}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(idx)}
                        className="absolute -end-6 top-0 text-rose-500 hover:text-rose-700 print:hidden opacity-0 group-hover:opacity-100 transition"
                        title="حذف المشروع"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
