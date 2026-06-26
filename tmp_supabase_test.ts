import { createClient } from '@supabase/supabase-js'
import { createServerClient } from './lib/supabase-server'
async function main() {
  console.log('NEXT_PUBLIC_SUPABASE_URL=', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_URL=', process.env.SUPABASE_URL)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('SUPABASE_SERVICE_ROLE_KEY=', process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
  const serverClient = createServerClient()
  const serverResult = await serverClient.from('concepts').select('*').limit(1)
  console.log('server client result:', serverResult)
  const direct = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')
  const directResult = await direct.from('concepts').select('*').limit(1)
  console.log('direct client result:', directResult)
}
main().catch(err => { console.error('main error', err); process.exit(1) })
