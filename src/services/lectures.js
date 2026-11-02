import { createCrudService } from './createCrudService'
import { DEFAULT_LECTURES } from '../data/sampleLectures'

/** @type {import('./createCrudService').CrudService<import('./types').Lecture>} */
const lectures = createCrudService('lectures', 'titleAr', 200)

export async function getLectures(force = false, selectCols = '*') {
  try {
    const list = await lectures.getAll(force, selectCols)
    if (Array.isArray(list) && list.length > 0) return list
  } catch (_e) {
    // fallback on error
  }
  return [...DEFAULT_LECTURES]
}

export const addLecture = lectures.add
export const updateLecture = lectures.update
export const deleteLecture = lectures.remove
