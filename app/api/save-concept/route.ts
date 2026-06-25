import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '../../../lib/supabase'

type SaveConceptBody = {
  subject?: string
  concept?: string
  masteryLevel?: string
  overviewGist?: string
  deepDiveGist?: string[]
  strongAreas?: string[]
  weakAreas?: string[]
  nextSteps?: string[]
  notes?: string
}

export async function POST(req: Request) {
  try {
    const body: SaveConceptBody = await req.json()
    const {
      subject,
      concept,
      masteryLevel,
      overviewGist,
      deepDiveGist,
      strongAreas,
      weakAreas,
      nextSteps,
      notes
    } = body || {}

    if (!subject || !concept) {
      return NextResponse.json({ error: 'Missing required `subject` or `concept`' }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const payload = {
      subject,
      concept,
      mastery_level: masteryLevel ?? null,
      overview_gist: overviewGist ?? null,
      deep_dive_gist: deepDiveGist ?? null,
      strong_areas: strongAreas ?? null,
      weak_areas: weakAreas ?? null,
      next_steps: nextSteps ?? null,
      notes: notes ?? null,
      last_updated: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('concepts')
      .upsert(payload, { onConflict: 'subject,concept' })
      .select()
      .single()

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: 'Failed to save concept' }, { status: 500 })
    }

    return NextResponse.json({ success: true, concept: data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
