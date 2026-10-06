import { createCrudService } from './createCrudService'

/** @type {import('./createCrudService').CrudService<import('./types').Lecture>} */
const lectures = createCrudService('lectures', 'titleAr', 200)

export const getLectures = lectures.getAll
export const addLecture = lectures.add
export const updateLecture = lectures.update
export const deleteLecture = lectures.remove
