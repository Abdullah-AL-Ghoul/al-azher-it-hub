// Pure intent-matching module for the chatbot assistant. Extracted from
// Chatbot.jsx so the ~470 lines of handlers are unit-testable and UI-free.
//
// Matching engine (tiered, best tier first):
//   1. Normalized substring — Arabic-aware (strips tashkeel/tatweel, unifies
//      alef/ta-marbuta/alef-maqsura variants) so "مَرْحَباً" matches "مرحبا".
//   2. Whole-word match — a keyword equals one of the message words.
//   3. Typo tolerance — Levenshtein distance ≤ 1 for words ≥ 4 chars
//      ("مرحب" matches "مرحبا", "lectures" matches "lecture").
//   4. Bounded subsequence — last resort, only for keywords ≥ 4 chars, with a
//      span limit so short keywords like "status"/"هلا" can no longer hijack
//      unrelated messages (the old engine matched "status" inside
//      "summarize data structures").

// Strips Arabic diacritics (tashkeel), tatweel, and unifies letter variants
// so surface forms don't break matching. Applied to both text and keywords.
function normalizeText(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0653-\u0655]/g, '') // fatha/damma/kasra/shadda/tanween/sukun
    .replace(/\u0640/g, '') // tatweel
    .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627') // أ إ آ ٱ -> ا
    .replace(/\u0629/g, '\u0647') // ة -> ه
    .replace(/\u0649/g, '\u064A') // ى -> ي
    .replace(/\u0624/g, '\u0648') // ؤ -> و
    .replace(/\u0626/g, '\u064A') // ئ -> ي
    .replace(/\u200f|\u200e/g, '') // RTL/LTR marks
    .replace(/\s+/g, ' ')
    .trim()
}

// Levenshtein edit distance with an early exit when the length gap is hopeless.
function editDistance(a, b) {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > 1) return 2
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  let cur = new Array(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[b.length]
}

// Subsequence confined to a bounded window (span ≤ ~2.5x keyword length).
// Prevents scattered-letter false positives while still catching words typed
// with stray letters in between.
function subsequenceInWindow(hay, needle) {
  const maxSpan = Math.ceil(needle.length * 2.5)
  for (let start = 0; start < hay.length; start++) {
    if (hay[start] !== needle[0]) continue
    let ki = 1
    let last = start
    for (let i = start + 1; i < hay.length && ki < needle.length; i++) {
      if (hay[i] === needle[ki]) {
        ki++
        last = i
        if (last - start + 1 > maxSpan) break
      }
    }
    if (ki === needle.length && last - start + 1 <= maxSpan) return true
  }
  return false
}

const WORD_SPLIT = /[^a-z0-9\u0600-\u06FF]+/

// One keyword word matches when it appears as a whole text word, or (for
// words ≥ 4 chars) within one edit of a text word — typo tolerance.
function wordMatchesText(textWords, kwWord) {
  if (textWords.includes(kwWord)) return true
  if (kwWord.length >= 4) {
    for (const w of textWords) {
      if (w.length >= 4 && editDistance(w, kwWord) <= 1) return true
    }
  }
  return false
}

function keywordMatches(normText, textWords, keyword) {
  // 1. Normalized substring (also covers multi-word keywords).
  if (normText.includes(keyword)) return true

  const kwWords = keyword.split(WORD_SPLIT).filter(Boolean)
  if (kwWords.length === 0) return false

  // 2. Word-level match: EVERY keyword word must appear as a whole text word.
  //    Requiring all words keeps 'كم مادة' from firing on 'كم عدد المحاضرات؟'.
  if (kwWords.every(kw => wordMatchesText(textWords, kw))) return true

  // 3. Bounded subsequence — single-word keywords only. Multi-word phrases
  //    matched as subsequences produce false positives ('how are you' inside
  //    'how many lectures do you have?').
  if (kwWords.length === 1 && keyword.length >= 4 && subsequenceInWindow(normText, keyword)) return true

  return false
}

function fuzzyMatch(text, keywords) {
  const normText = normalizeText(text)
  if (!normText) return false
  const textWords = normText.split(WORD_SPLIT).filter(Boolean)
  return keywords.some(kw => keywordMatches(normText, textWords, normalizeText(kw)))
}

