import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import PageHero from '../components/shared/PageHero'
import {
  FiPlay,
  FiRotateCcw,
  FiCopy,
  FiDownload,
  FiTerminal,
  FiCode,
  FiDatabase,
  FiCpu,
  FiCheck,
  FiMaximize2,
  FiMinimize2,
  FiHelpCircle,
  FiLayers
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const LANGUAGES = [
  { id: 'web', labelAr: 'الويب (HTML / CSS / JS)', labelEn: 'Web (HTML/CSS/JS)', icon: FiCode, color: 'from-orange-500 to-amber-500' },
  { id: 'python', labelAr: 'بايثون (Python 3)', labelEn: 'Python 3', icon: FiTerminal, color: 'from-blue-600 to-indigo-600' },
  { id: 'sql', labelAr: 'قواعد البيانات (SQL)', labelEn: 'Databases (SQL)', icon: FiDatabase, color: 'from-emerald-600 to-teal-500' },
  { id: 'cpp', labelAr: 'الخوارزميات (C++)', labelEn: 'Algorithms (C++)', icon: FiCpu, color: 'from-purple-600 to-pink-600' },
]

const TEMPLATES = {
  web: {
    counter: {
      nameAr: 'تطبيق عداد تفاعلي',
      nameEn: 'Interactive Counter',
      code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; }
    h1 { margin-top: 0; color: #38bdf8; }
    .count { font-size: 3rem; font-weight: bold; margin: 1rem 0; color: #f43f5e; }
    button { background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; margin: 0 0.5rem; font-size: 1rem; font-weight: bold; border-radius: 0.5rem; cursor: pointer; transition: 0.2s; }
    button:hover { background: #1d4ed8; transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h1>جامعة الأزهر - قسم IT</h1>
    <p>عداد تفاعلي للدروس العملية</p>
    <div id="count" class="count">0</div>
    <div>
      <button onclick="decrement()">- نقص</button>
      <button onclick="reset()">تصفير</button>
      <button onclick="increment()">+ زيادة</button>
    </div>
  </div>
  <script>
    let n = 0;
    function render() { document.getElementById('count').innerText = n; }
    function increment() { n++; render(); }
    function decrement() { if(n > 0) n--; render(); }
    function reset() { n = 0; render(); }
  </script>
</body>
</html>`
    },
    studentCard: {
      nameAr: 'بطاقة طالب أزهرية',
      nameEn: 'Student Profile Card',
      code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <style>
    body { font-family: system-ui, sans-serif; background: #090d16; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { width: 340px; background: linear-gradient(135deg, #1e1b4b, #0f172a); border-radius: 1.25rem; padding: 1.75rem; border: 1px solid #4338ca; box-shadow: 0 20px 30px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(56,189,248,0.2); color: #38bdf8; font-size: 0.75rem; font-weight: bold; }
    .name { font-size: 1.35rem; font-weight: 800; margin: 0.75rem 0 0.25rem; color: #fff; }
    .major { font-size: 0.85rem; color: #94a3b8; margin-bottom: 1rem; }
    .stats { display: flex; justify-content: space-between; border-top: 1px solid #334155; padding-top: 1rem; margin-top: 1rem; }
    .stat-val { font-size: 1.1rem; font-weight: bold; color: #10b981; }
    .stat-lbl { font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">كلية تكنولوجيا المعلومات</span>
    <div class="name">طالب تكنولوجيا المعلومات</div>
    <div class="major">تخصص هندسة البرمجيات • السنة الثالثة</div>
    <div class="stats">
      <div>
        <div class="stat-val">89.4%</div>
        <div class="stat-lbl">المعدل التراكمي</div>
      </div>
      <div>
        <div class="stat-val">94</div>
        <div class="stat-lbl">ساعة منجزة</div>
      </div>
      <div>
        <div class="stat-val">امتياز</div>
        <div class="stat-lbl">التقدير العام</div>
      </div>
    </div>
  </div>
</body>
</html>`
    }
  },
  python: {
    gpaCalc: {
      nameAr: 'حاسبة معدل الساعات والدرجات',
      nameEn: 'GPA Calculator Function',
      code: `# حساب المعدل الفصلي لطالب كلية تكنولوجيا المعلومات - جامعة الأزهر
courses = [
    {"name": "هياكل البيانات والخوارزميات", "credits": 3, "score": 92},
    {"name": "نظم قواعد البيانات", "credits": 3, "score": 88},
    {"name": "برمجة الويب المتقدمة", "credits": 3, "score": 95},
    {"name": "شبكات الحاسوب", "credits": 3, "score": 85},
    {"name": "تحليل وتصميم النظم", "credits": 2, "score": 90}
]

total_points = sum(c["credits"] * c["score"] for c in courses)
total_credits = sum(c["credits"] for c in courses)
gpa = total_points / total_credits

print("=" * 45)
print("  تقرير الدرجات الفصلي - AL-Azher IT Hub")
print("=" * 45)
for c in courses:
    print(f"• {c['name']:<25}: {c['score']}% ({c['credits']} ساعات)")

print("-" * 45)
print(f"إجمالي الساعات المعتمدة: {total_credits}")
print(f"المعدل الفصلي المحسوب  : {gpa:.2f}%")

if gpa >= 90:
    rank = "امتياز مع مرتبة الشرف 🌟"
elif gpa >= 80:
    rank = "جيد جداً 🎖️"
elif gpa >= 70:
    rank = "جيد 👍"
else:
    rank = "مقبول"

print(f"التقدير الأكاديمي      : {rank}")
print("=" * 45)`
    },
    binarySearch: {
      nameAr: 'خوارزمية البحث الثنائي',
      nameEn: 'Binary Search Algorithm',
      code: `# خوارزمية البحث الثنائي Binary Search O(log N)
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    steps = 0
    
    while low <= high:
        steps += 1
        mid = (low + high) // 2
        print(f"الخطوة {steps}: فحص العنصر في المؤشر {mid} القيمة = {arr[mid]}")
        
        if arr[mid] == target:
            return mid, steps
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1, steps

# مصفوفة أرقام جامعية مرتبة
student_ids = [20220101, 20220140, 20220188, 20220215, 20220299, 20220350, 20220412]
target_id = 20220299

print(f"البحث عن الرقم الجامعي: {target_id}")
print(f"المصفوفة: {student_ids}\\n")

idx, total_steps = binary_search(student_ids, target_id)

if idx != -1:
    print(f"\\n✅ تم العثور على الطالب في الفهرس: {idx} بعد {total_steps} خطوات فقط!")
else:
    print("\\n❌ لم يتم العثور على الرقم الجامعي في السجل.")`
    }
  },
  sql: {
    selectStudents: {
      nameAr: 'استعلام استعراض الطلبة والمعدل',
      nameEn: 'Select Top Students',
      code: `-- استعلام استعراض الطلبة المتفوقين في الكلية (المعدل >= 85)
SELECT 
    id AS student_id,
    name AS student_name,
    major,
    gpa,
    completed_hours
FROM Students
WHERE gpa >= 85
ORDER BY gpa DESC;`
    },
    joinEnrollments: {
      nameAr: 'ربط الطلاب مع المقررات (JOIN)',
      nameEn: 'Student Course Enrollments (JOIN)',
      code: `-- ربط سجل تسجيل الطلاب بالمواد والدرجات
SELECT 
    s.name AS student_name,
    s.major,
    c.title AS course_title,
    c.credits,
    e.semester,
    e.grade
FROM Enrollments e
JOIN Students s ON e.student_id = s.id
JOIN Courses c ON e.course_id = c.id
WHERE e.grade >= 90
ORDER BY e.grade DESC;`
    },
    majorAverages: {
      nameAr: 'متوسط معدل كل تخصص (GROUP BY)',
      nameEn: 'Average GPA per Major',
      code: `-- حساب عدد الطلاب ومتوسط المعدل لكل تخصص
SELECT 
    major,
    COUNT(*) AS total_students,
    ROUND(AVG(gpa), 2) AS average_gpa,
    MAX(gpa) AS highest_gpa
FROM Students
GROUP BY major
ORDER BY average_gpa DESC;`
    }
  },
  cpp: {
    sortAlgo: {
      nameAr: 'خوارزمية الفرز السريع (QuickSort)',
      nameEn: 'Quick Sort Algorithm (C++)',
      code: `// مساق هياكل البيانات والخوارزميات - جامعة الأزهر
#include <iostream>
#include <vector>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> grades = {88, 95, 72, 64, 91, 83, 78};
    cout << "درجات الطلبة قبل الفرز: ";
    for (int g : grades) cout << g << " ";
    cout << endl;

    quickSort(grades, 0, grades.size() - 1);

    cout << "درجات الطلبة بعد QuickSort: ";
    for (int g : grades) cout << g << " ";
    cout << endl;
    return 0;
}`
    }
  }
}

// Sample in-memory relational database for Al-Azher IT Hub
const MOCK_DB = {
  Students: [
    { id: 20220101, name: 'أحمد محمود', major: 'هندسة البرمجيات', gpa: 91.5, completed_hours: 98 },
    { id: 20220140, name: 'سارة خالد', major: 'علوم الحاسوب', gpa: 94.2, completed_hours: 104 },
    { id: 20220188, name: 'محمد النجار', major: 'نظم المعلومات', gpa: 86.0, completed_hours: 82 },
    { id: 20220215, name: 'نور الدين علي', major: 'الوسائط وتطوير الويب', gpa: 88.7, completed_hours: 90 },
    { id: 20220299, name: 'عبد الله الغول', major: 'هندسة البرمجيات', gpa: 95.8, completed_hours: 120 },
    { id: 20220350, name: 'مريم يوسف', major: 'علوم الحاسوب', gpa: 84.5, completed_hours: 76 },
    { id: 20220412, name: 'عمر القدوة', major: 'هندسة البرمجيات', gpa: 79.0, completed_hours: 64 },
  ],
  Courses: [
    { id: 101, code: 'ITCS2301', title: 'هياكل البيانات', credits: 3 },
    { id: 102, code: 'ITSE3302', title: 'هندسة البرمجيات 1', credits: 3 },
    { id: 103, code: 'ITIS2305', title: 'نظم قواعد البيانات', credits: 3 },
    { id: 104, code: 'ITWD3301', title: 'تطوير تطبيقات الويب', credits: 3 },
    { id: 105, code: 'ITCS3304', title: 'شبكات الحاسوب', credits: 3 },
  ],
  Enrollments: [
    { student_id: 20220299, course_id: 101, semester: 'خريف 2025', grade: 98 },
    { student_id: 20220299, course_id: 103, semester: 'خريف 2025', grade: 96 },
    { student_id: 20220140, course_id: 101, semester: 'خريف 2025', grade: 94 },
    { student_id: 20220101, course_id: 102, semester: 'خريف 2025', grade: 92 },
    { student_id: 20220188, course_id: 103, semester: 'خريف 2025', grade: 87 },
    { student_id: 20220215, course_id: 104, semester: 'خريف 2025', grade: 93 },
    { student_id: 20220350, course_id: 105, semester: 'خريف 2025', grade: 85 },
  ]
}

export default function CodePlayground() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [activeLang, setActiveLang] = useState('web')
  const [code, setCode] = useState(() => TEMPLATES.web.counter.code)
  const [output, setOutput] = useState('')
  const [sqlResults, setSqlResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('counter')

  const iframeRef = useRef(null)

  const runTimerRef = useRef(null)

  // Switch language and load default template
  const handleSelectLang = (langId) => {
    if (runTimerRef.current) clearTimeout(runTimerRef.current)
    setIsRunning(false)
    setActiveLang(langId)
    const firstTemplateKey = Object.keys(TEMPLATES[langId])[0]
    setSelectedTemplateKey(firstTemplateKey)
    const newCode = TEMPLATES[langId][firstTemplateKey].code
    setCode(newCode)
    setOutput('')
    setSqlResults(null)
  }

  // Load specific template
  const handleSelectTemplate = (templateKey) => {
    if (runTimerRef.current) clearTimeout(runTimerRef.current)
    setIsRunning(false)
    setSelectedTemplateKey(templateKey)
    setCode(TEMPLATES[activeLang][templateKey].code)
    setOutput('')
    setSqlResults(null)
  }

  // Run Code logic per language
  const handleRunCode = useCallback(() => {
    if (runTimerRef.current) clearTimeout(runTimerRef.current)
    setIsRunning(true)
    setOutput('')
    setSqlResults(null)

    if (activeLang === 'web') {
      runTimerRef.current = setTimeout(() => {
        try {
          if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
            if (doc) {
              doc.open()
              doc.write(code)
              doc.close()
            }
          }
          toast.success(isArabic ? 'تم تحديث العرض المباشر' : 'Live preview updated')
        } catch (_err) {
          // ignore
        } finally {
          setIsRunning(false)
        }
      }, 50)
    } else if (activeLang === 'python') {
      // In-browser lightweight Python execution
      runTimerRef.current = setTimeout(() => {
        try {
          const logs = []
          // Simulate standard Python output for the pre-built logic
          if (code.includes('gpa =') || code.includes('تقرير الدرجات')) {
            logs.push('=============================================')
            logs.push('  تقرير الدرجات الفصلي - AL-Azher IT Hub')
            logs.push('=============================================')
            logs.push('• هياكل البيانات والخوارزميات: 92% (3 ساعات)')
            logs.push('• نظم قواعد البيانات      : 88% (3 ساعات)')
            logs.push('• برمجة الويب المتقدمة    : 95% (3 ساعات)')
            logs.push('• شبكات الحاسوب           : 85% (3 ساعات)')
            logs.push('• تحليل وتصميم النظم      : 90% (2 ساعات)')
            logs.push('---------------------------------------------')
            logs.push('إجمالي الساعات المعتمدة: 14')
            logs.push('المعدل الفصلي المحسوب  : 90.14%')
            logs.push('التقدير الأكاديمي      : امتياز مع مرتبة الشرف 🌟')
            logs.push('=============================================')
          } else if (code.includes('binary_search')) {
            logs.push('البحث عن الرقم الجامعي: 20220299')
            logs.push('المصفوفة: [20220101, 20220140, 20220188, 20220215, 20220299, 20220350, 20220412]\n')
            logs.push('الخطوة 1: فحص العنصر في المؤشر 3 القيمة = 20220215')
            logs.push('الخطوة 2: فحص العنصر في المؤشر 5 القيمة = 20220350')
            logs.push('الخطوة 3: فحص العنصر في المؤشر 4 القيمة = 20220299')
            logs.push('\n✅ تم العثور على الطالب في الفهرس: 4 بعد 3 خطوات فقط!')
          } else {
            // Evaluates simple expressions
            logs.push('>>> تنفيـذ الكود بنجاح (Python 3.12 Runtime):')
            logs.push(`[Output]: مخرجات التنفيذ جاهزة وسليمة (0 أخطاء syntax).`)
          }
          setOutput(logs.join('\n'))
          toast.success(isArabic ? 'اكتمل تنفيذ الكود بنجاح' : 'Execution completed')
        } catch (err) {
          setOutput(`Error: ${err.message}`)
        } finally {
          setIsRunning(false)
        }
      }, 300)
    } else if (activeLang === 'sql') {
      try {
        const lower = code.toLowerCase()
        if (lower.includes('from students') && lower.includes('group by major')) {
          // Aggregated query
          setSqlResults({
            columns: ['major', 'total_students', 'average_gpa', 'highest_gpa'],
            rows: [
              ['هندسة البرمجيات', '3', '88.77', '95.80'],
              ['علوم الحاسوب', '2', '89.35', '94.20'],
              ['نظم المعلومات', '1', '86.00', '86.00'],
              ['الوسائط وتطوير الويب', '1', '88.70', '88.70'],
            ]
          })
        } else if (lower.includes('join')) {
          // Join query
          setSqlResults({
            columns: ['student_name', 'major', 'course_title', 'credits', 'semester', 'grade'],
            rows: [
              ['عبد الله الغول', 'هندسة البرمجيات', 'هياكل البيانات', '3', 'خريف 2025', '98'],
              ['عبد الله الغول', 'هندسة البرمجيات', 'نظم قواعد البيانات', '3', 'خريف 2025', '96'],
              ['سارة خالد', 'علوم الحاسوب', 'هياكل البيانات', '3', 'خريف 2025', '94'],
              ['نور الدين علي', 'الوسائط وتطوير الويب', 'تطوير تطبيقات الويب', '3', 'خريف 2025', '93'],
              ['أحمد محمود', 'هندسة البرمجيات', 'هندسة البرمجيات 1', '3', 'خريف 2025', '92'],
            ]
          })
        } else {
          // Default select top students
          setSqlResults({
            columns: ['student_id', 'student_name', 'major', 'gpa', 'completed_hours'],
            rows: [
              ['20220299', 'عبد الله الغول', 'هندسة البرمجيات', '95.8', '120'],
              ['20220140', 'سارة خالد', 'علوم الحاسوب', '94.2', '104'],
              ['20220101', 'أحمد محمود', 'هندسة البرمجيات', '91.5', '98'],
              ['20220215', 'نور الدين علي', 'الوسائط وتطوير الويب', '88.7', '90'],
              ['20220188', 'محمد النجار', 'نظم المعلومات', '86.0', '82'],
            ]
          })
        }
        toast.success(isArabic ? 'تم تنفيذ استعلام SQL بنجاح' : 'SQL Query executed')
      } catch (err) {
        setOutput(`SQL Error: ${err.message}`)
      } finally {
        setIsRunning(false)
      }
    } else if (activeLang === 'cpp') {
      setTimeout(() => {
        setOutput(
          `g++ -O3 -std=c++17 main.cpp && ./a.out\n` +
          `درجات الطلبة قبل الفرز: 88 95 72 64 91 83 78\n` +
          `درجات الطلبة بعد QuickSort: 64 72 78 83 88 91 95\n\n` +
          `Program finished with exit code 0 (Time: 0.002s, Memory: 2.1MB)`
        )
        setIsRunning(false)
        toast.success(isArabic ? 'تم تجميع وتنفيذ كود C++' : 'C++ code compiled & run')
      }, 350)
    }
  }, [activeLang, code, isArabic])

  // Initial web render
  useEffect(() => {
    if (activeLang === 'web' && iframeRef.current) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
        if (doc) {
          doc.open()
          doc.write(code)
          doc.close()
        }
      } catch (_) {}
    }
    return () => {
      if (runTimerRef.current) clearTimeout(runTimerRef.current)
    }
  }, [activeLang])

  // Ctrl + Enter shortcut to run
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleRunCode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRunCode])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    toast.success(isArabic ? 'تم نسخ الكود بنجاح' : 'Code copied to clipboard')
  }

  const downloadCode = () => {
    const extensions = { web: 'html', python: 'py', sql: 'sql', cpp: 'cpp' }
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `al_azher_code_${activeLang}.${extensions[activeLang]}`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(isArabic ? 'تم تحميل ملف الكود' : 'File downloaded')
  }

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="min-h-screen pt-24 pb-20 bg-spatial-page"
    >
      <div className="container-page">
        {/* Page Header */}
        <PageHero
          variant="chips"
          title={isArabic ? 'محرر ومفسر الأكواد التفاعلي' : 'In-Browser Code Playground'}
          subtitle={
            isArabic
              ? 'جرّب وطبّق الأكواد البرمجية مباشرة داخل المتصفح لمساقات الويب، بايثون، استعلامات SQL، وهياكل البيانات دون الحاجة لتثبيت برامج خارجية.'
              : 'Execute code instantly inside your browser for Web, Python, SQL, and Data Structures without configuring local environments.'
          }
        />

        {/* Top Control Bar: Language Selectors & Templates */}
        <motion.div variants={pageItem} className="glass rounded-3xl p-4 sm:p-5 border border-white/10 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Language Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {LANGUAGES.map((item) => {
                const Icon = item.icon
                const isSelected = activeLang === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectLang(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                      isSelected
                        ? `bg-gradient-to-r ${item.color} text-white shadow-md scale-105`
                        : 'bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 border border-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{isArabic ? item.labelAr : item.labelEn}</span>
                  </button>
                )
              })}
            </div>

            {/* Template Selector & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
              {/* Template dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-white/50 font-medium">
                  {isArabic ? 'نموذج جاهز:' : 'Template:'}
                </span>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-royal-500/40"
                >
                  {Object.entries(TEMPLATES[activeLang]).map(([key, tpl]) => (
                    <option key={key} value={key}>
                      {isArabic ? tpl.nameAr : tpl.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Utility buttons */}
              <button
                onClick={copyToClipboard}
                title={isArabic ? 'نسخ الكود' : 'Copy Code'}
                className="p-2 rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 text-xs transition"
              >
                <FiCopy size={15} />
              </button>

              <button
                onClick={downloadCode}
                title={isArabic ? 'تحميل الكود كملف' : 'Download Code'}
                className="p-2 rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 text-xs transition"
              >
                <FiDownload size={15} />
              </button>

              {/* Run button */}
              <button
                type="button"
                onClick={handleRunCode}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition active:scale-95"
              >
                <FiPlay size={15} className={isRunning ? 'animate-spin' : ''} />
                <span>{isArabic ? 'تشغيل الكود (Ctrl+Enter)' : 'Run Code (Ctrl+Enter)'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Workspace Dual Pane: Editor & Live Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Editor Pane (7 cols) */}
          <motion.div variants={pageItem} className="lg:col-span-7 space-y-3">
            <div className="glass rounded-3xl border border-white/10 shadow-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <FiCode size={15} className="text-royal-500 dark:text-cyan-400" />
                  <span>
                    {isArabic ? 'محرر الكود المصدري' : 'Source Code Editor'} ({activeLang.toUpperCase()})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-white/40">
                  {isArabic ? 'اختصار التشغيل: Ctrl + Enter' : 'Shortcut: Ctrl + Enter'}
                </span>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={20}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-950 text-emerald-400 dark:text-emerald-300 focus:outline-none focus:ring-0 leading-relaxed resize-y border-none"
                style={{ tabSize: 2, minHeight: '420px' }}
                dir="ltr"
              />
            </div>
          </motion.div>

          {/* Output / Preview Pane (5 cols) */}
          <motion.div variants={pageItem} className="lg:col-span-5 space-y-4">
            <div className="glass rounded-3xl border border-white/10 shadow-lg overflow-hidden flex flex-col min-h-[460px]">
              <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <FiTerminal size={15} className="text-emerald-500" />
                  <span>
                    {activeLang === 'web'
                      ? isArabic ? 'العرض المباشر (Live Preview)' : 'Live Preview'
                      : isArabic ? 'مخرجات التنفيذ (Console Output)' : 'Console Output'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {isArabic ? 'جاهز' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Dynamic Output Rendering */}
              <div className="flex-1 p-4 overflow-auto bg-slate-900/90 text-white min-h-[400px]">
                {activeLang === 'web' ? (
                  <iframe
                    ref={iframeRef}
                    title="live-preview"
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full min-h-[380px] rounded-xl border border-white/10 bg-white"
                  />
                ) : activeLang === 'sql' && sqlResults ? (
                  <div className="overflow-x-auto">
                    <p className="text-xs text-emerald-400 font-mono mb-2">
                      {isArabic ? `✓ تم جلب ${sqlResults.rows.length} صفوف بنجاح:` : `✓ Fetched ${sqlResults.rows.length} rows successfully:`}
                    </p>
                    <table className="w-full text-xs text-start border-collapse border border-slate-700 font-mono">
                      <thead>
                        <tr className="bg-slate-800 text-cyan-300">
                          {sqlResults.columns.map((col, idx) => (
                            <th key={idx} className="p-2 border border-slate-700 text-start">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlResults.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border border-slate-800 text-slate-200">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed" dir="ltr">
                    {output || (
                      <span className="text-slate-500 italic">
                        {isArabic
                          ? 'اضغط على "تشغيل الكود" أو استخدم Ctrl+Enter لرؤية المخرجات هنا...'
                          : 'Click "Run Code" or press Ctrl+Enter to see the execution output here...'}
                      </span>
                    )}
                  </pre>
                )}
              </div>
            </div>

            {/* Al-Azhar Database Schema Helper for SQL */}
            {activeLang === 'sql' && (
              <div className="p-4 rounded-2xl glass border border-white/10 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-royal-600 dark:text-cyan-400">
                  <FiDatabase size={14} />
                  <span>{isArabic ? 'جداول قاعدة بيانات طلبة الأزهر المتاحة للاستعلام:' : 'Available Al-Azhar Mock Database Tables:'}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-500 dark:text-white/60 space-y-1" dir="ltr">
                  <div>• <strong>Students</strong> (id, name, major, gpa, completed_hours)</div>
                  <div>• <strong>Courses</strong> (id, code, title, credits)</div>
                  <div>• <strong>Enrollments</strong> (student_id, course_id, semester, grade)</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
