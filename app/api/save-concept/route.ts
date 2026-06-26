import { NextResponse } from 'next/server'
import { createServerClient as createSupabaseClient } from '../../../lib/supabase-server'

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

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid `subject`' }, { status: 400 })
    }

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid `concept`' }, { status: 400 })
    }

    const normalizeStringArray = (value: unknown): string[] => {
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    }

    const safeDeepDiveGist = normalizeStringArray(deepDiveGist)
    const safeStrongAreas = normalizeStringArray(strongAreas)
    const safeWeakAreas = normalizeStringArray(weakAreas)
    const safeNextSteps = normalizeStringArray(nextSteps)

    const supabase = createSupabaseClient()
    const payload = {
      subject,
      concept,
      mastery_level: typeof masteryLevel === 'string' ? masteryLevel : null,
      overview_gist: typeof overviewGist === 'string' ? overviewGist : null,
      deep_dive_gist: safeDeepDiveGist,
      strong_areas: safeStrongAreas,
      weak_areas: safeWeakAreas,
      next_steps: safeNextSteps,
      notes: typeof notes === 'string' ? notes : null,
      last_updated: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('concepts')
      .upsert(payload, { onConflict: ['subject', 'concept'] })
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
