import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const supabaseServiceRoleKey: string | undefined =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabaseKey: string = supabaseServiceRoleKey ?? supabaseAnonKey

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL and/or SUPABASE key environment variables')
}

if (!supabaseServiceRoleKey) {
  console.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to the anon key for server-side Supabase access. ' +
    'This may work for reads, but writes may still fail if row-level security is enabled.'
  )
}

export function createServerClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl, supabaseKey)
}
