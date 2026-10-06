import { getSupabase } from './supabase'

export async function addStudentLog(log) {
  // SECURITY DEFINER RPC: studentId/name are derived from the session
  // server-side, so a client can never forge log rows attributed to another
  // user. Client-supplied studentId/name/ip fields are ignored.
  const { error } = await getSupabase().rpc('add_student_log', {
    p_type: log?.type || 'EVENT',
    p_detail: log?.detail || '',
    p_device: log?.device || '',
    p_ip: log?.ip || null,
  })
  if (error) throw error
}

export async function getStudentLogs(studentId) {
  const { data, error } = await getSupabase()
    .from('student_logs')
    .select('*')
    .eq('studentId', studentId)
    .order('timestamp', { ascending: false })
    .limit(100)
  if (error) throw error
  return data || []
}

export async function getAllStudentLogs() {
  // Admin-wide log view; capped at 200 (per-student view uses limit 100).
  const { data, error } = await getSupabase()
    .from('student_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(200)
  if (error) throw error
  return data || []
}

export async function updateLastVisit(ip, device) {
  const { error } = await getSupabase().rpc('student_touch_visit', {
    p_ip: ip || '',
    p_device: device || '',
  })
  if (error) throw error
}
