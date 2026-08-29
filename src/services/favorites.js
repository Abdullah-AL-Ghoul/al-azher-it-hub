import { getSupabase } from './supabase'

function isRpcMissing(error) {
 if (!error) return false
 const m = String(error.message || error.code || error.hint || error.details || '')
 return /function .* does not exist|PGRST202|PGRST301/i.test(m)
}

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
  // Prefer the atomic RPC (fixes concurrent lost updates).
  try {
    const { data, error } = await getSupabase()
      .rpc('toggle_favorite', { p_student_id: studentId, p_lecture_id: lectureId })
    if (!error && Array.isArray(data)) return data
    if (error && !isRpcMissing(error)) throw error
  } catch (e) {
    if (!isRpcMissing(e)) throw e
  }
  // Fallback: read-modify-write (RPC not deployed yet).
  const favs = await getFavorites(studentId)
  const isFav = favs.includes(lectureId)
  const ids = isFav ? favs.filter(id => id !== lectureId) : [...favs, lectureId]
  const { error } = await getSupabase()
    .from('favorites')
    .upsert({ studentId, ids }, { onConflict: 'studentId' })
  if (error) throw error
  return ids
}
