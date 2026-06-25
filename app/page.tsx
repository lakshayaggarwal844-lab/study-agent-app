'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'

type MessageRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: MessageRole
  content: string
  subject?: string
  concept?: string
  saveState?: 'idle' | 'saving' | 'saved' | 'error'
}

type DetectResult = {
  subject: string
  concept: string
}

type SaveConceptPayload = {
  subject: string
  concept: string
  masteryLevel: string
  overviewGist: string
  deepDiveGist: string[]
  strongAreas: string[]
  weakAreas: string[]
  nextSteps: string[]
  notes: string
}

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Welcome! Send a study question and I will detect the subject and concept, then reply with a guided explanation.'
  }
]

function getSavePayload(assistantText: string, subject: string, concept: string): SaveConceptPayload {
  const findLine = (label: string) => {
    const match = assistantText.match(new RegExp(`${label}:\\s*(.+)`, 'i'))
    return match?.[1]?.trim() ?? ''
  }

  const masteryLevel = findLine('Mastery Level') || 'Unknown'
  const overviewGist = findLine('Overview') || assistantText.split('\n')[0].slice(0, 220)
  const weakAreasText = findLine('Weak Areas')
  const strongAreasText = findLine('Strong Areas')
  const nextStepsText = findLine('Next Steps') || findLine('Next steps')

  const parseArray = (value: string) =>
    value
      .split(/[;,\\n]/)
      .map((item) => item.trim())
      .filter(Boolean)

  return {
    subject,
    concept,
    masteryLevel,
    overviewGist,
    deepDiveGist: [],
    strongAreas: parseArray(strongAreasText),
    weakAreas: parseArray(weakAreasText),
    nextSteps: parseArray(nextStepsText),
    notes: assistantText.trim()
  }
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastDetected, setLastDetected] = useState<DetectResult>({ subject: '', concept: '' })
  const [lastAssistantId, setLastAssistantId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const canSave = useMemo(() => {
    return lastDetected.subject !== '' && lastDetected.concept !== '' && lastAssistantId !== null
  }, [lastDetected, lastAssistantId])

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    const userMessage = input.trim()
    if (!userMessage) return

    const userMessageId = `user-${Date.now()}`
    setMessages((current) => [
      ...current,
      { id: userMessageId, role: 'user', content: userMessage }
    ])
    setInput('')
    setIsSending(true)

    try {
      const detectRes = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage })
      })

      if (!detectRes.ok) {
        throw new Error('Failed to detect concept')
      }

      const detectJson = await detectRes.json()
      const subject = typeof detectJson.subject === 'string' ? detectJson.subject : ''
      const concept = typeof detectJson.concept === 'string' ? detectJson.concept : ''
      setLastDetected({ subject, concept })

      const assistantId = `assistant-${Date.now()}`
      setLastAssistantId(assistantId)
      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: 'assistant',
          content: subject || concept ? `Thinking about ${subject || 'a subject'} / ${concept || 'a concept'}...` : 'Thinking...'
        }
      ])

      scrollToBottom()

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, subject, concept })
      })

      if (!chatRes.ok || !chatRes.body) {
        throw new Error('Chat request failed')
      }

      const reader = chatRes.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let assistantText = ''

      while (!done) {
        const { value, done: streamDone } = await reader.read()
        done = streamDone
        if (value) {
          assistantText += decoder.decode(value, { stream: true })
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content: assistantText } : message
            )
          )
          scrollToBottom()
        }
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, content: assistantText } : message
        )
      )

      setLastDetected({ subject, concept })
    } catch (error) {
      console.error(error)
      setErrorMessage('Something went wrong. Try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveProgress = async () => {
    if (!canSave || !lastAssistantId) return

    setMessages((current) =>
      current.map((message) =>
        message.id === lastAssistantId ? { ...message, saveState: 'saving' } : message
      )
    )

    const assistantMessage = messages.find((message) => message.id === lastAssistantId)
    if (!assistantMessage) return

    const payload = getSavePayload(assistantMessage.content, lastDetected.subject, lastDetected.concept)

    try {
      const saveRes = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!saveRes.ok) {
        throw new Error('Save failed')
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === lastAssistantId ? { ...message, saveState: 'saved' } : message
        )
      )
    } catch (error) {
      console.error(error)
      setMessages((current) =>
        current.map((message) =>
          message.id === lastAssistantId ? { ...message, saveState: 'error' } : message
        )
      )
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Study Assistant</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Ask anything for concept guidance</h1>
            </div>
            <div className="rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
              No auth. Single user. Streaming replies.
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/90 shadow-xl shadow-slate-950/40">
          <div ref={listRef} className="flex h-[calc(100vh-260px)] flex-col gap-4 overflow-y-auto p-6 sm:h-[calc(100vh-260px)]">
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={
                  `max-w-[90%] rounded-3xl p-4 shadow-xl ${
                    message.role === 'user'
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'bg-slate-900 text-slate-200 border border-slate-700'
                  }`
                }>
                  <div className="text-sm leading-7 whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && message.saveState === 'saved' ? (
                    <div className="mt-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                      Progress saved
                    </div>
                  ) : null}
                  {message.role === 'assistant' && message.saveState === 'error' ? (
                    <div className="mt-3 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      Save failed — try again
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 bg-slate-950/95 px-6 py-5">
            {errorMessage ? (
              <div className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>
            ) : null}

            {canSave ? (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                <div>
                  Detected concept: <span className="font-semibold text-slate-100">{lastDetected.subject}</span> /{' '}
                  <span className="font-semibold text-slate-100">{lastDetected.concept}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  disabled={isSending}
                  className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save progress
                </button>
              </div>
            ) : null}

            <form onSubmit={handleSend} className="flex flex-col gap-3 sm:flex-row">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your study question here..."
                className="w-full rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="inline-flex h-12 items-center justify-center rounded-3xl bg-sky-500 px-6 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
