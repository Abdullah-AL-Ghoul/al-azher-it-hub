import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { pageContainer, pageItem } from '../utils/motionTokens'
import PageHero from '../components/shared/PageHero'
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiHelpCircle,
  FiRotateCcw,
  FiAward,
  FiBookOpen,
  FiArrowRight,
  FiArrowLeft,
  FiPlay,
  FiLayers,
  FiBarChart2,
  FiCheck
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const SUBJECTS = [
  { id: 'ds', code: 'ITCS2301', nameAr: 'هياكل البيانات والخوارزميات', nameEn: 'Data Structures & Algorithms', color: 'from-blue-600 to-cyan-500' },
  { id: 'db', code: 'ITIS2305', nameAr: 'نظم قواعد البيانات و SQL', nameEn: 'Database Systems & SQL', color: 'from-emerald-600 to-teal-500' },
  { id: 'se', code: 'ITSE3302', nameAr: 'هندسة البرمجيات وتصميم النظم', nameEn: 'Software Engineering', color: 'from-purple-600 to-indigo-500' },
  { id: 'net', code: 'ITCS3304', nameAr: 'شبكات الحاسوب والإنترنت', nameEn: 'Computer Networks', color: 'from-amber-600 to-orange-500' },
  { id: 'oop', code: 'ITCS1302', nameAr: 'برمجة الكائنات (OOP C++/Java)', nameEn: 'Object Oriented Programming', color: 'from-rose-600 to-pink-500' },
]

