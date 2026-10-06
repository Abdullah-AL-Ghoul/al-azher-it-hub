import { createCrudService } from './createCrudService'

/** @type {import('./createCrudService').CrudService<import('./types').Source>} */
const sources = createCrudService('sources', 'titleAr', 200)

export const getSources = sources.getAll
export const addSource = sources.add
export const updateSource = sources.update
export const deleteSource = sources.remove
