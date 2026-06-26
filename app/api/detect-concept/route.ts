import { NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'

type RequestBody = {
  userMessage?: string
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json()
    const userMessage = body?.userMessage

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid `userMessage`' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 })
    }

    const anthropic = createAnthropic({ apiKey })
    const model = anthropic.chat('claude-sonnet-4-5')

    const prompt = `Extract the study topic from the user's message. Return only valid JSON with exactly two fields: subject and concept. If the message is not about studying a concept, return subject: "" and concept: "".

User message: "${userMessage.replace(/"/g, '\\"')}"

Example output:
{
  "subject": "Physics",
  "concept": "Newton's laws"
}

Only return JSON, nothing else.`

    const completion = await model.doGenerate({
      prompt: [
        { role: 'system', content: 'You are an extractor that outputs only JSON.' },
        { role: 'user', content: [{ type: 'text', text: prompt }] }
      ],
      maxOutputTokens: 300
    })

    const resultText = completion.content
      .filter((contentPart): contentPart is { type: 'text'; text: string } => contentPart.type === 'text')
      .map((contentPart) => contentPart.text)
      .join('')

    const extractValue = (key: string, text: string) => {
      const jsonRegex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i')
      const jsonMatch = jsonRegex.exec(text)
      if (jsonMatch?.[1]) return jsonMatch[1].trim()

      const lineRegex = new RegExp(`${key}\\s*[:=]\\s*['\"]?([^'\"\n]+)['\"]?`, 'i')
      const lineMatch = lineRegex.exec(text)
      return lineMatch?.[1]?.trim() ?? ''
    }

    let parsed: { subject: string; concept: string } = { subject: '', concept: '' }
    try {
      const json = JSON.parse(resultText)
      parsed.subject = typeof json.subject === 'string' ? json.subject.trim() : ''
      parsed.concept = typeof json.concept === 'string' ? json.concept.trim() : ''
    } catch {
      parsed.subject = extractValue('subject', resultText)
      parsed.concept = extractValue('concept', resultText)
    }

    const responsePayload = {
      subject: parsed.subject,
      concept: parsed.concept
    }

    return NextResponse.json(responsePayload)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