const QUESTIONS_BANK = {
  ds: [
    {
      id: 'ds1',
      questionAr: 'ما هو التعقيد الزمني الزمني (Time Complexity) للبحث الثنائي (Binary Search) في أسوأ الحالات؟',
      questionEn: 'What is the worst-case time complexity of Binary Search?',
      options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
      correctIndex: 1,
      explanationAr: 'البحث الثنائي يقسم مصفوفة العناصر المرتبة إلى النصف في كل خطوة، مما يجعل التعقيد الزمني له O(log N).',
      explanationEn: 'Binary search cuts the sorted search space in half at each step, yielding O(log N) time complexity.'
    },
    {
      id: 'ds2',
      questionAr: 'أي هيكل بيانات يعمل وفق مبدأ "الوارد أخيراً يخرج أولاً" (LIFO - Last In First Out)؟',
      questionEn: 'Which data structure operates on the LIFO (Last In First Out) principle?',
      options: ['Queue (الطابور)', 'Stack (المكدس)', 'Binary Tree (الشجرة الثنائية)', 'Hash Table (جدول التجزئة)'],
      correctIndex: 1,
      explanationAr: 'المكدس (Stack) هو الهيكل الذي يدعم عمليات push و pop بناءً على مبدأ LIFO.',
      explanationEn: 'A Stack handles insertion and removal strictly according to the Last In First Out (LIFO) protocol.'
    },
    {
      id: 'ds3',
      questionAr: 'ما هو التعقيد الزمني للوصول إلى عنصر في جدول التجزئة (Hash Table) في الحالة المتوسطة؟',
      questionEn: 'What is the average time complexity for element lookup in a Hash Table?',
      options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
      correctIndex: 0,
      explanationAr: 'في الحالة المتوسطة وبوجود دالة تجزئة جيدة، الوصول يستغرق وقتاً ثابتاً O(1).',
      explanationEn: 'With a proper hash function and low load factor, average hash table lookup is O(1).'
    },
    {
      id: 'ds4',
      questionAr: 'في شجرة البحث الثنائية (BST)، أين تقع العناصر التي تكون قيمتها أصغر من الجذر (Root)؟',
      questionEn: 'In a Binary Search Tree (BST), where are keys smaller than the root located?',
      options: ['في الشجرة الفرعية اليمنى', 'في الشجرة الفرعية اليسرى', 'في العقد الورقية فقط', 'في نفس مستوى الجذر'],
      correctIndex: 1,
      explanationAr: 'وفق خاصية BST، جميع العقد في الشجرة الفرعية اليسرى تحمل قيماً أصغر من العقدة الجذرية.',
      explanationEn: 'By BST property, all keys in the left subtree must be less than the root node key.'
    },
    {
      id: 'ds5',
      questionAr: 'أي من خوارزميات الفرز التالية تحقق أفضل تعقيد زمني في أسوأ الحالات O(N log N) وتعتبر فرزاً ثابتاً؟',
      questionEn: 'Which sorting algorithm guarantees O(N log N) in the worst-case and is stable?',
      options: ['QuickSort', 'BubbleSort', 'MergeSort', 'SelectionSort'],
      correctIndex: 2,
      explanationAr: 'MergeSort تضمن O(N log N) في جميع الحالات (أفضل وأسوأ ومتوسط) وتعتبر Stable Sort.',
      explanationEn: 'MergeSort consistently guarantees O(N log N) across all cases and preserves relative element order.'
    }
  ],
  db: [
    {
      id: 'db1',
      questionAr: 'ما هي الكلمة المفتاحية في SQL المستخدمة لمنع تكرار القيم في نتائج الاستعلام؟',
      questionEn: 'Which SQL keyword is used to eliminate duplicate values from a query result?',
      options: ['UNIQUE', 'DISTINCT', 'GROUP BY', 'DIFFERENT'],
      correctIndex: 1,
      explanationAr: 'الكلمة المفتاحية SELECT DISTINCT تزيل الصفوف المكررة من نتيجة الاستعلام.',
      explanationEn: 'The SELECT DISTINCT statement is used to return only distinct (different) values.'
    },
    {
      id: 'db2',
      questionAr: 'ماذا يمثل المفتاح الأساسي (Primary Key) في قواعد البيانات العلائقية؟',
      questionEn: 'What does a Primary Key represent in a relational database table?',
      options: ['مفتاح يقبل القيم الفارغة (NULL)', 'معرّف فريد لكل صف لا يقبل التكرار ولا القيم الفارغة', 'رابط لجدول خارجي', 'مفتاح يحدد نوع البيانات فقط'],
      correctIndex: 1,
      explanationAr: 'المفتاح الأساسي (Primary Key) يجب أن يكون فريداً لكل سجل ولا يمكن أن يحتوي على قيمة NULL.',
      explanationEn: 'A Primary Key uniquely identifies each row and must contain unique, non-null values.'
    },
    {
      id: 'db3',
      questionAr: 'أي نوع من عمليات الربط (JOIN) يُرجع كافة السجلات من الجدول الأيسر حتى لو لم تتطابق مع الجدول الأيمن؟',
      questionEn: 'Which JOIN returns all records from the left table even with no matches on the right?',
      options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'CROSS JOIN'],
      correctIndex: 2,
      explanationAr: 'LEFT JOIN يضمن إرجاع جميع صفوف الجدول الأيسر مع قيم NULL للأعمدة غير المتطابقة في الجدول الأيمن.',
      explanationEn: 'LEFT JOIN returns all records from the left table, and matched records from the right table.'
    },
    {
      id: 'db4',
      questionAr: 'ما هي الخاصية المسؤولة عن ضمان تنفيذ المعاملة كاملة أو التراجع عنها بالكامل (All or Nothing) في ACID؟',
      questionEn: 'Which ACID property guarantees all-or-nothing execution of database transactions?',
      options: ['Atomicity (الذرية)', 'Consistency (الاتساق)', 'Isolation (العزل)', 'Durability (الديمومة)'],
      correctIndex: 0,
      explanationAr: 'خاصية الذرية (Atomicity) تضمن إما نجاح العملية بأكملها أو إلغائها تماماً.',
      explanationEn: 'Atomicity ensures that all operations within a transaction succeed or all are rolled back.'
    },
    {
      id: 'db5',
      questionAr: 'ما هو الشكل الطبيعي (Normal Form) الذي يشترط أن يكون الجدول في 1NF وأن تعتمد جميع الأعمدة غير المفتاحية اعتماداً كاملاً على المفتاح الأساسي؟',
      questionEn: 'Which Normal Form requires 1NF and no partial dependencies on the primary key?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      correctIndex: 1,
      explanationAr: 'الشكل الطبيعي الثاني 2NF يشترط القضاء على التبعية الجزئية (Partial Functional Dependency).',
      explanationEn: 'Second Normal Form (2NF) requires 1NF and eliminates partial functional dependencies.'
    }
  ],
  se: [
    {
      id: 'se1',
      questionAr: 'أي من المنهجيات التالية تتبع نموذج التطوير التكراري والمرن وفق دورات زمنية قصيرة (Sprints)؟',
      questionEn: 'Which software development methodology uses short iterative cycles called Sprints?',
      options: ['Waterfall Model (الشلال)', 'Agile / Scrum', 'V-Model', 'Big Bang Model'],
      correctIndex: 1,
      explanationAr: 'إطار العمل Scrum المبني على فلسفة Agile يعتمد على دورات تطوير قصيرة تسمى Sprints (عادة 2-4 أسابيع).',
      explanationEn: 'Scrum (an Agile framework) divides work into timeboxed iterations called Sprints.'
    },
    {
      id: 'se2',
      questionAr: 'ما هو مخطط UML المستخدم لتمثيل التفاعل بين المستخدم والوظائف التي يقدمها النظام؟',
      questionEn: 'Which UML diagram represents interaction between users and system capabilities?',
      options: ['Class Diagram', 'Use Case Diagram', 'Deployment Diagram', 'State Diagram'],
      correctIndex: 1,
      explanationAr: 'مخطط حالات الاستخدام (Use Case Diagram) يوضح المستخدمين (Actors) والعمليات التي يؤدونها في النظام.',
      explanationEn: 'Use Case diagrams model system requirements and actor interactions with system functions.'
    },
    {
      id: 'se3',
      questionAr: 'في مبادئ SOLID للبرمجة، ماذا يمثل الحرف "S"؟',
      questionEn: 'In SOLID design principles, what does the letter "S" stand for?',
      options: ['Single Responsibility Principle', 'System Optimization', 'Structured Programming', 'Scope Isolation'],
      correctIndex: 0,
      explanationAr: 'مبدأ المسؤولية الواحدة (Single Responsibility) ينص على أن كل فئة يجب أن يكون لها سبب واحد فقط للتعديل.',
      explanationEn: 'The Single Responsibility Principle states a class should have one, and only one, reason to change.'
    }
  ],
  net: [
    {
      id: 'net1',
      questionAr: 'في أي طبقة من طبقات نموذج OSI يعمل بروتوكول HTTP و DNS؟',
      questionEn: 'At which layer of the OSI model do HTTP and DNS operate?',
      options: ['Physical Layer', 'Transport Layer', 'Network Layer', 'Application Layer (طبقة التطبيقات)'],
      correctIndex: 3,
      explanationAr: 'بروتوكولات HTTP و HTTPS و DNS و FTP تعمل في الطبقة السابعة: طبقة التطبيقات (Application Layer).',
      explanationEn: 'HTTP and DNS are application-layer protocols providing network services directly to end users.'
    },
    {
      id: 'net2',
      questionAr: 'ما هو الفرق الأساسي بين بروتوكول TCP وبروتوكول UDP؟',
      questionEn: 'What is the primary difference between TCP and UDP?',
      options: ['UDP أبطأ من TCP', 'TCP موثوق ويضمن وصول الحزم (Reliable)، بينما UDP غير موثوق وسريع (Connectionless)', 'TCP لا يحتاج مصافحة ثلاثية', 'لا يوجد فرق'],
      correctIndex: 1,
      explanationAr: 'بروتوكول TCP يضمن وصول وترتيب الحزم وإعادة إرسال المفقود، بينما UDP يركز على السرعة بدون مصافحة.',
      explanationEn: 'TCP is connection-oriented and reliable, while UDP is connectionless and prioritizes low latency.'
    }
  ],
  oop: [
    {
      id: 'oop1',
      questionAr: 'ما هو المفهوم في البرمجة كائنية التوجه الذي يخفي التفاصيل الداخلية للفئة ويحمي بياناتها من التعديل المباشر؟',
      questionEn: 'Which OOP concept hides internal object state and protects data from direct external access?',
      options: ['Inheritance (الوراثة)', 'Encapsulation (التغليف)', 'Polymorphism (تعدد الأشكال)', 'Abstraction (التجريد)'],
      correctIndex: 1,
      explanationAr: 'التغليف (Encapsulation) يجمع البيانات مع الدوال التي تعالجها ويمنع الوصول المباشر للحقول الخاصة عبر getters و setters.',
      explanationEn: 'Encapsulation bundles data and methods together while restricting direct access to object internals.'
    },
    {
      id: 'oop2',
      questionAr: 'ماذا يسمى السماح لنفس الدالة بالعمل بسلوكيات مختلفة بناءً على الكائن الذي يستدعيها في وقت التشغيل؟',
      questionEn: 'What allows methods to take on different behaviors based on the runtime calling object?',
      options: ['Polymorphism (تعدد الأشكال)', 'Encapsulation', 'Compilation', 'Recursion'],
      correctIndex: 0,
      explanationAr: 'تعدد الأشكال (Polymorphism) يسمح بمعاملة الكائنات المشتقة ككائنات من الفئة الأساسية وتنفيذ الدالة المناسبة.',
      explanationEn: 'Polymorphism allows objects of different classes to respond to the same message with custom behaviors.'
    }
  ]
}

