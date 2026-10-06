import { authRpc } from './supabase'
import { nowISO } from '../utils/helpers'
import { safeActivity } from './activity'
import { getLectures } from './lectures'
import { getSources } from './sources'
import { getUsers } from './users'
import { getSubjects } from './subjects'

export async function exportAllData() {
  const [lectures, sources, users, subjects] = await Promise.all([
    getLectures(), getSources(), getUsers(), getSubjects()
  ])
  return {
    lectures,
    sources,
    users: users.map(u => {
      const clean = { ...u }
      delete clean.password
      return clean
    }),
    subjects,
    exportedAt: nowISO()
  }
}

function stripId(row) {
  const clean = { ...(row || {}) }
  delete clean.id
  return clean
}

export async function importAllData(data) {
  if (!data || typeof data !== 'object') return { ok: false, error: 'INVALID_FORMAT' }
  if (Array.isArray(data.lectures) && data.lectures.length) {
    await authRpc('admin_save_rows', { p_table: 'lectures', p_rows: data.lectures.map(stripId) })
  }
  if (Array.isArray(data.sources) && data.sources.length) {
    await authRpc('admin_save_rows', { p_table: 'sources', p_rows: data.sources.map(stripId) })
  }
  await safeActivity('system', 'IMPORT', `Imported ${data.lectures?.length || 0} lectures, ${data.sources?.length || 0} sources`)
  return { ok: true }
}
