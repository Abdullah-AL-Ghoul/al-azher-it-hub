import { getSupabase } from './supabase'
import { nowISO } from '../utils/helpers'

function isRpcMissing(error) {
 if (!error) return false
 const m = String(error.message || error.code || error.hint || error.details || '')
 return /function .* does not exist|PGRST202|PGRST301/i.test(m)
}

export async function getUserStats(studentId) {
  const { data, error } = await getSupabase()
    .from('user_stats')
    .select('viewed, lastVisit')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return data || { viewed: [], lastVisit: null }
}

export async function markViewed(studentId, lectureId) {
  // Prefer the atomic RPC (dedup + lock, fixes concurrent lost updates).
  try {
    const { data, error } = await getSupabase()
      .rpc('mark_viewed', { p_student_id: studentId, p_lecture_id: lectureId })
    if (!error && Array.isArray(data)) return { viewed: data, lastVisit: nowISO() }
    if (error && !isRpcMissing(error)) throw error
  } catch (e) {
    if (!isRpcMissing(e)) throw e
  }
  // Fallback: read-modify-write (RPC not deployed yet).
  const { data } = await getSupabase()
    .from('user_stats')
    .select('viewed')
    .eq('studentId', studentId)
    .maybeSingle()
  const current = data?.viewed || []
  const viewed = current.includes(lectureId) ? current : [...current, lectureId]
  const lastVisit = nowISO()
  const { error } = await getSupabase()
    .from('user_stats')
    .upsert({ studentId, viewed, lastVisit }, { onConflict: 'studentId' })
  if (error) throw error
  return { viewed, lastVisit }
}

export async function getViewed(studentId) {
  const stats = await getUserStats(studentId)
  return stats.viewed || []
}
