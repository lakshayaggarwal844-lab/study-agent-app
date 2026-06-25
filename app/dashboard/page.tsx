import { createClient as createSupabaseClient } from '../../lib/supabase'
import DashboardClient from './DashboardClient'

type ConceptRow = {
  id?: number
  subject?: string
  concept?: string
  mastery_level?: string
  weak_areas?: string[] | null
  strong_areas?: string[] | null
  next_steps?: string[] | null
  last_updated?: string | null
}

const scoreMap: Record<string, number> = {
  Strong: 4,
  Proficient: 3,
  Developing: 2,
  Introduced: 1,
  'In Progress': 0
}

const computeScore = (level?: string) => scoreMap[level ?? ''] ?? 0

export default async function DashboardPage() {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from('concepts').select('*')

  const concepts = Array.isArray(data) ? (data as ConceptRow[]) : []

  const totalConcepts = concepts.length
  const uniqueSubjects = new Set(concepts.map((concept) => concept.subject ?? 'Unknown')).size
  const totalScore = concepts.reduce((sum, concept) => sum + computeScore(concept.mastery_level), 0)
  const averageMasteryPercent = totalConcepts > 0 ? Math.round((totalScore / (totalConcepts * 4)) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardClient
        concepts={concepts}
        totalConcepts={totalConcepts}
        uniqueSubjects={uniqueSubjects}
        averageMasteryPercent={averageMasteryPercent}
      />
    </div>
  )
}
