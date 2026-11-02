/**
 * Initial educational subtitle and transcript sample data for Al-Azhar IT Hub.
 *
 * Provides ready-to-use, academically accurate WebVTT-compatible subtitle tracks
 * for IT & Computer Science courses (Data Structures, Algorithms, Web Development, etc.)
 * with technical terms normalized per the technical glossary.
 */

export const INITIAL_SUBTITLES = [
  // ==========================================
  // Lecture 1: lec-ds-101 (Data Structures - Arrays)
  // ==========================================
  {
    id: 'sub_ds101_ar',
    lectureId: 'lec-ds-101',
    language: 'ar',
    labelAr: 'العربية (مترجمة ومعتمدة)',
    labelEn: 'Arabic (Verified)',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    cues: [
      {
        id: 'ds101_1',
        start: 0,
        end: 4.8,
        text: 'بسم الله الرحمن الرحيم، مرحباً بكم جميعاً في مساق هياكل البيانات والخوارزميات لطلبة تكنولوجيا المعلومات.',
      },
      {
        id: 'ds101_2',
        start: 5.2,
        end: 10.5,
        text: 'في هذه المحاضرة سنبدأ بأهم وأبسط هيكل بيانات وهو المصفوفة (Array) وتخطيطها داخل الذاكرة (Memory Layout).',
      },
      {
        id: 'ds101_3',
        start: 11.0,
        end: 17.5,
        text: 'المصفوفة هي كتلة متصلة من الذاكرة (Contiguous Memory)، ولهذا تتيح لنا الوصول المباشر (Direct Access) بتعقيد زمني O(1).',
      },
      {
        id: 'ds101_4',
        start: 18.0,
        end: 24.5,
        text: 'معادلة حساب موقع العنصر تعتمد على العنوان الأساسي (Base Address) زائد الفهرس (Index) مضروباً في حجم النوع.',
      },
      {
        id: 'ds101_5',
        start: 25.0,
        end: 32.0,
        text: 'ولكن ما هو التحدي الرئيسي؟ التحدي يكمن في عمليات الإدراج (Insertion) والحذف التي تتطلب إزاحة بقية العناصر بتعقيد O(n).',
      },
      {
        id: 'ds101_6',
        start: 32.5,
        end: 39.5,
        text: 'لذلك، عندما نحتاج إلى حجم ديناميكي وإدراج سريع، نلجأ إلى القوائم المترابطة (Linked Lists) كبديل فعال.',
      },
      {
        id: 'ds101_7',
        start: 40.0,
        end: 48.0,
        text: 'دعونا ننتقل الآن إلى الشرح العملي، وكيف نقوم بحجز الذاكرة الحيوية (Dynamic Memory) في C++ بطريقة آمنة.',
      },
      {
        id: 'ds101_8',
        start: 48.5,
        end: 56.0,
        text: 'تذكروا دائماً استخدام delete بعد new لتفادي مشكلة تسرب الذاكرة (Memory Leak).',
      },
    ],
  },
  {
    id: 'sub_ds101_en',
    lectureId: 'lec-ds-101',
    language: 'en',
    labelAr: 'الإنجليزية (الأصلية)',
    labelEn: 'English (Original)',
    sourceType: 'original_transcript',
    status: 'published',
    version: 1,
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    cues: [
      {
        id: 'ds101_en_1',
        start: 0,
        end: 4.8,
        text: 'Welcome everyone to the Data Structures and Algorithms lecture series for IT students.',
      },
      {
        id: 'ds101_en_2',
        start: 5.2,
        end: 10.5,
        text: 'In this session, we start with the foundational structure: Arrays and their underlying Memory Layout.',
      },
      {
        id: 'ds101_en_3',
        start: 11.0,
        end: 17.5,
        text: 'An array occupies contiguous memory blocks, granting instantaneous O(1) random access guarantees.',
      },
      {
        id: 'ds101_en_4',
        start: 18.0,
        end: 24.5,
        text: 'The memory address formula computes Base Address plus index multiplied by data type element size.',
      },
      {
        id: 'ds101_en_5',
        start: 25.0,
        end: 32.0,
        text: 'However, element insertion and deletion require shifting preceding items, producing O(n) worst-case cost.',
      },
      {
        id: 'ds101_en_6',
        start: 32.5,
        end: 39.5,
        text: 'Consequently, whenever we require dynamic growth and fast insertions, Linked Lists serve as an ideal alternative.',
      },
      {
        id: 'ds101_en_7',
        start: 40.0,
        end: 48.0,
        text: 'Let us now transition to practical code and allocate dynamic heap memory safely in C++.',
      },
      {
        id: 'ds101_en_8',
        start: 48.5,
        end: 56.0,
        text: 'Always remember to pair new with delete to avoid memory leaks.',
      },
    ],
  },

  // ==========================================
  // Lecture 2: lec-ds-102 (Linked Lists & BST)
  // ==========================================
  {
    id: 'sub_ds102_ar',
    lectureId: 'lec-ds-102',
    language: 'ar',
    labelAr: 'العربية (مترجمة ومعتمدة)',
    labelEn: 'Arabic (Verified)',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-18T10:00:00.000Z',
    cues: [
      {
        id: 'ds102_1',
        start: 0,
        end: 5.0,
        text: 'أهلاً بكم في المحاضرة الثانية حول القوائم المترابطة (Linked Lists) وأشجار البحث الثنائية (BST).',
      },
      {
        id: 'ds102_2',
        start: 5.5,
        end: 11.2,
        text: 'تتكون القائمة المترابطة من عقد منفصلة (Nodes)، كل عقدة تحمل قيمة ومؤشراً (Pointer) للعقدة التالية.',
      },
      {
        id: 'ds102_3',
        start: 11.8,
        end: 18.0,
        text: 'عندما نتوسع إلى هياكل بيانات ثنائية الأبعاد، نصل إلى مفهوم شجرة البحث الثنائية (Binary Search Tree).',
      },
      {
        id: 'ds102_4',
        start: 18.5,
        end: 25.0,
        text: 'في شجرة البحث الثنائية: كل العناصر في الشجرة الفرعية اليسرى أصغر من الجذر، واليمنى أكبر منه.',
      },
      {
        id: 'ds102_5',
        start: 25.5,
        end: 33.0,
        text: 'هذه الخاصية تمنحنا سرعة بحث بتعقيد زمني O(log n) في الأشجار المتوازنة كأشجار AVL.',
      },
    ],
  },

  // ==========================================
  // Lecture 3: lec-prog-201 (C++ Programming)
  // ==========================================
  {
    id: 'sub_prog201_ar',
    lectureId: 'lec-prog-201',
    language: 'ar',
    labelAr: 'العربية (مترجمة ومعتمدة)',
    labelEn: 'Arabic (Verified)',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    cues: [
      {
        id: 'prog201_1',
        start: 0,
        end: 5.0,
        text: 'مرحباً بكم في مساق البرمجة بلغة C++. في هذا الدرس سنتناول مفهوم المؤشرات (Pointers).',
      },
      {
        id: 'prog201_2',
        start: 5.5,
        end: 11.0,
        text: 'المؤشر هو متغير خاص لا يخزن قيمة عادية، بل يخزن العنوان الفعلي لمتغير آخر في الذاكرة (RAM).',
      },
      {
        id: 'prog201_3',
        start: 11.5,
        end: 18.0,
        text: 'نستخدم المعامل & للحصول على عنوان المتغير، والمعامل * لفك الإسناد (Dereferencing) والوصول للقيمة.',
      },
      {
        id: 'prog201_4',
        start: 18.5,
        end: 26.0,
        text: 'فهم المؤشرات هو الركيزة الأساسية للتعامل مع هياكل البيانات المتقدمة وإدارة الذاكرة بكفاءة.',
      },
    ],
  },

  // ==========================================
  // Backward compatibility fixture (demo-1)
  // ==========================================
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
      { id: 'c1', start: 0, end: 4.5, text: 'بسم الله الرحمن الرحيم، مرحباً بكم في المحاضرة النموذجية.' },
      { id: 'c2', start: 5.0, end: 9.8, text: 'في هذه المحاضرة سنتعرف على مفهوم المصفوفة (Array).' },
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
      { id: 'c1_en', start: 0, end: 4.5, text: 'Welcome to this demo lecture on computer science.' },
      { id: 'c2_en', start: 5.0, end: 9.8, text: 'Today we discuss array data structure basics.' },
    ],
  },
]
