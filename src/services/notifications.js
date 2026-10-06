// SECURITY CAVEAT: notifications come from the get_notifications_feed SECURITY
// DEFINER RPC, which exposes only type/action/detail/timestamp — never
// studentId/name/ip/device. Directly reading the activity table is admin-only
// under RLS, so this service must never be swapped for a table read.
import { getSupabase } from './supabase'

/**
 * @param {number} [limit]
 * @returns {Promise<import('./types').ActivityNotification[]>}
 * @throws {import('@supabase/supabase-js').PostgrestError} on RPC failure
 */
export async function getNotificationsFeed(limit = 30) {
  const { data, error } = await getSupabase().rpc('get_notifications_feed', { p_limit: limit })
  if (error) throw error
  return data || []
}
