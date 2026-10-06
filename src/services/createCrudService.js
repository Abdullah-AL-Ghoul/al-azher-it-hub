// SECURITY CAVEAT: Row-level security (RLS) must be enabled on these tables in
// Supabase and configured so each client can only access the rows it is allowed
// to read/write. This service is not a substitute for RLS; it only enforces the
// policies DB-side once they are set up.
import { getSupabase, authRpc } from './supabase'
import { safeActivity } from './activity'

const cache = new Map()
const inflight = new Map()
const epochs = new Map()

function bumpEpoch(collectionName) {
  epochs.set(collectionName, (epochs.get(collectionName) || 0) + 1)
  // Drop every cache/in-flight entry for this table (any selectCols variant).
  const prefix = `${collectionName}::`
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key)
  for (const key of inflight.keys()) if (key.startsWith(prefix)) inflight.delete(key)
}

export function createCrudService(collectionName, nameField = 'nameAr', maxItems = 100) {
  async function getAll(force = false, selectCols = '*') {
    const key = `${collectionName}::${selectCols}`
    const cached = cache.get(key)
    if (!force && cached && Date.now() - cached.ts < 60000) {
      return Array.isArray(cached.data) ? [...cached.data] : cached.data
    }
    const inFlight = inflight.get(key)
    if (!force && inFlight && (epochs.get(collectionName) || 0) === inFlight.epoch) {
      return inFlight.promise
    }
    const startEpoch = epochs.get(collectionName) || 0
    const promise = (async () => {
      const { data, error } = await getSupabase()
        .from(collectionName)
        .select(selectCols)
        .order('createdAt', { ascending: false, nullsFirst: false })
        .limit(maxItems)
      if (error) throw error
      // Only repopulate the cache if no write happened while this fetch was in
      // flight; otherwise the cache would hold pre-write data.
      if ((epochs.get(collectionName) || 0) === startEpoch) {
        cache.set(key, { data: data || [], ts: Date.now() })
      }
      return data || []
    })()
    inflight.set(key, { promise, epoch: startEpoch })
    try {
      return await promise
    } finally {
      inflight.delete(key)
    }
  }

  async function add(data) {
    const saved = await authRpc('admin_save_rows', { p_table: collectionName, p_rows: [data] })
    bumpEpoch(collectionName)
    const row = { ...data, ...(saved?.[0] || {}) }
    await safeActivity(collectionName, 'ADD', data[nameField] || data.nameAr || data.titleAr || data.titleEn || row?.id)
    return row
  }

  async function update(id, data) {
    await authRpc('admin_save_rows', { p_table: collectionName, p_rows: [{ id, ...data }] })
    bumpEpoch(collectionName)
    await safeActivity(collectionName, 'UPDATE', data[nameField] || data.nameAr || data.titleAr || data.titleEn || id)
  }

  async function remove(id) {
    await authRpc('admin_delete_row', { p_table: collectionName, p_id: id })
    bumpEpoch(collectionName)
    await safeActivity(collectionName, 'DELETE', id)
  }

  function invalidate() {
    bumpEpoch(collectionName)
  }

  return { getAll, add, update, remove, invalidate }
}
