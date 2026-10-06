import { getSupabase, authRpc } from './supabase'

export async function getStudyPlan() {
  const { data, error } = await getSupabase()
    .from('settings')
    .select('value')
    .eq('key', 'studyPlan')
    .maybeSingle()
  if (error) throw error
  return data?.value || { links: [] }
}

export async function saveStudyPlan(data) {
  await authRpc('admin_save_setting', { p_key: 'studyPlan', p_value: data })
}
