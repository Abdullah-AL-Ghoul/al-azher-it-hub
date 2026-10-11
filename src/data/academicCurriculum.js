/**
 * Al-Azhar University - Gaza | Academic Affairs
 * Faculty of Engineering & Information Technology
 * Official Accredited Study Plans Registry (سجل الخطط الدراسية المعتمدة)
 */

export const COURSE_TYPES = {
  university: { 
    labelAr: 'متطلب جامعة', 
    labelEn: 'University Requirement', 
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
  },
  college: { 
    labelAr: 'متطلب كلية', 
    labelEn: 'College Requirement', 
    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' 
  },
  major: { 
    labelAr: 'إجباري تخصص', 
    labelEn: 'Major Mandatory', 
    color: 'bg-royal-500/10 text-royal-600 dark:text-cyan-400 border-royal-500/20 dark:border-cyan-500/20' 
  },
  elective: { 
    labelAr: 'اختياري تخصص', 
    labelEn: 'Major Elective', 
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
  },
}

// ==============================================================================
// 1. هندسة أنظمة الحاسوب (2025) - خطة رقم 9312
// ==============================================================================
const PLAN_CSE_2025 = [
  {
    year: 1,
    yearNameAr: 'المستوى الأول (السنة الأولى)',
    yearNameEn: 'Level 1 (First Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cse_engl1201', code: 'ENGL1201', nameAr: 'اللغة الإنجليزية (1)', nameEn: 'English Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'cse_math1320', code: 'MATH1320', nameAr: 'تفاضل وتكامل (1)', nameEn: 'Calculus (1)', hours: 3, type: 'college', prereq: null },
          { id: 'cse_islm2201', code: 'ISLM2201', nameAr: 'دراسات في الحديث وعلومه', nameEn: 'Studies in Prophetic Tradition', hours: 2, type: 'university', prereq: null },
          { id: 'cse_itcc1301', code: 'ITCC1301', nameAr: 'دوائر كهربائية (1)', nameEn: 'Electric Circuits (1)', hours: 3, type: 'college', prereq: null },
          { id: 'cse_islm1101', code: 'ISLM1101', nameAr: 'قرآن كريم (1)', nameEn: 'Holy Quran (1)', hours: 1, type: 'university', prereq: null },
          { id: 'cse_itis1302', code: 'ITIS1302', nameAr: 'مبادئ الإدارة', nameEn: 'Introduction To Management', hours: 3, type: 'college', prereq: null },
          { id: 'cse_itcs1401', code: 'ITCS1401', nameAr: 'مقدمة في الحوسبة', nameEn: 'Introduction to Computing', hours: 4, type: 'college', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cse_itcc1311', code: 'ITCC1311', nameAr: 'إلكترونيات (1)', nameEn: 'Electronics (1)', hours: 3, type: 'college', prereq: 'ITCC1301' },
          { id: 'cse_arab1201', code: 'ARAB1201', nameAr: 'اللغة العربية (1)', nameEn: 'Arabic Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'cse_itcs1309', code: 'ITCS1309', nameAr: 'برمجة حاسوب (1)', nameEn: 'Computer Programming (1)', hours: 3, type: 'college', prereq: 'ITCS1401' },
          { id: 'cse_itcc2303', code: 'ITCC2303', nameAr: 'تصميم المنطق الرقمي', nameEn: 'Digital Logic Design', hours: 3, type: 'college', prereq: 'ITCC1311' },
          { id: 'cse_math1321', code: 'MATH1321', nameAr: 'تفاضل وتكامل (2)', nameEn: 'Calculus (2)', hours: 3, type: 'college', prereq: 'MATH1320' },
          { id: 'cse_islm1201', code: 'ISLM1201', nameAr: 'دراسات في الفقه', nameEn: 'Jurisprudence', hours: 2, type: 'university', prereq: null },
          { id: 'cse_geol3203', code: 'GEOL3203', nameAr: 'علوم البيئة', nameEn: 'Environmental Sciences', hours: 2, type: 'university', prereq: null },
          { id: 'cse_pals4212', code: 'PALS4212', nameAr: 'فلسطين الأرض والإنسان', nameEn: 'Palestinian Land and Human', hours: 2, type: 'university', prereq: null },
          { id: 'cse_itme1101', code: 'ITME1101', nameAr: 'مقدمة في الهندسة', nameEn: 'Introduction to Engineering', hours: 1, type: 'college', prereq: null },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'المستوى الثاني (السنة الثانية)',
    yearNameEn: 'Level 2 (Second Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cse_math2301', code: 'MATH2301', nameAr: 'احتمالات وإحصاء هندسي', nameEn: 'Statistics and Engineering Probabilities', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'cse_itcs2311', code: 'ITCS2311', nameAr: 'التراكيب المنفصلة', nameEn: 'Discrete Structures', hours: 3, type: 'major', prereq: 'MATH1320' },
          { id: 'cse_itcs2301', code: 'ITCS2301', nameAr: 'برمجة حاسوب (2)', nameEn: 'Computer Programming (2)', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cse_itcs2307', code: 'ITCS2307', nameAr: 'تراكيب البيانات', nameEn: 'Data Structures', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cse_itse2201', code: 'ITSE2201', nameAr: 'تكنولوجيا الشبكة العالمية', nameEn: 'Web Technology', hours: 2, type: 'major', prereq: 'ITCS1309' },
          { id: 'cse_itse2101', code: 'ITSE2101', nameAr: 'مختبر تكنولوجيا الشبكة العالمية', nameEn: 'Web Technology Lab', hours: 1, type: 'major', prereq: 'ITSE2201' },
          { id: 'cse_itse2301', code: 'ITSE2301', nameAr: 'مقدمة في هندسة البرمجيات', nameEn: 'Introduction to Software Engineering', hours: 3, type: 'major', prereq: 'ITCS1309' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cse_itcs2312', code: 'ITCS2312', nameAr: 'الخوارزميات', nameEn: 'Algorithms', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'cse_itse2202', code: 'ITSE2202', nameAr: 'برمجة متقدمة', nameEn: 'Advanced Programming', hours: 2, type: 'major', prereq: 'ITCS1309' },
          { id: 'cse_itse2204', code: 'ITSE2204', nameAr: 'تطوير تطبيقات الشبكة العالمية', nameEn: 'Web Applications Development', hours: 2, type: 'major', prereq: 'ITSE2201' },
          { id: 'cse_math2305', code: 'MATH2305', nameAr: 'جبر خطي (1)', nameEn: 'Linear Algebra (1)', hours: 3, type: 'major', prereq: 'MATH1320' },
          { id: 'cse_itse2102', code: 'ITSE2102', nameAr: 'مختبر برمجة متقدمة', nameEn: 'Advanced Programming Lab', hours: 1, type: 'major', prereq: 'ITSE2202' },
          { id: 'cse_itse2104', code: 'ITSE2104', nameAr: 'مختبر تطوير تطبيقات الشبكة العالمية', nameEn: 'Web Applications Development Lab', hours: 1, type: 'major', prereq: 'ITSE2204' },
          { id: 'cse_itse2103', code: 'ITSE2103', nameAr: 'مختبر نظم قواعد البيانات', nameEn: 'Database Systems Lab', hours: 1, type: 'major', prereq: 'ITSE2304' },
          { id: 'cse_itse2304', code: 'ITSE2304', nameAr: 'نظم قواعد البيانات', nameEn: 'Database Systems', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'cse_itse3304', code: 'ITSE3304', nameAr: 'هندسة متطلبات البرمجيات', nameEn: 'Software Requirements Engineering', hours: 3, type: 'major', prereq: 'ITSE2301' },
        ],
      },
      {
        semester: 3,
        semesterNameAr: 'الفصل الصيفي',
        semesterNameEn: 'Summer Semester',
        courses: [
          { id: 'cse_islm2105', code: 'ISLM2105', nameAr: 'قرآن كريم (2)', nameEn: 'Holy Quran (2)', hours: 1, type: 'university', prereq: null },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'المستوى الثالث (السنة الثالثة)',
    yearNameEn: 'Level 3 (Third Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cse_itcs3403', code: 'ITCS3403', nameAr: 'أنظمة التشغيل', nameEn: 'Operating Systems', hours: 4, type: 'major', prereq: null },
          { id: 'cse_itse4304', code: 'ITSE4304', nameAr: 'إدارة البرمجيات', nameEn: 'Software Management', hours: 3, type: 'major', prereq: 'ITSE2301' },
          { id: 'cse_itse3202', code: 'ITSE3202', nameAr: 'تصميم البرمجيات', nameEn: 'Software Design', hours: 2, type: 'major', prereq: 'ITSE3304' },
          { id: 'cse_islm2202', code: 'ISLM2202', nameAr: 'دراسات في العقيدة الإسلامية', nameEn: 'Studies in Islamic Faith', hours: 2, type: 'university', prereq: null },
          { id: 'cse_itcs4316', code: 'ITCS4316', nameAr: 'شبكات الحاسوب', nameEn: 'Computer Networks', hours: 3, type: 'major', prereq: 'ITCS3403' },
          { id: 'cse_islm3107', code: 'ISLM3107', nameAr: 'قرآن كريم (3)', nameEn: 'Holy Quran (3)', hours: 1, type: 'university', prereq: null },
          { id: 'cse_itse3201', code: 'ITSE3201', nameAr: 'قضايا اجتماعية ومهنية', nameEn: 'Social & Professional Issues', hours: 2, type: 'major', prereq: 'ITSE2301' },
          { id: 'cse_itse3102', code: 'ITSE3102', nameAr: 'مختبر تصميم البرمجيات', nameEn: 'Software Design Lab', hours: 1, type: 'major', prereq: 'ITSE3202' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cse_itse4202', code: 'ITSE4202', nameAr: 'العمل الحر في تكنولوجيا المعلومات', nameEn: 'Freelancing in IT', hours: 2, type: 'major', prereq: 'ITSE2204' },
          { id: 'cse_itse3101', code: 'ITSE3101', nameAr: 'تدريب ميداني', nameEn: 'Co-op Training', hours: 1, type: 'major', prereq: 'ITSE2204' },
          { id: 'cse_itse4310', code: 'ITSE4310', nameAr: 'تطوير التطبيقات المتحركة', nameEn: 'Mobile Applications Development', hours: 3, type: 'major', prereq: 'ITSE2204' },
          { id: 'cse_itse3203', code: 'ITSE3203', nameAr: 'تطوير ونمذجة البرمجيات', nameEn: 'Software Development & Prototyping', hours: 2, type: 'major', prereq: 'ITSE3202' },
          { id: 'cse_itcs3310', code: 'ITCS3310', nameAr: 'جرافيك حاسوب', nameEn: 'Computer Graphics', hours: 3, type: 'elective', prereq: 'MATH2305' },
          { id: 'cse_islm3201', code: 'ISLM3201', nameAr: 'دراسات في التفسير وعلوم القرآن', nameEn: 'Interpretation of Quran', hours: 2, type: 'university', prereq: null },
          { id: 'cse_islm4113', code: 'ISLM4113', nameAr: 'قرآن كريم (4)', nameEn: 'Holy Quran (4)', hours: 1, type: 'university', prereq: null },
          { id: 'cse_itse3104', code: 'ITSE3104', nameAr: 'مختبر تطوير التطبيقات المتحركة', nameEn: 'Mobile Applications Development Lab', hours: 1, type: 'major', prereq: 'ITSE4310' },
          { id: 'cse_itse3103', code: 'ITSE3103', nameAr: 'مختبر تطوير ونمذجة البرمجيات', nameEn: 'Software Development & Prototyping Lab', hours: 1, type: 'major', prereq: 'ITSE3203' },
          { id: 'cse_itcs2308', code: 'ITCS2308', nameAr: 'هيكلية حاسوب ولغة أسمبلي', nameEn: 'Computer Architecture & Assembly', hours: 3, type: 'elective', prereq: 'ITCC1311' },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'المستوى الرابع (السنة الرابعة)',
    yearNameEn: 'Level 4 (Fourth Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cse_itcs4301', code: 'ITCS4301', nameAr: 'أمن المعلومات', nameEn: 'Information Security', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cse_itcs4319', code: 'ITCS4319', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'cse_itse4312', code: 'ITSE4312', nameAr: 'تصميم البرمجيات - متقدم', nameEn: 'Advanced Software Design', hours: 3, type: 'major', prereq: 'ITSE3202' },
          { id: 'cse_itse4101', code: 'ITSE4101', nameAr: 'مختبر تصميم البرمجيات - متقدم', nameEn: 'Advanced Software Design Lab', hours: 1, type: 'major', prereq: 'ITSE4312' },
          { id: 'cse_itse5306', code: 'ITSE5306', nameAr: 'علم البيانات', nameEn: 'Data Science', hours: 3, type: 'major', prereq: 'ITSE2304' },
          { id: 'cse_itse5330', code: 'ITSE5330', nameAr: 'مشروع التخرج (1)', nameEn: 'Graduation Project (1)', hours: 3, type: 'major', prereq: 'ITSE4312' },
          { id: 'cse_itse4322', code: 'ITSE4322', nameAr: 'هندسة تجربة المستخدم', nameEn: 'User Experience Engineering', hours: 3, type: 'major', prereq: null },
          { id: 'cse_itis3305', code: 'ITIS3305', nameAr: 'إدارة إجراءات الأعمال', nameEn: 'Business Process Management', hours: 3, type: 'elective', prereq: 'ITSE4312' },
          { id: 'cse_itcs4326', code: 'ITCS4326', nameAr: 'حوسبة متحركة', nameEn: 'Mobile Computation', hours: 3, type: 'elective', prereq: 'ITCS4316' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cse_itse4305', code: 'ITSE4305', nameAr: 'اختبار البرمجيات', nameEn: 'Software Testing', hours: 3, type: 'major', prereq: 'ITSE3203' },
          { id: 'cse_itse4102', code: 'ITSE4102', nameAr: 'مختبر اختبار البرمجيات', nameEn: 'Software Testing Lab', hours: 1, type: 'major', prereq: 'ITSE4305' },
          { id: 'cse_itse5336', code: 'ITSE5336', nameAr: 'الحوسبة الموزعة والسحابية', nameEn: 'Distributed and Cloud Computing', hours: 3, type: 'major', prereq: 'ITSE4310' },
          { id: 'cse_itse4319', code: 'ITSE4319', nameAr: 'هندسة الذكاء الصناعي', nameEn: 'Artificial Intelligence Engineering', hours: 3, type: 'major', prereq: 'ITCS4319' },
          { id: 'cse_itse5331', code: 'ITSE5331', nameAr: 'مشروع التخرج (2)', nameEn: 'Graduation Project (2)', hours: 3, type: 'major', prereq: 'ITSE5330' },
          { id: 'cse_itse5304', code: 'ITSE5304', nameAr: 'الأنظمة الخبيرة', nameEn: 'Expert Systems', hours: 3, type: 'elective', prereq: 'ITCS4319' },
          { id: 'cse_itcs4346', code: 'ITCS4346', nameAr: 'تنقيب البيانات', nameEn: 'Data Mining', hours: 3, type: 'elective', prereq: 'ITCS4319' },
        ],
      },
    ],
  },
]

