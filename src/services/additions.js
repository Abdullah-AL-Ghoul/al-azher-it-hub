import { getSupabase, authRpc } from './supabase'
import { safeActivity } from './activity'

export async function getAdditions() {
  const { data, error } = await getSupabase()
    .from('additions')
    .select('id, type, titleAr, titleEn, descriptionAr, descriptionEn, url, createdAt')
    .order('createdAt', { ascending: false, nullsFirst: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function addAddition(data) {
  const saved = await authRpc('admin_save_rows', { p_table: 'additions', p_rows: [data] })
  const row = { ...data, ...(saved?.[0] || {}) }
  await safeActivity('additions', 'ADD', data.titleAr || data.titleEn)
  return row
}

export async function updateAddition(id, data) {
  await authRpc('admin_save_rows', { p_table: 'additions', p_rows: [{ id, ...data }] })
  await safeActivity('additions', 'UPDATE', data.titleAr || data.titleEn || id)
}

export async function deleteAddition(id) {
  await authRpc('admin_delete_row', { p_table: 'additions', p_id: id })
  await safeActivity('additions', 'DELETE', id)
}

export async function saveAdditions(data) {
  await authRpc('admin_save_rows', { p_table: 'additions', p_rows: data })
  await safeActivity('additions', 'UPDATE', `${data.length} items`)
}
