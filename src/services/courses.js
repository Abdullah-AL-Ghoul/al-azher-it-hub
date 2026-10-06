import { createCrudService } from './createCrudService'

/** @type {import('./createCrudService').CrudService<import('./types').Course>} */
const courses = createCrudService('courses', 'nameAr', 100)

export const getCourses = courses.getAll
export const addCourse = courses.add
export const updateCourse = courses.update
export const deleteCourse = courses.remove