// ==============================================================================
// 2. علوم الحاسوب (2020) - خطة رقم 9243
// ==============================================================================
const PLAN_CS_2020 = [
  {
    year: 1,
    yearNameAr: 'المستوى الأول (السنة الأولى)',
    yearNameEn: 'Level 1 (First Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cs_engl1201', code: 'ENGL1201', nameAr: 'اللغة الإنجليزية (1)', nameEn: 'English Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'cs_math1320', code: 'MATH1320', nameAr: 'تفاضل و تكامل (1)', nameEn: 'Calculus (1)', hours: 3, type: 'college', prereq: null },
          { id: 'cs_itcc1301', code: 'ITCC1301', nameAr: 'دوائر كهربائية (1)', nameEn: 'Electric Circuits (1)', hours: 3, type: 'college', prereq: null },
          { id: 'cs_islm1101', code: 'ISLM1101', nameAr: 'قرآن كريم (1)', nameEn: 'Holy Quran (1)', hours: 1, type: 'university', prereq: null },
          { id: 'cs_itis1302', code: 'ITIS1302', nameAr: 'مبادئ الإدارة', nameEn: 'Introduction To Management', hours: 3, type: 'college', prereq: null },
          { id: 'cs_itcs1401', code: 'ITCS1401', nameAr: 'مقدمة في الحوسبة', nameEn: 'Introduction to Computing', hours: 4, type: 'college', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cs_itcc1311', code: 'ITCC1311', nameAr: 'إلكترونيات (1)', nameEn: 'Electronics (1)', hours: 3, type: 'college', prereq: 'ITCC1301' },
          { id: 'cs_arab1201', code: 'ARAB1201', nameAr: 'اللغة العربية (1)', nameEn: 'Arabic Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'cs_itcs1309', code: 'ITCS1309', nameAr: 'برمجة حاسوب (1)', nameEn: 'Computer Programming (1)', hours: 3, type: 'college', prereq: 'ITCS1401' },
          { id: 'cs_math1321', code: 'MATH1321', nameAr: 'تفاضل و تكامل (2)', nameEn: 'Calculus (2)', hours: 3, type: 'college', prereq: 'MATH1320' },
          { id: 'cs_islm1201', code: 'ISLM1201', nameAr: 'دراسات في الفقه', nameEn: 'Jurisprudence', hours: 2, type: 'university', prereq: null },
          { id: 'cs_itme1101', code: 'ITME1101', nameAr: 'مقدمة في الهندسة', nameEn: 'Introduction to Engineering', hours: 1, type: 'college', prereq: null },
          { id: 'cs_itsn2308', code: 'ITSN2308', nameAr: 'مهارات الكتابة التقنية', nameEn: 'Technical Writing Skills', hours: 3, type: 'college', prereq: 'ENGL1201' },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'المستوى الثاني (السنة الثانية)',
    yearNameEn: 'Level 2 (Second Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cs_itcs2311', code: 'ITCS2311', nameAr: 'التراكيب المنفصلة', nameEn: 'Discrete Structures', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cs_itcs2301', code: 'ITCS2301', nameAr: 'برمجة حاسوب (2)', nameEn: 'Computer Programming (2)', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cs_itcs2307', code: 'ITCS2307', nameAr: 'تراكيب البيانات', nameEn: 'Data Structures', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cs_itcc2303', code: 'ITCC2303', nameAr: 'تصميم المنطق الرقمي', nameEn: 'Digital Logic Design', hours: 3, type: 'major', prereq: 'ITCC1311' },
          { id: 'cs_islm2201', code: 'ISLM2201', nameAr: 'دراسات في الحديث وعلومه', nameEn: 'Studies in Prophetic Tradition', hours: 2, type: 'university', prereq: null },
          { id: 'cs_itse2301', code: 'ITSE2301', nameAr: 'مقدمة في هندسة البرمجيات', nameEn: 'Introduction to Software Engineering', hours: 3, type: 'major', prereq: 'ITCS1309' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cs_itcs2312', code: 'ITCS2312', nameAr: 'الخوارزميات', nameEn: 'Algorithms', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'cs_itcs2310', code: 'ITCS2310', nameAr: 'تحليل وتصميم الأنظمة', nameEn: 'Systems Analysis and Design', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cs_math2305', code: 'MATH2305', nameAr: 'جبر خطي (1)', nameEn: 'Linear Algebra (1)', hours: 3, type: 'major', prereq: 'MATH1320' },
          { id: 'cs_islm2105', code: 'ISLM2105', nameAr: 'قرآن كريم (2)', nameEn: 'Holy Quran (2)', hours: 1, type: 'university', prereq: null },
          { id: 'cs_math2209', code: 'MATH2209', nameAr: 'مبادئ الإحصاء', nameEn: 'Principles of Statistics', hours: 2, type: 'major', prereq: 'MATH1320' },
          { id: 'cs_itcs2308', code: 'ITCS2308', nameAr: 'هيكلية حاسوب ولغة أسمبلي', nameEn: 'Computer Architecture & Assembly', hours: 3, type: 'major', prereq: 'ITCC2303' },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'المستوى الثالث (السنة الثالثة)',
    yearNameEn: 'Level 3 (Third Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cs_itcs3403', code: 'ITCS3403', nameAr: 'أنظمة التشغيل', nameEn: 'Operating Systems', hours: 4, type: 'major', prereq: 'ITCS2308' },
          { id: 'cs_itcs3301', code: 'ITCS3301', nameAr: 'العمل الحر وريادة الأعمال', nameEn: 'Freelancing and Entrepreneurship', hours: 3, type: 'major', prereq: null },
          { id: 'cs_islm2202', code: 'ISLM2202', nameAr: 'دراسات في العقيدة الإسلامية', nameEn: 'Studies in Islamic Faith', hours: 2, type: 'university', prereq: null },
          { id: 'cs_itcs4316', code: 'ITCS4316', nameAr: 'شبكات الحاسوب', nameEn: 'Computer Networks', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'cs_islm3107', code: 'ISLM3107', nameAr: 'قرآن كريم (3)', nameEn: 'Holy Quran (3)', hours: 1, type: 'university', prereq: null },
          { id: 'cs_itcs3314', code: 'ITCS3314', nameAr: 'نظرية الأتمتة', nameEn: 'Automata Theory', hours: 3, type: 'major', prereq: 'ITCS2311' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cs_itcs3101', code: 'ITCS3101', nameAr: 'تدريب ميداني', nameEn: 'Co-op Training', hours: 1, type: 'major', prereq: 'ITCS2310' },
          { id: 'cs_itcs3401', code: 'ITCS3401', nameAr: 'تصميم صفحات الويب', nameEn: 'Web Page Design', hours: 4, type: 'major', prereq: 'ITCS2310' },
          { id: 'cs_itse3302', code: 'ITSE3302', nameAr: 'تطوير تطبيقات الشبكة العالمية', nameEn: 'Web Applications Development', hours: 3, type: 'elective', prereq: 'ITSE2302' },
          { id: 'cs_itcs3310', code: 'ITCS3310', nameAr: 'جرافيك حاسوب', nameEn: 'Computer Graphics', hours: 3, type: 'major', prereq: 'MATH2305' },
          { id: 'cs_islm3201', code: 'ISLM3201', nameAr: 'دراسات في التفسير وعلوم القرآن', nameEn: 'Interpretation of Quran', hours: 2, type: 'university', prereq: null },
          { id: 'cs_islm4113', code: 'ISLM4113', nameAr: 'قرآن كريم (4)', nameEn: 'Holy Quran (4)', hours: 1, type: 'university', prereq: null },
          { id: 'cs_itcs3402', code: 'ITCS3402', nameAr: 'نظم قواعد البيانات', nameEn: 'Database Systems', hours: 4, type: 'major', prereq: 'ITCS2310' },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'المستوى الرابع (السنة الرابعة)',
    yearNameEn: 'Level 4 (Fourth Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cs_itcs4301', code: 'ITCS4301', nameAr: 'أمن المعلومات', nameEn: 'Information Security', hours: 3, type: 'major', prereq: 'ITCS4316' },
          { id: 'cs_itcs4319', code: 'ITCS4319', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'cs_pals4212', code: 'PALS4212', nameAr: 'فلسطين الأرض والإنسان', nameEn: 'Palestinian Land and Human', hours: 2, type: 'university', prereq: null },
          { id: 'cs_itcs4330', code: 'ITCS4330', nameAr: 'مشروع التخرج 1', nameEn: 'Graduation Project I', hours: 3, type: 'major', prereq: 'ITCS2310' },
          { id: 'cs_itse4304', code: 'ITSE4304', nameAr: 'إدارة البرمجيات', nameEn: 'Software Management', hours: 3, type: 'elective', prereq: 'ITSE2301' },
          { id: 'cs_itcs4322', code: 'ITCS4322', nameAr: 'تفاعل الإنسان والحاسوب', nameEn: 'Human Computer Interaction', hours: 3, type: 'elective', prereq: 'ITCS2310' },
          { id: 'cs_itcs4346', code: 'ITCS4346', nameAr: 'تنقيب البيانات', nameEn: 'Data Mining', hours: 3, type: 'elective', prereq: 'ITCS3402' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cs_itcs4320', code: 'ITCS4320', nameAr: 'الأنظمة الموزعة', nameEn: 'Distributed Systems', hours: 3, type: 'major', prereq: 'ITCS3403' },
          { id: 'cs_itcs4317', code: 'ITCS4317', nameAr: 'تصميم المترجمات', nameEn: 'Compilers Design', hours: 3, type: 'major', prereq: 'ITCS3314' },
          { id: 'cs_geol3203', code: 'GEOL3203', nameAr: 'علوم البيئة', nameEn: 'Environmental Sciences', hours: 2, type: 'university', prereq: null },
          { id: 'cs_itcs4302', code: 'ITCS4302', nameAr: 'مبادئ لغات البرمجة', nameEn: 'Principles of Programming Languages', hours: 3, type: 'major', prereq: 'ITCS2301' },
          { id: 'cs_itcs4331', code: 'ITCS4331', nameAr: 'مشروع التخرج 2', nameEn: 'Graduation Project II', hours: 3, type: 'major', prereq: 'ITCS4330' },
          { id: 'cs_itcs5331', code: 'ITCS5331', nameAr: 'الشبكات العصبية', nameEn: 'Neural Networks', hours: 3, type: 'elective', prereq: 'ITCS4319' },
          { id: 'cs_itcs4324', code: 'ITCS4324', nameAr: 'النمذجة والمحاكاة', nameEn: 'Modelling & Simulation', hours: 3, type: 'elective', prereq: 'ITCS2312' },
        ],
      },
    ],
  },
]

