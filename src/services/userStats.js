import { getSupabase } from './supabase'
import { nowISO } from '../utils/helpers'

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
