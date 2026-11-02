/**
 * Default accredited Computer Science lecture fixtures for Al-Azhar IT Hub.
 * Provides fallback educational lectures when external database is empty,
 * enabling immediate student playback and subtitle synchronization.
 */

export const DEFAULT_COURSES = [
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
