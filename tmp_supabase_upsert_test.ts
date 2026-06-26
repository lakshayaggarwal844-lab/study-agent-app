import { createClient } from '@supabase/supabase-js'
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  console.log('url', url)
  console.log('role key present', !!key)
  const supabase = createClient(url, key)
  const payload = {
    subject: 'Test Service Role',
    concept: 'Test Concept',
    mastery_level: 'Introduced',
    overview_gist: 'Test overview',
    deep_dive_gist: ['Detail1'],
    strong_areas: ['Strength1'],
    weak_areas: ['Weak1'],
    next_steps: ['Step1'],
    notes: 'Test notes',
    last_updated: new Date().toISOString()
  }
  const { data, error } = await supabase.from('concepts').upsert(payload, { onConflict: ['subject', 'concept'] }).select().single()
  console.log('upsert result', { data, error })
}
main().catch(err => { console.error('main error', err); process.exit(1) })
