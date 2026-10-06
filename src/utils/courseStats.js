export function matchCourseLectures(course, lectures) {
  if (!course) return []
  return (lectures || []).filter(l =>
    l.courseId === course.id ||
    (l.subjectAr && course.nameAr && l.subjectAr === course.nameAr) ||
    (l.subjectEn && course.nameEn && l.subjectEn === course.nameEn)
  )
}

export function matchCourseSources(course, sources) {
  if (!course) return []
  return (sources || []).filter(s =>
    (s.subjectAr && course.nameAr && s.subjectAr === course.nameAr) ||
    (s.subjectEn && course.nameEn && s.subjectEn === course.nameEn)
  )
}

export function computeCourseStats(course, lectures, sources, userStats = [], allRatings = []) {
  const courseLectures = matchCourseLectures(course, lectures)
  const courseSources = matchCourseSources(course, sources)

  const lectureIds = new Set(courseLectures.map(l => l.id))
  const perLecture = courseLectures.map(l => ({ id: l.id, views: 0 }))
  const perLectureMap = new Map(perLecture.map(p => [p.id, p]))

  let views = 0
  for (const us of userStats) {
    const seen = us.viewed || []
    for (const id of seen) {
      const p = perLectureMap.get(id)
      if (p) { p.views += 1; views += 1 }
    }
  }

  const ratings = []
  for (const ar of allRatings) {
    const map = ar.ratings || {}
    for (const [lid, r] of Object.entries(map)) {
      if (lectureIds.has(lid)) ratings.push(Number(r))
    }
  }

  const ratingsCount = ratings.length
  const avgRating = ratingsCount ? (ratings.reduce((a, b) => a + b, 0) / ratingsCount).toFixed(1) : '—'
  const topViews = perLecture.length ? Math.max(...perLecture.map(p => p.views)) : 0

  return { courseLectures, courseSources, views, ratings, perLecture, ratingsCount, avgRating, topViews }
}
