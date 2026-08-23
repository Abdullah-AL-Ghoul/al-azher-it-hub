import { getSupabase } from './supabase'

export async function getFavorites(studentId) {
  const { data, error } = await getSupabase()
    .from('favorites')
    .select('ids')
    .eq('studentId', studentId)
    .maybeSingle()
  if (error) throw error
  return data?.ids || []
}

export async function toggleFavorite(studentId, lectureId) {
  const favs = await getFavorites(studentId)
  const isFav = favs.includes(lectureId)
  const ids = isFav ? favs.filter(id => id !== lectureId) : [...favs, lectureId]
  const { error } = await getSupabase()
    .from('favorites')
    .upsert({ studentId, ids }, { onConflict: 'studentId' })
  if (error) throw error
  return ids
}
