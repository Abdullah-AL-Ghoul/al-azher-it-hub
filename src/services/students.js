import { getSupabase, authRpc } from './supabase'
import { safeActivity } from './activity'

export async function deleteStudent(studentId) {
  await authRpc('admin_manage_user', { p_action: 'delete', p_payload: { studentId } })
  await safeActivity('users', 'DELETE', studentId)
}

export async function updateStudent(studentId, data) {
  await authRpc('admin_manage_user', { p_action: 'update', p_payload: { studentId, ...data } })
  await safeActivity('users', 'UPDATE', studentId)
}

export async function studentUpdateProfile(data) {
  const { error } = await getSupabase().rpc('student_update_profile', {
    p_fields: data,
  })
  if (error) throw error
}