// ==============================================================================
// 3. نظم المعلومات (2020) - خطة رقم 9274
// ==============================================================================
const PLAN_IS_2020 = [
  {
    year: 1,
    yearNameAr: 'المستوى الأول (السنة الأولى)',
    yearNameEn: 'Level 1 (First Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'is_engl1201', code: 'ENGL1201', nameAr: 'اللغة الإنجليزية (1)', nameEn: 'English Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'is_math1320', code: 'MATH1320', nameAr: 'تفاضل و تكامل (1)', nameEn: 'Calculus (1)', hours: 3, type: 'college', prereq: null },
          { id: 'is_itcc1301', code: 'ITCC1301', nameAr: 'دوائر كهربائية (1)', nameEn: 'Electric Circuits (1)', hours: 3, type: 'college', prereq: null },
          { id: 'is_islm1101', code: 'ISLM1101', nameAr: 'قرآن كريم (1)', nameEn: 'Holy Quran (1)', hours: 1, type: 'university', prereq: null },
          { id: 'is_itis1302', code: 'ITIS1302', nameAr: 'مبادئ الإدارة', nameEn: 'Introduction To Management', hours: 3, type: 'college', prereq: null },
          { id: 'is_itcs1401', code: 'ITCS1401', nameAr: 'مقدمة في الحوسبة', nameEn: 'Introduction to Computing', hours: 4, type: 'college', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'is_itcc1311', code: 'ITCC1311', nameAr: 'إلكترونيات (1)', nameEn: 'Electronics (1)', hours: 3, type: 'college', prereq: 'ITCC1301' },
          { id: 'is_arab1201', code: 'ARAB1201', nameAr: 'اللغة العربية (1)', nameEn: 'Arabic Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'is_itcs1309', code: 'ITCS1309', nameAr: 'برمجة حاسوب (1)', nameEn: 'Computer Programming (1)', hours: 3, type: 'college', prereq: 'ITCS1401' },
          { id: 'is_math1321', code: 'MATH1321', nameAr: 'تفاضل و تكامل (2)', nameEn: 'Calculus (2)', hours: 3, type: 'college', prereq: 'MATH1320' },
          { id: 'is_islm1201', code: 'ISLM1201', nameAr: 'دراسات في الفقه', nameEn: 'Jurisprudence', hours: 2, type: 'university', prereq: null },
          { id: 'is_itme1101', code: 'ITME1101', nameAr: 'مقدمة في الهندسة', nameEn: 'Introduction to Engineering', hours: 1, type: 'college', prereq: null },
          { id: 'is_itsn2308', code: 'ITSN2308', nameAr: 'مهارات الكتابة التقنية', nameEn: 'Technical Writing Skills', hours: 3, type: 'college', prereq: 'ENGL1201' },
        ],
      },
      {
        semester: 3,
        semesterNameAr: 'الفصل الصيفي',
        semesterNameEn: 'Summer Semester',
        courses: [
          { id: 'is_geol3203', code: 'GEOL3203', nameAr: 'علوم البيئة', nameEn: 'Environmental Sciences', hours: 2, type: 'university', prereq: null },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'المستوى الثاني (السنة الثانية)',
    yearNameEn: 'Level 2 (Second Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'is_econ1301', code: 'ECON1301', nameAr: 'اقتصاد جزئي', nameEn: 'Principles Of Microeconomics', hours: 3, type: 'major', prereq: null },
          { id: 'is_itcs2311', code: 'ITCS2311', nameAr: 'التراكيب المنفصلة', nameEn: 'Discrete Structures', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'is_itcs2301', code: 'ITCS2301', nameAr: 'برمجة حاسوب (2)', nameEn: 'Computer Programming (2)', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'is_itcs2307', code: 'ITCS2307', nameAr: 'تراكيب البيانات', nameEn: 'Data Structures', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'is_islm2201', code: 'ISLM2201', nameAr: 'دراسات في الحديث وعلومه', nameEn: 'Studies in Prophetic Tradition', hours: 2, type: 'university', prereq: null },
          { id: 'is_itse2301', code: 'ITSE2301', nameAr: 'مقدمة في هندسة البرمجيات', nameEn: 'Introduction to Software Engineering', hours: 3, type: 'college', prereq: 'ITCS1309' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'is_itis4306', code: 'ITIS4306', nameAr: 'أنظمة المعلومات الإدارية', nameEn: 'Management Information Systems', hours: 3, type: 'major', prereq: 'ITIS1302' },
          { id: 'is_itcs2312', code: 'ITCS2312', nameAr: 'الخوارزميات', nameEn: 'Algorithms', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'is_itcs2310', code: 'ITCS2310', nameAr: 'تحليل وتصميم الأنظمة', nameEn: 'Systems Analysis and Design', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'is_math2305', code: 'MATH2305', nameAr: 'جبر خطي (1)', nameEn: 'Linear Algebra (1)', hours: 3, type: 'major', prereq: 'MATH1320' },
          { id: 'is_islm2105', code: 'ISLM2105', nameAr: 'قرآن كريم (2)', nameEn: 'Holy Quran (2)', hours: 1, type: 'university', prereq: null },
          { id: 'is_math2209', code: 'MATH2209', nameAr: 'مبادئ الإحصاء', nameEn: 'Principles of Statistics', hours: 2, type: 'major', prereq: null },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'المستوى الثالث (السنة الثالثة)',
    yearNameEn: 'Level 3 (Third Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'is_itcs3403', code: 'ITCS3403', nameAr: 'أنظمة التشغيل', nameEn: 'Operating Systems', hours: 4, type: 'major', prereq: 'ITCS2307' },
          { id: 'is_itcs3301', code: 'ITCS3301', nameAr: 'العمل الحر وريادة الأعمال', nameEn: 'Freelancing and Entrepreneurship', hours: 3, type: 'major', prereq: 'ITCS2301' },
          { id: 'is_itis3304', code: 'ITIS3304', nameAr: 'بحوث العمليات (1)', nameEn: 'Operational Research (1)', hours: 3, type: 'major', prereq: 'MATH2305' },
          { id: 'is_islm2202', code: 'ISLM2202', nameAr: 'دراسات في العقيدة الإسلامية', nameEn: 'Studies in Islamic Faith', hours: 2, type: 'university', prereq: null },
          { id: 'is_itcs4316', code: 'ITCS4316', nameAr: 'شبكات الحاسوب', nameEn: 'Computer Networks', hours: 3, type: 'major', prereq: 'ITCS2307' },
          { id: 'is_islm3107', code: 'ISLM3107', nameAr: 'قرآن كريم (3)', nameEn: 'Holy Quran (3)', hours: 1, type: 'university', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'is_itis3301', code: 'ITIS3301', nameAr: 'الثقافة التنظيمية', nameEn: 'Organizational Culture', hours: 3, type: 'major', prereq: 'ITIS1302' },
          { id: 'is_itcs3101', code: 'ITCS3101', nameAr: 'تدريب ميداني', nameEn: 'Co-op Training', hours: 1, type: 'major', prereq: 'ITCS2310' },
          { id: 'is_itcs3401', code: 'ITCS3401', nameAr: 'تصميم صفحات الويب', nameEn: 'Web Page Design', hours: 4, type: 'major', prereq: 'ITCS2310' },
          { id: 'is_islm3201', code: 'ISLM3201', nameAr: 'دراسات في التفسير وعلوم القرآن', nameEn: 'Interpretation of Quran', hours: 2, type: 'university', prereq: null },
          { id: 'is_islm4113', code: 'ISLM4113', nameAr: 'قرآن كريم (4)', nameEn: 'Holy Quran (4)', hours: 1, type: 'university', prereq: null },
          { id: 'is_itcs3402', code: 'ITCS3402', nameAr: 'نظم قواعد البيانات', nameEn: 'Database Systems', hours: 4, type: 'major', prereq: 'ITCS2310' },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'المستوى الرابع (السنة الرابعة)',
    yearNameEn: 'Level 4 (Fourth Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'is_itcs4301', code: 'ITCS4301', nameAr: 'أمن المعلومات', nameEn: 'Information Security', hours: 3, type: 'major', prereq: 'ITCS4316' },
          { id: 'is_itse4304', code: 'ITSE4304', nameAr: 'إدارة البرمجيات', nameEn: 'Software Management', hours: 3, type: 'major', prereq: 'ITSE2301' },
          { id: 'is_pals4212', code: 'PALS4212', nameAr: 'فلسطين الأرض والإنسان', nameEn: 'Palestinian Land and Human', hours: 2, type: 'university', prereq: null },
          { id: 'is_itis4330', code: 'ITIS4330', nameAr: 'مشروع التخرج 1', nameEn: 'Graduation Project I', hours: 3, type: 'major', prereq: 'ITCS2310' },
          { id: 'is_itis3305', code: 'ITIS3305', nameAr: 'إدارة إجراءات الأعمال', nameEn: 'Business Process Management', hours: 3, type: 'elective', prereq: 'ITIS1302' },
          { id: 'is_itis4303', code: 'ITIS4303', nameAr: 'إدارة المخاطر والإدارة الاستراتيجية', nameEn: 'Risk & Strategic Management', hours: 3, type: 'elective', prereq: 'ITIS1302' },
          { id: 'is_itcs4319', code: 'ITCS4319', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', hours: 3, type: 'elective', prereq: 'ITCS2307' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'is_itis4341', code: 'ITIS4341', nameAr: 'التسويق الإلكتروني', nameEn: 'E-Marketing', hours: 3, type: 'major', prereq: 'ITCS3401' },
          { id: 'is_itis4301', code: 'ITIS4301', nameAr: 'أنظمة التجارة الإلكترونية', nameEn: 'E-Commerce Systems', hours: 3, type: 'major', prereq: 'ITIS4306' },
          { id: 'is_itis4336', code: 'ITIS4336', nameAr: 'ريادة الأعمال في التكنولوجيا', nameEn: 'Technology Entrepreneurship', hours: 3, type: 'major', prereq: 'ITIS1302' },
          { id: 'is_itis4331', code: 'ITIS4331', nameAr: 'مشروع التخرج 2', nameEn: 'Graduation Project II', hours: 3, type: 'major', prereq: 'ITIS4330' },
          { id: 'is_itse5304', code: 'ITSE5304', nameAr: 'الأنظمة الخبيرة', nameEn: 'Expert Systems', hours: 3, type: 'elective', prereq: 'ITCS4319' },
          { id: 'is_itse4310', code: 'ITSE4310', nameAr: 'تطوير التطبيقات المتحركة', nameEn: 'Mobile Applications Development', hours: 3, type: 'elective', prereq: null },
        ],
      },
    ],
  },
]

