import { getSupabase } from './supabase'

export async function getRatings(studentId) {
  const { data, error } = await getSupabase()
    .from('ratings')
    .select('ratings')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return data?.ratings || {}
}

export async function setRating(studentId, lectureId, rating) {
  const current = await getRatings(studentId)
  const ratings = { ...current, [lectureId]: rating }
  const { error } = await getSupabase()
    .from('ratings')
    .upsert({ studentId, ratings }, { onConflict: 'studentId' })
  if (error) throw error
  return ratings
}
