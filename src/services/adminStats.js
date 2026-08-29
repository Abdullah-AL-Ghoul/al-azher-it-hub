import { getSupabase } from './supabase'

export async function getAllUserStats() {
  const { data, error } = await getSupabase()
    .from('user_stats')
    .select('studentId, viewed')
    .limit(5000)
  if (error) throw error
  return data || []
}

export async function getAllRatings() {
  const { data, error } = await getSupabase()
    .from('ratings')
    .select('studentId, ratings')
    .limit(5000)
  if (error) throw error
  return data || []
}
