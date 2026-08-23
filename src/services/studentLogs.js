import { getSupabase } from './supabase'
import { nowISO } from '../utils/helpers'

export async function addStudentLog(log) {
  const { error } = await getSupabase()
    .from('student_logs')
    .insert({ ...log, timestamp: nowISO() })
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