// ==============================================================================
// 4. هندسة الحاسوب والاتصالات (2025) - خطة رقم 9313
// ==============================================================================
const PLAN_CCE_2025 = [
  {
    year: 1,
    yearNameAr: 'المستوى الأول (السنة الأولى)',
    yearNameEn: 'Level 1 (First Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cce_engl1201', code: 'ENGL1201', nameAr: 'اللغة الإنجليزية (1)', nameEn: 'English Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'cce_math1320', code: 'MATH1320', nameAr: 'تفاضل وتكامل (1)', nameEn: 'Calculus (1)', hours: 3, type: 'college', prereq: null },
          { id: 'cce_islm2201', code: 'ISLM2201', nameAr: 'دراسات في الحديث وعلومه', nameEn: 'Studies in Prophetic Tradition', hours: 2, type: 'university', prereq: null },
          { id: 'cce_itcc1301', code: 'ITCC1301', nameAr: 'دوائر كهربائية (1)', nameEn: 'Electric Circuits (1)', hours: 3, type: 'college', prereq: null },
          { id: 'cce_islm1101', code: 'ISLM1101', nameAr: 'قرآن كريم (1)', nameEn: 'Holy Quran (1)', hours: 1, type: 'university', prereq: null },
          { id: 'cce_itis1302', code: 'ITIS1302', nameAr: 'مبادئ الإدارة', nameEn: 'Introduction To Management', hours: 3, type: 'college', prereq: null },
          { id: 'cce_itcs1401', code: 'ITCS1401', nameAr: 'مقدمة في الحوسبة', nameEn: 'Introduction to Computing', hours: 4, type: 'college', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cce_itcc1311', code: 'ITCC1311', nameAr: 'إلكترونيات (1)', nameEn: 'Electronics (1)', hours: 3, type: 'college', prereq: 'ITCC1301' },
          { id: 'cce_arab1201', code: 'ARAB1201', nameAr: 'اللغة العربية (1)', nameEn: 'Arabic Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'cce_itcs1309', code: 'ITCS1309', nameAr: 'برمجة حاسوب (1)', nameEn: 'Computer Programming (1)', hours: 3, type: 'college', prereq: 'ITCS1401' },
          { id: 'cce_itcc2303', code: 'ITCC2303', nameAr: 'تصميم المنطق الرقمي', nameEn: 'Digital Logic Design', hours: 3, type: 'college', prereq: 'ITCC1311' },
          { id: 'cce_math1321', code: 'MATH1321', nameAr: 'تفاضل وتكامل (2)', nameEn: 'Calculus (2)', hours: 3, type: 'college', prereq: 'MATH1320' },
          { id: 'cce_islm1201', code: 'ISLM1201', nameAr: 'دراسات في الفقه', nameEn: 'Jurisprudence', hours: 2, type: 'university', prereq: null },
          { id: 'cce_geol3203', code: 'GEOL3203', nameAr: 'علوم البيئة', nameEn: 'Environmental Sciences', hours: 2, type: 'university', prereq: null },
          { id: 'cce_pals4212', code: 'PALS4212', nameAr: 'فلسطين الأرض والإنسان', nameEn: 'Palestinian Land and Human', hours: 2, type: 'university', prereq: null },
          { id: 'cce_itme1101', code: 'ITME1101', nameAr: 'مقدمة في الهندسة', nameEn: 'Introduction to Engineering', hours: 1, type: 'college', prereq: null },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'المستوى الثاني (السنة الثانية)',
    yearNameEn: 'Level 2 (Second Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cce_math2301', code: 'MATH2301', nameAr: 'احتمالات وإحصاء هندسي', nameEn: 'Statistics and Engineering Probabilities', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'cce_itme2201', code: 'ITME2201', nameAr: 'الرسم الهندسي', nameEn: 'Engineering Drawing', hours: 2, type: 'major', prereq: null },
          { id: 'cce_itcs2301', code: 'ITCS2301', nameAr: 'برمجة حاسوب (2)', nameEn: 'Computer Programming (2)', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cce_islm2202', code: 'ISLM2202', nameAr: 'دراسات في العقيدة الإسلامية', nameEn: 'Studies in Islamic Faith', hours: 2, type: 'university', prereq: null },
          { id: 'cce_itcc2302', code: 'ITCC2302', nameAr: 'دوائر كهربائية (2)', nameEn: 'Electric Circuits (2)', hours: 3, type: 'major', prereq: 'ITCC1301' },
          { id: 'cce_itcs4316', code: 'ITCS4316', nameAr: 'شبكات الحاسوب', nameEn: 'Computer Networks', hours: 3, type: 'major', prereq: 'ITCC1311' },
          { id: 'cce_itme2101', code: 'ITME2101', nameAr: 'مختبر الرسم الهندسي', nameEn: 'Engineering Drawing Lab', hours: 1, type: 'major', prereq: 'ITME2201' },
          { id: 'cce_itcc2101', code: 'ITCC2101', nameAr: 'مختبر دوائر كهربائية', nameEn: 'Electrical Circuit Lab', hours: 1, type: 'major', prereq: 'ITCC2302' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cce_itcc2304', code: 'ITCC2304', nameAr: 'مقدمة في الإشارات والأنظمة', nameEn: 'Introduction to Signals and Systems', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'cce_itcc2331', code: 'ITCC2331', nameAr: 'إلكترونيات (2)', nameEn: 'Electronics (2)', hours: 3, type: 'major', prereq: 'ITCC1311' },
          { id: 'cce_itcs2312', code: 'ITCS2312', nameAr: 'الخوارزميات', nameEn: 'Algorithms', hours: 3, type: 'major', prereq: 'ITCS2301' },
          { id: 'cce_math2305', code: 'MATH2305', nameAr: 'جبر خطي (1)', nameEn: 'Linear Algebra (1)', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'cce_islm2105', code: 'ISLM2105', nameAr: 'قرآن كريم (2)', nameEn: 'Holy Quran (2)', hours: 1, type: 'university', prereq: null },
          { id: 'cce_itcc3311', code: 'ITCC3311', nameAr: 'كهرومغناطيسية (1)', nameEn: 'Electromagnetics (1)', hours: 3, type: 'major', prereq: 'MATH2308' },
          { id: 'cce_itcc2102', code: 'ITCC2102', nameAr: 'مختبر إلكترونيات', nameEn: 'Electronics Lab', hours: 1, type: 'major', prereq: 'ITCC2331' },
          { id: 'cce_itcc2104', code: 'ITCC2104', nameAr: 'مختبر الإشارات والأنظمة', nameEn: 'Signals and Systems Lab', hours: 1, type: 'major', prereq: 'ITCC2304' },
          { id: 'cce_itme2121', code: 'ITME2121', nameAr: 'ورش هندسية', nameEn: 'Engineering Workshop', hours: 1, type: 'major', prereq: null },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'المستوى الثالث (السنة الثالثة)',
    yearNameEn: 'Level 3 (Third Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cce_itcs4301', code: 'ITCS4301', nameAr: 'أمن المعلومات', nameEn: 'Information Security', hours: 3, type: 'major', prereq: 'MATH2305' },
          { id: 'cce_itcs3403', code: 'ITCS3403', nameAr: 'أنظمة التشغيل', nameEn: 'Operating Systems', hours: 4, type: 'major', prereq: 'ITCS2301' },
          { id: 'cce_itcc3201', code: 'ITCC3201', nameAr: 'المعالجات الدقيقة وواصلات الحاسوب', nameEn: 'Microprocessors and Computer Interfacing', hours: 2, type: 'major', prereq: 'ITCC2303' },
          { id: 'cce_itcs2307', code: 'ITCS2307', nameAr: 'تراكيب البيانات', nameEn: 'Data Structures', hours: 3, type: 'major', prereq: 'ITCS1309' },
          { id: 'cce_itcc4312', code: 'ITCC4312', nameAr: 'كهرومغناطيسية (2)', nameEn: 'Electromagnetics (2)', hours: 3, type: 'major', prereq: 'ITCC3311' },
          { id: 'cce_itcc3101', code: 'ITCC3101', nameAr: 'مختبر المعالجات الدقيقة وواصلات الحاسوب', nameEn: 'Microprocessors Lab', hours: 1, type: 'major', prereq: 'ITCC3201' },
          { id: 'cce_math2308', code: 'MATH2308', nameAr: 'معادلات تفاضلية عادية (1)', nameEn: 'Ordinary Diff.Equations (1)', hours: 3, type: 'major', prereq: 'MATH2305' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cce_itcc3321', code: 'ITCC3321', nameAr: 'الاتصالات التناظرية', nameEn: 'Analog Communications', hours: 3, type: 'major', prereq: 'ITCC2304' },
          { id: 'cce_itme3201', code: 'ITME3201', nameAr: 'المتحكم الدقيق: البرمجة والتطبيقات', nameEn: 'Microcontroller: Programming and Applications', hours: 2, type: 'major', prereq: 'ITCC2331' },
          { id: 'cce_itcc4101', code: 'ITCC4101', nameAr: 'تدريب ميداني', nameEn: 'Co-op Training', hours: 1, type: 'major', prereq: null },
          { id: 'cce_itcs3401', code: 'ITCS3401', nameAr: 'تصميم صفحات الويب', nameEn: 'Web Page Design', hours: 4, type: 'major', prereq: 'ITCS1309' },
          { id: 'cce_islm3201', code: 'ISLM3201', nameAr: 'دراسات في التفسير وعلوم القرآن', nameEn: 'Interpretation of Quran', hours: 2, type: 'university', prereq: null },
          { id: 'cce_itme3101', code: 'ITME3101', nameAr: 'مختبر المتحكم الدقيق', nameEn: 'Microcontroller Lab', hours: 1, type: 'major', prereq: 'ITME3201' },
          { id: 'cce_itcc4325', code: 'ITCC4325', nameAr: 'مقدمة في معالجة الإشارات الرقمية', nameEn: 'Introduction to Digital Signals Processing', hours: 3, type: 'major', prereq: 'ITCC2304' },
          { id: 'cce_itcc5336', code: 'ITCC5336', nameAr: 'أنظمة اتصالات الأقمار الصناعية', nameEn: 'Satellite Communications Systems', hours: 3, type: 'elective', prereq: 'ITCC3321' },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'المستوى الرابع (السنة الرابعة)',
    yearNameEn: 'Level 4 (Fourth Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cce_itcc4324', code: 'ITCC4324', nameAr: 'اتصالات الألياف الضوئية', nameEn: 'Fiber Optical Communications', hours: 3, type: 'major', prereq: 'ITCC4312' },
          { id: 'cce_itcc5327', code: 'ITCC5327', nameAr: 'اتصالات لاسلكية', nameEn: 'Wireless Communications', hours: 3, type: 'major', prereq: 'ITCC3321' },
          { id: 'cce_itcc4322', code: 'ITCC4322', nameAr: 'الاتصالات الرقمية', nameEn: 'Digital Communications', hours: 3, type: 'major', prereq: 'ITCC3321' },
          { id: 'cce_itcc4301', code: 'ITCC4301', nameAr: 'البرمجة بلغة البايثون', nameEn: 'Python Programming', hours: 3, type: 'major', prereq: 'ITCS2301' },
          { id: 'cce_islm3107', code: 'ISLM3107', nameAr: 'قرآن كريم (3)', nameEn: 'Holy Quran (3)', hours: 1, type: 'university', prereq: null },
          { id: 'cce_itcc4123', code: 'ITCC4123', nameAr: 'مختبر الاتصالات', nameEn: 'Communications Lab', hours: 1, type: 'major', prereq: 'ITCC3321' },
          { id: 'cce_itcc4201', code: 'ITCC4201', nameAr: 'مشروع التخرج (1)', nameEn: 'Graduation Project (1)', hours: 2, type: 'major', prereq: null },
          { id: 'cce_itcs4319', code: 'ITCS4319', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', hours: 3, type: 'elective', prereq: 'ITCS2307' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cce_itme4302', code: 'ITME4302', nameAr: 'الرياضيات والمحاكاة للمهندسين', nameEn: 'Math and Simulation for Engineers', hours: 3, type: 'major', prereq: 'MATH2301' },
          { id: 'cce_itse4310', code: 'ITSE4310', nameAr: 'تطوير التطبيقات المتحركة', nameEn: 'Mobile Applications Development', hours: 3, type: 'major', prereq: 'ITCS3401' },
          { id: 'cce_islm4113', code: 'ISLM4113', nameAr: 'قرآن كريم (4)', nameEn: 'Holy Quran (4)', hours: 1, type: 'university', prereq: null },
          { id: 'cce_itcc4202', code: 'ITCC4202', nameAr: 'مشروع التخرج (2)', nameEn: 'Graduation Project (2)', hours: 2, type: 'major', prereq: 'ITCC4201' },
          { id: 'cce_itcs3402', code: 'ITCS3402', nameAr: 'نظم قواعد البيانات', nameEn: 'Database Systems', hours: 4, type: 'major', prereq: 'ITCS2301' },
          { id: 'cce_itcc5328', code: 'ITCC5328', nameAr: 'هندسة أنظمة شبكات الاتصالات', nameEn: 'Telecommunication Network Systems Engineering', hours: 3, type: 'major', prereq: 'ITCC5327' },
          { id: 'cce_itcc5302', code: 'ITCC5302', nameAr: 'شبكات حاسوب متقدمة', nameEn: 'Advanced Computer Networks', hours: 3, type: 'elective', prereq: 'ITCC5328' },
        ],
      },
    ],
  },
]

