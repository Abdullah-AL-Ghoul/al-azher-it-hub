import { getSupabase } from './supabase'

function isRpcMissing(error) {
 if (!error) return false
 const m = String(error.message || error.code || error.hint || error.details || '')
 return /function .* does not exist|PGRST202|PGRST301/i.test(m)
}

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
  // Prefer the atomic RPC (fixes concurrent lost updates).
  try {
    const { data, error } = await getSupabase()
      .rpc('set_rating', { p_student_id: studentId, p_lecture_id: lectureId, p_rating: rating })
    if (!error && data && typeof data === 'object') return data
    if (error && !isRpcMissing(error)) throw error
  } catch (e) {
    if (!isRpcMissing(e)) throw e
  }
  // Fallback: read-modify-write (RPC not deployed yet).
  const current = await getRatings(studentId)
  const ratings = { ...current, [lectureId]: rating }
  const { error } = await getSupabase()
    .from('ratings')
    .upsert({ studentId, ratings }, { onConflict: 'studentId' })
  if (error) throw error
  return ratings
}
