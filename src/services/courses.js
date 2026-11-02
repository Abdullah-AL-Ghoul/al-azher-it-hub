import { createCrudService } from './createCrudService'
import { DEFAULT_COURSES } from '../data/sampleLectures'

/** @type {import('./createCrudService').CrudService<import('./types').Course>} */
const courses = createCrudService('courses', 'nameAr', 100)

export async function getCourses(force = false, selectCols = '*') {
  try {
    const list = await courses.getAll(force, selectCols)
    if (Array.isArray(list) && list.length > 0) return list
  } catch (_e) {
    // fallback on error
  }
  return [...DEFAULT_COURSES]
}

export const addCourse = courses.add
export const updateCourse = courses.update
export const deleteCourse = courses.remove
