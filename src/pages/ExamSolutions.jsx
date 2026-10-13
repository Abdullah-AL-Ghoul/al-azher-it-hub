import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import PageHero from '../components/shared/PageHero'
import {
  FiFileText,
  FiSearch,
  FiBookOpen,
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiBookmark,
  FiEdit3,
  FiCheck,
  FiAward,
  FiHelpCircle,
  FiLayers
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'

const EXAM_QUESTIONS = [
  {
    id: 'ds-2024-mid-1',
    courseId: 'data-structures',
    courseNameAr: 'هياكل البيانات والخوارزميات (Data Structures)',
    courseNameEn: 'Data Structures & Algorithms',
    examType: 'midterm',
    termLabelAr: 'امتحان نصفي 2024',
    termLabelEn: 'Midterm Exam 2024',
    marks: 12,
    topic: 'Trees & Recursion',
    qAr: 'أوجد الارتفاع الأقصى (Max Height) لشجرة بحث ثنائية (BST) مع كتابة كود تكراري (Recursive Algorithm) بلغة C++ أو جافا، مع إثبات التعقيد الزمني والمكاني.',
    qEn: 'Find the maximum height of a Binary Search Tree (BST) using a recursive algorithm in C++/Java, stating the Time and Space complexity.',
    contextCode: `// كود البداية المتاح في ورقة الامتحان:
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};`,
    steps: [
      {
        stepNum: 1,
        titleAr: 'تحديد الحالة الأساسية للتوقف (Base Case)',
        titleEn: 'Define the Base Case',
        contentAr: 'إذا كانت العقدة الحالية فارغة (nullptr/null)، فإن ارتفاعها هو 0 (أو -1 إذا تم تعريف ارتفاع العقدة الفردية بـ 0). الاصطلاح الأكاديمي الشائع في امتحانات الكلية يعتمد أن الشجرة الفارغة ارتفاعها 0.',
        contentEn: 'If the node is null, the height is 0 (or -1 depending on edge vs node height convention). Azher exams standardly define empty tree height as 0.',
      },
      {
        stepNum: 2,
        titleAr: 'الاستدعاء الذاتي للفرعين الأيمن والأيسر (Recursive Calls)',
        titleEn: 'Compute Subtree Heights',
        contentAr: 'نقوم بحساب ارتفاع الفرع الأيسر `int leftH = maxDepth(root->left)` وارتفاع الفرع الأيمن `int rightH = maxDepth(root->right)` بشكل متوازي في شجرة الاستدعاء.',
        contentEn: 'Compute left and right subtree heights recursively: leftH = maxDepth(root->left); rightH = maxDepth(root->right);',
      },
      {
        stepNum: 3,
        titleAr: 'دمج النتائج مع إضافة العقدة الحالية',
        titleEn: 'Combine and Return Max',
        contentAr: 'نأخذ القيمة الأكبر بين الفرعين ونضيف 1 للعقدة الحالية:\n`return 1 + std::max(leftH, rightH);`',
        contentEn: 'Take the maximum of both and add 1 for the current node: return 1 + max(leftH, rightH);',
      },
      {
        stepNum: 4,
        titleAr: 'تحليل التعقيد الحسابي (Complexity Analysis)',
        titleEn: 'Complexity Proof',
        contentAr: '• التعقيد الزمني: O(N) لأن كل عقدة تُزار مرة واحدة بالضبط.\n• التعقيد المكاني: O(H) حيث H هو ارتفاع الشجرة (في أسوأ حالة لشجرة مائلة Degenerate Tree يكون O(N)، وفي الحالة المتوازنة يكون O(log N)).',
        contentEn: 'Time Complexity: O(N) as each node is visited once. Space Complexity: O(H) stack frames, where H is tree height (O(log N) balanced, O(N) degenerate).',
      }
    ],
    doctorNoteAr: 'تنبيه الدكتور: أغلب الطلاب يخسرون علامتين لنسيان فحص nullptr في البداية مما يسبب Crash (Segmentation Fault)، احرص دائماً على كتابة سطر Base Case أولاً!',
    doctorNoteEn: 'Doctor Note: Most marks are lost by missing the nullptr base case leading to runtime segmentation faults. Always guard base cases first!'
  },
  {
    id: 'db-2024-fin-1',
    courseId: 'databases',
    courseNameAr: 'أنظمة قواعد البيانات و SQL (Database Systems)',
    courseNameEn: 'Database Systems & SQL',
    examType: 'final',
    termLabelAr: 'امتحان نهائي 2024',
    termLabelEn: 'Final Exam 2024',
    marks: 15,
    topic: 'Normalization 3NF & BCNF',
    qAr: 'لديك الجدول R(A, B, C, D, E) مع التبعيات الوظيفية:\nFDs: { A -> B, B -> C, CD -> E, E -> A }\n1. أوجد جميع المفاتيح المرشحة (Candidate Keys).\n2. بيّن ما إذا كان الجدول في النموذج المعياري الثالث (3NF) أو نموذج بويس-كود (BCNF) مع التعليل الرياضي.',
    qEn: 'Given relation R(A, B, C, D, E) with FDs: { A -> B, B -> C, CD -> E, E -> A }\n1. Find all candidate keys.\n2. Determine if R is in 3NF or BCNF with formal proof.',
    contextCode: `FDs:
1) A -> B
2) B -> C
3) CD -> E
4) E -> A`,
    steps: [
      {
        stepNum: 1,
        titleAr: 'حساب غلاف الصفات (Attribute Closure) وإيجاد المفاتيح المرشحة',
        titleEn: 'Calculate Attribute Closures & Keys',
        contentAr: 'الصفة D لا تظهر في أي طرف أيمن (RHS)، إذاً يجب أن تكون موجودة في كل مفتاح مرشح.\n• نفحص (AD)+: A->B, B->C, (CD)->E => يغطي {A, B, C, D, E}. إذاً (AD) مفتاح مرشح.\n• نفحص (BD)+: B->C, CD->E, E->A => يغطي الكل. إذاً (BD) مفتاح مرشح.\n• نفحص (ED)+: E->A, A->B, B->C, CD->E => يغطي الكل. إذاً (ED) مفتاح مرشح.\n• نفحص (CD)+: CD->E, E->A, A->B => يغطي الكل. إذاً (CD) مفتاح مرشح.\nالمفاتيح المرشحة هي: { AD, BD, CD, ED }.',
        contentEn: 'Attribute D never appears on the RHS of any FD, so D must be in every candidate key. Checking closures: (AD)+, (BD)+, (CD)+, (ED)+ all yield R+. Candidate Keys: { AD, BD, CD, ED }.',
      },
      {
        stepNum: 2,
        titleAr: 'فحص شروط النموذج المعياري الثالث (3NF Check)',
        titleEn: 'Verify 3NF Conditions',
        contentAr: 'لكل تبعية X -> Y، يجب أن يتحقق أحد الشرطين:\nأ) X مفتاح فائق (Superkey).\nب) كل صفة في Y هي صفة رئيسية (Prime Attribute تنتمي لمفتاح مرشح).\nجميع الصفات {A, B, C, D, E} هي صفات رئيسية لأنها تظهر داخل المفاتيح المرشحة الأربعة!\nبما أن الطرف الأيمن في كل FD يتكون من صفة رئيسية، فإن الجدول R يقع بالكامل في 3NF.',
        contentEn: 'All attributes {A, B, C, D, E} are prime attributes because each belongs to at least one candidate key. Hence, every FD satisfies the prime attribute condition: R is in 3NF.',
      },
      {
        stepNum: 3,
        titleAr: 'فحص نموذج بويس-كود (BCNF Check)',
        titleEn: 'Verify BCNF Condition',
        contentAr: 'في BCNF، يجب أن يكون الطرف الأيسر X في كل FD مفتاحاً فائقاً دون استثناء.\n• في التبعية A -> B: الصفة A وحدها ليست مفتاحاً فائقاً (المفتاح هو AD).\n• إذن: الجدول R ليس في BCNF (Not BCNF).',
        contentEn: 'In BCNF, every left-hand side X must be a superkey. In A -> B, A alone is not a superkey. Therefore, R is NOT in BCNF.',
      }
    ],
    doctorNoteAr: 'ملاحظة التصحيح الأكاديمي: انتبه إلى أن الصفة D مفتاحية لا يمكن الاستغناء عنها، وكثير من الطلبة ينسون أن جميع الصفات أصبحت Prime Attributes مما يجعل الجدول 3NF تلقائياً!',
    doctorNoteEn: 'Grading tip: Notice that attribute D is indispensable. Because all attributes belong to at least one key, every attribute is prime, fulfilling 3NF.'
  },
  {
    id: 'se-2024-fin-1',
    courseId: 'software-engineering',
    courseNameAr: 'هندسة البرمجيات والتصميم (Software Engineering)',
    courseNameEn: 'Software Engineering & Architecture',
    examType: 'final',
    termLabelAr: 'امتحان نهائي 2024',
    termLabelEn: 'Final Exam 2024',
    marks: 14,
    topic: 'Design Patterns & SOLID',
    qAr: 'اشرح مبدأ Open/Closed Principle (OCP) من مبادئ SOLID مع تقديم سيناريو لمخالفة المبدأ في معالجة طرق الدفع (Payment Gateway)، ثم أعد هيكلة الكود باستخدام نمط Strategy Pattern لتطبيق المبدأ.',
    qEn: 'Explain the Open/Closed Principle (OCP) in SOLID. Show a code violation for a payment processing system and refactor it using the Strategy Design Pattern.',
    contextCode: `// الكود المخالف للمبدأ (Violation):
class PaymentProcessor {
    public void processPayment(String type, double amount) {
        if (type.equals("CREDIT_CARD")) {
            // معالجة البطاقة
        } else if (type.equals("PAYPAL")) {
            // معالجة بايبال
        } else if (type.equals("CRYPTO")) {
            // معالجة العملات
        }
        // إضافة أي طريقة دفع جديدة تتطلب تعديل هذا الكلاس!
    }
}`,
    steps: [
      {
        stepNum: 1,
        titleAr: 'تعريف مبدأ Open/Closed Principle',
        titleEn: 'Define Open/Closed Principle',
        contentAr: '"البرمجيات يجب أن تكون مفتوحة للتوسعة (Open for Extension) ومغلقة أمام التعديل (Closed for Modification)". يعني ذلك إضافة ميزات وطرق دفع جديدة بدون المساس بالكود المختبر والمعتمد مسبقاً.',
        contentEn: 'Software entities should be open for extension, but closed for modification. Adding a new payment method should not modify existing tested classes.',
      },
      {
        stepNum: 2,
        titleAr: 'إنشاء الواجهة البرمجية المجردة (Strategy Interface)',
        titleEn: 'Create Strategy Interface',
        contentAr: `public interface PaymentStrategy {
    void pay(double amount);
}`,
        contentEn: `public interface PaymentStrategy {\n    void pay(double amount);\n}`,
      },
      {
        stepNum: 3,
        titleAr: 'تنفيذ الاستراتيجيات المنفصلة (Concrete Strategies)',
        titleEn: 'Implement Concrete Strategies',
        contentAr: `public class CreditCardPayment implements PaymentStrategy {
    public void pay(double amount) { System.out.println("Paid with Credit Card: " + amount); }
}
public class PayPalPayment implements PaymentStrategy {
    public void pay(double amount) { System.out.println("Paid with PayPal: " + amount); }
}`,
        contentEn: 'Implement separate payment classes implementing PaymentStrategy for each provider.',
      },
      {
        stepNum: 4,
        titleAr: 'فصل كلاس التنفيذ وتمرير الاستراتيجية (Dependency Injection)',
        titleEn: 'Refactor Context Class',
        contentAr: `public class PaymentContext {
    private PaymentStrategy strategy;
    public PaymentContext(PaymentStrategy strategy) { this.strategy = strategy; }
    public void executePayment(double amount) { strategy.pay(amount); }
}
// الآن لإضافة Apple Pay نقوم فقط بإنشاء كلاس جديد دون لمس PaymentContext!`,
        contentEn: 'Pass PaymentStrategy via constructor to PaymentContext. New payment methods only require a new class implementing the interface.',
      }
    ],
    doctorNoteAr: 'ملاحظة الأستاذ: لا تكتفِ بالتعريف النظري، وضع كود الـ Interface والـ Concrete Classes هو ما يمنحك الدرجة الكاملة في السؤال المعماري.',
    doctorNoteEn: 'Academic Note: Theoretical definition alone earns partial marks. Drawing the UML or writing interface code secures full marks.'
  },
  {
    id: 'net-2024-mid-1',
    courseId: 'networks',
    courseNameAr: 'شبكات الحاسوب والبروتوكولات (Computer Networks)',
    courseNameEn: 'Computer Networks & Protocols',
    examType: 'midterm',
    termLabelAr: 'امتحان نصفي 2024',
    termLabelEn: 'Midterm Exam 2024',
    marks: 10,
    topic: 'TCP Three-Way Handshake & Subnetting',
    qAr: '1. اشرح بالتفصيل مع الرسم التوضيحي خطوات المصافحة الثلاثية (TCP 3-Way Handshake) لإنشاء اتصال موثوق.\n2. إذا كان عنوان الشبكة 192.168.10.0/24 والمطلوب تقسيمها إلى 4 شبكات فرعية (Subnets)، أوجد قناع الشبكة الفرعية الجديد (Subnet Mask) وعدد الأجهزة المتاحة (Usable Hosts) في كل شبكة.',
    qEn: '1. Explain the TCP 3-Way Handshake connection establishment with sequence numbers.\n2. Subnet 192.168.10.0/24 into 4 equal subnets. Calculate the new Subnet Mask and usable hosts per subnet.',
    contextCode: `TCP Handshake Flags: SYN, SYN-ACK, ACK
Subnetting Target: 4 subnets from /24 block`,
    steps: [
      {
        stepNum: 1,
        titleAr: 'خطوات مصافحة TCP الثلاثية',
        titleEn: 'TCP Handshake Sequence',
        contentAr: '1. الخطوة الأولى (SYN): العميل يرسل حزمة TCP براية SYN=1 مع رقم تسلسلي عشوائي Seq = x.\n2. الخطوة الثانية (SYN-ACK): الخادم يستجيب بـ SYN=1 و ACK=1 مع Seq = y ورقم إشعار Ack = x + 1.\n3. الخطوة الثالثة (ACK): العميل يرسل ACK=1 مع Ack = y + 1. بعد هذه الخطوة يتم تأسيس جلسة الاتصال وبدء نقل البيانات بأمان.',
        contentEn: 'Step 1: Client sends SYN (Seq=x). Step 2: Server responds with SYN-ACK (Seq=y, Ack=x+1). Step 3: Client acknowledges with ACK (Ack=y+1). Connection is established.',
      },
      {
        stepNum: 2,
        titleAr: 'حساب استعارة البتات لتقسيم الشبكة (Subnetting Math)',
        titleEn: 'Bit Borrowing & Mask Calculation',
        contentAr: '• نحتاج 4 شبكات فرعية: 2^n >= 4 => نستعير n = 2 بت من خانة الأجهزة.\n• البادئة الجديدة: /24 + 2 = /26.\n• قناع الشبكة الجديد (Subnet Mask): 255.255.255.192 (لأن 128 + 64 = 192).\n• حجم القفزة (Block Size): 256 - 192 = 64 عنوان في كل شبكة.',
        contentEn: 'Borrowing 2 bits yields 4 subnets: /24 + 2 = /26. New Subnet Mask: 255.255.255.192. Block size: 64 addresses per subnet.',
      },
      {
        stepNum: 3,
        titleAr: 'حساب عدد الأجهزة الفعلية المتاحة (Usable Hosts)',
        titleEn: 'Usable Hosts per Subnet',
        contentAr: 'عدد البتات المتبقية للأجهزة: 8 - 2 = 6 بت.\nعدد الأجهزة الإجمالي: 2^6 = 64.\nعدد الأجهزة القابلة للاستخدام: 2^6 - 2 = 62 جهاز لكل شبكة (يتم استبعاد عنوان الشبكة Network ID وعنوان البث العام Broadcast IP).',
        contentEn: 'Usable hosts: 2^6 - 2 = 62 usable IP addresses per subnet (subtracting network and broadcast IDs).',
      }
    ],
    doctorNoteAr: 'تنبيه الامتحان: خصم علامة مباشر لمن ينسى طرح 2 (Network IP + Broadcast IP) عند حساب الأجهزة المتاحة!',
    doctorNoteEn: 'Exam Warning: 1 mark deducted if you forget to subtract 2 for network and broadcast addresses.'
  },
  {
    id: 'oop-2024-fin-1',
    courseId: 'oop',
    courseNameAr: 'البرمجة كائنية التوجه (OOP C++ & Java)',
    courseNameEn: 'Object Oriented Programming',
    examType: 'final',
    termLabelAr: 'امتحان نهائي 2024',
    termLabelEn: 'Final Exam 2024',
    marks: 10,
    topic: 'Polymorphism & Virtual Destructors',
    qAr: 'لماذا يجب جعل الـ Destructor دالة وهمية (Virtual Destructor) في الكلاس الأب (Base Class) عند استخدام الوراثة في C++؟ اكتب مثالاً برمجياً يوضح خطورة عدم كتابة virtual على إدارة الذاكرة.',
    qEn: 'Why must a base class destructor be declared virtual when using polymorphism in C++? Provide code illustrating the memory leak hazard.',
    contextCode: `Base* ptr = new Derived();
delete ptr; // ماذا يحدث لو لم يكن ~Base() معرّفاً كـ virtual؟`,
    steps: [
      {
        stepNum: 1,
        titleAr: 'توضيح سلوك الحذف غير المعرّف (Undefined Behavior)',
        titleEn: 'Static Binding vs Dynamic Binding',
        contentAr: 'عند حذف كائن من النوع المشتق (Derived) عبر مؤشر من النوع الأساسي (Base*)، إذا لم يكن الـ Destructor معرّفاً كـ `virtual`، يقوم المترجم بربط الاستدعاء استاتيكياً (Early/Static Binding) فيتم استدعاء `~Base()` فقط ولا يتم استدعاء `~Derived()`.',
        contentEn: 'Deleting a derived instance through a base pointer without a virtual destructor results in static binding, invoking only ~Base() and leaking ~Derived() resources.',
      },
      {
        stepNum: 2,
        titleAr: 'حدوث تسريب الذاكرة (Memory Leak Hazard)',
        titleEn: 'Memory Leak Illustration',
        contentAr: `class Base {
public:
    virtual ~Base() { std::cout << "Base Cleaned\\n"; } // virtual يضمن استدعاء المشتق أولاً
};
class Derived : public Base {
    int* buffer;
public:
    Derived() { buffer = new int[1000]; }
    ~Derived() { 
        delete[] buffer; 
        std::cout << "Derived Buffer Freed\\n"; 
    }
};`,
        contentEn: 'Virtual ensures the derived destructor runs first, cleanly deallocating dynamic memory arrays before base destruction.',
      }
    ],
    doctorNoteAr: 'سؤال متكرر سنوياً في امتحانات الكلية والمقابلات التقنية، تذكر أن التدمير يسير دائماً بعكس اتجاه البناء (من Derived إلى Base).',
    doctorNoteEn: 'Annual exam question: destruction order executes in reverse order of construction (Derived first, then Base).'
  }
]

export default function ExamSolutions() {
  const { lang } = useLanguage()
  const isArabic = lang === 'ar'

  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [revealedSolutions, setRevealedSolutions] = useState({})
  const [scratchpads, setScratchpads] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_exam_scratchpads')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('al_azher_bookmarked_exams')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [activeScratchpadId, setActiveScratchpadId] = useState(null)

  const toggleSolution = (id) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id)
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem('al_azher_bookmarked_exams', JSON.stringify(updated))
      } catch {
        // ignore
      }
      toast.success(
        exists
          ? (isArabic ? 'تمت إزالة السؤال من المراجعة' : 'Removed from review bookmarks')
          : (isArabic ? 'تم حفظ السؤال لمراجعة ليلة الامتحان ⭐' : 'Saved for exam night review ⭐')
      )
      return updated
    })
  }

  const handleScratchpadChange = (id, text) => {
    setScratchpads((prev) => {
      const updated = { ...prev, [id]: text }
      try {
        localStorage.setItem('al_azher_exam_scratchpads', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  const filteredQuestions = useMemo(() => {
    return EXAM_QUESTIONS.filter((q) => {
      if (selectedCourse !== 'all' && q.courseId !== selectedCourse) return false
      if (selectedType !== 'all' && q.examType !== selectedType) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const text = `${q.courseNameAr} ${q.courseNameEn} ${q.qAr} ${q.qEn} ${q.topic}`.toLowerCase()
        if (!text.includes(query)) return false
      }
      return true
    })
  }, [selectedCourse, selectedType, searchQuery])

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHero
          title={isArabic ? 'بنك حلول الامتحانات السابقة خطوة بخطوة' : 'Interactive Past Exams Solver'}
          subtitle={
            isArabic
              ? 'حلول نموذجية تفصيلية لأسئلة الامتحانات النصفية والنهائية لكلية تكنولوجيا المعلومات مع تنبيهات وملاحظات أساتذة المساقات ومسودة تجريبية لكل سؤال.'
              : 'Step-by-step model solutions for Al-Azher IT midterm and final exams with doctor academic tips, grading rubrics, and interactive scratchpads.'
          }
          icon={FiFileText}
          gradient="from-emerald-600 via-teal-600 to-cyan-600"
          badge={isArabic ? 'حلول نموذجية معتمدة' : 'Verified Model Solutions'}
        />

        {/* Filters and Search Bar */}
        <div className="glass rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute top-1/2 -translate-y-1/2 start-3.5 text-slate-400" size={17} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'ابحث في أسئلة الامتحانات، المفاهيم، المساقات...' : 'Search questions, concepts, courses...'}
                className="input-spatial w-full ps-10 pe-4 py-2.5 rounded-2xl text-xs text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* Course Filter */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <span className="text-xs font-bold text-slate-400 me-2">{isArabic ? 'المساق:' : 'Course:'}</span>
              {[
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'data-structures', labelAr: 'هياكل بيانات', labelEn: 'Data Structures' },
                { id: 'databases', labelAr: 'قواعد بيانات', labelEn: 'Databases' },
                { id: 'software-engineering', labelAr: 'هندسة برمجيات', labelEn: 'Software Eng' },
                { id: 'networks', labelAr: 'شبكات', labelEn: 'Networks' },
                { id: 'oop', labelAr: 'OOP', labelEn: 'OOP' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourse(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    selectedCourse === c.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'glass border-white/10 text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {isArabic ? c.labelAr : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Type Filter & Bookmarks Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">{isArabic ? 'نوع الامتحان:' : 'Type:'}</span>
              {[
                { id: 'all', labelAr: 'جميع الامتحانات', labelEn: 'All Exams' },
                { id: 'midterm', labelAr: 'نصفي (Midterm)', labelEn: 'Midterm' },
                { id: 'final', labelAr: 'نهائي (Final)', labelEn: 'Final' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    selectedType === t.id
                      ? 'bg-black/10 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {isArabic ? t.labelAr : t.labelEn}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1">
                <FiBookmark className="text-amber-500" />
                <span>{isArabic ? `المحفوظ للمراجعة: ${bookmarkedIds.length}` : `Bookmarked: ${bookmarkedIds.length}`}</span>
              </span>
              <span>•</span>
              <span>{isArabic ? `عرض ${filteredQuestions.length} سؤال` : `Showing ${filteredQuestions.length} questions`}</span>
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-white/10 space-y-3">
              <FiHelpCircle className="mx-auto text-slate-400" size={36} />
              <p className="text-sm font-bold text-ink">
                {isArabic ? 'لم يتم العثور على أسئلة مطابقة للبحث' : 'No matching exam questions found'}
              </p>
              <p className="text-xs text-slate-400">
                {isArabic ? 'جرب تغيير المساق أو إزالة كلمات البحث' : 'Try clearing filters or search terms'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isRevealed = !!revealedSolutions[q.id]
              const isBookmarked = bookmarkedIds.includes(q.id)
              const hasScratchpad = activeScratchpadId === q.id
              const scratchpadText = scratchpads[q.id] || ''

              return (
                <motion.div
                  key={q.id}
                  layout
                  className="glass rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6 shadow-sm hover:border-emerald-500/30 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                        <FiBookOpen size={18} />
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-ink">
                          {isArabic ? q.courseNameAr : q.courseNameEn}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 font-semibold">
                            {isArabic ? q.termLabelAr : q.termLabelEn}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{q.marks} {isArabic ? 'علامة' : 'Marks'}</span>
                          <span>•</span>
                          <span className="text-slate-400">{q.topic}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(q.id)}
                        className={`p-2.5 rounded-xl border transition ${
                          isBookmarked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                            : 'glass border-white/10 text-slate-400 hover:text-ink'
                        }`}
                        title={isArabic ? 'حفظ لمراجعة ليلة الامتحان' : 'Bookmark for Exam Night'}
                        aria-label="Bookmark question"
                      >
                        <FiBookmark size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveScratchpadId(hasScratchpad ? null : q.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                          hasScratchpad || scratchpadText
                            ? 'bg-royal-500/10 border-royal-500/30 text-accent dark:text-cyan-400'
                            : 'glass border-white/10 text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <FiEdit3 size={14} />
                        <span>{isArabic ? 'مسودة الحل' : 'Scratchpad'}</span>
                        {scratchpadText && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-3">
                    <p className="text-sm font-semibold text-ink leading-relaxed whitespace-pre-line">
                      {isArabic ? q.qAr : q.qEn}
                    </p>

                    {q.contextCode && (
                      <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto text-left border border-white/10">
                        <code>{q.contextCode}</code>
                      </pre>
                    )}
                  </div>

                  {/* Optional Interactive Student Scratchpad */}
                  {hasScratchpad && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-2xl bg-royal-500/5 border border-royal-500/20 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-accent dark:text-cyan-400">
                        <span className="flex items-center gap-1.5">
                          <FiEdit3 size={14} />
                          {isArabic ? 'مسودة محاولتك التجريبية (تحفظ تلقائياً)' : 'Your Trial Scratchpad (Auto-saved)'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {scratchpadText.length} {isArabic ? 'حرف' : 'chars'}
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={scratchpadText}
                        onChange={(e) => handleScratchpadChange(q.id, e.target.value)}
                        placeholder={
                          isArabic
                            ? 'اكتب خطواتك، شفرتك، أو تفكيرك هنا قبل كشف الحل النموذجي لاختبار جاهزيتك...'
                            : 'Jot down your solution attempt or pseudocode here before viewing model answer...'
                        }
                        className="w-full p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-black/10 dark:border-white/10 text-xs text-ink placeholder:text-slate-400 font-mono focus:outline-none focus:border-royal-500"
                      />
                    </motion.div>
                  )}

                  {/* Doctor Academic Note & Warning */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                    <FiAlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <span className="font-bold">{isArabic ? 'تنبيه أستاذ المساق الأكاديمي:' : 'Doctor Note & Rubric Warning:'}</span>
                      <p className="leading-relaxed">{isArabic ? q.doctorNoteAr : q.doctorNoteEn}</p>
                    </div>
                  </div>

                  {/* Toggle Solution Reveal Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => toggleSolution(q.id)}
                      className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        isRevealed
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'glass border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {isRevealed ? (
                        <>
                          <FiChevronUp size={16} />
                          <span>{isArabic ? 'إخفاء خطوات الحل النموذجي' : 'Hide Step-by-Step Model Solution'}</span>
                        </>
                      ) : (
                        <>
                          <FiChevronDown size={16} />
                          <span>{isArabic ? 'كشف خطوات الحل النموذجي خطوة بخطوة' : 'Reveal Step-by-Step Model Solution'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Step-by-Step Solution Breakdown */}
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-3 border-t border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <FiCheckCircle size={15} />
                          <span>{isArabic ? 'خطوات الحل النموذجي المعتمد في التصحيح:' : 'Graded Step-by-Step Breakdown:'}</span>
                        </div>

                        <div className="space-y-3">
                          {q.steps.map((st) => (
                            <div
                              key={st.stepNum}
                              className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-ink">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                                  {st.stepNum}
                                </span>
                                <span>{isArabic ? st.titleAr : st.titleEn}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-white/80 leading-relaxed ps-7 whitespace-pre-line font-sans">
                                {isArabic ? st.contentAr : st.contentEn}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
