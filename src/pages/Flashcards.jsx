import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { 
  FiLayers, 
  FiRotateCcw, 
  FiCheckCircle, 
  FiPlus, 
  FiChevronLeft, 
  FiChevronRight, 
  FiX
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const DEFAULT_DECKS = [
  {
    id: 'dsa',
    titleAr: 'تراكيب البيانات والخوارزميات',
    titleEn: 'Data Structures & Algorithms',
    badge: 'ITCS2301',
    cards: [
      {
        id: 'dsa_1',
        qAr: 'ما هو تعقيد البحث في شجرة البحث الثنائية المتوازنة (Balanced BST)؟',
        qEn: 'What is the search time complexity in a Balanced BST (AVL/Red-Black)?',
        aAr: 'التعقيد هو O(log N) في أفضل وأسوأ الحالات نظراً لتوازن ارتفاع الشجرة.',
        aEn: 'O(log N) for best, average and worst cases due to balanced tree height.',
      },
      {
        id: 'dsa_2',
        qAr: 'ما الفرق الجوهري بين المكدس (Stack) والطابور (Queue)؟',
        qEn: 'What is the core difference between a Stack and a Queue?',
        aAr: 'المكدس يعمل بمبدأ LIFO (آخر من يدخل أول من يخرج)، بينما الطابور يعمل بمبدأ FIFO (أول من يدخل أول من يخرج).',
        aEn: 'Stack is LIFO (Last-In, First-Out), while Queue is FIFO (First-In, First-Out).',
      },
      {
        id: 'dsa_3',
        qAr: 'كيف يتعامل جدول التجزئة (Hash Table) مع التصادم (Collision)؟',
        qEn: 'How does a Hash Table resolve key collisions?',
        aAr: 'عبر طريقتين رئيسيتين: Chaining (استخدام Linked Lists في كل خانة) أو Open Addressing (Linear/Quadratic Probing أو Double Hashing).',
        aEn: 'Mainly via Separate Chaining (linked lists per bucket) or Open Addressing (probing).',
      },
      {
        id: 'dsa_4',
        qAr: 'ما هي خوارزمية الترتيب ذات التعقيد O(N log N) والمستقرة (Stable) دائماً؟',
        qEn: 'Which O(N log N) sorting algorithm is guaranteed to be stable?',
        aAr: 'خوارزمية Merge Sort (ترتيب الدمج)، وتتطلب مساحة إضافية O(N).',
        aEn: 'Merge Sort, which is stable and guarantees O(N log N) with O(N) space.',
      },
    ]
  },
  {
    id: 'networks',
    titleAr: 'شبكات الحاسوب والبروتوكولات',
    titleEn: 'Computer Networks & Protocols',
    badge: 'ITNE3301',
    cards: [
      {
        id: 'net_1',
        qAr: 'ما الفرق بين بروتوكول TCP وبروتوكول UDP في طبقة النقل؟',
        qEn: 'What is the difference between TCP and UDP at the Transport layer?',
        aAr: 'TCP موجه للاتصال (Connection-oriented) وموثوق مع مصافحة ثلاثية (3-Way Handshake)، بينما UDP سريع وغير موثوق بدون تأكيد استلام (مناسب للفيديو والألعاب).',
        aEn: 'TCP is connection-oriented and reliable (3-way handshake); UDP is connectionless and faster.',
      },
      {
        id: 'net_2',
        qAr: 'ما هي الطبقات السبع لنموذج OSI من الأسفل للأعلى؟',
        qEn: 'What are the 7 layers of the OSI model from bottom to top?',
        aAr: '1. المادية (Physical) 2. وصلة البيانات (Data Link) 3. الشبكة (Network) 4. النقل (Transport) 5. الجلسة (Session) 6. العرض (Presentation) 7. التطبيقات (Application).',
        aEn: '1. Physical 2. Data Link 3. Network 4. Transport 5. Session 6. Presentation 7. Application.',
      },
      {
        id: 'net_3',
        qAr: 'ما هي وظيفة بروتوكول DNS؟ وعلى أي منفذ (Port) يعمل؟',
        qEn: 'What does DNS do, and which default port does it use?',
        aAr: 'يترجم أسماء النطاقات (مثل google.com) إلى عناوين IP، ويعمل افتراضياً على منفذ UDP 53.',
        aEn: 'Translates domain names to IP addresses, running by default over port 53 (UDP).',
      },
    ]
  },
  {
    id: 'os',
    titleAr: 'نظم التشغيل وإدارة العمليات',
    titleEn: 'Operating Systems & Concurrency',
    badge: 'ITCS3302',
    cards: [
      {
        id: 'os_1',
        qAr: 'ما هو الاختناق (Deadlock) وما هي شروطه الأربعة المتزامنة (Coffman Conditions)؟',
        qEn: 'What is Deadlock and what are the 4 Coffman conditions?',
        aAr: 'حالة تجمد حيث كل عملية تنتظر مورداً تحتجزه عملية أخرى. الشروط: 1. الحصر المتبادل (Mutual Exclusion) 2. الاحتجاز والانتظار (Hold and Wait) 3. عدم إمكانية الإلغاء (No Preemption) 4. الانتظار الدائري (Circular Wait).',
        aEn: 'Processes blocked waiting for resources held by each other. Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.',
      },
      {
        id: 'os_2',
        qAr: 'ما الفرق بين العملية (Process) والخيط (Thread)؟',
        qEn: 'What is the difference between a Process and a Thread?',
        aAr: 'العملية برنامج قيد التنفيذ بمساحة ذاكرة معزولة خاصة بها. الخيط هو وحدة تنفيذ داخل العملية يتشارك نفس مساحة الذاكرة مع بقية الخيوط (Lightweight).',
        aEn: 'A Process has its own isolated address space; a Thread runs inside a process and shares its memory.',
      },
    ]
  },
  {
    id: 'db',
    titleAr: 'قواعد البيانات ونظم المعلومات',
    titleEn: 'Database Systems & ACID',
    badge: 'ITIS2301',
    cards: [
      {
        id: 'db_1',
        qAr: 'ما هي خصائص المعاملات الأربعة (ACID Properties)؟',
        qEn: 'What are the 4 ACID properties in Database Transactions?',
        aAr: '1. الذرية (Atomicity): المعاملة تنفذ كلها أو تلغى كلها. 2. الاتساق (Consistency): الحفاظ على القيود. 3. العزل (Isolation): المعاملات لا تتداخل. 4. الديمومة (Durability): التغييرات دائمة بعد الحفظ.',
        aEn: 'Atomicity (all or nothing), Consistency (preserves rules), Isolation (independent execution), Durability (persists after commit).',
      },
      {
        id: 'db_2',
        qAr: 'ما هو الشكل الطبيعي الثالث (3NF) في تطبيع الجداول (Normalization)؟',
        qEn: 'What is Third Normal Form (3NF) in database normalization?',
        aAr: 'يجب أن يكون الجدول في 2NF، ولا يحتوي على أي اعتمادية متعدية (No Transitive Dependency)، أي أن كل حقل غير مفتاحي يعتمد فقط وبشكل مباشر على المفتاح الأساسي.',
        aEn: 'Table is in 2NF and has no transitive dependencies (non-key columns depend only on the primary key).',
      },
    ]
  }
]

export default function Flashcards() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  // Active Deck
  const [activeDeckId, setActiveDeckId] = useState('dsa')
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Student Mastery Status (Leitner boxes: box1 = hard, box2 = medium, box3 = mastered)
  const [mastery, setMastery] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_flashcards_mastery')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Custom added cards
  const [customCards, setCustomCards] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_custom_flashcards')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // New card form
  const [newCardForm, setNewCardForm] = useState({
    deckId: 'dsa',
    qAr: '',
    qEn: '',
    aAr: '',
    aEn: '',
  })

  // Save mastery to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('al_azher_flashcards_mastery', JSON.stringify(mastery))
    } catch (_e) {
      // ignore
    }
  }, [mastery])

  // Save custom cards
  useEffect(() => {
    try {
      localStorage.setItem('al_azher_custom_flashcards', JSON.stringify(customCards))
    } catch (_e) {
      // ignore
    }
  }, [customCards])

  // Combine default deck with custom cards
  const activeDeck = useMemo(() => {
    const defaultDeck = DEFAULT_DECKS.find(d => d.id === activeDeckId) || DEFAULT_DECKS[0]
    const customForThisDeck = customCards.filter(c => c.deckId === activeDeckId)
    return {
      ...defaultDeck,
      cards: [...defaultDeck.cards, ...customForThisDeck],
    }
  }, [activeDeckId, customCards])

  const totalCards = activeDeck.cards.length
  const currentCard = activeDeck.cards[cardIndex] || activeDeck.cards[0]

  // Stats for this deck
  const stats = useMemo(() => {
    let mastered = 0
    let needReview = 0
    activeDeck.cards.forEach(c => {
      const status = mastery[c.id]
      if (status === 'mastered') mastered++
      if (status === 'hard') needReview++
    })
    const pct = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0
    return { mastered, needReview, pct }
  }, [activeDeck, mastery, totalCards])

  // Reset flip when navigating
  const nextCard = () => {
    setIsFlipped(false)
    setCardIndex((prev) => (prev + 1) % totalCards)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCardIndex((prev) => (prev - 1 + totalCards) % totalCards)
  }

  const markCard = (status) => {
    if (!currentCard) return
    setMastery(prev => ({ ...prev, [currentCard.id]: status }))
    if (status === 'mastered') {
      toast.success(isArabic ? '✨ رائع! تم تعليم البطاقة كـ "متقنة"' : '✨ Great! Marked as Mastered')
    } else if (status === 'hard') {
      toast(isArabic ? '📌 ستتم مراجعة هذه البطاقة لاحقاً' : '📌 Added to review queue', { icon: '📌' })
    }
    nextCard()
  }

  const handleAddCustomCard = (e) => {
    e.preventDefault()
    if (!newCardForm.qAr.trim() || !newCardForm.aAr.trim()) {
      toast.error(isArabic ? 'يرجى كتابة السؤال والإجابة' : 'Please provide question and answer')
      return
    }

    const card = {
      id: `custom_${Date.now()}`,
      deckId: newCardForm.deckId,
      qAr: newCardForm.qAr.trim(),
      qEn: newCardForm.qEn.trim() || newCardForm.qAr.trim(),
      aAr: newCardForm.aAr.trim(),
      aEn: newCardForm.aEn.trim() || newCardForm.aAr.trim(),
    }

    setCustomCards(prev => [...prev, card])
    setShowAddModal(false)
    setNewCardForm({ deckId: activeDeckId, qAr: '', qEn: '', aAr: '', aEn: '' })
    toast.success(isArabic ? 'تمت إضافة البطاقة إلى الحزمة بنجاح!' : 'Card added successfully!')
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-page max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold mb-2">
              <FiLayers size={14} />
              <span>{isArabic ? 'نظام البطاقات التعليمية التكراري' : 'Spaced Repetition Flashcards'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {isArabic ? 'مراجعة المفاهيم والامتحانات' : 'Exam Flashcards & Leitner Review'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
              {isArabic
                ? 'ثبّت المفاهيم المعقدة وقوانين الشبكات وهياكل البيانات بتقليب البطاقات الذكي ثلاثي الأبعاد.'
                : 'Master CS formulas and core concepts with 3D flip repetition.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
          >
            <FiPlus size={16} />
            <span>{isArabic ? 'إضافة بطاقة مخصصة' : 'Add Custom Card'}</span>
          </button>
        </div>

        {/* Deck Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {DEFAULT_DECKS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setActiveDeckId(d.id)
                setCardIndex(0)
                setIsFlipped(false)
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                activeDeckId === d.id
                  ? 'bg-royal-600 text-white shadow-md shadow-royal-600/25'
                  : 'glass text-slate-600 dark:text-white/70 hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span>{isArabic ? d.titleAr : d.titleEn}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${activeDeckId === d.id ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500'}`}>
                {d.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Deck Progress Bar */}
        <div className="glass rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-500 dark:text-white/60">
              {isArabic ? `البطاقة ${cardIndex + 1} من أصل ${totalCards}` : `Card ${cardIndex + 1} of ${totalCards}`}
            </span>
            <span className="text-emerald-500 flex items-center gap-1">
              <FiCheckCircle size={14} />
              <span>{stats.mastered} {isArabic ? 'متقنة' : 'Mastered'}</span>
            </span>
            {stats.needReview > 0 && (
              <span className="text-amber-500 flex items-center gap-1">
                <FiRotateCcw size={14} />
                <span>{stats.needReview} {isArabic ? 'تحتاج مراجعة' : 'Review'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 min-w-[180px]">
            <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-ink tabular-nums">{stats.pct}%</span>
          </div>
        </div>

        {/* 3D Flip Card Container */}
        {currentCard ? (
          <div className="flex flex-col items-center space-y-6">
            <div
              className="w-full max-w-xl h-80 sm:h-96 cursor-pointer select-none perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative rounded-3xl p-8 border border-white/15 glass shadow-2xl flex flex-col justify-between transition-transform duration-500"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                {/* Front Side */}
                <div
                  className={`absolute inset-0 p-8 flex flex-col justify-between backface-hidden ${
                    isFlipped ? 'pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-royal-500/10 text-royal-600 dark:text-cyan-400">
                      {isArabic ? 'سؤال / مفهوم' : 'Question / Concept'}
                    </span>
                    <span className="text-[11px]">{isArabic ? 'انقر للقلب ورؤية الحل 🔄' : 'Click to flip 🔄'}</span>
                  </div>

                  <div className="my-auto text-center px-4">
                    <h2 className="text-lg sm:text-2xl font-black text-ink leading-relaxed">
                      {isArabic ? currentCard.qAr : currentCard.qEn}
                    </h2>
                  </div>

                  <div className="text-center text-xs text-slate-400">
                    {isArabic ? 'اضغط Space أو انقر للتحقق من الإجابة' : 'Tap to reveal answer'}
                  </div>
                </div>

                {/* Back Side (Rotated 180) */}
                <div
                  className={`absolute inset-0 p-8 flex flex-col justify-between backface-hidden ${
                    !isFlipped ? 'pointer-events-none' : ''
                  }`}
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {isArabic ? 'الإجابة والشرح النموذجي' : 'Answer & Explanation'}
                    </span>
                    <span className="text-[11px]">{isArabic ? 'انقر للعودة للسؤال 🔄' : 'Click to flip back'}</span>
                  </div>

                  <div className="my-auto text-center px-4">
                    <p className="text-sm sm:text-base font-medium text-ink leading-relaxed whitespace-pre-line">
                      {isArabic ? currentCard.aAr : currentCard.aEn}
                    </p>
                  </div>

                  <div className="text-center text-xs text-slate-400">
                    {isArabic ? 'كيف كان تذكرك لهذه الإجابة؟ قيّم نفسك بالأسفل 👇' : 'Rate your recall below 👇'}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Leitner Rating Controls */}
            <div className="flex items-center gap-3 flex-wrap justify-center w-full max-w-xl">
              <button
                type="button"
                onClick={() => markCard('hard')}
                className="flex-1 min-w-[120px] py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <span>🔴</span>
                <span>{isArabic ? 'صعب / مراجعة' : 'Hard / Review'}</span>
              </button>

              <button
                type="button"
                onClick={() => markCard('medium')}
                className="flex-1 min-w-[120px] py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <span>🟡</span>
                <span>{isArabic ? 'متوسط / لا بأس' : 'Medium / Good'}</span>
              </button>

              <button
                type="button"
                onClick={() => markCard('mastered')}
                className="flex-1 min-w-[120px] py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <span>🟢</span>
                <span>{isArabic ? 'متقن / سهل' : 'Easy / Mastered'}</span>
              </button>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={prevCard}
                className="p-3 rounded-2xl glass hover:bg-black/5 dark:hover:bg-white/10 text-ink transition"
                aria-label="Previous card"
              >
                <FiChevronRight size={20} className={isArabic ? '' : 'rotate-180'} />
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-2.5 rounded-2xl glass hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold text-ink transition"
              >
                {isArabic ? 'اقلب البطاقة (Space)' : 'Flip Card (Space)'}
              </button>

              <button
                type="button"
                onClick={nextCard}
                className="p-3 rounded-2xl glass hover:bg-black/5 dark:hover:bg-white/10 text-ink transition"
                aria-label="Next card"
              >
                <FiChevronLeft size={20} className={isArabic ? '' : 'rotate-180'} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Add Custom Card Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/10 space-y-5 bg-white dark:bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                <h3 className="text-base font-extrabold text-ink">
                  {isArabic ? 'إضافة بطاقة مراجعة جديدة' : 'Add New Flashcard'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-ink transition"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustomCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1">
                    {isArabic ? 'الحزمة / المساق' : 'Target Deck'}
                  </label>
                  <select
                    value={newCardForm.deckId}
                    onChange={(e) => setNewCardForm({ ...newCardForm, deckId: e.target.value })}
                    className="input-spatial w-full text-xs font-semibold px-3 py-2 rounded-xl text-ink"
                  >
                    {DEFAULT_DECKS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isArabic ? d.titleAr : d.titleEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1">
                    {isArabic ? 'السؤال أو المفهوم (Question)' : 'Question (Arabic or English)'}
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={newCardForm.qAr}
                    onChange={(e) => setNewCardForm({ ...newCardForm, qAr: e.target.value })}
                    placeholder={isArabic ? 'اكتب السؤال هنا...' : 'Type question...'}
                    className="input-spatial w-full text-xs px-3 py-2 rounded-xl text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-white/70 mb-1">
                    {isArabic ? 'الإجابة أو الحل النموذجي (Answer)' : 'Answer & Explanation'}
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={newCardForm.aAr}
                    onChange={(e) => setNewCardForm({ ...newCardForm, aAr: e.target.value })}
                    placeholder={isArabic ? 'اكتب الشرح أو الإجابة هنا...' : 'Type answer...'}
                    className="input-spatial w-full text-xs px-3 py-2 rounded-xl text-ink focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl glass text-xs font-bold text-slate-600 dark:text-white/70"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-xs font-bold transition"
                  >
                    {isArabic ? 'حفظ البطاقة' : 'Save Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
