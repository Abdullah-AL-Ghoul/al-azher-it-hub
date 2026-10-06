import { getCourses } from './courses'

export async function getSubjects() {
  const courses = await getCourses()
  return courses.map(c => ({ ar: c.nameAr, en: c.nameEn, doctorAr: c.doctorAr, doctorEn: c.doctorEn }))
}
