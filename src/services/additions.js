import { authRpc } from './supabase'
import { safeActivity } from './activity'
import { createCrudService } from './createCrudService'

const crud = createCrudService('additions', 'titleAr', 200)

export function getAdditions(force = false, selectCols = 'id, type, titleAr, titleEn, descriptionAr, descriptionEn, url, createdAt') {
  return crud.getAll(force, selectCols)
}

export const addAddition = crud.add
export const updateAddition = crud.update
export const deleteAddition = crud.remove

export async function saveAdditions(data) {
  const sanitized = (data || []).map((row) => ({
    id: row.id,
    type: row.type || 'post',
    titleAr: row.titleAr || '',
    titleEn: row.titleEn || '',
    descriptionAr: row.descriptionAr || '',
    descriptionEn: row.descriptionEn || '',
    url: row.url || '',
    createdAt: row.createdAt || new Date().toISOString(),
  }))
  await authRpc('admin_save_rows', { p_table: 'additions', p_rows: sanitized })
  crud.invalidate()
  await safeActivity('additions', 'UPDATE', `${sanitized.length} items`)
  return sanitized
}