// Matches plain keywords via fuzzyMatch, but treats any pattern containing regex
// metacharacters (e.g. 'how many.*subject', 'كم.*محاضرة') as a real regular
// expression. Previously those were fed to fuzzyMatch, which matched them
// literally and the intents silently never fired.
function matchPatterns(text, patterns) {
 const RE_META = /[*+?()[\]{}|^$\\]/
 return patterns.some(p => {
  if (RE_META.test(p)) {
   try { return new RegExp(p, 'i').test(text) } catch { return false }
  }
  return fuzzyMatch(text, [p])
 })
}

export function getGreeting(isArabic) {
 const hour = new Date().getHours()

 if (hour < 6) {
  return isArabic ? 'مساء الخير' : 'Good evening'
 }
 if (hour < 12) {
  return isArabic ? 'صباح الخير' : 'Good morning'
 }
 if (hour < 17) {
  return isArabic ? 'مساء الخير' : 'Good afternoon'
 }
 return isArabic ? 'مساء الخير' : 'Good evening'
}

export function formatTime() {
 return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function buildChatIntents(data, user, isArabic) {
 const { lectures, sources, subjects } = data

 function greetHandler(text) {
  if (fuzzyMatch(text, ['مرحبا', 'هلا', 'السلام عليكم', 'اهلا', 'hello', 'hi', 'hey', 'morning', 'evening', 'صباح', 'مساء'])) {
   return {
    quickKey: 'initial',
    text: `${getGreeting(isArabic)}${user?.name ? ' ' + user.name : ''}! 😊\n\n${isArabic
     ? 'كيف أقدر أساعدك اليوم؟ اسألني عن المحاضرات، المواد، المصادر، أو أي شي!'
     : 'How can I help you today? Ask me about lectures, courses, sources, or anything!'}`
   }
  }
  return null
 }

 function howAreYouHandler(text) {
  if (fuzzyMatch(text, ['كيف حالك', 'كيفك', 'how are you', 'عامل ايه', 'شلونك', 'status'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? 'الحمد لله، تمام! 😊 أنا هنا جاهز أساعدك. اسألني عن أي شي!'
     : 'I\'m doing great, thanks! 😊 I\'m here and ready to help. Ask me anything!'
   }
  }
  return null
 }

 function whoAreYouHandler(text) {
  if (fuzzyMatch(text, ['مين انت', 'من انت', 'who are you', 'انت مين', 'تعريف', 'عن نفسك'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? 'أنا مساعد AL-Azher IT Hub الذكي! 🤖\n\nأقدر أساعدك في:\n• معرفة عدد المحاضرات والمصادر\n• عرض المواد والمساقات المتاحة\n• معلومات التواصل\n• معرفة طريقة استخدام الموقع\n• الإجابة على أسئلتك المتنوعة\n\nجرب أسألني!'
     : 'I\'m the AL-Azher IT Hub smart assistant! 🤖\n\nI can help you with:\n• Finding lectures and sources\n• Available courses and subjects\n• Contact information\n• How to use the site\n• Answering your various questions\n\nTry asking me!'
   }
  }
  return null
 }

  function subjectsCountHandler(text) {
   if (matchPatterns(text, ['عدد المواد', 'كم مادة', 'كم ماده', 'how many.*subject', 'how many.*course', 'subjects.*count', 'courses.*count'])) {
   if (!subjects.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في مواد مسجلة حالياً. 📭' : 'No courses recorded yet. 📭' }
   }
   return { quickKey: 'afterLectures', text: isArabic ? `📖 عدد المواد المتاحة: ${subjects.length}` : `📖 Available courses: ${subjects.length}` }
  }
  return null
 }

 function lecturesCountHandler(text) {
  const hasSource = /مصدر|مصادر|source/i.test(text)
  const hasSubject = /مادة|مواد|subject|course/i.test(text)
  if (hasSource || hasSubject) return null
  if (matchPatterns(text, ['عدد المحاضرات', 'كم محاضرة', 'كم.*محاضر', 'lectures.*count', 'how many.*lecture'])) {
   if (!lectures.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في محاضرات مسجلة حالياً. 📭' : 'No lectures recorded yet. 📭' }
   }
   const grouped = {}

   lectures.forEach(lecture => {
    const name = isArabic ? (lecture.subjectAr || lecture.titleAr) : (lecture.subjectEn || lecture.titleEn)

    if (name) {
     grouped[name] = (grouped[name] || 0) + 1
    }
   })
   const list = Object.entries(grouped).slice(0, 8).map(([name, count]) => ` • ${name}: ${count}`).join('\n')
   const byCourse = Object.keys(grouped).length > 0
    ? `${isArabic ? 'حسب المادة:' : 'By course:'}\n${list}`
    : ''
   return {
    quickKey: 'afterLectures',
    text: isArabic
     ? `📊 في حالياً ${lectures.length} محاضرة مسجلة.\n\n${byCourse}`
     : `📊 There are currently ${lectures.length} lectures recorded.\n\n${byCourse}`
   }
  }
  return null
 }

  function sourcesCountHandler(text) {
   if (matchPatterns(text, ['عدد المصادر', 'كم.*مصدر', 'sources.*count', 'how many.*source', 'كم مصدر'])) {
   if (!sources.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في مصادر مسجلة حالياً. 📭' : 'No sources recorded yet. 📭' }
   }
   return {
    quickKey: 'afterSources',
    text: isArabic
     ? `📚 في حالياً ${sources.length} مصدر متاح.`
     : `📚 There are currently ${sources.length} sources available.`
   }
  }
  return null
 }

 function subjectsHandler(text) {
  if (fuzzyMatch(text, ['مواد', 'مساقات', 'courses', 'subjects', 'المواد', 'كل المواد'])) {
   if (!subjects.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في مواد مسجلة حالياً. تواصل مع Admin. 📭' : 'No courses recorded yet. Contact the admin. 📭' }
   }
   const list = subjects.map((subject, idx) => `${idx + 1}. ${isArabic ? (subject.nameAr || subject.ar) : (subject.nameEn || subject.en)}`).join('\n')
   const deepLink = isArabic ? '\n\n→ افتح المواد: /home' : '\n\n→ Browse courses: /home'
   return {
    quickKey: 'afterLectures',
    text: isArabic ? `📖 المواد المتاحة (${subjects.length}):\n\n${list}${deepLink}` : `📖 Available courses (${subjects.length}):\n\n${list}${deepLink}`
   }
  }
  return null
 }

 function lecturesListHandler(text) {
  if (matchPatterns(text, ['محاضرات', 'videos', 'ليست.*محاضرات', 'all.*lecture', 'كل.*محاضرة', 'عرض.*محاضرات', 'عرض المحاضرات'])) {
   if (!lectures.length) {
    return { quickKey: 'default', text: isArabic ? 'ما في محاضرات حالياً. 📭' : 'No lectures available yet. 📭' }
   }
   const grouped = {}

   lectures.forEach(lecture => {
    const name = isArabic ? lecture.subjectAr : lecture.subjectEn

    if (!grouped[name]) {
     grouped[name] = []
    }
    grouped[name].push(isArabic ? lecture.titleAr : lecture.titleEn)
   })
   const list = Object.entries(grouped).slice(0, 5).map(([name, items]) => {
    const more = items.length > 3 ? `\n ...و${items.length - 3} أخرى` : ''
    return `📌 ${name} (${items.length}):\n${items.slice(0, 3).map(item => ` • ${item}`).join('\n')}${more}`
   }).join('\n\n')
   const deepLink = isArabic ? '\n\n→ افتح المحاضرات: /lectures' : '\n\n→ Open lectures: /lectures'
   return {
    quickKey: 'afterLectures',
    text: isArabic ? `🎬 المحاضرات (${lectures.length}):\n\n${list}${deepLink}` : `🎬 Lectures (${lectures.length}):\n\n${list}${deepLink}`
   }
  }
  return null
 }

  function sourcesListHandler(text) {
    if (matchPatterns(text, ['مصادر', 'ملخصات', 'summary', 'pdf', 'كتاب', 'book', 'المصادر', 'كل.*مصادر'])) {
    if (!sources.length) {
     return { quickKey: 'default', text: isArabic ? 'ما في مصادر حالياً. 📭' : 'No sources available yet. 📭' }
    }
    const list = sources.slice(0, 8).map((source, idx) => `${idx + 1}. ${isArabic ? source.titleAr : source.titleEn}`).join('\n')
    const more = sources.length > 8
     ? `\n\n${isArabic ? '...والمزيد في صفحة المصادر' : '...and more on the Sources page'}`
     : ''
    const deepLink = isArabic ? '\n\n→ افتح المصادر: /sources' : '\n\n→ Open sources: /sources'
    return {
     quickKey: 'afterSources',
     text: isArabic ? `📎 المصادر المتاحة (${sources.length}):\n\n${list}${more}${deepLink}` : `📎 Available sources (${sources.length}):\n\n${list}${more}${deepLink}`
    }
   }
   return null
  }

  function lectureInfoHandler(text) {
   let currentLecture = null
   try {
    const raw = sessionStorage.getItem('al_azher_current_lecture')
    if (raw) currentLecture = JSON.parse(raw)
   } catch (e) { /* silent */ }

   const wantsSummary = fuzzyMatch(text, ['لخص', 'لخّص', 'الخلاصة', 'تلخيص', 'summarize', 'summary'])
   const wantsInfo = matchPatterns(text, ['معلومات عن محاضرة', 'ما هي محاضرة', 'عن محاضرة', 'tell me about', 'what.*lecture', 'what is this'])
   if (!wantsSummary && !wantsInfo) return null

   const aboutMatch = text.match(/(?:لخص|لخّص|ملخص|معلومات عن|ما هي محاضرة|عن محاضرة|summarize|summary|tell me about|about)\s+(.+)/i)
   let query = aboutMatch ? aboutMatch[1].trim().toLowerCase() : ''

   let lecture = null
   if (query) {
    lecture = lectures.find(l => {
     const title = ((isArabic ? l.titleAr : l.titleEn) || '').toLowerCase()
     const subject = ((isArabic ? l.subjectAr : l.subjectEn) || '').toLowerCase()
     return title.includes(query) || subject.includes(query)
    })
    if (!lecture) {
     const partial = lectures.filter(l => {
      const title = ((isArabic ? l.titleAr : l.titleEn) || '').toLowerCase()
      const subject = ((isArabic ? l.subjectAr : l.subjectEn) || '').toLowerCase()
      return title.includes(query) || subject.includes(query)
     })
     if (partial.length) lecture = partial[0]
    }
   } else if (currentLecture) {
    lecture = lectures.find(l => l.id === currentLecture.id) || null
   }

   if (!lecture) {
    const recent = [...lectures].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5)
    if (recent.length === 0) {
     return { quickKey: 'default', text: isArabic ? 'ما في محاضرات مسجلة حالياً. 📭' : 'No lectures recorded yet. 📭' }
    }
    return {
     quickKey: 'default',
     text: isArabic
      ? '🎬 أي محاضرة تريد أن ألخصها؟ جرب: "لخص [اسم المحاضرة]"\n\nأحدث المحاضرات:\n' + recent.map((l, i) => `${i + 1}. ${isArabic ? l.titleAr : l.titleEn}`).join('\n')
      : '🎬 Which lecture would you like me to summarize? Try: "summarize [lecture name]"\n\nRecent lectures:\n' + recent.map((l, i) => `${i + 1}. ${isArabic ? l.titleAr : l.titleEn}`).join('\n')
    }
   }

   const relatedSources = sources.filter(s =>
    (s.subjectAr && lecture.subjectAr && s.subjectAr === lecture.subjectAr) ||
    (s.subjectEn && lecture.subjectEn && s.subjectEn === lecture.subjectEn)
   )
   const deepLink = isArabic ? `\n\n→ افتح تفاصيل المحاضرة: /lecture/${lecture.id}` : `\n\n→ Open lecture details: /lecture/${lecture.id}`
   const lines = isArabic
    ? [
      `📚 ملخص محاضرة: ${lecture.titleAr}`,
      ``,
      `• المادة: ${lecture.subjectAr || '—'}`,
      `• التاريخ: ${lecture.date || '—'}`,
      `• الدكتور: ${lecture.doctorAr || '—'}`,
      `• مصادر مرتبطة: ${relatedSources.length}`,
      ``,
      lecture.url ? `🎬 رابط الفيديو: ${lecture.url}` : null,
      deepLink,
     ]
    : [
      `📚 Lecture summary: ${lecture.titleEn}`,
      ``,
      `• Subject: ${lecture.subjectEn || '—'}`,
      `• Date: ${lecture.date || '—'}`,
      `• Doctor: ${lecture.doctorEn || '—'}`,
      `• Related sources: ${relatedSources.length}`,
      ``,
      lecture.url ? `🎬 Video link: ${lecture.url}` : null,
      deepLink,
     ]
   return {
    quickKey: 'default',
    text: lines.filter(Boolean).join('\n')
   }
  }

 function contactHandler(text) {
  if (fuzzyMatch(text, ['تواصل', 'اتصال', 'contact', 'هاتف', 'phone', 'بريد', 'email', 'رقم'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '📱 معلومات التواصل:\n\n📞 الهاتف: +970592127061\n📧 البريد: abdallhalghoul200@gmail.com\n\nتقدر تتواصل معنا في أي وقت!'
     : '📱 Contact Information:\n\n📞 Phone: +970592127061\n📧 Email: abdallhalghoul200@gmail.com\n\nFeel free to reach out anytime!'
   }
  }
  return null
 }

 function studyPlanHandler(text) {
  if (fuzzyMatch(text, ['خطة', 'دراسة', 'plan', 'جدول', 'schedule', 'الخطة الدراسية'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '📋 الخطة الدراسية:\n\nتقدر تشوف الخطة الدراسية من الصفحة الرئيسية أو من قائمة التنقل. في هناك جدول كامل بالمواعيد والمواد!'
     : '📋 Study Plan:\n\nYou can view the study plan from the homepage or the navigation menu. There\'s a full schedule with dates and courses!'
   }
  }
  return null
 }

 function rateHandler(text) {
  if (matchPatterns(text, ['تقييم', 'rate', 'rating', 'كيف.*أقيّم', 'تقييم محاضرة', 'أقيّم'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '⭐ التقييم:\n\n1. افتح صفحة "المحاضرات"\n2. اختر المحاضرة اللي تبي تقيّمها\n3. اضغط على نجوم التقييم (1-5)\n4. التقييم يُحفظ تلقائياً!\n\nملاحظة: تقدر تغيّر تقييمك في أي وقت.'
     : '⭐ Rating:\n\n1. Open the "Lectures" page\n2. Choose the lecture you want to rate\n3. Click on the star rating (1-5)\n4. Your rating is saved automatically!\n\nNote: You can change your rating anytime.'
   }
  }
  return null
 }

 function favoritesHandler(text) {
  if (fuzzyMatch(text, ['مفضلة', 'favorite', 'favorites', 'إضافة.*مفضلة', 'حفظ'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '❤️ المفضلة:\n\nتقدر تضيف محاضرة للمفضلة بالضغط على أيقونة القلب في بطاقة المحاضرة. المفضلة تظهر في صفحة "المحاضرات" عند تصفية "المفضلة".'
     : '❤️ Favorites:\n\nYou can add a lecture to favorites by clicking the heart icon on the lecture card. Favorites appear on the "Lectures" page when filtering by "Favorites".'
   }
  }
  return null
 }

 function profileHandler(text) {
  if (fuzzyMatch(text, ['ملفي', 'profile', 'حسابي', 'account', 'الملف الشخصي'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '👤 ملفك الشخصي:\n\nتقدر تشوّف وتحوّ ملفك الشخصي من صفحة "الملف الشخصي". في تقدر تعدّل اسمك، تخصصك، وكلمة المرور.'
     : '👤 Your Profile:\n\nYou can view and edit your profile from the "Profile" page. You can update your name, major, and password.'
   }
  }
  return null
 }

 function thankYouHandler(text) {
  if (fuzzyMatch(text, ['شكر', 'ممتاز', 'حلو', 'thanks', 'thank', 'great', 'good', 'perfect', 'أحسنت', 'تمام'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? 'العفو! 😊 هل في شي ثاني أقدر أساعدك فيه؟'
     : 'You\'re welcome! 😊 Is there anything else I can help with?'
   }
  }
  return null
 }

 function addContentHandler(text) {
  if (fuzzyMatch(text, ['اضيف', 'اضافة', 'add', 'نشر', 'post', 'إضافة محتوى'])) {
   return {
    quickKey: 'default',
    text: isArabic
     ? '➕ إضافة محتوى:\n\nتقدر تضيف محتوى من صفحة "الإضافات". اذا بدك تضيف مواد أو محاضرات، لازم تكون Admin وتدخل على "لوحة التحكم".'
     : '➕ Add Content:\n\nYou can add content from the "Additions" page. If you want to add courses or lectures, you need to be an admin and go to the "Dashboard".'
   }
  }
  return null
 }

 function helpHandler(text) {
  if (fuzzyMatch(text, ['مساعدة', 'help', 'ساعدني', 'محتاج مساعدة'])) {
   return {
    quickKey: 'afterHelp',
    text: isArabic
     ? '🆘 طبعاً! أنا هنا أساعدك!\n\nاسألني عن:\n• عدد المحاضرات والمصادر\n• المواد المتاحة\n• معلومات التواصل\n• الخطة الدراسية\n• طريقة التقييم\n• المفضلة\n• ملفك الشخصي\n\nجرب أسأل عن أي شي!'
     : '🆘 Of course! I\'m here to help!\n\nAsk me about:\n• Number of lectures and sources\n• Available courses\n• Contact information\n• Study plan\n• How to rate\n• Favorites\n• Your profile\n\nTry asking about anything!'
   }
  }
  return null
 }

 function goodbyeHandler(text) {
  const isGreetingBack = /وعليكم.*السلام|عليكم السلام/.test(text)
  if (isGreetingBack) return null
  if (fuzzyMatch(text, ['bye', 'goodbye', 'مع السلامة', 'الى اللقاء', 'سلام', 'exit', 'خروج'])) {
   return {
    quickKey: 'initial',
    text: isArabic
     ? 'مع السلامة! 👋 نتمنى لك يوم جميل. ارجع في أي وقت!'
     : 'Goodbye! 👋 Have a great day. Come back anytime!'
   }
  }
  return null
 }

 function jokesHandler(text) {
  if (fuzzyMatch(text, ['نكتة', 'joke', 'ضحك', 'funny', 'ازعل', 'فرفش', 'ضحكني'])) {
   const jokesAr = [
    'ليش المبرمج حط الكونساول لوق قبل النوم؟ عشان يشوف احلامه! 😄',
    'ليش الكود ما يتعب؟ لأنه دايم break! 😂',
    ' programmer: "الكود شغال عندي" — الكود ما شغال عند حد! 😅'
   ]
   const jokesEn = [
    'Why do programmers prefer dark mode? Because light attracts bugs! 😄',
    'Why do Java developers wear glasses? Because they can\'t C#! 😂',
    'A SQL query walks into a bar, sees two tables and asks... "Can I JOIN you?" 😅'
   ]
   const pool = isArabic ? jokesAr : jokesEn
   return {
    quickKey: 'default',
    text: pool[Math.floor(Math.random() * pool.length)]
   }
  }
  return null
 }

 function searchHandler(text) {
  const searchMatch = text.match(/(?:ابحث\s+عن|بحث\s+عن|search\s+for|search\s+about|find\s+about|find\b)\s*(.+)/i) || text.match(/(?:ابحث|بحث)\s+(.+)/i)

  if (!searchMatch) {
   return null
  }
  const query = searchMatch[1].trim().toLowerCase()

  if (!query) {
   return null
  }

  const matchedLectures = lectures.filter(lecture => {
   const title = isArabic ? (lecture.titleAr || '') : (lecture.titleEn || '')
   const subject = isArabic ? (lecture.subjectAr || '') : (lecture.subjectEn || '')
   return title.toLowerCase().includes(query) || subject.toLowerCase().includes(query)
  })

  const matchedSources = sources.filter(source => {
   const title = isArabic ? (source.titleAr || '') : (source.titleEn || '')
   return title.toLowerCase().includes(query)
  })

  const matchedSubjects = subjects.filter(subject => {
   const name = isArabic ? (subject.nameAr || subject.ar || '') : (subject.nameEn || subject.en || '')
   return name.toLowerCase().includes(query)
  })

  if (!matchedLectures.length && !matchedSources.length && !matchedSubjects.length) {
   return {
    quickKey: 'default',
    text: isArabic
     ? `🔍 ما لقيت نتائج لـ "${query}".\n\nجرب كلمات مختلفة أو اسأل عن المحاضرات والمصادر.`
     : `🔍 No results found for "${query}".\n\nTry different words or ask about lectures and sources.`
   }
  }

  const parts = [isArabic ? `🔍 نتائج البحث لـ "${query}":\n\n` : `🔍 Search results for "${query}":\n\n`]

  if (matchedLectures.length) {
   const heading = isArabic ? `🎬 محاضرات (${matchedLectures.length}):` : `🎬 Lectures (${matchedLectures.length}):`
   const items = matchedLectures.slice(0, 5).map(lecture => ` • ${isArabic ? lecture.titleAr : lecture.titleEn}`).join('\n')
   parts.push(`${heading}\n${items}\n\n`)
  }

  if (matchedSources.length) {
   const heading = isArabic ? `📎 مصادر (${matchedSources.length}):` : `📎 Sources (${matchedSources.length}):`
   const items = matchedSources.slice(0, 5).map(source => ` • ${isArabic ? source.titleAr : source.titleEn}`).join('\n')
   parts.push(`${heading}\n${items}\n\n`)
  }

  if (matchedSubjects.length) {
   const heading = isArabic ? `📖 مواد (${matchedSubjects.length}):` : `📖 Courses (${matchedSubjects.length}):`
   const items = matchedSubjects.slice(0, 5).map(subject => ` • ${isArabic ? (subject.nameAr || subject.ar) : (subject.nameEn || subject.en)}`).join('\n')
   parts.push(`${heading}\n${items}`)
  }

  return {
   quickKey: 'default',
   text: parts.join('').trim()
  }
 }

 function defaultHandler(text) {
  // Smart fallback: before the generic help text, check whether the message
  // words overlap any lecture/source title and offer those matches — so a
  // user typing "المحاضرة 5" or "Binary" gets results without "ابحث عن".
  const normWords = normalizeText(text).split(WORD_SPLIT).filter(w => w.length >= 3)
  if (normWords.length) {
    const matchesTitle = (title) => {
      const tWords = normalizeText(title || '').split(WORD_SPLIT).filter(Boolean)
      return normWords.some(w =>
        tWords.some(tw => tw.includes(w) || (w.length >= 4 && tw.length >= 4 && editDistance(tw, w) <= 1))
      )
    }
    const matchedLectures = lectures.filter(l => matchesTitle(isArabic ? l.titleAr : l.titleEn)).slice(0, 5)
    const matchedSources = sources.filter(s => matchesTitle(isArabic ? s.titleAr : s.titleEn)).slice(0, 5)
    if (matchedLectures.length || matchedSources.length) {
      const lines = []
      if (matchedLectures.length) {
        lines.push(isArabic ? '🎬 محاضرات قريبة من سؤالك:' : '🎬 Lectures matching your question:')
        matchedLectures.forEach(l => lines.push(` • ${isArabic ? l.titleAr : l.titleEn}`))
        lines.push(isArabic ? '\n→ افتح المحاضرات: /lectures' : '\n→ Open lectures: /lectures')
      }
      if (matchedSources.length) {
        lines.push(isArabic ? '📎 مصادر قريبة من سؤالك:' : '📎 Sources matching your question:')
        matchedSources.forEach(s => lines.push(` • ${isArabic ? s.titleAr : s.titleEn}`))
        lines.push(isArabic ? '\n→ افتح المصادر: /sources' : '\n→ Open sources: /sources')
      }
      return { quickKey: 'default', text: lines.join('\n') }
    }
  }
  return {
   quickKey: 'default',
   text: isArabic
    ? '🤔 ما فهمت كلامك بالضبط، بس أنا هنا أساعدك!\n\nجرب اسألني عن:\n• المحاضرات والمواد\n• المصادر\n• معلومات التواصل\n• الخطة الدراسية\n• التقييم والمفضلة\n• اكتب "ابحث عن..." للبحث'
    : '🤔 I didn\'t quite understand, but I\'m here to help!\n\nTry asking me about:\n• Lectures and courses\n• Sources\n• Contact information\n• Study plan\n• Rating and favorites\n• Type \'search for...\' to search'
  }
 }

  return [
   greetHandler,
   howAreYouHandler,
   whoAreYouHandler,
   subjectsCountHandler,
   lecturesCountHandler,
   sourcesCountHandler,
   subjectsHandler,
  lecturesListHandler,
  sourcesListHandler,
  lectureInfoHandler,
  contactHandler,
  studyPlanHandler,
  rateHandler,
  favoritesHandler,
  profileHandler,
  thankYouHandler,
  addContentHandler,
  helpHandler,
  goodbyeHandler,
  jokesHandler,
  searchHandler,
  defaultHandler
 ]
}
