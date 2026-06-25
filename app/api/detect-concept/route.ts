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

    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const model = anthropic.chat('claude-haiku-4-5-20251001')

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
      .filter((contentPart) => (contentPart as any).type === 'text')
      .map((contentPart) => (contentPart as any).text)
      .join('')

    let parsed
    try {
      parsed = JSON.parse(resultText)
    } catch (error) {
      parsed = { subject: '', concept: '' }
    }

    const responsePayload = {
      subject: typeof parsed.subject === 'string' ? parsed.subject : '',
      concept: typeof parsed.concept === 'string' ? parsed.concept : ''
    }

    return NextResponse.json(responsePayload)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
