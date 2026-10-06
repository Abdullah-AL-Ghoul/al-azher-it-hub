/**
 * Shared JSDoc type definitions for the data layer.
 *
 * These describe the row shapes the browser sees from Supabase (as returned by
 * src/services). Documentation only — no build-time checking; editors pick them
 * up via `@typedef`/`@type {import('./types').Lecture}` annotations.
 *
 * @typedef {Object} Lecture
 * @property {string} id
 * @property {string} titleAr
 * @property {string} titleEn
 * @property {string} subjectAr
 * @property {string} subjectEn
 * @property {string} [doctorAr]
 * @property {string} [doctorEn]
 * @property {string} [courseId]
 * @property {string} url Video/stream URL
 * @property {string} date ISO date (YYYY-MM-DD)
 * @property {number} [sortOrder]
 * @property {string} [createdAt]
 *
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} nameAr
 * @property {string} nameEn
 * @property {string} [doctorAr]
 * @property {string} [doctorEn]
 * @property {string} [year]
 * @property {string} [semester]
 * @property {string[]} [prerequisites]
 * @property {string} [createdAt]
 *
 * @typedef {Object} Source
 * @property {string} id
 * @property {string} titleAr
 * @property {string} titleEn
 * @property {string} [subjectAr]
 * @property {string} [subjectEn]
 * @property {string} [url]
 * @property {string} [fileName]
 * @property {Array<{name: string, path: string}>} [files]
 * @property {*} [fileData] Legacy inline file payload
 * @property {string} [date]
 * @property {string} [createdAt]
 *
 * @typedef {Object} Addition
 * @property {string} id
 * @property {string} type
 * @property {string} titleAr
 * @property {string} titleEn
 * @property {string} [descriptionAr]
 * @property {string} [descriptionEn]
 * @property {string} [url]
 * @property {number} [sortOrder]
 * @property {string} [createdAt]
 *
 * @typedef {Object} StudentProfile
 * @property {string} studentId
 * @property {string} name
 * @property {'admin'|'student'} role
 * @property {string} [email]
 * @property {string} [major]
 * @property {string} [google]
 * @property {string} [linkedin]
 * @property {string} [whatsapp]
 * @property {'active'|'suspended'} [status]
 * @property {string} [lastVisit]
 * @property {string} [createdAt]
 * @property {string} [password] PBKDF2 "salt:hash" — never exposed to the UI
 * @property {string} [auth_user_id] Supabase auth account link
 * @property {string} [lastIP] Only readable by admins/self via RPC
 *
 * @typedef {Object} ActivityNotification
 * @property {string} type Source table (lectures/sources/additions/courses/users/system)
 * @property {string} action ADD | UPDATE | IMPORT | ...
 * @property {string} detail
 * @property {string} timestamp ISO timestamp
 *
 * @typedef {Object} UserStats
 * @property {string[]} viewed
 * @property {string|null} lastVisit
 *
 * @typedef {Object} StudyPlanRow
 * @property {string} id
 * @property {string} titleAr
 * @property {string} titleEn
 * @property {string} [descriptionAr]
 * @property {string} [descriptionEn]
 * @property {string} [date]
 * @property {string} [createdAt]
 */
export {}
