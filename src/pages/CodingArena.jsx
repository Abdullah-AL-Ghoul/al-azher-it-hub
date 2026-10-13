import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import PageHero from '../components/shared/PageHero'
import {
  FiAward,
  FiCode,
  FiPlay,
  FiCheckCircle,
  FiXCircle,
  FiZap,
  FiStar,
  FiTerminal,
  FiTrendingUp,
  FiLayers,
  FiCheck,
  FiCopy,
  FiRotateCcw,
  FiUsers
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const CHALLENGES = [
  {
    id: 'ch-1',
    titleAr: 'عكس السلسلة النصية بدون دوال جاهزة',
    titleEn: 'Reverse a String Without Built-in Helpers',
    difficulty: 'easy',
    topic: 'strings',
    xp: 50,
    descAr: 'اكتب دالة بلغة جافاسكريبت أو بايثون تستقبل نصاً وتُعيد معكوسه يدوياً باستخدام حلقة تكرار (Loop) لفهم إدارة المؤشرات والذاكرة.',
    descEn: 'Write an algorithm that takes a string and returns it reversed manually using two-pointer swapping or iterative loops.',
    starterCode: `function reverseString(str) {
  // اكتب كودك هنا
  let reversed = "";
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}`,
    testCases: [
      { input: '"alazher"', expected: '"rehzala"' },
      { input: '"algorithm"', expected: '"mhtirogla"' },
      { input: '"it"', expected: '"ti"' },
    ],
    hintAr: 'ابدأ بالحلقة من نهاية السلسلة النصية وصولاً للصفر وأضف كل حرف لمتغير جديد.',
    hintEn: 'Iterate from index length - 1 down to 0 and append characters to a new buffer.'
  },
  {
    id: 'ch-2',
    titleAr: 'البحث عن الرقم المفقود في المتتالية',
    titleEn: 'Find Missing Number in Array',
    difficulty: 'easy',
    topic: 'arrays',
    xp: 60,
    descAr: 'لديك مصفوفة تحتوي على N أرقام فريدة من النطاق [0, N]. ابحث عن الرقم الوحيد المفقود في المتتالية بأقل تعقيد زمني ممكن O(N).',
    descEn: 'Given an array containing n distinct numbers in the range [0, n], return the only number missing from the range.',
    starterCode: `function findMissingNumber(nums) {
  // حساب المجموع النظري والمجموع الفعلي
  const n = nums.length;
  const expectedSum = (n * (n + 1)) / 2;
  const actualSum = nums.reduce((acc, curr) => acc + curr, 0);
  return expectedSum - actualSum;
}`,
    testCases: [
      { input: '[3, 0, 1]', expected: '2' },
      { input: '[0, 1]', expected: '2' },
      { input: '[9,6,4,2,3,5,7,0,1]', expected: '8' },
    ],
    hintAr: 'مجموع الأرقام من 0 إلى N هو (N * (N + 1)) / 2. اطرح مجموع عناصر المصفوفة منه.',
    hintEn: 'Sum of series from 0 to N is n*(n+1)/2. Subtract actual sum from expected sum.'
  },
  {
    id: 'ch-3',
    titleAr: 'التحقق من صحة توازن الأقواس (Stack Check)',
    titleEn: 'Valid Parentheses Balancing with Stack',
    difficulty: 'medium',
    topic: 'stacks',
    xp: 100,
    descAr: 'باستخدام بنية المكدس (Stack)، تحقق مما إذا كانت الأقواس المعطاة (), {}, [] متطابقة ومغلقة بترتيب صحيح.',
    descEn: 'Given a string containing just the characters (), {}, and [], determine if the input string is balanced using a Stack data structure.',
    starterCode: `function isValidParentheses(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (let char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      if (stack.pop() !== map[char]) return false;
    }
  }
  return stack.length === 0;
}`,
    testCases: [
      { input: '"()[]{}"', expected: 'true' },
      { input: '"(]"', expected: 'false' },
      { input: '"([{}])"', expected: 'true' },
    ],
    hintAr: 'عند مقابلة قوس مفتوح ضعه في الـ Stack، وعند مقابلة قوس مغلق افحص هل القمة مطابقة.',
    hintEn: 'Push open brackets into stack. When encountering closed bracket, pop and verify matching type.'
  },
  {
    id: 'ch-4',
    titleAr: 'البحث الثنائي في مصفوفة مرتبة (Binary Search)',
    titleEn: 'Binary Search Implementation O(log N)',
    difficulty: 'medium',
    topic: 'searching',
    xp: 90,
    descAr: 'اكتب خوارزمية البحث الثنائي للبحث عن قيمة هدف target داخل مصفوفة مرتبة، مع إرجاع فهرس العنصر أو -1 إذا لم يوجد.',
    descEn: 'Given an array of integers sorted in ascending order, search for target. If target exists, return its index. Otherwise return -1.',
    starterCode: `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    testCases: [
      { input: '[-1,0,3,5,9,12], 9', expected: '4' },
      { input: '[-1,0,3,5,9,12], 2', expected: '-1' },
      { input: '[5], 5', expected: '0' },
    ],
    hintAr: 'قسّم نطاق البحث إلى النصف في كل دورة: إذا كانت القيمة الوسطى أصغر فتحرك يميناً.',
    hintEn: 'Narrow search interval by half each step. If middle element is less than target, search right.'
  },
  {
    id: 'ch-5',
    titleAr: 'أقصى مجموع لمصفوفة فرعية (Kadane Algorithm)',
    titleEn: 'Maximum Subarray Sum (Kadane Algorithm)',
    difficulty: 'hard',
    topic: 'arrays',
    xp: 150,
    descAr: 'اعثر على المصفوفة الفرعية المتصلة التي تمتلك أكبر مجموع ممكن وأرجع هذا المجموع بأفضل تعقيد زمني O(N).',
    descEn: 'Find the contiguous subarray (containing at least one number) which has the largest sum and return its sum in linear time.',
    starterCode: `function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currentMax = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentMax = Math.max(nums[i], currentMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currentMax);
  }
  return maxSoFar;
}`,
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6' },
      { input: '[1]', expected: '1' },
      { input: '[5,4,-1,7,8]', expected: '23' },
    ],
    hintAr: 'استخدم خوارزمية كادان: في كل خطوة حدد هل تبدأ مصفوفة فرعية جديدة أو تضيف للعنصر الحالي.',
    hintEn: 'Use Kadane algorithm: at each element, decide whether to extend previous subarray or start fresh.'
  }
]

const LEADERBOARD_STUDENTS = [
  { rank: 1, name: 'عبد الله طارق الغول', major: 'هندسة البرمجيات', solved: 48, xp: 3450, badge: 'أسطورة الكود 👑' },
  { rank: 2, name: 'سارة خالد الدحدوح', major: 'علوم الحاسوب', solved: 44, xp: 3120, badge: 'معمارية الخوارزميات ⚡' },
  { rank: 3, name: 'محمود ناصر حلس', major: 'هندسة البرمجيات', solved: 41, xp: 2900, badge: 'صائد الأخطاء 🎯' },
  { rank: 4, name: 'نور الدين إبراهيم', major: 'الوسائط وتطوير الويب', solved: 37, xp: 2580, badge: 'مبرمج متقدم 🚀' },
  { rank: 5, name: 'أحمد إسماعيل مطر', major: 'نظم المعلومات', solved: 35, xp: 2420, badge: 'خبير SQL 💾' },
  { rank: 6, name: 'دينا أحمد صيام', major: 'علوم الحاسوب', solved: 32, xp: 2200, badge: 'بطل البرمجة 🎖️' },
  { rank: 7, name: 'عمر باسم النجار', major: 'هندسة البرمجيات', solved: 29, xp: 2050, badge: 'مطور متميز 💡' },
  { rank: 8, name: 'إبراهيم يوسف رضوان', major: 'علوم الحاسوب', solved: 26, xp: 1800, badge: 'محلل خوارزميات 🔍' },
]

export default function CodingArena() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [activeTab, setActiveTab] = useState('challenges') // 'challenges' | 'leaderboard'
  const [activeDifficulty, setActiveDifficulty] = useState('all')
  const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGES[0])
  const [userCode, setUserCode] = useState(CHALLENGES[0].starterCode)
  const [testResults, setTestResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Local storage score tracking
  const [userStats, setUserStats] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_arena_stats')
      return saved ? JSON.parse(saved) : { xp: 350, solvedIds: ['ch-1'] }
    } catch {
      return { xp: 350, solvedIds: ['ch-1'] }
    }
  })

  const filteredChallenges = useMemo(() => {
    if (activeDifficulty === 'all') return CHALLENGES
    return CHALLENGES.filter((c) => c.difficulty === activeDifficulty)
  }, [activeDifficulty])

  const handleSelectChallenge = (ch) => {
    setSelectedChallenge(ch)
    setUserCode(ch.starterCode)
    setTestResults(null)
    setShowHint(false)
  }

  // Execute student solution against test cases
  const handleRunTests = () => {
    setIsRunning(true)
    setTestResults(null)

    setTimeout(() => {
      try {
        const results = selectedChallenge.testCases.map((tc, idx) => {
          let actual
          let passed = false
          try {
            // Evaluates safely inside constructed Function sandbox
            const runner = new Function(`
              ${userCode}
              const fnName = "${selectedChallenge.starterCode.match(/function\s+(\w+)/)?.[1]}";
              if (typeof window[fnName] === 'function') return window[fnName](${tc.input});
              return eval(fnName + "(" + ${JSON.stringify(tc.input)} + ")");
            `)
            actual = JSON.stringify(runner())
            passed = String(actual).trim() === String(tc.expected).trim()
          } catch (e) {
            actual = `Error: ${e.message}`
            passed = false
          }
          return { caseNumber: idx + 1, input: tc.input, expected: tc.expected, actual, passed }
        })

        const allPassed = results.every((r) => r.passed)
        setTestResults({ results, allPassed })

        if (allPassed) {
          toast.success(isArabic ? `رائع جداً! تم اجتياز جميع الفحوصات وحصلت على ${selectedChallenge.xp} XP!` : `All test cases passed! +${selectedChallenge.xp} XP!`)
          if (!userStats.solvedIds.includes(selectedChallenge.id)) {
            const updated = {
              xp: userStats.xp + selectedChallenge.xp,
              solvedIds: [...userStats.solvedIds, selectedChallenge.id],
            }
            setUserStats(updated)
            try {
              localStorage.setItem('al_azher_arena_stats', JSON.stringify(updated))
            } catch {}
          }
        } else {
          toast.error(isArabic ? 'بعض الفحوصات لم تنجح، راجع الكود وجرّب مجدداً' : 'Some test cases failed. Review your code and retry.')
        }
      } catch (err) {
        toast.error(err.message)
      } finally {
        setIsRunning(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-spatial-page">
      <div className="container-page max-w-7xl space-y-8">
        
        {/* Page Hero */}
        <PageHero
          variant="play"
          title={isArabic ? 'ساحة التحديات البرمجية ولوحة المتصدرين' : 'Coding Arena & Leaderboard'}
          subtitle={
            isArabic
              ? 'تحديات برمجية أسبوعية لطلبة كلية تكنولوجيا المعلومات — حل المشكلات، تحسين الخوارزميات، اختبار الحلول البرمجية مباشرة، والمنافسة على قائمة شرف الكلية.'
              : 'Sharpen your problem-solving skills with official IT faculty coding challenges, automated test runners, and student rankings.'
          }
        >
          {/* Quick Header Metric Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <div className="glass px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold text-ink">
              <FiZap className="text-amber-500" size={16} />
              <span>{isArabic ? `نقاط خبرتك: ${userStats.xp} XP` : `Your Score: ${userStats.xp} XP`}</span>
            </div>
            <div className="glass px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold text-ink">
              <FiCheckCircle className="text-emerald-500" size={16} />
              <span>{isArabic ? `التحديات المنجزة: ${userStats.solvedIds.length}` : `Solved: ${userStats.solvedIds.length}`}</span>
            </div>
          </div>
        </PageHero>

        {/* Tab Switcher: Arena vs Leaderboard */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('challenges')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'challenges'
                ? 'bg-gradient-to-r from-royal-600 to-cyan-500 text-white shadow-lg shadow-royal-500/25'
                : 'glass text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <FiCode size={18} />
            <span>{isArabic ? 'ميدان التحديات البرمجية' : 'Coding Challenges Arena'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                : 'glass text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <FiAward size={18} />
            <span>{isArabic ? 'لوحة المتصدرين وقائمة الشرف' : 'Faculty Leaderboard'}</span>
          </button>
        </div>

        {/* ARENA WORKSPACE */}
        {activeTab === 'challenges' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Challenge Selector & Problem Statement (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Difficulty Filter Bar */}
              <div className="glass rounded-2xl p-2.5 border border-white/10 flex items-center justify-between gap-1 overflow-x-auto">
                {[
                  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                  { id: 'easy', labelAr: 'سهل', labelEn: 'Easy' },
                  { id: 'medium', labelAr: 'متوسط', labelEn: 'Medium' },
                  { id: 'hard', labelAr: 'متقدم', labelEn: 'Hard' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveDifficulty(d.id)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition text-center whitespace-nowrap ${
                      activeDifficulty === d.id
                        ? 'bg-royal-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-white/60 hover:text-ink'
                    }`}
                  >
                    {isArabic ? d.labelAr : d.labelEn}
                  </button>
                ))}
              </div>

              {/* Challenge List Selector */}
              <div className="glass rounded-3xl p-3 border border-white/10 space-y-2 max-h-72 overflow-y-auto">
                {filteredChallenges.map((ch) => {
                  const isSelected = selectedChallenge.id === ch.id
                  const isSolved = userStats.solvedIds.includes(ch.id)
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleSelectChallenge(ch)}
                      className={`w-full text-start p-3 rounded-2xl border transition-all text-xs font-bold flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-royal-500/10 border-royal-500/40 text-royal-600 dark:text-cyan-400 shadow-sm'
                          : 'glass hover:bg-black/5 dark:hover:bg-white/5 border-transparent text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isSolved ? (
                          <FiCheckCircle className="text-emerald-500 shrink-0" size={16} />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/30 shrink-0" />
                        )}
                        <span className="truncate">{isArabic ? ch.titleAr : ch.titleEn}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-mono ${
                          ch.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          ch.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {ch.difficulty}
                        </span>
                        <span className="text-[10px] font-extrabold text-amber-500">+{ch.xp} XP</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Problem Description Card */}
              <div className="glass rounded-3xl p-6 border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-extrabold text-ink">
                    {isArabic ? selectedChallenge.titleAr : selectedChallenge.titleEn}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-royal-500/10 text-royal-600 dark:text-cyan-400 font-extrabold text-xs">
                    {selectedChallenge.topic.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-white/80 leading-relaxed">
                  {isArabic ? selectedChallenge.descAr : selectedChallenge.descEn}
                </p>

                {/* Hint Toggle */}
                <div className="pt-2 border-t border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-bold text-royal-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5"
                  >
                    <FiZap size={14} />
                    <span>{showHint ? (isArabic ? 'إخفاء التلميح الخوارزمي' : 'Hide Hint') : (isArabic ? 'إظهار التلميح الخوارزمي' : 'Reveal Algorithm Hint')}</span>
                  </button>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed"
                    >
                      💡 {isArabic ? selectedChallenge.hintAr : selectedChallenge.hintEn}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Code Editor & Test Cases Runner (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Editor Shell */}
              <div className="glass rounded-3xl border border-white/10 shadow-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-black/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <FiCode className="text-royal-500 dark:text-cyan-400" size={16} />
                    <span>{isArabic ? 'محرر الحلول البرمجية (JavaScript / V8)' : 'Code Sandbox Editor (JavaScript)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUserCode(selectedChallenge.starterCode)}
                      title={isArabic ? 'إعادة ضبط الكود' : 'Reset Boilerplate'}
                      className="p-1.5 rounded-xl glass hover:bg-black/10 text-slate-400 hover:text-ink text-xs transition"
                    >
                      <FiRotateCcw size={14} />
                    </button>
                  </div>
                </div>

                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-950 text-emerald-400 dark:text-emerald-300 focus:outline-none leading-relaxed border-none resize-y"
                  style={{ tabSize: 2, minHeight: '260px' }}
                  dir="ltr"
                />

                <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {isArabic ? 'اضغط تشغيل لفحص الحالات' : 'Run tests to verify solution'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRunTests}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
                  >
                    <FiPlay size={16} className={isRunning ? 'animate-spin' : ''} />
                    <span>{isArabic ? 'تشغيل وفحص الحالات' : 'Run Test Cases'}</span>
                  </button>
                </div>
              </div>

              {/* Test Cases Results Box */}
              {testResults && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass rounded-3xl p-5 border shadow-lg space-y-3 ${
                    testResults.allPassed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm flex items-center gap-2 text-ink">
                      {testResults.allPassed ? (
                        <>
                          <FiCheckCircle className="text-emerald-500" size={18} />
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {isArabic ? 'تم اجتياز جميع حالات الاختبار بنجاح! 🏆' : 'All Test Cases Passed Successfully!'}
                          </span>
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-rose-500" size={18} />
                          <span className="text-rose-600 dark:text-rose-400">
                            {isArabic ? 'فشلت بعض حالات الاختبار، راجع المخرجات أدناه' : 'Some test cases failed. See output below'}
                          </span>
                        </>
                      )}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {testResults.results.map((tr) => (
                      <div
                        key={tr.caseNumber}
                        className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          {tr.passed ? (
                            <span className="text-emerald-500 font-bold">✓ الحالة {tr.caseNumber}:</span>
                          ) : (
                            <span className="text-rose-500 font-bold">✗ الحالة {tr.caseNumber}:</span>
                          )}
                          <span className="text-slate-400">Input: {tr.input}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-slate-400">Expected: {tr.expected}</span>
                          <span className={tr.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            Actual: {tr.actual}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        ) : (
          /* LEADERBOARD VIEW */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
              <div>
                <h3 className="text-xl font-extrabold text-ink flex items-center gap-2">
                  <FiAward className="text-amber-500" size={24} />
                  <span>{isArabic ? 'قائمة الشرف لأفضل مبرمجي كلية الـ IT' : 'Al-Azher Faculty of IT Honor Roll'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                  {isArabic
                    ? 'ترتيب تنافسي فصلي بناءً على حل التحديات البرمجية الأسبوعية، سرعة الإنجاز، ونقاط الخبرة المكتسبة.'
                    : 'Real-time ranking of top student problem solvers based on weekly algorithm challenges.'}
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs border border-amber-500/20">
                {isArabic ? 'الفصل الدراسي الأول 2025/2026' : 'Fall Semester 2025/2026'}
              </div>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
              {LEADERBOARD_STUDENTS.slice(0, 3).map((st) => (
                <div
                  key={st.rank}
                  className={`p-6 rounded-3xl border text-center flex flex-col items-center justify-between space-y-3 relative overflow-hidden ${
                    st.rank === 1
                      ? 'bg-gradient-to-b from-amber-500/15 via-royal-500/5 to-transparent border-amber-500/40 shadow-xl'
                      : st.rank === 2
                      ? 'bg-gradient-to-b from-slate-400/15 to-transparent border-slate-400/30 shadow-md'
                      : 'bg-gradient-to-b from-orange-600/15 to-transparent border-orange-600/30 shadow-md'
                  }`}
                >
                  <div className="text-3xl">
                    {st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-ink">{st.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">{st.major}</p>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-white/20 dark:bg-white/10 text-xs font-bold text-ink">
                    {st.badge}
                  </div>
                  <div className="text-xs font-extrabold text-amber-500 pt-2 border-t border-black/5 dark:border-white/10 w-full flex justify-around">
                    <span>{st.solved} {isArabic ? 'تحدي' : 'solved'}</span>
                    <span>{st.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ranking Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/10 text-slate-400 font-bold">
                    <th className="py-3 px-4 text-start">#</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'اسم الطالب' : 'Student'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'التخصص الأكاديمي' : 'Major'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'التحديات المنجزة' : 'Solved'}</th>
                    <th className="py-3 px-4 text-start">{isArabic ? 'اللقب' : 'Badge'}</th>
                    <th className="py-3 px-4 text-end">{isArabic ? 'نقاط الخبرة' : 'Total XP'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {LEADERBOARD_STUDENTS.map((st) => (
                    <tr key={st.rank} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-extrabold text-ink">{st.rank}</td>
                      <td className="py-3.5 px-4 font-bold text-ink">{st.name}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-white/70">{st.major}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{st.solved}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[11px] font-semibold">
                          {st.badge}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-amber-500 text-end">{st.xp} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  )
}
