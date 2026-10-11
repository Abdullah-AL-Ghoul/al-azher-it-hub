/**
 * Academic Categories and Exam Classifications for Al-Azher IT Hub Sources Archive.
 */

export const SOURCE_CATEGORIES = [
  {
    id: 'all',
    labelAr: 'جميع المصادر',
    labelEn: 'All Sources',
    color: 'bg-black/5 dark:bg-white/5 border-line text-slate-700 dark:text-white/80',
  },
  {
    id: 'exams',
    labelAr: 'أرشيف الامتحانات',
    labelEn: 'Exams Archive',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
  },
  {
    id: 'summaries',
    labelAr: 'الملخصات والمذكرات',
    labelEn: 'Summaries & Notes',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  },
  {
    id: 'slides',
    labelAr: 'السلايدات والتفريغات',
    labelEn: 'Slides & Transcripts',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  },
  {
    id: 'references',
    labelAr: 'مراجع وكتب',
    labelEn: 'Textbooks & References',
    color: 'bg-royal-500/10 text-accent dark:text-cyan-400 border-royal-500/25',
  },
]

export const EXAM_SUB_TYPES = [
  { id: 'all_exams', labelAr: 'كل الامتحانات', labelEn: 'All Exams' },
  { id: 'midterm', labelAr: 'امتحانات نصفية (Midterm)', labelEn: 'Midterm Exams' },
  { id: 'final', labelAr: 'امتحانات نهائية (Final)', labelEn: 'Final Exams' },
  { id: 'quiz', labelAr: 'كويزات وأسئلة فصيلة', labelEn: 'Quizzes & Tests' },
]

/**
 * Intelligently classifies any source into an academic category based on
 * explicit metadata or title/filename semantic analysis.
 */
export function classifySource(source) {
  if (!source) return { category: 'references', examType: null, labelAr: 'مرجع عام', labelEn: 'General', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' }

  // 1. Explicit category if provided
  const explicit = source.category?.toLowerCase()
  if (explicit === 'midterm' || explicit === 'midterm_exam') {
    return {
      category: 'exams',
      examType: 'midterm',
      labelAr: 'امتحان نصفي 📝',
      labelEn: 'Midterm Exam',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    }
  }
  if (explicit === 'final' || explicit === 'final_exam') {
    return {
      category: 'exams',
      examType: 'final',
      labelAr: 'امتحان نهائي 🏆',
      labelEn: 'Final Exam',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    }
  }
  if (explicit === 'quiz') {
    return {
      category: 'exams',
      examType: 'quiz',
      labelAr: 'كويز / اختبار قصير ⏱️',
      labelEn: 'Quiz / Test',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    }
  }
  if (explicit === 'summary' || explicit === 'summaries') {
    return {
      category: 'summaries',
      examType: null,
      labelAr: 'ملخص دراسي 📑',
      labelEn: 'Study Summary',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    }
  }
  if (explicit === 'slides') {
    return {
      category: 'slides',
      examType: null,
      labelAr: 'سلايدات رسمية 📊',
      labelEn: 'Lecture Slides',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    }
  }

  // 2. Semantic text inference
  const text = `${source.titleAr || ''} ${source.titleEn || ''} ${source.fileName || ''} ${source.url || ''}`.toLowerCase()

  if (/نهائي|فاينل|final/i.test(text)) {
    return {
      category: 'exams',
      examType: 'final',
      labelAr: 'امتحان نهائي 🏆',
      labelEn: 'Final Exam',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    }
  }

  if (/نصفي|ميد|midterm|mid-term/i.test(text)) {
    return {
      category: 'exams',
      examType: 'midterm',
      labelAr: 'امتحان نصفي 📝',
      labelEn: 'Midterm Exam',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    }
  }

  if (/كويز|اختبار|واجب|quiz|test|exam|امتحان/i.test(text)) {
    return {
      category: 'exams',
      examType: 'quiz',
      labelAr: 'امتحان / كويز ⏱️',
      labelEn: 'Quiz / Exam',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    }
  }

  if (/ملخص|تلخيص|مذكرة|دفتر|summary|notes|note/i.test(text)) {
    return {
      category: 'summaries',
      examType: null,
      labelAr: 'ملخص دراسي 📑',
      labelEn: 'Study Summary',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    }
  }

  if (/سلايد|شرح|تفريغ|slides|slide|lecture|lectures/i.test(text)) {
    return {
      category: 'slides',
      examType: null,
      labelAr: 'سلايدات رسمية 📊',
      labelEn: 'Lecture Slides',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    }
  }

  return {
    category: 'references',
    examType: null,
    labelAr: 'مرجع / كتاب 📘',
    labelEn: 'Textbook / Reference',
    color: 'bg-royal-500/10 text-accent dark:text-cyan-400 border-royal-500/30',
  }
}
