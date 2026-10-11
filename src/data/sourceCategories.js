/**
 * Academic Categories and Exam Classifications for Al-Azher IT Hub Sources Archive.
 */
import { ACADEMIC_PLANS } from './academicCurriculum'

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

export const ACADEMIC_YEAR_FILTERS = [
  { id: 'all', labelAr: 'جميع السنوات', labelEn: 'All Years' },
  { id: '1', labelAr: 'السنة الأولى', labelEn: '1st Year' },
  { id: '2', labelAr: 'السنة الثانية', labelEn: '2nd Year' },
  { id: '3', labelAr: 'السنة الثالثة', labelEn: '3rd Year' },
  { id: '4', labelAr: 'السنة الرابعة', labelEn: '4th Year' },
]

function normalizeArabicText(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[-_()/\\.,[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Build indexed curriculum catalog for automatic year and course matching
const COURSE_CATALOG = []
try {
  ACADEMIC_PLANS.forEach(plan => {
    plan.curriculum.forEach(yr => {
      yr.semesters.forEach(sem => {
        sem.courses.forEach(c => {
          COURSE_CATALOG.push({
            code: c.code.trim().toUpperCase(),
            year: yr.year,
            semester: sem.semester,
            normNameAr: normalizeArabicText(c.nameAr),
            normNameEn: normalizeArabicText(c.nameEn),
          })
        })
      })
    })
  })
} catch {}

/**
 * Intelligently classifies any source into an academic category based on
 * explicit metadata or title/filename semantic analysis.
 */
export function classifySource(source) {
  if (!source) {
    return { 
      category: 'references', 
      examType: null, 
      labelAr: 'مرجع عام', 
      labelEn: 'General', 
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      hasSolution: false,
      examYear: null,
      academicYear: null,
      matchedCode: null
    }
  }

  const explicit = source.category?.toLowerCase()
  const rawText = `${source.titleAr || ''} ${source.titleEn || ''} ${source.subjectAr || ''} ${source.subjectEn || ''} ${source.fileName || ''} ${source.url || ''}`
  const textLower = rawText.toLowerCase()
  const normText = normalizeArabicText(rawText)

  // 1. Solution Key Detection (مع الحل / بدون حل)
  const hasSolution = /حل|حلول|اجاب|إجاب|نموذج مجاب|مجاب|solution|answers?|solved/i.test(textLower)

  // 2. Exam Year Detection (2018 - 2026)
  const yearMatch = rawText.match(/\b(201\d|202\d)\b/)
  const examYear = yearMatch ? yearMatch[1] : null

  // 3. Academic Year Detection (1, 2, 3, 4)
  let academicYear = source.academicYear ? Number(source.academicYear) : null
  let matchedCode = null

  if (!academicYear) {
    // A) Try matching course codes
    for (const item of COURSE_CATALOG) {
      if (textLower.includes(item.code.toLowerCase())) {
        academicYear = item.year
        matchedCode = item.code
        break
      }
    }
  }

  if (!academicYear) {
    // B) Try matching course names
    for (const item of COURSE_CATALOG) {
      if (item.normNameAr.length > 5 && normText.includes(item.normNameAr)) {
        academicYear = item.year
        matchedCode = item.code
        break
      }
      if (item.normNameEn.length > 5 && normText.includes(item.normNameEn)) {
        academicYear = item.year
        matchedCode = item.code
        break
      }
    }
  }

  if (!academicYear) {
    // C) Semantic year keywords
    if (/(?:ال)?سنه (?:ال)?اولي|المستوي الاول|level 1|1st year|year 1/i.test(normText)) {
      academicYear = 1
    } else if (/(?:ال)?سنه (?:ال)?ثانيه|المستوي الثاني|level 2|2nd year|year 2/i.test(normText)) {
      academicYear = 2
    } else if (/(?:ال)?سنه (?:ال)?ثالثه|المستوي الثالث|level 3|3rd year|year 3/i.test(normText)) {
      academicYear = 3
    } else if (/(?:ال)?سنه (?:ال)?رابعه|المستوي الرابع|level 4|4th year|year 4/i.test(normText)) {
      academicYear = 4
    }
  }

  // 4. Base Classification (Category + Exam Type)
  let base = null

  if (explicit === 'midterm' || explicit === 'midterm_exam') {
    base = {
      category: 'exams',
      examType: 'midterm',
      labelAr: 'امتحان نصفي 📝',
      labelEn: 'Midterm Exam',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    }
  } else if (explicit === 'final' || explicit === 'final_exam') {
    base = {
      category: 'exams',
      examType: 'final',
      labelAr: 'امتحان نهائي 🏆',
      labelEn: 'Final Exam',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    }
  } else if (explicit === 'quiz') {
    base = {
      category: 'exams',
      examType: 'quiz',
      labelAr: 'كويز / اختبار قصير ⏱️',
      labelEn: 'Quiz / Test',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    }
  } else if (explicit === 'summary' || explicit === 'summaries') {
    base = {
      category: 'summaries',
      examType: null,
      labelAr: 'ملخص دراسي 📑',
      labelEn: 'Study Summary',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    }
  } else if (explicit === 'slides') {
    base = {
      category: 'slides',
      examType: null,
      labelAr: 'سلايدات رسمية 📊',
      labelEn: 'Lecture Slides',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    }
  } else if (/نهائي|فاينل|final/i.test(textLower)) {
    base = {
      category: 'exams',
      examType: 'final',
      labelAr: 'امتحان نهائي 🏆',
      labelEn: 'Final Exam',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    }
  } else if (/نصفي|ميد|midterm|mid-term/i.test(textLower)) {
    base = {
      category: 'exams',
      examType: 'midterm',
      labelAr: 'امتحان نصفي 📝',
      labelEn: 'Midterm Exam',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    }
  } else if (/كويز|اختبار|واجب|quiz|test|exam|امتحان/i.test(textLower)) {
    base = {
      category: 'exams',
      examType: 'quiz',
      labelAr: 'امتحان / كويز ⏱️',
      labelEn: 'Quiz / Exam',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    }
  } else if (/ملخص|تلخيص|مذكرة|دفتر|summary|notes|note/i.test(textLower)) {
    base = {
      category: 'summaries',
      examType: null,
      labelAr: 'ملخص دراسي 📑',
      labelEn: 'Study Summary',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    }
  } else if (/سلايد|شرح|تفريغ|slides|slide|lecture|lectures/i.test(textLower)) {
    base = {
      category: 'slides',
      examType: null,
      labelAr: 'سلايدات رسمية 📊',
      labelEn: 'Lecture Slides',
      color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    }
  } else {
    base = {
      category: 'references',
      examType: null,
      labelAr: 'مرجع / كتاب 📘',
      labelEn: 'Textbook / Reference',
      color: 'bg-royal-500/10 text-accent dark:text-cyan-400 border-royal-500/30',
    }
  }

  return {
    ...base,
    hasSolution,
    examYear,
    academicYear,
    matchedCode,
  }
}
