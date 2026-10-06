import { createClient } from '@supabase/supabase-js'

let client = null

export function getSupabase() {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'SUPABASE_NOT_CONFIGURED: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to Supabase.'
    )
  }
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: { schema: 'public' },
  })
  return client
}

export async function authRpc(fn, params = {}) {
  const { data, error } = await getSupabase().rpc(fn, params)
  if (error) throw error
  return data
}
