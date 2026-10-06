import { getSupabase, authRpc } from './supabase'

export async function safeActivity(type, action, detail) {
  try { await addActivity(type, action, detail) } catch (_e) { /* silent */ }
}

export async function getActivity() {
  const { data, error } = await getSupabase()
    .from('activity')
    .select('id, type, action, detail, timestamp')
    .order('timestamp', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function addActivity(type, action, detail) {
  const { error } = await getSupabase().from('activity').insert({
    type, action, detail,
    timestamp: new Date().toISOString(),
  })
  if (error) throw error
}

export async function clearActivity() {
  await authRpc('admin_clear_activity')
}