// ==============================================================================
// 5. هندسة الميكاترونكس (2025) - خطة رقم 9314
// ==============================================================================
const PLAN_MECHATRONICS_2025 = [
  {
    year: 1,
    yearNameAr: 'المستوى الأول (السنة الأولى)',
    yearNameEn: 'Level 1 (First Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'mec_engl1201', code: 'ENGL1201', nameAr: 'اللغة الإنجليزية (1)', nameEn: 'English Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'mec_math1320', code: 'MATH1320', nameAr: 'تفاضل وتكامل (1)', nameEn: 'Calculus (1)', hours: 3, type: 'college', prereq: null },
          { id: 'mec_islm2201', code: 'ISLM2201', nameAr: 'دراسات في الحديث وعلومه', nameEn: 'Studies in Prophetic Tradition', hours: 2, type: 'university', prereq: null },
          { id: 'mec_itcc1301', code: 'ITCC1301', nameAr: 'دوائر كهربائية (1)', nameEn: 'Electric Circuits (1)', hours: 3, type: 'college', prereq: null },
          { id: 'mec_islm1101', code: 'ISLM1101', nameAr: 'قرآن كريم (1)', nameEn: 'Holy Quran (1)', hours: 1, type: 'university', prereq: null },
          { id: 'mec_itis1302', code: 'ITIS1302', nameAr: 'مبادئ الإدارة', nameEn: 'Introduction To Management', hours: 3, type: 'college', prereq: null },
          { id: 'mec_itcs1401', code: 'ITCS1401', nameAr: 'مقدمة في الحوسبة', nameEn: 'Introduction to Computing', hours: 4, type: 'college', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'mec_itcc1311', code: 'ITCC1311', nameAr: 'إلكترونيات (1)', nameEn: 'Electronics (1)', hours: 3, type: 'college', prereq: 'ITCC1301' },
          { id: 'mec_arab1201', code: 'ARAB1201', nameAr: 'اللغة العربية (1)', nameEn: 'Arabic Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'mec_itcs1309', code: 'ITCS1309', nameAr: 'برمجة حاسوب (1)', nameEn: 'Computer Programming (1)', hours: 3, type: 'college', prereq: 'ITCS1401' },
          { id: 'mec_itcc2303', code: 'ITCC2303', nameAr: 'تصميم المنطق الرقمي', nameEn: 'Digital Logic Design', hours: 3, type: 'college', prereq: 'ITCC1311' },
          { id: 'mec_math1321', code: 'MATH1321', nameAr: 'تفاضل وتكامل (2)', nameEn: 'Calculus (2)', hours: 3, type: 'college', prereq: 'MATH1320' },
          { id: 'mec_islm1201', code: 'ISLM1201', nameAr: 'دراسات في الفقه', nameEn: 'Jurisprudence', hours: 2, type: 'university', prereq: null },
          { id: 'mec_geol3203', code: 'GEOL3203', nameAr: 'علوم البيئة', nameEn: 'Environmental Sciences', hours: 2, type: 'university', prereq: null },
          { id: 'mec_pals4212', code: 'PALS4212', nameAr: 'فلسطين الأرض والإنسان', nameEn: 'Palestinian Land and Human', hours: 2, type: 'university', prereq: null },
          { id: 'mec_itme1101', code: 'ITME1101', nameAr: 'مقدمة في الهندسة', nameEn: 'Introduction to Engineering', hours: 1, type: 'college', prereq: null },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'المستوى الثاني (السنة الثانية)',
    yearNameEn: 'Level 2 (Second Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'mec_math2301', code: 'MATH2301', nameAr: 'احتمالات وإحصاء هندسي', nameEn: 'Statistics and Engineering Probabilities', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'mec_itme2201', code: 'ITME2201', nameAr: 'الرسم الهندسي', nameEn: 'Engineering Drawing', hours: 2, type: 'major', prereq: null },
          { id: 'mec_islm2202', code: 'ISLM2202', nameAr: 'دراسات في العقيدة الإسلامية', nameEn: 'Studies in Islamic Faith', hours: 2, type: 'university', prereq: null },
          { id: 'mec_itcc2302', code: 'ITCC2302', nameAr: 'دوائر كهربائية (2)', nameEn: 'Electric Circuits (2)', hours: 3, type: 'major', prereq: 'ITCC1301' },
          { id: 'mec_itme2101', code: 'ITME2101', nameAr: 'مختبر الرسم الهندسي', nameEn: 'Engineering Drawing Lab', hours: 1, type: 'major', prereq: 'ITME2201' },
          { id: 'mec_itcc2101', code: 'ITCC2101', nameAr: 'مختبر دوائر كهربائية', nameEn: 'Electrical Circuit Lab', hours: 1, type: 'major', prereq: 'ITCC2302' },
          { id: 'mec_itme2102', code: 'ITME2102', nameAr: 'مختبر هندسة وعلم المواد', nameEn: 'Material Sciences and Engineering Lab', hours: 1, type: 'major', prereq: 'ITME3329' },
          { id: 'mec_itme2302', code: 'ITME2302', nameAr: 'هندسة ميكانيكية (1)', nameEn: 'Engineering Mechanics (1)', hours: 3, type: 'major', prereq: null },
          { id: 'mec_itme3329', code: 'ITME3329', nameAr: 'هندسة وعلم المواد', nameEn: 'Materials Sciences and Engineering', hours: 3, type: 'major', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'mec_itcc2304', code: 'ITCC2304', nameAr: 'مقدمة في الإشارات والأنظمة', nameEn: 'Introduction to Signals and Systems', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'mec_itcc2331', code: 'ITCC2331', nameAr: 'إلكترونيات (2)', nameEn: 'Electronics (2)', hours: 3, type: 'major', prereq: 'ITCC1311' },
          { id: 'mec_math2305', code: 'MATH2305', nameAr: 'جبر خطي (1)', nameEn: 'Linear Algebra (1)', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'mec_islm2105', code: 'ISLM2105', nameAr: 'قرآن كريم (2)', nameEn: 'Holy Quran (2)', hours: 1, type: 'university', prereq: null },
          { id: 'mec_itcc2102', code: 'ITCC2102', nameAr: 'مختبر إلكترونيات', nameEn: 'Electronics Lab', hours: 1, type: 'major', prereq: 'ITCC2331' },
          { id: 'mec_itcc2104', code: 'ITCC2104', nameAr: 'مختبر الإشارات والأنظمة', nameEn: 'Signals and Systems Lab', hours: 1, type: 'major', prereq: 'ITCC2304' },
          { id: 'mec_itme2303', code: 'ITME2303', nameAr: 'هندسة ميكانيكية (2)', nameEn: 'Engineering Mechanics (2)', hours: 3, type: 'major', prereq: 'ITME2302' },
          { id: 'mec_itcs2308', code: 'ITCS2308', nameAr: 'هيكلية حاسوب ولغة أسمبلي', nameEn: 'Computer Architecture & Assembly', hours: 3, type: 'major', prereq: 'ITCC2303' },
          { id: 'mec_itme2121', code: 'ITME2121', nameAr: 'ورش هندسية', nameEn: 'Engineering Workshop', hours: 1, type: 'major', prereq: null },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'المستوى الثالث (السنة الثالثة)',
    yearNameEn: 'Level 3 (Third Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'mec_itme3302', code: 'ITME3302', nameAr: 'أنظمة التحكم', nameEn: 'Control Systems', hours: 3, type: 'major', prereq: 'ITCC2304' },
          { id: 'mec_itcc3201', code: 'ITCC3201', nameAr: 'المعالجات الدقيقة وواصلات الحاسوب', nameEn: 'Microprocessors and Computer Interfacing', hours: 2, type: 'major', prereq: 'ITCC2303' },
          { id: 'mec_itme3328', code: 'ITME3328', nameAr: 'عمليات التصنيع', nameEn: 'Manufacturing Processes', hours: 3, type: 'major', prereq: 'ITME2303' },
          { id: 'mec_itme4306', code: 'ITME4306', nameAr: 'عناصر الماكينات الميكانيكية', nameEn: 'Mechanical Machines Elements', hours: 3, type: 'major', prereq: 'ITME2303' },
          { id: 'mec_itme3331', code: 'ITME3331', nameAr: 'عناصر الميكاترونكس', nameEn: 'Mechatronics Components', hours: 3, type: 'major', prereq: 'ITCC2331' },
          { id: 'mec_itme3102', code: 'ITME3102', nameAr: 'مختبر أنظمة التحكم', nameEn: 'Control Systems Lab', hours: 1, type: 'major', prereq: 'ITME3302' },
          { id: 'mec_itcc3101', code: 'ITCC3101', nameAr: 'مختبر المعالجات الدقيقة وواصلات الحاسوب', nameEn: 'Microprocessors Lab', hours: 1, type: 'major', prereq: 'ITCC3201' },
          { id: 'mec_math2308', code: 'MATH2308', nameAr: 'معادلات تفاضلية عادية (1)', nameEn: 'Ordinary Diff.Equations (1)', hours: 3, type: 'major', prereq: 'MATH2305' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'mec_itme3301', code: 'ITME3301', nameAr: 'الديناميكا الحرارية', nameEn: 'Thermodynamics', hours: 3, type: 'major', prereq: 'ITME2303' },
          { id: 'mec_itme3201', code: 'ITME3201', nameAr: 'المتحكم الدقيق: البرمجة والتطبيقات', nameEn: 'Microcontroller: Programming and Applications', hours: 2, type: 'major', prereq: 'ITCC2331' },
          { id: 'mec_itme3203', code: 'ITME3203', nameAr: 'أنظمة إلكترونيات القوى', nameEn: 'Power Electronics Systems', hours: 2, type: 'major', prereq: 'ITCC2331' },
          { id: 'mec_itme4141', code: 'ITME4141', nameAr: 'تدريب ميداني', nameEn: 'Co-op Training', hours: 1, type: 'major', prereq: null },
          { id: 'mec_itme4333', code: 'ITME4333', nameAr: 'تصميم الميكاترونكس', nameEn: 'Mechatronics Design', hours: 3, type: 'major', prereq: 'ITME3331' },
          { id: 'mec_itme3202', code: 'ITME3202', nameAr: 'تطبيقات برمجية', nameEn: 'Programming Applications', hours: 2, type: 'major', prereq: 'ITME3331' },
          { id: 'mec_itme3101', code: 'ITME3101', nameAr: 'مختبر المتحكم الدقيق: البرمجة والتطبيقات', nameEn: 'Microcontroller Lab', hours: 1, type: 'major', prereq: 'ITME3201' },
          { id: 'mec_itme3104', code: 'ITME3104', nameAr: 'مختبر أنظمة إلكترونيات القوى', nameEn: 'Power Electronics Systems Lab', hours: 1, type: 'major', prereq: 'ITME3203' },
          { id: 'mec_itme3103', code: 'ITME3103', nameAr: 'مختبر تطبيقات برمجية', nameEn: 'Programming Applications Lab', hours: 1, type: 'major', prereq: 'ITME3202' },
          { id: 'mec_itme5388', code: 'ITME5388', nameAr: 'أنظمة الهيدروليك والنيوماتيك', nameEn: 'Hydraulics and Pneumatics Systems', hours: 3, type: 'elective', prereq: 'ITME2303' },
        ],
      },
      {
        semester: 3,
        semesterNameAr: 'الفصل الصيفي',
        semesterNameEn: 'Summer Semester',
        courses: [
          { id: 'mec_islm3107', code: 'ISLM3107', nameAr: 'قرآن كريم (3)', nameEn: 'Holy Quran (3)', hours: 1, type: 'university', prereq: null },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'المستوى الرابع (السنة الرابعة)',
    yearNameEn: 'Level 4 (Fourth Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'mec_itme4335', code: 'ITME4335', nameAr: 'أتمتة صناعية', nameEn: 'Industrial Automation', hours: 3, type: 'major', prereq: 'ITME3331' },
          { id: 'mec_itme5343', code: 'ITME5343', nameAr: 'إدارة الجودة والاعتمادية', nameEn: 'Quality Management and Reliability', hours: 3, type: 'major', prereq: 'ITIS1302' },
          { id: 'mec_itme5344', code: 'ITME5344', nameAr: 'الروبوت والأتمتة', nameEn: 'Robotics and Automation', hours: 3, type: 'major', prereq: 'ITME3331' },
          { id: 'mec_itmd5139', code: 'ITMD5139', nameAr: 'قضايا مهنية في الهندسة', nameEn: 'Professional issues in engineering', hours: 1, type: 'major', prereq: null },
          { id: 'mec_itme3306', code: 'ITME3306', nameAr: 'ماكينات كهربية', nameEn: 'Electric Machines', hours: 3, type: 'major', prereq: 'ITME2302' },
          { id: 'mec_itme3105', code: 'ITME3105', nameAr: 'مختبر الماكينات الكهربية', nameEn: 'Electric Machines Lab', hours: 1, type: 'major', prereq: 'ITME3306' },
          { id: 'mec_itme4201', code: 'ITME4201', nameAr: 'مشروع التخرج (1)', nameEn: 'Graduation Project (1)', hours: 2, type: 'major', prereq: null },
          { id: 'mec_itcs4319', code: 'ITCS4319', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', hours: 3, type: 'elective', prereq: 'ITCS1309' },
          { id: 'mec_itre2350', code: 'ITRE2350', nameAr: 'ميكانيكا الموائع', nameEn: 'Fluid Mechanics', hours: 3, type: 'elective', prereq: 'ITME2302' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'mec_itme4302', code: 'ITME4302', nameAr: 'الرياضيات والمحاكاة للمهندسين', nameEn: 'Math and Simulation for Engineers', hours: 3, type: 'major', prereq: 'MATH2301' },
          { id: 'mec_itme4203', code: 'ITME4203', nameAr: 'المتحكمات المنطقية المبرمجة (PLC)', nameEn: 'Programmable Logic Controllers', hours: 2, type: 'major', prereq: 'ITME4335' },
          { id: 'mec_itme4310', code: 'ITME4310', nameAr: 'أنظمة التحكم الحديثة', nameEn: 'Modern Control Systems', hours: 3, type: 'major', prereq: 'ITCC2304' },
          { id: 'mec_islm3201', code: 'ISLM3201', nameAr: 'دراسات في التفسير وعلوم القرآن', nameEn: 'Interpretation of Quran', hours: 2, type: 'university', prereq: null },
          { id: 'mec_islm4113', code: 'ISLM4113', nameAr: 'قرآن كريم (4)', nameEn: 'Holy Quran (4)', hours: 1, type: 'university', prereq: null },
          { id: 'mec_itme4103', code: 'ITME4103', nameAr: 'مختبر المتحكمات المنطقية المبرمجة', nameEn: 'Programmable Logic Controllers Lab', hours: 1, type: 'major', prereq: 'ITME4203' },
          { id: 'mec_itme4202', code: 'ITME4202', nameAr: 'مشروع التخرج (2)', nameEn: 'Graduation Project (2)', hours: 2, type: 'major', prereq: 'ITME4201' },
          { id: 'mec_itcc4325', code: 'ITCC4325', nameAr: 'مقدمة في معالجة الإشارات الرقمية', nameEn: 'Introduction to Digital Signals Processing', hours: 3, type: 'major', prereq: 'ITCC2304' },
          { id: 'mec_itme5371', code: 'ITME5371', nameAr: 'تصميم الأنظمة المدموجة المتقدمة', nameEn: 'Advanced Embedded Systems Design', hours: 3, type: 'elective', prereq: 'ITME3201' },
        ],
      },
    ],
  },
]

