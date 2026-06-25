import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '../../../lib/supabase'
import { createAnthropic } from '@ai-sdk/anthropic'
import type { LanguageModelV3Message } from '@ai-sdk/provider'

type ConceptRow = {
  id?: number
  subject?: string
  concept?: string
  mastery_level?: string
  weak_areas?: string[] | null
  strong_areas?: string[] | null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userMessage, subject = '', concept = '' } = body || {}

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid `userMessage`' }, { status: 400 })
    }

    let row: ConceptRow | null = null

    if (subject && concept) {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('subject', subject)
        .eq('concept', concept)
        .maybeSingle()

      if (error) console.error('Supabase error:', error)
      if (data) row = data as ConceptRow
    }

    const weakText = (arr: string[] | null | undefined) => (arr && arr.length ? arr.join(', ') : 'None')
    const strongText = (arr: string[] | null | undefined) => (arr && arr.length ? arr.join(', ') : 'None')

    let systemPrompt = ''

    if (!row) {
      systemPrompt = `Mode A — beginner-friendly tutor. Start with an analogy, define all terms, and explain concepts from first principles.\nWeak areas: None\nStrong areas: None`
    } else {
      const mastery = (row.mastery_level || '').toString()
      const weak = weakText(row.weak_areas)
      const strong = strongText(row.strong_areas)

      if (mastery === 'Introduced' || mastery === 'Developing') {
        systemPrompt = `Mode B — reference prior knowledge, mention likely weak areas, proceed at a moderate pace, and provide scaffolding where needed.\nWeak areas: ${weak}\nStrong areas: ${strong}`
      } else if (mastery === 'Proficient' || mastery === 'Strong') {
        systemPrompt = `Mode C — technical and concise. Skip basic definitions, focus on nuance, edge cases, and deeper intuition.\nWeak areas: ${weak}\nStrong areas: ${strong}`
      } else {
        systemPrompt = `Mode A — beginner-friendly tutor. Start with an analogy, define all terms, and explain concepts from first principles.\nWeak areas: ${weak}\nStrong areas: ${strong}`
      }
    }

    const messages: LanguageModelV3Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: [{ type: 'text', text: `Subject: ${subject || 'N/A'}\nConcept: ${concept || 'N/A'}\nUser: ${userMessage}` }] }
    ]

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 })
    }

    const anthropic = createAnthropic({ apiKey })
    const model = anthropic.chat('claude-sonnet-4-5')

    const completion = await model.doStream({
      prompt: messages,
      maxOutputTokens: 1000
    })

    return new NextResponse(completion.stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