export default function ExamSimulator() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  // Config State
  const [selectedSubject, setSelectedSubject] = useState('ds')
  const [examMode, setExamMode] = useState('practice') // 'practice' | 'timed'
  const [examStarted, setExamStarted] = useState(false)
  const [examFinished, setExamFinished] = useState(false)

  // Exam Run State
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({}) // { [qId]: selectedOptionIndex }
  const [showPracticeExplanation, setShowPracticeExplanation] = useState({})
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60) // 15 mins default

  const timerRef = useRef(null)

  // Current active questions
  const activeQuestions = useMemo(() => {
    return QUESTIONS_BANK[selectedSubject] || QUESTIONS_BANK.ds
  }, [selectedSubject])

  // Start Exam
  const handleStartExam = (mode) => {
    setExamMode(mode)
    setCurrentQIndex(0)
    setUserAnswers({})
    setShowPracticeExplanation({})
    setTimeLeftSeconds(mode === 'timed' ? activeQuestions.length * 90 : 0) // 90 sec per question
    setExamStarted(true)
    setExamFinished(false)
  }

  // Timer countdown
  useEffect(() => {
    if (examStarted && examMode === 'timed' && !examFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleFinishExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [examStarted, examMode, examFinished])

  // Select Option
  const handleSelectOption = (questionId, optionIdx) => {
    if (examFinished) return
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }))
    if (examMode === 'practice') {
      setShowPracticeExplanation((prev) => ({ ...prev, [questionId]: true }))
    }
  }

  // Submit / Finish Exam
  const handleFinishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setExamFinished(true)
    toast.success(isArabic ? 'تم تسليم الامتحان وحساب النتيجة!' : 'Exam submitted and scored!')
  }

  // Calculate Results
  const scoreResults = useMemo(() => {
    let correct = 0
    let total = activeQuestions.length
    activeQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correct++
      }
    })
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    return { correct, total, percentage }
  }, [activeQuestions, userAnswers])

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentQ = activeQuestions[currentQIndex] || activeQuestions[0]

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="visible"
      className="min-h-screen pt-24 pb-20 bg-spatial-page"
    >
      <div className="container-page max-w-5xl">
        {/* Page Hero */}
        <PageHero
          variant="chips"
          title={isArabic ? 'محاكي الامتحانات وبنك الأسئلة التدريبية' : 'IT Exam Simulator & Quizzes'}
          subtitle={
            isArabic
              ? 'اختبر معلوماتك في مقررات كلية تكنولوجيا المعلومات عبر نماذج اختبارات تفاعلية محاكية للامتحانات النصفية والنهائية مع تقارير نقاط القوة والضعف.'
              : 'Assess your knowledge in core IT courses with simulated timed exams, instant practice mode, and detailed academic performance reports.'
          }
        />

        {/* STEP 1: PRE-EXAM CONFIG SCREEN */}
        {!examStarted ? (
          <motion.div variants={pageItem} className="space-y-6">
            {/* Subject Selector */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <FiBookOpen className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'اختر المقرر الدراسي للاختبار:' : 'Select Course to Test:'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {SUBJECTS.map((sub) => {
                  const isSelected = selectedSubject === sub.id
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.id)}
                      className={`text-start p-4 rounded-2xl border transition-all text-xs sm:text-sm font-bold shadow-xs ${
                        isSelected
                          ? `bg-gradient-to-br ${sub.color} text-white shadow-md scale-[1.02] border-transparent`
                          : 'glass hover:bg-slate-100 dark:hover:bg-white/5 text-ink border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] opacity-80 font-mono">{sub.code}</span>
                        {isSelected && <FiCheckCircle size={15} />}
                      </div>
                      <div className="text-sm font-extrabold">{isArabic ? sub.nameAr : sub.nameEn}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mode Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Practice Mode Card */}
              <div className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-lg flex flex-col justify-between hover:border-royal-500/30 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center mb-4 shadow-md shadow-royal-500/20">
                    <FiLayers size={22} />
                  </div>
                  <h4 className="text-lg font-extrabold text-ink mb-2">
                    {isArabic ? 'نمط التدريب والمراجعة الفورية' : 'Immediate Practice Mode'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 leading-relaxed mb-6">
                    {isArabic
                      ? 'حل الأسئلة بدون مؤقت زمني مع كشف فوري للإجابة الصحيحة والشرح الأكاديمي التفصيلي لترسيخ المفاهيم.'
                      : 'Self-paced review with zero time constraints and instant answer explanations after every question.'}
                  </p>
                </div>
                <button
                  onClick={() => handleStartExam('practice')}
                  className="w-full py-3.5 rounded-2xl btn-secondary font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <FiPlay size={16} />
                  <span>{isArabic ? 'بدء نمط التدريب' : 'Start Practice Mode'}</span>
                </button>
              </div>

              {/* Timed Exam Simulator Card */}
              <div className="glass rounded-3xl p-6 sm:p-7 border border-white/10 shadow-lg flex flex-col justify-between hover:border-royal-500/30 transition">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20">
                    <FiClock size={22} />
                  </div>
                  <h4 className="text-lg font-extrabold text-ink mb-2">
                    {isArabic ? 'محاكي الامتحان النصفي / النهائي' : 'Timed Exam Simulator'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 leading-relaxed mb-6">
                    {isArabic
                      ? 'محاكاة كاملة لظروف الامتحان الجامعي مع مؤقت تنازلي، تسليم موحد، وحساب دقيق للمعدل والنسبة المئوية.'
                      : 'Realistic exam simulation with a countdown timer, final submission, and comprehensive score report.'}
                  </p>
                </div>
                <button
                  onClick={() => handleStartExam('timed')}
                  className="w-full py-3.5 rounded-2xl btn-primary font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-royal-500/25"
                >
                  <FiClock size={16} />
                  <span>{isArabic ? 'بدء محاكي الامتحان الموقوت' : 'Launch Timed Exam'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : !examFinished ? (
          /* STEP 2: ACTIVE EXAM INTERFACE */
          <motion.div variants={pageItem} className="space-y-6">
            {/* Top Exam Header Banner */}
            <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 shadow-sm flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 dark:text-white/50 block">
                  {isArabic ? 'المقرر الحالي:' : 'Course:'}
                </span>
                <span className="text-sm font-bold text-ink">
                  {isArabic ? SUBJECTS.find(s => s.id === selectedSubject)?.nameAr : SUBJECTS.find(s => s.id === selectedSubject)?.nameEn}
                </span>
              </div>

              {/* Timer in Timed Mode */}
              {examMode === 'timed' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold ${
                  timeLeftSeconds < 120
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse border border-rose-500/30'
                    : 'glass text-royal-600 dark:text-cyan-400 border border-white/10'
                }`}>
                  <FiClock size={16} />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleFinishExam}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-xs font-bold shadow-sm transition"
              >
                {isArabic ? 'تسليم الامتحان' : 'Finish Exam'}
              </button>
            </div>

            {/* Question Card */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg">
              {/* Question Index & Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-royal-500/10 text-royal-600 dark:text-cyan-400 border border-royal-500/20">
                  {isArabic ? `السؤال ${currentQIndex + 1} من ${activeQuestions.length}` : `Question ${currentQIndex + 1} of ${activeQuestions.length}`}
                </span>
                <span className="text-xs text-slate-400">
                  {examMode === 'practice' ? (isArabic ? 'نمط تدريب' : 'Practice') : (isArabic ? 'نمط موقوت' : 'Timed')}
                </span>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-ink leading-relaxed mb-6">
                {isArabic ? currentQ.questionAr : currentQ.questionEn}
              </h3>

              {/* Options List */}
              <div className="space-y-3 mb-6">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx
                  const isAnswered = userAnswers[currentQ.id] !== undefined
                  const isCorrect = optIdx === currentQ.correctIndex

                  let btnStyle = 'glass hover:bg-slate-100 dark:hover:bg-white/5 border-white/10 text-ink'
                  if (isSelected) {
                    btnStyle = 'bg-royal-500/15 border-royal-500 text-royal-700 dark:text-cyan-300 shadow-xs'
                  }
                  if (examMode === 'practice' && isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full p-4 rounded-2xl border text-start flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-royal-600 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-white/70'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      {examMode === 'practice' && isAnswered && isCorrect && (
                        <FiCheckCircle className="text-emerald-500 shrink-0" size={18} />
                      )}
                      {examMode === 'practice' && isAnswered && isSelected && !isCorrect && (
                        <FiXCircle className="text-rose-500 shrink-0" size={18} />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Practice Mode Explanation Box */}
              {examMode === 'practice' && showPracticeExplanation[currentQ.id] && (
                <div className="p-4 rounded-2xl bg-royal-500/10 border border-royal-500/20 text-xs sm:text-sm text-slate-700 dark:text-white/80 leading-relaxed mb-6">
                  <div className="flex items-center gap-2 font-bold text-royal-600 dark:text-cyan-400 mb-1">
                    <FiHelpCircle size={15} />
                    <span>{isArabic ? 'التوضيح الأكاديمي للإجابة:' : 'Academic Explanation:'}</span>
                  </div>
                  <p>{isArabic ? currentQ.explanationAr : currentQ.explanationEn}</p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                  className="px-4 py-2 rounded-xl glass border border-white/10 text-xs font-bold text-ink disabled:opacity-30 transition flex items-center gap-2"
                >
                  {isArabic ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
                  <span>{isArabic ? 'السابق' : 'Previous'}</span>
                </button>

                {currentQIndex < activeQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <span>{isArabic ? 'التالي' : 'Next'}</span>
                    {isArabic ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
                  </button>
                ) : (
                  <button
                    onClick={handleFinishExam}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <FiCheck size={14} />
                    <span>{isArabic ? 'تسليم وإنهاء' : 'Submit & Score'}</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* STEP 3: EXAM SCORE REPORT */
          <motion.div variants={pageItem} className="space-y-6">
            <div className="glass rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl text-center relative overflow-hidden">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-royal-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-royal-500/30">
                <FiAward size={40} />
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-ink mb-2">
                {scoreResults.percentage >= 85
                  ? isArabic ? 'ممتاز! نتيجة استثنائية 🌟' : 'Excellent! Outstanding Score 🌟'
                  : scoreResults.percentage >= 70
                  ? isArabic ? 'أداء جيد جداً! 🎖️' : 'Great Job! 🎖️'
                  : isArabic ? 'تحتاج إلى مراجعة إضافية للمفاهيم 👍' : 'Review Needed 👍'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mb-6">
                {isArabic
                  ? `أكملت اختبار ${SUBJECTS.find(s => s.id === selectedSubject)?.nameAr} بنجاح.`
                  : `Completed ${SUBJECTS.find(s => s.id === selectedSubject)?.nameEn} exam.`}
              </p>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-3 gap-3.5 max-w-md mx-auto mb-8">
                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl sm:text-3xl font-extrabold text-royal-600 dark:text-cyan-400">
                    {scoreResults.percentage}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{isArabic ? 'النسبة المئوية' : 'Score'}</div>
                </div>

                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-500">
                    {scoreResults.correct}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{isArabic ? 'إجابات صحيحة' : 'Correct'}</div>
                </div>

                <div className="glass rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-500">
                    {scoreResults.total - scoreResults.correct}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{isArabic ? 'إجابات خاطئة' : 'Mistakes'}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => handleStartExam(examMode)}
                  className="px-6 py-3 rounded-xl btn-primary text-xs sm:text-sm font-bold flex items-center gap-2"
                >
                  <FiRotateCcw size={15} />
                  <span>{isArabic ? 'إعادة الاختبار' : 'Retake Exam'}</span>
                </button>
                <button
                  onClick={() => setExamStarted(false)}
                  className="px-6 py-3 rounded-xl btn-secondary text-xs sm:text-sm font-bold"
                >
                  {isArabic ? 'اختيار مقرر آخر' : 'Choose Another Course'}
                </button>
              </div>
            </div>

            {/* Detailed Questions Review */}
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg space-y-4">
              <h4 className="text-base sm:text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <FiBarChart2 className="text-royal-500 dark:text-cyan-400" />
                <span>{isArabic ? 'مراجعة تفصيلية للأسئلة والإجابات النموذجية:' : 'Detailed Question Review & Explanations:'}</span>
              </h4>

              <div className="space-y-4">
                {activeQuestions.map((q, idx) => {
                  const userAns = userAnswers[q.id]
                  const isCorrect = userAns === q.correctIndex
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                        isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-rose-500/5 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold mb-2">
                        {isCorrect ? (
                          <FiCheckCircle className="text-emerald-500" size={16} />
                        ) : (
                          <FiXCircle className="text-rose-500" size={16} />
                        )}
                        <span className="text-ink">
                          {idx + 1}. {isArabic ? q.questionAr : q.questionEn}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600 dark:text-white/70 ps-6">
                        <p>
                          <strong>{isArabic ? 'إجابتك: ' : 'Your answer: '}</strong>
                          {userAns !== undefined ? q.options[userAns] : (isArabic ? 'لم تتم الإجابة' : 'Unanswered')}
                        </p>
                        {!isCorrect && (
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            <strong>{isArabic ? 'الإجابة النموذجية: ' : 'Correct answer: '}</strong>
                            {q.options[q.correctIndex]}
                          </p>
                        )}
                        <p className="text-slate-500 dark:text-white/50 pt-1 border-t border-slate-200/50 dark:border-white/5">
                          💡 {isArabic ? q.explanationAr : q.explanationEn}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
