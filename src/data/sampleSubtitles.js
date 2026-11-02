/**
 * Initial educational subtitle and transcript sample data for Al-Azhar IT Hub.
 *
 * Provides ready-to-use, academically accurate WebVTT-compatible subtitle tracks
 * for IT & Computer Science courses (Artificial Intelligence, Data Structures, Programming)
 * with technical terms normalized per the technical glossary.
 */

export const INITIAL_SUBTITLES = [
  // ==========================================
  // AI Lecture 1: lec-ai-101 (Neural Networks)
  // ==========================================
  {
    id: 'sub_ai101_ar',
    lectureId: 'lec-ai-101',
    language: 'ar',
    labelAr: 'العربية (مترجمة ومعتمدة)',
    labelEn: 'Arabic (Verified)',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
    cues: [
      {
        id: 'ai101_1',
        start: 0,
        end: 4.5,
        text: 'هذا الرقم 3، وهو رقم مكتوب بخط اليد بشكل قياسي وبسيط.',
      },
      {
        id: 'ai101_2',
        start: 5.0,
        end: 10.8,
        text: 'ولكن إذا نظرنا إلى كيفية رؤية الحاسوب لهذه الصورة، فهي شبكة مصفوفية من 28 في 28 بكسل، لكل منها قيمة رمادية.',
      },
      {
        id: 'ai101_3',
        start: 11.2,
        end: 17.5,
        text: 'بالنسبة للإنسان، التعرف على هذا الرقم يتم في جزء من الثانية بدون أي مجهود يذكر.',
      },
      {
        id: 'ai101_4',
        start: 18.0,
        end: 25.8,
        text: 'لكن كتابة خوارزمية تقليدية للتعرف عليه كانت مهمة شاقة، وهنا تحديداً تتجلى قوة الشبكات العصبية (Neural Networks) والتعلم العميق (Deep Learning).',
      },
      {
        id: 'ai101_5',
        start: 26.2,
        end: 34.0,
        text: 'نبدأ بطبقة المدخلات (Input Layer) المكونة من 784 خلية عصبية، تقابل كل بكسل مفرد في الصورة.',
      },
      {
        id: 'ai101_6',
        start: 34.5,
        end: 42.5,
        text: 'كل خلية عصبية (Neuron) تحمل قيمة تنشيط (Activation Value) تتراوح بين 0 و 1 تمثل درجة سطوع البكسل.',
      },
      {
        id: 'ai101_7',
        start: 43.0,
        end: 51.5,
        text: 'ترتبط هذه الخلايا عبر طبقات خفية (Hidden Layers) بأوزان (Weights) وانحيازات (Biases) ودالة تنشيط غير خطية (Activation Function).',
      },
      {
        id: 'ai101_8',
        start: 52.0,
        end: 61.5,
        text: 'في الطبقة النهائية المكونة من 10 مخرجات تمثل الأرقام من 0 إلى 9، الخلية ذات التنشيط الأعلى تمثل قرار النموذج.',
      },
      {
        id: 'ai101_9',
        start: 62.0,
        end: 74.0,
        text: 'من خلال التدريب المستمر وحساب دالة الخسارة (Loss Function)، يتعلم النموذج ضبط الأوزان لتقليل نسبة الخطأ تلقائياً.',
      },
    ],
  },
  {
    id: 'sub_ai101_en',
    lectureId: 'lec-ai-101',
    language: 'en',
    labelAr: 'الإنجليزية (الأصلية)',
    labelEn: 'English (Original)',
    sourceType: 'original_transcript',
    status: 'published',
    version: 1,
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
    cues: [
      {
        id: 'ai101_en_1',
        start: 0,
        end: 4.5,
        text: 'This is a 3, a fairly standard handwritten 3.',
      },
      {
        id: 'ai101_en_2',
        start: 5.0,
        end: 10.8,
        text: 'But if we inspect how a computer sees this image, it is a 28 by 28 grid of pixels, each with a grayscale value.',
      },
      {
        id: 'ai101_en_3',
        start: 11.2,
        end: 17.5,
        text: 'For a human brain, recognizing this number is completely effortless and instantaneous.',
      },
      {
        id: 'ai101_en_4',
        start: 18.0,
        end: 25.8,
        text: 'Yet writing an explicit rule-based program to do so was remarkably difficult, motivating deep Neural Networks.',
      },
      {
        id: 'ai101_en_5',
        start: 26.2,
        end: 34.0,
        text: 'We start with an input layer consisting of 784 neurons, corresponding to each individual pixel in the image.',
      },
      {
        id: 'ai101_en_6',
        start: 34.5,
        end: 42.5,
        text: 'Each neuron holds an activation number between 0 and 1 indicating how brightly that specific pixel is lit up.',
      },
      {
        id: 'ai101_en_7',
        start: 43.0,
        end: 51.5,
        text: 'These neurons connect across hidden layers via learned weights and biases, evaluated by non-linear activation functions.',
      },
      {
        id: 'ai101_en_8',
        start: 52.0,
        end: 61.5,
        text: 'In the final output layer of 10 neurons representing digits 0 through 9, the highest activation denotes the prediction.',
      },
      {
        id: 'ai101_en_9',
        start: 62.0,
        end: 74.0,
        text: 'Through continuous optimization minimizing the loss function, the model iteratively tunes its connection weights.',
      },
    ],
  },

  // ==========================================
  // AI Lecture 2: lec-ai-102 (Gradient Descent)
  // ==========================================
  {
    id: 'sub_ai102_ar',
    lectureId: 'lec-ai-102',
    language: 'ar',
    labelAr: 'العربية (مترجمة ومعتمدة)',
    labelEn: 'Arabic (Verified)',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    cues: [
      {
        id: 'ai102_1',
        start: 0,
        end: 5.0,
        text: 'مرحباً بكم في المحاضرة الثانية: كيف تتعلم الشبكات العصبية فعلياً عبر الانحدار التدريجي (Gradient Descent)؟',
      },
      {
        id: 'ai102_2',
        start: 5.5,
        end: 12.0,
        text: 'التعلم في جوهره هو مشكلة تحسين رياضي (Optimization Problem)، حيث نبدأ بأوزان وانحيازات عشوائية تماماً.',
      },
      {
        id: 'ai102_3',
        start: 12.5,
        end: 20.0,
        text: 'نقوم بتمرير بيانات التدريب وحساب مقدار الخطأ بين المخرجات الحقيقية وتوقعات الشبكة باستخدام دالة الخسارة (Loss Function).',
      },
      {
        id: 'ai102_4',
        start: 20.5,
        end: 29.0,
        text: 'خوارزمية الانحدار التدريجي (Gradient Descent) تخبرنا بالاتجاه الرياضي الدقيق لتعديل الأوزان بحيث ينخفض معدل الخطأ بأسرع وتيرة.',
      },
      {
        id: 'ai102_5',
        start: 29.5,
        end: 38.0,
        text: 'وعبر تقنية التغذية الراجعة (Backpropagation)، نوزع هذا التعديل بفاعلية عبر جميع طبقات الشبكة العميقة.',
      },
    ],
  },
  {
    id: 'sub_ai102_en',
    lectureId: 'lec-ai-102',
    language: 'en',
    labelAr: 'الإنجليزية (الأصلية)',
    labelEn: 'English (Original)',
    sourceType: 'original_transcript',
    status: 'published',
    version: 1,
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    cues: [
      {
        id: 'ai102_en_1',
        start: 0,
        end: 5.0,
        text: 'Welcome to lecture two: How do neural networks actually learn through gradient descent optimization?',
      },
      {
        id: 'ai102_en_2',
        start: 5.5,
        end: 12.0,
        text: 'Learning fundamentally equates to mathematical optimization, starting with randomly initialized weights and biases.',
      },
      {
        id: 'ai102_en_3',
        start: 12.5,
        end: 20.0,
        text: 'We feed labeled training examples forward and compute prediction discrepancies via the cost or loss function.',
      },
      {
        id: 'ai102_en_4',
        start: 20.5,
        end: 29.0,
        text: 'Gradient descent calculates the negative gradient vector, directing weight adjustments along the steepest downhill slope.',
      },
      {
        id: 'ai102_en_5',
        start: 29.5,
        end: 38.0,
        text: 'Through recursive backpropagation, error gradients propagate backward across every layer of the deep architecture.',
      },
    ],
  },

  // ==========================================
  // AI Lecture 3: lec-ai-103 (Transformers & Attention)
  // ==========================================
  {
    id: 'sub_ai103_ar',
    lectureId: 'lec-ai-103',
    language: 'ar',
    labelAr: 'العربية (مترجمة ومعتمدة)',
    labelEn: 'Arabic (Verified)',
    sourceType: 'translation',
    status: 'published',
    version: 1,
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
    cues: [
      {
        id: 'ai103_1',
        start: 0,
        end: 5.0,
        text: 'أهلاً بكم في المحاضرة الثالثة حول نماذج المحولات (Transformers) وآلية الانتباه الذاتي (Self-Attention).',
      },
      {
        id: 'ai103_2',
        start: 5.5,
        end: 12.5,
        text: 'أحدثت بنية المحولات ثورة هائلة في معالجة اللغات الطبيعية (NLP) وهي الأساس الذي تبنى عليه نماذج GPT وGemini المعاصرة.',
      },
      {
        id: 'ai103_3',
        start: 13.0,
        end: 21.0,
        text: 'بدلاً من معالجة الكلمات كلمة وراء كلمة بالتسلسل البطيء، تتيح آلية الانتباه الذاتي معالجة كامل النص بالتوازي في وقت واحد.',
      },
      {
        id: 'ai103_4',
        start: 21.5,
        end: 30.0,
        text: 'يقوم النموذج بتمثيل كل كلمة كمتجه عددي (Vector Embedding)، ويحسب مدى ارتباط كل كلمة بباقي كلمات الجملة.',
      },
      {
        id: 'ai103_5',
        start: 30.5,
        end: 40.0,
        text: 'هذه القدرة على فهم السياق العميق هي السر وراء جودة التوليد والترجمة وفهم اللغات في الذكاء الاصطناعي الحديث.',
      },
    ],
  },
  {
    id: 'sub_ai103_en',
    lectureId: 'lec-ai-103',
    language: 'en',
    labelAr: 'الإنجليزية (الأصلية)',
    labelEn: 'English (Original)',
    sourceType: 'original_transcript',
    status: 'published',
    version: 1,
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z',
    cues: [
      {
        id: 'ai103_en_1',
        start: 0,
        end: 5.0,
        text: 'Welcome to lecture three exploring Transformer architecture and the revolutionary Self-Attention mechanism.',
      },
      {
        id: 'ai103_en_2',
        start: 5.5,
        end: 12.5,
        text: 'Transformers fundamentally transformed Natural Language Processing and constitute the foundation of modern Large Language Models.',
      },
      {
        id: 'ai103_en_3',
        start: 13.0,
        end: 21.0,
        text: 'Rather than parsing tokens sequentially, self-attention enables massive parallel processing across the entire context window.',
      },
      {
        id: 'ai103_en_4',
        start: 21.5,
        end: 30.0,
        text: 'Words are projected into continuous high-dimensional vector embeddings, computing contextual relevance weights dynamically.',
      },
      {
        id: 'ai103_en_5',
        start: 30.5,
        end: 40.0,
        text: 'This profound contextual awareness enables state-of-the-art text generation, reasoning, and automated translation.',
      },
    ],
  },

  // ==========================================
  // Data Structures: lec-ds-101 (Arrays)
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
