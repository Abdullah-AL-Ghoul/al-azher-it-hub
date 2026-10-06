import { createCrudService } from './createCrudService'

const sources = createCrudService('sources', 'titleAr', 200)

export const getSources = sources.getAll
export const addSource = sources.add
export const updateSource = sources.update
export const deleteSource = sources.remove
