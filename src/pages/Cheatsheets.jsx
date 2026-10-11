import { useState, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { 
  FiSearch, 
  FiCopy, 
  FiCheck, 
  FiTerminal, 
  FiGitBranch, 
  FiDatabase, 
  FiCpu, 
  FiCode, 
  FiX
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const CHEATSHEET_CATEGORIES = [
  { id: 'git', labelAr: 'أوامر Git & GitHub', labelEn: 'Git & GitHub', icon: FiGitBranch, color: 'text-amber-500' },
  { id: 'linux', labelAr: 'أوامر لينكس (Linux)', labelEn: 'Linux Terminal', icon: FiTerminal, color: 'text-emerald-500' },
  { id: 'sql', labelAr: 'قواعد بيانات SQL', labelEn: 'SQL & Database', icon: FiDatabase, color: 'text-sky-500' },
  { id: 'dsa', labelAr: 'تراكيب البيانات و Big-O', labelEn: 'Data Structures & Big-O', icon: FiCpu, color: 'text-violet-500' },
  { id: 'web', labelAr: 'تطوير الويب و React', labelEn: 'Web & React.js', icon: FiCode, color: 'text-cyan-500' },
]

const CHEATSHEET_DATA = [
  // --- GIT ---
  {
    category: 'git',
    titleAr: 'إنشاء واستنساخ المستودع',
    titleEn: 'Repository Initialization & Clone',
    descAr: 'البدء بمستودع محلي جديد أو استنساخ كود من GitHub.',
    descEn: 'Initialize a new repository or clone from remote.',
    snippets: [
      { cmd: 'git init', noteAr: 'تهيئة مستودع جديد في المجلد الحالي', noteEn: 'Initialize local repository' },
      { cmd: 'git clone https://github.com/user/repo.git', noteAr: 'استنساخ مشروع من الرابط', noteEn: 'Clone existing project' },
      { cmd: 'git status', noteAr: 'فحص حالة الملفات المعدلة وغير المتتبعة', noteEn: 'Show tracked & modified files' },
    ]
  },
  {
    category: 'git',
    titleAr: 'حفظ التعديلات ورفعها',
    titleEn: 'Staging, Committing & Pushing',
    descAr: 'تجهيز التغييرات وكتابة رسائل واضحة ورفعها للفرع الرئيسي.',
    descEn: 'Stage changes, write commits, and push upstream.',
    snippets: [
      { cmd: 'git add .', noteAr: 'إضافة كافة الملفات المعدلة لمنطقة التجهيز (Stage)', noteEn: 'Stage all modified files' },
      { cmd: 'git commit -m "feat: add user profile page"', noteAr: 'توثيق التعديل برسالة وصفية', noteEn: 'Commit changes with message' },
      { cmd: 'git push origin main', noteAr: 'رفع التعديلات للفرع الرئيسي', noteEn: 'Push commits to remote main' },
      { cmd: 'git pull --rebase origin main', noteAr: 'سحب أحدث تعديلات الزملاء ودمجها بنظافة', noteEn: 'Pull latest remote changes cleanly' },
    ]
  },
  {
    category: 'git',
    titleAr: 'الفروع والتراجع عن الأخطاء',
    titleEn: 'Branches & Undoing Mistakes',
    descAr: 'إنشاء فروع جديدة والتعامل مع التراجع بأمان.',
    descEn: 'Create branches, stash uncommitted work, and undo safely.',
    snippets: [
      { cmd: 'git checkout -b feature/auth-flow', noteAr: 'إنشاء فرع جديد والانتقال إليه', noteEn: 'Create & switch to new branch' },
      { cmd: 'git stash\ngit stash pop', noteAr: 'تخزين التعديلات المؤقتة جانباً واسترجاعها لاحقاً', noteEn: 'Stash work in progress and restore' },
      { cmd: 'git reset --soft HEAD~1', noteAr: 'التراجع عن آخر Commit مع الاحتفاظ بالكود في ملفاتك', noteEn: 'Undo last commit keeping changes' },
    ]
  },

  // --- LINUX ---
  {
    category: 'linux',
    titleAr: 'التنقل وإدارة الملفات في الطرفية',
    titleEn: 'Directory Navigation & File Operations',
    descAr: 'الأوامر الأساسية لمساق نظم التشغيل والتعامل مع السيرفرات.',
    descEn: 'Core Unix commands for Operating Systems lab and servers.',
    snippets: [
      { cmd: 'pwd', noteAr: 'طباعة مسار المجلد الحالي', noteEn: 'Print working directory' },
      { cmd: 'ls -lah', noteAr: 'عرض كافة الملفات بتفاصيل الأحجام والصلاحيات', noteEn: 'List all files with details & sizes' },
      { cmd: 'mkdir -p project/src/components', noteAr: 'إنشاء مجلد متداخل بعدة مستويات دفعة واحدة', noteEn: 'Create nested directories' },
      { cmd: 'cp -r folder1/ folder2/', noteAr: 'نسخ مجلد بمحتوياته تكرارياً', noteEn: 'Copy directory recursively' },
      { cmd: 'rm -rf temp_folder/', noteAr: 'حذف مجلد نهائياً (احذر من استخدامه دون تأكد!)', noteEn: 'Force delete directory' },
    ]
  },
  {
    category: 'linux',
    titleAr: 'الصلاحيات والبحث والعمليات',
    titleEn: 'Permissions, Grep & Process Monitoring',
    descAr: 'إدارة صلاحيات الملفات والبحث في الأكواد ومراقبة العمليات.',
    descEn: 'File permissions, text search, and process management.',
    snippets: [
      { cmd: 'chmod +x script.sh', noteAr: 'إعطاء الملف صلاحية التشغيل (Execute)', noteEn: 'Make script executable' },
      { cmd: 'chmod 755 app.py', noteAr: 'صلاحيات قراءة وتنفيذ للجميع وكتابة للمالك فقط', noteEn: 'Set standard 755 permissions' },
      { cmd: 'grep -rn "API_KEY" ./src', noteAr: 'البحث عن كلمة داخل كافة ملفات المجلد مع رقم السطر', noteEn: 'Search text recursively with line numbers' },
      { cmd: 'ps aux | grep node', noteAr: 'البحث عن معرّف عملية Node.js النشطة (PID)', noteEn: 'Find running Node processes' },
      { cmd: 'kill -9 <PID>', noteAr: 'إنهاء عملية بالقوة عبر رقم المعرّف', noteEn: 'Force kill process by PID' },
    ]
  },

  // --- SQL ---
  {
    category: 'sql',
    titleAr: 'تعريف الجداول (DDL)',
    titleEn: 'Table Definition & Constraints (DDL)',
    descAr: 'إنشاء الجداول والمفاتيح الأساسية والأجنبية في قواعد البيانات.',
    descEn: 'Create tables, primary keys, and foreign key relations.',
    snippets: [
      {
        cmd: `CREATE TABLE Students (
  student_id INT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  gpa DECIMAL(4,2) CHECK (gpa >= 0 AND gpa <= 100),
  major_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (major_id) REFERENCES Majors(id) ON DELETE SET NULL
);`,
        noteAr: 'إنشاء جدول طلاب مع قيود التحقق والمفتاح الأجنبي',
        noteEn: 'Create table with foreign key & check constraints'
      }
    ]
  },
  {
    category: 'sql',
    titleAr: 'الربط المتقدم والتجميع (Joins & Aggregates)',
    titleEn: 'SQL Joins, Group By & Having',
    descAr: 'الاستعلامات المتكررة في امتحانات قواعد البيانات بالأزهر.',
    descEn: 'Common join and aggregation queries for DB exams.',
    snippets: [
      {
        cmd: `SELECT s.full_name, c.course_name, e.grade
FROM Students s
INNER JOIN Enrollments e ON s.student_id = e.student_id
INNER JOIN Courses c ON e.course_id = c.course_id
WHERE e.grade >= 85
ORDER BY e.grade DESC;`,
        noteAr: 'استعلام ربط الجداول (INNER JOIN) لعرض درجات الطلاب المتميزة',
        noteEn: 'Inner join across students, enrollments, and courses'
      },
      {
        cmd: `SELECT m.major_name, COUNT(s.student_id) AS total_students, AVG(s.gpa) AS avg_gpa
FROM Majors m
LEFT JOIN Students s ON m.id = s.major_id
GROUP BY m.id, m.major_name
HAVING AVG(s.gpa) >= 80;`,
        noteAr: 'حساب متوسط المعدل لكل تخصص باستخدام GROUP BY و HAVING',
        noteEn: 'Group by with aggregate functions and HAVING clause'
      }
    ]
  },

  // --- DSA ---
  {
    category: 'dsa',
    titleAr: 'جدول تعقيد الوقت والمساحة (Big-O Complexity)',
    titleEn: 'Time & Space Complexity Reference',
    descAr: 'مرجع سريع لحفظ تعقيد الخوارزميات وتراكيب البيانات الشهيرة.',
    descEn: 'Big-O reference for data structures and sorting algorithms.',
    snippets: [
      {
        cmd: `/* مصفوفة عادية (Array):
   - Access: O(1)
   - Search: O(N)
   - Insert / Delete: O(N)

/* جدول التجزئة (Hash Table):
   - Search / Insert / Delete: O(1) Average | O(N) Worst Case

/* شجرة البحث الثنائية المتوازنة (Balanced BST / AVL):
   - Search / Insert / Delete: O(log N)

/* خوارزميات الترتيب (Sorting):
   - Merge Sort: O(N log N) - Stable
   - Quick Sort: O(N log N) Average | O(N^2) Worst
   - Binary Search: O(log N)`,
        noteAr: 'ملخص تعقيد الخوارزميات الأكثر سؤالاً في المقابلات والامتحانات',
        noteEn: 'Common time complexity breakdown'
      }
    ]
  },
  {
    category: 'dsa',
    titleAr: 'هياكل البيانات الأساسية في C++ / Python',
    titleEn: 'Essential Data Structures Snippets',
    descAr: 'كود سريع لاستخدام Stack, Queue, و Vector في لغات البرمجة.',
    descEn: 'Quick syntax for Stack, Queue, and Map.',
    snippets: [
      {
        cmd: `// C++ STL Stack (LIFO) & Queue (FIFO)
#include <stack>
#include <queue>

std::stack<int> s;
s.push(10); s.push(20);
int topVal = s.top(); // 20
s.pop();

std::queue<int> q;
q.push(1); q.push(2);
int frontVal = q.front(); // 1
q.pop();`,
        noteAr: 'طريقة استخدام المكدس (Stack) والطابور (Queue) في C++',
        noteEn: 'C++ STL Stack & Queue syntax'
      }
    ]
  },

  // --- WEB ---
  {
    category: 'web',
    titleAr: 'دوال المصفوفات الحديثة في JavaScript (ES6+)',
    titleEn: 'Modern JavaScript Array Methods',
    descAr: 'الدوال الأكثر استخداماً في React لمعالجة البيانات.',
    descEn: 'Common JS array operations (map, filter, reduce).',
    snippets: [
      {
        cmd: `// 1. التحويل والتكرار (Map)
const names = students.map(s => s.name);

// 2. الفلترة والتصفية (Filter)
const passed = students.filter(s => s.gpa >= 60);

// 3. التجميع وحساب المجموع (Reduce)
const totalHours = courses.reduce((acc, c) => acc + c.hours, 0);

// 4. البحث عن عنصر (Find)
const topStudent = students.find(s => s.gpa >= 95);`,
        noteAr: 'دوال map و filter و reduce و find الأكثر طلباً',
        noteEn: 'Map, filter, reduce, find patterns'
      }
    ]
  },
  {
    category: 'web',
    titleAr: 'خطافات React الأساسية (React Hooks)',
    titleEn: 'Essential React Hooks',
    descAr: 'كيفية استخدام useState و useEffect و useMemo بالشكل الصحيح.',
    descEn: 'Best practices for state, effects, and memoization.',
    snippets: [
      {
        cmd: `import { useState, useEffect, useMemo } from 'react'

function CourseViewer({ courseId }) {
  // حالة المتغيرات
  const [data, setData] = useState(null);

  // جلب البيانات مع تنظيف الأثر (Cleanup)
  useEffect(() => {
    let active = true;
    fetch('/api/course/' + courseId)
      .then(res => res.json())
      .then(d => { if (active) setData(d); });
    return () => { active = false; };
  }, [courseId]);

  // الحساب المسبق لتجنب إعادة التصيير المكلفة
  const totalScore = useMemo(() => {
    return data?.grades?.reduce((a, b) => a + b, 0) || 0;
  }, [data]);

  return <div>{totalScore}</div>;
}`,
        noteAr: 'نموذج React قياسي متوافق مع أفضل الممارسات',
        noteEn: 'Standard React component with hooks'
      }
    ]
  }
]

export default function Cheatsheets() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedIndex(id)
      toast.success(isArabic ? 'تم نسخ المقتطف بنجاح!' : 'Snippet copied to clipboard!')
      setTimeout(() => setCopiedIndex(null), 2000)
    }).catch(() => {
      toast.error(isArabic ? 'تعذر النسخ' : 'Failed to copy')
    })
  }

  // Filter cards
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return CHEATSHEET_DATA.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory
      if (!matchCat) return false
      if (!q) return true

      const inTitle = (item.titleAr + ' ' + item.titleEn).toLowerCase().includes(q)
      const inDesc = (item.descAr + ' ' + item.descEn).toLowerCase().includes(q)
      const inCode = item.snippets.some(s => 
        s.cmd.toLowerCase().includes(q) || 
        (s.noteAr + ' ' + s.noteEn).toLowerCase().includes(q)
      )
      return inTitle || inDesc || inCode
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-page space-y-8">
        
        {/* Page Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-2">
              <FiTerminal size={14} />
              <span>{isArabic ? 'خزينة المقتطفات والأوامر السريعة' : 'IT Syntax & Cheatsheets Vault'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {isArabic ? 'مرجع الأكواد والأوامر لطلاب IT' : 'Developer & Academic Cheatsheets'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
              {isArabic
                ? 'ملخصات سريعة قابلة للنسخ بنقرة واحدة لأوامر Git و Linux و SQL وهياكل البيانات.'
                : 'One-click copy references for Git, Linux, SQL, Big-O complexity and modern Web.'}
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === 'all'
                    ? 'bg-royal-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-ink'
                }`}
              >
                {isArabic ? 'جميع الأقسام' : 'All Topics'}
              </button>

              {CHEATSHEET_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const active = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      active
                        ? 'bg-royal-600 text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:text-ink'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-white' : cat.color} />
                    <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                  </button>
                )
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-sm">
              <FiSearch className="absolute inset-y-0 start-3 my-auto text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في الأوامر والأكواد...' : 'Search commands or syntax...'}
                className="input-spatial w-full ps-9 pe-8 py-1.5 rounded-xl text-xs text-ink placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 end-2.5 my-auto text-slate-400 hover:text-ink"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Cards Grid */}
        {filteredData.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl border border-white/10">
            <FiSearch size={32} className="mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-ink">{isArabic ? 'لم يتم العثور على نتائج مطابقة' : 'No matching cheatsheets found'}</h3>
            <p className="text-xs text-slate-500 mt-1">{isArabic ? 'جرب البحث بكلمة أخرى أو تغيير القسم المحدد.' : 'Try adjusting your search terms.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredData.map((item, idx) => (
              <div
                key={idx}
                className="glass rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between space-y-4 hover:border-royal-500/30 transition shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-extrabold text-ink">
                      {isArabic ? item.titleAr : item.titleEn}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-royal-500/10 text-royal-600 dark:text-cyan-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-white/60 mb-4">
                    {isArabic ? item.descAr : item.descEn}
                  </p>

                  {/* Snippets inside this group */}
                  <div className="space-y-3">
                    {item.snippets.map((snip, sIdx) => {
                      const snippetId = `${idx}_${sIdx}`
                      const isCopied = copiedIndex === snippetId
                      return (
                        <div key={sIdx} className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-900 text-slate-100">
                          {/* Note Header */}
                          <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-white/5 text-[11px] text-slate-300">
                            <span className="font-medium truncate pe-2">
                              {isArabic ? snip.noteAr : snip.noteEn}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(snip.cmd, snippetId)}
                              className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition"
                              title={isArabic ? 'نسخ الكود' : 'Copy snippet'}
                            >
                              {isCopied ? <FiCheck size={12} className="text-emerald-400" /> : <FiCopy size={12} />}
                              <span>{isCopied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ' : 'Copy')}</span>
                            </button>
                          </div>

                          {/* Code Block */}
                          <div className="p-3 overflow-x-auto text-xs font-mono select-all text-emerald-300 whitespace-pre">
                            {snip.cmd}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
