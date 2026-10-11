/**
 * Al-Azhar University - Faculty of Engineering & Information Technology
 * Official 4-Year Academic Curriculum Structure for Computer Science & IT.
 */

export const COURSE_TYPES = {
  university: { labelAr: 'متطلب جامعة', labelEn: 'University Requirement', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  college: { labelAr: 'متطلب كلية', labelEn: 'College Requirement', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  major: { labelAr: 'إجباري تخصص', labelEn: 'Major Mandatory', color: 'bg-royal-500/10 text-royal-600 dark:text-cyan-400 border-royal-500/20 dark:border-cyan-500/20' },
  elective: { labelAr: 'اختياري تخصص', labelEn: 'Major Elective', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
}

export const ACADEMIC_CURRICULUM = [
  {
    year: 1,
    yearNameAr: 'السنة الأولى',
    yearNameEn: 'First Year',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cs101', code: 'CS 101', nameAr: 'مقدمة في تكنولوجيا المعلومات والحاسوب', nameEn: 'Introduction to IT & CS', hours: 3, type: 'college', prereq: null },
          { id: 'cs102', code: 'CS 102', nameAr: 'مبادئ البرمجة وحل المشكلات', nameEn: 'Programming Fundamentals', hours: 3, type: 'major', prereq: null },
          { id: 'math101', code: 'MATH 101', nameAr: 'تفاضل وتكامل (1)', nameEn: 'Calculus I', hours: 3, type: 'college', prereq: null },
          { id: 'eng101', code: 'ENGL 101', nameAr: 'اللغة الإنجليزية الأكاديمية (1)', nameEn: 'Academic English I', hours: 2, type: 'university', prereq: null },
          { id: 'is101', code: 'ISLM 101', nameAr: 'الثقافة والدراسات الإسلامية', nameEn: 'Islamic Culture & Ethics', hours: 2, type: 'university', prereq: null },
          { id: 'comm101', code: 'COMM 101', nameAr: 'مهارات الاتصال واللغة العربية', nameEn: 'Communication Skills & Arabic', hours: 2, type: 'university', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cs103', code: 'CS 103', nameAr: 'البرمجة الموجهة للكائنات (OOP)', nameEn: 'Object-Oriented Programming', hours: 3, type: 'major', prereq: 'CS 102' },
          { id: 'cs104', code: 'CS 104', nameAr: 'التصميم والمنطق الرقمي', nameEn: 'Digital Logic Design', hours: 3, type: 'college', prereq: null },
          { id: 'math102', code: 'MATH 102', nameAr: 'الرياضيات المتقطعة', nameEn: 'Discrete Mathematics', hours: 3, type: 'college', prereq: 'MATH 101' },
          { id: 'math103', code: 'MATH 103', nameAr: 'تفاضل وتكامل (2)', nameEn: 'Calculus II', hours: 3, type: 'college', prereq: 'MATH 101' },
          { id: 'phys101', code: 'PHYS 101', nameAr: 'فيزياء عامة للحاسوب', nameEn: 'General Physics for Computing', hours: 3, type: 'college', prereq: null },
          { id: 'eng102', code: 'ENGL 102', nameAr: 'اللغة الإنجليزية الأكاديمية (2)', nameEn: 'Academic English II', hours: 2, type: 'university', prereq: 'ENGL 101' },
        ],
      },
    ],
  },
  {
    year: 2,
    yearNameAr: 'السنة الثانية',
    yearNameEn: 'Second Year',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'cs201', code: 'CS 201', nameAr: 'تراكيب البيانات (Data Structures)', nameEn: 'Data Structures', hours: 3, type: 'major', prereq: 'CS 103' },
          { id: 'cs202', code: 'CS 202', nameAr: 'تنظيم وعمارة الحاسوب', nameEn: 'Computer Organization & Architecture', hours: 3, type: 'major', prereq: 'CS 104' },
          { id: 'math201', code: 'MATH 201', nameAr: 'الجبر الخطي وتطبيقاته', nameEn: 'Linear Algebra', hours: 3, type: 'college', prereq: 'MATH 101' },
          { id: 'stat201', code: 'STAT 201', nameAr: 'الاحتمالات والإحصاء لعلوم الحاسوب', nameEn: 'Probability & Statistics for CS', hours: 3, type: 'college', prereq: 'MATH 101' },
          { id: 'web201', code: 'IT 201', nameAr: 'تقنيات ومفاهيم الويب (1)', nameEn: 'Web Technologies I', hours: 3, type: 'major', prereq: 'CS 103' },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'cs203', code: 'CS 203', nameAr: 'تصميم وتحليل الخوارزميات', nameEn: 'Algorithms Design & Analysis', hours: 3, type: 'major', prereq: 'CS 201' },
          { id: 'db201', code: 'IT 202', nameAr: 'نظم قواعد البيانات (1)', nameEn: 'Database Systems I', hours: 3, type: 'major', prereq: 'CS 201' },
          { id: 'os201', code: 'CS 204', nameAr: 'نظم التشغيل (Operating Systems)', nameEn: 'Operating Systems', hours: 3, type: 'major', prereq: 'CS 202' },
          { id: 'net201', code: 'NET 201', nameAr: 'شبكات الحاسوب (1)', nameEn: 'Computer Networks I', hours: 3, type: 'major', prereq: 'CS 202' },
          { id: 'se201', code: 'SE 201', nameAr: 'البرمجة المرئية وواجهات المستخدم', nameEn: 'Visual Programming & GUI', hours: 3, type: 'major', prereq: 'CS 103' },
        ],
      },
    ],
  },
  {
    year: 3,
    yearNameAr: 'السنة الثالثة',
    yearNameEn: 'Third Year',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'se301', code: 'SE 301', nameAr: 'هندسة البرمجيات وتحليل النظم (1)', nameEn: 'Software Engineering & Analysis', hours: 3, type: 'major', prereq: 'IT 202' },
          { id: 'db301', code: 'IT 301', nameAr: 'نظم قواعد البيانات المتقدمة وإدارتها', nameEn: 'Advanced Database Systems', hours: 3, type: 'major', prereq: 'IT 202' },
          { id: 'web301', code: 'IT 302', nameAr: 'تطوير تطبيقات الويب المتقدمة (2)', nameEn: 'Advanced Web Applications', hours: 3, type: 'major', prereq: 'IT 201' },
          { id: 'net301', code: 'NET 301', nameAr: 'شبكات الحاسوب المتقدمة والبروتوكولات', nameEn: 'Advanced Computer Networks', hours: 3, type: 'major', prereq: 'NET 201' },
          { id: 'elc301', code: 'ELEC 301', nameAr: 'مساق اختياري تخصصي (1)', nameEn: 'Major Elective I', hours: 3, type: 'elective', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'ai301', code: 'CS 301', nameAr: 'مقدمة في الذكاء الاصطناعي', nameEn: 'Introduction to AI', hours: 3, type: 'major', prereq: 'CS 203' },
          { id: 'sec301', code: 'SEC 301', nameAr: 'أمن الشبكات والمعلومات', nameEn: 'Network & Information Security', hours: 3, type: 'major', prereq: 'NET 201' },
          { id: 'mob301', code: 'IT 303', nameAr: 'برمجة وتطبيقات الأجهزة الذكية المحمولة', nameEn: 'Mobile Application Development', hours: 3, type: 'major', prereq: 'CS 103' },
          { id: 'se302', code: 'SE 302', nameAr: 'هندسة البرمجيات (2) واختبار البرمجيات', nameEn: 'Software Engineering II & Testing', hours: 3, type: 'major', prereq: 'SE 301' },
          { id: 'elc302', code: 'ELEC 302', nameAr: 'مساق اختياري تخصصي (2)', nameEn: 'Major Elective II', hours: 3, type: 'elective', prereq: null },
        ],
      },
    ],
  },
  {
    year: 4,
    yearNameAr: 'السنة الرابعة',
    yearNameEn: 'Fourth Year',
    semesters: [
      {
        semester: 1,
        semesterNameAr: 'الفصل الدراسي الأول',
        semesterNameEn: 'First Semester',
        courses: [
          { id: 'proj401', code: 'PROJ 401', nameAr: 'مشروع التخرج (1)', nameEn: 'Graduation Project I', hours: 3, type: 'major', prereq: '90+ Hours' },
          { id: 'ml401', code: 'CS 401', nameAr: 'التعلم الآلي واستخراج البيانات', nameEn: 'Machine Learning & Data Mining', hours: 3, type: 'major', prereq: 'CS 301' },
          { id: 'cld401', code: 'IT 401', nameAr: 'الحوسبة السحابية والنظم الموزعة', nameEn: 'Cloud Computing & Distributed Systems', hours: 3, type: 'major', prereq: 'NET 301' },
          { id: 'mgmt401', code: 'MGMT 401', nameAr: 'إدارة مشاريع تكنولوجيا المعلومات والأخلاقيات', nameEn: 'IT Project Management & Ethics', hours: 2, type: 'college', prereq: null },
          { id: 'elc401', code: 'ELEC 401', nameAr: 'مساق اختياري تخصصي (3)', nameEn: 'Major Elective III', hours: 3, type: 'elective', prereq: null },
        ],
      },
      {
        semester: 2,
        semesterNameAr: 'الفصل الدراسي الثاني',
        semesterNameEn: 'Second Semester',
        courses: [
          { id: 'proj402', code: 'PROJ 402', nameAr: 'مشروع التخرج (2)', nameEn: 'Graduation Project II', hours: 3, type: 'major', prereq: 'PROJ 401' },
          { id: 'trn401', code: 'TRN 401', nameAr: 'التدريب الميداني والعملي', nameEn: 'Practical Field Internship', hours: 3, type: 'major', prereq: 'Senior' },
          { id: 'ent401', code: 'ENTR 401', nameAr: 'ريادة الأعمال والابتكار التقني', nameEn: 'Tech Entrepreneurship & Innovation', hours: 2, type: 'university', prereq: null },
          { id: 'elc402', code: 'ELEC 402', nameAr: 'مساق اختياري تخصصي (4)', nameEn: 'Major Elective IV', hours: 3, type: 'elective', prereq: null },
        ],
      },
    ],
  },
]