// ==============================================================================
// 6. هندسة الطاقة المتجددة (2025) - خطة رقم 9315
// ==============================================================================
const PLAN_RENEWABLE_2025 = [
  {
    year: 1,
    yearNameAr: 'المستوى الأول (السنة الأولى)',
    yearNameEn: 'Level 1 (First Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'ren_engl1201', code: 'ENGL1201', nameAr: 'اللغة الإنجليزية (1)', nameEn: 'English Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'ren_math1320', code: 'MATH1320', nameAr: 'تفاضل وتكامل (1)', nameEn: 'Calculus (1)', hours: 3, type: 'college', prereq: null },
          { id: 'ren_islm2201', code: 'ISLM2201', nameAr: 'دراسات في الحديث وعلومه', nameEn: 'Studies in Prophetic Tradition', hours: 2, type: 'university', prereq: null },
          { id: 'ren_itcc1301', code: 'ITCC1301', nameAr: 'دوائر كهربائية (1)', nameEn: 'Electric Circuits (1)', hours: 3, type: 'college', prereq: null },
          { id: 'ren_islm1101', code: 'ISLM1101', nameAr: 'قرآن كريم (1)', nameEn: 'Holy Quran (1)', hours: 1, type: 'university', prereq: null },
          { id: 'ren_itis1302', code: 'ITIS1302', nameAr: 'مبادئ الإدارة', nameEn: 'Introduction To Management', hours: 3, type: 'college', prereq: null },
          { id: 'ren_itcs1401', code: 'ITCS1401', nameAr: 'مقدمة في الحوسبة', nameEn: 'Introduction to Computing', hours: 4, type: 'college', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'ren_itcc1311', code: 'ITCC1311', nameAr: 'إلكترونيات (1)', nameEn: 'Electronics (1)', hours: 3, type: 'college', prereq: 'ITCC1301' },
          { id: 'ren_arab1201', code: 'ARAB1201', nameAr: 'اللغة العربية (1)', nameEn: 'Arabic Language (1)', hours: 2, type: 'university', prereq: null },
          { id: 'ren_itcs1309', code: 'ITCS1309', nameAr: 'برمجة حاسوب (1)', nameEn: 'Computer Programming (1)', hours: 3, type: 'college', prereq: 'ITCS1401' },
          { id: 'ren_itcc2303', code: 'ITCC2303', nameAr: 'تصميم المنطق الرقمي', nameEn: 'Digital Logic Design', hours: 3, type: 'college', prereq: 'ITCC1311' },
          { id: 'ren_math1321', code: 'MATH1321', nameAr: 'تفاضل وتكامل (2)', nameEn: 'Calculus (2)', hours: 3, type: 'college', prereq: 'MATH1320' },
          { id: 'ren_islm1201', code: 'ISLM1201', nameAr: 'دراسات في الفقه', nameEn: 'Jurisprudence', hours: 2, type: 'university', prereq: null },
          { id: 'ren_geol3203', code: 'GEOL3203', nameAr: 'علوم البيئة', nameEn: 'Environmental Sciences', hours: 2, type: 'university', prereq: null },
          { id: 'ren_pals4212', code: 'PALS4212', nameAr: 'فلسطين الأرض والإنسان', nameEn: 'Palestinian Land and Human', hours: 2, type: 'university', prereq: null },
          { id: 'ren_itme1101', code: 'ITME1101', nameAr: 'مقدمة في الهندسة', nameEn: 'Introduction to Engineering', hours: 1, type: 'college', prereq: null },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'المستوى الثاني (السنة الثانية)',
    yearNameEn: 'Level 2 (Second Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'ren_math2301', code: 'MATH2301', nameAr: 'احتمالات وإحصاء هندسي', nameEn: 'Statistics and Engineering Probabilities', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'ren_itme2201', code: 'ITME2201', nameAr: 'الرسم الهندسي', nameEn: 'Engineering Drawing', hours: 2, type: 'major', prereq: null },
          { id: 'ren_islm2202', code: 'ISLM2202', nameAr: 'دراسات في العقيدة الإسلامية', nameEn: 'Studies in Islamic Faith', hours: 2, type: 'university', prereq: null },
          { id: 'ren_itcc2302', code: 'ITCC2302', nameAr: 'دوائر كهربائية (2)', nameEn: 'Electric Circuits (2)', hours: 3, type: 'major', prereq: 'ITCC1301' },
          { id: 'ren_itme2101', code: 'ITME2101', nameAr: 'مختبر الرسم الهندسي', nameEn: 'Engineering Drawing Lab', hours: 1, type: 'major', prereq: 'ITME2201' },
          { id: 'ren_itcc2101', code: 'ITCC2101', nameAr: 'مختبر دوائر كهربائية', nameEn: 'Electrical Circuit Lab', hours: 1, type: 'major', prereq: 'ITCC2302' },
          { id: 'ren_itme2102', code: 'ITME2102', nameAr: 'مختبر هندسة وعلم المواد', nameEn: 'Material Sciences and Engineering Lab', hours: 1, type: 'major', prereq: 'ITME3329' },
          { id: 'ren_itme2302', code: 'ITME2302', nameAr: 'هندسة ميكانيكية (1)', nameEn: 'Engineering Mechanics (1)', hours: 3, type: 'major', prereq: null },
          { id: 'ren_itme3329', code: 'ITME3329', nameAr: 'هندسة وعلم المواد', nameEn: 'Materials Sciences and Engineering', hours: 3, type: 'major', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'ren_itcc2304', code: 'ITCC2304', nameAr: 'مقدمة في الإشارات والأنظمة', nameEn: 'Introduction to Signals and Systems', hours: 3, type: 'major', prereq: 'MATH1321' },
          { id: 'ren_itcc2331', code: 'ITCC2331', nameAr: 'إلكترونيات (2)', nameEn: 'Electronics (2)', hours: 3, type: 'major', prereq: 'ITCC1311' },
          { id: 'ren_itre3335', code: 'ITRE3335', nameAr: 'توليد الطاقة الكهربائية', nameEn: 'Power generation', hours: 3, type: 'major', prereq: 'ITCC2302' },
          { id: 'ren_islm2105', code: 'ISLM2105', nameAr: 'قرآن كريم (2)', nameEn: 'Holy Quran (2)', hours: 1, type: 'university', prereq: null },
          { id: 'ren_itcc2102', code: 'ITCC2102', nameAr: 'مختبر إلكترونيات', nameEn: 'Electronics Lab', hours: 1, type: 'major', prereq: 'ITCC2331' },
          { id: 'ren_itcc2104', code: 'ITCC2104', nameAr: 'مختبر الإشارات والأنظمة', nameEn: 'Signals and Systems Lab', hours: 1, type: 'major', prereq: 'ITCC2304' },
          { id: 'ren_itre2330', code: 'ITRE2330', nameAr: 'مقدمة في الطاقة المتجددة', nameEn: 'Introduction to Renewable Energy', hours: 3, type: 'major', prereq: null },
          { id: 'ren_itme2303', code: 'ITME2303', nameAr: 'هندسة ميكانيكية (2)', nameEn: 'Engineering Mechanics (2)', hours: 3, type: 'major', prereq: 'ITME2302' },
          { id: 'ren_itme2121', code: 'ITME2121', nameAr: 'ورش هندسية', nameEn: 'Engineering Workshop', hours: 1, type: 'major', prereq: null },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'المستوى الثالث (السنة الثالثة)',
    yearNameEn: 'Level 3 (Third Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'ren_itre3233', code: 'ITRE3233', nameAr: 'التركيبات الكهربائية والسلامة العامة', nameEn: 'Electrical Installations and Safety', hours: 2, type: 'major', prereq: 'ITME3306' },
          { id: 'ren_itme3302', code: 'ITME3302', nameAr: 'أنظمة التحكم', nameEn: 'Control Systems', hours: 3, type: 'major', prereq: 'ITCC2304' },
          { id: 'ren_itmd5139', code: 'ITMD5139', nameAr: 'قضايا مهنية في الهندسة', nameEn: 'Professional issues in engineering', hours: 1, type: 'major', prereq: null },
          { id: 'ren_itme3306', code: 'ITME3306', nameAr: 'ماكينات كهربية', nameEn: 'Electric Machines', hours: 3, type: 'major', prereq: 'ITME2302' },
          { id: 'ren_itme3102', code: 'ITME3102', nameAr: 'مختبر أنظمة التحكم', nameEn: 'Control Systems Lab', hours: 1, type: 'major', prereq: 'ITME3302' },
          { id: 'ren_itre3156', code: 'ITRE3156', nameAr: 'مختبر التركيبات الكهربائية والسلامة العامة', nameEn: 'Electrical Installations Lab', hours: 1, type: 'major', prereq: 'ITRE3233' },
          { id: 'ren_itme3105', code: 'ITME3105', nameAr: 'مختبر الماكينات الكهربية', nameEn: 'Electric Machines Lab', hours: 1, type: 'major', prereq: 'ITME3306' },
          { id: 'ren_itre2151', code: 'ITRE2151', nameAr: 'مختبر ميكانيكا الموائع', nameEn: 'Fluid Mechanics Lab', hours: 1, type: 'major', prereq: 'ITRE2350' },
          { id: 'ren_math2308', code: 'MATH2308', nameAr: 'معادلات تفاضلية عادية (1)', nameEn: 'Ordinary Diff.Equations (1)', hours: 3, type: 'major', prereq: null },
          { id: 'ren_itre2350', code: 'ITRE2350', nameAr: 'ميكانيكا الموائع', nameEn: 'Fluid Mechanics', hours: 3, type: 'major', prereq: 'ITME2302' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'ren_itre3232', code: 'ITRE3232', nameAr: 'أجهزة قياس الطاقة', nameEn: 'Energy systems instrumentation', hours: 2, type: 'major', prereq: 'ITRE2330' },
          { id: 'ren_itre3331', code: 'ITRE3331', nameAr: 'أنظمة الطاقة الكهروضوئية', nameEn: 'Solar Photovoltaic Systems', hours: 3, type: 'major', prereq: 'ITCC2331' },
          { id: 'ren_itme3301', code: 'ITME3301', nameAr: 'الديناميكا الحرارية', nameEn: 'Thermodynamics', hours: 3, type: 'major', prereq: 'ITRE2350' },
          { id: 'ren_itme3201', code: 'ITME3201', nameAr: 'المتحكم الدقيق: البرمجة والتطبيقات', nameEn: 'Microcontroller: Programming and Applications', hours: 2, type: 'major', prereq: 'ITCC2331' },
          { id: 'ren_itme3203', code: 'ITME3203', nameAr: 'أنظمة إلكترونيات القوى', nameEn: 'Power Electronics Systems', hours: 2, type: 'major', prereq: 'ITCC2331' },
          { id: 'ren_itre4133', code: 'ITRE4133', nameAr: 'تدريب ميداني', nameEn: 'Co-op Training', hours: 1, type: 'major', prereq: null },
          { id: 'ren_islm3201', code: 'ISLM3201', nameAr: 'دراسات في التفسير وعلوم القرآن', nameEn: 'Interpretation of Quran', hours: 2, type: 'university', prereq: null },
          { id: 'ren_itre3133', code: 'ITRE3133', nameAr: 'مختبر أجهزة قياس الطاقة', nameEn: 'Energy systems instrumentation Lab', hours: 1, type: 'major', prereq: 'ITRE3232' },
          { id: 'ren_itme3101', code: 'ITME3101', nameAr: 'مختبر المتحكم الدقيق', nameEn: 'Microcontroller Lab', hours: 1, type: 'major', prereq: 'ITME3201' },
          { id: 'ren_itre3132', code: 'ITRE3132', nameAr: 'مختبر أنظمة الطاقة الكهروضوئية', nameEn: 'Solar Photovoltaic Systems Lab', hours: 1, type: 'major', prereq: 'ITRE3331' },
          { id: 'ren_itme3104', code: 'ITME3104', nameAr: 'مختبر أنظمة إلكترونيات القوى', nameEn: 'Power Electronics Systems Lab', hours: 1, type: 'major', prereq: 'ITME3203' },
        ],
      },
      {
        semester: 3,
        semesterNameAr: 'الفصل الصيفي',
        semesterNameEn: 'Summer Semester',
        courses: [
          { id: 'ren_islm3107', code: 'ISLM3107', nameAr: 'قرآن كريم (3)', nameEn: 'Holy Quran (3)', hours: 1, type: 'university', prereq: null },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'المستوى الرابع (السنة الرابعة)',
    yearNameEn: 'Level 4 (Fourth Year)',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'ren_itre4235', code: 'ITRE4235', nameAr: 'أنظمة الطاقة الشمسية الحرارية', nameEn: 'Solar thermal energy systems', hours: 2, type: 'major', prereq: 'ITME3203' },
          { id: 'ren_itme5343', code: 'ITME5343', nameAr: 'إدارة الجودة والاعتمادية', nameEn: 'Quality Management and Reliability', hours: 3, type: 'elective', prereq: 'ITIS1302' },
          { id: 'ren_itre3355', code: 'ITRE3355', nameAr: 'الانتقال الحراري', nameEn: 'Heat Transfer', hours: 3, type: 'major', prereq: 'ITME3301' },
          { id: 'ren_itme5201', code: 'ITME5201', nameAr: 'الطاقة الحيوية', nameEn: 'Bioenergy', hours: 2, type: 'major', prereq: 'ITRE2330' },
          { id: 'ren_itre4303', code: 'ITRE4303', nameAr: 'تخطيط وتشغيل أنظمة الطاقة الكهربائية', nameEn: 'Power Systems Planning and Operation', hours: 3, type: 'major', prereq: 'ITRE3331' },
          { id: 'ren_itre4304', code: 'ITRE4304', nameAr: 'دمج الطاقة المتجددة في شبكة الكهرباء', nameEn: 'Integration of Renewable Energy in Power Systems', hours: 3, type: 'major', prereq: 'ITME3203' },
          { id: 'ren_itre4135', code: 'ITRE4135', nameAr: 'مختبر أنظمة الطاقة الشمسية الحرارية', nameEn: 'Solar thermal energy systems Lab', hours: 1, type: 'major', prereq: 'ITRE4235' },
          { id: 'ren_itre4201', code: 'ITRE4201', nameAr: 'مشروع التخرج (1)', nameEn: 'Graduation Project (1)', hours: 2, type: 'major', prereq: null },
          { id: 'ren_itme4306', code: 'ITME4306', nameAr: 'عناصر الماكينات الميكانيكية', nameEn: 'Mechanical Machines Elements', hours: 3, type: 'elective', prereq: 'ITME2303' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'ren_itre4334', code: 'ITRE4334', nameAr: 'أنظمة تخزين الطاقة', nameEn: 'Energy storage systems', hours: 3, type: 'major', prereq: 'ITRE2330' },
          { id: 'ren_itre4337', code: 'ITRE4337', nameAr: 'أنظمة طاقة الرياح', nameEn: 'Wind Energy Systems', hours: 3, type: 'major', prereq: 'ITME3306' },
          { id: 'ren_itme4302', code: 'ITME4302', nameAr: 'الرياضيات والمحاكاة للمهندسين', nameEn: 'Math and Simulation for Engineers', hours: 3, type: 'major', prereq: 'MATH2301' },
          { id: 'ren_itre5201', code: 'ITRE5201', nameAr: 'أنظمة التكييف والتبريد', nameEn: 'Air Conditioning & Refrigeration Systems', hours: 2, type: 'major', prereq: 'ITRE3355' },
          { id: 'ren_islm4113', code: 'ISLM4113', nameAr: 'قرآن كريم (4)', nameEn: 'Holy Quran (4)', hours: 1, type: 'university', prereq: null },
          { id: 'ren_itre4202', code: 'ITRE4202', nameAr: 'مشروع التخرج (2)', nameEn: 'Graduation Project (2)', hours: 2, type: 'major', prereq: 'ITRE4201' },
          { id: 'ren_itre5355', code: 'ITRE5355', nameAr: 'أنظمة الطاقة الشمسية المتقدمة', nameEn: 'Advanced Solar Thermal Systems', hours: 3, type: 'elective', prereq: 'ITRE4235' },
          { id: 'ren_itre5339', code: 'ITRE5339', nameAr: 'تصميم المباني الموفرة للطاقة', nameEn: 'Green buildings', hours: 3, type: 'elective', prereq: 'ITRE3232' },
        ],
      },
    ],
  },
]

