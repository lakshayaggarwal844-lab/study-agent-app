'use client'

import { useState } from 'react'

type ConceptRow = {
  id?: string
  subject?: string
  concept?: string
  mastery_level?: string
  weak_areas?: string[] | null
  strong_areas?: string[] | null
  next_steps?: string[] | null
  last_updated?: string | null
}

type DashboardClientProps = {
  concepts: ConceptRow[]
  totalConcepts: number
  uniqueSubjects: number
  averageMasteryPercent: number
}

const subjectClasses: Record<string, string> = {
  Physics: 'bg-sky-500/15 text-sky-200',
  Biology: 'bg-emerald-500/15 text-emerald-200',
  Mathematics: 'bg-violet-500/15 text-violet-200',
  'Computer Science': 'bg-orange-500/15 text-orange-200',
  Chemistry: 'bg-rose-500/15 text-rose-200'
}

const masteryClasses: Record<string, string> = {
  Strong: 'bg-slate-100 text-slate-950',
  Proficient: 'bg-slate-200/10 text-slate-100',
  Developing: 'bg-slate-200/10 text-slate-100',
  Introduced: 'bg-slate-200/10 text-slate-100',
  'In Progress': 'bg-slate-200/10 text-slate-100'
}

const scoreMap: Record<string, number> = {
  Strong: 4,
  Proficient: 3,
  Developing: 2,
  Introduced: 1,
  'In Progress': 0
}

const getSubjectClasses = (subject?: string) => {
  if (!subject) return 'bg-slate-800 text-slate-200'
  return subjectClasses[subject] ?? 'bg-slate-800 text-slate-200'
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const computeScore = (level?: string) => scoreMap[level ?? ''] ?? 0

export default function DashboardClient({ concepts, totalConcepts, uniqueSubjects, averageMasteryPercent }: DashboardClientProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }))
  }

  const hasConcepts = concepts.length > 0

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-950/80 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Total concepts</p>
            <p className="mt-2 text-3xl font-semibold text-white">{totalConcepts}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Unique subjects</p>
            <p className="mt-2 text-3xl font-semibold text-white">{uniqueSubjects}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/80 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Average mastery</p>
            <p className="mt-2 text-3xl font-semibold text-white">{averageMasteryPercent}%</p>
          </div>
        </div>
      </div>

      {!hasConcepts ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/80 p-8 text-center text-slate-400">
          No concepts found yet. Start a study chat to save progress.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {concepts.map((concept) => {
            const id = concept.id ?? 'unknown'
            const subject = concept.subject ?? 'Unknown'
            const score = computeScore(concept.mastery_level)
            const progressWidth = `${Math.round((score / 4) * 100)}%`
            const isExpanded = expanded[id]

            return (
              <div
                key={id}
                className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/90 shadow-xl shadow-slate-950/30"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(id)}
                  className="w-full text-left"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getSubjectClasses(subject)}`}>
                        {subject}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${masteryClasses[concept.mastery_level ?? ''] ?? 'bg-slate-800 text-slate-200'}`}>
                        {concept.mastery_level ?? 'In Progress'}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-white">{concept.concept ?? 'Untitled concept'}</h2>
                    <div className="mt-4 space-y-3">
                      <div className="text-sm text-slate-400">Last updated {formatDate(concept.last_updated)}</div>
                      <div className="rounded-full bg-slate-800/80 px-2 py-2">
                        <div className="h-2 rounded-full bg-slate-800">
                          <div className="h-2 rounded-full bg-sky-500" style={{ width: progressWidth }} />
                        </div>
                      </div>
                      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Progress {progressWidth}</div>
                    </div>
                  </div>
                </button>

                {isExpanded ? (
                  <div className="rounded-b-[32px] border-t border-slate-800 bg-slate-950/90 p-6 text-sm text-slate-300">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Strong areas</p>
                        <div className="flex flex-wrap gap-2">
                          {(concept.strong_areas && concept.strong_areas.length > 0
                            ? concept.strong_areas
                            : ['None']
                          ).map((item, index) => (
                            <span key={index} className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Weak areas</p>
                        <div className="flex flex-wrap gap-2">
                          {(concept.weak_areas && concept.weak_areas.length > 0
                            ? concept.weak_areas
                            : ['None']
                          ).map((item, index) => (
                            <span key={index} className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-500">Next steps</p>
                        <div className="flex flex-wrap gap-2">
                          {(concept.next_steps && concept.next_steps.length > 0
                            ? concept.next_steps
                            : ['None']
                          ).map((item, index) => (
                            <span key={index} className="rounded-full bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
