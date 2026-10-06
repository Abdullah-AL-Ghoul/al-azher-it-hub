// Client-side achievements + daily streak, computed from data the app already
// has (UserDataContext viewed/favorites + a local activity-day set). No DB
// schema changes — everything lives in localStorage keyed per student.

const DAYS_KEY = (studentId) => `al_azher_activity_days_${studentId || 'guest'}`

const isoDay = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`

/** Record today as an active day (idempotent). Called once per app boot while signed in. */
export function recordToday(studentId) {
  if (!studentId) return
  try {
    const key = DAYS_KEY(studentId)
    const days = new Set(JSON.parse(localStorage.getItem(key) || '[]'))
    days.add(isoDay(new Date()))
    // Cap the set: 400 days ≈ 13 months of streak history.
    const sorted = [...days].sort().slice(-400)
    localStorage.setItem(key, JSON.stringify(sorted))
  } catch (_e) { /* storage unavailable */ }
}

function getActivityDays(studentId) {
  try {
    return JSON.parse(localStorage.getItem(DAYS_KEY(studentId)) || '[]')
  } catch (_e) { return [] }
}

/**
 * Current consecutive-day streak ending today or yesterday.
 * Returns 0 if the student has no recorded activity or the last active day
 * is older than yesterday (streak broken).
 */
export function currentStreak(studentId) {
  const days = getActivityDays(studentId)
  if (!days.length) return 0
  const set = new Set(days)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayMs = 86400000

  // Start from today if active today, else yesterday (streak alive until the
  // day actually ends).
  let cursor = new Date(today)
  if (!set.has(isoDay(cursor))) {
    cursor = new Date(today.getTime() - dayMs)
    if (!set.has(isoDay(cursor))) return 0
  }
  let streak = 0
  while (set.has(isoDay(cursor))) {
    streak++
    cursor = new Date(cursor.getTime() - dayMs)
  }
  return streak
}

/** Longest run of consecutive days in the recorded history. */
export function bestStreak(studentId) {
  const days = [...new Set(getActivityDays(studentId))].sort()
  let best = 0
  let run = 0
  let prev = null
  for (const d of days) {
    const dt = new Date(`${d}T00:00:00`)
    if (Number.isNaN(dt.getTime())) continue
    run = prev && dt.getTime() - prev === 86400000 ? run + 1 : 1
    prev = dt.getTime()
    if (run > best) best = run
  }
  return best
}

/**
 * Badge catalog. `progress`/`target` drive the progress rings on Profile;
 * `achieved` flips the card to its earned state.
 * @param {{viewed: string[], favorites: string[], streak: number, subjectProgress?: Array<{total:number, watched:number}>}} input
 * @returns {Array<{id:string, icon:string, titleAr:string, titleEn:string, descAr:string, descEn:string, progress:number, target:number, achieved:boolean}>}
 */
export function computeAchievements({ viewed = [], favorites = [], streak = 0, subjectProgress = [] }) {
  const watched = viewed.length
  const favs = favorites.length
  // "Course Complete": any single subject fully watched.
  const subjectDone = subjectProgress.some((sp) => sp.total > 0 && sp.watched >= sp.total)
  const mk = (extra) => ({ ...extra, achieved: extra.progress >= extra.target })
  return [
    mk({
      id: 'first-lecture', icon: 'FiPlay',
      titleAr: 'الخطوة الأولى', titleEn: 'First Step',
      descAr: 'شاهد أول محاضرة', descEn: 'Watch your first lecture',
      progress: Math.min(watched, 1), target: 1,
    }),
    mk({
      id: 'watch-5', icon: 'FiEye',
      titleAr: 'مستكشف', titleEn: 'Explorer',
      descAr: 'شاهد 5 محاضرات', descEn: 'Watch 5 lectures',
      progress: watched, target: 5,
    }),
    mk({
      id: 'watch-10', icon: 'FiEye',
      titleAr: 'منظّم المجالس', titleEn: 'Regular',
      descAr: 'شاهد 10 محاضرات', descEn: 'Watch 10 lectures',
      progress: watched, target: 10,
    }),
    mk({
      id: 'watch-25', icon: 'FiAward',
      titleAr: 'محاط بالعلم', titleEn: 'Scholar',
      descAr: 'شاهد 25 محاضرة', descEn: 'Watch 25 lectures',
      progress: watched, target: 25,
    }),
    mk({
      id: 'fav-5', icon: 'FiHeart',
      titleAr: 'ذوق رفيع', titleEn: 'Curator',
      descAr: 'أضف 5 محاضرات للمفضلة', descEn: 'Favorite 5 lectures',
      progress: favs, target: 5,
    }),
    mk({
      id: 'streak-7', icon: 'FiCalendar',
      titleAr: 'أسبوع متواصل', titleEn: 'Week Streak',
      descAr: '7 أيام متتالية من التعلم', descEn: '7 days of learning in a row',
      progress: streak, target: 7,
    }),
    mk({
      id: 'course-complete', icon: 'FiCheckCircle',
      titleAr: 'مادة مكتملة', titleEn: 'Course Complete',
      descAr: 'أنهِ 100% من محاضرات مادة واحدة', descEn: 'Finish 100% of any subject',
      progress: subjectDone ? 1 : 0, target: 1,
    }),
  ]
}
