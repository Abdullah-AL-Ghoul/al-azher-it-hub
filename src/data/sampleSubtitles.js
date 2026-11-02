/**
 * Initial educational subtitle and transcript sample data for Al-Azhar IT Hub.
 *
 * Provides ready-to-use, academically accurate WebVTT-compatible subtitle tracks
 * for IT & Computer Science courses (Data Structures, Algorithms, Web Development, etc.)
 * with technical terms normalized per the technical glossary.
 */

export const INITIAL_SUBTITLES = [
  {
    id: 'sub_demo_ar',
    lectureId: 'demo-1',
    language: 'ar',
    labelAr: 'العربية (Arabic)',
    labelEn: 'Arabic',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    cues: [
      {
        id: 'c1',
        start: 0,
        end: 4.5,
        text: 'بسم الله الرحمن الرحيم، مرحباً بكم جميعاً في مساق هياكل البيانات والخوارزميات.',
      },
      {
        id: 'c2',
        start: 5.0,
        end: 9.8,
        text: 'في هذه المحاضرة سنتعرف على مفهوم المصفوفة (Array) وكيف يتم تخزين العناصر في الذاكرة.',
      },
      {
        id: 'c3',
        start: 10.2,
        end: 15.6,
        text: 'تتميز المصفوفة بأن عناصرها تخزن في مواقع ذاكرة متتالية، مما يتيح الوصول المباشر (Direct Access) بتعقيد زمني O(1).',
      },
      {
        id: 'c4',
        start: 16.0,
        end: 22.0,
        text: 'ولكن ما هو التحدي الرئيسي؟ التحدي يكمن في عمليات الإدراج (Insertion) والحذف (Deletion) التي تتطلب إزاحة العناصر بتعقيد O(n).',
      },
      {
        id: 'c5',
        start: 22.5,
        end: 28.4,
        text: 'لذلك سنتطرق إلى القوائم المترابطة (Linked Lists) كبديل ديناميكي يتغلب على محدودية الحجم الثابت.',
      },
      {
        id: 'c6',
        start: 29.0,
        end: 35.0,
        text: 'تتكون القائمة المترابطة من عقد (Nodes)، كل عقدة تحتوي على البيانات ومؤشر (Pointer) إلى العقدة التالية.',
      },
      {
        id: 'c7',
        start: 35.5,
        end: 42.0,
        text: 'دعونا ننتقل الآن إلى كتابة الكود البرمجي العملي بلغة C++ وتوضيح كيفية إدارة المؤشرات بطريقة آمنة.',
      },
      {
        id: 'c8',
        start: 42.5,
        end: 50.0,
        text: 'تأكدوا دائماً من تحرير الذاكرة المحجوزة لتفادي مشكلة تسرب الذاكرة (Memory Leak).',
      },
    ],
  },
  {
    id: 'sub_demo_en',
    lectureId: 'demo-1',
    language: 'en',
    labelAr: 'الإنجليزية (English)',
    labelEn: 'English',
    sourceType: 'original_transcript',
    status: 'published',
    version: 1,
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    cues: [
      {
        id: 'c1',
        start: 0,
        end: 4.5,
        text: 'Welcome everyone to the Data Structures and Algorithms lecture series.',
      },
      {
        id: 'c2',
        start: 5.0,
        end: 9.8,
        text: 'In this session, we will explore the fundamental concepts of Arrays and memory allocation.',
      },
      {
        id: 'c3',
        start: 10.2,
        end: 15.6,
        text: 'Arrays provide contiguous memory blocks, granting instantaneous O(1) random access.',
      },
      {
        id: 'c4',
        start: 16.0,
        end: 22.0,
        text: 'However, insertion and deletion require element shifting, yielding O(n) worst-case complexity.',
      },
      {
        id: 'c5',
        start: 22.5,
        end: 28.4,
        text: 'To overcome static sizing constraints, we introduce dynamic Linked Lists.',
      },
      {
        id: 'c6',
        start: 29.0,
        end: 35.0,
        text: 'Each node encapsulates payload data and a pointer referencing the subsequent node.',
      },
      {
        id: 'c7',
        start: 35.5,
        end: 42.0,
        text: 'Now let us step through a practical C++ implementation focusing on safe pointer manipulation.',
      },
      {
        id: 'c8',
        start: 42.5,
        end: 50.0,
        text: 'Always ensure dynamically allocated heap memory is appropriately deallocated to prevent memory leaks.',
      },
    ],
  },
]