// ==============================================================================
// قائمة كافة الخطط المعتمدة الكاملة (Multi-Plan Registry)
// ==============================================================================
export const ACADEMIC_PLANS = [
  {
    id: 'cse-2025',
    planNumber: '9312',
    nameAr: 'هندسة أنظمة الحاسوب (2025)',
    nameEn: 'Computer Systems Engineering (2025)',
    departmentAr: 'قسم هندسة أنظمة الحاسوب',
    departmentEn: 'Department of Computer Systems Engineering',
    facultyAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    facultyEn: 'Faculty of Engineering & Information Technology',
    year: '2025',
    badge: 'جديد 2025',
    curriculum: PLAN_CSE_2025,
  },
  {
    id: 'cs-2020',
    planNumber: '9243',
    nameAr: 'علوم الحاسوب (2020)',
    nameEn: 'Computer Science (2020)',
    departmentAr: 'قسم علوم الحاسوب',
    departmentEn: 'Department of Computer Science',
    facultyAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    facultyEn: 'Faculty of Engineering & Information Technology',
    year: '2020',
    badge: 'معتمد',
    curriculum: PLAN_CS_2020,
  },
  {
    id: 'is-2020',
    planNumber: '9274',
    nameAr: 'نظم المعلومات (2020)',
    nameEn: 'Information Systems (2020)',
    departmentAr: 'قسم نظم المعلومات',
    departmentEn: 'Department of Information Systems',
    facultyAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    facultyEn: 'Faculty of Engineering & Information Technology',
    year: '2020',
    badge: 'معتمد',
    curriculum: PLAN_IS_2020,
  },
  {
    id: 'cce-2025',
    planNumber: '9313',
    nameAr: 'هندسة الحاسوب والاتصالات (2025)',
    nameEn: 'Computer & Communications Engineering (2025)',
    departmentAr: 'قسم هندسة الحاسوب والاتصالات',
    departmentEn: 'Department of Computer & Communications Engineering',
    facultyAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    facultyEn: 'Faculty of Engineering & Information Technology',
    year: '2025',
    badge: 'هندسي 2025',
    curriculum: PLAN_CCE_2025,
  },
  {
    id: 'mechatronics-2025',
    planNumber: '9314',
    nameAr: 'هندسة الميكاترونكس (2025)',
    nameEn: 'Mechatronics Engineering (2025)',
    departmentAr: 'قسم هندسة الميكاترونكس',
    departmentEn: 'Department of Mechatronics Engineering',
    facultyAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    facultyEn: 'Faculty of Engineering & Information Technology',
    year: '2025',
    badge: 'هندسي 2025',
    curriculum: PLAN_MECHATRONICS_2025,
  },
  {
    id: 'renewable-2025',
    planNumber: '9315',
    nameAr: 'هندسة الطاقة المتجددة (2025)',
    nameEn: 'Renewable Energy Engineering (2025)',
    departmentAr: 'قسم هندسة الطاقة المتجددة',
    departmentEn: 'Department of Renewable Energy Engineering',
    facultyAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    facultyEn: 'Faculty of Engineering & Information Technology',
    year: '2025',
    badge: 'هندسي 2025',
    curriculum: PLAN_RENEWABLE_2025,
  },
]

/**
 * Returns a plan by ID or defaults to the first plan (CSE 2025).
 */
export function getAcademicPlan(planId) {
  const found = ACADEMIC_PLANS.find(p => p.id === planId)
  return found || ACADEMIC_PLANS[0]
}

/**
 * Backward-compatible default export: default curriculum is CSE 2025
 */
export const ACADEMIC_CURRICULUM = ACADEMIC_PLANS[0].curriculum
