/**
 * Default accredited Computer Science & AI lecture fixtures for Al-Azhar IT Hub.
 * Provides fallback educational lectures when external database is empty,
 * enabling immediate student playback and subtitle synchronization.
 */

export const DEFAULT_COURSES = [
  {
    id: 'course-ai',
    nameAr: 'الذكاء الاصطناعي وتعلم الآلة',
    nameEn: 'Artificial Intelligence & Machine Learning',
    code: 'ITCS3308',
    descriptionAr: 'دراسة شاملة لأساسيات الذكاء الاصطناعي، والشبكات العصبية العميقة، ودوال التنشيط، والانحدار التدريجي.',
    descriptionEn: 'Comprehensive study of Artificial Intelligence fundamentals, Deep Neural Networks, and Gradient Descent optimization.',
  },
  {
    id: 'course-ds',
    nameAr: 'هياكل البيانات والخوارزميات',
    nameEn: 'Data Structures & Algorithms',
    code: 'ITCS2301',
    descriptionAr: 'دراسة متقدمة في هياكل البيانات كالمصفوفات والقوائم المترابطة والأشجار والخوارزميات.',
    descriptionEn: 'Advanced study of data structures including arrays, linked lists, trees, and algorithmic complexity.',
  },
  {
    id: 'course-prog',
    nameAr: 'برمجة حاسوب (1)',
    nameEn: 'Computer Programming 1',
    code: 'ITCS1309',
    descriptionAr: 'مبادئ البرمجة المنظمة بلغة C++ وإدارة الذاكرة والمؤشرات.',
    descriptionEn: 'Principles of structured programming in C++, memory management, and pointers.',
  },
]

export const DEFAULT_LECTURES = [
  // ==========================================
  // Artificial Intelligence (مساق الذكاء الاصطناعي)
  // ==========================================
  {
    id: '184c887b-1d29-468a-b592-313768735783',
    aliasId: 'lec-ai-101',
    titleAr: 'المحاضرة 1: مدخل إلى الذكاء الاصطناعي والشبكات العصبية العميقة (Neural Networks)',
    titleEn: 'Lecture 1: Introduction to AI & Deep Neural Networks',
    subjectAr: 'الذكاء الاصطناعي وتعلم الآلة',
    subjectEn: 'Artificial Intelligence & Machine Learning',
    doctorAr: 'د. يوسف رضوان',
    doctorEn: 'Dr. Youssef Radwan',
    url: 'https://www.youtube.com/watch?v=aircAruvnKk',
    thumbnail: 'https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg',
    date: '2026-10-22',
    sortOrder: 1,
    createdAt: '2026-10-22T09:00:00.000Z',
  },
  {
    id: 'lec-ai-102',
    titleAr: 'المحاضرة 2: خوارزمية الانحدار التدريجي ودالة الخسارة (Gradient Descent & Loss Function)',
    titleEn: 'Lecture 2: Gradient Descent Optimization & Loss Functions',
    subjectAr: 'الذكاء الاصطناعي وتعلم الآلة',
    subjectEn: 'Artificial Intelligence & Machine Learning',
    doctorAr: 'د. يوسف رضوان',
    doctorEn: 'Dr. Youssef Radwan',
    url: 'https://www.youtube.com/watch?v=IHZwWFHWa-w',
    thumbnail: 'https://i.ytimg.com/vi/IHZwWFHWa-w/hqdefault.jpg',
    date: '2026-10-25',
    sortOrder: 2,
    createdAt: '2026-10-25T09:00:00.000Z',
  },
  {
    id: 'lec-ai-103',
    titleAr: 'المحاضرة 3: نماذج المحولات ومعالجة اللغات الطبيعية (Transformers & Attention Mechanism)',
    titleEn: 'Lecture 3: Transformers Architecture & Self-Attention Mechanisms',
    subjectAr: 'الذكاء الاصطناعي وتعلم الآلة',
    subjectEn: 'Artificial Intelligence & Machine Learning',
    doctorAr: 'د. يوسف رضوان',
    doctorEn: 'Dr. Youssef Radwan',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4U',
    thumbnail: 'https://i.ytimg.com/vi/wjZofJX0v4U/hqdefault.jpg',
    date: '2026-10-28',
    sortOrder: 3,
    createdAt: '2026-10-28T09:00:00.000Z',
  },

  // ==========================================
  // Data Structures & Programming
  // ==========================================
  {
    id: 'lec-ds-101',
    titleAr: 'المحاضرة 1: مقدمة في هياكل البيانات وتخطيط المصفوفات (Arrays)',
    titleEn: 'Lecture 1: Introduction to Data Structures & Arrays',
    subjectAr: 'هياكل البيانات والخوارزميات',
    subjectEn: 'Data Structures & Algorithms',
    doctorAr: 'د. أحمد الشريف',
    doctorEn: 'Dr. Ahmed El-Sherif',
    url: 'https://www.youtube.com/watch?v=RBSGKlAnoiM',
    thumbnail: 'https://i.ytimg.com/vi/RBSGKlAnoiM/hqdefault.jpg',
    date: '2026-10-15',
    sortOrder: 1,
    createdAt: '2026-10-15T09:00:00.000Z',
  },
  {
    id: 'lec-ds-102',
    titleAr: 'المحاضرة 2: القوائم المترابطة وأشجار البحث الثنائية (BST)',
    titleEn: 'Lecture 2: Linked Lists & Binary Search Trees',
    subjectAr: 'هياكل البيانات والخوارزميات',
    subjectEn: 'Data Structures & Algorithms',
    doctorAr: 'د. أحمد الشريف',
    doctorEn: 'Dr. Ahmed El-Sherif',
    url: 'https://www.youtube.com/watch?v=Fhpep1GjQfI',
    thumbnail: 'https://i.ytimg.com/vi/Fhpep1GjQfI/hqdefault.jpg',
    date: '2026-10-18',
    sortOrder: 2,
    createdAt: '2026-10-18T09:00:00.000Z',
  },
  {
    id: 'lec-prog-201',
    titleAr: 'المحاضرة 1: مدخل البرمجة بلغة C++ وإدارة المؤشرات (Pointers)',
    titleEn: 'Lecture 1: Introduction to C++ & Pointers Manipulation',
    subjectAr: 'برمجة حاسوب (1)',
    subjectEn: 'Computer Programming 1',
    doctorAr: 'د. خليل النجار',
    doctorEn: 'Dr. Khalil El-Najjar',
    url: 'https://www.youtube.com/watch?v=vLnPwxZdW4Y',
    thumbnail: 'https://i.ytimg.com/vi/vLnPwxZdW4Y/hqdefault.jpg',
    date: '2026-10-20',
    sortOrder: 1,
    createdAt: '2026-10-20T09:00:00.000Z',
  },
]
