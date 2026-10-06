import { getSupabase, authRpc } from './supabase'
import { nowISO } from '../utils/helpers'

export async function getRoadmap() {
  const { data, error } = await getSupabase()
    .from('settings')
    .select('value')
    .eq('key', 'roadmap')
    .maybeSingle()
  if (error) throw error
  return data?.value?.courses || []
}

export async function saveRoadmap(courses) {
  await authRpc('admin_save_setting', { p_key: 'roadmap', p_value: { courses, updatedAt: nowISO() } })
}
